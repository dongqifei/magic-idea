// *****************************************************************************
// Copyright (C) 2024 TypeFox and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { UndoRedoHandler } from "../core/undo-redo/undo-redo-handler";
import { injectable, inject } from "inversify";
import * as monaco from "monaco-editor";
import { ICodeEditorService } from "monaco-editor/esm/vs/editor/browser/services/codeEditorService";
import { StandaloneServices } from "monaco-editor/esm/vs/editor/standalone/browser/standaloneServices";
import { EditorManager } from "./editor-manager";
import { EditorWidget } from "./editor-widget";

// ========================= 抽象类与处理器实现 =========================
@injectable()
export abstract class AbstractMonacoUndoRedoHandler
  implements UndoRedoHandler<monaco.editor.ICodeEditor>
{
  // 修复 TS2564：抽象类属性初始化
  priority: number = 0;

  abstract select(): monaco.editor.ICodeEditor | undefined;

  undo(item: monaco.editor.ICodeEditor): void {
    // 调用 Monaco 原生命令
    item.trigger("MonacoUndoRedoHandler", "undo", undefined);
  }

  redo(item: monaco.editor.ICodeEditor): void {
    item.trigger("MonacoUndoRedoHandler", "redo", undefined);
  }
}

@injectable()
export class FocusedMonacoUndoRedoHandler extends AbstractMonacoUndoRedoHandler {
  // 优先级（最高）
  override priority = 10000;

  protected codeEditorService = StandaloneServices.get(ICodeEditorService);

  override select(): monaco.editor.ICodeEditor | undefined {
    const focusedEditor = this.codeEditorService.getFocusedCodeEditor();
    if (focusedEditor && focusedEditor.hasTextFocus()) {
      return focusedEditor;
    }
    return undefined;
  }
}

@injectable()
export class ActiveMonacoUndoRedoHandler extends AbstractMonacoUndoRedoHandler {
  // 优先级（最低）
  override priority = 0;

  constructor(@inject(EditorManager) private editorManager: EditorManager) {
    super();
  }

  protected codeEditorService = StandaloneServices.get(ICodeEditorService);
  override select(): monaco.editor.ICodeEditor | undefined {
    const activeEditorWidget = this.editorManager.activeEditor;
    const activeEditor = (activeEditorWidget as EditorWidget)?.editor;
    // 获取活跃编辑器并自动聚焦
    if (activeEditor) {
      activeEditor.focus();
      return activeEditor.getControl();
    }
    return undefined;
  }
}
