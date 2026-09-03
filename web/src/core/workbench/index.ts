import { interfaces } from 'inversify';
import { PreferenceContribution } from '@MagicIdea/core/preferences/preference-contribution';

import { MagicIdeaWorkbenchPreferencesSchema } from './workbench-preferences';

/**
 * 绑定工作台接口依赖
 * @param bind 
 */
export function bindWorkbenchModule(bind: interfaces.Bind): void {
  // 绑定工作台偏好配置
  bind(PreferenceContribution).toConstantValue({ schema: MagicIdeaWorkbenchPreferencesSchema });
}
