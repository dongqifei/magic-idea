import * as monaco from 'monaco-editor';
declare const ReferenceProvider: {
    provideReferences: (model: any, position: any) => monaco.languages.Location[];
};
export default ReferenceProvider;
