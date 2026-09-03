import { FileSystemService } from './file-system-types';
import URI from "../common/uri";
/**
 * 文件持久化服务
 */
export declare class FilePersistenceService {
    private fsService;
    constructor(fsService: FileSystemService);
    /**
     * 保存单个文件
     * @param path 文件路径
     * @returns 是否保存成功
     */
    saveFile(path: URI): Promise<boolean>;
    /**
     * 保存所有 dirty 文件
     * @returns 保存结果
     */
    saveAll(): Promise<{
        success: number;
        failed: number;
    }>;
    /**
     * 自动保存所有 dirty 文件
     * @param interval 自动保存间隔(ms)
     * @returns 取消自动保存的函数
     */
    setupAutoSave(interval?: number): () => void;
}
