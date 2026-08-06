/********************************************************************************
 * Copyright (C) 2022 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
 ********************************************************************************/
import { CookieJar } from 'tough-cookie';
import { request as undiciFetch, Dispatcher } from 'undici';
import { getProxyAgent } from './proxy';
import { CancellationToken } from '../common';
import { getLogger } from '../logger';
import { HttpHeaders as Headers, RequestConfiguration, RequestContext, RequestOptions, RequestService, MultipartPayload } from './common-request-service';

export interface NodeRequestOptions extends RequestOptions {
    strictSSL?: boolean;
    dispatcher?: Dispatcher;
}

export class NodeRequestService implements RequestService {
    protected proxyUrl?: string;
    protected strictSSL?: boolean;
    protected authorization?: string;

    protected logger = getLogger(NodeRequestService.name);

    // 按会话ID隔离cookie
    protected readonly sessionCookieMap = new Map<string, CookieJar>();

    private getSessionJar(sessionId?: string): CookieJar | undefined {
        if (!sessionId) return undefined;
        if (!this.sessionCookieMap.has(sessionId)) {
            this.sessionCookieMap.set(sessionId, new CookieJar());
        }
        return this.sessionCookieMap.get(sessionId);
    }

    protected async getProxyUrl(url: string): Promise<string | undefined> {
        return this.proxyUrl;
    }

    async configure(config: RequestConfiguration): Promise<void> {
        if (config.proxyUrl !== undefined) {
            this.proxyUrl = config.proxyUrl;
        }
        if (config.strictSSL !== undefined) {
            this.strictSSL = config.strictSSL;
        }
        if (config.proxyAuthorization !== undefined) {
            this.authorization = config.proxyAuthorization;
        }
    }

    protected async processOptions(options: NodeRequestOptions): Promise<NodeRequestOptions> {
        const { strictSSL } = this;
        options.strictSSL = options.strictSSL ?? strictSSL;
        if (!options.dispatcher) {
             try {
                const proxyUrl = await this.getProxyUrl(options.url);
                const dispatcher = getProxyAgent(options.url || '', process.env, {
                    proxyUrl: proxyUrl,
                    strictSSL: options.strictSSL
                });
                if (dispatcher && typeof dispatcher.dispatch === 'function') {
                    options.dispatcher = dispatcher;
                }
            } catch (error) {
                this.logger.error('Failed to create proxy agent:', error);
            }
        }
        return options;
    }

    // 修复：安全转换 Uint8Array<ArrayBufferLike> 为纯净 Blob 可用二进制
    private safeUint8ArrayToBlob( u8: Uint8Array<ArrayBufferLike>, type: string, filename: string ): Blob {
        // 强制拷贝为纯 ArrayBuffer，剥离 SharedArrayBuffer 类型污染，彻底解决TS类型报错
        const pureBuf = new ArrayBuffer(u8.byteLength);
        new Uint8Array(pureBuf).set(u8);
        return new Blob([pureBuf], { type });
    }

    async request(options: NodeRequestOptions, token?: CancellationToken): Promise<RequestContext> {
        const startTime = Date.now();
        options = await this.processOptions(options);
        const headers: Record<string, string> = { ...(options.headers || {}) };
        // 根据sessionId自动获取cookieJar 对象
        const cookieJar = this.getSessionJar(options.sessionId);

        // ========= Cookie 处理==========
        if (cookieJar) {
            // 请求之前，从Jar读取Cookie，填充到headers
            const cookieString = await cookieJar.getCookieString(options.url!);
            if (cookieString) {
                headers['Cookie'] = cookieString;
            }
        }
        
        if (options.user && options.password) {
            headers['Authorization'] = 'Basic ' + Buffer.from(options.user + ':' + options.password).toString('base64');
        }

        const signals: AbortSignal[] = [];
        if (options.timeout) {
            signals.push(AbortSignal.timeout(options.timeout));
        }

        let tokenAbortController: AbortController | undefined;
        let cancellationListener: void | { dispose(): void } | undefined;
        if (token) {
            tokenAbortController = new AbortController();
            signals.push(tokenAbortController.signal);
            cancellationListener = token.onCancellationRequested(() => {
                tokenAbortController!.abort();
            });
        }

        const signal = signals.length > 0
            ? (signals.length === 1 ? signals[0] : AbortSignal.any(signals))
            : undefined;

        const method = (options.type || 'GET').toUpperCase();
        let body: any = undefined;
        if (options.data && !['GET','HEAD'].includes(method)) {
            const encodeFlag = headers['x-request-encoding'] || headers['X-Request-Encoding'];
            if (encodeFlag === 'multipart-form-data') {
                const payload = options.data as unknown as MultipartPayload;
                const fd = new FormData();
                Object.entries(payload.fields).forEach(([k, v]) => fd.append(k, v));
                Object.entries(payload.files).forEach(([k, file]) => {
                    const blob = this.safeUint8ArrayToBlob(file.data, file.type, file.filename);
                    fd.append(k, blob, file.filename);
                });
                body = fd;
                delete headers['X-Request-Encoding'];
                delete headers['x-request-encoding'];
            } else {
                body = options.data;
            }
        }

        try {
            // 使用undici库自带request，共用一套模块实例
            const response = await undiciFetch(options.url!, {
                method,
                headers,
                dispatcher: options.dispatcher as Dispatcher,
                body,
                signal,
            });
             const arrayBuffer = await response.body.arrayBuffer();
            
            const buffer = Buffer.from(arrayBuffer);

            const responseHeaders: Headers = {};
            const rawHeaders = response.headers;
            for (const [key, value] of Object.entries(rawHeaders)) {
                if (typeof value === 'string') {
                    responseHeaders[key] = value;
                } else if (Array.isArray(value)) {
                    responseHeaders[key] = value.join(', ');
                }
            }

            // ========= 响应Set-Cookie存入CookieJar =========
            if (cookieJar && rawHeaders['set-cookie']) {
                const setCookieValues = Array.isArray(rawHeaders['set-cookie'])
                    ? rawHeaders['set-cookie']
                    : [rawHeaders['set-cookie']];
                for (const setCookieStr of setCookieValues) {
                    await cookieJar.setCookie(setCookieStr, options.url!);
                }
            }

            const data = {
                url: options.url,
                res: {
                    headers: responseHeaders,
                    statusCode: response.statusCode,
                    duration: Date.now() - startTime
                },
                buffer
            };
            return data;
        } catch(ex){
            this.logger.error("Node request failed: ", ex);
            throw ex;
        } finally {
            if (cancellationListener) {
                cancellationListener.dispose();
            }
        }
    }

    async resolveProxy(url: string): Promise<string | undefined> {
        return undefined;
    }
}
