import { ReactElement } from "react";
import { ApiResourceMetaData } from "../magic-api-tree-types";

import { Tabs, TabPane } from "./Tabs"; // 引入选项卡组件
import { ApiParamTable } from "./api-params-table"; // 引入参数表格组件
import { ApiHeadersTable } from "./api-headers-table"; // 引入请求Headers表格组件
import { ApiPathsTable } from "./api-paths-table"; // 引入请求路径表格组件
import { ApiOptionsTable } from "./api-options-table"; // 引入请求选项表格组件
import { ApiRequestBodyEditor } from "./api-request-body"; 
import "./api-property-form.css"; // 引入样式文件

export const ApiFilePropertyForm = ({
  fileData,
  options,
  onUpdate,
}: {
  fileData: ApiResourceMetaData;
  options: any[];
  onUpdate: (data: Partial<ApiResourceMetaData>) => void;
}): ReactElement => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: value });
  };

  return (
    <div className="api-property-form">
      <form className="form-container">
        {/* 表单内容区域 */}
        <div className="form-content">
          {/* 请求方法 */}
          <div className="form-group">
            <label className="form-label">请求方法</label>
            <div className="form-control-wrapper">
              <select
                name="method"
                className="form-control"
                value={fileData.method}
                onChange={handleChange}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>
          </div>

          {/* 接口名称输入 */}
          <div className="form-group">
            <label className="form-label">接口名称</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="name"
                className="form-control"
                style={{width:250}}
                value={fileData.name}
                onChange={handleChange}
                placeholder="请输入接口名称"
              />
            </div>
          </div>

          {/* 接口路径输入 */}
          <div className="form-group">
            <label className="form-label">接口路径</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="path"
                className="form-control"
                style={{width:350}}
                value={fileData.path || ""}
                onChange={handleChange}
                placeholder="请输入接口路径"
              />
            </div>
          </div>
        </div>
        <div className="param-table-section">
          <div className="form-control-wrapper">
            <Tabs defaultActiveKey="parameters">
              <TabPane tab="请求参数" tabKey="parameters">
                <ApiParamTable key={fileData.id + "_params"} fileParams={fileData.parameters} onUpdate={onUpdate} />
              </TabPane>
              <TabPane tab="请求Header" tabKey="headers">
                <ApiHeadersTable key={fileData.id + "_headers"} fileParams={fileData.headers} onUpdate={onUpdate} />
              </TabPane>
              <TabPane tab="路径变量" tabKey="paths">
                <ApiPathsTable key={fileData.id + "_paths"} fileParams={fileData.paths} onUpdate={onUpdate} />
              </TabPane>
              <TabPane tab="请求Body" tabKey="requestBody">
                <ApiRequestBodyEditor 
                  key={fileData.id}
                  requestBody={fileData.requestBody} 
                  onUpdate={onUpdate} 
                />
              </TabPane>
              <TabPane tab="接口选项" tabKey="options">
                <ApiOptionsTable key={fileData.id + "_options"} fileParams={fileData.options} options={options} onUpdate={onUpdate} />
              </TabPane>
              <TabPane tab="接口描述" tabKey="description">
                <div style={{width: "100%", height: "100%", padding: 4, boxSizing: "border-box"}}>
                  <textarea
                    className="form-control"
                    name="description"
                    style={{height: '100%'}}
                    value={fileData.description || ""}
                    onChange={handleChange}
                    placeholder="请输入接口描述（如接口功能、使用场景、注意事项等）"
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