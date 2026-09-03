// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { nls, PreferenceSchema } from '@MagicIdea/core';

export const MCP_SERVERS_PREF = 'ai-assistant.mcp.mcpServers';
export const MCP_USE_WORKSPACE_AS_ROOT_PREF = 'ai-assistant.mcp.useWorkspaceAsRoot';

export const McpServersPreferenceSchema: PreferenceSchema = {
    title: "MCP服务器",
    properties: {
        [MCP_SERVERS_PREF]: {
            type: 'object',
            title: nls.localize('theia/ai/mcp/servers/title', 'MCP服务器配置'),
            description: nls.localize('theia/ai/mcp/servers/mdDescription', '可通过命令行配置本地MCP服务器(含参数及可选环境变量),或通过服务器URL配置远程MCP服务器(含认证令牌及可选认证头名称)。此外支持配置自动启动功能(默认值为true)。 每个服务器通过唯一键标识,例如 brave-search 或 filesystem。'),
            additionalProperties: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        title: nls.localize('theia/ai/mcp/servers/command/title', '执行 MCP 服务器的命令'),
                        description: nls.localize('theia/ai/mcp/servers/command/mdDescription', '用于启动MCP服务器的命令,例如 uvx 或 npx 。')
                    },
                    args: {
                        type: 'array',
                        title: nls.localize('theia/ai/mcp/servers/args/title', '命令的参数'),
                        description: nls.localize('theia/ai/mcp/servers/args/mdDescription', '传递给命令的参数数组。'),
                        items: {
                            type: "string"
                        }
                    },
                    env: {
                        type: 'object',
                        title: nls.localize('theia/ai/mcp/servers/env/title', '环境变量'),
                        description: nls.localize('theia/ai/mcp/servers/env/mdDescription', '为服务器设置的可选环境变量,例如API密钥。'),
                        additionalProperties: {
                            type: 'string'
                        }
                    },
                    autostart: {
                        type: 'boolean',
                        title: nls.localize('theia/ai/mcp/servers/autostart/title', '自动启动'),
                        description: nls.localize('theia/ai/mcp/servers/autostart/mdDescription',
                            '前端启动时自动启动此服务器。新添加的服务器不会立即自动启动,但会在重启时启动。'),
                        default: true
                    },
                    serverUrl: {
                        type: 'string',
                        title: nls.localize('theia/ai/mcp/servers/serverUrl/title', '服务器URL'),
                        description: nls.localize('theia/ai/mcp/servers/serverUrl/mdDescription',
                            '远程MCP服务器的URL。若提供该地址,服务器将连接此URL而非启动本地进程。'),
                    },
                    serverAuthToken: {
                        type: 'string',
                        title: nls.localize('theia/ai/mcp/servers/serverAuthToken/title', '认证令牌'),
                        description: nls.localize('theia/ai/mcp/servers/serverAuthToken/mdDescription',
                            '若需服务器认证令牌,此令牌用于与远程服务器进行身份验证。'),
                    },
                    serverAuthTokenHeader: {
                        type: 'string',
                        title: nls.localize('theia/ai/mcp/servers/serverAuthTokenHeader/title', '身份验证标头名称'),
                        description: nls.localize('theia/ai/mcp/servers/serverAuthTokenHeader/mdDescription',
                            '服务器认证令牌应使用的标头名称。若未提供,则使用 Authorization 标头搭配 Bearer 值。'),
                    },
                    headers: {
                        type: 'object',
                        title: nls.localize('theia/ai/mcp/servers/headers/title', '请求头'),
                        description: nls.localize('theia/ai/mcp/servers/headers/mdDescription',
                            '每次向服务器发送请求时可选添加的额外标头。'),
                        additionalProperties: {
                            type: "string"
                        }
                    }
                },
                required: []
            }
        },
//         [MCP_USE_WORKSPACE_AS_ROOT_PREF]: {
//             title: nls.localize('theia/ai/mcp/useWorkspaceAsRoot/title', 'Use Workspace as Root'),
//             description: nls.localize('theia/ai/mcp/useWorkspaceAsRoot/mdDescription',
//                 'Roots define the boundaries of where servers can operate within the filesystem. \
// If enabled, the workspace folders will be used as roots, otherwise the MCP servers will have access to the entire filesystem. \
// Changing this setting will restart all running MCP servers to apply the new roots configuration.'),
//             type: 'boolean',
//             default: false
//         }
    }
};
