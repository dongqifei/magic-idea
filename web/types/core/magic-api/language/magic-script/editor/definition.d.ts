import * as monaco from "monaco-editor";
declare const DefinitionProvider: {
    provideDefinition(model: monaco.editor.ITextModel, position: monaco.Position, token: monaco.CancellationToken): monaco.languages.ProviderResult<monaco.languages.Definition>;
};
export default DefinitionProvider;
