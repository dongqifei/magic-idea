import { h, VirtualDOM } from "@lumino/virtualdom";
import {  QuickAccessProvider, QuickPickItem } from '@MagicIdea/core/quick-input';
import { MagicApiTreeModel } from '@MagicIdea/core/magic-api/magic-api-tree-model';
import { FileSystemService } from "@MagicIdea/core/filesystem"
import { LabelProvider } from "@MagicIdea/core/label-provider"
import { OpenerService, open } from '@MagicIdea/core/opener-service';
import URI from '@MagicIdea/core/common/uri';

export interface FileQuickPickItem extends QuickPickItem{
  uri?: URI;
}

/**
 * 文件快速访问服务
 */
export class FileQuickAccessProvider implements QuickAccessProvider {
  prefix = '';
  placeholder = '按名称搜索文件（默认显示最近打开的文件，最多显示20个）';

  constructor(
    private model: MagicApiTreeModel,
    private fileSystemService: FileSystemService,
    private openerService: OpenerService,
    private labelProvider: LabelProvider,
  ){}

  async provide(input: string): Promise<QuickPickItem[]> {
    const fileItems: FileQuickPickItem [] = [];
    if(input){
      const _result = this.model.search(input);
      _result.forEach((result) => {
        if(result.node.children && result.node.children.length > 0) {
          return;
        }
        const iconText = this.labelProvider.getIcon(result.node.node);
        const iconColor = this.labelProvider.getIconColor(result.node.node);
        // 处理文件节点本身
        fileItems.push({
          icon: {
            render: (host: HTMLElement) => {
              const el = h.span({
                className: "magic-resource-icon",
                style: {
                  color: iconColor,
                }
              }, iconText)
              VirtualDOM.render(el, host);
            }
          },
          label: result.node.node.name,
          description: result.matchType === 'fullPath' ? this.model.getFullPath(result.node.node.id) : this.model.getFullPathName(result.node.node.id),
          uri: result.node.node.uri,
          category: "搜索结果"
        })
      })
    }else{
      const recentlyOpenFileIds = await this.fileSystemService.getRecentlyOpenedFileIds();
      if(recentlyOpenFileIds && recentlyOpenFileIds.length > 0){
        recentlyOpenFileIds.forEach((data)=>{
          const uri = URI.parse(data);
          const resource = this.model.getNodeById(uri.resourceId);
          const iconText = this.labelProvider.getIcon(resource?.node || {});
          const iconColor = this.labelProvider.getIconColor(resource?.node || {});
          if(resource){
            fileItems.push({
              icon: {
                render: (host: HTMLElement) => {
                  const el = h.span({
                    className: "magic-resource-icon",
                    style: {
                      color: iconColor,
                    }
                  }, iconText)
                  VirtualDOM.render(el, host);
                }
              },
              label: resource.node.name,
              description: this.model.getFullPath(uri.resourceId),
              uri: resource.node.uri,
              category: "最近打开"
            })
          }
        })
      }
    }
    fileItems.forEach(item => {
      item.execute = () => {
        if(!item.uri){
          return;
        }
        open(this.openerService, item.uri)
      };
    });
    return fileItems;
  }
}