import { IEvent } from "../common";
interface SocketMessage {
    type: string;
    data: any;
}
export declare class MagicApiSocketService {
    private socket;
    private isConnectedDebugServer;
    private socketMessageEmitter;
    private socketOpenEmitter;
    private socketCloseEmitter;
    private socketErrorEmitter;
    private socketReconnectEmitter;
    readonly onSocketMessage: IEvent<SocketMessage>;
    readonly onSocketOpen: IEvent<void>;
    readonly onSocketClose: IEvent<void>;
    readonly onSocketError: IEvent<any>;
    /** 重连事件（扩展：可选，根据业务需求） */
    readonly onConnectReconnect: IEvent<void>;
    constructor();
    /**
     * 获取当前与Magic API调试服务器的连接状态
     * @returns 已连接返回true，否则返回false
     */
    isDebugServerConnected(): boolean;
    connect(socketUrl: string): void;
    close(code?: number, reason?: string): void;
    reconnect(code?: number, reason?: string): void;
    sendMessage(msgType: string, content: any): void;
    /**
     * 尝试重连Magic API服务器（指数退避策略，避免频繁重连）
     * @param retryCount 已重试次数（默认0）
     */
    private attemptReconnect;
    private setupEventHandlers;
}
export {};
