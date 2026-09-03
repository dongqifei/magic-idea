import { interfaces } from "inversify";
import { FrontendApplicationContribution } from "@MagicIdea/core/frontend-application-contribution";
import { CommandContribution } from "@MagicIdea/core/commands";
import { bindRootContributionProvider, OpenHandler, WidgetFactory, ContextKeyService } from "@MagicIdea/core";
import { ThemeContribution } from '@MagicIdea/core/theme/theme-type';
import { UndoRedoHandler } from '@MagicIdea/core/undo-redo/undo-redo-handler';
import { PreferenceContribution } from '@MagicIdea/core/preferences/preference-contribution';
import { bindContributionProvider, MenuContribution } from '@MagicIdea/core/common';

import { EditorManager } from "./editor-manager";
import { EditorWidgetFactory } from "./editor-widget-factory";
import { EditorContribution } from "./editor-contribution";
import { TextEditor, TextEditorProvider } from "./text-editor";
import { DocumentModelService } from "./monaco-document-model-service";
import { MonacoEditorProvider } from "./monaco-editor-provider";
import { MonacoBreakpointIntegrator } from "./monaco-breakpoint-integrator";
import { MonacoThemeContribution } from './monaco-theme-contribution';
import { ActiveMonacoUndoRedoHandler, FocusedMonacoUndoRedoHandler } from './monaco-undo-redo-handler';
import { MonacoEditorSchema } from './monaco-editor-preferences';
import { KeybindingContribution } from "@MagicIdea/core/keybinding";
import { MonacoTextModelService } from "./monaco-text-model-service";
import { MonacoEditorServices } from './monaco-editor';
import { SplitEditorContribution } from './split-editor-contribution';
import { TextEditorSplitContribution } from './text-editor-split-contribution';
import { TabBarToolbarContribution } from "@MagicIdea/core/shell/tab-bar-toolbar";
import { MonacoContextKeyService } from "./monaco-context-key-service";
import { MonacoDiffNavigatorFactory } from './monaco-diff-navigator-factory';
import { DiffNavigatorProvider } from './diff-navigator';
import { ActiveMonacoEditorContribution, MonacoEditorService, MonacoEditorServiceFactory, VSCodeContextKeyService, VSCodeThemeService } from './monaco-editor-service';
import { ICodeEditorService } from 'monaco-editor/esm/vs/editor/browser/services/codeEditorService';
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices';
import { IContextKeyService } from 'monaco-editor/esm/vs/platform/contextkey/common/contextkey';
import { IThemeService } from 'monaco-editor/esm/vs/platform/theme/common/themeService';

/**
 * 绑定编辑器接口依赖
 * @param bind
 */
export function bindEditorModule(bind: interfaces.Bind, unbind: any, isBound: any, rebind: any): void {
  bind(EditorWidgetFactory).toSelf().inSingletonScope();
  bind(WidgetFactory).toService(EditorWidgetFactory);

  bind(EditorManager).toSelf().inSingletonScope();
  bind(OpenHandler).toService(EditorManager);

  bindContributionProvider(bind, SplitEditorContribution);
  bind(TextEditorSplitContribution).toSelf().inSingletonScope();
  bind(SplitEditorContribution).toService(TextEditorSplitContribution);

  bindRootContributionProvider(bind, ActiveMonacoEditorContribution);
  bind(MonacoEditorServiceFactory).toFactory((context: interfaces.Context) => (contextKeyService: IContextKeyService, themeService: IThemeService) => {
    const child = context.container.createChild();
    child.bind(VSCodeContextKeyService).toConstantValue(contextKeyService);
    child.bind(VSCodeThemeService).toConstantValue(themeService);
    child.bind(MonacoEditorService).toSelf().inSingletonScope();
    return child.get(MonacoEditorService);
  });
  bind(MonacoEditorService).toDynamicValue(() => StandaloneServices.get(ICodeEditorService) as MonacoEditorService).inSingletonScope();

  bind(ThemeContribution).to(MonacoThemeContribution).inSingletonScope();

  bind(MonacoContextKeyService).toSelf().inSingletonScope();
  rebind(ContextKeyService).toService(MonacoContextKeyService);

  // 绑定撤销重做处理
  bind(FocusedMonacoUndoRedoHandler).toSelf().inSingletonScope();
  bind(ActiveMonacoUndoRedoHandler).toSelf().inSingletonScope();
  bind(UndoRedoHandler).toService(FocusedMonacoUndoRedoHandler);
  bind(UndoRedoHandler).toService(ActiveMonacoUndoRedoHandler);

  bind(DocumentModelService).toSelf().inSingletonScope();

  // 注册编辑器偏好
  bind(PreferenceContribution).toConstantValue({ schema: MonacoEditorSchema });

  // 绑定断点装饰器
  bind(MonacoBreakpointIntegrator).toSelf().inSingletonScope();

  bind(EditorContribution).toSelf().inSingletonScope();

  bind(MonacoEditorProvider).toSelf().inSingletonScope();
  bind(MonacoTextModelService).toSelf().inSingletonScope();
  bind(MonacoEditorServices).toSelf().inSingletonScope();

  [FrontendApplicationContribution, CommandContribution, KeybindingContribution, MenuContribution, TabBarToolbarContribution].forEach(
    (serviceIdentifier) => {
      bind(serviceIdentifier).toService(EditorContribution);
    },
  );

  bind(TextEditorProvider).toProvider(
    (context) => (uri) => context.container.get(MonacoEditorProvider).get(uri),
  );

  bind(MonacoDiffNavigatorFactory).toSelf().inSingletonScope();
  bind(DiffNavigatorProvider).toFactory(context =>
      (editor: TextEditor) => context.container.get(MonacoEditorProvider).getDiffNavigator(editor)
  );
}
