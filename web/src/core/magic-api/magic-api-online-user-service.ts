import { inject, injectable, postConstruct } from 'inversify';
import { Emitter, IEvent as Event } from "../common";
import { NotificationService } from "../notification";
import { MagicApiSocketService } from './magic-api-socket-service';
import { MagicApiOnlineUserInfo } from './magic-api-types';

@injectable()
export class MagicApiOnlineUserService { 
  
  @inject(MagicApiSocketService)
  private socketService: MagicApiSocketService;

  @inject(NotificationService) 
  private readonly notificationService: NotificationService;

  // 所有在线用户
  private onlineUsers: MagicApiOnlineUserInfo[] = [];

  // 文件ID -> 用户列表映射
  private fileUserMap: Map<string, MagicApiOnlineUserInfo[]> = new Map();

  // 用户ID -> 文件ID映射
  private userFileMap: Map<string, string> = new Map();

  // 事件发射器
  private readonly onlineUsersEmitter = new Emitter<MagicApiOnlineUserInfo[]>();
  private readonly fileUsersEmitter = new Emitter<{ fileId: string; users: MagicApiOnlineUserInfo[] }>();

  // 公共事件
  public readonly onOnlineUsersChange: Event<MagicApiOnlineUserInfo[]> = this.onlineUsersEmitter.event;
  public readonly onFileUsersChange: Event<{ fileId: string; users: MagicApiOnlineUserInfo[] }> = this.fileUsersEmitter.event;

  @postConstruct()
  public init() {
    this.socketService.onSocketMessage(msg => this.handleSocketMessage(msg));
  }

  /**
   * 处理WebSocket消息
   */
  private handleSocketMessage(msg: any) { 
    if (!msg || !msg.type) return;

    try {
      const { type, data } = msg;
      
      switch (type) {
        case 'online_users':
          this.handleOnlineUsers(data);
          break;
          
        case 'user_login':
          this.handleUserLogin(data);
          break;
          
        case 'user_logout':
          this.handleUserLogout(data);
          break;
          
        case 'into_file_id':
          this.handleIntoFileId(data);
          break;
          
        default:
          // console.warn('Unknown socket message type:', type);
      }
    } catch (error) {
      console.error('Error handling socket message:', error, msg);
    }
  }

  /**
   * 处理在线用户列表
   */
  private handleOnlineUsers(users: MagicApiOnlineUserInfo[]) {
    // 更新所有在线用户
    this.onlineUsers = users || [];
    
    // 重新构建映射关系
    this.rebuildMaps();
    
    // 触发事件
    this.onlineUsersEmitter.fire([...this.onlineUsers]);
  }

  /**
   * 处理用户登录
   */
  private handleUserLogin(user: MagicApiOnlineUserInfo) {
    // 检查是否已存在
    const existingIndex = this.onlineUsers.findIndex(u => u.cid === user.cid);
    
    if (existingIndex >= 0) {
      this.onlineUsers[existingIndex] = { ...this.onlineUsers[existingIndex], ...user };
    } else {
      this.onlineUsers.push(user);
      this.notificationService.info(`用户「${user.username}」已上线, IP: ${user.ip} `);
    }
    
    // 如果用户有文件ID，更新映射
    if (user.fileId && user.fileId !== '0') {
      this.addUserToFile(user.cid, user.fileId);
    }
    
    // 触发事件
    this.onlineUsersEmitter.fire([...this.onlineUsers]);
  }

  /**
   * 处理用户登出
   */
  private handleUserLogout(user: MagicApiOnlineUserInfo) {
    const cid = user.cid;
    
    // 从总列表中移除
    this.onlineUsers = this.onlineUsers.filter(u => u.cid !== cid);
    
    // 从文件映射中移除
    const fileId = this.userFileMap.get(cid);
    if (fileId) {
      this.removeUserFromFile(cid, fileId);
    }
    
    // 从用户文件映射中移除
    this.userFileMap.delete(cid);
    
    // 触发事件
    this.onlineUsersEmitter.fire([...this.onlineUsers]);

    // 通知用户下线信息
    this.notificationService.info(`用户「${user.username}」已下线, IP: ${user.ip} `);
  }

  /**
   * 处理用户切换文件
   */
  private handleIntoFileId(data: string) {
    const [cid, fileId] = data;
    if (!cid || !fileId) return;
    
    const oldFileId = this.userFileMap.get(cid);
    
    // 从旧文件中移除
    if (oldFileId) {
      this.removeUserFromFile(cid, oldFileId);
    }
    
    // 添加到新文件
    if (fileId !== '0') {
      this.addUserToFile(cid, fileId);
    }
  }

  /**
   * 重新构建所有映射关系
   */
  private rebuildMaps() {
    this.fileUserMap.clear();
    this.userFileMap.clear();
    
    this.onlineUsers.forEach(user => {
      if (user.fileId && user.fileId !== '0') {
        this.addUserToFile(user.cid, user.fileId);
      }
    });
  }

  /**
   * 将用户添加到文件
   */
  private addUserToFile(cid: string, fileId: string) {
    const user = this.onlineUsers.find(u => u.cid === cid);
    if (!user) return;
    
    // 获取文件现有用户
    const fileUsers = this.fileUserMap.get(fileId) || [];
    
    // 检查是否已存在
    if (!fileUsers.some(u => u.cid === cid)) {
      fileUsers.push(user);
      this.fileUserMap.set(fileId, fileUsers);
      this.userFileMap.set(cid, fileId);
      
      // 触发文件用户变化事件
      this.fileUsersEmitter.fire({
        fileId,
        users: [...fileUsers]
      });
    }
  }

  /**
   * 从文件中移除用户
   */
  private removeUserFromFile(cid: string, fileId: string) {
    const fileUsers = this.fileUserMap.get(fileId);
    if (!fileUsers) return;
    
    const newFileUsers = fileUsers.filter(u => u.cid !== cid);
    
    if (newFileUsers.length === 0) {
      this.fileUserMap.delete(fileId);
    } else {
      this.fileUserMap.set(fileId, newFileUsers);
    }
    
    this.userFileMap.delete(cid);
    
    // 触发文件用户变化事件
    this.fileUsersEmitter.fire({
      fileId,
      users: [...newFileUsers]
    });
  }

  /**
   * 获取所有在线用户
   */
  public getAllOnlineUsers(): MagicApiOnlineUserInfo[] {
    return [...this.onlineUsers];
  }

  /**
   * 获取指定文件的在线用户
   */
  public getUsersByFileId(fileId: string): MagicApiOnlineUserInfo[] {
    return this.fileUserMap.get(fileId) || [];
  }

  /**
   * 获取指定用户的文件ID
   */
  public getFileIdByUser(cid: string): string | undefined {
    return this.userFileMap.get(cid);
  }

  /**
   * 获取指定用户的在线信息
   */
  public getUserByCid(cid: string): MagicApiOnlineUserInfo | undefined {
    return this.onlineUsers.find(user => user.cid === cid);
  }

  /**
   * 获取有用户在线的文件ID列表
   */
  public getActiveFileIds(): string[] {
    return Array.from(this.fileUserMap.keys());
  }

  /**
   * 检查文件是否有用户在线
   */
  public isFileActive(fileId: string): boolean {
    return this.fileUserMap.has(fileId) && (this.fileUserMap.get(fileId)?.length || 0) > 0;
  }

  /**
   * 检查用户是否在线
   */
  public isUserOnline(cid: string): boolean {
    return this.onlineUsers.some(user => user.cid === cid);
  }

  /**
   * 获取在线用户数量
   */
  public getOnlineUserCount(): number {
    return this.onlineUsers.length;
  }

  /**
   * 获取指定文件的在线用户数量
   */
  public getOnlineUserCountByFile(fileId: string): number {
    return this.getUsersByFileId(fileId).length;
  }

  /**
   * 清理所有数据
   */
  public dispose() {
    this.onlineUsers = [];
    this.fileUserMap.clear();
    this.userFileMap.clear();
    
    this.onlineUsersEmitter.dispose();
    this.fileUsersEmitter.dispose();
  }
}