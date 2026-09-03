export const isTauri = () => {
  return typeof window !== 'undefined' && (
    window.__TAURI_INTERNALS__ !== undefined ||  // 2.x
    window.__TAURI__ !== undefined              // 1.x
  );
};