/**
 * 游戏状态管理服务
 * 提供游戏进度的自动保存、恢复和管理功能
 */

export interface GameState {
  board: (string | null)[][]
  currentPlayer: 'black' | 'white'
  moves: Array<{
    row: number
    col: number
    player: 'black' | 'white'
  }>
  winner: string | null
  aiEnabled: boolean
  gameStartTime: number
  lastMoveTime: number
  gameId: string
}

export interface SaveSlot {
  id: string
  name: string
  gameState: GameState
  createdAt: number
  updatedAt: number
  thumbnail?: string // base64 编码的棋盘缩略图
}

export class GameStorageService {
  private static instance: GameStorageService
  private readonly STORAGE_KEY = 'gomoku_game_states'
  private readonly AUTO_SAVE_KEY = 'gomoku_auto_save'
  private readonly MAX_SAVE_SLOTS = 10
  private autoSaveInterval: number | null = null

  static getInstance(): GameStorageService {
    if (!GameStorageService.instance) {
      GameStorageService.instance = new GameStorageService()
    }
    return GameStorageService.instance
  }

  /**
   * 启用自动保存
   * @param gameStateProvider 获取当前游戏状态的函数
   * @param intervalMs 自动保存间隔（毫秒）
   */
  enableAutoSave(gameStateProvider: () => GameState, intervalMs = 30000) {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }

    this.autoSaveInterval = setInterval(() => {
      const gameState = gameStateProvider()
      if (this.shouldAutoSave(gameState)) {
        this.saveAuto(gameState)
      }
    }, intervalMs)
  }

  /**
   * 禁用自动保存
   */
  disableAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  /**
   * 判断是否应该自动保存
   */
  private shouldAutoSave(gameState: GameState): boolean {
    // 如果游戏还没开始，不保存
    if (gameState.moves.length === 0) return false
    
    // 如果游戏已结束，不保存
    if (gameState.winner) return false

    return true
  }

  /**
   * 保存自动存档
   */
  saveAuto(gameState: GameState): void {
    try {
      const autoSaveData = {
        ...gameState,
        savedAt: Date.now()
      }
      localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(autoSaveData))
    } catch (error) {
      console.warn('自动保存失败:', error)
    }
  }

  /**
   * 加载自动存档
   */
  loadAuto(): GameState | null {
    try {
      const data = localStorage.getItem(this.AUTO_SAVE_KEY)
      if (!data) return null

      const autoSaveData = JSON.parse(data)
      
      // 检查自动存档是否过期（24小时）
      const now = Date.now()
      const savedAt = autoSaveData.savedAt || 0
      if (now - savedAt > 24 * 60 * 60 * 1000) {
        this.clearAutoSave()
        return null
      }

      return autoSaveData
    } catch (error) {
      console.warn('加载自动存档失败:', error)
      return null
    }
  }

  /**
   * 加载自动存档（向后兼容）
   */
  loadAutoSave(): GameState | null {
    return this.loadAuto()
  }

  /**
   * 清除自动存档
   */
  clearAutoSave(): void {
    localStorage.removeItem(this.AUTO_SAVE_KEY)
  }

  /**
   * 保存游戏到指定槽位
   */
  saveToSlot(gameState: GameState, slotName: string): boolean {
    try {
      const saveSlots = this.getAllSaveSlots()
      const now = Date.now()
      
      const newSlot: SaveSlot = {
        id: this.generateId(),
        name: slotName,
        gameState: { ...gameState },
        createdAt: now,
        updatedAt: now,
        thumbnail: this.generateThumbnail(gameState.board)
      }

      // 查找是否已存在同名存档
      const existingIndex = saveSlots.findIndex(slot => slot.name === slotName)
      
      if (existingIndex >= 0) {
        // 更新现有存档
        saveSlots[existingIndex] = {
          ...saveSlots[existingIndex],
          gameState: { ...gameState },
          updatedAt: now,
          thumbnail: newSlot.thumbnail
        }
      } else {
        // 新建存档
        saveSlots.push(newSlot)
        
        // 保持最大存档数量限制
        if (saveSlots.length > this.MAX_SAVE_SLOTS) {
          saveSlots.sort((a, b) => b.updatedAt - a.updatedAt)
          saveSlots.splice(this.MAX_SAVE_SLOTS)
        }
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveSlots))
      return true
    } catch (error) {
      console.error('保存游戏失败:', error)
      return false
    }
  }

  /**
   * 从槽位加载游戏
   */
  loadFromSlot(slotId: string): GameState | null {
    try {
      const saveSlots = this.getAllSaveSlots()
      const slot = saveSlots.find(s => s.id === slotId)
      return slot ? slot.gameState : null
    } catch (error) {
      console.error('加载游戏失败:', error)
      return null
    }
  }

  /**
   * 获取所有存档槽位
   */
  getAllSaveSlots(): SaveSlot[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (!data) return []
      
      const slots = JSON.parse(data) as SaveSlot[]
      return slots.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (error) {
      console.error('获取存档列表失败:', error)
      return []
    }
  }

  /**
   * 删除存档槽位
   */
  deleteSlot(slotId: string): boolean {
    try {
      const saveSlots = this.getAllSaveSlots()
      const filteredSlots = saveSlots.filter(slot => slot.id !== slotId)
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredSlots))
      return true
    } catch (error) {
      console.error('删除存档失败:', error)
      return false
    }
  }

  /**
   * 生成存档缩略图
   */
  private generateThumbnail(board: (string | null)[][]): string {
    // 创建简单的文本表示作为缩略图
    const thumbnail = board.map(row => 
      row.map(cell => cell === 'black' ? '●' : cell === 'white' ? '○' : '·').join('')
    ).join('\n')
    
    return btoa(encodeURIComponent(thumbnail))
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 获取存储使用情况
   */
  getStorageInfo() {
    const autoSaveSize = this.getItemSize(this.AUTO_SAVE_KEY)
    const slotsSize = this.getItemSize(this.STORAGE_KEY)
    const totalSize = autoSaveSize + slotsSize
    
    return {
      autoSaveSize,
      slotsSize,
      totalSize,
      slotCount: this.getAllSaveSlots().length,
      maxSlots: this.MAX_SAVE_SLOTS
    }
  }

  /**
   * 获取存储项的大小（字节）
   */
  private getItemSize(key: string): number {
    const item = localStorage.getItem(key)
    return item ? new Blob([item]).size : 0
  }

  /**
   * 清理所有存档数据
   */
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.AUTO_SAVE_KEY)
  }

  /**
   * 检查是否有自动存档可恢复
   */
  hasAutoSave(): boolean {
    return this.loadAutoSave() !== null
  }

  /**
   * 导出存档数据
   */
  exportSaveData(): string {
    const autoSave = localStorage.getItem(this.AUTO_SAVE_KEY)
    const saveSlots = localStorage.getItem(this.STORAGE_KEY)
    
    return JSON.stringify({
      autoSave: autoSave ? JSON.parse(autoSave) : null,
      saveSlots: saveSlots ? JSON.parse(saveSlots) : [],
      exportedAt: Date.now(),
      version: '1.0.0'
    })
  }

  /**
   * 导入存档数据
   */
  importSaveData(data: string): boolean {
    try {
      const importData = JSON.parse(data)
      
      if (importData.autoSave) {
        localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(importData.autoSave))
      }
      
      if (importData.saveSlots && Array.isArray(importData.saveSlots)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(importData.saveSlots))
      }
      
      return true
    } catch (error) {
      console.error('导入存档数据失败:', error)
      return false
    }
  }
}

// 导出单例实例
export const gameStorage = GameStorageService.getInstance()