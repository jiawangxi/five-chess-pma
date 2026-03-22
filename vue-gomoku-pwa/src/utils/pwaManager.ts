// PWA 功能管理器
// 处理离线状态检测、缓存管理和用户通知

export interface PWAManager {
  isOffline: boolean
  isUpdateAvailable: boolean
  initialize(): void
  checkOfflineStatus(): boolean
  handleOfflineGame(): void
  showUpdateNotification(callback: () => void): void
  showOfflineNotification(): void
}

class PWAManagerImpl implements PWAManager {
  public isOffline: boolean = false
  public isUpdateAvailable: boolean = false

  initialize(): void {
    this.setupOfflineDetection()
    this.setupGameCaching()
  }

  private setupOfflineDetection(): void {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.isOffline = false
      console.log('网络已连接')
      this.showConnectionNotification('网络已恢复')
    })

    window.addEventListener('offline', () => {
      this.isOffline = true
      console.log('网络已断开')
      this.showOfflineNotification()
    })

    // 初始状态检测
    this.isOffline = !navigator.onLine
  }

  private setupGameCaching(): void {
    // 预缓存关键游戏资源
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        console.log('Service Worker 已就绪，游戏可以离线使用')
      })
    }
  }

  checkOfflineStatus(): boolean {
    return this.isOffline
  }

  handleOfflineGame(): void {
    // 离线游戏状态处理
    console.log('切换到离线模式')
    
    // 禁用在线功能
    this.disableOnlineFeatures()
    
    // 启用离线存储
    this.enableOfflineStorage()
  }

  private disableOnlineFeatures(): void {
    // 这里可以禁用需要网络的功能
    console.log('已禁用在线功能')
  }

  private enableOfflineStorage(): void {
    // 启用本地存储功能
    console.log('已启用离线存储')
  }

  showUpdateNotification(callback: () => void): void {
    this.isUpdateAvailable = true
    
    // 创建更新提示
    const notification = this.createNotification(
      '新版本可用',
      '发现新版本，点击更新以获得最新功能',
      '更新',
      callback
    )
    
    this.displayNotification(notification)
  }

  showOfflineNotification(): void {
    const notification = this.createNotification(
      '离线模式',
      '网络连接已断开，但您仍可以继续游戏',
      '知道了',
      () => this.handleOfflineGame()
    )
    
    this.displayNotification(notification)
  }

  private showConnectionNotification(message: string): void {
    const notification = this.createNotification(
      '网络状态',
      message,
      '知道了',
      () => {}
    )
    
    this.displayNotification(notification)
  }

  private createNotification(
    title: string, 
    message: string, 
    buttonText: string, 
    callback: () => void
  ) {
    return {
      title,
      message,
      buttonText,
      callback,
      timestamp: Date.now()
    }
  }

  private displayNotification(notification: any): void {
    // 简单的控制台通知，实际项目中可以替换为UI组件
    console.log(`? ${notification.title}: ${notification.message}`)
    
    // 在实际应用中，这里应该显示UI通知组件
    // 例如：toast、modal 或自定义通知组件
  }
}

// 单例导出
export const pwaManager: PWAManager = new PWAManagerImpl()

// 离线游戏存储增强
export class OfflineGameStorage {
  private readonly OFFLINE_KEY = 'gomoku_offline_games'
  
  saveOfflineGame(gameData: any): void {
    try {
      const offlineGames = this.getOfflineGames()
      offlineGames.push({
        ...gameData,
        savedAt: Date.now(),
        isOffline: true
      })
      
      localStorage.setItem(this.OFFLINE_KEY, JSON.stringify(offlineGames))
      console.log('游戏已保存到离线存储')
    } catch (error) {
      console.error('离线游戏保存失败:', error)
    }
  }
  
  getOfflineGames(): any[] {
    try {
      const data = localStorage.getItem(this.OFFLINE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('读取离线游戏失败:', error)
      return []
    }
  }
  
  syncOfflineGames(): void {
    if (!pwaManager.isOffline) {
      const offlineGames = this.getOfflineGames()
      console.log(`准备同步 ${offlineGames.length} 个离线游戏`)
      
      // 这里可以实现与服务器的同步逻辑
      // 例如上传离线游戏数据到云端
      
      // 同步完成后清理本地离线数据
      // localStorage.removeItem(this.OFFLINE_KEY)
    }
  }
}

export const offlineGameStorage = new OfflineGameStorage()