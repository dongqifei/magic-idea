import { ContainerModule } from "inversify";
/**
 * 构建一组注册列表的方式
 * 用于从其他地方统一获取数据
 */
export declare function buildRegList<T>(): [T[], (item: T) => void];
export declare const pluginContainerModule: ContainerModule[], regContainerModule: (item: ContainerModule) => void;
