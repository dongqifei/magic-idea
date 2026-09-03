import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import MonacoEditorPlugin from 'vite-plugin-monaco-editor'

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [
    react(),
    MonacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'typescript', 'json', 'html', 'css'],
      globalAPI: true,
    })
  ],
  server: {
    port: 3000,
    // Tauri expects a fixed port, fail if that port is not available
    strictPort: true,
    open: true,
    // if the host Tauri is expecting is set, use it
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 告诉vite忽略对`src-tauri`的监视
      ignored: ['**/src-tauri/**'],
    },
  },
  // 以`envPrefix`项开头的环境变量将在tauri的源代码中通过`import.meta.env`公开。
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target:
      process.env.TAURI_ENV_PLATFORM == 'windows'
        ? 'chrome105'
        : 'safari13',
    // 调试版本不要压缩
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // 为调试构建生成源映射
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  base: './',
  resolve: {
    alias: {
      '@MagicIdea': '/src',
    },
  },
})