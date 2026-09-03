import React, { ReactElement } from "react";
import { cronParser } from "@capital/core/common";

import { TaskResourceMetaData } from "./types";
import "./task-property-form.css"; // 引入样式文件

export const TaskPropertyForm = ({
  fileData,
  onUpdate,
  message
}: {
  fileData: TaskResourceMetaData;
  onUpdate: (data: Partial<TaskResourceMetaData>) => void;
  message: any
}): ReactElement => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    onUpdate({ [name]: name === 'enabled' ?  e.target.checked : value });
  };

  const viewCornNextRunTime = () => {
    if(!fileData.cron){
      message.error('请填写cron表达式');
      return;
    }
    try {
      const nextRuns = cronParser(fileData.cron, 5);
      const html = `
        <div>
          <label style="font-weight:bold;">任务下次运行时间</label>
          <br/>
          ${nextRuns.map((time, i) => `
            <div key="${i}" style="margin:4px 0;">
              ${time}
            </div>
          `).join('')}
        </div>
        `;
        // 弹出提示
        message.info(html);
    } catch (error) {
      message.error("Cron表达式格式错误，示例：0 0/5 * * * ? ");
    }
  }

  return (
    <div className="task-property-form">
      <form className="form-container">
        {/* 表单内容区域 */}
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
            <label className="form-label">Cron</label>
            <div className="form-control-wrapper" style={{display: 'flex'}}>
              <input
                type="text"
                name="cron"
                className="form-control"
                value={fileData.cron}
                onChange={handleChange}
                placeholder="请输入Cron表达式"
              />
              <button type="button" className="btn-next-runs" onClick={viewCornNextRunTime}>
                下次运行时间
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">任务名称</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="name"
                className="form-control"
                style={{width:250}}
                value={fileData.name}
                onChange={handleChange}
                placeholder="请输入任务名称"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">任务路径</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="path"
                className="form-control"
                style={{width:350}}
                value={fileData.path || ""}
                onChange={handleChange}
                placeholder="请输入任务路径"
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
                placeholder="请输入任务描述"
                rows={10}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};