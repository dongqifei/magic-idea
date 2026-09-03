
import { interfaces } from 'inversify';
import { MenuContribution } from '@MagicIdea/core/common'
import { CommandContribution } from "@MagicIdea/core/commands";
import { KeybindingContribution } from "@MagicIdea/core/keybinding";

import { RunDebugConsoleWidget } from './run-debug-console-widget';
import { RunDebugResultWidget } from './run-debug-result-widget';
import { RunDebugContribution } from './run-debug-contribution';

export * from './run-debug-console-widget';
export * from './run-debug-result-widget';

/**
 * 绑定运行调试模块接口依赖
 * @param bind 
 */
export function bindRunDebugModule(bind: interfaces.Bind): void {
  // 绑定 Widget
  bind(RunDebugConsoleWidget).to(RunDebugConsoleWidget).inSingletonScope();
  bind(RunDebugResultWidget).toSelf().inSingletonScope();

  bind(RunDebugContribution).toSelf().inSingletonScope();
  
  [CommandContribution, KeybindingContribution, MenuContribution].forEach(
    (serviceIdentifier) => {
      bind(serviceIdentifier).toService(RunDebugContribution);
    },
  );
}
