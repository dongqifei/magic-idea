import URI from '../common/uri';
import { JSONValue } from '@lumino/coreutils';
import { IJSONSchema } from '../common/json-schema';
/** 偏好设置作用域（简化为默认值+用户配置） */
export declare enum PreferenceScope {
    Default = 1,// 模块默认值（不可修改）
    User = 2
}
/** 偏好设置属性定义 */
export interface PreferenceProperty extends IJSONSchema {
    overridable?: boolean;
}
/** 偏好设置Schema（各模块配置定义） */
export interface PreferenceSchema {
    title: string;
    properties: Record<string, PreferenceProperty>;
    required?: string[];
    defaultOverridable?: boolean;
}
/** 偏好变更事件 */
export interface PreferenceChange {
    key: string;
    oldValue?: JSONValue;
    newValue?: JSONValue;
    scope: PreferenceScope;
}
/** Provider数据变更结构 */
export interface PreferenceProviderDataChange {
    preferenceName: string;
    oldValue?: JSONValue;
    newValue?: JSONValue;
    scope: PreferenceScope;
}
/** Provider解析结果 */
export interface PreferenceResolveResult<T> {
    value: T | undefined;
    configUri?: URI;
}
