import { ReactElement, useState, useCallback, useEffect } from "react";
import { ApiParamItem, ApiParamTableProps } from "../magic-api-tree-types";

export const ApiOptionsTable = ({
  fileParams,
  options,
  onUpdate,
}: ApiParamTableProps & { options: any[] }): ReactElement => {
  // 初始化参数列表（从fileData中读取，无则用默认值）
  const [params, setParams] = useState<ApiParamItem[]>(
    fileParams || []
  );
  // 选中行下标，null = 无选中
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 系统选项列表：格式化options为下拉框所需结构（value/label/description/defaultValue）
  const sysOptions = options.map(item => { 
    return {
      value: item[0],
      label: `${item[0]} - ${item[1]}`,
      description: item[1],
      defaultValue: item[2],
    };
  });

  useEffect(() => {
    // 监听外部传入的fileParams变化，同步更新本地参数列表
    setParams(fileParams || []);
    setSelectedIndex(null);
  }, [fileParams]);

  // 行点击：直接选中该行
  const handleRowClick = useCallback((_e: React.MouseEvent, index: number) => {
    setSelectedIndex(index);
  }, []);

  // ========== 工具栏操作：添加/删除行 ==========
  // 添加新行（默认取第一个系统选项作为初始参数）
  const handleAddRow = useCallback(() => {
    const newRow: ApiParamItem = {
      name: sysOptions[0].value,
      value: sysOptions[0].defaultValue,
      description: sysOptions[0].description,
    };
    const newParams = [...params, newRow];
    setParams(newParams);
    // 同步更新到父组件
    onUpdate({ options: newParams });
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
    // 同步更新到父组件
    onUpdate({ options: newParams });
  }, [params, selectedIndex, onUpdate]);

  // ========== 下拉框选择事件（核心：联动赋值） ==========
  const handleNameSelect = useCallback(
    (index: number, selectedValue: string) => {
      const newParams = [...params];
      // 找到选中的系统选项
      const selectedOption = sysOptions.find(option => option.value === selectedValue);
      
      // 更新当前行数据：名称 + 联动赋值默认值和描述
      newParams[index] = {
        ...newParams[index],
        name: selectedValue, // 选中的Key值
        value: selectedOption ? selectedOption.defaultValue : null, // 联动默认值
        description: selectedOption ? selectedOption.description : null, // 联动描述
      };
      
      setParams(newParams);
      // 同步更新到父组件
      onUpdate({ options: newParams });
    },
    [params, sysOptions, onUpdate]
  );

  // ========== 单元格编辑事件（文本框） ==========
  // 处理参数值、描述的手动编辑
  const handleCellChange = useCallback(
    (index: number, key: keyof ApiParamItem, value: any) => {
      const newParams = [...params];
      newParams[index] = { ...newParams[index], [key]: value };
      setParams(newParams);
      // 同步更新到父组件
      onUpdate({ options: newParams });
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
                <th className="col-desc">描述</th>
              </tr>
            </thead>
            <tbody>
              {params.map((param, index) => (
                <tr key={`param-row-${index}`} className={`${selectedIndex === index ? 'select' : ''}`} onClick={(ev) => handleRowClick(ev, index)}>
                  {/* 参数名（替换为下拉框） */}
                  <td className="col-name">
                    <select
                      className="form-control"
                      value={param.name || ""}
                      onChange={(e) => handleNameSelect(index, e.target.value)}
                    >
                      {/* 系统选项列表 */}
                      {sysOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* 参数值（保持文本框，支持手动修改） */}
                  <td className="col-value">
                    <input
                      type="text"
                      className="form-control"
                      value={param.value || ""}
                      onChange={(e) => handleCellChange(index, "value", e.target.value)}
                      placeholder="参数值"
                    />
                  </td>

                  {/* 描述（保持文本框，支持手动修改） */}
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