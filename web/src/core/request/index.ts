import { interfaces } from 'inversify';
import { WebSocketConnectionProvider } from '../browser/messaging';
import { XHRBrowserRequestService } from './browser-request-service';
import { BackendRequestService, RequestService, REQUEST_SERVICE_PATH } from './common-request-service';

/**
 * 绑定请求接口依赖
 * @param bind 
 */
export function bindRequsetModule(bind: interfaces.Bind): void {
    // 绑定请求服务
    bind(RequestService).to(XHRBrowserRequestService).inSingletonScope();

    bind(BackendRequestService).toDynamicValue(ctx =>
        WebSocketConnectionProvider.createProxy<RequestService>(ctx.container, REQUEST_SERVICE_PATH)
    ).inSingletonScope();
}
