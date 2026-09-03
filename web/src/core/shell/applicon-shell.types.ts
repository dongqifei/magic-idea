export const AppliconShellTypes = {
    AppliconShellOptions:  Symbol.for("AppliconShellOptions")
};

/**
 * 可选参数
 */
export interface AppliconShellOptions {
  /**
   * 是否显示导航栏
   */
  showNavBar?: boolean;

  /**
   * 是否显示状态栏
   */
  showStatusBar?: boolean;

  /**
   * 是否显示左侧边栏
   */
  showLeftSidebar?: boolean;

  /**
   * 是否显示右侧边栏
   */
  showRightSidebar?: boolean;
}