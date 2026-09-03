import { interfaces } from 'inversify';
import { bindContributionProvider } from "../common/contribution-provider";

import { KeybindingRegistry, KeybindingContribution } from './keybinding-registry';

export * from './keybinding-registry';
export * from './keybinding-type';
export * from '../context-key-service';

/**
 * 绑定快捷键服务接口依赖
 * @param bind 
 */
export function bindCommandKeybindModule(bind: interfaces.Bind): void {
    bind(KeybindingRegistry).toSelf().inSingletonScope();

    bindContributionProvider(bind, KeybindingContribution);
}
