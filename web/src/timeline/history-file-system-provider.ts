import { injectable, inject } from "inversify";
import URI from "@MagicIdea/core/common/uri";
import { FileData, FileSystemProvider } from '@MagicIdea/core/filesystem/file-system-types';
import { MagicApiClientService } from "@MagicIdea/core/magic-api/magic-api-client-service";

@injectable()
export class MagicApiHistoryFileSystemProvider implements FileSystemProvider {

  constructor(
    @inject(MagicApiClientService) private client: MagicApiClientService,
  ) {
  }

  scheme: string = 'history';

  // 根据关键字在系统中搜索文件
  async search(keyword: string): Promise<any> {
  }

  // 创建文件夹/分组
  async mkdir(uri: URI, data: FileData): Promise<void> {
  }

  // 读取历史版本内容
  async readFile(uri: URI): Promise<FileData> {
    const resourceId = uri.resourceId;
    const ref = uri.getQueryParam('ref') || '';
    const nodeData: FileData = {
      id: resourceId,
      name: uri.fileName,
    }
    // 获取历史文件数据
    const script = ref ? await this.client.backupDetail(resourceId.split("_")[0], ref): "";
    nodeData.script = script.data;
    return nodeData;
  }

  // 写入文件内容
  async writeFile(uri: URI, data: FileData, auto: string): Promise<void> {
  }

  /**
   * 移动文件/分组
   * @param source 
   * @param target 
   */
  async move(source: URI, target: URI): Promise<void>{
  }

  // 删除文件
  async delete(uri: URI): Promise<void> {
  }
}