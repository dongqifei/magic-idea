import { injectable, inject, named } from "inversify";
import { JSONValue } from "@lumino/coreutils";
import { PreferenceSchema, PreferenceProperty } from "./preference-types";
import { ContributionProvider } from "../common/contribution-provider";
import { PreferenceContribution } from "./preference-contribution";

export const PreferenceSchemaService = Symbol("PreferenceSchemaService");

export interface PreferenceSchemaService {
  addSchema(schema: PreferenceSchema): void;
  getSchemaProperty(key: string): PreferenceProperty | undefined;
  getSchemaProperties(): ReadonlyMap<string, PreferenceProperty>;
  isOverridable(key: string): boolean;
  getDefaultValue(key: string): JSONValue | undefined;
  getAllKeys(): string[];
}

@injectable()
export class PreferenceSchemaServiceImpl implements PreferenceSchemaService {
  private readonly properties = new Map<string, PreferenceProperty>();
  private readonly schemas = new Set<PreferenceSchema>();

  constructor(
    @inject(ContributionProvider)
    @named(PreferenceContribution)
    protected readonly contributions: ContributionProvider<PreferenceContribution>
  ) {
    this.contributions.getContributions().forEach((contribution) => {
      this.addSchema(contribution.schema);
    });
  }

  /** 添加模块偏好Schema */
  addSchema(schema: PreferenceSchema): void {
    this.schemas.add(schema);
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (this.properties.has(key)) {
        throw new Error(`重复的偏好设置键: ${key}`);
      }
      // 合并Schema级配置
      this.properties.set(key, {
        ...prop,
        overridable: prop.overridable ?? schema.defaultOverridable ?? true,
      });
    }
  }

  /** 获取属性定义 */
  getSchemaProperty(key: string): PreferenceProperty | undefined {
    return this.properties.get(key);
  }

  /** 获取全部属性 */
  getSchemaProperties(): ReadonlyMap<string, PreferenceProperty> {
    return this.properties;
  }

  /** 检查键是否允许用户覆盖 */
  isOverridable(key: string): boolean {
    return this.properties.get(key)?.overridable ?? false;
  }

  /** 获取默认值 */
  getDefaultValue(key: string): JSONValue | undefined {
    return this.properties.get(key)?.default;
  }

  /** 获取所有已注册的键 */
  getAllKeys(): string[] {
    return Array.from(this.properties.keys());
  }
}
