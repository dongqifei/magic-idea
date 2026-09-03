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

import { inject, injectable, postConstruct } from 'inversify';
import { CancellationToken } from "../common";
import { BackendRequestService, RequestConfiguration, RequestContext, RequestOptions, RequestService, MultipartPayload } from './common-request-service';
import { PreferenceService } from '../preferences';

@injectable()
export abstract class AbstractBrowserRequestService implements RequestService {

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected configurePromise: Promise<void> = Promise.resolve();

    @postConstruct()
    protected init(): void {
        this.configurePromise = this.preferenceService.ready.then(() => {
            const proxyUrl = this.preferenceService.get<string>('http.proxy');
            const proxyAuthorization = this.preferenceService.get<string>('http.proxyAuthorization');
            const strictSSL = this.preferenceService.get<boolean>('http.proxyStrictSSL', false);
            return this.configure({
                proxyUrl,
                proxyAuthorization,
                strictSSL
            });
        });
        this.preferenceService.onDidPreferenceChanged(e => {
            this.configurePromise.then(() => this.configure({
                proxyUrl: this.preferenceService.get<string>('http.proxy'),
                proxyAuthorization: this.preferenceService.get<string>('http.proxyAuthorization'),
                strictSSL: this.preferenceService.get<boolean>('http.proxyStrictSSL')
            }));
        });
    }

    abstract configure(config: RequestConfiguration): Promise<void>;
    abstract request(options: RequestOptions, token?: CancellationToken): Promise<RequestContext>;
    abstract resolveProxy(url: string): Promise<string | undefined>;

}

@injectable()
export class ProxyingBrowserRequestService extends AbstractBrowserRequestService {

    @inject(BackendRequestService)
    protected readonly backendRequestService: RequestService;

    configure(config: RequestConfiguration): Promise<void> {
        return this.backendRequestService.configure(config);
    }

    resolveProxy(url: string): Promise<string | undefined> {
        return this.backendRequestService.resolveProxy(url);
    }

    async request(options: RequestOptions): Promise<RequestContext> {
        // Wait for both the preferences and the configuration of the backend service
        await this.configurePromise;
        const backendResult = await this.backendRequestService.request(options);
        return RequestContext.decompress(backendResult);
    }
}

@injectable()
export class XHRBrowserRequestService extends ProxyingBrowserRequestService {

    protected authorization?: string;

    override configure(config: RequestConfiguration): Promise<void> {
        if (config.proxyAuthorization !== undefined) {
            this.authorization = config.proxyAuthorization;
        }
        return super.configure(config);
    }

    override async request(options: RequestOptions, token?: CancellationToken): Promise<RequestContext> {
        const serverUrl = options.baseURL;//this.preferenceService.get<string>(SERVER_URL_PREF, DEFAULT_SERVER_URL);
        const proxyEnablePreference = options.proxyEnable || false; // this.preferenceService.get<boolean>(PROXY_ENABLE_PREF, false);
         // 构建完整的 URL
        let fullUrl = serverUrl + options.url;
        // 处理 params（用于 GET/DELETE 等请求的查询参数）
        if (options.params && Object.keys(options.params).length > 0) {
            const urlObj = new URL(fullUrl);
            const params = new URLSearchParams(urlObj.search);
            
            // 将 params 对象添加到 URLSearchParams
            Object.entries(options.params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, String(v)));
                    } else {
                        params.append(key, String(value));
                    }
                }
            });
            
            urlObj.search = params.toString();
            fullUrl = urlObj.toString();
        }

        // 先拷贝 headers
        const headers = {
            ...options.headers,
        };
        let sendData = options.data; // 默认使用 data（用于 POST/PUT 等）
        
        // 判断是否为 GET/HEAD/DELETE 等通常不携带请求体的方法
        const method = options.type?.toLocaleUpperCase() || 'GET';
        const isBodyAllowed = !['GET', 'HEAD', 'DELETE'].includes(method);

        if (isBodyAllowed && sendData != null) {
            const contentType = options.headers && (options.headers['Content-Type'] || options.headers['content-type'] || '').toLowerCase();
            if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
                sendData = new URLSearchParams(sendData).toString();
            } else if (contentType && contentType.includes('application/json') && typeof sendData !== 'string') {
                sendData = JSON.stringify(sendData);
            } else if (contentType && contentType.includes('multipart/form-data')) {
                delete headers['Content-Type'];
                delete headers['content-type'];
                // 启用node代理时，multipart上传文件时，需要将文件数据转换成二进制数据
                if (proxyEnablePreference) {
                    // 自定义内部标记头，后端识别
                    headers['X-Request-Encoding'] = 'multipart-form-data';
                    const payload: MultipartPayload = { fields: {}, files: {} };
                    // ========== 兼容上层传来 普通对象 / 原生 FormData 两种情况 ==========
                    if (sendData instanceof FormData) {
                        // 上层手动 new FormData() 的场景（你当前的情况）
                        for (const [k, v] of sendData.entries()) {
                            if (v instanceof Blob) {
                                const arrBuf = await v.arrayBuffer();
                                payload.files[k] = {
                                    filename: (v as File).name || 'file',
                                    type: v.type,
                                    data: new Uint8Array(arrBuf)
                                };
                            } else {
                                payload.fields[k] = String(v);
                            }
                        }
                    } else {
                        // 上层传普通对象的场景
                        for (const [k, v] of Object.entries(sendData)) {
                            if (v instanceof Blob) {
                                const arrBuf = await v.arrayBuffer();
                                payload.files[k] = {
                                    filename: (v as File).name || 'file',
                                    type: v.type,
                                    data: new Uint8Array(arrBuf)
                                };
                            } else {
                                payload.fields[k] = String(v);
                            }
                        }
                    }
                    sendData = payload;
                }
            }
        } else {
            // GET/HEAD/DELETE 请求不发送 body
            sendData = undefined;
        }

        // 构建最终的请求选项
        const requestOptions: RequestOptions = {
            ...options,
            url: fullUrl,
            headers: headers,
            data: sendData
        };
        try {
            if(proxyEnablePreference){
                return super.request(requestOptions);
            }
            const xhrResult = await this.xhrRequest(requestOptions, token);
            // const statusCode = xhrResult.res.statusCode ?? 200;
            // if (statusCode >= 400) {
            //     // We might've been blocked by the firewall
            //     // Try it through the backend request service
            //     return super.request(requestOptions);
            // }
            return xhrResult;
        } catch (error) {
            console.error('XHR request failed, falling back to backend service:', error);
            // return super.request(requestOptions);
            throw error;
        }
    }

    protected xhrRequest(options: RequestOptions, token?: CancellationToken): Promise<RequestContext> {
        const authorization = this.authorization || options.proxyAuthorization;
        if (authorization) {
            options.headers = {
                ...(options.headers || {}),
                'Proxy-Authorization': authorization
            };
        }

        const xhr = new XMLHttpRequest();
        const startTime = Date.now();
        return new Promise<RequestContext>((resolve, reject) => {

            xhr.open(options.type || 'GET', options.url || '', true, options.user, options.password);

            if (options.withCredentials === true) {
                xhr.withCredentials = true;
            }

            this.setRequestHeaders(xhr, options);

            // xhr.responseType = options.responseType || 'json';
            xhr.responseType = 'arraybuffer';
            xhr.onerror = () => {
                const statusText = xhr.statusText || 'Network error';
                reject(new Error(`XHR request failed: ${statusText}`));
            };
            xhr.onload = () => {
                resolve({
                    url: options.url,
                    res: {
                        statusCode: xhr.status,
                        headers: this.getResponseHeaders(xhr),
                        duration: Date.now() - startTime
                    },
                    buffer: new Uint8Array(xhr.response)
                });
            };
            xhr.ontimeout = e => reject(new Error(`XHR timeout: ${options.timeout}ms`));

            if (options.timeout) {
                xhr.timeout = options.timeout;
            }

            xhr.send(options.data);

            token?.onCancellationRequested(() => {
                xhr.abort();
                reject();
            });
        });
    }

    protected setRequestHeaders(xhr: XMLHttpRequest, options: RequestOptions): void {
        if (options.headers) {
            for (const k of Object.keys(options.headers)) {
                switch (k) {
                    case 'User-Agent':
                    case 'Accept-Encoding':
                    case 'Content-Length':
                        // unsafe headers
                        continue;
                }
                xhr.setRequestHeader(k, options.headers[k]);
            }
        }
    }

    protected getResponseHeaders(xhr: XMLHttpRequest): { [name: string]: string } {
        const headers: { [name: string]: string } = {};
        for (const line of xhr.getAllResponseHeaders().split(/\r\n|\n|\r/g)) {
            if (line) {
                const idx = line.indexOf(':');
                headers[line.substring(0, idx).trim().toLowerCase()] = line.substring(idx + 1).trim();
            }
        }
        return headers;
    }
}
