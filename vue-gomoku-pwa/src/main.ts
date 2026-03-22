import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { settingsManager } from './utils/settingsManager'
import { initializeCacheManager } from './utils/cacheManager'
import { pwaManager } from './utils/pwaManager'
import { pwaInstallManager } from './utils/pwaInstallManager'
import { versionManager } from './utils/versionManager'

// PWA Service Worker 注册
import { registerSW } from 'virtual:pwa-register'

// 初始化设置管理器
settingsManager.initialize()

// 初始化缓存管理器
initializeCacheManager()

// 初始化PWA管理器
pwaManager.initialize()

// 初始化PWA安装管理器
pwaInstallManager.initialize()

// 初始化版本管理器
versionManager.initialize()

// 注册 Service Worker 并处理更新
const updateSW = registerSW({
  onNeedRefresh() {
    // 有新版本可用时的处理
    console.log('检测到新版本可用')
    versionManager.showUpdateDetails('新版本')
  },
  onOfflineReady() {
    // 离线准备就绪
    console.log('应用已准备好离线使用')
    pwaManager.showOfflineNotification()
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
