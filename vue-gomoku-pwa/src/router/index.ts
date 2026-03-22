import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 路由懒加载配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: {
      title: '? 五子棋大师',
      description: '智能AI对战游戏',
      preload: true // 预加载主页
    }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: {
      title: '关于 - 五子棋大师',
      description: '关于五子棋大师游戏'
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: {
      title: '游戏设置 - 五子棋大师',
      description: '个性化游戏配置'
    }
  },
  {
    path: '/tutorial',
    name: 'tutorial', 
    component: () => import('../views/TutorialView.vue'),
    meta: {
      title: '游戏教程 - 五子棋大师',
      description: '五子棋游戏规则和技巧'
    }
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('../views/HistoryView.vue'),
    meta: {
      title: '游戏记录 - ???子棋大师', 
      description: '查看历史游戏记录'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      title: '页面未找到 - 五子棋大师'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 路由切换时的滚动行为
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// 路由守卫 - 动态设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  
  // 设置页面描述
  if (to.meta.description) {
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', to.meta.description as string)
  }
  
  next()
})

// 预加载重要路由
router.afterEach((to, from) => {
  // 如果当前是首页，预加载设置页面
  if (to.name === 'home') {
    setTimeout(() => {
      import('../views/SettingsView.vue')
    }, 2000) // 2秒后预加载
  }
})

export default router
