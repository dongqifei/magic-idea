import { Dialog } from '@MagicIdea/core/dialogs';
import { IJSONSchema } from '@MagicIdea/core/common/json-schema';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

export type LoginFormResult = {
  username: string;
  password: string;
};

export class MagicApiLoginDialog extends Dialog<LoginFormResult> {

  constructor(title: string, schema: IJSONSchema) {
    super({
      title: title,
      buttons: [],
      width: 400,
      modal: true
    });

    this.renderNode(schema);
  }

  protected renderNode(schema: IJSONSchema): void {
    const uiSchema = {
      password: {
        "ui:widget": "password"
      }
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
          <button type='submit' className='btn btn-info'>登录</button>
          <button type='button' className='btn btn-info' onClick={()=>{
            this.close();
          }}>取消</button>
        </div>
      </Form>
    );
  }

  static async openLoginDialog(title: string, message: IJSONSchema): Promise<LoginFormResult | undefined> {
    const dialog = new MagicApiLoginDialog(title, message);
    // 调用父类的 open 方法（正确传递 Dialog 实例）
    const result = await Dialog.open<LoginFormResult>(dialog);
    return result;
  }
}