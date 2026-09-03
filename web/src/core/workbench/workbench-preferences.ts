import { PreferenceSchema } from "@MagicIdea/core/preferences/preference-types";

export const WORKBENCH_EDITOR_ASSOCIATIONS= 'workbench.editorAssociations';

export const MagicIdeaWorkbenchPreferencesSchema: PreferenceSchema = {
  "title": "工作台",
  "properties": {
    [WORKBENCH_EDITOR_ASSOCIATIONS]: {
      type: 'object',
      title: '编辑器关联',
      description: '配置打开的编辑器(例如 "*.bpmn": "trubo.flow-editor")。这些优先于默认行为。',
      patternProperties: {
          '.*': {
              type: 'string'
          }
      }
    },
  }
};
