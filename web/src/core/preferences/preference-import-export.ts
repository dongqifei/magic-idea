import { injectable, inject } from 'inversify';
import { BrowserPreferenceProvider } from './preference-provider';

@injectable()
export class PreferenceImportExportService {
  constructor(
    @inject(BrowserPreferenceProvider)
    private userProvider: BrowserPreferenceProvider
  ) {}

  /** 导出配置为settings.json并下载 */
  exportToFile(): void {
    const content = this.userProvider.exportPreferences();
    const blob = new Blob([content], { type: 'application/json; charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = 'editor-settings.json';
    document.body.appendChild(a);
    a.click();

    // 清理资源
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** 从上传文件导入配置 */
  importFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.userProvider.importPreferences(content).then(resolve);
      };

      reader.onerror = () => {
        console.error('文件读取失败');
        resolve(false);
      };

      reader.readAsText(file);
    });
  }

  /** 重置用户配置（恢复默认） */
  async resetPreferences(): Promise<boolean> {
    return this.userProvider.importPreferences('{}');
  }
}