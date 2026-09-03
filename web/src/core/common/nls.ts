export namespace nls {
  /**
   * Automatically localizes a text if that text also exists in the vscode repository.
   */
  export function localizeByDefault(
    defaultValue: string,
    ...args: any[]
  ): string {
    const formatRegexp = /{([^}]+)}/g;
    return defaultValue.replace(formatRegexp, (match, group) => (args[group] ?? match) as string);
  }

  export function localize(
    key: string,
    defaultValue: string,
    ...args: any[]
): string {
    let str = defaultValue;
    for (let idx = 0; idx < args.length; idx++) {
        str = str.replace(`{${idx}}`, String(args[idx]));
    }
    return str;
}
}
