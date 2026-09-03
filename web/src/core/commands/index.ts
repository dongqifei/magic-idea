import { CommandRegistry } from '@lumino/commands';
import { interfaces } from 'inversify';
import { bindContributionProvider } from "../common/contribution-provider";
import {
  CommandPaletteService,
} from "./command-palette-type";
import { CommandPaletteServiceImpl } from "./command-palette-service";
import { CommandRegistryImpl } from "./command-registry-impl";
import { CommandContribution } from "./command-types";

export * from "./command-palette-type";
export * from "./command-types";

export { CommandRegistry };

export type CommandFunc<T> = (...args: any[]) => T;

/**
 * 绑定接口依赖
 * @param bind 
 */
export function bindCommandsModule(bind: interfaces.Bind): void {
    // 绑定快速输入服务
    bind(CommandRegistry).to(CommandRegistry).inSingletonScope();
    bind(CommandPaletteService).to(CommandPaletteServiceImpl).inSingletonScope();

    bind(CommandRegistryImpl).toSelf().inSingletonScope();
    bindContributionProvider(bind, CommandContribution);
}
