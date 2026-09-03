import { Dialog } from '@MagicIdea/core/dialogs';
import { IJSONSchema } from '@MagicIdea/core/common/json-schema';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

export type EditProjectResult = {
  id: string
  name: string;
  url: string;
  webPath: string;
  proxyEnable: boolean;
};

export class MagicApiEditProjectDialog extends Dialog<EditProjectResult> {

  constructor(title: string, schema: IJSONSchema) {
    super({
      title: title,
      buttons: [],
      width: 600,
      modal: true
    });

    this.renderNode(schema);
  }

  protected renderNode(schema: IJSONSchema): void {
    const uiSchema = {
      id: {
        'ui:widget': 'hidden' // 关键配置：将 id 字段设为隐藏组件
      },
    };
    // 渲染表单组件，并设置提交事件处理函数
    this.renderContent(
      <Form
        schema={schema} 
        uiSchema={uiSchema} 
        validator={validator} 
        onSubmit={(data)=>{
          this.close(data.formData);
        }}
      >
        <div className="form-buttons">
          <button type='submit' className='btn btn-info'>提交</button>
          <button type='button' className='btn btn-info' onClick={()=>{
            this.close();
          }}>取消</button>
        </div>
      </Form>
    );
  }

  static async openEditProjectDialog(title: string, message: IJSONSchema): Promise<EditProjectResult | undefined> {
    const dialog = new MagicApiEditProjectDialog(title, message);
    // 调用父类的 open 方法（正确传递 Dialog 实例）
    const result = await Dialog.open<EditProjectResult>(dialog);
    return result;
  }
}