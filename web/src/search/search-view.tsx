import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { debounce } from "lodash";
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MagicApiTreeService } from '@MagicIdea/magic-api/magic-api-tree-types';
import URI from '@MagicIdea/core/common/uri';
import { LabelProvider } from '@MagicIdea/core';
import { EditorOpenerOptions } from '@MagicIdea/editor/editor-manager';
import './search-view.less';

interface SearchResultItem {
  id: string;
  line: number;
  text: string;
}

interface GroupedResult {
  file: string;
  title: string;
  type?: string;
  path: string;
  fileKey: string;
  nodeInfo: any;
  matches: {
    line: number;
    code: string;
    id: string;
  }[];
}

export const SearchView:React.FC<{
  magicApiTreeService: MagicApiTreeService;
  labelProvider: LabelProvider
  onOpenFile: (searchTerm: string, uri: URI, options: EditorOpenerOptions) => void;
}> = ({magicApiTreeService, labelProvider, onOpenFile}) => {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<GroupedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  const listRef = useRef<List>(null);

  const debouncedSearch = useMemo(
    () => debounce(async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults([]);
        setTotalMatches(0);
        setTotalFiles(0);
        setSelectedMatchId(null);
        return;
      }

      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = await magicApiTreeService.search(keyword);
        if (response.code === 1) {
          const groupedResults = groupResultsByFile(response.data);
          setSearchResults(groupedResults);
          setTotalMatches(response.data.length);
          setTotalFiles(groupedResults.length);
          setSelectedMatchId(null);

          const expandedState: Record<string, boolean> = {};
          groupedResults.forEach(result => {
            expandedState[result.fileKey] = true;
          });
          setExpandedFiles(expandedState);
        }
      } catch (error) {
        console.error('搜索失败:', error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const groupResultsByFile = useCallback((data: SearchResultItem[]) => {
    const fileMap: Record<string, GroupedResult> = {};
    
    data.forEach(item => {
      const nodeInfo = magicApiTreeService.getNodeById(item.id);
      const path = magicApiTreeService.getNodeFullPath(item.id);
      
      if (nodeInfo) {
        const fileKey = nodeInfo.node.id;
        if (!fileMap[fileKey]) {
          fileMap[fileKey] = {
            file: nodeInfo.node.name,
            title: nodeInfo.node.name + ' (' + path + ')',
            type: nodeInfo.node.type,
            path: path,
            fileKey: fileKey,
            nodeInfo: nodeInfo,
            matches: []
          };
        }
        
        fileMap[fileKey].matches.push({
          line: item.line,
          code: item.text,
          id: item.id
        });
      }
    });
    
    return Object.values(fileMap);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const toggleFileExpand = (fileKey: string) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileKey]: !prev[fileKey]
    }));
    
    // 重置行高缓存
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.resetAfterIndex(0);
      }
    }, 0);
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const highlightSearchTerm = useCallback((text: string) => {
    if (!searchTerm) return text;
    
    const escapedSearchTerm = escapeRegExp(searchTerm);
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} className="highlight">{part}</span>
      ) : (
        part
      )
    );
  }, [searchTerm]);

  const openInEditor = useCallback((nodeInfo: any, matche: any) => {
    if(!matche || !nodeInfo) return;
    setSelectedMatchId(matche.id);
    const line = matche.line;
    const lineText = matche.code.indexOf(searchTerm);
    const startColumn = lineText === -1 ? 1 : lineText + 1;
    const column = lineText === -1 ? 1 : lineText + searchTerm.length + 1;
    onOpenFile(searchTerm, nodeInfo.node.uri, {
      selection: {
        selectionStartLineNumber: line,
        selectionStartColumn: startColumn,
        positionColumn: column,
        positionLineNumber: line,
        startLineNumber: line,
        endLineNumber: line,
        startColumn: startColumn,
        endColumn: column,
      }
    });
  }, [searchTerm]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const getItemSize = (index: number) => {
    const result = searchResults[index];
    const isExpanded = expandedFiles[result.fileKey];
    const fileHeight = 24; // 文件标题基础高度
    const matchHeight = 24; // 每个匹配项高度
    
    return isExpanded 
      ? fileHeight + (result.matches.length * matchHeight)
      : fileHeight;
  };

  const FileRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const result = searchResults[index];
    const isExpanded = expandedFiles[result.fileKey];
    const fileIconColor = labelProvider.getIconColor(result.nodeInfo.node)
    const fileIcon = labelProvider.getIcon(result.nodeInfo.node)

    return (
      <div style={style}>
        <div className="file-node">
          <div 
            className="file-header"
            title={result.title}
            onClick={() => toggleFileExpand(result.fileKey)}
          >
            <span
              className={`${isExpanded ? "expand-icon codicon codicon-chevron-down" : "expand-icon codicon codicon-chevron-right"
                }`}
            />
            <span
              className={`magic-resource-icon`}
              style={{ color: fileIconColor }}
            >{fileIcon}</span>
            <span className="file-name">
              {result.file}
            </span>
            <span className="file-path">
              {result.path}
            </span>
            <span className="match-count">({result.matches.length})</span>
          </div>
          
          {isExpanded && (
            <div className="matches-list">
              {result.matches.map((match, matchIndex) => (
                <div 
                  key={matchIndex} 
                  z-index={0}
                  className={`match-item ${selectedMatchId === match.id ? 'match-item-selected' : ''}`}
                  onClick={() => openInEditor(result.nodeInfo, match)}
                >
                  <span className="line-number">{match.line}</span>
                  <span className="code-text" title={match.code}>
                    {highlightSearchTerm(match.code)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="search-results-container">
      {loading && (
          <div className="loading-container magic-progress-container"></div>
        )
      }
      <div className="search-header">
        <div className="search-inputs">
          <input
            placeholder="在文件中查找..."
            value={searchTerm}
            onChange={handleSearchChange}
            className='form-control'
          />
        </div>
        
        <div className="search-stats">
          {totalFiles} 文件中有 {totalMatches} 个结果
        </div>
      </div>
      
      <div className="results-tree">
        {searchResults.length === 0 ? (
          <></>
        ) : (
          <AutoSizer>
            {({ height, width }) => (
              <List
                ref={listRef}
                height={height}
                itemCount={searchResults.length}
                itemSize={getItemSize}
                width={width}
                estimatedItemSize={24} // 预估行高，提高滚动条精度
              >
                {FileRow}
              </List>
            )}
          </AutoSizer>
        )}
      </div>
    </div>
  );
};

export default SearchView;