import type { PluginManifest } from "./plugin-types";
import _compact from "lodash/compact";

/**
 * 内置插件列表
 *
 * 该列表中的插件会被强制安装
 */
export const builtinPlugins: PluginManifest[] = _compact([
  // {
  //   "label": "测试插件",
  //   "name": "cn.magic-idea.helloworld",
  //   "url": "plugins/cn.magic-idea.helloworld/index.js",
  //   "icon": "plugins/cn.magic-idea.helloworld/assets/icon.png",
  //   "description": "这是一个测试插件，用于演示如何开发插件。",
  //   "author": "amofly",
  //   "version": "1.0.0",
  //   "requireRestart": false,
  //   'isBuiltIn': true,
  //   "rating": 4.5,
  //   "downloads": 10000,
  // },
  // {
  //   "label": "Demo 编辑器插件",
  //   "name": "cn.magic-idea.demo-editor",
  //   "url": "plugins/cn.magic-idea.demo-editor/index.js",
  //   "icon": "plugins/cn.magic-idea.demo-editor/assets/icon.png",
  //   "description": "这是一个Demo编辑器插件，用于演示如何开发编辑器插件。",
  //   "author": "amofly",
  //   "version": "0.0.1",
  //   "requireRestart": true,
  //   'isBuiltIn': true,
  // }
]);
