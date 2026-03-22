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
        // 缓存模式配置
        skipWaiting: true,
        clientsClaim: true,
        
        // 预缓存文件模式
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
          'manifest.webmanifest'
        ],
        
        // 排除不需要缓存的文件
        globIgnores: [
          '**/node_modules/**/*',
          '**/*.map',
          'dev-sw.js*',
          'workbox-*.js.map'
        ],
        
        // 预缓存配置
        dontCacheBustURLsMatching: /\.\w{8}\./,
        
        // 运行时缓存策略
        runtimeCaching: [
          // 1. HTML页面 - 网络优先，回退到缓存
          {
            urlPattern: /^https:\/\/[^\/]+\/$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1周
              },
              networkTimeoutSeconds: 3
            }
          },
          
          // 2. API调用 - 网络优先（如果有后端API）
          {
            urlPattern: /^https:\/\/[^\/]+\/api\/.*/,
            handler: 'NetworkFirst', 
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1天
              },
              networkTimeoutSeconds: 5
            }
          },
          
          // 3. 静态资源 - 缓存优先
          {
            urlPattern: /\.(?:js|css|woff2?|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
              }
            }
          },
          
          // 4. 图片资源 - 缓存优先，回退到网络
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90天
              }
            }
          },
          
          // 5. 外部字体 - 缓存优先
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
              }
            }
          },
          
          // 6. CDN资源 - 缓存优先
          {
            urlPattern: /^https:\/\/cdn\./,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30天
              }
            }
          },
          
          // 7. 游戏存档数据 - 网络优先（用于云同步，如果实现）
          {
            urlPattern: /\/api\/save\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'game-saves',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1周
              },
              networkTimeoutSeconds: 3
            }
          }
        ],
        
        // 导航回退缓存
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        
        // 离线回退页面
        offlineGoogleAnalytics: false,
        
        // 自定义Service Worker内容
        additionalManifestEntries: [
          // 确保关键页面被预缓存
          { url: '/index.html', revision: null },
          { url: '/manifest.webmanifest', revision: null }
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