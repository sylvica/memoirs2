import { useEffect } from 'react';

/**
 * 组件挂载时立即将页面滚动到最顶部。
 * 使用 behavior: 'instant' 避免任何滚动动画延迟。
 */
export function useScrollToTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
}
