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
        // »º´æÄ£Ê½ÅäÖÃ
        skipWaiting: true,
        clientsClaim: true,
        
        // Ô¤»º´æÎÄ¼þÄ£Ê½
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
          'manifest.webmanifest'
        ],
        
        // ÅÅ³ý²»ÐèÒª»º´æµÄÎÄ¼þ
        globIgnores: [
          '**/node_modules/**/*',
          '**/*.map',
          'dev-sw.js*',
          'workbox-*.js.map'
        ],
        
        // Ô¤»º´æÅäÖÃ
        dontCacheBustURLsMatching: /\.\w{8}\./,
        
        // ÔËÐÐÊ±»º´æ²ßÂÔ
        runtimeCaching: [
          // 1. HTMLÒ³Ãæ - ÍøÂçÓÅÏÈ£¬»ØÍËµ½»º´æ
          {
            urlPattern: /^https:\/\/[^\/]+\/$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1ÖÜ
              },
              networkTimeoutSeconds: 3
            }
          },
          
          // 2. APIµ÷ÓÃ - ÍøÂçÓÅÏÈ£¨Èç¹ûÓÐºó¶ËAPI£©
          {
            urlPattern: /^https:\/\/[^\/]+\/api\/.*/,
            handler: 'NetworkFirst', 
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1Ìì
              },
              networkTimeoutSeconds: 5
            }
          },
          
          // 3. ¾²Ì¬×ÊÔ´ - »º´æÓÅÏÈ
          {
            urlPattern: /\.(?:js|css|woff2?|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1Äê
              }
            }
          },
          
          // 4. Í¼Æ¬×ÊÔ´ - »º´æÓÅÏÈ£¬»ØÍËµ½ÍøÂç
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90Ìì
              }
            }
          },
          
          // 5. Íâ²¿×ÖÌå - »º´æÓÅÏÈ
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1Äê
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
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1Äê
              }
            }
          },
          
          // 6. CDN×ÊÔ´ - »º´æÓÅÏÈ
          {
            urlPattern: /^https:\/\/cdn\./,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30Ìì
              }
            }
          },
          
          // 7. ÓÎÏ·´æµµÊý¾Ý - ÍøÂçÓÅÏÈ£¨ÓÃÓÚÔÆÍ¬²½£¬Èç¹ûÊµÏÖ£©
          {
            urlPattern: /\/api\/save\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'game-saves',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1ÖÜ
              },
              networkTimeoutSeconds: 3
            }
          }
        ],
        
        // µ¼º½»ØÍË»º´æ
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        
        // ÀëÏß»ØÍËÒ³Ãæ
        offlineGoogleAnalytics: false,
        
        // ×Ô¶¨ÒåService WorkerÄÚÈÝ
        additionalManifestEntries: [
          // È·±£¹Ø¼üÒ³Ãæ±»Ô¤»º´æ
          { url: '/index.html', revision: null },
          { url: '/manifest.webmanifest', revision: null }
        ]
      },
      // PWAÅäÖÃ
      manifest: {
        name: 'Îå×ÓÆå´óÊ¦',
        short_name: 'Îå×ÓÆå',
        description: '×¨Òµ¼¶Îå×ÓÆåPWAÓ¦ÓÃ£¬Ö§³ÖAI¶ÔÕ½ºÍÀëÏßÓÎÏ·',
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
      // ¿ª·¢Ñ¡Ïî
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
    // Éú²ú¹¹½¨Ä¿±ê
    target: 'es2018',
    outDir: 'dist',
    // ÆôÓÃÑ¹Ëõ
    minify: 'terser', 
    // CSS´úÂë·Ö¸î
    cssCodeSplit: true,
    // ×ÊÔ´ÄÚÁªÏÞÖÆ (4KB)
    assetsInlineLimit: 4096,
    // ÆôÓÃÔ´ÂëÓ³Éä£¨ÓÃÓÚµ÷ÊÔ£©
    sourcemap: process.env.NODE_ENV === 'development',
    
    rollupOptions: {
      // ÓÅ»¯´úÂë·Ö¸î
      output: {
        manualChunks: {
          // Vue¿ò¼ÜºËÐÄ
          vue: ['vue', 'vue-router'],
          // AIÒýÇæ¶ÀÁ¢°ü
          'ai-engine': ['./src/utils/optimizedAI'],
          // ¹¤¾ßÄ£¿é
          utils: ['./src/utils/gameStorage', './src/utils/soundManager', './src/utils/settingsManager'],
        },
        // ÎÄ¼þÃüÃû²ßÂÔ
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      // Íâ²¿ÒÀÀµ£¨Èç¹ûÐèÒªCDN¼ÓÔØ£©
      external: []
    },
    
    // TerserÑ¹ËõÑ¡Ïî
    terserOptions: {
      compress: {
        // ÒÆ³ýconsole.log
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      },
      mangle: {
        // ±£Áôº¯ÊýÃû£¨ÓÃÓÚµ÷ÊÔ£©
        keep_fnames: process.env.NODE_ENV === 'development'
      },
      format: {
        // ÒÆ³ý×¢ÊÍ
        comments: false
      }
    }
  }
})