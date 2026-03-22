import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { settingsManager } from './utils/settingsManager'
import { initializeCacheManager } from './utils/cacheManager'

// 初始化设置管理器
settingsManager.initialize()

// 初始化缓存管理器
initializeCacheManager()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
