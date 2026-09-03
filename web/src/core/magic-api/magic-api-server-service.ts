import { inject, injectable, postConstruct } from "inversify";
import { UUID } from '@lumino/coreutils';
import { getLogger } from "../logger/logger-service";
import { CancellationTokenSource, IEvent, Emitter, DisposableCollection } from "../common";
import { animationFrame } from '../common/browser';
import { QuickInputService } from '../quick-input';
import { IStatusBarService } from '../statusbar';
import { NotificationService } from "../notification";
import { MagicApiConstantsService } from "./magic-api-constants-service";
import { MagicApiSocketService } from "./magic-api-socket-service";
import { MAGIC_API_SOURCE, MagicApiConfig, ResourceData } from './magic-api-types'
import { MagicApiProjectService, MagicApiProjectData } from './magic-api-project-service';
import {  MagicApiOnlineUserService } from "./magic-api-online-user-service";
import { MagicApiClientService } from "./magic-api-client-service";
import { MagicApiEditProjectDialog, EditProjectResult } from "./dialogs/magic-api-editor-project-dialog";
import { MagicApiLoginDialog, LoginFormResult } from "./dialogs/magic-api-login-dialog";
import { ConfirmDialog, Dialog } from '@MagicIdea/core/browser/dialogs';
import JavaClass from "./language/magic-script/editor/java-class";

/**
 * 服务器状态 - 类似 VS Code 的简洁状态设计
 */
export enum MagicApiServerState {
  /** 初始状态：未加载任何项目（类似 VS Code 未打开文件夹） */
  Idle = 'idle',
  /** 就绪：已加载项目，但未连接（类似 VS Code 打开了文件夹但未编译） */
  Ready = 'ready',
  /** 加载中：正在加载项目或连接服务器 */
  Loading = 'loading',
  /** 已连接：项目已加载且服务器已连接（类似 VS Code 打开文件夹并运行） */
  Connected = 'connected',
  /** 错误：加载或连接失败 */
  Error = 'error',
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
@injectable()
export class MagicApiServerService {

  private logger = getLogger("magic-api-serever");

   /** 状态变化事件 - 类似 VS Code 的 onDidChangeWorkspaceFolders */
  private readonly onDidChangeStatusEmitter = new Emitter<MagicApiServerStatus>();
  public readonly onDidChangeStatus: IEvent<MagicApiServerStatus> = this.onDidChangeStatusEmitter.event;

  /** 项目变化事件 - 类似 VS Code 的 onDidChangeWorkspaceFolders */
  private readonly onDidChangeProjectEmitter = new Emitter<MagicApiProjectData | undefined>();
  public readonly onDidChangeProject: IEvent<MagicApiProjectData | undefined> = this.onDidChangeProjectEmitter.event;

  /** 连接成功事件 */
  private readonly onDidConnectEmitter = new Emitter<ResourceData>();
  public readonly onDidConnect: IEvent<ResourceData> = this.onDidConnectEmitter.event;

  /** 连接断开事件 */
  private readonly onDidDisconnectEmitter = new Emitter<void>();
  public readonly onDidDisconnect: IEvent<void> = this.onDidDisconnectEmitter.event;

  // 当前 Magic API 的状态栏项
  private debugItemUpdate?: (opts: any) => void;
  // 当前项目管理的状态栏项
  private projectItemUpdate?: (opts: any) => void;
  // 当前在线用户人数状态栏项
  private onlineUsersUpdate?: (opts: any) => void;

  private disposables = new DisposableCollection();
  
  private currentStatus: MagicApiServerStatus = {
    state: MagicApiServerState.Idle,
  };

  private clientId: string = '';

  private currentProject: MagicApiProjectData | undefined;
  private isConnected = false;
  private isLoggedIn = false;
  private isInitialized = false;
  
  // 类似 VS Code 的 workspace 配置
  private autoReconnect = true;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 1;

  constructor(
    @inject(IStatusBarService) private statusBarService: IStatusBarService,
    @inject(QuickInputService) private quickInputService: QuickInputService,
    @inject(MagicApiClientService) private readonly client: MagicApiClientService,
    @inject(MagicApiConstantsService) private readonly constants: MagicApiConstantsService,
    @inject(MagicApiSocketService) private readonly socketService: MagicApiSocketService,
    @inject(NotificationService) private readonly notificationService: NotificationService,
    @inject(MagicApiProjectService) private readonly projectService: MagicApiProjectService,
    @inject(MagicApiOnlineUserService) private readonly onlineUserService: MagicApiOnlineUserService
  ) {
    // 订阅项目变化
    this.projectService.onDidChangeProject((project) => {
      if (project && this.currentProject?.id === project.id) {
        // 更新当前打开的项目属性
        this.currentProject = {
          ...this.currentProject,
          name: project.name,
          url: project.url,
          webPath: project.webPath,
          proxyEnable: project.proxyEnable,
          token: project.token,
        };
        this.projectItemUpdate?.({
          text: project.name,
        })
      }
    });
    // 订阅在线人数变化
    this.onlineUserService.onOnlineUsersChange( users =>{
      // 当前在线人数
      const onlineUsersSize = users?.length || 0;
      this.onlineUsersUpdate?.({
        text: onlineUsersSize+"",
        tooltip: `当前在线: ${onlineUsersSize}人`
      })
    })
  }

  @postConstruct()
  protected init() {
    // 初始化状态栏
    const debugStatusBarItem = this.statusBarService.registerItem('magic-api-server-status', {
      icon: "codicon codicon-circle-filled info",
      text: "空闲",
      tooltip: '空闲',
      align: 'left',
      type: 'text',
      visible: true,
      priority: 1000,
    });
    this.debugItemUpdate = debugStatusBarItem.update;

    // 初始化状态栏
    const projectStatusBarItem = this.statusBarService.registerItem('magic-api-project-status', {
      icon: "codicon codicon-git-branch",
      alignment: 'left',
      dot: false,
      priority: 999,
      tooltip: '创建或切换项目...',
      type: 'text',
      visible: false,
      onClick: () => {
        this.doCreateOrSwitchProject();
      }
    });
    this.projectItemUpdate = projectStatusBarItem.update;

    const onlineUsersBarItem = this.statusBarService.registerItem('magic-api.online-users.statusBar', {
      icon: "codicon codicon-organization",
      text: "0",
      alignment: 'left',
      dot: false,
      priority: 998,
      tooltip: '当前没有参与者。',
      type: 'text',
      visible: false
    })
    this.onlineUsersUpdate = onlineUsersBarItem.update;

    this.disposables.pushAll([
      () => debugStatusBarItem.dispose(), // 调试服务器状态栏项
      () => projectStatusBarItem.dispose(), // 项目状态栏项
      () => onlineUsersBarItem.dispose() // 在线人数状态栏
    ]);
  }

  // 初始化服务, 系统启动时自动调用
  async initServer(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 生成客户端ID
      this.generateClientId();
      // 1. 尝试加载最后打开的项目
      const project = await this.projectService.getLastOpenProject();
      if (project) {
        const isOpened = await this.openProject(project.id, true);
        if (isOpened) {
          this.isInitialized = true;
          return;
        } else {
          // 项目无效，从最近列表中移除
          await this.projectService.removeFromRecentlyOpened(project.id);
        }
      }

      // 2. 没有有效项目
      this.isInitialized = true;
      this.updateStatus(MagicApiServerState.Idle, '空闲');
    } catch (error: any) {
      this.logger.error(error);
    }
  }
  
 async doCreateOrSwitchProject(): Promise<void> {
    this.quickInputService.showQuickPick({
      placeholder: '创建或切换项目...',
      items: [
        { 
          label: '创建新项目', 
          description: '创建一个新的 Magic API 项目。' , 
          iconClass: 'codicon codicon-add',
          execute: async () => {
            await this.createProject();
          }
        },
        {  
          label: '打开已创建的项目', 
          description: '查看最近创建的 Magic API 项目列表。', 
          iconClass: 'codicon codicon-open-in-product',
          execute: async () => {
            await this.openRecentlyProject();
          }
        }
      ]
    })
  }

  async openExampleProject(): Promise<void> {
    // 创建官方示例项目
    const newProjectData = await this.projectService.createProject({
      name: '官方示例',
      url: "https://magic-api.ssssssss.org.cn",
      webPath: "/magic/web",
      proxyEnable: false
    })
    if(newProjectData){
      await this.openProject(newProjectData.id);
    } else{
      await this.openProject('project_1b1bac00');
    }
  }

  async openRecentlyProject(isReload?: boolean): Promise<void> {
    const projects = await this.projectService.getProjects();
    if (projects.length === 0) {
      this.notificationService.warn('你还没有创建过任何项目。');
      if(isReload) setTimeout(() => window.location.reload(), 1000);
      return;
    }
    await this.quickInputService.showQuickPick({
      placeholder: '选择项目...',
      items: projects.map(project => ({
        label: project.name,
        iconClass: 'codicon codicon-project',
        description: `(${project.url}${project.webPath})`,
        picked: async () => project.id === await this.currentProject?.id,
        execute: async () => {
          this.openProject(project.id);
        },
        buttons: [
          {
            iconClass: 'codicon codicon-trash',
            tooltip: '从列表中删除',
            callback: async () => {
              const confirmDialog = new ConfirmDialog({
                title: '系统提示',
                msg: `确定要从项目列表中删除「${project.name}」项目？`,
                ok: Dialog.OK,
                cancel: Dialog.CANCEL
              })
              const confirmed = await confirmDialog.open();
              if(confirmed){
                await this.projectService.removeFromRecentlyOpened(project.id);
                await this.projectService.deleteProject(project.id);
                this.notificationService.info(`已删除项目: ${project.name}`);
                // 返回 true 关闭面板，并重新打开
                setTimeout(() => this.openRecentlyProject(true), 100);
                return true;
              }
              return false;
            }
          }
        ]
      }))
    })
  }

  async createProject(): Promise<boolean> { 
    const fields = [
      { 
        name: 'name', 
        label: '项目名称', 
        placeHolder: '请输入项目名称。（示例：my-project)', 
        required: true,
      },
      { 
        name: 'url', 
        label: '服务地址', 
        placeHolder: '请输入 Magic API 服务地址。(例如：https://magic-api.ssssssss.org.cn)', 
        required: true,
      },
      { 
        name: 'webPath', 
        label: 'Web路径', 
        placeHolder: '请输入Web路径。(例如：/magic/web)', 
        required: true,
      },
    ]
    const values: Record<string, string> = {};
    for (const field of fields) {
      let placeHolder: string;
      if (field.placeHolder) {
          placeHolder = field.placeHolder;
      } else {
          placeHolder = field.label;
      }
      placeHolder += field.required ? '' : `(可选的)`;
      const value = await this.quickInputService!.showInputBox({
          prompt: field.label,
          placeholder: placeHolder,
          validateInput: (value) => field.required && value ? undefined : `${field.label}字段为必填项`
      });
      // Test for thruthyness to also test for empty string
      if (!value) {
        return false;
      }else{
        values[field.name] = value;
      }
    }
    // 创建项目
    const newProjectData = await this.projectService.createProject({
      name: values.name,
      url: values.url,
      webPath: values.webPath,
      proxyEnable: false
    });
    if (!newProjectData){
      this.notificationService.error(`项目已存在，请勿重复创建。`, {
        source: MAGIC_API_SOURCE,
      });
      return false;
    }
    // 等待浏览器下一帧渲染完成
    await animationFrame();
    const confirmDialog = new ConfirmDialog({
      title: '系统提示',
      msg: `是否在当前工作区打开「${newProjectData.name}」项目？`,
      ok: Dialog.OK,
      cancel: Dialog.CANCEL
    })
    const confirmed = await confirmDialog.open();
    if (confirmed) {
      await this.openProject(newProjectData.id);
    }
    return true;
  }

  async settingProject(): Promise<void> { 
    if(this.currentProject === undefined) return;
    const result: EditProjectResult | undefined = await MagicApiEditProjectDialog.openEditProjectDialog('项目设置', {
      type: 'object',
      required: ['name', 'url', 'webPath'],
      properties: {
        id: { type: 'string', title: '项目ID', default: this.currentProject.id },
        name: { type: 'string', title: '项目名称', default: this.currentProject.name, description: "请输入项目名称" },
        url: { type: 'string', title: '服务地址', default: this.currentProject.url, description: "请输入服务地址。(例如：https://magic-api.ssssssss.org.cn)" },
        webPath: { type: 'string', title: 'web路径', default: this.currentProject.webPath, description: "请输入Web路径。(例如：/magic/web)" },
        proxyEnable: { type: 'boolean', title: '启用后端代理', default: this.currentProject.proxyEnable, description: "启用代理以转发 Magic API 请求，规避浏览器 CORS 拦截；关闭后切换为直连模式，需自行确保目标接口支持跨域" },
      }
    });
    if(result === undefined){
      return;
    }
    // 更新项目信息
    const isFlag = await this.projectService.updateProject(result);
    if(isFlag){
      this.notificationService.info(`项目设置成功。`, {
        source: MAGIC_API_SOURCE,
      });
      // 判断url 和 webPath 是否改变，如果改变了则重新连接项目服务
      if(this.currentProject.url !== result.url || this.currentProject.webPath !== result.webPath || this.currentProject.proxyEnable !== result.proxyEnable){
        // 如果当前有连接，先断开
        if (this.isConnected) {
          await this.disconnect();
        }
        await this.connect();
      }
    }else{
      this.notificationService.error(`项目设置失败。`, {
        source: MAGIC_API_SOURCE,
      });
    }
  }

  /**
   * 打开项目 - 类似 VS Code 的 openFolder
   * 由 UI 层调用
   */
  async openProject(projectId: string, isInit?: boolean): Promise<boolean> {
    const project = await this.projectService.getProject(projectId);
    if (!project) {
      this.notificationService.error(`项目不存在，请重新添加`, {
        source: MAGIC_API_SOURCE,
      });
      return false;
    }
    
    // 当前已打开的项目则跳过
    if(project.id === await this.currentProject?.id){
      return false;
    }
    
    if (!isInit) {
      window.location.reload();
      // 添加项目到最近打开列表
      await this.projectService.addToRecentlyOpened(project.id);
      return true;
    }
    // 如果当前有连接，先断开
    if (this.isConnected) {
      await this.disconnect();
    }
    // 设置当前项目
    await this.setCurrentProject(project);
    this.onDidChangeProjectEmitter.fire(project);
    return await this.connect();
  }

  /**
   * 关闭项目 - 类似 VS Code 的 closeFolder
   */
  async closeProject(): Promise<void> {
    if (this.isConnected) {
      await this.disconnect();
    }

    if (this.currentProject) {
      await this.projectService.updateProjectOpenStatus(this.currentProject.id, false);
      this.currentProject = undefined;
      this.constants.projectId = "";
      this.isLoggedIn = false;
    }
  }

  /**
   * 连接服务器
   */
  async connect(): Promise<boolean> {
    if (!this.currentProject) {
      // 没有可连接的项目
      this.notificationService.error('没有可连接的项目');
      return false;
    }

    if (this.isConnected) {
      return true;
    }

    try {
      const loadingProgress = this.notificationService.showProgress({
        message: `正在连接「${this.currentProject.name}」...`,
        source: MAGIC_API_SOURCE
      });
      this.updateStatus(MagicApiServerState.Loading, `正在连接「${this.currentProject.name}」...`);

      // 休眠 1 秒
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      // 1. 检查登录状态
      if (!this.isLoggedIn) {
        const loginStatus = await this.checkLoginStatus();
        if (!loginStatus) {
          // 触发登录操作
          this.doLogin();
          return false;
        }
        this.isLoggedIn = true;
      }

      // 2. 加载配置
      const configData = await this.client.getConfig();
      this.constants.config = configData as MagicApiConfig;

      // 3. 获取接口选项
      const options = await this.client.getOptions();
      this.constants.options = options;

      // 4. 初始化 JavaClass（等待类数据加载完成）
      JavaClass.initContants(this.constants.config);
      JavaClass.initMagicApiClient(this.client);
      await JavaClass.initialize();

      // 5. 加载资源
      const resourceData = await this.client.getResources();

      // 6. 更新状态
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // 更新项目打开状态
      await this.projectService.updateProjectOpenStatus(this.currentProject.id, true);
      await this.projectService.addToRecentlyOpened(this.currentProject.id);

      this.updateStatus(MagicApiServerState.Connected, `已连接到「${this.currentProject.name}」`);
      this.onDidConnectEmitter.fire(resourceData);
      (await loadingProgress).cancel();
      this.notificationService.success(`项目「${this.currentProject.name}」已准备就绪`, {
        source: MAGIC_API_SOURCE,
      });

      // 7. 连接 WebSocket 调试服务器
      const basUrl = this.currentProject.url.replace('https://', 'wss://').replace('http://', 'ws://');
      const wsUrl = basUrl + this.currentProject.webPath + "/console";
      this.socketService.connect(wsUrl);

      // 8. 监听 WebSocket 调试服务器事件
      this.listenDebugSocketEvent();
      return true;

    } catch (error) {
      this.isConnected = false;
      this.updateStatus(
        MagicApiServerState.Error,
        `连接失败: ${(error as Error).message}`,
        error as Error
      );
      
      // 自动重连
      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.notificationService.error(`连接失败，正在重试 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
          source: MAGIC_API_SOURCE,
        });
        // 延迟重连
        setTimeout(() => this.connect(), 2000);
      }
      
      return false;
    }
  }

  /**
   * 监听调试服务器事件
   */
  private listenDebugSocketEvent(): void {
    this.socketService.onSocketOpen( () => {
      const clientId = this.getClientId();
      const clientSecret = this.getClientSecret();
      this.socketService.sendMessage('login', [clientSecret, clientId]);
      this.debugItemUpdate?.({
        icon: "codicon codicon-circle-filled success",
        text: "连接调试服务器成功",
        tooltip: '连接调试服务器成功',
      });
    });
    this.socketService.onSocketClose(() => {
      this.debugItemUpdate?.({
        icon: "codicon codicon-debug-disconnect error",
        text: "已断开与调试服务器的连接",
        tooltip: '已断开与调试服务器的连接',
      });
    });
    this.socketService.onSocketError(() => {
      this.debugItemUpdate?.({
        icon: "codicon codicon-warning warn",
        text: "连接调试服务器失败",
        tooltip: '连接调试服务器失败，自动重连中...',
      });
    });
  }

  /**
   * 断开连接(释放资源)
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    this.isConnected = false;
    this.socketService.close();
    this.onDidDisconnectEmitter.fire();
  }

  /**
   * 准备登录
   * @returns 
   */
  async doLogin(): Promise<void> { 
    const result: LoginFormResult | undefined = await MagicApiLoginDialog.openLoginDialog('登录Magic API', {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string', title: '用户名', description: "请输入用户名" },
        password: { type: 'string', title: '密码', description: "请输入密码" }
      }
    });
    if(result === undefined){
      return;
    }
    await this.login(result);
  }

  /**
   * 登录
   */
  async login(credentials: LoginFormResult): Promise<boolean> {
    if (!this.currentProject) {
      return false;
    }

    // 1. 创建令牌源
    const cancelTokenSource = new CancellationTokenSource();
    // 显示进度通知
    const progress = await this.notificationService.showProgress({
      message: '正在登录中...',
      source: MAGIC_API_SOURCE
    }, () => {
      cancelTokenSource.cancel();
    });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = await this.client.login(credentials, cancelTokenSource.token);
      if (result && result.code === 1) {
        // 更新项目访问令牌
        await this.projectService.updateProjectToken(this.currentProject.id, result.token);

        this.isLoggedIn = true;
        this.notificationService.info('登录成功', { source: MAGIC_API_SOURCE });
        
        // 登录成功后自动连接
        return await this.connect();
      }
      // 登录失败
      this.notificationService.error(result.message, {
        timeout: 0,
        source: MAGIC_API_SOURCE,
        actions: [
          {
            label: '重新登录',
            type: 'primary',
            callback: async () => {
              await this.doLogin();
            }
          }
        ]
      })
      return false;
    } catch (error) {
      this.notificationService.error(`登录失败: ${(error as Error).message}`)
      return false;
    } finally { 
      progress.cancel();
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    await this.client.logout();
    await this.disconnect();
    this.isLoggedIn = false;
    this.notificationService.info('已退出登录', { source: MAGIC_API_SOURCE });
  }

  /**
   * 刷新
   */
  async refresh(): Promise<boolean> {
    if (!this.isConnected) {
      return await this.connect();
    }

    try {
      const result = await this.client.reload();
      if(!result){
        this.notificationService.error('刷新失败');
        return false;
      }
      const resourceData = await this.client.getResources();
      this.onDidConnectEmitter.fire(resourceData);
      return true;
    } catch (error) {
      this.notificationService.error(`刷新失败: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * 获取当前状态
   */
  getStatus(): MagicApiServerStatus {
    return { ...this.currentStatus };
  }

  /**
   * 获取当前项目 - 类似 VS Code 的 workspace.workspaceFolders
   */
  getCurrentProject(): MagicApiProjectData | undefined {
    return this.currentProject;
  }

  /**
   * 是否有打开的项目 - 类似 VS Code 的 workspace.workspaceFolders?.length > 0
   */
  hasOpenProject(): boolean {
    return !!this.currentProject;
  }

  /**
   * 是否已连接
   */
  isServerConnected(): boolean {
    return this.isConnected;
  }

  /**
   * 是否已登录
   */
  isUserLoggedIn(): boolean {
    return this.isLoggedIn;
  }

  /**
   * 获取项目名称 - 类似 VS Code 的 workspace.name
   */
  getProjectName(): string | undefined {
    return this.currentProject?.name;
  }

  /**
   * 获取项目路径 - 类似 VS Code 的 workspace.uri
   */
  getProjectUrl(): string | undefined {
    return this.currentProject?.url;
  }

  /**
   * 获取项目是否启用代理
   */
  getProxyEnable(): boolean {
    return this.currentProject?.proxyEnable || false;
  }

  /**
   * 获取客户端ID
   * @returns 
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * 获取客户端密钥
   * @returns 
   */
  getClientSecret(): string {
    return this.currentProject?.token || 'unauthorization';
  }

  /**
   * 生成客户端ID
   */
  private generateClientId(): void { 
    const CLIENT_ID = UUID.uuid4().replace(/-/g, '');
    this.clientId = CLIENT_ID;
    this.constants.clientId = CLIENT_ID;
  }
  
  /**
   * 设置当前项目
   */
  private async setCurrentProject(project: MagicApiProjectData): Promise<void> {
    // 如果当前有项目，先关闭
    if (this.currentProject && this.currentProject.id !== project.id) {
      await this.projectService.updateProjectOpenStatus(this.currentProject.id, false);
    }

    this.currentProject = project;
    this.constants.projectId = project.id;
    this.isLoggedIn = false;
    this.isConnected = false;
    
    this.projectItemUpdate?.({
      text: project.name,
      tooltip: '创建或切换项目...',
      visible: true
    })
    this.onlineUsersUpdate?.({
      visible: true
    })
  }

  /**
   * 检查登录状态
   */
  private async checkLoginStatus(): Promise<boolean> {
    if (!this.currentProject) {
      return false;
    }

    try {
      const result = await this.client.login();
      this.isLoggedIn = !!(result && result.data);
      return this.isLoggedIn;
    } catch (error) {
      this.isLoggedIn = false;
      return false;
    }
  }

  /**
   * 更新状态
   */
  private updateStatus(
    state: MagicApiServerState,
    message?: string,
    error?: Error
  ): void {
    this.logger.info(`MagicApiSocketService: update status to {%s}`, state, message);
    this.currentStatus = {
      state,
      project: this.currentProject,
      message,
      error,
    };
    let iconText = '';
    if(state === MagicApiServerState.Error){
      iconText = 'codicon codicon-circle-filled error';
    }else if(state === MagicApiServerState.Connected){
      iconText = 'codicon codicon-circle-filled success';
    }else if(state === MagicApiServerState.Loading){
      iconText = 'codicon codicon-loading spinning';
    } else if(state === MagicApiServerState.Idle){
      iconText = 'codicon codicon-circle-filled info';
    }
    this.debugItemUpdate?.({
        icon: iconText,
        text: message,
        tooltip: message,
      });
    this.onDidChangeStatusEmitter.fire(this.currentStatus);
  }
}