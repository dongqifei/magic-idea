import { injectable, inject } from "inversify";
import URI from "@MagicIdea/core/common/uri";
import { FileData, FileSystemProvider } from '@MagicIdea/core/filesystem/file-system-types';
import { MagicApiClientService } from "@MagicIdea/core/magic-api/magic-api-client-service";
import { MagicApiTreeModel } from "@MagicIdea/core/magic-api/magic-api-tree-model";

@injectable()
export class ApiFileSystemProvider implements FileSystemProvider {

  constructor(
    @inject(MagicApiClientService) private client: MagicApiClientService,
    @inject(MagicApiTreeModel) private model: MagicApiTreeModel,
  ) {
  }

  scheme: string = 'file';

  // 根据关键字在系统中搜索文件
  async search(keyword: string): Promise<any> {
    return this.client.search({keyword});
  }

  // 创建文件夹/分组
  async mkdir(uri: URI, data: FileData): Promise<void> {
    await this.client.saveGroup(data);
  }

  // 读取文件内容
  async readFile(uri: URI): Promise<FileData> {
    const resourceId = uri.resourceId;
    // 先查是否存在临时文件
    const node = this.model.getNodeById(resourceId);
    if(node && node.node.isTemp){
      return node?.node;
    }
    const nodeData: FileData = await this.client.getResourceFile(resourceId);
    return nodeData;
  }

  // 写入文件内容
  async writeFile(uri: URI, data: FileData, auto: string): Promise<void> {
    const type = uri.resourceType;
    if (!type) {
      throw new Error('文件类型不能为空');
    }
    await this.client.saveResource(type, data, auto);
  }

  /**
   * 移动文件/分组
   * @param source 
   * @param target 
   */
  async move(source: URI, target: URI): Promise<void>{
    await this.client.moveResource(source.resourceId, target.resourceId);
  }

  // 删除文件
  async delete(uri: URI): Promise<void> {
    const resourceId = uri.resourceId;
    // 先查是否存在临时文件
    const node = this.model.getNodeById(resourceId);
    if(node && node.node.isTemp){
      return;
    }
    await this.client.deleteResource(resourceId);
  }
}