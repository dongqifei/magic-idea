import { inject, injectable } from "inversify";
import { createElement } from "react";
import { CommandRegistry } from "@lumino/commands";
import { UUID } from "@lumino/coreutils";
import { ReactWidget } from "@MagicIdea/core/widgets";
import { ApplicationShellLayout } from "@MagicIdea/core/shell";
import { ActivityHandle } from "@MagicIdea/core/nav-activity/nav-activity-type";
import { CommandContribution } from "@MagicIdea/core/commands";
import { ConfirmDialog } from "@MagicIdea/core/dialogs";
import { CancellationToken, CancellationTokenSource } from "@MagicIdea/core/common";
import { NotificationService } from "@MagicIdea/core/notification";

import { MAGIC_API_SOURCE } from "@MagicIdea/core/magic-api/magic-api-types";
import { MagicApiClientService } from "@MagicIdea/core/magic-api/magic-api-client-service";
import { JavaClass } from "@MagicIdea/core/magic-api";
import { MagicApiTreeService, ResourceNode, DatasourceResourceMetaData } from "./magic-api-tree-types";
import { MagicApiDatasourceView } from "./magic-api-datasource-views";
import { EditDatasourceDialog, DatasourceFormData } from './dialogs/edit-datasource-dialog';
import { DATASOURCE_SCHEMA } from './magic-api-datasource-schema';

@injectable()
export class MagicApiDatasourceWidget extends ReactWidget implements CommandContribution { 

  private datasourcePanel!: ActivityHandle;
  private datasourceData: DatasourceResourceMetaData[] = [];
  private isLoading = false;
  private error: string | null = null;

  constructor(
    @inject(ApplicationShellLayout) protected shellLayout: ApplicationShellLayout,
    @inject(MagicApiTreeService) private magicApiTreeService: MagicApiTreeService,
    @inject(MagicApiClientService) private client: MagicApiClientService,
    @inject(NotificationService) private notification: NotificationService,
  ) {
    super();
    this.id = "magic-api-datasource-widget";
    this.title.label = "数据源";
    this.title.iconClass = "codicon codicon-database";

    // 监听数据源变化
    this.setupDatasourceListener();
    
    // 注册活动面板
    this.registerActivePanel();

    // 设置编辑器扩展属性
    this.setEditorExtensionAttribute();
  }

  /**
   * 添加或更新数据源到本地状态
   */
  private upsertDatasource(datasource: DatasourceResourceMetaData): void {
    const index = this.datasourceData.findIndex(ds => ds.id === datasource.id);
    
    if (index >= 0) {
      // 更新现有数据源
      this.datasourceData[index] = {
        ...this.datasourceData[index],
        ...datasource,
      };
    } else {
      // 添加新数据源
      this.datasourceData.push({
        ...datasource,
      });
    }
    
    // 触发UI更新
    this.update();
  }

  private setupDatasourceListener(): void {
    this.magicApiTreeService.onDidInitialize(() => {
      this.loadDatasourceData();
    });
    // 如果超过2秒没有初始化完成，则更新状态为已加载
    setTimeout(() => {
      if(!this.isLoading){
        this.isLoading = true;
        this.update();
      }
    }, 3000);
  }

  private setEditorExtensionAttribute() {
    JavaClass.setExtensionAttribute('org.ssssssss.magicapi.modules.db.SQLModule', () => {
      return this.datasourceData && this.datasourceData.filter(it => it.key).map(it => {
        return {
          name: it.key,
          type: "org.ssssssss.magicapi.modules.db.SQLModule",
          comment: it.name
        }
      })
    })
  }

  private loadDatasourceData(): void {
    try {
      const _datasourceData: ResourceNode[] = this.magicApiTreeService.getRootByType('datasource');
      this.datasourceData = (_datasourceData) && _datasourceData[0].children.map((node) => node.node as DatasourceResourceMetaData);
      this.isLoading = true;
      this.error = null;
    } catch (error) {
      this.error = error instanceof Error ? error.message : '加载数据源失败';
      this.notification.error(this.error);
    } finally {
      this.update();
    }
  }

  private getDatasourceData(): DatasourceResourceMetaData[] { 
    return [...this.datasourceData].sort((a, b) => {
      // 先按照 id 是否为空排序，id 为空的排在最前面
      if (!a.id && b.id) return -1;
      if (a.id && !b.id) return 1;

      // 如果 id 都存在或都不存在，则按照 key 进行正序排序
      return a.key.localeCompare(b.key);
    });
  }

  private registerActivePanel(): void {
    const activityManager = this.shellLayout.activityManager;
    this.datasourcePanel = activityManager.registerActivity({
      id: 'magic-api-datasource',
      title: '数据源',
      iconClass: 'codicon codicon-database',
      priority: 10,
      location: 'right-top',
      toolbarConfig: {
        items: [
          {
            id: 'add-datasource',
            type: 'button',
            commandId: 'magic-api.datasource.add',
            tooltip: '添加数据源'
          }
        ]
      },
      factory: () => {
        return this;
      }
    });
  }

  registerCommands(commands: CommandRegistry): void {
    commands.addCommand("view:magic-api-datasource", {
      label: "数据源",
      execute: () => {
        this.datasourcePanel.open();
      }
    });
    commands.addCommand("magic-api.datasource.add", { 
      label: "添加数据源",
      iconClass: "codicon-add",
      execute: () => {
        this.createDatasource();
      }
    });
  }

  private async createDatasource(): Promise<void> { 
    try {
      const result = await EditDatasourceDialog.openEditDialog("添加数据源", DATASOURCE_SCHEMA, {}, (data)=>{
        this.testDatasourceConnection(data);
      });
      
      if (!result) return;
      
      // 转换表单数据为 API 所需格式
      const datasourceData: DatasourceResourceMetaData = {
        id: UUID.uuid4().replace(/-/g, ''),
        groupId: "datasource_0",
        ...result,
        // 确保 extraParams 是合法的 JSON
        extraParams: this.parseExtraParams(result.extraParams)
      };

      // 保存到后端
      const id = await this.client.saveResource("datasource", datasourceData, "0");
      
      // 刷新数据
      this.upsertDatasource({
        ...datasourceData,
        id: id
      })
      
      this.notification.success("数据源添加成功");
      
    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : "添加数据源失败");
    }
  }

  private async editDatasource(id: string): Promise<void> { 
    try {
      // 获取数据源详情
      const datasource = this.datasourceData.find(ds => ds.id === id);
      if (!datasource) {
        this.notification.warn("未找到该数据源");
        return;
      }

      // 获取完整的配置信息
      const data = await this.client.getResourceFile(id);
      if (!data) {
        this.notification.warn("未找到该数据源");
        return;
      }
      
      // 打开编辑对话框，传入现有数据
      const result = await EditDatasourceDialog.openEditDialog("编辑数据源", DATASOURCE_SCHEMA, data, (data)=>{
        this.testDatasourceConnection(data);
      });
      
      if (!result) return;
      
      // 转换表单数据
      const updateData: DatasourceResourceMetaData = {
        ...result,
        id: datasource.id, // 保留原有ID
        extraParams: this.parseExtraParams(result.extraParams)
      };

      // 更新到后端
      await this.client.saveResource("datasource", updateData, "0");
      
      // 更新数据
      this.upsertDatasource(updateData)
      
      this.notification.success("数据源更新成功");
    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : "编辑数据源失败");
    }
  }

  private async deleteDatasource(id: string): Promise<void> { 
    try {
      // 获取数据源详情
      const datasource = this.datasourceData.find(ds => ds.id === id);
      const confirmed = await ConfirmDialog.openConfirm("确定要删除“"+datasource?.name+"”数据源吗？删除操作不可恢复，请谨慎操作！");
      
      if (!confirmed) return;
      
      // 删除数据源
      await this.client.deleteResource(id);
      
      // 从本地数据中移除
      this.datasourceData = this.datasourceData.filter(ds => ds.id !== id);
      this.update();
      
      this.notification.success("数据源删除成功");
      
    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : "删除数据源失败");
    }
  }

  private async testDatasourceConnection(data: DatasourceFormData): Promise<void> {
    // 创建令牌源
    const cancelTokenSource = new CancellationTokenSource();
    // 显示进度通知
    const progress = await this.notification.showProgress({
      message: '正在测试连接...',
      source: MAGIC_API_SOURCE
    }, () => {
      cancelTokenSource.cancel();
    });
    try {
      await this.client.testDatasourceConnection(data);
      this.notification.success("连接成功");
    } catch (error) {
      this.notification.error("连接失败: " + (error instanceof Error ? error.message : "未知错误"));
    } finally{
      progress.cancel();
    }
  }

  private parseExtraParams(extraParams?: string): string {
    if (!extraParams) return "{}";
    
    try {
      // 如果已经是 JSON 字符串，直接返回
      JSON.parse(extraParams);
      return extraParams;
    } catch {
      // 如果不是有效的 JSON，尝试处理
      if (extraParams.trim().startsWith("{") || extraParams.trim().startsWith("[")) {
        // 尝试修复常见的 JSON 格式错误
        return extraParams.trim();
      }
      // 如果是键值对格式，转换为 JSON
      try {
        const params: Record<string, string> = {};
        extraParams.split(';').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[key.trim()] = value.trim();
          }
        });
        return JSON.stringify(params, null, 2);
      } catch {
        return "{}";
      }
    }
  }

  protected render(): React.ReactNode {
    // 渲染组件
    return createElement(MagicApiDatasourceView, {
      datasourceData: this.getDatasourceData(),
      isLoading: this.isLoading,
      error: this.error,
      onDelete: (id: string) => this.deleteDatasource(id),
      onEdit: (id: string) => this.editDatasource(id),
    });
  }
}