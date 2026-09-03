export declare namespace nls {
    /**
     * Automatically localizes a text if that text also exists in the vscode repository.
     */
    function localizeByDefault(defaultValue: string, ...args: any[]): string;
    function localize(key: string, defaultValue: string, ...args: any[]): string;
}
