import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Tree, NodeRendererProps, NodeApi } from "react-arborist";
import Form from '@rjsf/core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { debounce, isEqual } from 'lodash';
import { PreferenceService } from "@MagicIdea/core/preferences/preference-service";
import { PreferenceProperty } from "@MagicIdea/core/preferences/preference-types";
import { PreferenceTreeNode, PreferenceTreeGenerator } from "../preferences/utils/preference-tree-generator";

import './preference.css'

/**
 * NodeRenderer - 保持原有渲染风格
 */
const NodeRenderer = ({ node, style }: NodeRendererProps<PreferenceTreeNode>) => {
  const isSection = node.data.type === 'section';
  const hasMatch = node.data.matchKeyword;

  const renderLabel = () => {
    if (!hasMatch) return node.data.label;
    const regex = new RegExp(`(${hasMatch})`, 'gi');
    return (
      <span>
        {node.data.label.split(regex).map((part, idx) =>
          part.toLowerCase() === hasMatch.toLowerCase() ? (
            <span key={idx} className="match-highlight">{part}</span>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </span>
    );
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSection) node.toggle();
    if(node.isLeaf){
      node.select();
    }
  };

  return (
    <div
      style={style}
      tabIndex={-1}
      className={`tree-node ${node.isSelected ? 'selected' : ''} ${isSection ? 'section-node' : 'category-node'} ${hasMatch ? 'matched-node' : ''}`}
    >
      <div className="node-content" onClick={handleNodeClick}>
        {isSection ? (
          <span
            className={`tree-node-icon codicon ${node.isOpen ? "codicon-chevron-down" : "codicon-chevron-right"}`}
            style={{ marginRight: 4 }}
          />
        ) : (
          <span style={{ marginLeft: node.level === 0 ? 20 : 6 }} />
        )}
        {renderLabel()}
        {node.data.settings && (
          <span className="node-count">({node.data.settings.length})</span>
        )}
      </div>
    </div>
  );
};

export interface PreferenceViewProps {
  preferenceService: PreferenceService;
  treeGenerator: PreferenceTreeGenerator;
  // 回调函数，同步变更数据到父组件（每次 changedValues 变化都会回调）
  onValuesChanged?: (changedValues: Record<string, any>) => void;
}

export const PreferenceView: React.FC<PreferenceViewProps> = ({
  preferenceService,
  treeGenerator,
  onValuesChanged,
}) => {
  // 树与设置数据
  const [treeData, setTreeData] = useState<PreferenceTreeNode[]>([]);
  const [originalTreeData, setOriginalTreeData] = useState<PreferenceTreeNode[]>([]);
  const [allSettings, setAllSettings] = useState<{
    anchorPath: string;
    label: string;
    schema: RJSFSchema;
    data: PreferenceProperty;
  }[]>([]);

  // 选中项（不再使用 anchor/锚点滚动，而是直接展示该 section 的表单）
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);

  // 搜索与防抖
  const [searchValue, setSearchValue] = useState<string>('');
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

  // 本地缓存变更
  const [changedValues, setChangedValues] = useState<Record<string, any>>({});

  // 当 changedValues 改变时回调父组件（保持原行为）
  useEffect(() => {
    if (onValuesChanged) onValuesChanged(changedValues);
  }, [changedValues, onValuesChanged]);

  // 初始化 tree 与 allSettings
  useEffect(() => {
    const tree = treeGenerator.generateTree();
    setOriginalTreeData(tree);
    setTreeData(tree);

    const displaySettings = treeGenerator.getAllDisplaySettingsWithAnchors();
    const allSettingsData: typeof allSettings = [];

    displaySettings.forEach(item => {
      const properties: Record<string, any> = {};
      const initialData: Record<string, any> = {};

      item.settings.forEach(settingKey => {
        const prop = preferenceService.getProperty(settingKey);
        if (prop) {
          properties[settingKey] = prop;
          initialData[settingKey] = preferenceService.get(settingKey);
        }
      });

      allSettingsData.push({
        anchorPath: item.anchorPath,
        label: item.label,
        schema: {
          title: item.label,
          type: 'object',
          properties,
          required: item.settings.filter(key =>
            preferenceService.getProperty(key)?.required
          )
        },
        data: initialData
      });
    });

    setAllSettings(allSettingsData);

    // 默认选中：commonly-used 或第一个 section
    const defaultSelected = tree.find(n => n.id === 'commonly-used' || n.anchorPath === 'commonly-used');
    if (defaultSelected && defaultSelected.anchorPath) {
      setSelectedAnchor(defaultSelected.anchorPath);
    } else if (allSettingsData.length > 0) {
      setSelectedAnchor(allSettingsData[0].anchorPath);
    }
  }, [preferenceService, treeGenerator]);

  // helper: 递归查找节点 id（用于树的 selection）
  const findNodeIdByAnchor = useCallback((nodes: PreferenceTreeNode[], anchor: string | null): string | null => {
    if (!anchor) return null;
    for (const n of nodes) {
      if (n.anchorPath === anchor) return n.id;
      if (n.children && n.children.length) {
        const found = findNodeIdByAnchor(n.children as PreferenceTreeNode[], anchor);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // 计算当前树选中 id
  const selectedNodeId = useMemo(() => {
    if (!selectedAnchor) return '';
    return findNodeIdByAnchor(treeData, selectedAnchor) || '';
  }, [treeData, selectedAnchor, findNodeIdByAnchor]);

  // 搜索（防抖）
  const runSearch = useCallback((val: string) => {
    if (!val || val.trim() === '') {
      setTreeData(originalTreeData);
      return;
    }
    const matchedTree = treeGenerator.searchNodes(val);
    setTreeData(matchedTree);

    if (matchedTree.length > 0) {
      // 自动选中第一个匹配的 section（如果有 anchorPath）
      const first = matchedTree[0];
      if (first.anchorPath) {
        setSelectedAnchor(first.anchorPath);
      }
    }
  }, [originalTreeData, treeGenerator]);

  // 创建一次 debounced 函数
  useEffect(() => {
    debouncedSearchRef.current = debounce(runSearch, 200);
    return () => {
      debouncedSearchRef.current?.cancel();
      debouncedSearchRef.current = null;
    };
  }, [runSearch]);

  // 监听 searchValue
  useEffect(() => {
    debouncedSearchRef.current?.(searchValue);
  }, [searchValue]);

  // 处理树手动选择
  const handleSelect = (nodes: NodeApi<PreferenceTreeNode>[]) => {
    if (nodes && nodes.length > 0 && nodes[0].data) {
      const selected = nodes[0].data as PreferenceTreeNode;
      // 若该节点对应 section，显示对应表单；否则如果是 category，则只切换到该 category（无表单）
      if (selected.anchorPath) {
        setSelectedAnchor(selected.anchorPath);
      } else {
        // 若是没有 anchorPath 的分类节点，尝试选择它的第一个子项（如果存在）
        if (selected.children && selected.children.length > 0) {
          const child = selected.children[0] as PreferenceTreeNode;
          if (child.anchorPath) setSelectedAnchor(child.anchorPath);
        }
      }
    }
  };

  // 表单变更：只更新本地 changedValues（不直接写入 preferenceService）
  const handleFormChange = ({ formData }: any, anchorPath: string) => {
    // 把变更字段加入 changedValues（只记录不同于当前 persisted 值的字段）
    Object.entries(formData).forEach(([key, value]) => {
      const originalValue = preferenceService.get(key);
      if (!isEqual(value, originalValue)) {
        setChangedValues(prev => ({ ...prev, [key]: value }));
      } else {
        setChangedValues(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    });

    // 更新右侧表单显示（本次 section 的 data）
    setAllSettings(prev => prev.map(section => {
      if (section.anchorPath === anchorPath) {
        if (isEqual(section.data, formData)) return section;
        return { ...section, data: formData };
      }
      return section;
    }));
  };

  // 当前选中 section 的数据
  const currentSection = allSettings.find(s => s.anchorPath === selectedAnchor) || null;

  return (
    <div className="preference-view preference-idea-like">
      <div className="preference-tree" aria-hidden={false}>
        <div className="search-container">
          <input
            value={searchValue}
            className="form-control search-input"
            type="text"
            placeholder="搜索配置项"
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <Tree
          className="tree-container"
          data={treeData}
          height={413}
          width={220}
          onSelect={handleSelect}
          openByDefault={false}
          selection={selectedNodeId || ''}
        >
          {NodeRenderer}
        </Tree>
      </div>

      <div className="preference-form">
        {currentSection && currentSection.schema && Object.keys(currentSection.schema.properties || {}).length > 0 ? (
            <Form
              schema={currentSection.schema}
              validator={validator}
              formData={currentSection.data}
              onChange={(data) => handleFormChange(data, currentSection.anchorPath)}
              onError={(errors) => console.error('Form errors:', errors)}
            >
              <div style={{ display: 'none' }} />
            </Form>
          ) : (
            <div className="empty-state">该项暂无可配置的设置</div>
          )}
      </div>
    </div>
  );
};