// *****************************************************************************
// Copyright (C) 2025 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { inject, injectable, named, postConstruct } from 'inversify';
import { PreferenceService } from '@MagicIdea/core';
import { DisposableCollection, URI } from '@MagicIdea/core';
import { getLogger } from '@MagicIdea/core/logger';
import { ChatModel } from './common/chat-model';
import { ChatSessionIndex, ChatSessionStore, ChatModelWithMetadata, ChatSessionMetadata } from './common/chat-session-store';
import {
    PERSISTED_SESSION_LIMIT_PREF,
    SESSION_STORAGE_PREF,
    SessionStorageScope
} from './common/ai-chat-preferences';
import { SerializedChatData, CHAT_DATA_VERSION } from './common/chat-model-serialization';

const INDEX_FILE = 'index.json';
const DB_NAME = 'MagicIdeaAIChatSessions';
const DB_VERSION = 1;
const STORE_NAME = 'chat-sessions';

@injectable()
export class ChatSessionStoreImpl implements ChatSessionStore {

    protected readonly logger = getLogger('ChatSessionStore');

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected storageRoot?: URI;
    protected storageInitialized = false;
    protected indexCache?: ChatSessionIndex;
    protected storePromise: Promise<void> = Promise.resolve();
    protected readonly toDispose = new DisposableCollection();
    protected db: IDBDatabase | null = null;

    @postConstruct()
    protected init(): void {
        this.toDispose.push(
            this.preferenceService.onDidPreferenceChanged(async event => {
                if (event.key === SESSION_STORAGE_PREF) {
                    this.logger.debug('Session storage preference changed: invalidating cache.', { preference: event.newValue });
                    this.invalidateStorageCache();
                }
            })
        );
        // 初始化IndexedDB
        this.initIndexedDB();
    }

    protected invalidateStorageCache(): void {
        this.storageRoot = undefined;
        this.storageInitialized = false;
        this.indexCache = undefined;
    }

    // ===================== IndexedDB 核心封装 =====================
    protected async initIndexedDB(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = (e) => {
                this.db = (e.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = () => {
                this.logger.error('IndexedDB initialization failed');
                reject(request.error);
            };
        });
    }

    protected async dbGet<T>(key: string): Promise<T | null> {
        await this.initIndexedDB();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject(request.error);
        });
    }

    protected async dbPut(key: string, value: any): Promise<void> {
        await this.initIndexedDB();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    protected async dbDelete(key: string): Promise<void> {
        await this.initIndexedDB();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    protected async dbClear(): Promise<void> {
        await this.initIndexedDB();
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    protected async dbExists(key: string): Promise<boolean> {
        const val = await this.dbGet(key);
        return val !== null && val !== undefined;
    }

    // ===================== 业务逻辑（已替换为IndexedDB） =====================
    async storeSessions(...sessions: Array<ChatModel | ChatModelWithMetadata>): Promise<void> {
        this.storePromise = this.storePromise.then(async () => {
            const root = await this.ensureStorageReady();
            if (!root) {
                this.logger.debug('Session persistence is disabled: skipping store.');
                return;
            }
            this.logger.debug('Starting to store sessions', { totalSessions: sessions.length });

            // Normalize to SessionWithTitle and filter empty sessions
            const nonEmptySessions = sessions
                .map(s => this.isChatModelWithMetadata(s) ? { ...s, saveDate: Date.now() } : { model: s, saveDate: Date.now() })
                .filter(s => !s.model.isEmpty());
            this.logger.debug('Filtered empty sessions', { nonEmptySessions: nonEmptySessions.length });

            // Write each session to IndexedDB
            for (const session of nonEmptySessions) {
                const sessionKey = `${session.model.id}.json`;
                const modelData = session.model.toSerializable();
                // Wrap model data with persistence metadata
                const data: SerializedChatData = {
                    version: CHAT_DATA_VERSION,
                    title: session.title,
                    pinnedAgentId: session.pinnedAgentId,
                    saveDate: session.saveDate,
                    model: modelData
                };
                this.logger.debug('Writing session to IndexedDB', {
                    sessionId: session.model.id,
                    title: data.title,
                    requestCount: modelData.requests.length,
                    responseCount: modelData.responses.length,
                    pinnedAgentId: data.pinnedAgentId,
                    version: data.version
                });
                
                await this.dbPut(sessionKey, data);
            }

            // Update index with metadata
            await this.updateIndex(nonEmptySessions);

            // Trim to max sessions
            await this.trimSessions();
            this.logger.debug('Finished storing sessions');
        });
        return this.storePromise;
    }

    private isChatModelWithMetadata(session: ChatModel | ChatModelWithMetadata): session is ChatModelWithMetadata {
        return 'model' in session;
    }

    async readSession(sessionId: string): Promise<SerializedChatData | undefined> {
        const root = await this.ensureStorageReady();
        if (!root) {
            this.logger.debug('Session persistence is disabled: cannot read session.', { sessionId });
            return undefined;
        }
        const sessionKey = `${sessionId}.json`;
        this.logger.debug('Reading session from IndexedDB', { sessionId });

        try {
            const content = await this.dbGet<SerializedChatData>(sessionKey);
            if (!content) return undefined;
            
            const data = this.migrateData(content);
            this.logger.debug('Successfully read session', {
                sessionId,
                requestCount: data.model.requests.length,
                responseCount: data.model.responses.length,
                version: data.version
            });
            return data;
        } catch (e) {
            this.logger.debug('Failed to read session', { sessionId, error: e });
            return undefined;
        }
    }

    async deleteSession(sessionId: string): Promise<void> {
        this.storePromise = this.storePromise.then(async () => {
            const root = await this.ensureStorageReady();
            if (!root) {
                this.logger.debug('Session persistence is disabled: skipping delete.', { sessionId });
                return;
            }
            const sessionKey = `${sessionId}.json`;
            this.logger.debug('Deleting session', { sessionId });

            try {
                await this.dbDelete(sessionKey);
                this.logger.debug('Session deleted from IndexedDB', { sessionId });
            } catch (e) {
                this.logger.debug('Failed to delete session (may not exist)', { sessionId, error: e });
            }

            // Update index
            const index = await this.loadIndex();
            delete index[sessionId];
            await this.saveIndex(index);
            this.logger.debug('Session removed from index', { sessionId });
        });
        return this.storePromise;
    }

    async clearAllSessions(): Promise<void> {
        this.storePromise = this.storePromise.then(async () => {
            const root = await this.ensureStorageReady();
            if (!root) {
                this.logger.debug('Session persistence is disabled: skipping clear.');
                return;
            }

            await this.dbClear();
            this.indexCache = {};
            await this.saveIndex({});
            this.logger.debug('All sessions cleared from IndexedDB');
        });
        return this.storePromise;
    }

    async getSessionIndex(): Promise<ChatSessionIndex> {
        const index = await this.loadIndex();
        this.logger.debug('Retrieved session index', { sessionCount: Object.keys(index).length });
        return index;
    }

    async setSessionTitle(sessionId: string, title: string): Promise<void> {
        this.storePromise = this.storePromise.then(async () => {
            const index = await this.loadIndex();
            if (index[sessionId]) {
                index[sessionId].title = title;
                await this.saveIndex(index);
            }
        });
        return this.storePromise;
    }

    protected async getStorageRoot(): Promise<URI | undefined> {
        if (this.storageRoot !== undefined) {
            return this.storageRoot;
        }

        const resolved = await this.resolveStorageRoot();
        if (!resolved) {
            return undefined;
        }

        this.storageRoot = resolved;
        return this.storageRoot;
    }

    protected async ensureStorageReady(): Promise<URI | undefined> {
        const root = await this.getStorageRoot();
        if (!root) {
            return undefined;
        }

        if (!this.storageInitialized) {
            await this.initializeStorage(root);
            this.storageInitialized = true;
        }

        return root;
    }

    protected async initializeStorage(root: URI): Promise<void> {
        // IndexedDB 无需创建文件夹，空实现
    }

    protected async getStorageScope(): Promise<SessionStorageScope> {
        await this.preferenceService.ready;
        return this.preferenceService.get<SessionStorageScope>(SESSION_STORAGE_PREF, 'workspace');
    }

    protected async getGlobalStorageRoot(): Promise<URI> {
        // 前端使用IndexedDB，无需文件路径，返回虚拟URI
        return new URI('indexeddb://chat-sessions/global');
    }

    protected async resolveStorageRoot(): Promise<URI | undefined> {
        const scope = await this.getStorageScope();

        if (scope === 'workspace') {
            try {
                this.logger.debug('Using workspace storage (IndexedDB)');
                return new URI('indexeddb://chat-sessions/workspace');
            } catch (error) {
                this.logger.error('Failed to use workspace storage, falling back to global', error);
                return this.getGlobalStorageRoot();
            }
        }

        const globalPath = await this.getGlobalStorageRoot();
        this.logger.debug('Using global storage (IndexedDB)', { path: globalPath.toString() });
        return globalPath;
    }

    protected async updateIndex(sessions: ((ChatModelWithMetadata & { saveDate: number })[])): Promise<void> {
        const index = await this.loadIndex();

        for (const session of sessions) {
            const data = session.model.toSerializable();
            const { model, ...metadata } = session;
            const previousData = index[model.id];
            index[model.id] = {
                ...previousData,
                sessionId: model.id,
                location: data.location,
                ...metadata
            };
        }

        await this.saveIndex(index);
    }

    protected getPersistedSessionLimit(): number {
        return this.preferenceService.get<number>(PERSISTED_SESSION_LIMIT_PREF, 25);
    }

    protected async trimSessions(): Promise<void> {
        const root = await this.ensureStorageReady();
        if (!root) {
            return;
        }

        const maxSessions = this.getPersistedSessionLimit();

        if (maxSessions === -1) {
            return;
        }

        const index = await this.loadIndex();
        const sessions = Object.values(index);

        if (maxSessions === 0) {
            this.logger.debug('Session persistence disabled, deleting all sessions', { sessionCount: sessions.length });
            for (const session of sessions) {
                const sessionKey = `${session.sessionId}.json`;
                try {
                    await this.dbDelete(sessionKey);
                } catch (e) {
                    this.logger.debug('Failed to delete session', { sessionId: session.sessionId, error: e });
                }
                delete index[session.sessionId];
            }
            await this.saveIndex(index);
            return;
        }

        if (sessions.length <= maxSessions) {
            return;
        }

        this.logger.debug('Trimming sessions', { currentCount: sessions.length, maxSessions });

        sessions.sort((a, b) => a.saveDate - b.saveDate);
        const sessionsToDelete = sessions.slice(0, sessions.length - maxSessions);
        this.logger.debug('Deleting oldest sessions', { deleteCount: sessionsToDelete.length, sessionIds: sessionsToDelete.map(s => s.sessionId) });

        for (const session of sessionsToDelete) {
            const sessionKey = `${session.sessionId}.json`;
            try {
                await this.dbDelete(sessionKey);
            } catch (e) {
                this.logger.debug('Failed to delete session', { sessionId: session.sessionId, error: e });
            }
            delete index[session.sessionId];
        }

        await this.saveIndex(index);
    }

    protected async loadIndex(): Promise<ChatSessionIndex> {
        if (this.indexCache) {
            return this.indexCache;
        }

        const root = await this.ensureStorageReady();
        if (!root) {
            this.indexCache = {};
            return this.indexCache;
        }

        try {
            const rawIndex = await this.dbGet<ChatSessionIndex>(INDEX_FILE);
            const validatedIndex: ChatSessionIndex = {};
            let hasInvalidEntries = false;

            if (rawIndex) {
                for (const [sessionId, metadata] of Object.entries(rawIndex)) {
                    if (this.isValidMetadata(metadata)) {
                        validatedIndex[sessionId] = metadata;
                    } else {
                        hasInvalidEntries = true;
                        this.logger.warn('Removing invalid session metadata from index', { sessionId, metadata });
                    }
                }
            }

            if (hasInvalidEntries) {
                this.logger.info('Index cleaned up, removing invalid entries');
                await this.dbPut(INDEX_FILE, validatedIndex);
            }

            this.indexCache = validatedIndex;
            return this.indexCache;
        } catch (e) {
            this.indexCache = {};
            return this.indexCache;
        }
    }

    protected isValidMetadata(metadata: unknown): metadata is ChatSessionMetadata {
        if (!metadata || typeof metadata !== 'object') {
            return false;
        }

        const m = metadata as Record<string, unknown>;

        return typeof m.sessionId === 'string' &&
            typeof m.title === 'string' &&
            typeof m.saveDate === 'number' &&
            typeof m.location === 'string' &&
            !isNaN(m.saveDate) &&
            m.saveDate > 0;
    }

    protected async saveIndex(index: ChatSessionIndex): Promise<void> {
        this.indexCache = index;
        const root = await this.ensureStorageReady();
        if (!root) {
            return;
        }
        await this.dbPut(INDEX_FILE, index);
    }

    protected migrateData(data: unknown): SerializedChatData {
        const parsed = data as SerializedChatData;

        if (parsed.version && parsed.version > CHAT_DATA_VERSION) {
            this.logger.warn(
                `Session data version ${parsed.version} is newer than supported ${CHAT_DATA_VERSION}. ` +
                'Data may not load correctly.'
            );
        }

        return parsed;
    }

    async hasPersistedSessions(): Promise<boolean> {
        if (this.indexCache && Object.keys(this.indexCache).length > 0) {
            return true;
        }

        const storageRoot = await this.getStorageRoot();
        if (!storageRoot) {
            return false;
        }

        try {
            const exists = await this.dbExists(INDEX_FILE);
            if (!exists) {
                return false;
            }

            const index = await this.dbGet<ChatSessionIndex>(INDEX_FILE);
            return index ? Object.keys(index).length > 0 : false;
        } catch (e) {
            return false;
        }
    }

    protected async hasGlobalSessions(): Promise<boolean> {
        try {
            const index = await this.dbGet<ChatSessionIndex>(INDEX_FILE);
            return index ? Object.keys(index).length > 0 : false;
        } catch (e) {
            return false;
        }
    }

    dispose(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        this.toDispose.dispose();
    }
}