import { Dialog } from '@MagicIdea/core/dialogs';
import { IJSONSchema } from '@MagicIdea/core/common/json-schema';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

export type EditGroupResult = {
  id: string
  name: string;
  path: string;
};

export class EditGroupDialog extends Dialog<EditGroupResult> {

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
      id: {
        'ui:widget': 'hidden' // 关键配置：将 id 字段设为隐藏组件
      },
      // name: {
      //   "ui:enableMarkdownInDescription": true,
      //   "ui:description": "Make text **bold** or *italic*. Take a look at other options [here](https://markdown-to-jsx.quantizor.dev/)."
      // }
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

  static async openEditGroupDialog(title: string, message: IJSONSchema): Promise<EditGroupResult | undefined> {
    const dialog = new EditGroupDialog(title, message);
    // 调用父类的 open 方法（正确传递 Dialog 实例）
    const result = await Dialog.open<EditGroupResult>(dialog);
    return result;
  }
}