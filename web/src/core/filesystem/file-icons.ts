/**
 * 文件图标工具类
 * 支持通过「扩展名数组 + 语言名称 + 颜色样式」批量注册
 * 自动生成 icon-{language} 格式的图标class，同时关联自定义颜色样式class
 * 支持动态维护映射关系，兼容复杂文件名解析
 */
export class FileIcons {
  // 私有成员：存储 扩展名 -> { iconClass: 图标class, colorClass: 颜色样式class } 的映射表
  private extensionToIconMap: Map<string, {
    iconClass: string;
    colorClass: string;
  }>;

  // 合法颜色样式类列表，用于校验注册的颜色类是否有效
  private validColorClasses = [
    'icon-yellow',
    'icon-blue',
    'icon-green',
    'icon-red',
    'icon-orange',
    'icon-purple',
    'icon-gray',
    'icon-pink',
    'icon-cyan'
  ];

  constructor() {
    this.extensionToIconMap = new Map<string, { iconClass: string; colorClass: string }>();
    this.registerDefaultIcons();
  }

  registerDefaultIcons() {
    // 默认图标列表：可给不同语言指定默认颜色样式
    const defaultIcons = [
      { extensions: ['ms', 'api'], language: 'typescript', color: 'icon-blue' },
      { extensions: ['ms', 'function'], language: 'typescript', color: 'icon-pink' },
      { extensions: ['ms', 'task'], language: 'typescript', color: 'icon-green' },
      { extensions: ['ms', 'rocketMq'], language: 'typescript', color: 'icon-orange' },
      { extensions: ['ms', 'kafka'], language: 'typescript', color: 'icon-yellow' },
      { extensions: ['ms', 'mqtt'], language: 'typescript', color: 'icon-purple' },
      { extensions: ['js', 'jsx'], language: 'javascript', color: 'icon-yellow' },
      { extensions: ['ts', 'tsx'], language: 'typescript', color: 'icon-blue' },
      { extensions: ['css', 'scss', 'less'], language: 'css', color: 'icon-purple' },
      { extensions: ['html', 'htm'], language: 'html', color: 'icon-orange' },
      { extensions: ['json', 'jsonc'], language: 'json', color: 'icon-green' },
      { extensions: ['md', 'markdown'], language: 'markdown', color: 'icon-gray' },
      { extensions: ['java'], language: 'java', color: 'icon-orange' },
      { extensions: ['sql'], language: 'db', color: 'icon-red' },
      { extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'], language: 'image', color: 'icon-purple' },
    ];
    defaultIcons.forEach((icon) => {
      this.registerIcon(icon.extensions, icon.language, icon.color);
    });
  }

  /**
   * 核心方法：批量注册扩展名数组与语言的映射，同时关联颜色样式class
   * 自动生成 icon-{language} 格式的图标class，支持自定义选择合法颜色样式
   * @param extensions 扩展名数组（如：['ms', 'msa', 'magicscript']，无需带"."）
   * @param language 语言名称（如：magicscript、typescript，用于自动拼接 icon-{language}）
   * @param color 颜色样式class（可选，如：icon-yellow、icon-blue，默认值：icon-gray）
   */
  registerIcon(extensions: string[], language?: string, color?: string): void {
    // 校验参数合法性
    if (!Array.isArray(extensions) || extensions.length === 0) {
      console.warn("扩展名数组不能为空且必须为数组类型！");
      return;
    }
    if (!language || typeof language !== "string" || language.trim() === "") {
      console.warn("语言名称不能为空且必须为字符串类型！");
      return;
    }

    // 统一语言名称小写，避免大小写不一致（如 MagicScript -> magicscript）
    const lowerCaseLanguage = language.trim().toLowerCase();
    // 自动生成图标class：icon-{语言名称}
    const iconClass = `icon-${lowerCaseLanguage}`;

    // 处理颜色样式class：校验是否为合法颜色类，非法则使用默认值 icon-gray
    let colorClass = color?.trim() || 'icon-gray';
    if (!this.validColorClasses.includes(colorClass)) {
      console.warn(`颜色样式类 ${colorClass} 不合法，默认使用 icon-gray，合法类：${this.validColorClasses.join(', ')}`);
      colorClass = 'icon-gray';
    }

    // 遍历扩展名数组，批量注册映射（同时存储图标class和颜色样式class）
    extensions.forEach(ext => {
      const lowerCaseExt = ext.trim().toLowerCase();
      if (lowerCaseExt) { // 过滤空字符串扩展名
        this.extensionToIconMap.set(lowerCaseExt, {
          iconClass,
          colorClass
        });
      }
    });
  }

  /**
   * 从文件名中提取所有可能的扩展名（支持多后缀，如 .api.ms 提取 ["ms", "api"]）
   * @param fileName 文件名（如：0d4c0aa7f7b44072a820c88cb932662f.api.ms）
   * @returns 按从后往前排序的扩展名数组
   */
  private extractExtensions(fileName: string): string[] {
    if (!fileName || typeof fileName !== "string") {
      return [];
    }
    // 分割文件名并过滤空值，排除文件主体（优先匹配最左侧扩展名）
    const parts = fileName.trim().split(".").filter(part => part);
    return parts.slice(1);
  }

  /**
   * 根据文件名获取对应的纯图标class（优先匹配最右侧扩展名）
   * @param fileName 文件名
   * @returns 自动生成的 icon-{语言} 格式class（无匹配返回 icon-default）
   */
  getClass(fileName: string): string {
    const extensions = this.extractExtensions(fileName);
    // 优先匹配最右侧扩展名（数组首位是最右侧后缀）
    for (const ext of extensions) {
      const lowerCaseExt = ext.toLowerCase();
      const iconInfo = this.extensionToIconMap.get(lowerCaseExt);
      if (iconInfo) {
        return iconInfo.iconClass;
      }
    }
    return 'icon-default';
  }

  /**
   * 根据文件名获取带颜色标识的完整图标class（图标class + 颜色样式class）
   * @param fileName 文件名
   * @returns 拼接后的完整class（如：icon-javascript icon-yellow，无匹配返回 icon-default icon-gray）
   */
  getClassWithColor(fileName: string): string {
    const extensions = this.extractExtensions(fileName);
    // 优先匹配最左侧扩展名（数组首位是最左侧后缀）
    for (const ext of extensions) {
      const lowerCaseExt = ext.toLowerCase();
      const iconInfo = this.extensionToIconMap.get(lowerCaseExt);
      if (iconInfo) {
        // 拼接图标class和颜色样式class，返回完整样式类
        return `${iconInfo.iconClass} ${iconInfo.colorClass}`;
      }
    }
    // 无匹配时返回默认图标class + 默认颜色class
    return 'icon-default icon-gray';
  }

  /**
   * 移除指定语言对应的所有扩展名映射
   * @param language 语言名称（如：magicscript）
   */
  unregisterLanguage(language: string): void {
    if (!language) {
      console.warn("语言名称不能为空！");
      return;
    }
    const lowerCaseLanguage = language.trim().toLowerCase();
    const targetIconClass = `icon-${lowerCaseLanguage}`;

    // 遍历映射表，删除该语言对应的所有扩展名
    for (const [ext, iconInfo] of this.extensionToIconMap.entries()) {
      if (iconInfo.iconClass === targetIconClass) {
        this.extensionToIconMap.delete(ext);
        console.log(`已移除扩展名 [${ext}] 与语言 [${lowerCaseLanguage}] 的映射`);
      }
    }
  }

  /**
   * 移除单个扩展名的映射
   * @param extension 扩展名（无需带"."）
   */
  unregisterExtension(extension: string): void {
    const lowerCaseExt = extension.trim().toLowerCase();
    if (this.extensionToIconMap.has(lowerCaseExt)) {
      this.extensionToIconMap.delete(lowerCaseExt);
      console.log(`已移除扩展名 [${lowerCaseExt}] 的映射`);
    } else {
      console.warn(`未找到扩展名 [${lowerCaseExt}] 的映射，无需移除`);
    }
  }

  /**
   * 清空所有扩展名与图标class、颜色样式class的映射
   */
  clearAllRegistrations(): void {
    this.extensionToIconMap.clear();
    console.log("已清空所有扩展名映射关系");
  }
}

export const fileIcons = new FileIcons();