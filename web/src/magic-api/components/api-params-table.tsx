import { ReactElement, useState, useCallback, useEffect, useRef } from "react";
import { ApiParamItem, ApiParamTableProps, UploadedFile } from "../magic-api-tree-types";

export const ApiParamTable = ({
  fileParams,
  onUpdate,
}: ApiParamTableProps): ReactElement => {
  // 初始化参数列表（从fileData中读取，无则用默认值）
  const [params, setParams] = useState<ApiParamItem[]>(
    fileParams || []
  );
  // 选中行下标，null = 无选中
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 存储每个行的文件上传结果（key: 行索引，value: 单文件/多文件数组）
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, UploadedFile | UploadedFile[]>>({});
  
  // 文件输入框ref，用于清空上传后的值
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const options = [
    { value: "String", label: "String" },
    { value: "Boolean", label: "Boolean" },
    { value: "Integer", label: "Integer" },
    { value: "Date", label: "Date" },
    { value: "Double", label: "Double" },
    { value: "Long", label: "Long" },
    { value: "Short", label: "Short" },
    { value: "Float", label: "Float" },
    { value: "Byte", label: "Byte" },
    { value: "MultipartFile", label: "MultipartFile" },
    { value: "MultipartFiles", label: "MultipartFiles" },
  ];

  useEffect(() => {
    // 监听参数列表变化
    setParams(fileParams || []);
    // 重置上传文件状态
    setUploadedFiles({});
    setSelectedIndex(null);
  }, [fileParams]);

  // 行点击：直接选中该行
  const handleRowClick = useCallback((_e: React.MouseEvent, index: number) => {
    setSelectedIndex(index);
  }, []);

  // ========== 工具栏操作：添加/删除行 ==========
  // 添加新行（默认空参数）
  const handleAddRow = useCallback(() => {
    const newRow: ApiParamItem = {
      name: null,
      value: null,
      description: null,
      required: false,
      dataType: "String",
      type: null,
      defaultValue: null,
      validateType: null,
      error: null,
      expression: null,
      children: null,
    };
    const newParams = [...params, newRow];
    setParams(newParams);
    // 同步更新到fileData
    onUpdate({ parameters: newParams });
  }, [params, onUpdate]);

  // 删除选中行（无选中时删除最后一行）
  const handleDeleteRow = useCallback(() => {
    if (params.length <= 0) return;
    let newParams: ApiParamItem[];
    let deletedIdx: number;
    if (selectedIndex !== null) {
      newParams = params.filter((_, idx) => idx !== selectedIndex);
      deletedIdx = selectedIndex;
      setSelectedIndex(null);
    } else {
      newParams = params.slice(0, -1);
      deletedIdx = params.length - 1;
    }
    setParams(newParams);
    // 删除对应行的上传文件记录
    const newUploadedFiles = { ...uploadedFiles };
    delete newUploadedFiles[deletedIdx];
    setUploadedFiles(newUploadedFiles);
    // 同步更新到fileData
    onUpdate({ parameters: newParams });
  }, [params, uploadedFiles, selectedIndex, onUpdate]);

  // ========== 表格单元格编辑事件 ==========
  // 文本/下拉框变更
  const handleCellChange = useCallback(
    (index: number, key: keyof ApiParamItem, value: any) => {
      const newParams = [...params];
      newParams[index] = { ...newParams[index], [key]: value };
      setParams(newParams);
      
      // 如果切换了数据类型，重置对应行的文件上传状态
      if (key === "dataType") {
        const newUploadedFiles = { ...uploadedFiles };
        delete newUploadedFiles[index];
        setUploadedFiles(newUploadedFiles);
        
        // 清空文件输入框的值
        if (fileInputRefs.current[index]) {
          fileInputRefs.current[index].value = "";
        }
        
        // 重置参数value
        newParams[index].value = null;
      }
      
      // 同步更新到fileData
      onUpdate({ parameters: newParams });
    },
    [params, uploadedFiles, onUpdate]
  );

  // 复选框变更（必填项）
  const handleCheckboxChange = useCallback(
    (index: number, checked: boolean) => {
      handleCellChange(index, "required", checked);
    },
    [handleCellChange]
  );

  // 处理文件选择事件
  const handleFileChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 转换FileList为自定义UploadedFile数组
    const fileList = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));

    const newUploadedFiles = { ...uploadedFiles };
    const newParams = [...params];
    
    // 根据数据类型区分单文件/多文件
    const dataType = newParams[index].dataType;
    if (dataType === "MultipartFile") {
      // 单文件：取第一个文件
      const singleFile = fileList[0];
      newUploadedFiles[index] = singleFile;
      // 将文件信息存入value（可根据需求调整存储格式）
      newParams[index].value = singleFile;
    } else if (dataType === "MultipartFiles") {
      // 多文件：存储所有文件
      newUploadedFiles[index] = fileList;
      newParams[index].value = fileList;
    }

    setUploadedFiles(newUploadedFiles);
    setParams(newParams);
    // 同步更新到fileData
    onUpdate({ parameters: newParams });
  }, [params, uploadedFiles, onUpdate]);

  // ========== 渲染参数值单元格 ==========
  const renderValueCell = useCallback((index: number, param: ApiParamItem) => {
    const { dataType } = param;
    
    // 判断是否显示文件上传框
    if (dataType === "MultipartFile" || dataType === "MultipartFiles") {
      const isMultiple = dataType === "MultipartFiles";
      
      return (
        <div className="file-upload-cell">
          {/* 文件上传输入框 */}
          <input
            type="file"
            className="form-control file-input"
            multiple={isMultiple}
            onChange={(e) => handleFileChange(index, e)}
            ref={(el) => (fileInputRefs.current[index] = el)}
          />
        </div>
      );
    }

    // 默认显示文本输入框
    return (
      <input
        type="text"
        className="form-control"
        value={param.value || ""}
        onChange={(e) => handleCellChange(index, "value", e.target.value)}
        placeholder="参数值"
      />
    );
  }, [uploadedFiles, handleFileChange, handleCellChange]);

  // ========== 渲染逻辑 ==========
  return (
    <div className="api-param-table-container">
      <div className="param-body">
        {/* 左侧迷你工具栏 */}
        <div className="param-toolbar">
          <button
            type="button"
            className="toolbar-btn add-btn"
            onClick={handleAddRow}
            title="添加参数行"
          >
            +
          </button>
          <button
            type="button"
            className="toolbar-btn delete-btn"
            onClick={handleDeleteRow}
            title={selectedIndex !== null ? "删除选中行" : "删除最后一行"}
            disabled={params.length <= 0}
          >
            -
          </button>
        </div>

        {/* 右侧参数表格 */}
        <div className="param-table-wrapper">
          <table className="param-table">
            <thead>
              <tr>
                <th className="col-required">必填</th>
                <th className="col-name">Key</th>
                <th className="col-value">Value</th>
                <th className="col-datatype">参数类型</th>
                <th className="col-default">默认值</th>
                <th className="col-validate">验证方式</th>
                <th className="col-expression">表达式/正则</th>
                <th className="col-error">验证说明</th>
                <th className="col-desc">描述</th>
              </tr>
            </thead>
            <tbody>
              {params.map((param, index) => (
                <tr key={`param-row-${index}`} className={`${selectedIndex === index ? 'select' : ''}`} onClick={(ev) => handleRowClick(ev, index)}>
                  {/* 必填复选框 */}
                  <td className="col-required">
                    <input
                      type="checkbox"
                      className="form-control"
                      checked={param.required}
                      onChange={(e) => handleCheckboxChange(index, e.target.checked)}
                    />
                  </td>

                  {/* 参数名 */}
                  <td className="col-name">
                    <input
                      type="text"
                      className="form-control"
                      value={param.name || ""}
                      onChange={(e) => handleCellChange(index, "name", e.target.value)}
                      placeholder="参数名"
                    />
                  </td>

                  {/* 参数值（动态渲染：文本框/文件上传框） */}
                  <td className="col-value">
                    {renderValueCell(index, param)}
                  </td>

                  {/* 数据类型（下拉框） */}
                  <td className="col-datatype">
                    <select
                      className="form-control"
                      value={param.dataType || "String"}
                      onChange={(e) => handleCellChange(index, "dataType", e.target.value)}
                    >
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* 默认值 */}
                  <td className="col-default">
                    <input
                      type="text"
                      className="form-control"
                      value={param.defaultValue || ""}
                      onChange={(e) => handleCellChange(index, "defaultValue", e.target.value)}
                      placeholder="默认值"
                    />
                  </td>

                  {/* 验证方式（下拉框） */}
                  <td className="col-validate">
                    <select
                      className="form-control"
                      value={param.validateType || ""}
                      onChange={(e) => handleCellChange(index, "validateType", e.target.value)}
                    >
                      <option value="">不验证</option>
                      <option value="pattern">正则验证</option>
                      <option value="expression">表达式验证</option>
                    </select>
                  </td>

                  {/* 表达式/正则 */}
                  <td className="col-expression">
                    <input
                      type="text"
                      className="form-control"
                      value={param.expression || ""}
                      onChange={(e) => handleCellChange(index, "expression", e.target.value)}
                      placeholder="正则/表达式"
                    />
                  </td>

                  {/* 验证说明 */}
                  <td className="col-error">
                    <input
                      type="text"
                      className="form-control"
                      value={param.error || ""}
                      onChange={(e) => handleCellChange(index, "error", e.target.value)}
                      placeholder="验证失败提示"
                    />
                  </td>

                  {/* 描述 */}
                  <td className="col-desc">
                    <input
                      type="text"
                      className="form-control"
                      value={param.description || ""}
                      onChange={(e) => handleCellChange(index, "description", e.target.value)}
                      placeholder="描述"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};