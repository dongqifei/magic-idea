import { injectable } from 'inversify';
import { ThemeContribution } from './theme-type';

// 注意：系统样式默认通过CSS实现，这里仅注册贡献者（实际样式在CSS中）
@injectable()
export class DefaultThemeContribution implements ThemeContribution {
  // 无需额外JS逻辑，系统组件通过全局CSS变量自动适配主题
  // ../../style/global.css
}