# MagicIDEA 编辑器项目文档

## 项目概述

MagicIDEA 是一个现代化的代码编辑器，具有丰富的功能面板和可扩展的插件系统，专为开发者设计，提供高效的代码编辑和管理体验。
提供以下核心能力：

- 🌳 可视化文件资源管理
- 🌈 可定制的主题系统
- 📦 可扩展的插件系统
- ⚡ 实时代码对比与版本管理
- 🧩 多面板协同工作界面

## 开发指南

### 安装依赖

```shell
npm install --legacy-peer-deps
```

### 启动开发服务器

```shell
npm run dev
```

### 构建生产版本

```shell
npm run build
```

## 开发计划

### 系统内置功能

1. 可视化资源管理器组件
2. 接口、函数编辑功能
3. 数据源管理组件
4. 文件编辑器、diff编辑器组件
5. 接口运行/调试功能
6. 可扩展的插件系统
7. 实时代码对比与历史版本管理
8. 全局关键词搜索功能
9. 设置功能(首选项、皮肤、网络代理等配置)
10. 智能助手组件

### 系统插件列表

1. 代码格式化插件
2. Kafka 资源插件
3. Mqtt 资源插件
4. RocketMQ 资源插件
5. 定时任务资源插件

### 待办事项*

1. 增加MagicApi后端代理程序，支持配置Token进行认证。[启用Magic Api服务代理后所有的请求自动走后端代理程序]
1.1 增加 MagicApi 后端node代理服务√
1.2 支持配置Token进行认证
2. 实现分组配置组件
2.1 运行接口时可引用分组的路径参数 √
2.2 实现配置分组属性编辑组件
3. 增加导入、导出、推送功能
3.1 资源管理器支持导出分组 √
3.2 资源管理器支持导入分组
3.3 资源管理器支持推送功能
4. 修改AI聊天窗口对话框UI √
5. 多项目管理，文件菜单增加添加项目、打开最近的项目功能 √
5.1 文件菜单增加添加项目功能 √
5.2 文件菜单增加打开最近项目功能 √
6. 增加注销MagicApi功能
7. MagicApi和MagicScript提示词优化 √
8. 支持新建窗口
9. 视图最大化、最小化时应固定活动栏面板的大小保证内容不挤压

### 学习资料

- [Monaco Editor 译文](https://wf0.github.io/example/plugins/Formatter.html "Monaco Editor 格式化插件文档")
- [Vscode Codicons 文档](https://microsoft.github.io/vscode-codicons/dist/codicon.html "Vscode Codicons 文档")
- [Mini-Star 插件开发](https://ministar.moonrailgun.com/ "MiniStar")
- [react-icons](https://react-icons.github.io/react-icons/icons/vsc/ "react-icons")
- [Ant Design 文档](https://ant-design.antgroup.com/ "Ant Design 文档")
- [lumino 文档](https://lumino.readthedocs.io/en/latest/ "lumino 文档")
- [highlightjs 文档](https://highlightjs.org/ "highlightjs 文档")
- [react-jsonschema-form 文档](https://rjsf-team.github.io/react-jsonschema-form/ "react-jsonschema-form 文档")
- [markdown-to-jsx/react 文档](https://markdown-to-jsx.quantizor.dev/ "markdown-to-jsx/react 文档")
- [file-icons-js 文档](https://github.com/websemantics/file-icons-js "file-icons-js 文档")
- [react-json-view 文档](https://uiwjs.github.io/react-json-view/ "react-json-view 文档")
- [codex-petdex 文档](https://petdex.crafter.run "codex-petdex 文档")
- [Tauri 文档](https://v2.tauri.org.cn/start "Tauri 文档")
- [impeccable 文档](https://impeccable.cn/ "impeccable skills减少ai味")

### 插件开发规范

#### 创建插件

```shell
npx ministar createPlugin cn.magic-idea.helloworld

npx ministar createPlugin cn.magic-idea.amis-editor
```

#### 插件构建

```shell
npx ministar buildPlugin cn.magic-idea.helloworld
```

#### 插件调试

```shell
npx mini-star watchPlugin cn.magic-idea.embedded-agent
```

#### 手动安装插件

``` json
{
  "label":"AI Assistant",
  "name":"com.msgbyte.ai-assistant",
  "url":"http://localhost:5173/plugins/com.msgbyte.ai-assistant/index.js",
  "icon":"http://localhost:5173/plugins/com.msgbyte.ai-assistant/assets/icon.png",
  "version":"0.0.0", 
  "author":"moonrailgun", 
  "description":"Add chatgpt into Magic IDEA", 
  "requireRestart":true
}
```

## Tauri开发

### 安装插件

```shell
cd src-tauri
cargo add tauri-plugin-shell tauri-plugin-deep-link tauri-plugin-updater
```

### 启动

```shell
npm run tauri dev
```

### 打包

```shell
$env:TAURI_SIGNING_PRIVATE_KEY=$(Get-Content -Raw "C:\Users\xxxx\.tauri\myapp.key")
npm run tauri build
```

本项目采用 MIT 许可证。MIT License Copyright (c) [2026] [amofly] 权限的详细信息请查看随附的 LICENSE 文件
