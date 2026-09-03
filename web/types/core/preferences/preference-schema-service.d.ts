import { JSONValue } from "@lumino/coreutils";
import { PreferenceSchema, PreferenceProperty } from "./preference-types";
import { ContributionProvider } from "../common/contribution-provider";
import { PreferenceContribution } from "./preference-contribution";
export declare const PreferenceSchemaService: unique symbol;
export interface PreferenceSchemaService {
    addSchema(schema: PreferenceSchema): void;
    getSchemaProperty(key: string): PreferenceProperty | undefined;
    getSchemaProperties(): ReadonlyMap<string, PreferenceProperty>;
    isOverridable(key: string): boolean;
    getDefaultValue(key: string): JSONValue | undefined;
    getAllKeys(): string[];
}
export declare class PreferenceSchemaServiceImpl implements PreferenceSchemaService {
    protected readonly contributions: ContributionProvider<PreferenceContribution>;
    private readonly properties;
    private readonly schemas;
    constructor(contributions: ContributionProvider<PreferenceContribution>);
    /** 添加模块偏好Schema */
    addSchema(schema: PreferenceSchema): void;
    /** 获取属性定义 */
    getSchemaProperty(key: string): PreferenceProperty | undefined;
    /** 获取全部属性 */
    getSchemaProperties(): ReadonlyMap<string, PreferenceProperty>;
    /** 检查键是否允许用户覆盖 */
    isOverridable(key: string): boolean;
    /** 获取默认值 */
    getDefaultValue(key: string): JSONValue | undefined;
    /** 获取所有已注册的键 */
    getAllKeys(): string[];
}
