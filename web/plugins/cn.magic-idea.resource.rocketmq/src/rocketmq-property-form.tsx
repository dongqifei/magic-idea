import React, { ReactElement } from "react";

import { RocketMQResourceMetaData } from "./types";
import "./rocketmq-property-form.css";

export const RocketMQPropertyForm = ({
  fileData,
  onUpdate,
}: {
  fileData: RocketMQResourceMetaData;
  onUpdate: (data: Partial<RocketMQResourceMetaData>) => void;
}): ReactElement => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    onUpdate({ [name]: name === 'enabled' ? e.target.checked : value });
  };

  return (
    <div className="rocketmq-property-form">
      <form className="form-container">
        <div className="form-content">
          <div className="form-group">
            <label className="form-label">启用</label>
            <div className="form-control-wrapper">
              <input
                type="checkbox"
                name="enabled"
                className="form-control"
                checked={fileData.enabled}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">主题</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="topic"
                className="form-control"
                style={{width:250}}
                value={fileData.topic}
                onChange={handleChange}
                placeholder="请输入Topic名称"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">标签</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="tags"
                className="form-control"
                style={{width:200}}
                value={fileData.tag || ""}
                onChange={handleChange}
                placeholder="请输入消息队列标签"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">名称</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="name"
                className="form-control"
                style={{width:250}}
                value={fileData.name}
                onChange={handleChange}
                placeholder="请输入名称"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">路径</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="path"
                className="form-control"
                style={{width:350}}
                value={fileData.path || ""}
                onChange={handleChange}
                placeholder="请输入路径"
              />
            </div>
          </div>
        </div>
        <div className="param-table-section">
          <div className="form-control-wrapper">
            <div style={{width: "100%", height: "100%", padding: 4, boxSizing: "border-box"}}>
              <textarea
                className="form-control"
                name="description"
                style={{height: '100%'}}
                value={fileData.description || ""}
                onChange={handleChange}
                placeholder="请输入描述信息"
                rows={10}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
