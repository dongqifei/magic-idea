import { interfaces } from "inversify";
import { NotificationService } from "./notification-service";
import { NotificationCenterWidget } from "./notification-widget";

export function bindNotificationModule (bind: interfaces.Bind): void {
  bind(NotificationService).toSelf().inSingletonScope();
  bind(NotificationCenterWidget).toSelf().inSingletonScope();
}
