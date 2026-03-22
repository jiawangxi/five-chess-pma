// PWA缓存管理器
// 提供缓存状态查询、清理和更新功能

export interface CacheStatus {
  isSupported: boolean
  isOnline: boolean
  cacheNames: string[]
  totalSize: number
  lastUpdated: string | null
}

export interface CacheInfo {
  name: string
  size: number
  entries: number
  lastAccessed: string
}

class PWACacheManager {
  private readonly CACHE_PREFIX = 'gomoku-pwa'
  private readonly CACHE_VERSION = '1.0.0'

  /**
   * 检查PWA缓存支持状态
   */
  async getStatus(): Promise<CacheStatus> {
    const isSupported = 'caches' in window
    const isOnline = navigator.onLine
    
    if (!isSupported) {
      return {
        isSupported: false,
        isOnline,
        cacheNames: [],
        totalSize: 0,
        lastUpdated: null
      }
    }

    const cacheNames = await caches.keys()
    const appCaches = cacheNames.filter(name => name.includes(this.CACHE_PREFIX))
    
    let totalSize = 0
    for (const cacheName of appCaches) {
      const size = await this.getCacheSize(cacheName)
      totalSize += size
    }

    const lastUpdated = localStorage.getItem('pwa-cache-updated') || null

    return {
      isSupported: true,
      isOnline,
      cacheNames: appCaches,
      totalSize,
      lastUpdated
    }
  }

  /**
   * 获取单个缓存的详细信息
   */
  async getCacheInfo(cacheName: string): Promise<CacheInfo | null> {
    try {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      const size = await this.getCacheSize(cacheName)
      
      return {
        name: cacheName,
        size,
        entries: keys.length,
        lastAccessed: new Date().toISOString()
      }
    } catch (error) {
      console.error('获取缓存信息失败:', error)
      return null
    }
  }

  /**
   * 计算缓存大小（估算）
   */
  private async getCacheSize(cacheName: string): Promise<number> {
    try {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      
      let totalSize = 0
      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          // 估算响应大小
          const clone = response.clone()
          const buffer = await clone.arrayBuffer()
          totalSize += buffer.byteLength
        }
      }
      
      return totalSize
    } catch (error) {
      console.error('计算缓存大小失败:', error)
      return 0
    }
  }

  /**
   * 清理过期的缓存
   */
  async cleanupExpiredCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys()
      const currentCaches = new Set([
        `${this.CACHE_PREFIX}-precache-v${this.CACHE_VERSION}`,
        'pages-cache',
        'static-resources',
        'images-cache',
        'google-fonts-stylesheets',
        'google-fonts-webfonts',
        'api-cache',
        'game-saves',
        'cdn-cache'
      ])

      // 删除不在当前版本中的缓存
      for (const cacheName of cacheNames) {
        if (cacheName.includes(this.CACHE_PREFIX) && !currentCaches.has(cacheName)) {
          await caches.delete(cacheName)
          console.log(`已清理过期缓存: ${cacheName}`)
        }
      }
    } catch (error) {
      console.error('清理缓存失败:', error)
    }
  }

  /**
   * 清空所有应用缓存
   */
  async clearAllCaches(): Promise<void> {
    try {
      const cacheNames = await caches.keys()
      const appCaches = cacheNames.filter(name => 
        name.includes(this.CACHE_PREFIX) || 
        name.includes('pages-cache') ||
        name.includes('static-resources') ||
        name.includes('images-cache') ||
        name.includes('api-cache') ||
        name.includes('game-saves')
      )

      for (const cacheName of appCaches) {
        await caches.delete(cacheName)
        console.log(`已清理缓存: ${cacheName}`)
      }

      localStorage.removeItem('pwa-cache-updated')
      console.log('所有应用缓存已清理完成')
    } catch (error) {
      console.error('清理所有缓存失败:', error)
      throw error
    }
  }

  /**
   * 预加载关键资源
   */
  async preloadCriticalResources(): Promise<void> {
    if (!('caches' in window)) return

    try {
      const cache = await caches.open('critical-resources')
      const criticalUrls = [
        '/',
        '/index.html',
        '/manifest.webmanifest'
      ]

      for (const url of criticalUrls) {
        try {
          await cache.add(url)
        } catch (error) {
          console.warn(`预加载资源失败: ${url}`, error)
        }
      }
    } catch (error) {
      console.error('预加载关键资源失败:', error)
    }
  }

  /**
   * 强制更新缓存
   */
  async forceUpdateCache(): Promise<void> {
    try {
      // 清理当前缓存
      await this.clearAllCaches()
      
      // 重新加载页面以获取最新资源
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
        }
      }
      
      // 记录更新时间
      localStorage.setItem('pwa-cache-updated', new Date().toISOString())
      
      // 预加载关键资源
      await this.preloadCriticalResources()
      
      console.log('缓存强制更新完成')
    } catch (error) {
      console.error('强制更新缓存失败:', error)
      throw error
    }
  }

  /**
   * 获取缓存使用情况报告
   */
  async getCacheReport(): Promise<string> {
    const status = await this.getStatus()
    
    if (!status.isSupported) {
      return '当前浏览器不支持缓存功能'
    }

    const sizeInMB = (status.totalSize / (1024 * 1024)).toFixed(2)
    const cacheList = status.cacheNames.join(', ')
    
    return `
缓存状态报告:
- 网络状态: ${status.isOnline ? '在线' : '离线'}
- 缓存总大小: ${sizeInMB} MB
- 缓存数量: ${status.cacheNames.length}
- 缓存列表: ${cacheList}
- 最后更新: ${status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : '未知'}
    `.trim()
  }

  /**
   * 监听网络状态变化
   */
  setupNetworkListener(): void {
    window.addEventListener('online', () => {
      console.log('网络连接已恢复')
      // 可以在这里触发缓存同步
    })

    window.addEventListener('offline', () => {
      console.log('网络连接已断开，切换到离线模式')
    })
  }
}

// 导出单例实例
export const cacheManager = new PWACacheManager()

// 初始化缓存管理器
export const initializeCacheManager = async (): Promise<void> => {
  try {
    // 清理过期缓存
    await cacheManager.cleanupExpiredCaches()
    
    // 预加载关键资源
    await cacheManager.preloadCriticalResources()
    
    // 设置网络监听器
    cacheManager.setupNetworkListener()
    
    console.log('PWA缓存管理器初始化完成')
  } catch (error) {
    console.error('PWA缓存管理器初始化失败:', error)
  }
}