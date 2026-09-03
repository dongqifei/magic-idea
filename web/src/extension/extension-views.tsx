import React from 'react';
import { Extension } from './extension-types';

import './extension-views.less'; 

export const ExtensionView: React.FC<{
  plugins: Extension[];
  onInstallPlugin: (pluginName: string) => void;
  onUnInstallPlugin: (pluginName: string) => void;
}> = ({ plugins, onInstallPlugin, onUnInstallPlugin }) => { 
  const renderPluginItem = (plugin: Extension) => (
    <div className="extension-item" key={plugin.name}>
      <div className="extension-info">
        <div className="extension-icon">
          <img src={plugin.icon} alt={plugin.name} />
        </div>
        <div className="extension-details">
          <div className="extension-name">{plugin.label}</div>
          <div className="extension-desc">{plugin.description}</div>
        </div>
      </div>
      <div className="extension-actions">
        <button className={`action-btn ${plugin.isInstalled ? 'uninstall' : 'install'}`} onClick={()=>{
          plugin.isInstalled ? onUnInstallPlugin(plugin.name) : onInstallPlugin(plugin.name)
        }}>
          {plugin.isInstalled ? '卸载' : '安装'}
        </button>
      </div>
    </div>
  )
  return ( 
    <div className="extension-view"> 
      {plugins.length === 0 ? (
        <div className="empty-state">暂无扩展</div>
      ) : (
        plugins.map(plugin => renderPluginItem(plugin))
      )}
    </div>
  );
};