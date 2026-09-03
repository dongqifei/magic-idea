import {  PreferenceSchema } from '../core/preferences/preference-types';

export const MonacoEditorSchema: PreferenceSchema = {
  title: 'Monaco 编辑器',
  properties: {
    "editor.cursorBlinking": {
        "title": "光标动画样式",
        "description": '控制光标动画样式。',
        "type": "string",
        "enum": [
            "blink",
            "smooth",
            "phase",
            "expand",
            "solid"
        ],
        "default": "blink",
    },
    "editor.cursorSmoothCaretAnimation": {
        "title": '控制光标平滑移动。',
        "description": "控制是否应启用平滑插入符号动画。",
        "type": "string",
        "enum": [
            "off",
            "explicit",
            "on"
        ],
        "default": "off",
    },
    "editor.cursorStyle": {
        "title": "光标样式",
        "description": "控制插入输入模式下的光标样式。",
        "type": "string",
        "enum": [
            "line",
            "block",
            "underline",
            "line-thin",
            "block-outline",
            "underline-thin"
        ],
        "default": "line",
    },
    "editor.cursorSurroundingLinesStyle": {
        "title": "光标周围线条样式",
        "description": "控制何时应强制执行`#editor.cursorroundingLines#`。",
        "type": "string",
        "enum": [
            "default",
            "all"
        ],
        "default": "default",
    },
    "editor.cursorWidth": {
        "title": "光标宽度",
        "description": "当`#editor.cursorStyle#`设置为`line`时，控制光标的宽度。",
        "type": "number",
        "default": 0,
        "minimum": 0,
        "maximum": 1073741824,
    },
    'editor.fontSize': {
      title:"字体大小",
      type: 'number',
      default: 14,
      description: '控制编辑器字体大小（px）',
      enum: [
        10,
        12,
        14,
        16,
        18,
        20,
        22,
        24
      ],
      overridable: true
    },
    'editor.fontFamily': {
      title:"字体",
      type: 'string',
      default: 'Consolas, "Courier New", monospace',
      description: '控制编辑器字体',
      overridable: true
    },
    'editor.tabSize': {
      title:"Tab缩进",
      type: 'number',
      default: 2,
      description: '控制编辑器Tab缩进宽度',
      enum: [2, 4, 8],
      overridable: true
    },
    'editor.wordWrap': {
      title:"自动换行模式",
      type: 'string',
      default: 'off',
      description: '控制编辑器自动换行模式',
      enum: ['off', 'on', 'wordWrapColumn', 'bounded'],
      overridable: true
    },
    'editor.lineNumbers': {
      title:"行号显示模式",
      type: 'string',
      default: 'on',
      description: '控制编辑器行号显示模式',
      enum: ['on', 'off', 'relative'],
      overridable: true
    },
    "editor.minimap.enabled": {
        "title": "小地图",
        "type": "boolean",
        "default": true,
        "description": "控制是否显示小地图。",

    },
    "editor.minimap.autohide": {
        "title": "自动隐藏小地图",
        "type": "boolean",
        "default": false,
        "description": "控制是否自动隐藏小地图。",
    },
    "editor.formatOnPaste": {
        "title": "粘贴时格式化",
        "description": "控制编辑器是否应自动设置粘贴内容的格式。格式化程序必须可用，并且格式化程序应该能够格式化文档中的范围。",
        "type": "boolean",
        "default": false,
    },
    "editor.formatOnType": {
        "title": "按类型格式化",
        "description": "控制编辑器在键入一行后是否自动格式化该行。",
        "type": "boolean",
        "default": false,
    },
  }
};
