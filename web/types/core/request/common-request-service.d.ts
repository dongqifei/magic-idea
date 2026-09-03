import { CancellationToken } from "../common";
export interface HttpHeaders {
    [header: string]: string;
}
export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
/**
 * 为解决 RPC 无法传输 FormData/Blob 设计的中转结构
 * 仅内部协议，不对外暴露
 */
export interface MultipartPayload {
    fields: Record<string, string>;
    files: Record<string, {
        filename: string;
        type: string;
        data: Uint8Array;
    }>;
}
export interface RequestOptions {
    type?: string;
    url: string;
    user?: string;
    password?: string;
    headers?: HttpHeaders;
    timeout?: number;
    data?: any;
    params?: any;
    followRedirects?: number;
    responseType?: ResponseType;
    withCredentials?: boolean;
    validateStatus?: (status: number) => boolean;
    proxyAuthorization?: string;
    sessionId?: string;
    baseURL?: string;
    proxyEnable?: boolean;
}
export interface RequestContext {
    url: string;
    res: {
        headers: HttpHeaders;
        statusCode?: number;
        duration?: number;
    };
    buffer: Uint8Array | string;
}
export declare namespace RequestContext {
    function isSuccess(context: RequestContext): boolean;
    function getContentType(context: RequestContext): string | undefined;
    function asText(context: RequestContext, validateStatus?: boolean): string;
    function asJson<T = {}>(context: RequestContext, validateStatus?: boolean): T;
    function asBlob(context: RequestContext): Blob;
    /**
     * Convert the buffer to base64 before sending it to the frontend.
     * This reduces the amount of JSON data transferred massively.
     * Does nothing if the buffer is already compressed.
     */
    function compress(context: RequestContext): RequestContext;
    /**
     * Decompresses a base64 buffer into a normal array buffer
     * Does nothing if the buffer is not compressed.
     */
    function decompress(context: RequestContext): RequestContext;
}
export interface RequestConfiguration {
    proxyUrl?: string;
    proxyAuthorization?: string;
    strictSSL?: boolean;
}
export interface RequestService {
    configure(config: RequestConfiguration): Promise<void>;
    request(options: RequestOptions, token?: CancellationToken): Promise<RequestContext>;
    resolveProxy(url: string): Promise<string | undefined>;
}
export declare const RequestService: unique symbol;
export declare const BackendRequestService: unique symbol;
export declare const REQUEST_SERVICE_PATH = "/services/request-service";
