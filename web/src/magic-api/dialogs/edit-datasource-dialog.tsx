import { Dialog } from '@MagicIdea/core/dialogs';
import { IJSONSchema } from '@MagicIdea/core/common/json-schema';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

export interface DatasourceFormData {
  name: string;
  key: string;
  url: string;
  username: string;
  password: string;
  driverClassName?: string;
  type?: string;
  maxRows?: number;
  extraParams?: string;
  [key: string]: any; // 允许扩展其他字段
}

export class EditDatasourceDialog extends Dialog<DatasourceFormData> {

  private formData: DatasourceFormData = {
    name: '',
    key: '',
    url: '',
    username: '',
    password: '',
  };

  constructor(title: string, schema: IJSONSchema, formData: any, onTest: (data: DatasourceFormData)=>void) {
    super({
      title: title,
      buttons: [],
      width: 680,
      modal: true
    });
    // 初始化全局数据
    this.formData = formData;
    this.renderNode(schema, formData, onTest);
  }

  protected renderNode(schema: IJSONSchema, formData: any, onTest: (data: DatasourceFormData)=>void): void {
    const uiSchema = {
      id: {
        'ui:widget': 'hidden' // 关键配置：将 id 字段设为隐藏组件
      },
      extraParams: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 4,
        },
      },
    };
    // 渲染表单组件，并设置提交事件处理函数
    this.renderContent(
      <Form
        className="rjsf magic-api-datasource-rjsf"
        schema={schema}
        formData={formData}
        uiSchema={uiSchema}
        validator={validator}
        onChange={(data) => {
          this.formData = data.formData;
        }}
        onSubmit={(data) => {
          this.close(data.formData);
        }}
      >
        <div className="form-buttons">
          <button type="submit" className="btn btn-info">
            确定
          </button>
          <button
            type="button"
            className="btn btn-info"
            onClick={() => onTest(this.formData)}
          >
            测试连接
          </button>
          <button
            type="button"
            className="btn btn-info"
            onClick={() => {
              this.close();
            }}
          >
            取消
          </button>
        </div>
      </Form>,
    );
  }

  static async openEditDialog(title: string, message: IJSONSchema, formData: any, onTest: (data: DatasourceFormData)=>void): Promise<DatasourceFormData | undefined> {
    const dialog = new EditDatasourceDialog(title, message, formData, onTest);
    // 调用父类的 open 方法（正确传递 Dialog 实例）
    const result = await Dialog.open<DatasourceFormData>(dialog);
    return result;
  }
}