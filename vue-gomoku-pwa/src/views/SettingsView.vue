<template>
  <div class="settings-container">
    <header class="settings-header">
      <button @click="goBack" class="back-btn">
        ← 返回
      </button>
      <h1>? 游戏设置</h1>
    </header>

    <main class="settings-content">
      <section class="setting-section">
        <h2>? 音效设置</h2>
        <div class="setting-item">
          <label class="setting-label">
            <span>音效开关</span>
            <input 
              v-model="settings.soundEnabled" 
              type="checkbox" 
              class="setting-toggle"
              @change="updateSoundSettings"
            >
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span>背景音乐</span>
            <input 
              v-model="settings.backgroundMusicEnabled" 
              type="checkbox" 
              class="setting-toggle"
              @change="updateMusicSettings"
            >
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span>音量大小</span>
            <input 
              v-model="settings.volume" 
              type="range" 
              min="0" 
              max="100" 
              class="setting-slider"
              @input="updateVolumeSettings"
            >
            <span class="volume-display">{{ settings.volume }}%</span>
          </label>
        </div>
      </section>

      <section class="setting-section">
        <h2>? AI设置</h2>
        <div class="setting-item">
          <label class="setting-label">
            <span>默认难度</span>
            <select v-model="settings.defaultAIDifficulty" class="setting-select" @change="updateAISettings">
              <option value="easy">? 简单</option>
              <option value="medium">? 中等</option>
              <option value="hard">? 困难</option>
              <option value="expert">? 专家</option>
              <option value="master">? 大师</option>
            </select>
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span>AI思考时间显示</span>
            <input 
              v-model="settings.showAIStats" 
              type="checkbox" 
              class="setting-toggle"
              @change="updateAISettings"
            >
          </label>
        </div>
      </section>

      <section class="setting-section">
        <h2>? 游戏设置</h2>
        <div class="setting-item">
          <label class="setting-label">
            <span>自动保存</span>
            <input 
              v-model="settings.autoSaveEnabled" 
              type="checkbox" 
              class="setting-toggle"
              @change="updateGameSettings"
            >
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span>自动保存间隔</span>
            <select v-model="settings.autoSaveInterval" class="setting-select" @change="updateGameSettings">
              <option value="10">10秒</option>
              <option value="15">15秒</option>
              <option value="30">30秒</option>
              <option value="60">1分钟</option>
            </select>
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span>获胜动画</span>
            <input 
              v-model="settings.winAnimationEnabled" 
              type="checkbox" 
              class="setting-toggle"
              @change="updateGameSettings"
            >
          </label>
        </div>
      </section>

      <section class="setting-section">
        <h2>? 显示设置</h2>
        <div class="setting-item">
          <label class="setting-label">
            <span>主题模式</span>
            <select v-model="settings.theme" class="setting-select" @change="updateThemeSettings">
              <option value="auto">? 自动</option>
              <option value="light">?? 浅色</option>
              <option value="dark">? 深色</option>
            </select>
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span>棋盘网格</span>
            <input 
              v-model="settings.showBoardGrid" 
              type="checkbox" 
              class="setting-toggle"
              @change="updateDisplaySettings"
            >
          </label>
        </div>
        <div class="setting-item">
          <label class="setting-label">
            <span>坐标显示</span>
            <input 
              v-model="settings.showCoordinates" 
              type="checkbox" 
              class="setting-toggle"
              @change="updateDisplaySettings"
            >
          </label>
        </div>
      </section>

      <section class="setting-section">
        <h2>? 数据管理</h2>
        <div class="setting-actions">
          <button @click="exportSettings" class="action-btn export-btn">
            ? 导出设置
          </button>
          <button @click="importSettings" class="action-btn import-btn">
            ? 导入设置
          </button>
          <button @click="resetSettings" class="action-btn reset-btn">
            ? 恢复默认
          </button>
          <button @click="clearAllData" class="action-btn danger-btn">
            ?? 清除所有数据
          </button>
        </div>
        <input ref="fileInput" type="file" accept=".json" style="display: none" @change="handleFileImport">
      </section>

      <section class="setting-section">
        <h2>? 存储信息</h2>
        <div class="storage-info">
          <div class="info-item">
            <span class="info-label">游戏存档:</span>
            <span class="info-value">{{ storageInfo.slotsSize }} KB</span>
          </div>
          <div class="info-item">
            <span class="info-label">自动保存:</span>
            <span class="info-value">{{ storageInfo.autoSaveSize }} KB</span>
          </div>
          <div class="info-item">
            <span class="info-label">总使用量:</span>
            <span class="info-value">{{ storageInfo.totalSize }} KB</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gameStorage } from '../utils/gameStorage'
import { soundManager } from '../utils/soundManager'
import { gameSettings, settingsManager } from '../utils/settingsManager'

export default {
  name: 'SettingsView',
  setup() {
    const router = useRouter()
    const fileInput = ref<HTMLInputElement>()
    
    // 使用全局设置状态
    const settings = gameSettings
    
    // 存储信息
    const storageInfo = reactive({
      slotsSize: 0,
      autoSaveSize: 0,
      totalSize: 0
    })

    // 设置已由全局设置管理器自动处理

    // 更新存储信息
    const updateStorageInfo = () => {
      const info = gameStorage.getStorageInfo()
      storageInfo.slotsSize = Math.round(info.slotsSize / 1024)
      storageInfo.autoSaveSize = Math.round(info.autoSaveSize / 1024)
      storageInfo.totalSize = Math.round(info.totalSize / 1024)
    }

    // 音效设置更新
    // 设置更新函数 - 现在由全局设置管理器自动处理保存和应用
    const updateSoundSettings = () => {
      // 音效设置会由settingsManager自动应用
    }

    const updateMusicSettings = () => {
      // 音乐设置会由settingsManager自动应用
    }

    const updateVolumeSettings = () => {
      // 音量设置会由settingsManager自动应用
    }

    const updateAISettings = () => {
      // AI设置会自动保存
    }

    const updateGameSettings = () => {
      // 游戏设置会自动保存
    }

    const updateThemeSettings = () => {
      // 主题设置会由settingsManager自动应用
    }

    const updateDisplaySettings = () => {
      // 显示设置会自动保存
    }


    // 导出设置
    const exportSettings = () => {
      try {
        const dataStr = JSON.stringify(settings, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        
        const link = document.createElement('a')
        link.href = URL.createObjectURL(dataBlob)
        link.download = `gomoku-settings-${new Date().toISOString().slice(0, 10)}.json`
        link.click()
        
        soundManager.playSound('buttonClick')
      } catch (error) {
        console.error('导出设置失败:', error)
        soundManager.playSound('error')
      }
    }

    // 导入设置
    const importSettings = () => {
      fileInput.value?.click()
    }

    // 处理文件导入
    const handleFileImport = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          Object.assign(settings, importedSettings)
          // 设置会自动保存和应用
          settingsManager.playSound('buttonClick')
        } catch (error) {
          console.error('导入设置失败:', error)
          settingsManager.playSound('error')
        }
      }
      reader.readAsText(file)
    }

    // 重置设置
    const resetSettings = () => {
      if (confirm('确定要恢复默认设置吗？这将清除所有自定义配置。')) {
        settingsManager.resetToDefaults()
        settingsManager.playSound('buttonClick')
      }
    }

    // 清除所有数据
    const clearAllData = () => {
      if (confirm('?? 警告：这将删除所有游戏数据和设置，包括存档、历史记录等。确定要继续吗？')) {
        if (confirm('? 最后确认：所有数据将被永久删除，无法恢复！')) {
          gameStorage.clearAllData()
          settingsManager.resetToDefaults()
          updateStorageInfo()
          settingsManager.playSound('buttonClick')
          alert('? 所有数据已清除完成')
        }
      }
    }

    // 返回上一页
    const goBack = () => {
      router.back()
    }

    // 初始化
    onMounted(() => {
      updateStorageInfo()
      // 设置已由全局设置管理器处理，主题也会自动应用
    })

    return {
      settings,
      storageInfo,
      fileInput,
      
      // 方法
      updateSoundSettings,
      updateMusicSettings,
      updateVolumeSettings,
      updateAISettings,
      updateGameSettings,
      updateThemeSettings,
      updateDisplaySettings,
      exportSettings,
      importSettings,
      handleFileImport,
      resetSettings,
      clearAllData,
      goBack
    }
  }
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.settings-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-right: 1rem;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.settings-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.settings-content {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.setting-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.setting-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #ffd700;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.setting-toggle {
  width: 50px;
  height: 25px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.setting-toggle:checked {
  background: #4CAF50;
}

.setting-toggle:before {
  content: '';
  position: absolute;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: white;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
}

.setting-toggle:checked:before {
  transform: translateX(25px);
}

.setting-slider {
  flex: 1;
  margin: 0 1rem;
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
}

.setting-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffd700;
  cursor: pointer;
}

.volume-display {
  min-width: 40px;
  text-align: right;
  font-weight: bold;
}

.setting-select {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  padding: 0.5rem;
  font-size: 1rem;
}

.setting-select option {
  background: #333;
  color: white;
}

.setting-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn {
  background: #2196F3;
  color: white;
}

.import-btn {
  background: #FF9800;
  color: white;
}

.reset-btn {
  background: #9C27B0;
  color: white;
}

.danger-btn {
  background: #f44336;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.storage-info {
  display: grid;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-label {
  color: rgba(255, 255, 255, 0.8);
}

.info-value {
  font-weight: bold;
  color: #ffd700;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .settings-content {
    padding: 0.5rem;
  }
  
  .setting-section {
    padding: 1rem;
  }
  
  .setting-actions {
    grid-template-columns: 1fr;
  }
}

/* 主题样式 */
:root.light-theme .settings-container {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
}

:root.dark-theme .settings-container {
  background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
}
</style>