import * as monaco from "@capital/shared/monaco-editor";
import { Beautifier } from "./javascript/beautifier";

export function registerMagicScriptFormatter() {
  monaco.languages.registerDocumentFormattingEditProvider("magicscript", {
    provideDocumentFormattingEdits(model) {
      try {
        const beautifier = new Beautifier(model.getValue());
        return [{
          range: model.getFullModelRange(),
          text: beautifier.beautify()
        }];
      } catch (e) {
        console.error("格式化失败:", e);
        return [
          {
            range: model.getFullModelRange(),
            text: model.getValue()
          }
        ];
      }
    }
  });
}

registerMagicScriptFormatter();

// regEditorAction({
//   id: "code-formatter",
//   name: "格式化文档",
//   group: "code-formatter",
//   order: 1,
//   run: async (editor, monaco) => {
//     // 获取当前编辑器实例和模型
//     const model = editor.getModel();
//     if (!model) return;
//   },
// });