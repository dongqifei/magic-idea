# RabbitMQ 资源插件

## 概述

`cn.magic-idea.resource.rabbitmq` 是一个用于管理 RabbitMQ 消息队列资源的 MagicIDEA 插件。

## 功能特性

- 管理 RabbitMQ 队列和交换机
- 支持四种交换机类型：Direct、Topic、Fanout、Headers
- 配置路由键
- 可视化属性表单

## 属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| name | string | 资源名称 |
| queue | string | 队列名称 |
| exchange | string | 交换机名称 |
| exchangeType | enum | 交换机类型 (direct/topic/fanout/headers) |
| routingKey | string | 路由键 |
| enabled | boolean | 是否启用 |
| description | string | 描述信息 |
| path | string | 路径（可选） |

## 交换机类型

- **Direct**: 直接交换机，根据精确的路由键匹配
- **Topic**: 主题交换机，支持模式匹配
- **Fanout**: 扇出交换机，广播到所有绑定队列
- **Headers**: 标头交换机，根据消息头匹配

## 开发

### 调试

```bash
npx ministar watchPlugin cn.magic-idea.resource.rabbitmq
```

### 构建

```bash
npx ministar buildPlugin cn.magic-idea.resource.rabbitmq
```

## 安装

构建后将插件目录复制到 `public/plugins/cn.magic-idea.resource.rabbitmq/`，重启 IDE 即可加载。
