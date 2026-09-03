import { WebSocket } from './web-socket-channel';
export declare class SocketWriteBuffer {
    private static readonly DEFAULT_DISCONNECTED_BUFFER_SIZE;
    protected disconnectedBuffer: Uint8Array | undefined;
    protected bufferWritePosition: number;
    protected get maxBufferSize(): number;
    buffer(data: Uint8Array): void;
    protected ensureWriteBuffer(byteLength: number): void;
    flush(socket: WebSocket): void;
    drain(): void;
}
