declare const CompletionItemProvider: {
    provideCompletionItems: (model: any, position: any) => Promise<{
        suggestions: any;
        incomplete: boolean;
    }>;
    triggerCharacters: string[];
};
export default CompletionItemProvider;
