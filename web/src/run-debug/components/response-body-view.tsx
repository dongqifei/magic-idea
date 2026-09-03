import { ReactElement, useState, useEffect, useCallback } from "react";
import JsonView from "@uiw/react-json-view";
import { vscodeTheme } from "@uiw/react-json-view/vscode";
import { RunResult } from '../run-debug-typs';

// 512KB 阈值（字符串字符数，UTF-8下近似）
const MAX_VIEW_SIZE = 512 * 1024;

// 渲染类型枚举
type RenderMode = 'empty' | 'json' | 'text' | 'html' | 'image' | 'binary-file';

interface ApiResponseBodyViewProps {
  result: RunResult | undefined;
}

export const ResponseBodyView = ({
  result,
}: ApiResponseBodyViewProps): ReactElement => {
  const [jsonData, setJsonData] = useState<any>({});
  const [rawText, setRawText] = useState<string>("");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [renderMode, setRenderMode] = useState<RenderMode>("empty");

  // 超大内容标记
  const [isOversize, setIsOversize] = useState(false);
  // 超大内容临时存储（用于下载）
  const [oversizeBlob, setOversizeBlob] = useState<Blob | null>(null);

  const [fileInfo, setFileInfo] = useState<{
    url: string;
    name: string;
    size: string;
    sizeBytes: number;
  } | null>(null);

  const revokeBlobUrl = useCallback((url: string | null) => {
    if (url && url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn("清理Blob URL失败:", e);
      }
    }
  }, []);

  const extractFileName = useCallback((contentDisposition?: string): string => {
    if (!contentDisposition) return "response";
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(contentDisposition);
    if (matches != null && matches[1]) {
      return matches[1].replace(/['"]/g, "");
    }
    return "response";
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }, []);

  // 安全获取content-type，兼容headers对象/普通对象
  const getContentType = useCallback((headers?: Record<string, string>): string => {
    if (!headers) return "";
    const raw = headers["content-type"] ?? headers["Content-Type"] ?? "";
    return raw.trim();
  }, []);

  // 提取mime主类型，去除; charset等后缀
  const getMimeBase = useCallback((ct: string): string => {
    return ct.split(";")[0].trim().toLowerCase();
  }, []);

  // 下载超大内容
  const handleDownloadOversize = useCallback(() => {
    if (!oversizeBlob) return;
    const url = URL.createObjectURL(oversizeBlob);
    const a = document.createElement("a");
    a.href = url;
    // 根据类型自动后缀
    const ext = renderMode === "json" ? ".json" : ".txt";
    a.download = `response${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [oversizeBlob, renderMode]);

  useEffect(() => {
    // 重置所有状态
    setJsonData({});
    setRawText("");
    setRenderMode("empty");
    setIsOversize(false);
    setOversizeBlob(null);
    revokeBlobUrl(blobUrl);
    setBlobUrl(null);
    setFileInfo(null);

    if (!result) return;

    const body = result.responseBody;
    const headers = result.responseHeaders;
    const contentTypeRaw = getContentType(headers);
    const mime = getMimeBase(contentTypeRaw);

    // --------------------------
    // 分支判断
    // --------------------------
    // 1. JSON
    if (mime === "application/json") {
      const bodyStr = typeof body === "string" ? body : String(body);
      // 判断是否超大
      if (bodyStr.length > MAX_VIEW_SIZE) {
        setIsOversize(true);
        setOversizeBlob(new Blob([bodyStr], { type: "application/json" }));
        setRenderMode("json");
        return;
      }
      try {
        setJsonData(JSON.parse(bodyStr));
        setRenderMode("json");
      } catch {
        setRawText(bodyStr);
        setRenderMode("text");
      }
      return;
    }

    // 2. text/plain 纯文本
    if (mime === "text/plain") {
      const bodyStr = typeof body === "string" ? body : String(body);
      if (bodyStr.length > MAX_VIEW_SIZE) {
        setIsOversize(true);
        setOversizeBlob(new Blob([bodyStr], { type: "text/plain" }));
        setRenderMode("text");
        return;
      }
      setRenderMode("text");
      setRawText(bodyStr);
      return;
    }

    // 3. 二进制文件下载
    if (mime === "application/octet-stream") {
      setRenderMode("binary-file");
      if (body instanceof Blob) {
        const url = URL.createObjectURL(body);
        const filename = extractFileName(headers["content-disposition"] as string);
        setFileInfo({
          url,
          name: filename,
          size: formatFileSize(body.size),
          sizeBytes: body.size,
        });
        setBlobUrl(url);
      }
      return;
    }

    // 未知Blob类型
    if (body instanceof Blob) {
      const url = URL.createObjectURL(body);
      setBlobUrl(url);
    }

  }, [result, getContentType, revokeBlobUrl]);

  // 组件卸载清理blob
  useEffect(() => {
    return () => {
      revokeBlobUrl(blobUrl);
    };
  }, [blobUrl, revokeBlobUrl]);

  if (!result) {
    return (
      <div className="api-request-body-editor empty-state">点击运行按钮获取响应结果</div>
    );
  }

  // ========== 超大内容提示面板（新增）==========
  if (isOversize) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "var(--magic-idea-text-secondary)",
        }}
      >
        <div style={{ fontSize: 15 }}>
          响应内容过大，避免界面卡顿，在线预览已关闭
        </div>
        <a
            href="#"
            onClick={handleDownloadOversize}
            style={{ color: "var(--magic-idea-link-color)" }}
            title="点击下载"
          >
            下载响应内容
          </a>
      </div>
    );
  }

  // 二进制文件面板
  if (renderMode === "binary-file" && fileInfo) {
    return (
      <div
        className="response-body-view file-view"
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
        }}
      >
        <span style={{ fontWeight: 500, fontSize: "16px" }}>
          <span>文件名：</span>
          <a
            href={fileInfo.url}
            download={fileInfo.name}
            style={{ color: "var(--magic-idea-link-color)" }}
            title="点击下载"
          >
            {fileInfo.name || "未知文件"}
          </a>
        </span>
        <span style={{ fontSize: "12px" }}>
          文件大小：{fileInfo.size || "未知大小"}
        </span>
      </div>
    );
  }

  // JSON视图
  if (renderMode === "json") {
    return (
      <div className="response-body-view json-view" style={{ height: "100%" }}>
        <JsonView
          value={jsonData || {}}
          collapsed={false}
          enableClipboard={true}
          displayDataTypes={true}
          displayObjectSize={true}
          style={{
            ...vscodeTheme,
            fontSize: "14px",
            lineHeight: "1.6",
            backgroundColor: "transparent",
            "--w-rjv-line-color": "var(--magic-idea-input-border)",
            "--w-rjv-background-color": "transparent",
            "--w-rjv-key-string": "var(--magic-idea-primary-color)",
            "--w-rjv-font-family": "var(--magic-idea-ui-font-family)",
            "--w-rjv-font-size": "var(--magic-idea-ui-font-size)",
          }}
        />
      </div>
    );
  }

  // text/plain 纯文本
  if (renderMode === "text") {
    return (
      <div
        style={{
          fontFamily: "var(--magic-idea-ui-font-family)",
          whiteSpace: "pre-wrap",
        }}
      >
        <pre style={{ margin: 12 }}>{rawText}</pre>
      </div>
    );
  }

  // iframe渲染二进制内容
  return (
    <div style={{ height: "100%", width: "100%" }}>
      {blobUrl && <iframe src={blobUrl} style={{ width: "100%", height: "100%", border: "none" }} />}
    </div>
  );
};