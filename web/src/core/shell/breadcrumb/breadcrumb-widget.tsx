/**
 * Breadcrumb widget
 */
import React, { createElement } from "react";
import { CommandRegistry } from "@lumino/commands";
import { ReactWidget } from "../../widgets/react-widget";
import { QuickInputCommands } from "../../quick-input/contribution/quick-command-contribution";

interface BreadcrumbViewProps {
  fileInfo: string | undefined,
}

/**
 * 解析 URL 为友好名称和路径
 * 示例：
 * - post://api/sys/permissions/获取权限列表 → 名称：获取权限列表，路径：/api/sys/permissions
 * - get://api/user/info → 名称：用户信息，路径：/api/user/info（自动推断名称）
 * - /src/components/Button.tsx → 名称：Button.tsx，路径：/src/components
 * - 直接名称 → 名称：直接名称，路径：''
 */
const parseFileInfo = (fileInfo?: string): { displayName: string; path: string } => {
  if (!fileInfo) {
    return { displayName: '未知', path: '' };
  }

  // 1. 处理 URL 格式（如 post://、get:// 等）
  const urlRegex = /^(get|post|put|delete|patch):\/\/([^/]+\/.*?)\/?([^/]+)?$/i;
  const urlMatch = fileInfo.match(urlRegex);
  
  if (urlMatch) {
    const [, method, apiPath, lastSegment] = urlMatch;
    // 优先使用最后一段作为名称（如果是中文/字母组合），否则推断名称
    let displayName = lastSegment || '未命名接口';
    return {
      displayName,
      path: `/${apiPath}` // 拼接完整路径（如 /api/sys/permissions）
    };
  }

  // 2. 处理文件路径格式（如 /src/components/Button.tsx）
  const fileRegex = /^(.+)\/([^/]+)$/;
  const fileMatch = fileInfo.match(fileRegex);
  if (fileMatch) {
    const [, filePath, fileName] = fileMatch;
    return {
      displayName: fileName,
      path: filePath
    };
  }

  // 3. 直接显示名称（无路径）
  return {
    displayName: fileInfo,
    path: ''
  };
};

/**
 * 拆分路径为面包屑项（如 /api/sys/permissions → ['api', 'sys', 'permissions']）
 */
const splitPathToItems = (path: string): { label: string; fullPath: string }[] => {
  if (!path || path === '/') return [];
  
  const segments = path.replace(/^\/+/, '').split('/').filter(seg => seg);
  const items: { label: string; fullPath: string }[] = [];
  
  let fullPath = '';
  segments.forEach(seg => {
    fullPath += `/${seg}`;
    items.push({
      label: seg,
      fullPath
    });
  });
  
  return items;
};

const BreadcrumbView: React.FC<BreadcrumbViewProps> = ({
  fileInfo,
}) => {
  // 解析文件信息为名称和路径
  const { displayName, path } = parseFileInfo(fileInfo);
  // 拆分路径为面包屑项
  const pathItems = splitPathToItems(path);
  return (
    <div className="jp-Breadcrumb" style={{ 
      height: '100%', 
      lineHeight: '40px', 
      padding: '0 12px',
      overflow: 'hidden', // 处理路径过长
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    }}>
      {/* 路径面包屑项 */}
      {pathItems.length > 0 ? (
        pathItems.map((item, index) => (
          <React.Fragment key={item.fullPath}>
            <span 
              className="jp-Breadcrumb-item"
              style={{
                color: 'var(--magic-idea-secondary-foreground)',
                transition: 'color 0.2s'
              }}
            >
              {item.label}
            </span>
            <span className="jp-Breadcrumb-separator" style={{ 
              margin: '0', 
              color: 'var(--magic-idea-secondary-foreground)',
              verticalAlign: 'middle' 
            }}>
              <div className="codicon codicon-chevron-right"></div>
            </span>
          </React.Fragment>
        ))
      ) : null}

      {/* 最终名称项（高亮显示） */}
      <span className="jp-Breadcrumb-item jp-Breadcrumb-active" style={{
        color: 'var(--magic-idea-foreground)',
      }}>
        {displayName}
      </span>

      {/* 分隔符 + IDE 名称 */}
      <span className="jp-Breadcrumb-separator" style={{ 
        margin: '0 8px', 
      }}>
        -
      </span>
      <span className="jp-Breadcrumb-ide" style={{
        fontWeight: 600,
        fontSize: '0.9em'
      }}>
        Magic IDEA
      </span>
    </div>
  );
};

const CommandCenterView: React.FC<BreadcrumbViewProps & { openCommandCenter: () => void }> = ({openCommandCenter}) => {
  return (
    <div className="command-center" onClick={()=> openCommandCenter()}>
      <div className="command-center-center action-label">
        <div className="action-item command-center-quick-pick">
          <span aria-hidden="true" className="codicon codicon-search search-icon"></span>
          <span className="search-label">magic-api</span>
        </div>
      </div>
    </div>
  );
}

export class BreadcrumbWidget extends ReactWidget {

  private _fileInfo!: string | undefined;
  /**
   * Construct a new breadcrumb widget.
   */
  constructor(
    readonly commands: CommandRegistry,
  ) {
    super();
    this.node.style.textAlign = 'center';
  }

  openCommandCenter() {
    this.commands.execute(QuickInputCommands.OPEN_COMMAND_CENTER);
  }

  protected render(): React.ReactNode {
    return createElement(CommandCenterView, {
      fileInfo: this._fileInfo,
      openCommandCenter: this.openCommandCenter.bind(this)
    });
  }
}