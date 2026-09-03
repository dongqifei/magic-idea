import { inject, injectable } from "inversify";
import { PreferenceService } from "@MagicIdea/core/preferences/preference-service";
import { PreferenceLayout, PreferenceLayoutProvider } from './preference-layout';

export interface PreferenceTreeNode {
  id: string;
  label: string;
  type: 'section' | 'category';
  anchorPath: string;         // 锚点路径
  parent?: PreferenceTreeNode;
  children?: PreferenceTreeNode[];
  settings?: string[];         // 解析后的完整配置项（仅用于统计）
  originalSettings?: string[]; // 原始通配符配置（如 ["editor.*"]）
  displaySettings?: string[];  // 实际渲染的配置项（叶子节点才赋值）
  matchKeyword?: string;       // 搜索匹配的关键词（高亮用）
}

@injectable()
export class PreferenceTreeGenerator {
  constructor(
    @inject(PreferenceService) private preferenceService: PreferenceService,
    @inject(PreferenceLayoutProvider) private layoutProvider: PreferenceLayoutProvider
  ) {}

  /**
   * 生成完整树（父节点仅统计数量，叶子节点才渲染配置项）
   */
  generateTree(): PreferenceTreeNode[] {
    const commonlyUsed = this.layoutProvider.getCommonlyUsedLayout();
    const resolvedCommonlyUsed = this.resolveLayoutNode(commonlyUsed);
    const defaultLayout = this.layoutProvider.getLayout()
      .map(layout => this.resolveLayoutNode(layout));
    return [resolvedCommonlyUsed, ...defaultLayout];
  }

  /**
   * 解析布局节点（核心优化：统计/渲染分离）
   */
  /**
   * 解析布局节点（核心优化：分组逻辑）
   */
  private resolveLayoutNode(layout: PreferenceLayout, parent?: PreferenceTreeNode): PreferenceTreeNode {
    const resolvedSettings = this.resolveSettings(layout.settings || []);
    const anchorPath = parent 
      ? `${parent.anchorPath ? parent.anchorPath + '-' : ''}${layout.id}`
      : layout.id;

    // 检查是否是父节点（有子节点）
    const hasChildren = layout.children && layout.children.length > 0;
    const type = hasChildren ? 'section' : 'category';
    
    const node: PreferenceTreeNode = {
      id: layout.id,
      label: layout.label,
      type,
      parent,
      originalSettings: layout.settings,
      settings: resolvedSettings, // 所有配置项（包括子节点的）
      displaySettings: hasChildren ? [] : resolvedSettings, // 叶子节点才直接显示配置
      anchorPath
    };

    if (hasChildren && layout.children) {
      // 解析子节点
      const childNodes: PreferenceTreeNode[] = [];
      const childResolvedSettings = new Set<string>();
      
      layout.children.forEach(child => {
        const childNode = this.resolveLayoutNode(child, node);
        childNodes.push(childNode);
        
        // 收集子节点的配置项
        if (childNode.settings) {
          childNode.settings.forEach(setting => childResolvedSettings.add(setting));
        }
      });

      node.children = childNodes;
      
      // 核心优化：父节点保留未被任何子节点覆盖的配置项
      const unmatchedSettings = resolvedSettings.filter(
        setting => !childResolvedSettings.has(setting)
      );
      
      if (unmatchedSettings.length > 0) {
        // 创建虚拟子节点来承载未匹配的配置项
        const virtualNode: PreferenceTreeNode = {
          id: `${layout.id}.others`,
          label: '其他',
          type: 'category',
          parent: node,
          settings: unmatchedSettings,
          displaySettings: unmatchedSettings,
          anchorPath: `${anchorPath}-others`
        };
        
        node.children.push(virtualNode);
        // 更新父节点的settings，移除这些配置项（因为它们现在属于虚拟节点）
        node.settings = [...childResolvedSettings, ...unmatchedSettings];
      } else {
        // 所有配置项都被子节点覆盖
        node.settings = Array.from(childResolvedSettings);
      }
    }

    return node;
  }

  /**
   * 解析通配符（仅用于统计）
   */
  private resolveSettings(settings: string[]): string[] {
    if (settings.length === 0) return [];

    const allKeys = this.preferenceService.getAllKeys();
    const resolved: string[] = [];

    for (const pattern of settings) {
      if (pattern.includes('*')) {
        const regex = this.createRegExp(pattern);
        resolved.push(...allKeys.filter(key => regex.test(key)));
      } else {
        if (allKeys.includes(pattern)) {
          resolved.push(pattern);
        }
      }
    }

    return [...new Set(resolved)];
  }

  /**
   * 通配符转正则
   */
  private createRegExp(pattern: string): RegExp {
    return new RegExp(`^${pattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`);
  }

  /**
   * 模糊搜索节点（核心优化：支持label/配置项模糊匹配）
   */
  searchNodes(keyword: string): PreferenceTreeNode[] {
    if (!keyword || keyword.trim() === '') {
      return this.generateTree(); // 空关键词返回完整树
    }

    const tree = this.generateTree();
    const lowerKeyword = keyword.toLowerCase().trim();
    const matchedNodes: PreferenceTreeNode[] = [];

    // 递归搜索匹配节点
    const traverse = (node: PreferenceTreeNode): PreferenceTreeNode | null => {
      // 匹配条件：label包含关键词 或 配置项包含关键词
      const labelMatch = node.label.toLowerCase().includes(lowerKeyword);
      const settingMatch = node.settings?.some(key => 
        key.toLowerCase().includes(lowerKeyword)
      ) || false;

      // 子节点匹配检查
      let matchedChildren: PreferenceTreeNode[] = [];
      if (node.children) {
        matchedChildren = node.children
          .map(child => traverse(child))
          .filter((child): child is PreferenceTreeNode => child !== null);
      }

      // 当前节点匹配 或 子节点匹配 → 保留节点
      if (labelMatch || settingMatch || matchedChildren.length > 0) {
        const clonedNode = { ...node };
        // 标记匹配关键词（用于高亮）
        if (labelMatch) clonedNode.matchKeyword = keyword;
        // 仅保留匹配的子节点
        clonedNode.children = matchedChildren.length > 0 ? matchedChildren : undefined;
        return clonedNode;
      }

      return null;
    };

    // 遍历根节点
    tree.forEach(rootNode => {
      const matchedRoot = traverse(rootNode);
      if (matchedRoot) {
        matchedNodes.push(matchedRoot);
      }
    });

    return matchedNodes;
  }

  // 原有方法保留（仅修改依赖displaySettings的逻辑）
  findNodeById(nodes: PreferenceTreeNode[], id: string): PreferenceTreeNode | undefined {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  findNodeByPreferenceKey(key: string): PreferenceTreeNode | undefined {
    const tree = this.generateTree();
    for (const node of tree) {
      const found = this.searchNodeByKey(node, key);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  private searchNodeByKey(node: PreferenceTreeNode, key: string): PreferenceTreeNode | undefined {
    // 改为匹配displaySettings（仅叶子节点有值）
    if (node.displaySettings?.includes(key)) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = this.searchNodeByKey(child, key);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  /**
   * 获取所有渲染用配置项（仅叶子节点）
   */
  getAllDisplaySettingsWithAnchors(): {
    anchorPath: string;
    label: string;
    settings: string[];
  }[] {
    const tree = this.generateTree();
    const result: {anchorPath: string; label: string; settings: string[]}[] = [];
    
    const traverse = (node: PreferenceTreeNode) => {
      // 仅叶子节点（category）才收集渲染配置
      if (node.type === 'category' && node.displaySettings && node.anchorPath) {
        result.push({
          anchorPath: node.anchorPath,
          label: node.label,
          settings: node.displaySettings
        });
      }
      if (node.children) {
        node.children.forEach(child => traverse(child));
      }
    };
    
    tree.forEach(node => traverse(node));
    return result;
  }
}