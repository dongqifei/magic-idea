import { BrowserPreferenceProvider } from './preference-provider';
export declare class PreferenceImportExportService {
    private userProvider;
    constructor(userProvider: BrowserPreferenceProvider);
    /** 导出配置为settings.json并下载 */
    exportToFile(): void;
    /** 从上传文件导入配置 */
    importFromFile(file: File): Promise<boolean>;
    /** 重置用户配置（恢复默认） */
    resetPreferences(): Promise<boolean>;
}
