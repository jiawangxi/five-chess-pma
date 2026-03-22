import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  define: {
    __VUE_PROD_DEVTOOLS__: false,
  },
  server: {
    host: true,
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue 核心
          vue: ['vue', 'vue-router'],
          // AI 引擎
          'ai-engine': ['./src/utils/optimizedAI'],
          // 工具模块  
          utils: ['./src/utils/gameStorage', './src/utils/soundManager']
        }
      }
    },
    // 构建优化
    target: 'es2015',
    minify: 'esbuild',
    // 资源优化
    assetsInlineLimit: 4096,
    cssCodeSplit: true
  }
})