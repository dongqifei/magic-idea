import { injectable, inject } from "inversify";
import { FileSystemService } from './file-system-types'
import URI from "../common/uri";

/**
 * 文件持久化服务
 */
@injectable()
export class FilePersistenceService {

  constructor(
    @inject(FileSystemService) private fsService: FileSystemService,
  ) {
  }

  /**
   * 保存单个文件
   * @param path 文件路径
   * @returns 是否保存成功
   */
  async saveFile(path: URI): Promise<boolean> {
    try {
      // 从文件缓存中获取FileData
      const fileData = this.fsService.getFileData(path);
      if (!fileData) {
        return false;
      }
      // 序列化为JSON字符串并写入
      const result = await this.fsService.writeFile(
        path, 
        fileData,
      );
      
      if (!result) {
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Failed to save file ${path}:`, error);
      return false;
    }
  }

  /**
   * 保存所有 dirty 文件
   * @returns 保存结果
   */
  async saveAll(): Promise<{ success: number; failed: number }> {
    const dirtyPaths = this.fsService.getDirtyFileUris();
    let success = 0;
    let failed = 0;
    
    for (const path of dirtyPaths) {
      const result = await this.saveFile(path);
      result ? success++ : failed++;
    }
    
    return { success, failed };
  }

  /**
   * 自动保存所有 dirty 文件
   * @param interval 自动保存间隔(ms)
   * @returns 取消自动保存的函数
   */
  setupAutoSave(interval: number = 30000): () => void {
    const timer = setInterval(() => this.saveAll(), interval);
    
    return () => {
      clearInterval(timer);
    };
  }
}