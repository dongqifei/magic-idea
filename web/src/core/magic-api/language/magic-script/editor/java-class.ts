import { HighLightOptions } from './high-light'
import * as monaco from 'monaco-editor'
import { MagicApiClientService } from '@MagicIdea/core/magic-api/magic-api-client-service';

let scriptClass: any = {}
let extensions: any = {}
let importClass: any[] = []
let functions: any[] = []
let autoImportModule: any
let autoImportClass: any

const contants = {
  config: {}
}

let client : MagicApiClientService;

// 初始化就绪状态
let readyResolve: () => void;
let readyPromise: Promise<void> = new Promise((resolve) => { readyResolve = resolve; });
let initialized = false;
let initCallbacks: Array<() => void> = [];

// 等待类数据初始化完成
const whenReady = (): Promise<void> => readyPromise;

// 注册初始化完成回调（如果已初始化则立即执行）
const onReady = (callback: () => void) => {
  if (initialized) {
    callback();
  } else {
    initCallbacks.push(callback);
  }
};

// 需要导入的资源数据
let importResources: {
  apis: Map<string, any>;
  functions: Map<string, any>;
} = {
  apis: new Map(),
  functions: new Map()
};

const initMagicApiClient = (apiClient: MagicApiClientService) => { 
  client = apiClient;
};

const initContants = (config: any)=>{
  contants.config = config;
}

// 外部设置资源数据
const setImportResources = (resources: {
  apis: Map<string, any>;
  functions: Map<string, any>;
}) => {
  importResources = resources;
  // console.log(`Import resources updated: ${importResources.apis.size} APIs, ${importResources.functions.size} functions`, importResources);
};

// 获取所有资源
const getImportResources = () => {
  return importResources;
};

// 根据路径查找资源
const findResouceByPath = (path: string) => {
  if(path.startsWith('@')){
    const resource = path.includes(':')? importResources.apis.get(path) : importResources.functions.get(path);
    return resource?.uri;
  }

  return undefined;
};

// 检查资源路径是否存在（用于 import 语法校验）
const hasResource = (path: string): boolean => {
  if (!path || !path.startsWith('@')) {
    return true; // 非 @ 开头的走 Java 类导入逻辑，不在此校验
  }
  if (path.includes(':')) {
    return importResources.apis.has(path);
  }
  return importResources.functions.has(path);
};

// 检查导入是否存在（统一校验所有 import 形式）
// module=true: import xxx; (单个标识符，通常是模块名)
// module=false: import "xxx" as yyy; 或 import a.b.c; (字符串形式或带点的 Java 类全限定名)
const hasImport = (packageName: string, module: boolean): boolean => {
  if (!packageName) return false;

  // 数据未初始化完成时，跳过 import 存在性检查，避免误报
  if (!initialized) return true;

  // @ 开头的 magic-api 资源
  if (packageName.startsWith('@')) {
    return hasResource(packageName);
  }

  // 通配符导入（如 import java.util.*;），检查包前缀下是否有类
  if (packageName.endsWith('.*')) {
    const prefix = packageName.substring(0, packageName.length - 1); // "java.util."
    return importClass.some((cls: string) => cls.indexOf(prefix) === 0);
  }

  // 模块导入（如 import rabbitMq;，module=true 且无点）
  if (module) {
    return getDefineModules().indexOf(packageName) > -1;
  }
  // Java 类导入（全限定类名，如 gds.application.common.utils.EncryptUtils）
  // 先查已加载的类缓存，再查 importClass 列表
  if (scriptClass[packageName]) {
    return true;
  }
  return importClass.indexOf(packageName) > -1;
};

// 获取资源自动补全项
const getResouceCompletionItems = () => {
  const items: any[] = [];
  
  importResources.apis.forEach((info, key) => {
    if (key.includes(':')) { // 只添加带 method 的版本
      items.push({
        label: key,
        kind: monaco.languages.CompletionItemKind.Function,
        detail: info.fullPathName || info.fullPath,
        documentation: `API: ${info.method?.toUpperCase()} ${info.fullPath}`,
        insertText: key,
        sortText: `api_${key}`
      });
    }
  });
  
  importResources.functions.forEach((info, key) => {
    items.push({
      label: key,
      kind: monaco.languages.CompletionItemKind.Function,
      detail: info.fullPathName || info.fullPath,
      documentation: `Function: ${info.fullPath}`,
      insertText: key,
      sortText: `func_${key}`
    });
  });
  
  return items;
};

const getWrapperClass = (target: any) => {
  if (target === 'int' || target === 'java.lang.Integer') {
    return 'java.lang.Integer'
  }
  if (target === 'string' || target === 'java.lang.String') {
    return 'java.lang.String'
  }
  if (target === 'double' || target === 'java.lang.Double') {
    return 'java.lang.Double'
  }
  if (target === 'float' || target === 'java.lang.Float') {
    return 'java.lang.Float'
  }
  if (target === 'byte' || target === 'java.lang.Byte') {
    return 'java.lang.Byte'
  }
  if (target === 'short' || target === 'java.lang.Short') {
    return 'java.lang.Short'
  }
  if (target === 'long' || target === 'java.lang.Long') {
    return 'java.lang.Long'
  }
  if (target.indexOf('[]') > -1) {
    return '[Ljava.lang.Object;'
  }
  return target || 'java.lang.Object'
}
const getSimpleClass = (target: any) => {
  let index = target.lastIndexOf('.')
  if (index > -1) {
    return target.substring(index + 1)
  }
  return target
}

const matchTypes = async (parameters: any, args: any, extension: any) => {
  const parameterCount = parameters?.length || 0
  const argCount = args?.length || 0
  const effectiveParameterCount = extension ? Math.max(parameterCount - 1, 0) : parameterCount

  if (parameterCount > 0 && parameters[parameterCount - 1].varArgs) {
    const requiredParamCount = Math.max(parameterCount - 1, 0)
    return argCount >= requiredParamCount
  }

  return argCount === effectiveParameterCount
}
const initClasses = async function () {
  const response = await client.getClasses()
  const { data } = response
  scriptClass = data.classes || {}
  extensions = data.extensions || {}
  functions = data.functions || []
  HighLightOptions.builtinFunctions = functions.map(it => it.name)
  monaco.languages.setMonarchTokensProvider('magicscript', HighLightOptions)
}
const initImportClass = async () => {
  try {
    const response = await client.getClassesText()
    const array: any[] = []
    response.split('\n').forEach((item: any) => {
      const tmp = item.split(':')
      if (tmp.length === 1) {
        array.push(tmp[0])
      } else {
        array.push(...tmp[1].split(',').map((it: any) => tmp[0] + '.' + it))
      }
    })
    importClass = array
  } catch (error) {
    console.log(error)
  }
}

// 统一初始化入口，等待所有类数据加载完成后标记就绪
const initialize = async () => {
  try {
    await Promise.all([initClasses(), initImportClass()])
  } catch (e) {
    console.error('Failed to initialize JavaClass data:', e)
  }
  initialized = true
  readyResolve()
  // 触发所有等待就绪的回调
  initCallbacks.forEach(cb => cb())
  initCallbacks = []
}

const padding = (num: any, n: any) => Array(n > (num + '').length ? n - ('' + num).length - 1 : 0).join(0) + num

const findEnums: any = (clazz: any) => {
  let enums = []
  if (clazz) {
    enums = clazz.enums || []
    if (clazz.superClass) {
      enums = enums.concat(findEnums(clazz.superClass))
    }
  }
  return enums
}
const processMethod = (method: any, begin: any, sort: any) => {
  method.insertText = method.name
  if (method.parameters.length > begin) {
    let params = []
    let params2 = []
    for (let j = begin; j < method.parameters.length; j++) {
      params.push('${' + (j + 1 - begin) + ':' + method.parameters[j].name + '}')
      if (method.parameters[j].varArgs) {
        params2.push(getSimpleClass(method.parameters[j].type).replace('[]', '') + ' ... ' + method.parameters[j].name)
      } else {
        params2.push(getSimpleClass(method.parameters[j].type) + ' ' + method.parameters[j].name)
      }
    }
    // if (!method.comment) {
    //     method.comment = getSimpleClass(method.returnType) + '.' + method.name + '(' + params2.join(', ') + ')';
    // }
    method.sortText = padding(sort, 10) + method.name
    method.fullName = method.name + '(' + params2.join(', ') + ')'
    method.insertText += '(' + params.join(',') + ')'
    method.signature = method.name + params2.join(',')
  } else {
    method.sortText = padding(sort, 10) + method.name
    method.insertText += '()'
    method.fullName = method.name + '()'
    // if (!method.comment) {
    //     method.comment = getSimpleClass(method.returnType) + '.' + method.name + '()';
    // }
    method.signature = method.name
  }
  return method
}
let extensionAttribute: any = {}
const setExtensionAttribute = (clazz: any, value: any) => {
  extensionAttribute[clazz] = value
}
const findAttributes: any = (clazz: any) => {
  let attributes = []
  if (clazz) {
    attributes = clazz.attributes || []
    if (clazz.superClass) {
      attributes = attributes.concat(findAttributes(clazz.superClass))
    }
    if (clazz.interfaces && clazz.interfaces.length > 0) {
      for (let i = 0, len = clazz.interfaces.length; i < len; i++) {
        attributes = attributes.concat(findAttributes(clazz.interfaces[i]))
      }
    }
    extensionAttribute[clazz.className] &&
      (typeof extensionAttribute[clazz.className] === "function"
        ? (attributes = attributes.concat(
            extensionAttribute[clazz.className](),
          ))
        : (attributes = attributes.concat(
            extensionAttribute[clazz.className],
          )));
  }
  return attributes
}
const findMethods = (clazz: any, sort?: any) => {
  sort = sort || 0
  let methods: any = []
  let _findMethod = (target: any, begin: any, sort: any) => {
    if (target && target.methods) {
      for (let i = 0, len = target.methods.length; i < len; i++) {
        let method = target.methods[i]
        method = processMethod(method, begin, sort)
        method.extension = begin === 1
        methods.push(method)
      }
    }
  }
  if (typeof clazz === 'string') {
    clazz = scriptClass[clazz]
  }
  if (clazz) {
    _findMethod(clazz, 0, sort)
    if (clazz.superClass) {
      methods = methods.concat(findMethods(clazz.superClass, sort + 1))
    }
    if (clazz.interfaces && clazz.interfaces.length > 0) {
      for (let i = 0, len = clazz.interfaces.length; i < len; i++) {
        methods = methods.concat(findMethods(clazz.interfaces[i], sort + 100))
      }
    }
    clazz = extensions[clazz.className]
    if (clazz) {
      _findMethod(clazz, 1, sort + 10000)
    }
  }
  return methods
}

const getExtension = (clazz: any) => {
  return extensions[clazz]
}
const findClass = (className: any) => {
  if (!className) {
    throw new Error('className is required')
  }
  let value = scriptClass[className]
  if (!value) {
    let index = importClass.findIndex(it => it === className)
    value = importClass[index]
  }
  return value
}

async function loadClass(className: any) {
  // 防御性校验：非字符串、空值、或 magic-api 资源路径（@开头）不应作为 Java 类名请求后台
  if (!className || typeof className !== 'string' || className.startsWith('@')) {
    return undefined
  }
  let val = scriptClass[className]
  if (!val) {
    try {
      let res = await client.getClass({ className })
      let clazzs = res.data
      clazzs?.forEach((it: any) => {
        scriptClass[it.className] = it
      })
      val = scriptClass[className]
    } catch (e) {
      console.log(e)
    }
  } else {
    val = scriptClass[val.className] || val // fix attribute
  }
  return val
}

const findFunction = () => {
  return functions.map(method => processMethod(method, 0, 1))
}

const initAutoImport = () => {
  if (!autoImportModule && contants.config) {
    let config = contants.config
    if (config.autoImportModuleList) {
      autoImportModule = {}
      config.autoImportModuleList.forEach((it: any) => {
        autoImportModule[it] = it
      })
    }
    let importPackages = ['java.util.', 'java.lang.'].concat(
      (config.autoImportPackage || '').replace(/\\s/g, '').replace(/\*/g, '').split(',')
    )
    autoImportClass = {}
    importClass.forEach(className => {
      importPackages.forEach(packageName => {
        if (className.indexOf(packageName) === 0 && className.indexOf('.', packageName.length) === -1) {
          autoImportClass[className.substring(className.lastIndexOf('.') + 1)] = className
        }
      })
    })
  }
}
const getAutoImportModule = () => {
  initAutoImport()
  return autoImportModule || {}
}
const getAutoImportClass = () => {
  initAutoImport()
  return autoImportClass || {}
}
const getImportClass = () => importClass
let onlineFunctionFinder: any
const setupOnlineFunction = (loader: any) => {
  onlineFunctionFinder = loader
}
const getOnlineFunction = (path: any) => {
  return onlineFunctionFinder && onlineFunctionFinder(path)
}
const getDefineModules = () => Object.keys(scriptClass).filter(it => scriptClass[it].module)

const exportValue = {
  findEnums,
  findAttributes,
  findMethods,
  findFunction,
  loadClass,
  findClass,
  initMagicApiClient,
  initContants,
  initClasses,
  initImportClass,
  initialize,
  whenReady,
  onReady,
  getWrapperClass,
  matchTypes,
  getAutoImportModule,
  getAutoImportClass,
  getExtension,
  getImportClass,
  getOnlineFunction,
  setupOnlineFunction,
  setExtensionAttribute,
  getSimpleClass,
  getDefineModules,
  setImportResources,
  getImportResources,
  findResouceByPath,
  hasResource,
  hasImport,
  getResouceCompletionItems
}

export default exportValue
