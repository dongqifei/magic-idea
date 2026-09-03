import { IEvent as Event } from "../common";
import { MagicApiOnlineUserInfo } from './magic-api-types';
export declare class MagicApiOnlineUserService {
    private socketService;
    private readonly notificationService;
    private onlineUsers;
    private fileUserMap;
    private userFileMap;
    private readonly onlineUsersEmitter;
    private readonly fileUsersEmitter;
    readonly onOnlineUsersChange: Event<MagicApiOnlineUserInfo[]>;
    readonly onFileUsersChange: Event<{
        fileId: string;
        users: MagicApiOnlineUserInfo[];
    }>;
    init(): void;
    /**
     * 处理WebSocket消息
     */
    private handleSocketMessage;
    /**
     * 处理在线用户列表
     */
    private handleOnlineUsers;
    /**
     * 处理用户登录
     */
    private handleUserLogin;
    /**
     * 处理用户登出
     */
    private handleUserLogout;
    /**
     * 处理用户切换文件
     */
    private handleIntoFileId;
    /**
     * 重新构建所有映射关系
     */
    private rebuildMaps;
    /**
     * 将用户添加到文件
     */
    private addUserToFile;
    /**
     * 从文件中移除用户
     */
    private removeUserFromFile;
    /**
     * 获取所有在线用户
     */
    getAllOnlineUsers(): MagicApiOnlineUserInfo[];
    /**
     * 获取指定文件的在线用户
     */
    getUsersByFileId(fileId: string): MagicApiOnlineUserInfo[];
    /**
     * 获取指定用户的文件ID
     */
    getFileIdByUser(cid: string): string | undefined;
    /**
     * 获取指定用户的在线信息
     */
    getUserByCid(cid: string): MagicApiOnlineUserInfo | undefined;
    /**
     * 获取有用户在线的文件ID列表
     */
    getActiveFileIds(): string[];
    /**
     * 检查文件是否有用户在线
     */
    isFileActive(fileId: string): boolean;
    /**
     * 检查用户是否在线
     */
    isUserOnline(cid: string): boolean;
    /**
     * 获取在线用户数量
     */
    getOnlineUserCount(): number;
    /**
     * 获取指定文件的在线用户数量
     */
    getOnlineUserCountByFile(fileId: string): number;
    /**
     * 清理所有数据
     */
    dispose(): void;
}
