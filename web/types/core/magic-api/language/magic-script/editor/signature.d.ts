declare const SignatureHelpProvider: {
    signatureHelpRetriggerCharacters: string[];
    signatureHelpTriggerCharacters: string[];
    provideSignatureHelp: (model: any, position: any, token: any, context: any) => Promise<{
        dispose: () => void;
        value: any;
    }>;
};
export default SignatureHelpProvider;
