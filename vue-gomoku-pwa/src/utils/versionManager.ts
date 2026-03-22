// 版本管理器
// 处理应用版本检测、更新通知和版本历史

export interface VersionManager {
  currentVersion: string
  isUpdateAvailable: boolean
  initialize(): void
  checkForUpdates(): Promise<boolean>
  applyUpdate(): Promise<void>
  getVersionHistory(): string[]
  showUpdateDetails(newVersion: string): void
}

class VersionManagerImpl implements VersionManager {
  public currentVersion: string = '1.0.0'
  public isUpdateAvailable: boolean = false
  private updateCallback: (() => void) | null = null
  private versionHistory: string[] = []

  initialize(): void {
    this.loadCurrentVersion()
    this.loadVersionHistory()
    this.setupUpdateDetection()
  }

  private loadCurrentVersion(): void {
    // 从package.json或构建时注入的版本信息获取
    try {
      // 在实际项目中，这个值应该在构建时注入
      this.currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
      console.log(`当前应用版本: ${this.currentVersion}`)
    } catch (error) {
      console.error('获取版本信息失败:', error)
    }
  }

  private loadVersionHistory(): void {
    try {
      const stored = localStorage.getItem('gomoku_version_history')
      this.versionHistory = stored ? JSON.parse(stored) : [this.currentVersion]
      
      // 确保当前版本在历史中
      if (!this.versionHistory.includes(this.currentVersion)) {
        this.versionHistory.push(this.currentVersion)
        this.saveVersionHistory()
      }
    } catch (error) {
      console.error('加载版本历史失败:', error)
      this.versionHistory = [this.currentVersion]
    }
  }

  private saveVersionHistory(): void {
    try {
      localStorage.setItem('gomoku_version_history', JSON.stringify(this.versionHistory))
    } catch (error) {
      console.error('保存版本历史失败:', error)
    }
  }

  private setupUpdateDetection(): void {
    // 监听Service Worker更新事件
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('检测到Service Worker更新')
        this.handleControllerChange()
      })
    }
    
    // 定期检查更新（每30分钟）
    setInterval(() => {
      this.checkForUpdates()
    }, 30 * 60 * 1000)
  }

  private handleControllerChange(): void {
    // Service Worker更换时，通常意味着有新版本
    this.isUpdateAvailable = true
    console.log('新版本已准备就绪')
    
    // 显示更新完成提示
    this.showUpdateCompletedNotification()
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
          
          if (registration.waiting) {
            console.log('发现新版本等待激活')
            this.isUpdateAvailable = true
            return true
          }
        }
      }
      
      return false
    } catch (error) {
      console.error('检查更新失败:', error)
      return false
    }
  }

  async applyUpdate(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration && registration.waiting) {
          // 发送消息给等待中的Service Worker，让它跳过等待
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          
          // 等待新的Service Worker激活
          await new Promise<void>((resolve) => {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              resolve()
            }, { once: true })
          })
          
          console.log('更新已应用')
          
          // 记录新版本
          this.recordVersionUpdate()
          
          // 重新加载页面以使用新版本
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('应用更新失败:', error)
      throw error
    }
  }

  private recordVersionUpdate(): void {
    // 在实际应用中，这里应该获取新的版本号
    const newVersion = `${this.currentVersion}.${Date.now()}`
    
    if (!this.versionHistory.includes(newVersion)) {
      this.versionHistory.push(newVersion)
      this.saveVersionHistory()
      
      console.log(`版本已更新: ${this.currentVersion} -> ${newVersion}`)
      this.currentVersion = newVersion
    }
  }

  getVersionHistory(): string[] {
    return [...this.versionHistory]
  }

  showUpdateDetails(newVersion: string): void {
    const updateInfo = {
      currentVersion: this.currentVersion,
      newVersion,
      releaseNotes: this.generateReleaseNotes(newVersion),
      updateSize: this.estimateUpdateSize(),
      timestamp: new Date().toLocaleString()
    }

    console.log('? 版本更新详情:', updateInfo)
    
    // 在实际应用中，这里应该显示更新详情UI
    this.displayUpdateDetailsUI(updateInfo)
  }

  private generateReleaseNotes(version: string): string[] {
    // 在实际项目中，这些信息应该从服务器或配置文件获取
    return [
      '? 修复了游戏逻辑中的已知问题',
      '? 优化了AI算法性能',
      '? 改进了用户界面体验',
      '? 增强了安全性和稳定性'
    ]
  }

  private estimateUpdateSize(): string {
    // 估算更新大小
    return '约 2.5 MB'
  }

  private displayUpdateDetailsUI(updateInfo: any): void {
    // 创建更新详情显示
    const detailsHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        padding: 24px;
        z-index: 1002;
        max-width: 400px;
        width: 90%;
        font-family: system-ui, sans-serif;
      ">
        <h3 style="margin: 0 0 16px 0; color: #1f2937;">? 发现新版本</h3>
        
        <div style="margin-bottom: 16px; padding: 12px; background: #f3f4f6; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">当前版本:</span>
            <span style="font-weight: 500;">${updateInfo.currentVersion}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #6b7280;">新版本:</span>
            <span style="font-weight: 500; color: #059669;">${updateInfo.newVersion}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #6b7280;">更新大小:</span>
            <span style="font-weight: 500;">${updateInfo.updateSize}</span>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">更新内容:</h4>
          <ul style="margin: 0; padding-left: 16px; color: #6b7280; font-size: 13px;">
            ${updateInfo.releaseNotes.map((note: string) => `<li style="margin-bottom: 4px;">${note}</li>`).join('')}
          </ul>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="update-later-btn" style="
            background: #f3f4f6;
            color: #6b7280;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">稍后更新</button>
          <button id="update-now-btn" style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
          ">立即更新</button>
        </div>
      </div>
      
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 1001;
      " id="update-overlay"></div>
    `

    document.body.insertAdjacentHTML('beforeend', detailsHTML)

    // 绑定事件
    const updateNowBtn = document.getElementById('update-now-btn')
    const updateLaterBtn = document.getElementById('update-later-btn')
    const overlay = document.getElementById('update-overlay')

    const cleanup = () => {
      overlay?.parentElement?.removeChild(overlay)
      updateNowBtn?.parentElement?.parentElement?.parentElement?.removeChild(
        updateNowBtn.parentElement.parentElement.parentElement
      )
    }

    updateNowBtn?.addEventListener('click', () => {
      cleanup()
      this.applyUpdate()
    })

    updateLaterBtn?.addEventListener('click', () => {
      cleanup()
    })

    overlay?.addEventListener('click', cleanup)
  }

  private showUpdateCompletedNotification(): void {
    console.log('? 应用已成功更新到最新版本')
    
    // 显示更新完成提示
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #059669;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1003;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      ">
        <span>?</span>
        <span>应用已更新到最新版本</span>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // 3秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }
}

// 单例导出
export const versionManager: VersionManager = new VersionManagerImpl()