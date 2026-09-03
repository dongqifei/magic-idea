# MagicIDEA 插件开发指南

## 目录结构

```
plugins/
├── cn.magic-idea.code-formatter/     # 代码格式化插件
├── cn.magic-idea.embedded-agent/     # 嵌入式智能体插件
├── cn.magic-idea.helloworld/         # Hello World 示例插件
├── cn.magic-idea.resource.kafka/     # Kafka 资源插件
├── cn.magic-idea.resource.mqtt/      # MQTT 资源插件
├── cn.magic-idea.resource.rocketmq/  # RocketMQ 资源插件
├── cn.magic-idea.resource.task/      # 定时任务资源插件
├── cn.magic-idea.chat2db/           # Chat2DB 数据库插件
└── cn.magic-idea.turbo-flow/        # 工作流插件
```

## 插件命名规范

- 插件 ID 格式：`cn.magic-idea.<插件名>`
- 使用小写字母和连字符
- 示例：`cn.magic-idea.my-plugin`

## 插件项目结构

每个插件包含以下标准文件：

```
cn.magic-idea.<plugin-name>/
├── manifest.json          # 插件清单（必填）
├── package.json           # 包配置
├── tsconfig.json          # TypeScript 配置
├── src/                   # 源代码目录
│   ├── index.ts           # 插件入口
│   ├── magic-idea.d.ts    # magic-idea类型定义
│   └── ...
├── assets/                # 静态资源
│   └── icon.png           # 插件图标
└── types/                 # 类型定义（可选）
```

## 核心配置文件

### 1. manifest.json - 插件清单

```json
{
  "label": "插件显示名称",
  "name": "cn.magic-idea.plugin-name",
  "url": "/plugins/cn.magic-idea.plugin-name/index.js",
  "icon": "/plugins/cn.magic-idea.plugin-name/assets/icon.png",
  "version": "1.0.0",
  "author": "作者名",
  "description": "插件描述",
  "requireRestart": true
}
```

**关键字段说明：**
- `label`: 插件在 UI 中显示的名称
- `name`: 插件唯一标识符
- `url`: 插件入口文件路径（发布后自动设置）
- `icon`: 插件图标路径
- `version`: 语义化版本号
- `requireRestart`: 是否需要重启 IDE 才能生效

### 2. package.json

```json
{
  "name": "@plugins/cn.magic-idea.plugin-name",
  "main": "src/index.tsx",
  "version": "1.0.0",
  "description": "插件描述",
  "private": true,
  "scripts": {
    "sync:declaration": "MagicIdea declaration github"
  },
  "dependencies": {},
  "devDependencies": {
    "magic-idea": "file:../../types"
  }
}
```

### 3. tsconfig.json

插件使用与主项目一致的 TypeScript 配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react",
    "strict": true,
    "strictPropertyInitialization": false,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "composite": true,
    "allowSyntheticDefaultImports": true
  }
}
```

## 插件开发模式

### 模式 1：Widget 插件（推荐）

创建可嵌入 IDE 面板的 UI 组件：

```typescript
import { inject, injectable, postConstruct } from "@capital/shared/inversify";
import { ApplicationShellLayout } from '@capital/core/shell';
import { CommandContribution, CommandRegistry } from '@capital/core/commands';
import { Widget } from "@capital/core/widgets";

@injectable()
export class MyPluginWidget extends Widget implements CommandContribution {
  constructor(
    @inject(ApplicationShellLayout) private shellLayout: ApplicationShellLayout
  ) {
    super();
    this.title.label = '我的插件';
    this.node.innerHTML = '<div>插件内容</div>';
  }

  @postConstruct()
  init(): void {
    // 初始化逻辑
  }

  // 注册命令
  registerCommands(registry: CommandRegistry): void {
    registry.addCommand("my-plugin.action.do-something", {
      label: "执行操作",
      execute: () => {
        console.log("执行了操作");
      }
    });
  }
}
```

### 模式 2：Monaco Editor 扩展

为 Monaco 编辑器添加功能（如格式化、语言支持）：

```typescript
import * as monaco from "@capital/shared/monaco-editor";

// 注册格式化器
monaco.languages.registerDocumentFormattingEditProvider("magicscript", {
  provideDocumentFormattingEdits(model) {
    // 返回格式化后的编辑
    return [{
      range: model.getFullModelRange(),
      text: formatCode(model.getValue())
    }];
  }
});
```

### 模式 3：配置扩展

添加插件的首选项配置：

```typescript
import { PreferenceContribution } from '@capital/core/preferences';

export const MyPluginSchema = {
  type: "object",
  properties: {
    "my-plugin.setting1": {
      type: "string",
      default: "默认值",
      description: "设置1的描述"
    }
  }
};
```

## 插件入口 (index.ts)

```typescript
import { ContainerModule } from "@capital/shared/inversify";
import { regContainerModule } from '@capital/core/plugin';
import { CommandContribution } from '@capital/core/commands';
import { PreferenceContribution } from '@capital/core/preferences';
import { MyPluginWidget } from './my-widget';
import { MyPluginSchema } from './my-preferences';

// 定义插件模块
const MyPluginModule = new ContainerModule((bind: any) => {
  // 绑定 Widget
  bind(MyPluginWidget).toSelf().inSingletonScope();
  
  // 注册为命令贡献
  bind(CommandContribution).toService(MyPluginWidget);
  
  // 注册首选项配置
  bind(PreferenceContribution).toConstantValue({ schema: MyPluginSchema });
});

// 注册到插件中心
regContainerModule(MyPluginModule);
```

## 开发工作流

### 1. 创建新插件

```bash
npx ministar createPlugin cn.magic-idea.my-plugin
```

### 2. 开发调试

```bash
cd plugins/cn.magic-idea.my-plugin
npx ministar watchPlugin cn.magic-idea.my-plugin
```

### 3. 构建发布

```bash
npx ministar buildPlugin cn.magic-idea.my-plugin
```

### 4. 手动安装测试

将构建后的插件目录复制到 `public/plugins/` 对应位置，重启 IDE 即可加载。

## 核心 API 参考

### 可用的核心模块

```typescript
// Shell 相关
import { ApplicationShellLayout } from '@capital/core/shell';

// 命令系统
import { CommandContribution, CommandRegistry } from '@capital/core/commands';

// 首选项
import { PreferenceContribution, PreferenceService } from '@capital/core/preferences';

// Widget 基类
import { Widget } from "@capital/core/widgets";

// 依赖注入
import { inject, injectable, postConstruct } from "@capital/shared/inversify";

// 日志
import { getLogger } from '@capital/core/logger';

// Monaco Editor
import * as monaco from "@capital/shared/monaco-editor";

// 插件注册
import { regContainerModule } from '@capital/core/plugin';
```

## 最佳实践

1. **使用 DI 容器**：所有服务都应通过 Inversify 注入
2. **单例模式**：Widget 使用 `inSingletonScope()`
3. **错误处理**：捕获异常并提供友好的错误提示
4. **资源清理**：在 Widget 销毁时清理事件监听器和定时器
5. **配置外部化**：将可配置项通过首选项暴露
6. **图标规范**：使用 256x256 的 PNG 图标
7. **版本管理**：遵循语义化版本 (SemVer)

## 常见问题

### Q: 插件不生效怎么办？
A: 检查 `manifest.json` 的 `requireRestart` 字段，设置为 `true` 后需要重启 IDE。

### Q: 如何访问主项目的服务？
A: 通过 `@inject()` 装饰器注入，如 `@inject(ApplicationShellLayout)`。

### Q: 插件间如何通信？
A: 使用共享服务或通过 `PreferenceService` 传递配置。
