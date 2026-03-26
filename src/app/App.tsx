import { RouterProvider } from 'react-router';
import { router } from './routes';
import { getRouterBasename } from './routerBasename';
import { MemoirProvider } from './context/MemoirContext';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';

// 每次页面刷新（模块重新初始化）时，在 createBrowserRouter 读取 URL 之前
// 将路径强制重置为应用根路径，确保每次刷新都从开场动画开始播放。
if (typeof window !== 'undefined') {
  const base = getRouterBasename();
  window.history.replaceState({}, '', base === '/' ? '/' : `${base}/`);
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <MemoirProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </MemoirProvider>
    </ThemeProvider>
  );
}