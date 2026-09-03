import React, { ReactElement, useEffect, useCallback, useState } from "react";
import { FileData, FileSystemService } from "../core/filesystem/file-system-types";
import { PropertyEditorService } from "./property-service";
import URI from "@MagicIdea/core/common/uri";
import { debounce } from "lodash";

interface PropertyContentFromProps {
  fsService: FileSystemService;
  propertyEditorService: PropertyEditorService;
  initialResourceUri: URI;
}

const PropertyContentFrom = ({
  fsService,
  propertyEditorService,
  initialResourceUri,
}: PropertyContentFromProps): ReactElement => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FileData | null>(null);

  const updateFileData = async (initialResourceUri: URI, data: Partial<FileData>) => { 
    // 同步UI
    setFormData(prev => prev ? { ...prev, ...data } : null);
    fsService.updateFileData(initialResourceUri, data);
  };

  const awarenessDebounce = debounce((initialResourceUri, formData, data: Partial<FileData>) => {
    // 从 data 中提取唯一的 key 和 value
    const [fieldKey, fieldValue] = Object.entries(data)[0]; // entries 返回 [[key, value]]，取第一个元素
    if (!fieldKey) return; // 避免无字段时的异常

    propertyEditorService.recordPropertyChange(
      { uri: initialResourceUri, fieldKey:fieldKey, oldValue: formData[fieldKey], newValue: fieldValue },
      async (data: Partial<FileData>) => {
        // 同步UI
        updateFileData(initialResourceUri, data);
      }
    );
  }, 300, { leading: false, trailing: true });

  useEffect(() => {
    // 初始化加载状态
    setLoading(true);
    const loadFile = async () => {
      if (!initialResourceUri) {
        setFormData(null);
        return;
      }
      try {
        const fileData = await fsService.readFile(initialResourceUri);
        if(fileData) {
          setFormData(fileData); // 深拷贝避免污染源数据
        }
      } catch (error) {
        console.error("加载文件失败:", error);
        setFormData(null);
      }finally{
        setLoading(false);
      }
    };
    loadFile();

    // 监听文件数据变化
    const updatedEvent = fsService.onPropertyUpdatedEvent((data) => {
      if(data.uri?.isEqual(initialResourceUri)) {
        // 触发属性变更记录
        // propertyEditorService.recordPropertyChange(
        //   { uri: initialResourceUri, fieldKey:fieldKey, oldValue: formData[fieldKey], newValue: fieldValue },
        //   async (data: Partial<FileData>) => {
        //     // 同步UI
        //     updateFileData(initialResourceUri, data);
        //   }
        // );
        // 同步UI
        updateFileData(initialResourceUri, data);
      }
    });

    return () => {
      updatedEvent.dispose();
    };
  }, [initialResourceUri]);

  
  

  // 表单更新回调
  const handleFormUpdate = useCallback((data: Partial<FileData>) => {
    if (!formData || !initialResourceUri) return;
    // 节流处理
    awarenessDebounce(initialResourceUri, formData, data);
    
    // 不可变更新：保证React状态纯净，触发UI自动刷新
    updateFileData(initialResourceUri, data);
  }, [initialResourceUri, formData, setFormData]);

  if(loading) return <div className="magic-progress-container progress-ten"></div>

  if (!formData) return <div className="property-empty">该资源无需进行属性配置。</div>;

  const contributor = fsService.getPropertyProvider(initialResourceUri, formData);
  
  if (!contributor) return <div className="property-empty">该资源暂不支持属性配置。</div>;
  
  return contributor.getFormComponent(formData, handleFormUpdate);
};

export default PropertyContentFrom;