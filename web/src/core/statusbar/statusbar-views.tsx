import * as React from 'react';
import { StatusBarItem } from './statusbar-types';
import { HoverService } from '../hover-service';

// 仅接收渲染所需的数据和回调，与服务解耦
interface StatusBarComponentProps {
  items: StatusBarItem[];
  hoverService: HoverService
  onItemClick: (e: MouseEvent, id: string) => void;
}

/**
 * 状态栏组件(仅提供UI渲染，不处理业务逻辑)
 */
export const StatusBarComponent: React.FC<StatusBarComponentProps> = ({ items, hoverService, onItemClick }) => {
  // 拆分左右项并排序（纯 UI 相关的格式化逻辑）
  const left = items
    .filter(i => (i.options.alignment || 'left') === 'left')
    .sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));
  
  const right = items
    .filter(i => (i.options.alignment || 'left') === 'right')
    .sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));

  // 渲染单个项（纯 UI 逻辑）
  const renderItem = (it: StatusBarItem) => {
    const opts = it.options;
    if (!opts.visible) return null; // 不显示隐藏项

    const content = (() => {
      switch (opts.type) {
        case 'button': 
          return <div className={`${opts.icon} sb-item-icon`}></div>
        case 'spinner':
          return <><div className="codicon codicon-loading spinning"/>{opts.text ? <span className="sb-item-text" style={{marginLeft: 4}}>{opts.text}</span> : <span className="sb-item-text">正在加载中...</span>}</>;
        case 'progress':
          const p = Math.max(0, Math.min(100, opts.progress || 0));
          return (
            <div style={{ width: 100, display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, height: 6, background: '#ffffff', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${p}%`, height: '100%', background: 'var(--magic-idea-primary-color)' }} />
              </div>
              <div style={{ marginLeft: 6, fontSize: 11 }}>{p}%</div>
            </div>
          );
        case 'custom':
          const Component = opts.render ? opts.render() : null;
          return opts.render ? <Component {...opts.property}/> : opts.text;
        default:
          return <>{opts.icon && (<div className={`${opts.icon} sb-item-icon`} style={{marginRight: 4}}></div>)}{opts.text}</>;
      }
    })();

    return (
      <div
        key={it.id}
        className="sb-item"
        onMouseEnter={(e)=>{
          return hoverService.requestHover({
            content: opts.tooltip || "",
            target: e.currentTarget as HTMLElement,
            position: "top"
          });
        }}
        onClick={(e) => onItemClick(e.nativeEvent, it.id)} // 调用父组件传入的回调
        style={{
          cursor: opts.onClick ? 'pointer' : 'default',
        }}
      >
        {opts.dot && (
          <span className="message-badge" aria-hidden="true"></span>
        )}
        {content}
      </div>
    );
  };

  return (
    <div className="sb-container">
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: '100%' }}>
        {left.map(renderItem)}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: '100%' }}>
        {right.map(renderItem)}
      </div>
    </div>
  );
};