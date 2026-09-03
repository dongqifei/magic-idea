declare const DocumentSymbolProvider: {
    displayName: string;
    provideDocumentSymbols: (model: any, token: any) => Promise<any[]>;
};
export default DocumentSymbolProvider;
