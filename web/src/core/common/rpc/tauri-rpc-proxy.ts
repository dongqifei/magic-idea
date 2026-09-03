import { invoke } from "@tauri-apps/api/core";

export function createService<T>() {
  return new Proxy({}, {
    get(_, methodName: string | symbol) {
      // 🔥 关键修复：过滤掉 then、toJSON 等内部方法
      if (
        typeof methodName !== "string" ||
        methodName === "then" ||
        methodName === "toJSON" ||
        methodName === "constructor"
      ) {
        return undefined;
      }

      const cmd = camelCaseToSnakeCase(methodName);

      return async (...args: any[]) => {
        try {
          const params = args.length === 1 ? args[0] : args.length > 1 ? args : {};
          return await invoke(cmd, params);
        } catch (err) {
          console.error(`[RPC] ${cmd} 调用失败`, err);
          throw err;
        }
      };
    }
  }) as T;
}

function camelCaseToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}