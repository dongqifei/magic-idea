import { CancellationToken } from "../common";

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : undefined;

export interface HttpHeaders {
  [header: string]: string;
}

export type ResponseType =
    | 'arraybuffer'
    | 'blob'
    | 'document'
    | 'json'
    | 'text';

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
  type?: string; // 请求方法：GET/POST/PUT/DELETE 等
  url: string; // 相对路径（基于baseURL）或完整URL
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
  buffer: Uint8Array | string ;
}

export namespace RequestContext {
    export function isSuccess(context: RequestContext): boolean {
        return (context.res.statusCode && context.res.statusCode >= 200 && context.res.statusCode < 300) || context.res.statusCode === 1223;
    }

    function hasNoContent(context: RequestContext): boolean {
        return context.res.statusCode === 204;
    }

    export function getContentType(context: RequestContext): string | undefined {
        return context.res.headers['content-type'] || context.res.headers['Content-Type'];
    }

    export function asText(context: RequestContext, validateStatus?: boolean): string {
        if (!isSuccess(context) && validateStatus) {
            throw new Error(`Server returned code ${context.res.statusCode}.`);
        }
        if (hasNoContent(context)) {
            return '';
        }
        // Ensures that the buffer is an Uint8Array
        context = decompress(context);
        if (textDecoder) {
            return textDecoder.decode(context.buffer as Uint8Array);
        } else {
            return context.buffer.toString();
        }
    }

    export function asJson<T = {}>(context: RequestContext, validateStatus?: boolean): T {
        const str = asText(context, validateStatus);
        try {
            return JSON.parse(str);
        } catch (err) {
            err.message += ':\n' + str;
            throw err;
        }
    }

    export function asBlob(context: RequestContext): Blob {
        context = decompress(context);
        const buf = context.buffer as Uint8Array;
        const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
        return new Blob([arrayBuf], {type: getContentType(context)});
    }

    /**
     * Convert the buffer to base64 before sending it to the frontend.
     * This reduces the amount of JSON data transferred massively.
     * Does nothing if the buffer is already compressed.
     */
    export function compress(context: RequestContext): RequestContext {
        if (context.buffer instanceof Uint8Array && Buffer !== undefined) {
            context.buffer = Buffer.from(context.buffer).toString('base64');
        }
        return context;
    }

    /**
     * Decompresses a base64 buffer into a normal array buffer
     * Does nothing if the buffer is not compressed.
     */
    export function decompress(context: RequestContext): RequestContext {
        const buffer = context.buffer;
        if (typeof buffer === 'string' && typeof atob === 'function') {
            context.buffer = Uint8Array.from(atob(buffer), c => c.charCodeAt(0));
        }
        return context;
    }
}


export interface RequestConfiguration {
    proxyUrl?: string;
    proxyAuthorization?: string;
    strictSSL?: boolean;
}

export interface RequestService {
  configure(config: RequestConfiguration): Promise<void>;
  request(options: RequestOptions, token?: CancellationToken): Promise<RequestContext>;
  resolveProxy(url: string): Promise<string | undefined>
}

export const RequestService = Symbol("RequestService");
export const BackendRequestService = Symbol('BackendRequestService');
export const REQUEST_SERVICE_PATH = '/services/request-service';
