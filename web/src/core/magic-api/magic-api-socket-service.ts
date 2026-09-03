import { inject, injectable } from "inversify";
import ReconnectingWebSocket from "reconnecting-websocket";
import { IEvent, Emitter } from "../common"

interface SocketMessage {
  type: string;
  data: any;
}

@injectable()
export class MagicApiSocketService {

  private socket: ReconnectingWebSocket;
  
  private isConnectedDebugServer = false;

  private socketMessageEmitter = new Emitter<SocketMessage>();
  private socketOpenEmitter = new Emitter<void>();
  private socketCloseEmitter = new Emitter<void>();
  private socketErrorEmitter = new Emitter<any>();
  private socketReconnectEmitter = new Emitter<void>();

  public readonly onSocketMessage: IEvent<SocketMessage> = this.socketMessageEmitter.event;
  public readonly onSocketOpen: IEvent<void> = this.socketOpenEmitter.event;
  public readonly onSocketClose: IEvent<void> = this.socketCloseEmitter.event;
  public readonly onSocketError: IEvent<any> = this.socketErrorEmitter.event;
  /** 重连事件（扩展：可选，根据业务需求） */
  public readonly onConnectReconnect: IEvent<void> = this.socketReconnectEmitter.event;

  constructor(){
  }

  /**
   * 获取当前与Magic API调试服务器的连接状态
   * @returns 已连接返回true，否则返回false
   */
  public isDebugServerConnected(): boolean {
    return this.isConnectedDebugServer;
  }

  connect(socketUrl: string): void {
    if(!socketUrl){
      throw new Error("socketUrl is required");
    }
    if(!this.socket){
      this.socket = new ReconnectingWebSocket(socketUrl);
      this.setupEventHandlers();
    }
  }

  close(code?: number, reason?: string): void {
    if(this.socket){
      this.socket.close(code, reason);
    }
  }

  reconnect(code?: number, reason?: string): void {
    if(this.socket)
      this.socket.reconnect(code, reason);
  }

  sendMessage(msgType: string, content: any){
    if (content) {
      this.socket.send(`${msgType},${content}`);
    } else {
      this.socket.send(msgType);
    }
  }

  // ===================== 辅助方法：自动重连（可选，扩展功能） =====================
  /**
   * 尝试重连Magic API服务器（指数退避策略，避免频繁重连）
   * @param retryCount 已重试次数（默认0）
   */
  private async attemptReconnect(retryCount = 0): Promise<void> {
    // 最大重试次数（可配置化，从常量服务读取）
    const maxRetries = 5;
    if (retryCount >= maxRetries) {
      this.socketErrorEmitter.fire({
        error: new Error('Max reconnection attempts reached'),
        reason: 'Unable to reconnect after multiple attempts'
      });
      return;
    }

    // 指数退避延迟（1s, 2s, 4s...）
    const delay = Math.pow(2, retryCount) * 1000;
    setTimeout(async () => {
      try {
        await this.reconnect();
        this.socketReconnectEmitter.fire(); // 触发重连成功事件
        console.log(`Reconnected to Magic API server on retry ${retryCount + 1}`);
      } catch (error) {
        console.error(`Reconnection attempt ${retryCount + 1} failed:`, error);
        await this.attemptReconnect(retryCount + 1);
      }
    }, delay);
  }
  
  private setupEventHandlers(){
    this.socket.onmessage = (event) => {
      const payload = event.data;
      
      // 处理ping/pong心跳包
      if (payload === 'ping') {
        this.socket.send('pong');
        return;
      }

      // 第一步：分割消息类型和参数部分
      const firstCommaIndex = payload.indexOf(",");
      // 如果没有逗号，说明只有消息类型，无参数
      if (firstCommaIndex === -1) {
        this.socketMessageEmitter.fire({ type: payload, data: null });
        return;
      }

      const msgType = payload.substring(0, firstCommaIndex);
      const paramsStr = payload.substring(firstCommaIndex + 1);
      
      // 第二步：解析参数部分
      const args: any[] = [];
      let remainingStr = paramsStr;

      while (remainingStr.length > 0) {
        // 处理JSON对象/数组（支持嵌套）
        if (remainingStr.startsWith("{") || remainingStr.startsWith("[")) {
          const openChar = remainingStr[0];
          const closeChar = openChar === "{" ? "}" : "]";
          let balance = 1;
          let jsonEndIndex = -1;

          for (let i = 1; i < remainingStr.length; i++) {
            if (remainingStr[i] === openChar) balance++;
            else if (remainingStr[i] === closeChar) {
              balance--;
              if (balance === 0) {
                jsonEndIndex = i;
                break;
              }
            }
          }

          if (jsonEndIndex !== -1) {
            const jsonStr = remainingStr.substring(0, jsonEndIndex + 1);
            try {
              args.push(JSON.parse(jsonStr));
            } catch (e) {
              args.push(jsonStr);
            }
            // 跳过当前JSON和后续的逗号
            remainingStr = remainingStr.substring(jsonEndIndex + 1).trimStart();
            if (remainingStr.startsWith(",")) {
              remainingStr = remainingStr.substring(1).trimStart();
            }
          } else {
            args.push(remainingStr);
            remainingStr = "";
          }
        } else {
          // 处理普通字符串参数
          const commaIndex = remainingStr.indexOf(",");
          if (commaIndex === -1) {
            args.push(remainingStr);
            remainingStr = "";
          } else {
            args.push(remainingStr.substring(0, commaIndex));
            remainingStr = remainingStr.substring(commaIndex + 1).trimStart();
          }
        }
      }

      // 第三步：优化返回格式（核心调整）
      let finalData;
      if (args.length === 0) {
        finalData = null; // 无参数时返回null
      } else if (args.length === 1) {
        finalData = args[0]; // 单参数时直接返回值（非数组）
      } else {
        finalData = args; // 多参数时返回数组
      }

      // 触发消息事件
      this.socketMessageEmitter.fire({ type: msgType, data: finalData });
    };

    this.socket.onerror = (error) => { 
      this.isConnectedDebugServer = false;
      this.socketErrorEmitter.fire(error);
    };

    this.socket.onopen = () => {
      this.isConnectedDebugServer = true;
      this.socketOpenEmitter.fire();
    };

    this.socket.onclose = () => {
      this.isConnectedDebugServer = false;
      this.socketCloseEmitter.fire();
    };
  }
}