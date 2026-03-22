import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { settingsManager } from './utils/settingsManager'

// 初始化设置管理器
settingsManager.initialize()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
