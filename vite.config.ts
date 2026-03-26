import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// 与 api/dev-server.ts 共用 .env 中的 PORT（默认 3001，与 dev-server 一致）
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.PORT || '3001'

  return {
  // 使用相对路径，部署在子目录或任意静态空间时 JS/CSS 仍能加载（避免整站白屏）
  base: './',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    // 只转发本项目的生成接口，避免把 /api/* 全部打到后端（否则其它 /api/* 会 ECONNREFUSED）
    proxy: {
      '/api/generate-memoir': {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },

  build: {
    // 拆大依赖，单文件低于默认 500k 告警线，首屏可并行加载
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // motion 体积大，单独一块；其余 node_modules 由 Rollup 自动合并，避免 vendor ↔ react 循环引用告警
          if (id.includes('motion')) return 'motion-vendor';
          if (
            id.includes('react-router') ||
            id.includes('react-dom') ||
            /[/\\]node_modules[/\\]react[/\\]/.test(id)
          ) {
            return 'react-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  }
})
