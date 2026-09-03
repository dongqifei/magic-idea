import { ReactElement } from "react";
import { FunctionResourceMetaData } from "../magic-api-tree-types";
import { Tabs, TabPane } from "./Tabs"; // 引入选项卡组件
import { FunctionParamTable } from "./function-params-table"; // 引入参数表格组件
import "./api-property-form.css"; // 引入样式文件

export const FunctionPropertyForm = ({
  fileData,
  onUpdate,
}: {
  fileData: FunctionResourceMetaData;
  onUpdate: (data: Partial<FunctionResourceMetaData>) => void;
}): ReactElement => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  const returnTypeOptions = [
    { label: "数值", value: "java.lang.Number" },
    { label: "字符串", value: "java.lang.String" },
    { label: "集合", value: "java.util.Collection" },
    { label: "Map", value: "java.util.Map" },
    { label: "Object", value: '' },
  ];

  return (
    <div className="api-property-form">
      <form className="form-container">
        {/* 表单内容区域 */}
        <div className="form-content">
          {/* 请求方法 */}
          <div className="form-group">
            <label className="form-label">返回值类型</label>
            <div className="form-control-wrapper">
              <select
                name="returnType"
                className="form-control"
                value={fileData.returnType||''}
                onChange={handleChange}
              >
                {returnTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 函数名称输入 */}
          <div className="form-group">
            <label className="form-label">函数名称</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="name"
                className="form-control"
                style={{width:250}}
                value={fileData.name}
                onChange={handleChange}
                placeholder="请输入函数名称"
              />
            </div>
          </div>

          {/* 函数路径输入 */}
          <div className="form-group">
            <label className="form-label">函数路径</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="path"
                className="form-control"
                style={{width:350}}
                value={fileData.path || ""}
                onChange={handleChange}
                placeholder="请输入函数路径"
              />
            </div>
          </div>
        </div>
        <div className="param-table-section">
          <div className="form-control-wrapper">
            <Tabs defaultActiveKey="parameters">
              <TabPane tab="函数参数" tabKey="parameters">
                <FunctionParamTable key={fileData.id + "_params"} fileParams={fileData.parameters} onUpdate={onUpdate} />
              </TabPane>
              <TabPane tab="函数描述" tabKey="description">
                <div style={{width: "100%", height: "100%", padding: 4, boxSizing: "border-box"}}>
                  <textarea
                    className="form-control"
                    name="description"
                    style={{height: '100%'}}
                    value={fileData.description || ""}
                    onChange={handleChange}
                    placeholder="请输入函数描述（如函数功能、使用场景、注意事项等）"
                    rows={10}
                  />
                </div>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </form>
    </div>
  );
};