import { ReactElement, useState, useCallback, useEffect } from "react";
import { ApiParamItem, ApiParamTableProps } from "../magic-api-tree-types";

export const ApiPathsTable = ({
  fileParams,
  onUpdate,
}: ApiParamTableProps): ReactElement => {
  // 初始化参数列表（从fileData中读取，无则用默认值）
  const [params, setParams] = useState<ApiParamItem[]>(
    fileParams || []
  );
  // 选中行下标，null = 无选中
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
  ];

  useEffect(() => {
    // 监听参数列表变化
    setParams(fileParams || [])
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
      required: true,
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
    onUpdate({ paths: newParams });
  }, [params, onUpdate]);

  // 删除选中行（无选中时删除最后一行）
  const handleDeleteRow = useCallback(() => {
    if (params.length <= 0) return;
    let newParams: ApiParamItem[];
    if (selectedIndex !== null) {
      newParams = params.filter((_, idx) => idx !== selectedIndex);
      setSelectedIndex(null);
    } else {
      newParams = params.slice(0, -1);
    }
    setParams(newParams);
    // 同步更新到fileData
    onUpdate({ paths: newParams });
  }, [params, selectedIndex, onUpdate]);

  // ========== 表格单元格编辑事件 ==========
  // 文本/下拉框变更
  const handleCellChange = useCallback(
    (index: number, key: keyof ApiParamItem, value: any) => {
      const newParams = [...params];
      newParams[index] = { ...newParams[index], [key]: value };
      setParams(newParams);
      // 同步更新到fileData
      onUpdate({ paths: newParams });
    },
    [params, onUpdate]
  );

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
                <th className="col-name">Key</th>
                <th className="col-value">Value</th>
                <th className="col-datatype">参数类型</th>
                <th className="col-validate">验证方式</th>
                <th className="col-expression">表达式/正则</th>
                <th className="col-error">验证说明</th>
                <th className="col-desc">描述</th>
              </tr>
            </thead>
            <tbody>
              {params.map((param, index) => (
                <tr key={`param-row-${index}`} className={`${selectedIndex === index ? 'select' : ''}`} onClick={(ev) => handleRowClick(ev, index)}>
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

                  {/* 参数值 */}
                  <td className="col-value">
                    <input
                      type="text"
                      className="form-control"
                      value={param.value || ""}
                      onChange={(e) => handleCellChange(index, "value", e.target.value)}
                      placeholder="参数值"
                    />
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