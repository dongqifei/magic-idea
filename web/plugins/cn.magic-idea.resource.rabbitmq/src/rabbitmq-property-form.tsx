import React, { ReactElement } from "react";
import { RabbitMQResourceMetaData } from "./types";
import "./rabbitmq-property-form.css";

// 交换机类型选项
const EXCHANGE_TYPE_OPTIONS = [
  { text: 'Direct', value: 'direct' },
  { text: 'Topic', value: 'topic' },
  { text: 'Fanout', value: 'fanout' },
  { text: 'Headers', value: 'headers' }
];

export const RabbitMQPropertyForm = ({
  fileData,
  onUpdate,
}: {
  fileData: RabbitMQResourceMetaData;
  onUpdate: (data: Partial<RabbitMQResourceMetaData>) => void;
}): ReactElement => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | React.ChangeEvent<HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    onUpdate({ [name]: name === 'enabled' ? e.target.checked : value });
  };

  return (
    <div className="rabbitmq-property-form">
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
            <label className="form-label">队列</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="queue"
                className="form-control"
                style={{width:130}}
                value={fileData.queue || ""}
                onChange={handleChange}
                placeholder="请输入队列名称"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">交换机</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="exchange"
                className="form-control"
                style={{width:120}}
                value={fileData.exchange || ""}
                onChange={handleChange}
                placeholder="请输入交换机名称"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">交换机类型</label>
            <div className="form-control-wrapper">
              <select
                name="exchangeType"
                className="form-control"
                style={{width:80}}
                value={fileData.exchangeType || 'direct'}
                onChange={handleChange}
              >
                {EXCHANGE_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.text}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">路由键</label>
            <div className="form-control-wrapper">
              <input
                type="text"
                name="routingKey"
                className="form-control"
                style={{width:150}}
                value={fileData.routingKey || ""}
                onChange={handleChange}
                placeholder="请输入路由键"
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
                style={{width: "100%", height: "100%", resize: 'none'}}
                value={fileData.description || ""}
                onChange={handleChange}
                placeholder="请输入描述信息"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};