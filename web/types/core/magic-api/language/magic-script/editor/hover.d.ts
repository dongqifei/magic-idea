declare const HoverProvider: {
    provideHover: (model: any, position: any) => Promise<{
        range: Range;
        contents: any[];
    }>;
};
export default HoverProvider;
