/**
 * Vite 在 base: './' 时，import.meta.env.BASE_URL 为 './'（给静态资源用）。
 * React Router 的 basename 必须是合法路径（如 / 或 /my-app），不能是 ./，否则不渲染、白屏。
 */
export function getRouterBasename(): string {
  const raw = import.meta.env.BASE_URL;
  if (raw === './' || raw === '.') return '/';
  const trimmed = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  return trimmed === '' ? '/' : trimmed;
}
