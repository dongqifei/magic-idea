import { CommandContribution, CommandRegistry } from "@MagicIdea/core/commands";
import { inject, injectable } from "inversify";
import { MagicApiTreeService } from "./magic-api-tree-types";
import { MenuContribution, MenuModelRegistry, MenuPath } from "@MagicIdea/core/common";
import { OpenerService, open } from '@MagicIdea/core/opener-service';
import { EditGroupDialog } from "./dialogs/edit-group-dialog";
import { ApplicationShellLayout } from "@MagicIdea/core/shell";
import { MagicApiClientService } from "@MagicIdea/core/magic-api/magic-api-client-service";

export const MAGIC_API_RESOURCE_CONTEXT_MENU: MenuPath = ['magic-api-resource-context-menu'];
export const MAGIC_API_RESOURCE_CONTEXT_MENU_NEW: MenuPath = [...MAGIC_API_RESOURCE_CONTEXT_MENU, '0_new'];
export const MAGIC_API_RESOURCE_CONTEXT_MENU_GROUP: MenuPath = [...MAGIC_API_RESOURCE_CONTEXT_MENU, '1_group'];
export const MAGIC_API_RESOURCE_CONTEXT_MENU_COPY: MenuPath = [...MAGIC_API_RESOURCE_CONTEXT_MENU, '2_copy'];
export const MAGIC_API_RESOURCE_CONTEXT_MENU_OTHER: MenuPath = [...MAGIC_API_RESOURCE_CONTEXT_MENU, '8_other'];

export namespace MagicApiCommands { 

  // 新建资源
  export const NEW_RESOURCE = {
    id: 'file.new-resource',
    label: '新建资源',
    icon: 'codicon-new-file'
  };

  // 新建资源分组
  export const NEW_RESOURCE_GROUP = {
    id: 'file.new-resource-group',
    label: '新建分组',
    icon: 'codicon-new-folder'
  };

  // 修改资源分组
  export const MODIFY_RESOURCE_GROUP = {
    id: 'file.modify-resource-group',
    label: '修改分组',
    icon: 'codicon-edit'
  };

  // 导出分组
  export const EXPORT_RESOURCE_GROUP = {
    id: 'file.export-resource-group',
    label: '导出分组',
    icon: 'codicon-cloud-download'
  };

  // 复制资源
  export const DUPLICATE_RESOURCE = {
    id: 'file.duplicate-resource',
    label: '复制资源',
    icon: 'codicon-copy'
  };

  // 复制资源路径
  export const DUPLICATE_RESOURCE_PATH = {
    id: 'file.duplicate-resource-path',
    label: '复制路径',
    icon: 'codicon-copy'
  };
  
  // 删除资源
  export const DELETE_RESOURCE = {
    id: 'file.delete-resource',
    label: '删除',
    icon: 'codicon-trash'
  };

  // 刷新资源
  export const REFRESH_RESOURCE = {
    commandId: 'file.refresh-resource',
    icon: 'refresh',
    label: '刷新资源',
    category: 'magic-api'
  };
}

@injectable()
export class MagicApiCommandContribution implements CommandContribution, MenuContribution { 

  @inject(ApplicationShellLayout)
  protected readonly shell: ApplicationShellLayout;

  @inject(MagicApiTreeService)
  private magicApiTreeService: MagicApiTreeService;

  @inject(OpenerService)
  private openerService: OpenerService;

  @inject(MagicApiClientService)
  private magicApiClientService: MagicApiClientService;

  registerCommands(commands: CommandRegistry): void {
    commands.addCommand(MagicApiCommands.NEW_RESOURCE.id, {
      label: MagicApiCommands.NEW_RESOURCE.label,
      iconClass: MagicApiCommands.NEW_RESOURCE.icon,
      isEnabled: (args) => {
        return !!args.parentId;
      },
      execute: async (args: any) => {
        if(!args) {
          return;
        }
        let parentId = args?.id;
        if (args?.groupId) {
          parentId = args?.groupId;
        }
        const resource = await this.magicApiTreeService.createResource(args.type, {
          id: '',
          name: '未定义名称',
          groupId: parentId,
        }, parentId)
        if(resource && resource.uri){
          open(this.openerService, resource.uri);
        }
      }
    })

    commands.addCommand(MagicApiCommands.NEW_RESOURCE_GROUP.id, {
      label: MagicApiCommands.NEW_RESOURCE_GROUP.label,
      iconClass: MagicApiCommands.NEW_RESOURCE_GROUP.icon,
      execute: (args: any) => {
        if(!args){
          return;
        }
        EditGroupDialog.openEditGroupDialog("新建分组", {
          type: 'object',
          required: ['name', 'path'],
          properties: {
            name: { type: 'string', title: '分组名称', description: "请输入分组名称" },
            path: { type: 'string', title: '分组路径', description: "请输入分组路径" }
          }
        }).then(result => {
          if (!result) return;
          this.magicApiTreeService.createGroup(args.type, {
            id: '',
            name: result?.name,
            path: result?.path,
          }, args?.groupId ? args.groupId : args?.id || '0');
        })
      }
    })

    commands.addCommand(MagicApiCommands.MODIFY_RESOURCE_GROUP.id, {
      label: MagicApiCommands.MODIFY_RESOURCE_GROUP.label,
      iconClass: MagicApiCommands.MODIFY_RESOURCE_GROUP.icon,
      execute: (args: any) => {
        if(!args){
          return;
        }
        EditGroupDialog.openEditGroupDialog("修改分组", {
          type: 'object',
          required: ['id', 'name', 'path'],
          properties: {
            id: { type: 'string', title: '分组ID', default: args.id },
            name: { type: 'string', title: '分组名称', default: args.name, description: "请输入分组名称" },
            path: { type: 'string', title: '分组路径', default: args.path, description: "请输入分组路径" }
          }
        }).then(result => {
          if (!result) return;
          this.magicApiTreeService.updateGroup(result.id, result);
        })
      }
    })

    commands.addCommand(MagicApiCommands.EXPORT_RESOURCE_GROUP.id, {
      label: MagicApiCommands.EXPORT_RESOURCE_GROUP.label,
      iconClass: MagicApiCommands.EXPORT_RESOURCE_GROUP.icon,
      execute: async (args: any) => {
        if(!args){
          return;
        }
        this.magicApiClientService.exportGroup(args.id).then((res: Blob) => {
          let element = document.createElement('a')
          let href = window.URL.createObjectURL(res);
          element.href = href;
          element.download = args.name + ".zip";
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          setTimeout(() => window.URL.revokeObjectURL(href), 100);
        }).catch(error => {
          console.error("导出失败：", error);
        })
      }
    })

    commands.addCommand(MagicApiCommands.DUPLICATE_RESOURCE_PATH.id, {
      label: MagicApiCommands.DUPLICATE_RESOURCE_PATH.label,
      iconClass: MagicApiCommands.DUPLICATE_RESOURCE_PATH.icon,
      execute: async (args: any) => {
        if(!args){
          return;
        }
        const fullPath = this.magicApiTreeService.getNodeFullPath(args.id);
        await navigator.clipboard.writeText(fullPath);
      }
    })

    commands.addCommand(MagicApiCommands.DELETE_RESOURCE.id, {
      label: MagicApiCommands.DELETE_RESOURCE.label,
      iconClass: MagicApiCommands.DELETE_RESOURCE.icon,
      execute: async (args: any) => {
        if(!args){
          return;
        }
        this.magicApiTreeService.deleteResource(args.id);
      }
    })
  }

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(MAGIC_API_RESOURCE_CONTEXT_MENU_NEW, {
      commandId: MagicApiCommands.NEW_RESOURCE.id,
      when: "!isRootResource && isDirectoryResource",
      order: '0'
    })
    menus.registerMenuAction(MAGIC_API_RESOURCE_CONTEXT_MENU_GROUP, {
      commandId: MagicApiCommands.NEW_RESOURCE_GROUP.id,
      when: "isRootResource || isDirectoryResource",
      order: '0'
    })
    menus.registerMenuAction(MAGIC_API_RESOURCE_CONTEXT_MENU_GROUP, {
      commandId: MagicApiCommands.MODIFY_RESOURCE_GROUP.id,
      when: "!isRootResource && isDirectoryResource",
      order: '1'
    })
    menus.registerMenuAction(MAGIC_API_RESOURCE_CONTEXT_MENU_GROUP, {
      commandId: MagicApiCommands.EXPORT_RESOURCE_GROUP.id,
      when: "!isRootResource && isDirectoryResource",
      order: '1'
    })

    menus.registerMenuAction(MAGIC_API_RESOURCE_CONTEXT_MENU_COPY, {
      commandId: MagicApiCommands.DUPLICATE_RESOURCE_PATH.id,
      when: "!isRootResource",
      order: '0'
    })

    menus.registerMenuAction(MAGIC_API_RESOURCE_CONTEXT_MENU_OTHER, {
      commandId: MagicApiCommands.DELETE_RESOURCE.id,
      when: "!isRootResource",
      order: '0'
    })
  }
}