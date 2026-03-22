// 设置管理器 - 全局响应式设置状态管理
import { reactive, watchEffect } from 'vue'
import { soundManager } from './soundManager'

// 设置接口定义
export interface GameSettings {
  // 音效设置
  soundEnabled: boolean
  backgroundMusicEnabled: boolean
  volume: number
  
  // AI设置
  defaultAIDifficulty: string
  showAIStats: boolean
  
  // 游戏设置
  autoSaveEnabled: boolean
  autoSaveInterval: number
  winAnimationEnabled: boolean
  
  // 显示设置
  theme: string
  showBoardGrid: boolean
  showCoordinates: boolean
}

// 默认设置
const defaultSettings: GameSettings = {
  soundEnabled: true,
  backgroundMusicEnabled: true,
  volume: 70,
  defaultAIDifficulty: 'hard',
  showAIStats: true,
  autoSaveEnabled: true,
  autoSaveInterval: 15,
  winAnimationEnabled: true,
  theme: 'auto',
  showBoardGrid: true,
  showCoordinates: false
}

// 全局响应式设置状态
export const settings = reactive<GameSettings>({ ...defaultSettings })

// 设置管理类
class SettingsManager {
  // 加载设置
  loadSettings() {
    try {
      const saved = localStorage.getItem('gomoku_settings')
      if (saved) {
        const savedSettings = JSON.parse(saved)
        // 合并默认设置和保存的设置
        Object.assign(settings, { ...defaultSettings, ...savedSettings })
      }
    } catch (error) {
      console.error('加载设置失败:', error)
      // 出错时恢复默认设置
      Object.assign(settings, defaultSettings)
    }
  }

  // 保存设置
  saveSettings() {
    try {
      localStorage.setItem('gomoku_settings', JSON.stringify(settings))
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  // 重置为默认设置
  resetToDefaults() {
    Object.assign(settings, defaultSettings)
    this.saveSettings()
  }

  // 应用主题设置
  applyTheme() {
    const theme = settings.theme
    const html = document.documentElement
    
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark')
    } else if (theme === 'light') {
      html.setAttribute('data-theme', 'light')
    } else {
      // 跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      html.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    }
  }

  // 应用音效设置
  applySoundSettings() {
    soundManager.setEnabled(settings.soundEnabled)
    soundManager.setBackgroundMusicEnabled(settings.backgroundMusicEnabled)
  }

  // 初始化设置管理器
  initialize() {
    // 加载保存的设置
    this.loadSettings()
    
    // 应用初始设置
    this.applyTheme()
    this.applySoundSettings()
    
    // 监听主题变化并应用
    watchEffect(() => {
      this.applyTheme()
    })
    
    // 监听音效设置变化并应用
    watchEffect(() => {
      this.applySoundSettings()
    })
    
    // 监听系统主题变化（当设置为自动时）
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        if (settings.theme === 'auto') {
          this.applyTheme()
        }
      })
    }
    
    // 自动保存设置变更
    watchEffect(() => {
      this.saveSettings()
    })
  }

  // 获取当前AI难度级别
  getAIDifficulty(): string {
    return settings.defaultAIDifficulty
  }

  // 设置AI难度级别
  setAIDifficulty(difficulty: string) {
    settings.defaultAIDifficulty = difficulty
  }

  // 播放音效（根据设置）
  playSound(soundType: string) {
    if (settings.soundEnabled) {
      soundManager.playSound(soundType)
    }
  }
}

// 导出单例实例
export const settingsManager = new SettingsManager()

// 导出设置状态供组件使用
export { settings as gameSettings }