import { ReactElement, useEffect, useRef } from "react";
import { ApiResourceMetaData } from "../magic-api-tree-types";
import * as monaco from "monaco-editor";
import "./api-request-body.css";

// 定义组件属性
interface ApiRequestBodyEditorProps {
  requestBody: string | null | undefined; // 请求体内容（JSON字符串）
  onUpdate: (data: Partial<ApiResourceMetaData>) => void; // 统一更新回调
}

export const ApiRequestBodyEditor = ({
  requestBody,
  onUpdate,
}: ApiRequestBodyEditorProps): ReactElement => {
  // 编辑器容器Ref
  const editorRef = useRef<HTMLDivElement>(null);
  // Monaco编辑器实例Ref
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // 初始化/销毁编辑器
  useEffect(() => {
    if (!editorRef.current) return;

    // 初始化Monaco编辑器
    monacoEditorRef.current = monaco.editor.create(editorRef.current, {
      value: requestBody || "", // 默认空JSON结构
      language: "json", // 指定JSON语法
      minimap: { enabled: false }, // 关闭迷你地图
      scrollBeyondLastLine: false, // 禁止滚动超出最后一行
      fontSize: 14, // 字体大小
      tabSize: 2,
      automaticLayout: true, // 自动适应容器大小
      lineNumbers: "on", // 显示行号
      wordWrap: "on", // 自动换行
    });

    // 监听编辑器内容变化
    const editorInstance = monacoEditorRef.current;
    const onChangeDisposable = editorInstance.onDidChangeModelContent(() => {
      const value = editorInstance.getValue();
      onUpdate({ requestBody: value }); // 同步更新到fileData
    });

    // 销毁函数（组件卸载时执行）
    return () => {
      onChangeDisposable.dispose(); // 移除监听
      editorInstance.dispose(); // 销毁编辑器实例
      monacoEditorRef.current = null;
    };
  }, []);

  // 同步外部传入的requestBody变化（切换文件时更新编辑器内容）
  useEffect(() => {
    if (monacoEditorRef.current) {
      // 避免重复触发变更事件
      const currentValue = monacoEditorRef.current.getValue();
      const targetValue = requestBody || "";
      if (currentValue !== targetValue) {
        monacoEditorRef.current.setValue(targetValue);
      }
    }
  }, [requestBody]);

  return (
    <div className="api-request-body-editor">
      <div className="editor-container" ref={editorRef}></div>
    </div>
  );
};