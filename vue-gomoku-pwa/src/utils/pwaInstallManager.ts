// PWA 安装管理器
// 处理PWA安装提示和安装状态管理

export interface PWAInstallManager {
  canInstall: boolean
  isInstalled: boolean
  initialize(): void
  promptInstall(): Promise<boolean>
  checkInstallStatus(): void
  showInstallPrompt(): void
  hideInstallPrompt(): void
}

class PWAInstallManagerImpl implements PWAInstallManager {
  public canInstall: boolean = false
  public isInstalled: boolean = false
  private deferredPrompt: any = null
  private installPromptElement: HTMLElement | null = null

  initialize(): void {
    this.setupInstallPrompt()
    this.checkInstallStatus()
    this.createInstallPromptUI()
  }

  private setupInstallPrompt(): void {
    // 监听beforeinstallprompt事件
    window.addEventListener('beforeinstallprompt', (e) => {
      // 阻止默认安装提示
      e.preventDefault()
      // 保存事件，以便后续使用
      this.deferredPrompt = e
      this.canInstall = true
      
      console.log('PWA安装提示已准备就绪')
      
      // 显示自定义安装提示
      this.showInstallPrompt()
    })

    // 监听appinstalled事件
    window.addEventListener('appinstalled', () => {
      console.log('PWA已安装')
      this.isInstalled = true
      this.canInstall = false
      this.deferredPrompt = null
      this.hideInstallPrompt()
      
      // 显示安装成功提示
      this.showInstallSuccessMessage()
    })
  }

  checkInstallStatus(): void {
    // 检查是否已作为PWA运行
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true
      console.log('应用正在以PWA模式运行')
    }

    // 检查是否在支持的浏览器中
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('浏览器支持PWA功能')
    }
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('安装提示不可用')
      return false
    }

    try {
      // 显示安装提示
      this.deferredPrompt.prompt()
      
      // 等待用户响应
      const choiceResult = await this.deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('用户接受了安装提示')
        return true
      } else {
        console.log('用户拒绝了安装提示')
        return false
      }
    } catch (error) {
      console.error('安装提示出错:', error)
      return false
    } finally {
      this.deferredPrompt = null
      this.canInstall = false
    }
  }

  private createInstallPromptUI(): void {
    // 创建安装提示UI元素
    const promptHTML = `
      <div id="pwa-install-prompt" style="
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #2563eb;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        display: none;
        align-items: center;
        gap: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
      ">
        <span>?</span>
        <span>添加五子棋到主屏幕，获得更好的游戏体验</span>
        <button id="pwa-install-btn" style="
          background: white;
          color: #2563eb;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        ">安装</button>
        <button id="pwa-dismiss-btn" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">取消</button>
      </div>
    `

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', promptHTML)
    this.installPromptElement = document.getElementById('pwa-install-prompt')

    // 绑定事件
    const installBtn = document.getElementById('pwa-install-btn')
    const dismissBtn = document.getElementById('pwa-dismiss-btn')

    installBtn?.addEventListener('click', () => {
      this.promptInstall()
    })

    dismissBtn?.addEventListener('click', () => {
      this.hideInstallPrompt()
      // 记住用户的选择，一段时间内不再显示
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    })
  }

  showInstallPrompt(): void {
    // 检查用户是否最近拒绝过安装
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const dayInMs = 24 * 60 * 60 * 1000
      if (Date.now() - dismissedTime < dayInMs) {
        return // 24小时内不再显示
      }
    }

    if (this.installPromptElement) {
      this.installPromptElement.style.display = 'flex'
    }
  }

  hideInstallPrompt(): void {
    if (this.installPromptElement) {
      this.installPromptElement.style.display = 'none'
    }
  }

  private showInstallSuccessMessage(): void {
    console.log('? 五子棋已成功安装到您的设备！')
    
    // 显示成功消息
    const successMessage = document.createElement('div')
    successMessage.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #059669;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1001;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
      ">
        ? 五子棋已安装成功！现在可以从主屏幕快速启动了。
      </div>
    `
    
    document.body.appendChild(successMessage)
    
    // 3秒后自动移除
    setTimeout(() => {
      document.body.removeChild(successMessage)
    }, 3000)
  }
}

// 单例导出
export const pwaInstallManager: PWAInstallManager = new PWAInstallManagerImpl()