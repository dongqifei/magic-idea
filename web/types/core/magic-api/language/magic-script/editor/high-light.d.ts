/**
 * @file 高亮配置
 */
export declare const HighLightOptions: {
    builtinFunctions: any[];
    operators: string[];
    symbols: RegExp;
    digits: RegExp;
    binarydigits: RegExp;
    hexdigits: RegExp;
    escapes: RegExp;
    types: string[];
    keywords: string[];
    regexpctl: RegExp;
    regexpesc: RegExp;
    tokenizer: {
        root: ((string | RegExp)[] | (RegExp | {
            token: string;
            next: string;
        })[] | (RegExp | {
            cases: {
                '@builtinFunctions': string;
                '@types': string;
                '@keywords': string;
                '~(instanceof|new|in|async|asc|desc|ASC|DESC|assert|select|from|left|join|on|and|or|order|by|where|group|having|limit|)[\\s]?': {
                    token: string;
                };
                '~(select|from|left|join|on|and|or|order|by|where|group|having|limit|offset|SELECT|FROM|LEFT|JOIN|ON|AND|OR|ORDER|BY|WHERE|GROUP|HAVING|LIMIT|OFFSET)[\\s]{1}': {
                    token: string;
                };
                '@default': string;
            };
        })[] | (RegExp | {
            token: string;
            next: string;
            nextEmbedded: string;
        })[] | (RegExp | {
            token: string;
            bracket: string;
            next: string;
        })[])[];
        comment: (string | RegExp)[][];
        codeblock: ((string | RegExp)[] | (RegExp | {
            token: string;
            next: string;
        })[])[];
        regexp: ((string | RegExp)[] | (RegExp | (string | {
            token: string;
            next: string;
        })[])[] | (RegExp | (string | {
            token: string;
            bracket: string;
            next: string;
        })[])[])[];
        regexrange: ((string | RegExp)[] | (RegExp | {
            token: string;
            next: string;
            bracket: string;
        })[])[];
        string_multi_embedded: ((string | RegExp)[] | (string | {
            token: string;
            next: string;
            nextEmbedded: string;
        })[])[];
        string_double: (string | RegExp)[][];
        string_single: (string | RegExp)[][];
        string_backtick: ((string | RegExp)[] | (RegExp | {
            token: string;
            next: string;
        })[])[];
        bracketCounting: ((string | RegExp)[] | {
            include: string;
        })[];
    };
};
