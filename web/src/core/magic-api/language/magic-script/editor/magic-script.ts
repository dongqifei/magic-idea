import * as monaco from "monaco-editor";
import { HighLightOptions } from "./high-light";
import CompletionItemProvider from "./completion";
import DefinitionProvider from "./definition";
import DocumentSymbolProvider from "./document-symbol";
import ReferenceProvider from "./reference";
import HoverProvider from "./hover";
import SignatureHelpProvider from "./signature";
import FoldingRangeProvider from "./folding";
import { initMybatis } from "./mybatis";
import { Parser } from "../parsing/parser";
import tokenizer from "../parsing/tokenizer";
import { TokenStream } from "../parsing/index";
import { ErrorEnhancer } from "../parsing/errors";
import JavaClass from "./java-class";

/**
 * 初始化 magicscript 语言
 */
export const initializeMagicScript = () => {

  const disposables = new Map();

  initMybatis();
  const language = "magicscript";
  // 注册语言
  monaco.languages.register({ id: language, aliases: ["MagicScript"], filenamePatterns: ["*.magic", "*.ms"] });
  // 设置语言选项
  monaco.languages.setLanguageConfiguration(language, {
    wordPattern: /(-?\d*\.\d\w*)|([^`~!#%^&*()\-=+[{\]}\\|;:'",.<>/?\s]+)/g,
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    onEnterRules: [
      {
        // e.g. /** | */
        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        afterText: /^\s*\*\/$/,
        action: {
          indentAction: monaco.languages.IndentAction.IndentOutdent,
          appendText: " * ",
        },
      },
      {
        // e.g. /** ...|
        beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        action: {
          indentAction: monaco.languages.IndentAction.None,
          appendText: " * ",
        },
      },
      {
        // e.g.  * ...|
        beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
        action: {
          indentAction: monaco.languages.IndentAction.None,
          appendText: "* ",
        },
      },
      {
        // e.g.  */|
        beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
        action: {
          indentAction: monaco.languages.IndentAction.None,
          removeText: 1,
        },
      },
    ],
    comments: {
      lineComment: "//",
      blockComment: ["/*", "*/"],
    },
    operators: [
      "<=",
      ">=",
      "==",
      "!=",
      "+",
      "-",
      "*",
      "/",
      "%",
      "&",
      "|",
      "!",
      "&&",
      "||",
      "?",
      ":",
      "++",
      "--",
      "+=",
      "-=",
      "*=",
      "/=",
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"""', close: '"""', notIn: ["string.multi"] },
      { open: "<where>", close: "</where>" },
      { open: "<if", close: ' test=""></if>' },
      { open: "<elseif", close: ' test=""></elseif>' },
      { open: "<else", close: '></else>' },
      { open: "<set>", close: "</set>" },
      { open: "<trim>", close: '</trim>' },
      { open: "<foreach", close: ' collection=""></foreach>' },
      { open: '"', close: '"', notIn: ["string"] },
      { open: "'", close: "'", notIn: ["string"] },
      { open: "/**", close: " */", notIn: ["string"] },
    ],
  });
  // 设置高亮
  monaco.languages.setMonarchTokensProvider(language, HighLightOptions);

  // 设置代码提示
  monaco.languages.registerCompletionItemProvider(
    language,
    CompletionItemProvider
  );
  // 设置折叠
  monaco.languages.registerFoldingRangeProvider(language, FoldingRangeProvider);
  // 设置参数提示
  monaco.languages.registerSignatureHelpProvider(
    language,
    SignatureHelpProvider
  );
  // 设置悬浮提示
  monaco.languages.registerHoverProvider(language, HoverProvider);

  // 设置引用查找
  monaco.languages.registerReferenceProvider(language, ReferenceProvider);

  // 设置定义跳转（仅用于给对象属性添加下划线）
  monaco.languages.registerDefinitionProvider(language, DefinitionProvider);

  // 注册文档符号
  monaco.languages.registerDocumentSymbolProvider(
    language,
    DocumentSymbolProvider
  );

  // 处理MagicScript代码检查
  const doMagicScriptValidate = async (model: any) => {
    if (!model) return;

    const value = model.getValue();
    let codeError: any[] = [];
    try {
      const parser = new Parser(new TokenStream(tokenizer(value)));
      await parser.parseEnv();
      codeError = parser.getErrors();
    } catch (e: any) {
      if (e?.span) {
        codeError.push(ErrorEnhancer.enhanceError(e.message, e.span));
      }
    }
    // 生成标记
    const markers = codeError.map(error => ({
      startLineNumber: error.span.getLine().lineNumber,
      endLineNumber: error.span.getLine().endLineNumber,
      startColumn: error.span.getLine().startCol,
      endColumn: error.span.getLine().endCol,
      message: error.message,
      severity: monaco.MarkerSeverity.Error,
    }));
    monaco.editor.setModelMarkers(model, "validate", markers);
  }
  
  // 监听所有模型内容变更
  monaco.editor.onDidCreateModel((model)=>{
    if (model.getLanguageId() === language) {
      doMagicScriptValidate(model);
      const offEvent = model.onDidChangeContent((event)=>{
          doMagicScriptValidate(model);
        });
      disposables.set(model, offEvent)
    }
  })

  // 类数据初始化完成后，重新校验所有已打开的 magicscript 模型
  JavaClass.onReady(() => {
    monaco.editor.getModels().forEach((model) => {
      if (model.getLanguageId() === language) {
        doMagicScriptValidate(model);
      }
    });
  });

  monaco.editor.onWillDisposeModel((model) => {
    if (model.getLanguageId() === language) {
      disposables.get(model).dispose();
    }
  });
};
