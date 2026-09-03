import * as monaco from "monaco-editor";
import { parseJson } from "../parsing/parser";
import {
  LinqSelect,
  LambdaFunction,
  VarDefine,
  MethodCall,
  DestructuringVarDefine,
} from "../parsing/ast";

function getVariableNameLocation(
  nodeLine: any,
  fullText: any,
  varName: any,
  startCol: number,
) {
  // 计算变量名的开始和结束位置
  const varKeyword = varName; // 可能是 var/let/const
  const keywordIndex = fullText.indexOf(varKeyword);
  const keywordEndIndex = keywordIndex + varKeyword.length;

  if (keywordIndex === -1) {
    return {
      startColumn: 0,
      endColumn: 0,
      startLineNumber: 0,
      endLineNumber: 0,
    };
  }

  return {
    startColumn: keywordIndex + startCol,
    endColumn: keywordEndIndex + startCol,
    startLineNumber: nodeLine.lineNumber,
    endLineNumber: nodeLine.endLineNumber,
  };
}

// 基于AST转换代码结构为大纲数据
function convertASTToOutlineItems(ast: any, env: any, editor?: any): any[] {
  const items: any[] = [];
  ast.body?.forEach((node: any) => {
    if (node instanceof DestructuringVarDefine) {
      // 处理解构赋值
      const fullText = node.getSpan().getText();
      const defineType = node.defineType || "var";

      // 遍历解构的所有变量
      node.getIdentifiers().forEach((token: any) => {
        const varName = token.getText();
        const location = getVariableNameLocation(
          node.span.getLine(),
          fullText,
          varName,
          node.span.getLine().startCol,
        );

        items.push({
          name: `${varName}`,
          detail: `${varName}：${env[varName]}`,
          kind: monaco.languages.SymbolKind.Variable,
          range: location,
          selectionRange: location,
        });
      });
    } else if (node instanceof VarDefine) {
      // 处理普通变量定义
      const fullText = node.getSpan().getText();
      const varName = node.getVarName();
      const defineType = node.defineType || "var";

      if (
        node.expression &&
        (node.expression instanceof LambdaFunction ||
          node.expression instanceof MethodCall ||
          node.expression instanceof LinqSelect)
      ) {
        const location = getVariableNameLocation(
          node.expression.span.getLine(),
          fullText,
          varName,
          node.span.getLine().startCol,
        );
        const children = convertASTToOutlineItems(
          { body: node.expression?.expressionList },
          env,
          editor,
        );
        const javaType = env[varName];
        const isVariable =
          (javaType.startsWith("java.util") ||
            javaType.startsWith("java.lang")) &&
          node.expression instanceof MethodCall;
        items.push({
          name: `${varName}`,
          detail: `${varName}：${env[varName]}`,
          kind: isVariable
            ? monaco.languages.SymbolKind.Variable
            : monaco.languages.SymbolKind.Function,
          range: location,
          selectionRange: location,
          children,
        });
      } else {
        const location = getVariableNameLocation(
          node.span.getLine(),
          fullText,
          varName,
          node.span.getLine().startCol,
        );
        items.push({
          name: `${varName}`,
          detail: `${varName}：${env[varName]}`,
          kind: monaco.languages.SymbolKind.Variable,
          range: location,
          selectionRange: location,
        });
      }
    }
  });

  return items;
}

const DocumentSymbolProvider = {
  displayName: "MagicScript",
  provideDocumentSymbols: async function (model: any, token: any) {
    const code = model.getValue();
    const ast = await parseJson(code);
    // 根据 AST 生成大纲数据
    const outlineItems = convertASTToOutlineItems(ast, ast?.env);
    return outlineItems;
  },
};

export default DocumentSymbolProvider;
