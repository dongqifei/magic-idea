import { IEvent } from "../common";
import { QuickInputService } from '../quick-input';
import { IStatusBarService } from '../statusbar';
import { NotificationService } from "../notification";
import { MagicApiConstantsService } from "./magic-api-constants-service";
import { MagicApiSocketService } from "./magic-api-socket-service";
import { ResourceData } from './magic-api-types';
import { MagicApiProjectService, MagicApiProjectData } from './magic-api-project-service';
import { MagicApiOnlineUserService } from "./magic-api-online-user-service";
import { MagicApiClientService } from "./magic-api-client-service";
import { LoginFormResult } from "./dialogs/magic-api-login-dialog";
/**
 * 服务器状态 - 类似 VS Code 的简洁状态设计
 */
export declare enum MagicApiServerState {
    /** 初始状态：未加载任何项目（类似 VS Code 未打开文件夹） */
    Idle = "idle",
    /** 就绪：已加载项目，但未连接（类似 VS Code 打开了文件夹但未编译） */
    Ready = "ready",
    /** 加载中：正在加载项目或连接服务器 */
    Loading = "loading",
    /** 已连接：项目已加载且服务器已连接（类似 VS Code 打开文件夹并运行） */
    Connected = "connected",
    /** 错误：加载或连接失败 */
    Error = "error"
}
/**
 * 状态信息
 */
export interface MagicApiServerStatus {
    state: MagicApiServerState;
    project?: MagicApiProjectData;
    error?: Error;
    message?: string;
}
/**
 * Magic API 服务器接口服务
 * 负责管理与Magic API服务器的连接、请求地址构建、连接状态事件分发
 */
export declare class MagicApiServerService {
    private statusBarService;
    private quickInputService;
    private readonly client;
    private readonly constants;
    private readonly socketService;
    private readonly notificationService;
    private readonly projectService;
    private readonly onlineUserService;
    private logger;
    /** 状态变化事件 - 类似 VS Code 的 onDidChangeWorkspaceFolders */
    private readonly onDidChangeStatusEmitter;
    readonly onDidChangeStatus: IEvent<MagicApiServerStatus>;
    /** 项目变化事件 - 类似 VS Code 的 onDidChangeWorkspaceFolders */
    private readonly onDidChangeProjectEmitter;
    readonly onDidChangeProject: IEvent<MagicApiProjectData | undefined>;
    /** 连接成功事件 */
    private readonly onDidConnectEmitter;
    readonly onDidConnect: IEvent<ResourceData>;
    /** 连接断开事件 */
    private readonly onDidDisconnectEmitter;
    readonly onDidDisconnect: IEvent<void>;
    private debugItemUpdate?;
    private projectItemUpdate?;
    private onlineUsersUpdate?;
    private disposables;
    private currentStatus;
    private clientId;
    private currentProject;
    private isConnected;
    private isLoggedIn;
    private isInitialized;
    private autoReconnect;
    private reconnectAttempts;
    private maxReconnectAttempts;
    constructor(statusBarService: IStatusBarService, quickInputService: QuickInputService, client: MagicApiClientService, constants: MagicApiConstantsService, socketService: MagicApiSocketService, notificationService: NotificationService, projectService: MagicApiProjectService, onlineUserService: MagicApiOnlineUserService);
    protected init(): void;
    initServer(): Promise<void>;
    doCreateOrSwitchProject(): Promise<void>;
    openExampleProject(): Promise<void>;
    openRecentlyProject(isReload?: boolean): Promise<void>;
    createProject(): Promise<boolean>;
    settingProject(): Promise<void>;
    /**
     * 打开项目 - 类似 VS Code 的 openFolder
     * 由 UI 层调用
     */
    openProject(projectId: string, isInit?: boolean): Promise<boolean>;
    /**
     * 关闭项目 - 类似 VS Code 的 closeFolder
     */
    closeProject(): Promise<void>;
    /**
     * 连接服务器
     */
    connect(): Promise<boolean>;
    /**
     * 监听调试服务器事件
     */
    private listenDebugSocketEvent;
    /**
     * 断开连接(释放资源)
     */
    disconnect(): Promise<void>;
    /**
     * 准备登录
     * @returns
     */
    doLogin(): Promise<void>;
    /**
     * 登录
     */
    login(credentials: LoginFormResult): Promise<boolean>;
    /**
     * 登出
     */
    logout(): Promise<void>;
    /**
     * 刷新
     */
    refresh(): Promise<boolean>;
    /**
     * 获取当前状态
     */
    getStatus(): MagicApiServerStatus;
    /**
     * 获取当前项目 - 类似 VS Code 的 workspace.workspaceFolders
     */
    getCurrentProject(): MagicApiProjectData | undefined;
    /**
     * 是否有打开的项目 - 类似 VS Code 的 workspace.workspaceFolders?.length > 0
     */
    hasOpenProject(): boolean;
    /**
     * 是否已连接
     */
    isServerConnected(): boolean;
    /**
     * 是否已登录
     */
    isUserLoggedIn(): boolean;
    /**
     * 获取项目名称 - 类似 VS Code 的 workspace.name
     */
    getProjectName(): string | undefined;
    /**
     * 获取项目路径 - 类似 VS Code 的 workspace.uri
     */
    getProjectUrl(): string | undefined;
    /**
     * 获取项目是否启用代理
     */
    getProxyEnable(): boolean;
    /**
     * 获取客户端ID
     * @returns
     */
    getClientId(): string;
    /**
     * 获取客户端密钥
     * @returns
     */
    getClientSecret(): string;
    /**
     * 生成客户端ID
     */
    private generateClientId;
    /**
     * 设置当前项目
     */
    private setCurrentProject;
    /**
     * 检查登录状态
     */
    private checkLoginStatus;
    /**
     * 更新状态
     */
    private updateStatus;
}
