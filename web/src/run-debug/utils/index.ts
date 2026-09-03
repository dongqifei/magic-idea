export const parseJavaMapString = (str: string): any => {
  try {
    return JSON.parse(str);
  } catch {
    // 检查是否看起来像Java Map格式的对象
    if (str.startsWith("{") && str.endsWith("}")) {
      try {
        const result: { [key: string]: any } = {};

        // 去掉外层花括号和空格
        const content = str.trim().slice(1, -1).trim();

        // 分割键值对
        const pairs = content.split(",").map((pair) => pair.trim());

        for (const pair of pairs) {
          const equalsIndex = pair.indexOf("=");
          if (equalsIndex === -1) continue;

          const key = pair.substring(0, equalsIndex).trim();
          const value = pair.substring(equalsIndex + 1).trim();

          // 处理各种值类型
          if (value === "null") {
            result[key] = null;
          } else if (value === "true") {
            result[key] = true;
          } else if (value === "false") {
            result[key] = false;
          } else if (value === "") {
            result[key] = "";
          } else if (!isNaN(Number(value)) && value !== "") {
            result[key] = Number(value);
          } else {
            // 字符串值，保持原样
            result[key] = value;
          }
        }
        return result;
      } catch (e) {
        console.warn("Failed to parse Java Map string:", e);
        return str;
      }
    }
    return str;
  }
};


export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// 格式化文件大小（字节转KB/MB等）
// private formatFileSize(bytes: number): string {
//   if (bytes < 1024) return `${bytes} B`;
//   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
//   return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
// }
