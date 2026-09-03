/**
 * 代码提示
 * @param monaco MonacoEditor
 */
import * as monaco from 'monaco-editor'
import JavaClass from './java-class'
import tokenizer from '../parsing/tokenizer'
import { TokenStream } from '../parsing/index'
import { Parser } from '../parsing/parser'
import RequestParameter from './request-parameter'
import { MemberAccess, MethodCall, NewStatement, VariableAccess } from '../parsing/ast'

const getResourceCompletionItems = (searchText: string = '', range: any) => {
  const completionItems = JavaClass.getResouceCompletionItems();
  const filteredItems = completionItems.filter((item: any) => {
    if (!searchText) return true;
    return item.label.toLowerCase().includes(searchText.toLowerCase());
  });
  
  return filteredItems.map((item: any) => ({
    sortText: `resource_${item.sortText || item.label}`,
    label: item.label,
    kind: monaco.languages.CompletionItemKind.Reference,
    filterText: item.label,
    detail: item.detail,
    documentation: item.documentation || `资源引用: ${item.label}`,
    insertText: item.insertText || item.label,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range: range
  }));
};

const completionImportJavaPackage = (suggestions: any, keyword: any, start: any, position: any) => {
  let len = -1
  let importClass = JavaClass.getImportClass()
  if (start !== 0 && keyword && (len = importClass.length) > 0) {
    keyword = keyword.toLowerCase()
    JavaClass.getDefineModules()
      .filter((module: any) => module.toLowerCase().indexOf(keyword) > -1)
      .forEach((module: any) =>
        suggestions.push({
          label: module,
          filterText: module,
          kind: monaco.languages.CompletionItemKind.Module,
          detail: module,
          insertText: module,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        })
      )
    let set = new Set()
    for (let i = 0; i < len && suggestions.length < 100; i++) {
      let clazz = importClass[i]
      let index = clazz.toLowerCase().indexOf(keyword)
      if (index > -1) {
        let className = clazz.substring(clazz.lastIndexOf('.') + 1)
        if (index === 0) {
          let content = clazz.substring(keyword.length)
          let detail = content
          if (content.startsWith('.')) {
            detail = keyword + '.'
            content = keyword.substring(keyword.lastIndexOf('.') + 1) + '.'
          } else {
            if (content.indexOf('.') === -1) {
              suggestions.push({
                sortText: `2${className}`,
                label: className,
                kind: monaco.languages.CompletionItemKind.Class,
                filterText: clazz,
                detail: clazz,
                insertText: className,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              })
              continue
            }
            let text = content.substring(0, content.indexOf('.') + 1)
            detail = keyword + text
            content = keyword.substring(keyword.lastIndexOf('.') + 1) + text
          }
          if (set.has(content)) {
            continue
          }
          set.add(content)
          suggestions.push({
            sortText: `1${content}`,
            label: content,
            kind: monaco.languages.CompletionItemKind.Folder,
            filterText: clazz,
            detail: detail.replace(/\.$/, ''),
            insertText: content,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            command: {
              id: 'editor.action.triggerSuggest'
            }
          })
        } else if (className.toLowerCase().indexOf(keyword) > -1) {
          suggestions.push({
            sortText: `2${className}`,
            label: className,
            kind: monaco.languages.CompletionItemKind.Class,
            filterText: className,
            detail: clazz,
            insertText: clazz,
            range: new monaco.Range(position.lineNumber, start + 1, position.lineNumber, position.column)
          })
        }
      }
    }
  } else {
    JavaClass.getDefineModules().forEach((module: any) =>
      suggestions.push({
        label: module,
        filterText: module,
        kind: monaco.languages.CompletionItemKind.Module,
        detail: module,
        insertText: module,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      })
    )
  }
}

const completionImport = (suggestions: any, position: any, line: any, importIndex: any) => {
  let start = line.indexOf('"') + 1
  if (start === 0) {
    start = line.indexOf("'") + 1
  }
  if (start === 0) {
    line = line.trim().replace('import', '').trim()
    completionImportJavaPackage(suggestions, line, importIndex + 1, position)
    return
  }
  let text = line.substring(importIndex).trim().replace(/['|"]/g, '')
  if (text.startsWith('@')) {
    if (text.indexOf(' ') > -1) {
      return
    }
    const searchText = text.substring(1);
    const range = new monaco.Range(position.lineNumber, start + 1, position.lineNumber, position.column);
    const resourceItems = getResourceCompletionItems(searchText, range);
    suggestions.push(...resourceItems);
    return;
  }
  completionImportJavaPackage(suggestions, text, start, position)
}

const completionFunction = async (suggestions: any, input: any, env?: any, best?: any, isNew?: any) => {
  env = env || {}
  if (best && best instanceof VariableAccess) {
    if ((await best.getJavaType(env)) === 'java.lang.Object') {
      let importClass = JavaClass.getImportClass()
      const keyword = best.variable
      importClass.forEach(clazz => {
        let className = clazz.substring(clazz.lastIndexOf('.') + 1)
        if (className.indexOf(keyword) > -1) {
          suggestions.push({
            sortText: `${className}`,
            label: className,
            kind: monaco.languages.CompletionItemKind.Class,
            filterText: className,
            detail: clazz,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            command: {
              id: 'editor.action.scrollUp1Line'
            },
            insertText: className + (isNew ? '()' : ''),
            additionalTextEdits: [
              {
                forceMoveMarkers: true,
                text: `import ${clazz}\r\n`,
                range: new monaco.Range(1, 0, 1, 0)
              }
            ]
          })
        }
      })
    }
  }
  JavaClass.findFunction().forEach(it => {
    suggestions.push({
      sortText: it.sortText || it.fullName,
      label: it.fullName,
      filterText: it.name,
      kind: monaco.languages.CompletionItemKind.Method,
      detail: it.comment,
      insertText: it.insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    })
  })
  let known = suggestions.map((it: any) => it.detail)
  let matches = input.match(/[a-zA-Z_$]+/gi) || []
  let count = matches.length
  let vars = Object.keys(env)
  vars.forEach(key => {
    suggestions.push({
      label: key,
      filterText: key,
      kind: monaco.languages.CompletionItemKind.Variable,
      detail: env[key],
      insertText: key,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
    })
  })
  if (count > 2) {
    Array.from(new Set(matches))
      .filter((it, index) => index + 2 < count && known.indexOf(it) === -1 && vars.indexOf(it) === -1)
      .map(it => {
        suggestions.push({
          label: it,
          filterText: it,
          kind: monaco.languages.CompletionItemKind.Text,
          detail: it,
          insertText: it,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        })
      })
  }
}

const completionMethod = async (className: any, suggestions: any) => {
  // 过滤非 Java 类名（如 magic-api 资源路径 @/xxx），避免请求后台报错
  if (!className || typeof className !== 'string' || className.startsWith('@')) {
    return
  }
  let clazz = await JavaClass.loadClass(className)
  let index = className.lastIndexOf('.')
  let simpleName = index > 0 ? className.substring(index + 1) : className
  let enums = JavaClass.findEnums(clazz)
  if (enums) {
    for (let j = 0; j < enums.length; j++) {
      let value = enums[j]
      suggestions.push({
        label: value,
        kind: monaco.languages.CompletionItemKind.Enum,
        detail: value + ':' + value,
        insertText: value,
        sortText: ' ~~~' + value
      })
    }
  }
  let attributes = JavaClass.findAttributes(clazz)
  if (attributes) {
    for (let j = 0; j < attributes.length; j++) {
      let attribute = attributes[j]
      suggestions.push({
        label: attribute.name,
        kind: monaco.languages.CompletionItemKind.Field,
        detail: attribute.comment || attribute.type + ':' + attribute.name,
        insertText: attribute.name,
        sortText: ' ~~' + attribute.name
      })
    }
  }
  let methods = JavaClass.findMethods(clazz)
  if (methods) {
    let mmap: any = {}
    for (let j = 0; j < methods.length; j++) {
      let method = methods[j]
      if (mmap[method.signature]) {
        continue
      }
      mmap[method.signature] = true
      let document = []
      method.comment && document.push(method.comment)
      for (let j = method.extension ? 1 : 0; j < method.parameters.length; j++) {
        let param = method.parameters[j]
        document.push(`\`${param.name}\`：${param.comment || param.type}`)
      }
      document.push(`返回类型：\`${method.returnType}\``)
      suggestions.push({
        sortText: method.sortText || method.fullName,
        label: method.fullName,
        kind: monaco.languages.CompletionItemKind.Method,
        detail: `${simpleName}.${method.fullName}: ${method.returnType}`,
        documentation: { value: document.join('\r\n\r\n\r\n') },
        insertText: method.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      })
    }
  }
}

async function completionScript(suggestions: any, input: any) {
  try {
    let tokens = tokenizer(input)
    let tokenLen = tokens.length
    if (tokenLen === 0) {
      await completionFunction(suggestions, input)
      return
    }
    let parser = new Parser(new TokenStream(tokens))
    const { best, env } = await parser.parseBest(input.length - 1)
    if (input.endsWith('.')) {
      await completionMethod(await best.getJavaType(env), suggestions)
    } else if (best) {
      if (best instanceof MemberAccess || best instanceof MethodCall) {
        await completionMethod(await best.target.getJavaType(env), suggestions)
      } else if (best instanceof NewStatement && best.identifier instanceof VariableAccess) {
        await completionFunction(suggestions, input, env, best.identifier, true)
      } else {
        await completionFunction(suggestions, input, env, best)
      }
    } else {
      await completionFunction(suggestions, input, env)
    }
    return suggestions
  } catch (e) {
    // console.error(e)
  }
}

const quickSuggestions = [
  ['var', 'var ', 'var'],
  ['let', 'let ', 'let'],
  ['const', 'const ', 'const'],
  ['instanceof', 'instanceof ', 'instanceof'],
  ['try', 'try {\r\n\t${1}\r\n} catch (${2:e}) {\r\n\t${3}\r\n}', 'try catch'],
  [
    'try catch finally',
    'try {\r\n\t${1}\r\n} catch (${2:e}) {\r\n\t${3}\r\n} finally {\r\n\t${4}\r\n}',
    'try catch finally'
  ],
  ['foreach', '${1:list}.each(${2:item => {\r\n\t${3}\r\n}})', '循环集合'],
  ['for', 'for (${1:item} in ${2:collection}) {\r\n\t${3}\r\n}', '循环集合'],
  ['assert', 'assert ${1:condition} : ${2:code}, ${3:message}', '校验参数'],
  ['break', 'break;', '跳出循环'],
  ['continue', 'continue;', '继续循环'],
  ['import', 'import $1', '导入'],
  ['return', 'return $1', '返回'],
  ['if', 'if (${1:condition}){\r\n\t$2\r\n}', '判断'],
  ['ife', 'if (${1:condition}) {\r\n\t$2\r\n} else { \r\n\t$3\r\n}', '判断'],
  ['exit', 'exit ${1:code}, ${2:message};', '退出'],
  ['logi', 'log.info($1);', 'info日志'],
  ['logd', 'log.debug($1);', 'debug日志'],
  ['loge', 'log.error($1);', 'error日志'],
  ['logw', 'log.warn($1);', 'warn日志']
]

const CompletionItemProvider = {
  provideCompletionItems: async function (model: any, position: any) {
    let value = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    })
    let line = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    })
    let word = model.getWordUntilPosition(position)
    let range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    }
    let incomplete = false
    let suggestions: any = quickSuggestions.map((item, index) => {
      return {
        label: item[0],
        kind: monaco.languages.CompletionItemKind.Struct,
        detail: item[2] || item[1],
        insertText: item[1],
        filterText: item[0],
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range
      }
    })
    if (line.length > 1 && line.trim().indexOf('import') === 0) {
      suggestions = []
      completionImport(suggestions, position, line, line.indexOf('import') + 6)
      incomplete = true
    } else if (line.endsWith('::')) {
      suggestions = [
        'int',
        'long',
        'date',
        'string',
        'short',
        'byte',
        'float',
        'double',
        'json',
        'stringify',
        'sql'
      ].map(it => {
        return {
          label: it,
          detail: `转换为${it === 'stringify' ? 'json字符串' : it === 'sql' ? 'sql参数类型' : it}`,
          insertText: it,
          kind: monaco.languages.CompletionItemKind.TypeParameter,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        }
      })
    } else if (value.length > 1) {
      if (line.endsWith('.')) {
        suggestions = []
      }
      await completionScript(suggestions, value)
    } else {
      const environmentFunction: any = RequestParameter.environmentFunction()
      const environmentObject: any =
        environmentFunction && typeof environmentFunction === 'object' ? environmentFunction : {}
      await completionFunction(suggestions, value, {
        ...environmentObject,
        ...JavaClass.getAutoImportClass(),
        ...JavaClass.getAutoImportModule()
      })
    }
    return { suggestions, incomplete }
  },
  triggerCharacters: ['.', ':', '@', '/']
}
export default CompletionItemProvider
