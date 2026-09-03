import { codicon, ReactWidget } from '@MagicIdea/core';
import { ConfirmDialog } from '@MagicIdea/core/browser';
import { inject, injectable, postConstruct } from 'inversify';
import * as React from 'react';
import {
    isLocalMCPServerDescription,
    isRemoteMCPServerDescription,
    LocalMCPServerDescription,
    MCPFrontendNotificationService,
    MCPFrontendService,
    MCPServerDescription,
    MCPServerStatus,
    RemoteMCPServerDescription
} from '@MagicIdea/ai-mcp/common/mcp-server-manager';
import { nls, PreferenceService, HoverService } from '@MagicIdea/core';
import { NotificationService} from '@MagicIdea/core/notification';
import { PROMPT_VARIABLE } from '@MagicIdea/ai-core/prompt-variable-contribution';
import { MCP_SERVERS_PREF } from '@MagicIdea/ai-mcp/common/mcp-preferences';
import { ReactDialog } from '@MagicIdea/core/browser/dialogs/react-dialog';
import { DialogProps } from '@MagicIdea/core/browser/dialogs';

type ServerType = 'local' | 'remote';

interface MCPServerFormData {
    name: string;
    serverType: ServerType;
    command: string;
    args: string;
    env: string;
    serverUrl: string;
    serverAuthToken: string;
    serverAuthTokenHeader: string;
    headers: string;
    autostart: boolean;
}

const DEFAULT_FORM_DATA: MCPServerFormData = {
    name: '',
    serverType: 'local',
    command: '',
    args: '',
    env: '',
    serverUrl: '',
    serverAuthToken: '',
    serverAuthTokenHeader: '',
    headers: '',
    autostart: true
};

class MCPServerDialog extends ReactDialog<MCPServerFormData | undefined> {
    protected formData: MCPServerFormData;
    protected existingServerNames: string[];
    protected isEditing: boolean;

    constructor(
        props: DialogProps,
        initialData: MCPServerFormData,
        existingServerNames: string[],
        isEditing: boolean
    ) {
        super(props);
        this.formData = { ...initialData };
        this.existingServerNames = existingServerNames;
        this.isEditing = isEditing;
        this.appendCloseButton(nls.localizeByDefault('取消'));
        this.appendAcceptButton(isEditing
            ? nls.localize('theia/ai/mcpConfiguration/form/saveChanges', '保存更改')
            : nls.localizeByDefault('添加服务器'));
    }

    get value(): MCPServerFormData | undefined {
        return this.formData;
    }

    protected override isValid(): string {
        const errors: string[] = [];

        if (!this.formData.name.trim()) {
            errors.push(nls.localize('theia/ai/mcpConfiguration/form/nameRequired', '服务器名称为必填项'));
        } else if (!this.isEditing && this.existingServerNames.includes(this.formData.name.trim())) {
            errors.push(nls.localize('theia/ai/mcpConfiguration/form/nameExists', '已存在同名服务器'));
        }

        if (this.formData.serverType === 'local') {
            if (!this.formData.command.trim()) {
                errors.push(nls.localize('theia/ai/mcpConfiguration/form/commandRequired', '本地服务器需要命令行支持'));
            }
        } else {
            if (!this.formData.serverUrl.trim()) {
                errors.push(nls.localize('theia/ai/mcpConfiguration/form/serverUrlRequired', '远程服务器需提供服务器URL'));
            }
        }

        return errors.join('. ');
    }

    protected handleFormChange = (field: keyof MCPServerFormData, value: string | boolean): void => {
        this.formData = { ...this.formData, [field]: value };
        this.update();
    };

    protected render(): React.ReactNode {
        return React.createElement(
            'div',
            { className: 'mcp-dialog-form' },
            React.createElement(
                'div',
                { className: 'mcp-form-field' },
                React.createElement('label', null, nls.localize('theia/ai/mcpConfiguration/form/serverName', '服务器名称') + ':'),
                React.createElement('input', {
                    type: 'text',
                    className: 'theia-input form-control',
                    value: this.formData.name,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => this.handleFormChange('name', e.target.value),
                    placeholder: nls.localize('theia/ai/mcpConfiguration/form/serverNamePlaceholder', '例如:my-mcp-server'),
                    disabled: this.isEditing,
                    spellCheck: false
                })
            ),
            React.createElement(
                'div',
                { className: 'mcp-form-field' },
                React.createElement('label', null, nls.localize('theia/ai/mcpConfiguration/form/serverType', '服务器类型') + ':'),
                React.createElement(
                    'select',
                    {
                        className: 'theia-select form-control',
                        defaultValue: this.formData.serverType,
                        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => this.handleFormChange('serverType', e.target.value as ServerType)
                    },
                    React.createElement('option', { value: 'local' }, '本地(命令)'),
                    React.createElement('option', { value: 'remote' }, '远程(URL)')
                )
            ),
            this.formData.serverType === 'local' ? this.renderLocalServerFields() : this.renderRemoteServerFields(),
            React.createElement(
                'div',
                { className: 'mcp-form-field mcp-form-checkbox' },
                React.createElement(
                    'label',
                    null,
                    React.createElement('input', {
                        type: 'checkbox',
                        className: 'theia-input form-control',
                        checked: this.formData.autostart,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => this.handleFormChange('autostart', e.target.checked)
                    }),
                    nls.localize('theia/ai/mcpConfiguration/form/autostart', '自动启动')
                )
            )
        );
    }

    protected renderLocalServerFields(): React.ReactNode {
        return React.createElement(
            React.Fragment,
            null,
            React.createElement(
                'div',
                { className: 'mcp-form-field' },
                React.createElement('label', null, nls.localizeByDefault('命令') + ':'),
                React.createElement('input', {
                    type: 'text',
                    className: 'theia-input form-control',
                    value: this.formData.command,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => this.handleFormChange('command', e.target.value),
                    placeholder: nls.localize('theia/ai/mcpConfiguration/form/commandPlaceholder', '例如:npx 或 uvx'),
                    spellCheck: false
                })
            ),
            React.createElement(
                'div',
                { className: 'mcp-form-field' },
                React.createElement('label', null, nls.localizeByDefault('参数') + ':'),
                React.createElement('input', {
                    type: 'text',
                    className: 'theia-input form-control',
                    value: this.formData.args,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => this.handleFormChange('args', e.target.value),
                    placeholder: nls.localize('theia/ai/mcpConfiguration/form/argsPlaceholder', '空格分隔,例如:-y @modelcontextprotocol/server-brave-search'),
                    spellCheck: false
                })
            ),
            React.createElement(
                'div',
                { className: 'mcp-form-field' },
                React.createElement('label', null, nls.localize('theia/ai/mcpConfiguration/environmentVariables', '环境变量') + ':'),
                React.createElement('textarea', {
                    className: 'theia-input form-control',
                    value: this.formData.env,
                    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => this.handleFormChange('env', e.target.value),
                    placeholder: nls.localize('theia/ai/mcpConfiguration/form/envPlaceholder', 'KEY=value(每行一个)'),
                    rows: 3,
                    spellCheck: false
                })
            )
        );
    }

    protected renderRemoteServerFields(): React.ReactNode {
        return React.createElement(
            React.Fragment,
            null,
            React.createElement(
                'div',
                { className: 'mcp-form-field' },
                React.createElement('label', null, nls.localize('theia/ai/mcpConfiguration/serverUrl', '服务器URL') + ':'),
                React.createElement('input', {
                    type: 'text',
                    className: 'theia-input form-control',
                    value: this.formData.serverUrl,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => this.handleFormChange('serverUrl', e.target.value),
                    placeholder: nls.localize('theia/ai/mcpConfiguration/form/serverUrlPlaceholder', '例如:https://mcp.example.com'),
                    spellCheck: false
                })
            ),
            React.createElement(
                'div',
                { className: 'mcp-form-field' },
                React.createElement('label', null, nls.localize('theia/ai/mcpConfiguration/serverAuthToken', '授权令牌') + ':'),
                React.createElement('input', {
                    type: 'password',
                    className: 'theia-input form-control',
                    value: this.formData.serverAuthToken,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => this.handleFormChange('serverAuthToken', e.target.value),
                    placeholder: nls.localize('theia/ai/mcpConfiguration/form/authTokenPlaceholder', '可选身份验证令牌'),
                    spellCheck: false
                })
            ),
            React.createElement(
                'div',
                { className: 'mcp-form-field' },
                React.createElement('label', null, nls.localize('theia/ai/mcpConfiguration/serverAuthTokenHeader', '身份验证标头名称') + ':'),
                React.createElement('input', {
                    type: 'text',
                    className: 'theia-input form-control',
                    value: this.formData.serverAuthTokenHeader,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => this.handleFormChange('serverAuthTokenHeader', e.target.value),
                    placeholder: nls.localize('theia/ai/mcpConfiguration/form/authHeaderPlaceholder', '默认值:基于Bearer的授权'),
                    spellCheck: false
                })
            ),
            React.createElement(
                'div',
                { className: 'mcp-form-field' },
                React.createElement('label', null, nls.localize('theia/ai/mcpConfiguration/headers', 'Headers') + ':'),
                React.createElement('textarea', {
                    className: 'theia-input form-control',
                    value: this.formData.headers,
                    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => this.handleFormChange('headers', e.target.value),
                    placeholder: nls.localize('theia/ai/mcpConfiguration/form/headersPlaceholder', 'Header-Name=value(每行一个)'),
                    rows: 3,
                    spellCheck: false
                })
            )
        );
    }
}

@injectable()
export class AIMCPConfigurationWidget extends ReactWidget {

    static readonly ID = 'ai-mcp-configuration-container-widget';
    static readonly LABEL = nls.localizeByDefault('MCP 服务器');

    protected servers: MCPServerDescription[] = [];
    protected expandedTools: Record<string, boolean> = {};

    @inject(MCPFrontendService)
    protected readonly mcpFrontendService: MCPFrontendService;

    @inject(MCPFrontendNotificationService)
    protected readonly mcpFrontendNotificationService: MCPFrontendNotificationService;

    @inject(HoverService)
    protected readonly hoverService: HoverService;

    @inject(NotificationService)
    protected readonly messageService: NotificationService;

    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    @postConstruct()
    protected init(): void {
        this.id = AIMCPConfigurationWidget.ID;
        this.title.label = AIMCPConfigurationWidget.LABEL;
        this.title.closable = false;
        this.toDispose.push(this.mcpFrontendNotificationService.onDidUpdateMCPServers(async () => {
            this.loadServers();
        }));
        this.loadServers();
    }

    protected async loadServers(): Promise<void> {
        const serverNames = (await this.mcpFrontendService.getServerNames()).sort((a, b) => a.localeCompare(b));
        const descriptions = await Promise.all(serverNames.map(name => this.mcpFrontendService.getServerDescription(name)));
        this.servers = descriptions.filter((desc): desc is MCPServerDescription => desc !== undefined);
        this.update();
    }

    protected getStatusColor(status?: MCPServerStatus): { bg: string, fg: string } {
        if (!status) {
            return { bg: 'var(--theia-descriptionForeground)', fg: 'white' };
        }
        switch (status) {
            case MCPServerStatus.Running:
            case MCPServerStatus.Connected:
                return { bg: 'var(--theia-successBackground)', fg: 'var(--theia-successForeground)' };
            case MCPServerStatus.Starting:
            case MCPServerStatus.Connecting:
                return { bg: 'var(--theia-warningBackground)', fg: 'var(--theia-warningForeground)' };
            case MCPServerStatus.Errored:
                return { bg: 'var(--theia-errorBackground)', fg: 'var(--theia-errorForeground)' };
            case MCPServerStatus.NotRunning:
            case MCPServerStatus.NotConnected:
            default:
                return { bg: 'var(--theia-inputValidation-infoBackground)', fg: 'var(--theia-inputValidation-infoForeground)' };
        }
    }

    protected showErrorHover(spanRef: React.RefObject<HTMLSpanElement>, error: string): void {
        this.hoverService.requestHover({ content: error, target: spanRef.current!, position: 'left' });
    }

    protected hideErrorHover(): void {
        this.hoverService.cancelHover();
    }

    protected async handleStartServer(serverName: string): Promise<void> {
        await this.mcpFrontendService.startServer(serverName);
    }

    protected async handleStopServer(serverName: string): Promise<void> {
        await this.mcpFrontendService.stopServer(serverName);
    }

    protected renderButton(text: React.ReactNode,
        title: string,
        onClick: React.MouseEventHandler<HTMLButtonElement>,
        className?: string,
        style?: React.CSSProperties): React.ReactNode {
        return React.createElement(
            'button',
            { className: className, title: title, onClick: onClick, style: style },
            text
        );
    }

    protected renderStatusBadge(server: MCPServerDescription): React.ReactNode {
        const colors = this.getStatusColor(server.status);
        let displayStatus = server.status;
        if (!displayStatus) {
            displayStatus = isRemoteMCPServerDescription(server) ? MCPServerStatus.NotConnected : MCPServerStatus.NotRunning;
        }
        const spanRef = React.createRef<HTMLSpanElement>();
        const error = server.error;
        return React.createElement(
            'div',
            { 
                className: 'mcp-status-container',
            },
            React.createElement(
                'span',
                {
                    className: 'mcp-status-badge',
                    style: {
                        backgroundColor: colors.bg,
                        color: colors.fg
                    }
                },
                displayStatus
            ),
            error ? React.createElement(
                'span',
                {
                    onMouseEnter: () => this.showErrorHover(spanRef, error),
                    onMouseLeave: () => this.hideErrorHover(),
                    ref: spanRef,
                    className: 'mcp-error-indicator codicon codicon-warning',
                }
            ) : null
        );
    }

    protected renderServerHeader(server: MCPServerDescription): React.ReactNode {
        const isStoppable = server.status === MCPServerStatus.Running
            || server.status === MCPServerStatus.Connected;
        const isStarting = server.status === MCPServerStatus.Starting
            || server.status === MCPServerStatus.Connecting;
        const isStartable = server.status === MCPServerStatus.NotRunning
            || server.status === MCPServerStatus.NotConnected
            || server.status === MCPServerStatus.Errored;

        const isRemote = isRemoteMCPServerDescription(server);
        const startIcon = isRemote ? 'plug' : 'play';
        const startingIcon = 'loading';
        const stopIcon = isRemote ? 'debug-disconnect' : 'debug-stop';
        const startLabel = isRemote
            ? nls.localize('theia/ai/mcpConfiguration/connectServer', '连接')
            : nls.localizeByDefault('启动服务器');
        const startingLabel = isRemote
            ? nls.localize('theia/ai/mcpConfiguration/connectingServer', '连接中...')
            : nls.localizeByDefault('启动中...');
        const stopLabel = isRemote
            ? nls.localizeByDefault('断开')
            : nls.localizeByDefault('停止服务器');

        return React.createElement(
            'div',
            { className: 'mcp-server-header' },
            React.createElement(
                'div',
                { className: 'mcp-server-name' },
                server.name
            ),
            React.createElement(
                'div',
                { className: 'mcp-server-header-controls' },
                this.renderStatusBadge(server),
                isStartable ? React.createElement('button', {
                    className: 'mcp-action-button ' + codicon(startIcon),
                    onClick: () => this.handleStartServer(server.name),
                    title: startLabel
                }) : null,
                isStarting ? React.createElement('button', {
                    className: 'mcp-action-button ' + codicon(startingIcon) + ' theia-animation-spin',
                    disabled: true,
                    title: startingLabel
                }) : null,
                isStoppable ? React.createElement('button', {
                    className: 'mcp-action-button ' + codicon(stopIcon),
                    onClick: () => this.handleStopServer(server.name),
                    title: stopLabel
                }) : null,
                React.createElement('button', {
                    className: 'mcp-action-button ' + codicon('edit'),
                    onClick: () => this.openEditServerDialog(server),
                    title: nls.localize('theia/ai/mcpConfiguration/editServer', '编辑服务器')
                }),
                React.createElement('button', {
                    className: 'mcp-action-button mcp-delete-button ' + codicon('trash'),
                    onClick: () => this.handleDeleteServer(server.name),
                    title: nls.localize('theia/ai/mcpConfiguration/deleteServer', '删除服务器')
                })
            )
        );
    }

    protected renderCommandSection(server: MCPServerDescription): React.ReactNode {
        if (!isLocalMCPServerDescription(server)) {
            return null;
        }
        return React.createElement(
            'div',
            { className: 'mcp-property-row' },
            React.createElement(
                'span',
                { className: 'mcp-property-label' },
                nls.localizeByDefault('命令') + ':'
            ),
            React.createElement(
                'code',
                { className: 'mcp-property-value' },
                server.command
            )
        );
    }

    protected renderArgumentsSection(server: MCPServerDescription): React.ReactNode {
        if (!isLocalMCPServerDescription(server) || !server.args || server.args.length === 0) {
            return null;
        }
        return React.createElement(
            'div',
            { className: 'mcp-property-row' },
            React.createElement(
                'span',
                { className: 'mcp-property-label' },
                nls.localizeByDefault('参数') + ':'
            ),
            React.createElement(
                'code',
                { className: 'mcp-property-value' },
                server.args.join(' ')
            )
        );
    }

    protected renderEnvironmentSection(server: MCPServerDescription): React.ReactNode {
        if (!isLocalMCPServerDescription(server) || !server.env || Object.keys(server.env).length === 0) {
            return null;
        }
        return React.createElement(
            'div',
            { className: 'mcp-property-row' },
            React.createElement(
                'span',
                { className: 'mcp-property-label' },
                nls.localize('theia/ai/mcpConfiguration/environmentVariables', '环境变量') + ':'
            ),
            React.createElement(
                'div',
                { className: 'mcp-property-value' },
                Object.entries(server.env).map(([key, value]) =>
                    React.createElement(
                        'div',
                        { key: key, className: 'mcp-env-entry' },
                        React.createElement(
                            'code',
                            null,
                            key + '=' + (key.toLowerCase().includes('token') ? '******' : String(value))
                        )
                    )
                )
            )
        );
    }

    protected renderServerUrlSection(server: MCPServerDescription): React.ReactNode {
        if (!isRemoteMCPServerDescription(server)) {
            return null;
        }
        return React.createElement(
            'div',
            { className: 'mcp-property-row' },
            React.createElement(
                'span',
                { className: 'mcp-property-label' },
                nls.localize('theia/ai/mcpConfiguration/serverUrl', '服务器URL') + ':'
            ),
            React.createElement(
                'code',
                { className: 'mcp-property-value' },
                server.serverUrl
            )
        );
    }

    protected renderServerAuthTokenHeaderSection(server: MCPServerDescription): React.ReactNode {
        if (!isRemoteMCPServerDescription(server) || !server.serverAuthTokenHeader) {
            return null;
        }
        return React.createElement(
            'div',
            { className: 'mcp-property-row' },
            React.createElement(
                'span',
                { className: 'mcp-property-label' },
                nls.localize('theia/ai/mcpConfiguration/serverAuthTokenHeader', '身份验证标头名称') + ':'
            ),
            React.createElement(
                'code',
                { className: 'mcp-property-value' },
                server.serverAuthTokenHeader
            )
        );
    }

    protected renderServerAuthTokenSection(server: MCPServerDescription): React.ReactNode {
        if (!isRemoteMCPServerDescription(server) || !server.serverAuthToken) {
            return null;
        }
        return React.createElement(
            'div',
            { className: 'mcp-property-row' },
            React.createElement(
                'span',
                { className: 'mcp-property-label' },
                nls.localize('theia/ai/mcpConfiguration/serverAuthToken', '授权令牌') + ':'
            ),
            React.createElement(
                'code',
                { className: 'mcp-property-value' },
                '******'
            )
        );
    }

    protected renderServerHeadersSection(server: MCPServerDescription): React.ReactNode {
        if (!isRemoteMCPServerDescription(server) || !server.headers) {
            return null;
        }
        return React.createElement(
            'div',
            { className: 'mcp-property-row' },
            React.createElement(
                'span',
                { className: 'mcp-property-label' },
                nls.localize('theia/ai/mcpConfiguration/headers', 'Headers') + ':'
            ),
            React.createElement(
                'div',
                { className: 'mcp-property-value' },
                Object.entries(server.headers).map(([key, value]) =>
                    React.createElement(
                        'div',
                        { key: key, className: 'mcp-env-entry' },
                        React.createElement(
                            'code',
                            null,
                            key + '=' + ((key.toLowerCase().includes('token') || key.toLowerCase().includes('authorization')) ? '******' : String(value))
                        )
                    )
                )
            )
        );
    }

    protected renderAutostartSection(server: MCPServerDescription): React.ReactNode {
        return React.createElement(
            'div',
            { className: 'mcp-property-row' },
            React.createElement(
                'span',
                { className: 'mcp-property-label' },
                nls.localize('theia/ai/mcpConfiguration/autostart', '自动启动') + ':'
            ),
            React.createElement(
                'span',
                {
                    className: 'mcp-autostart-badge',
                    style: {
                        color: server.autostart ? 'var(--theia-successForeground)' : 'var(--theia-errorForeground)',
                    }
                },
                server.autostart ? nls.localizeByDefault('已启用') : nls.localizeByDefault('已禁用')
            )
        );
    }

    protected renderToolsSection(server: MCPServerDescription): React.ReactNode {
        if (!server.tools || server.tools.length === 0) {
            return null;
        }
        const isToolsExpanded = this.expandedTools[server.name] || false;
        return React.createElement(
            'div',
            { className: 'mcp-tools-section' },
            React.createElement(
                'div',
                { className: 'mcp-tools-header', onClick: () => this.toggleTools(server.name) },
                React.createElement(
                    'div',
                    { className: 'mcp-toggle-indicator' },
                    React.createElement(
                        'span',
                        { className: `mcp-toggle-icon codicon codicon-triangle-${isToolsExpanded ?  "down" : 'right'}` }
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'mcp-tools-label-container' },
                    React.createElement(
                        'span',
                        { className: 'mcp-section-label' },
                        nls.localize('theia/ai/mcpConfiguration/tools', '工具: ')
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'mcp-tools-actions' },
                    this.renderButton(
                        React.createElement('i', { className: 'codicon codicon-versions' }),
                        nls.localize('theia/ai/mcpConfiguration/copyAllList', '复制全部(所有工具列表)'),
                        (e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            if (server.tools) {
                                const toolNames = server.tools.map(tool => `~{mcp_${server.name}_${tool.name}}`).join('\n');
                                navigator.clipboard.writeText(toolNames);
                                this.messageService.info(nls.localize('theia/ai/mcpConfiguration/copiedAllList', '已将所有工具复制到剪贴板(工具完整列表)'));
                            }
                        },
                        'mcp-copy-tool-button'
                    ),
                    this.renderButton(
                        React.createElement('i', { className: 'codicon codicon-bracket' }),
                        nls.localize('theia/ai/mcpConfiguration/copyForPromptTemplate', '复制全部内容用于提示模板(包含所有工具的单一提示片段)'),
                        (e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(`{{${PROMPT_VARIABLE.name}:${this.mcpFrontendService.getPromptTemplateId(server.name)}}}`);
                            this.messageService.info(nls.localize('theia/ai/mcpConfiguration/copiedForPromptTemplate', '将所有工具复制到剪贴板用于提示模板(包含所有工具的单个提示片段)'));
                        },
                        'mcp-copy-tool-button'
                    ),
                    this.renderButton(
                        React.createElement('i', { className: 'codicon codicon-copy' }),
                        nls.localize('theia/ai/mcpConfiguration/copyAllSingle', '复制全部用于聊天(包含所有工具的单一提示符片段)'),
                        (e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(`#${PROMPT_VARIABLE.name}:${this.mcpFrontendService.getPromptTemplateId(server.name)}`);
                            this.messageService.info(nls.localize('theia/ai/mcpConfiguration/copiedAllSingle', '已将所有工具复制到剪贴板(包含所有工具的单行提示符片段)'));
                        },
                        'mcp-copy-tool-button'
                    )
                )
            ),
            isToolsExpanded ? React.createElement(
                'div',
                { className: 'mcp-tools-list' },
                server.tools.map(tool =>
                    React.createElement(
                        'div',
                        { key: tool.name, className: 'mcp-tool-item' },
                        React.createElement(
                            'div',
                            { className: 'mcp-tool-content' },
                            React.createElement('strong', null, tool.name + ':'),
                            ' ' + tool.description
                        ),
                        React.createElement(
                            'div',
                            { className: 'mcp-tool-actions' },
                            this.renderButton(
                                React.createElement('i', { className: 'codicon codicon-copy' }),
                                nls.localize('theia/ai/mcpConfiguration/copyForPrompt', '复制工具(用于聊天或提示模板)'),
                                (e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    const copied = `~{mcp_${server.name}_${tool.name}}`;
                                    navigator.clipboard.writeText(copied);
                                    this.messageService.info(`已将 ${copied} 复制到剪贴板（用于聊天或提示模板）`);
                                },
                                'mcp-copy-tool-button'
                            )
                        )
                    )
                )
            ) : null
        );
    }

    protected toggleTools(serverName: string): void {
        this.expandedTools[serverName] = !this.expandedTools[serverName];
        this.update();
    }

    protected renderServerCard(server: MCPServerDescription): React.ReactNode {
        return React.createElement(
            'div',
            { key: server.name, className: 'mcp-server-card' },
            this.renderServerHeader(server),
            React.createElement(
                'div',
                { className: 'mcp-server-content' },
                this.renderCommandSection(server),
                this.renderArgumentsSection(server),
                this.renderEnvironmentSection(server),
                this.renderServerUrlSection(server),
                this.renderServerAuthTokenHeaderSection(server),
                this.renderServerAuthTokenSection(server),
                this.renderServerHeadersSection(server),
                this.renderAutostartSection(server)
            ),
            this.renderToolsSection(server)
        );
    }

    protected async openAddServerDialog(): Promise<void> {
        const dialog = new MCPServerDialog(
            { title: nls.localizeByDefault('添加 MCP 服务器'), maxWidth: 700 },
            { ...DEFAULT_FORM_DATA },
            this.servers.map(s => s.name),
            false
        );
        const result = await dialog.open();
        if (result) {
            await this.saveServer(result);
        }
    }

    protected async openEditServerDialog(server: MCPServerDescription): Promise<void> {
        let formData: MCPServerFormData;

        if (isLocalMCPServerDescription(server)) {
            formData = {
                name: server.name,
                serverType: 'local',
                command: server.command,
                args: server.args?.join(' ') ?? '',
                env: server.env ? Object.entries(server.env).map(([k, v]) => `${k}=${v}`).join('\n') : '',
                serverUrl: '',
                serverAuthToken: '',
                serverAuthTokenHeader: '',
                headers: '',
                autostart: server.autostart ?? true
            };
        } else if (isRemoteMCPServerDescription(server)) {
            formData = {
                name: server.name,
                serverType: 'remote',
                command: '',
                args: '',
                env: '',
                serverUrl: server.serverUrl,
                serverAuthToken: server.serverAuthToken ?? '',
                serverAuthTokenHeader: server.serverAuthTokenHeader ?? '',
                headers: server.headers
                    ? Object.entries(server.headers).map(([k, v]) => `${k}=${v}`).join('\n')
                    : '',
                autostart: server.autostart ?? true
            };
        } else {
            return;
        }

        const dialog = new MCPServerDialog(
            { title: nls.localize('theia/ai/mcpConfiguration/editServerTitle', '修改 MCP 服务器'), maxWidth: 500 },
            formData,
            this.servers.filter(s => s.name !== server.name).map(s => s.name),
            true
        );
        const result = await dialog.open();
        if (result) {
            await this.saveServer(result);
        }
    }

    protected parseKeyValuePairs(input: string): Record<string, string> | undefined {
        if (!input.trim()) {
            return undefined;
        }
        const result: Record<string, string> = {};
        const lines = input.split('\n').filter(line => line.trim());
        for (const line of lines) {
            const eqIndex = line.indexOf('=');
            if (eqIndex > 0) {
                const key = line.substring(0, eqIndex).trim();
                const value = line.substring(eqIndex + 1).trim();
                if (key) {
                    result[key] = value;
                }
            }
        }
        return Object.keys(result).length > 0 ? result : undefined;
    }

    protected async saveServer(formData: MCPServerFormData): Promise<void> {
        const currentServers = this.preferenceService.get<Record<string, object>>(MCP_SERVERS_PREF, {});
        const newServers = { ...currentServers };
        const serverName = formData.name.trim();

        if (formData.serverType === 'local') {
            const serverConfig: Partial<LocalMCPServerDescription> = {
                command: formData.command.trim(),
                autostart: formData.autostart
            };
            if (formData.args.trim()) {
                serverConfig.args = formData.args.trim().split(/\s+/);
            }
            const env = this.parseKeyValuePairs(formData.env);
            if (env) {
                serverConfig.env = env;
            }
            newServers[serverName] = serverConfig;
        } else {
            const serverConfig: Partial<RemoteMCPServerDescription> = {
                serverUrl: formData.serverUrl.trim(),
                autostart: formData.autostart
            };
            if (formData.serverAuthToken.trim()) {
                serverConfig.serverAuthToken = formData.serverAuthToken.trim();
            }
            if (formData.serverAuthTokenHeader.trim()) {
                serverConfig.serverAuthTokenHeader = formData.serverAuthTokenHeader.trim();
            }
            const headers = this.parseKeyValuePairs(formData.headers);
            if (headers) {
                serverConfig.headers = headers;
            }
            newServers[serverName] = serverConfig;
        }

        try {
            await this.preferenceService.set(MCP_SERVERS_PREF, newServers);
        } catch (error) {
            this.messageService.error(nls.localize('theia/ai/mcpConfiguration/saveServerError', '保存MCP服务器配置失败：{0}', String(error)));
        }
    }

    protected async handleDeleteServer(serverName: string): Promise<void> {
        const dialog = new ConfirmDialog({
            title: nls.localize('theia/ai/mcpConfiguration/deleteServerDialogTitle', '删除 MCP 服务器'),
            msg: nls.localize('theia/ai/mcpConfiguration/deleteServerDialogMsg', '您确定要删除此服务器"{0}"?', serverName),
            ok: nls.localizeByDefault('删除'),
            cancel: nls.localizeByDefault('取消')
        });

        const shouldDelete = await dialog.open();
        if (shouldDelete) {
            try {
                const currentServers = this.preferenceService.get<Record<string, object>>(MCP_SERVERS_PREF, {});
                const newServers = { ...currentServers };
                delete newServers[serverName];
                await this.preferenceService.set(MCP_SERVERS_PREF, newServers);
            } catch (error) {
                this.messageService.error(nls.localize('theia/ai/mcpConfiguration/deleteServerError', '删除MCP服务器失败：{0}', String(error)));
            }
        }
    }

    protected render(): React.ReactNode {
        return React.createElement(
            'div',
            { className: 'mcp-configuration-container' },
            React.createElement(
                'div',
                { className: 'mcp-header-actions' },
                React.createElement(
                    'button',
                    { className: 'theia-button main', onClick: () => this.openAddServerDialog() },
                    React.createElement('i', { className: codicon('add') }),
                    nls.localizeByDefault('添加 MCP 服务器')
                )
            ),
            this.servers.length === 0 ? React.createElement(
                'div',
                { className: 'mcp-no-servers' },
                nls.localizeByDefault('未配置 MCP 服务器')
            ) : this.servers.map(server => this.renderServerCard(server))
        );
    }
}