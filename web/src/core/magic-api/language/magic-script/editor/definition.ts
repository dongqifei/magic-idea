import * as monaco from "monaco-editor";
import JavaClass from './java-class'

const DefinitionProvider = {
  provideDefinition(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
  ): monaco.languages.ProviderResult<monaco.languages.Definition> {
    // 获取鼠标所在位置
    const lineNumber = position.lineNumber;
    const column = position.column;
    //获取当前行文本
    const text = model.getLineContent(lineNumber);
    const importResourceRegex = /^import\s+["'](@[^"']+)["']\s+as\s+(\w+)\s*/;
    const match = importResourceRegex.exec(text);
    if (match) {
      const resourcePath = match[1];
      const fullMatch = match[0];
      const matchStart = match.index;

      // 找到路径在匹配串中的位置
      const pathStart = matchStart + fullMatch.indexOf(resourcePath) + 1;
      const pathEnd = pathStart + resourcePath.length;

      if (column >= pathStart && column <= pathEnd) {
        const originSelectionRange = new monaco.Range(
          lineNumber,
          pathStart,
          lineNumber,
          pathEnd,
        );
        // 获取引用的资源路径
        const targetUri = JavaClass.findResouceByPath(resourcePath);
        if(!targetUri){
          return [];
        }
        const targetSelectionRange = new monaco.Range(1, 1, 1, 1);
        const targetRange = new monaco.Range(1, 1, 8, 1);
        const link = {
          uri: targetUri.uri,
          range: targetRange,
          targetSelectionRange,
          originSelectionRange,
        };
        // 返回跳转定义链接
        return [link];
      }
    }

    const word = model.getWordAtPosition(position);
    if (!word) return null;
    const wordText = word.word;

    const targets = [];
    const lineCount = model.getLineCount();
    for (let i = 1; i <= lineCount; i++) {
      const text = model.getLineContent(i);

      // 支持 import xx.xxx.xxx.xxx.UserService;
      const javaImportMatch = text.match(/^import\s+([a-zA-Z0-9_.]+)\s*;/);
      if (javaImportMatch) {
        const fullClass = javaImportMatch[1]; // xx.xxx.xxx.xxx.UserService
        // 提取类名（最后一个点后的部分）
        const className = fullClass.split(".").pop();
        if (className === wordText) {
          const classIndex = text.lastIndexOf(className);
          targets.push({
            uri: model.uri,
            range: new monaco.Range(
              i,
              classIndex + 1,
              i,
              classIndex + className.length + 1
            ),
          });
        }
      }

      // import as 别名
      const importRegex = /import\s+['"][^'"]+['"]\s+as\s+(\w+)/;
      const asMatch = importRegex.exec(text);
      if (asMatch && asMatch[1] === wordText) {
        const alias = asMatch[1];
        const aliasStartIndex = asMatch.index + asMatch[0].lastIndexOf(alias);
        
        targets.push({
          uri: model.uri,
          range: new monaco.Range(
            i,
            aliasStartIndex + 1,
            i,
            aliasStartIndex + alias.length + 1
          ),
        });
      }

      // import log;
      const simpleMatch = text.match(/^import\s+(\w+)\s*;/);
      if (simpleMatch && simpleMatch[1] === wordText) {
        const name = simpleMatch[1];
        const nameIndex = text.indexOf(name);
        targets.push({
          uri: model.uri,
          range: new monaco.Range(
            i,
            nameIndex + 1,
            i,
            nameIndex + name.length + 1
          ),
        });
      }
      // 顶层变量定义
      const localDefMatch = text.match(/^(const|let|var|Object|Long|String|Double|Float|Integer|Byte|Pattern|BigDecimal|Boolean)\s+(\w+)/);
      if (localDefMatch && localDefMatch[2] === wordText) {
        const defName = localDefMatch[2];
        const defIndex = text.indexOf(defName);
        targets.push({
          uri: model.uri,
          range: new monaco.Range(
            i,
            defIndex + 1,
            i,
            defIndex + defName.length + 1
          ),
        });
      }

      // 顶层函数定义
      // 支持 function xxx(...) 或 const xxx = (...) =>
      const funcMatch =
        text.match(/^function\s+(\w+)\s*\(([^)]*)\)/) ||
        text.match(/^const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/);
      if (funcMatch) {
        // 函数名
        if (funcMatch[1] === wordText) {
          const funcName = funcMatch[1];
          const funcIndex = text.indexOf(funcName);
          targets.push({
            uri: model.uri,
            range: new monaco.Range(
              i,
              funcIndex + 1,
              i,
              funcIndex + funcName.length + 1
            ),
          });
        }
        // 参数名
        const params = funcMatch[2].split(",").map((p) => p.trim());
        params.forEach((param) => {
          if (param === wordText) {
            // 精确定位参数名
            const paramIndex = text.indexOf(param);
            targets.push({
              uri: model.uri,
              range: new monaco.Range(
                i,
                paramIndex + 1,
                i,
                paramIndex + param.length + 1
              ),
            });
          }
        });
      }

      // for(val in ...) 定义
      const forVarMatch = text.match(/^for\s*\(\s*(\w+)\s+in\s+/);
      if (forVarMatch && forVarMatch[1] === wordText) {
        const forName = forVarMatch[1];
        const forIndex = text.indexOf(forName);
        targets.push({
          uri: model.uri,
          range: new monaco.Range(
            i,
            forIndex + 1,
            i,
            forIndex + forName.length + 1
          ),
        });
      }

      // 对象属性定义（如 var data = { ... }）
      // 只处理顶层变量定义，属性内部不跳转（如 data.id），如需可扩展
    }
    return targets.length ? targets : null;
  },
};

export default DefinitionProvider;
