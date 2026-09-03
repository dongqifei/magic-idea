/**
 * 依赖注入容器配置
 */
import "reflect-metadata";
import { Container, interfaces } from "inversify";
declare const container: Container;
declare const initAppContainer: (bindOtherModule: (bind: interfaces.Bind, unbind: any, isBound: any, rebind: any) => void) => Promise<Container>;
export { container, initAppContainer };
