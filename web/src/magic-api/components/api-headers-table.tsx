import { ReactElement, useState, useCallback, useEffect } from "react";
import { ApiParamItem, ApiParamTableProps } from "../magic-api-tree-types";

export const ApiHeadersTable = ({
  fileParams,
  onUpdate,
}: ApiParamTableProps): ReactElement => {
  const [params, setParams] = useState<ApiParamItem[]>(fileParams || []);
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

  // 外部数据更新，清空选中
  useEffect(() => {
    setParams(fileParams || []);
    setSelectedIndex(null);
  }, [fileParams]);

  // 行点击：直接选中该行（包含点击控件区域）
  const handleRowClick = useCallback((_e: React.MouseEvent, index: number) => {
    // 点击任意位置都选中该行，再次点击同一行不取消（编辑场景不适合轻易取消选中）
    setSelectedIndex(index);
  }, []);

  // ========== 工具栏操作 ==========
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
    onUpdate({ headers: newParams });
  }, [params, onUpdate]);

  // 删除核心逻辑
  const handleDeleteRow = useCallback(() => {
    if (params.length <= 0) return;
    let newParams: ApiParamItem[];

    if (selectedIndex !== null) {
      // 有选中行：删除选中行
      newParams = params.filter((_, idx) => idx !== selectedIndex);
      setSelectedIndex(null);
    } else {
      // 无选中：删除最后一行
      newParams = params.slice(0, -1);
    }

    setParams(newParams);
    onUpdate({ headers: newParams });
  }, [params, selectedIndex, onUpdate]);

  // ========== 单元格编辑 ==========
  const handleCellChange = useCallback(
    (index: number, key: keyof ApiParamItem, value: any) => {
      const newParams = [...params];
      newParams[index] = { ...newParams[index], [key]: value };
      setParams(newParams);
      onUpdate({ headers: newParams });
    },
    [params, onUpdate]
  );

  const handleCheckboxChange = useCallback(
    (index: number, checked: boolean) => {
      handleCellChange(index, "required", checked);
    },
    [handleCellChange]
  );

  // ========== 渲染 ==========
  return (
    <div className="api-param-table-container">
      <div className="param-body">
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
                <tr
                  key={`param-row-${index}`}
                  className={`${selectedIndex === index ? 'select' : ''}`}
                  onClick={(ev) => handleRowClick(ev, index)}
                >
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