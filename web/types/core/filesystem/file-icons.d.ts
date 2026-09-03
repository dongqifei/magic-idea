/**
 * 文件图标工具类
 * 支持通过「扩展名数组 + 语言名称 + 颜色样式」批量注册
 * 自动生成 icon-{language} 格式的图标class，同时关联自定义颜色样式class
 * 支持动态维护映射关系，兼容复杂文件名解析
 */
export declare class FileIcons {
    private extensionToIconMap;
    private validColorClasses;
    constructor();
    registerDefaultIcons(): void;
    /**
     * 核心方法：批量注册扩展名数组与语言的映射，同时关联颜色样式class
     * 自动生成 icon-{language} 格式的图标class，支持自定义选择合法颜色样式
     * @param extensions 扩展名数组（如：['ms', 'msa', 'magicscript']，无需带"."）
     * @param language 语言名称（如：magicscript、typescript，用于自动拼接 icon-{language}）
     * @param color 颜色样式class（可选，如：icon-yellow、icon-blue，默认值：icon-gray）
     */
    registerIcon(extensions: string[], language?: string, color?: string): void;
    /**
     * 从文件名中提取所有可能的扩展名（支持多后缀，如 .api.ms 提取 ["ms", "api"]）
     * @param fileName 文件名（如：0d4c0aa7f7b44072a820c88cb932662f.api.ms）
     * @returns 按从后往前排序的扩展名数组
     */
    private extractExtensions;
    /**
     * 根据文件名获取对应的纯图标class（优先匹配最右侧扩展名）
     * @param fileName 文件名
     * @returns 自动生成的 icon-{语言} 格式class（无匹配返回 icon-default）
     */
    getClass(fileName: string): string;
    /**
     * 根据文件名获取带颜色标识的完整图标class（图标class + 颜色样式class）
     * @param fileName 文件名
     * @returns 拼接后的完整class（如：icon-javascript icon-yellow，无匹配返回 icon-default icon-gray）
     */
    getClassWithColor(fileName: string): string;
    /**
     * 移除指定语言对应的所有扩展名映射
     * @param language 语言名称（如：magicscript）
     */
    unregisterLanguage(language: string): void;
    /**
     * 移除单个扩展名的映射
     * @param extension 扩展名（无需带"."）
     */
    unregisterExtension(extension: string): void;
    /**
     * 清空所有扩展名与图标class、颜色样式class的映射
     */
    clearAllRegistrations(): void;
}
export declare const fileIcons: FileIcons;
