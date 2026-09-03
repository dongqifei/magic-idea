import { interfaces } from "inversify";
export * from "./preference-types";
export * from "./preference-service";
export * from "./preference-schema-service";
export * from "./preference-provider";
export * from "./preference-contribution";
export declare function bindPreferencesModule(bind: interfaces.Bind): void;
