
import {
  ContainerModule,
} from "inversify";

/**
 * 构建一组注册列表的方式
 * 用于从其他地方统一获取数据
 */
export function buildRegList<T>(): [T[], (item: T) => void] {
    const list: T[] = [];

    const reg = (item: T) => {
        list.push(item);
    };

    return [list, reg];
}

export const [pluginContainerModule, regContainerModule] =
    buildRegList<ContainerModule>();

// regContainerModule(new ContainerModule((bind) => {
//   bind(FrontendApplicationContribution).to(PluginManager);
// }))