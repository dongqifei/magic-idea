# MagicIDEA 编辑器web端

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

## 功能说明

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

### 插件开发规范

#### 创建插件

```shell
npx ministar createPlugin cn.magic-idea.helloworld
```

#### 插件构建

```shell
npx ministar buildPlugin cn.magic-idea.helloworld
```

#### 插件调试

```shell
npx mini-star watchPlugin cn.magic-idea.helloworld
```

#### 手动安装插件

``` json
{
  "label":"AI Assistant",
  "name":"cn.magic-idea.helloworld",
  "url":"http://localhost:3000/plugins/cn.magic-idea.helloworld/index.js",
  "icon":"http://localhost:3000/plugins/cn.magic-idea.helloworld/assets/icon.png",
  "version":"0.0.1", 
  "author":"amolfy", 
  "description":"用于演示 MagicIdea 插件系统的基本功能。", 
  "requireRestart":true
}
```

本项目采用 MIT 许可证。MIT License Copyright (c) [2026] [amofly] 权限的详细信息请查看随附的 LICENSE 文件
