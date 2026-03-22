import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // 缓存策略
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // 运行时缓存
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      // PWA配置
      manifest: {
        name: '五子棋大师',
        short_name: '五子棋',
        description: '专业级五子棋PWA应用，支持AI对战和离线游戏',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      // 开发选项
      devOptions: {
        enabled: false
      }
    })
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
    // 生产构建目标
    target: 'es2018',
    outDir: 'dist',
    // 启用压缩
    minify: 'terser', 
    // CSS代码分割
    cssCodeSplit: true,
    // 资源内联限制 (4KB)
    assetsInlineLimit: 4096,
    // 启用源码映射（用于调试）
    sourcemap: process.env.NODE_ENV === 'development',
    
    rollupOptions: {
      // 优化代码分割
      output: {
        manualChunks: {
          // Vue框架核心
          vue: ['vue', 'vue-router'],
          // AI引擎独立包
          'ai-engine': ['./src/utils/optimizedAI'],
          // 工具模块
          utils: ['./src/utils/gameStorage', './src/utils/soundManager', './src/utils/settingsManager'],
        },
        // 文件命名策略
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      // 外部依赖（如果需要CDN加载）
      external: []
    },
    
    // Terser压缩选项
    terserOptions: {
      compress: {
        // 移除console.log
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      },
      mangle: {
        // 保留函数名（用于调试）
        keep_fnames: process.env.NODE_ENV === 'development'
      },
      format: {
        // 移除注释
        comments: false
      }
    }
  }
})