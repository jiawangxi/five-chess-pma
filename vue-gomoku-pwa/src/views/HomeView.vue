<template>
  <div class="game-container">
    <!-- 自动存档恢复提示 -->
    <div v-if="showAutoSaveRestore" class="auto-save-restore">
      <div class="restore-dialog">
        <h3>🔄 发现未完成的游戏</h3>
        <p>检测到您有一局未完成的游戏，是否要继续？</p>
        <div class="restore-actions">
          <button @click="restoreAutoSave" class="btn btn-primary">
            ✅ 继续游戏
          </button>
          <button @click="dismissAutoSave" class="btn btn-secondary">
            ❌ 开始新游戏
          </button>
        </div>
      </div>
    </div>

    <header class="game-header">
      <h1>🎯 五子棋大师</h1>
      <div class="game-status">
        <div class="status-item">
          <span class="label">当前玩家:</span>
          <span class="player" :class="{ black: currentPlayer === 'black', white: currentPlayer === 'white' }">
            {{ currentPlayer === 'black' ? '⚫ 黑子' : '⚪ 白子' }}
          </span>
        </div>
        <div v-if="winner" class="winner-announcement">
          🎉 {{ winner === 'black' ? '黑子获胜!' : '白子获胜!' }}
        </div>
        <div v-if="aiThinking && !winner" class="ai-thinking">
          🤖 AI思考中...
        </div>
        <div v-if="aiStats.thinkTime > 0 && !aiThinking" class="ai-stats">
          📊 AI: {{ aiStats.thinkTime }}ms / {{ aiStats.nodesSearched }} 节点
        </div>
      </div>
    </header>

    <main class="game-board-container">
      <div class="board-wrapper">
        <div class="game-board">
          <div 
            v-for="(row, rowIndex) in board" 
            :key="rowIndex" 
            class="board-row"
          >
            <div
              v-for="(cell, colIndex) in row"
              :key="colIndex"
              class="board-cell"
              :class="{
                'has-piece': cell !== null,
                'black-piece': cell === 'black',
                'white-piece': cell === 'white',
                'winner-cell': isWinnerCell(rowIndex, colIndex)
              }"
              @click="handleCellClick(rowIndex, colIndex)"
            >
              <div v-if="cell" class="piece" :class="cell">
                {{ cell === 'black' ? '⚫' : '⚪' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="game-controls">
      <div class="control-group">
        <button @click="startNewGame" class="btn btn-primary">
          🎮 新游戏
        </button>
        <button @click="undoMove" class="btn btn-secondary" :disabled="moves.length === 0 || aiThinking">
          ⏪ 悔棋
        </button>
        <button @click="toggleAI" class="btn btn-ai" :class="{ active: aiEnabled }">
          🤖 {{ aiEnabled ? 'AI开启' : 'AI关闭' }}
        </button>
        <button @click="toggleSound" class="btn btn-sound" :class="{ active: soundEnabled }">
          {{ soundEnabled ? '🔊' : '🔇' }} 音效
        </button>
        <router-link to="/settings" class="btn btn-settings">
          ⚙️ 设置
        </router-link>
      </div>
      <div class="secondary-controls">
        <router-link to="/tutorial" class="btn btn-secondary">
          📚 教程
        </router-link>
        <router-link to="/history" class="btn btn-secondary">
          📜 记录
        </router-link>
        <button @click="toggleBackgroundMusic" class="btn btn-music" :class="{ active: backgroundMusicEnabled }">
          {{ backgroundMusicEnabled ? '🎵' : '🎼' }} 音乐
        </button>
      </div>
      <div class="ai-difficulty-control">
        <label>🤖 AI难度:</label>
        <select v-model="aiDifficulty" @change="changeAIDifficulty" class="difficulty-select">
          <option value="easy">😊 简单</option>
          <option value="medium">🙂 中等</option>
          <option value="hard">😐 困难</option>
          <option value="expert">😤 专家</option>
          <option value="master">😈 大师</option>
        </select>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { gameStorage } from '../utils/gameStorage'
import { soundManager } from '../utils/soundManager'
import { GomokuAI } from '../utils/optimizedAI'
import { gameSettings, settingsManager } from '../utils/settingsManager'

interface GameMove {
  row: number
  col: number
  player: 'black' | 'white'
}

interface GameState {
  board: (string | null)[][]
  currentPlayer: 'black' | 'white'
  moves: GameMove[]
  winner: string | null
  aiEnabled: boolean
  gameStartTime: number
  lastMoveTime: number
  gameId: string
}

interface AIStats {
  thinkTime: number
  nodesSearched: number
  depth: number
}

type GameBoard = (string | null)[][]
type WinnerLine = [number, number][]
type AIDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master'

export default {
  name: 'HomeView',
  setup() {
    // 游戏状态
    const board: GameBoard = reactive(Array(15).fill(null).map(() => Array(15).fill(null)))
    const currentPlayer: Ref<'black' | 'white'> = ref('black')
    const winner: Ref<string | null> = ref(null)
    const moves: Ref<GameMove[]> = ref([])
    const aiEnabled = ref(true)
    const winnerLine: Ref<WinnerLine> = ref([])
    const gameId = ref('')
    const gameStartTime = ref(0)
    const lastMoveTime = ref(0)
    const showAutoSaveRestore = ref(false)
    const soundEnabled = ref(true)
    const backgroundMusicEnabled = ref(true)

    // 检查是否为获胜位置的棋子
    const isWinnerCell = (row: number, col: number): boolean => {
      return winnerLine.value.some(([r, c]) => r === row && c === col)
    }

    // 检查获胜条件
    const checkWinner = (row: number, col: number, player: 'black' | 'white'): string | null => {
      const directions = [
        [1, 0], [0, 1], [1, 1], [1, -1]
      ]

      for (const [dx, dy] of directions) {
        const line: [number, number][] = [[row, col]]
        
        // 向一个方向搜索
        for (let i = 1; i < 5; i++) {
          const newRow = row + dx * i
          const newCol = col + dy * i
          if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && 
              board[newRow][newCol] === player) {
            line.push([newRow, newCol])
          } else {
            break
          }
        }

        // 向相反方向搜索
        for (let i = 1; i < 5; i++) {
          const newRow = row - dx * i
          const newCol = col - dy * i
          if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && 
              board[newRow][newCol] === player) {
            line.unshift([newRow, newCol])
          } else {
            break
          }
        }

        if (line.length >= 5) {
          winnerLine.value = line.slice(0, 5) as WinnerLine
          return player
        }
      }
      return null
    }

    // AI相关状态
    const aiThinking = ref(false)
    const aiStats: Ref<AIStats> = ref({
      thinkTime: 0,
      nodesSearched: 0,
      depth: 0
    })
    // 使用全局设置中的AI难度
    const aiDifficulty = computed({
      get: () => gameSettings.defaultAIDifficulty as AIDifficulty,
      set: (value: AIDifficulty) => {
        gameSettings.defaultAIDifficulty = value
      }
    })
    
    // AI实例
    let aiInstance: GomokuAI | null = null

    // 初始化AI
    const initializeAI = () => {
      aiInstance = new GomokuAI(aiDifficulty.value)
    }

    // 优化的AI逻辑
    const makeAIMove = async () => {
      if (aiThinking.value || !aiInstance) return

      try {
        aiThinking.value = true
        const player = currentPlayer.value
        
        // 转换棋盘格式 (string -> number)
        const numericBoard = board.map(row => 
          row.map(cell => {
            if (cell === 'black') return 1
            if (cell === 'white') return 2
            return 0
          })
        )

        // 获取AI最佳走法
        const result = aiInstance.getBestMove(numericBoard, player === 'black')

        // 更新AI统计信息
        aiStats.value = {
          thinkTime: result.thinkTime,
          nodesSearched: result.nodesSearched,
          depth: aiInstance.getConfig().maxDepth
        }

        const { row, col } = result.position
        
        // 执行AI走棋
        board[row][col] = player
        moves.value.push({ row, col, player })
        lastMoveTime.value = Date.now()

        // 播放AI落子音效
        const soundName = player === 'black' ? 'placeBlack' : 'placeWhite'
        settingsManager.playSound(soundName) // AI音效

        // 检查获胜
        const gameWinner = checkWinner(row, col, player)
        if (gameWinner) {
          winner.value = gameWinner
          // 播放获胜音效
          setTimeout(() => settingsManager.playSound('gameWin'), 200)
          return
        }

        currentPlayer.value = player === 'black' ? 'white' : 'black'
        
        console.log(`🤖 AI思考 ${result.thinkTime}ms, 搜索 ${result.nodesSearched} 节点`)
        
      } catch (error) {
        console.error('AI思考出错:', error)
        // 降级到简单AI
        fallbackAIMove()
      } finally {
        aiThinking.value = false
      }
    }

    // 改变AI难度
    const changeAIDifficulty = () => {
      initializeAI()
      settingsManager.playSound('buttonClick')
    }

    // 降级AI逻辑（备用）
    const fallbackAIMove = () => {
      const emptyCells: [number, number][] = []
      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          if (board[i][j] === null) {
            emptyCells.push([i, j])
          }
        }
      }

      if (emptyCells.length === 0) return

      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      board[row][col] = currentPlayer.value
      moves.value.push({ row, col, player: currentPlayer.value })
      lastMoveTime.value = Date.now()

      // 播放落子音效
      const soundName = currentPlayer.value === 'black' ? 'placeBlack' : 'placeWhite'
      settingsManager.playSound(soundName)

      const gameWinner = checkWinner(row, col, currentPlayer.value)
      if (gameWinner) {
        winner.value = gameWinner
        setTimeout(() => settingsManager.playSound('gameWin'), 200)
        return
      }

      currentPlayer.value = currentPlayer.value === 'black' ? 'white' : 'black'
    }

    // 处理棋子点击
    const handleCellClick = (row: number, col: number) => {
      if (board[row][col] !== null || winner.value || aiThinking.value) {
        return
      }

      // 人类玩家落子
      const player = currentPlayer.value
      board[row][col] = player
      moves.value.push({ row, col, player })
      lastMoveTime.value = Date.now()

      // 播放落子音效
      const soundName = player === 'black' ? 'placeBlack' : 'placeWhite'
      settingsManager.playSound(soundName)

      // 检查获胜
      const gameWinner = checkWinner(row, col, player)
      if (gameWinner) {
        winner.value = gameWinner
        // 播放获胜音效
        setTimeout(() => settingsManager.playSound('gameWin'), 200)
        return
      }

      currentPlayer.value = player === 'black' ? 'white' : 'black'

      // 如果启用AI且当前是白棋，让AI下棋
      if (aiEnabled.value && currentPlayer.value === 'white') {
        nextTick(() => {
          setTimeout(makeAIMove, 300) // 添加短暂延迟让动画更自然
        })
      }
    }

    // 开始新游戏
    const startNewGame = () => {
      // 清空棋盘
      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          board[i][j] = null
        }
      }

      currentPlayer.value = 'black'
      winner.value = null
      moves.value = []
      winnerLine.value = []
      gameId.value = `game_${Date.now()}`
      gameStartTime.value = Date.now()
      lastMoveTime.value = Date.now()

      // 播放开始音效
      settingsManager.playSound('gameStart')

      // 清除自动存档
      gameStorage.clearAutoSave()

      // 重新初始化AI
      initializeAI()
    }

    // 悔棋功能
    const undoMove = () => {
      if (moves.value.length === 0 || aiThinking.value) return

      const lastMove = moves.value.pop()
      if (!lastMove) return

      board[lastMove.row][lastMove.col] = null
      winner.value = null
      winnerLine.value = []

      // 如果启用AI，可能需要撤销两步（人类+AI）
      if (aiEnabled.value && moves.value.length > 0 && moves.value[moves.value.length - 1].player === 'white') {
        const aiMove = moves.value.pop()
        if (aiMove) {
          board[aiMove.row][aiMove.col] = null
        }
      }

      currentPlayer.value = moves.value.length % 2 === 0 ? 'black' : 'white'
      
      // 播放悔棋音效
      settingsManager.playSound('undo')
    }

    // 切换AI
    const toggleAI = () => {
      aiEnabled.value = !aiEnabled.value
      settingsManager.playSound('buttonClick')
    }

    // 切换音效
    const toggleSound = () => {
      soundEnabled.value = !soundEnabled.value
      soundManager.setEnabled(soundEnabled.value)
      if (soundEnabled.value) {
        settingsManager.playSound('buttonClick')
      }
    }

    // 切换背景音乐
    const toggleBackgroundMusic = () => {
      backgroundMusicEnabled.value = !backgroundMusicEnabled.value
      if (backgroundMusicEnabled.value) {
        soundManager.playBackgroundMusic()
      } else {
        soundManager.stopBackgroundMusic()
      }
      if (soundEnabled.value) {
        settingsManager.playSound('buttonClick')
      }
    }

    // 自动保存相关
    let autoSaveInterval: number | null = null

    const startAutoSave = () => {
      autoSaveInterval = setInterval(() => {
        if (moves.value.length > 0 && !winner.value) {
          const gameState: GameState = {
            board: board.map(row => [...row]),
            currentPlayer: currentPlayer.value,
            moves: [...moves.value],
            winner: winner.value,
            aiEnabled: aiEnabled.value,
            gameStartTime: gameStartTime.value,
            lastMoveTime: lastMoveTime.value,
            gameId: gameId.value
          }
          gameStorage.saveAuto(gameState)
        }
      }, 15000) // 每15秒自动保存
    }

    const restoreAutoSave = () => {
      const saved = gameStorage.loadAuto()
      if (saved) {
        // 恢复游戏状态
        for (let i = 0; i < 15; i++) {
          for (let j = 0; j < 15; j++) {
            board[i][j] = saved.board[i][j]
          }
        }
        currentPlayer.value = saved.currentPlayer
        moves.value = saved.moves
        winner.value = saved.winner
        aiEnabled.value = saved.aiEnabled
        gameStartTime.value = saved.gameStartTime
        lastMoveTime.value = saved.lastMoveTime
        gameId.value = saved.gameId
      }
      showAutoSaveRestore.value = false
    }

    const dismissAutoSave = () => {
      gameStorage.clearAutoSave()
      showAutoSaveRestore.value = false
      startNewGame()
    }

    // 生命周期
    onMounted(() => {
      // 检查是否有自动存档
      const autoSave = gameStorage.loadAuto()
      if (autoSave && autoSave.moves.length > 0) {
        showAutoSaveRestore.value = true
      } else {
        startNewGame()
      }

      // 开始自动保存
      startAutoSave()
      
      // 初始化音效系统
      soundManager.init()

      // 初始化AI
      initializeAI()

      // 设置页面标题
      document.title = '🎯 五子棋大师 - 智能AI对战游戏'
    })

    onUnmounted(() => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval)
      }
      soundManager.cleanup()
    })

    return {
      // 状态
      board,
      currentPlayer,
      winner,
      moves,
      aiEnabled,
      winnerLine,
      aiThinking,
      aiStats,
      aiDifficulty,
      soundEnabled,
      backgroundMusicEnabled,
      showAutoSaveRestore,

      // 方法
      handleCellClick,
      startNewGame,
      undoMove,
      toggleAI,
      toggleSound,
      toggleBackgroundMusic,
      changeAIDifficulty,
      isWinnerCell,
      restoreAutoSave,
      dismissAutoSave
    }
  }
}
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

.auto-save-restore {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.restore-dialog {
  background: white;
  color: #333;
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
}

.restore-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: center;
}

.game-header {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.game-header h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.game-status {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.player {
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.2);
}

.player.black { background: rgba(0, 0, 0, 0.7); }
.player.white { background: rgba(255, 255, 255, 0.7); color: #333; }

.winner-announcement {
  font-size: 1.2rem;
  font-weight: bold;
  background: rgba(255, 215, 0, 0.9);
  color: #333;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  animation: celebration 1s ease-in-out;
}

@keyframes celebration {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.ai-thinking {
  color: #ffd700;
  font-weight: bold;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.ai-stats {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.game-board-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.board-wrapper {
  background: rgba(139, 69, 19, 0.9);
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.game-board {
  display: grid;
  grid-template-rows: repeat(15, 1fr);
  gap: 1px;
  background: #8B4513;
  border: 2px solid #654321;
  border-radius: 8px;
  overflow: hidden;
}

.board-row {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 1px;
}

.board-cell {
  width: 30px;
  height: 30px;
  background: #D2691E;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.board-cell:hover:not(.has-piece) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.board-cell.winner-cell {
  background: rgba(255, 215, 0, 0.6) !important;
  animation: winner-glow 2s infinite;
}

@keyframes winner-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.8); }
  50% { box-shadow: 0 0 15px rgba(255, 215, 0, 1); }
}

.piece {
  font-size: 20px;
  animation: placeAnimation 0.3s ease-out;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

@keyframes placeAnimation {
  0% { transform: scale(0) rotate(180deg); opacity: 0; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.game-controls {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.control-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.secondary-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.ai-difficulty-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.btn-primary {
  background: rgba(76, 175, 80, 0.8);
}

.btn.btn-secondary {
  background: rgba(158, 158, 158, 0.8);
}

.btn.active {
  background: rgba(255, 215, 0, 0.8);
  color: #333;
}

.difficulty-select {
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-weight: bold;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .game-header h1 {
    font-size: 1.5rem;
  }
  
  .board-cell {
    width: 22px;
    height: 22px;
  }
  
  .piece {
    font-size: 16px;
  }
  
  .control-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
  
  .ai-difficulty-control {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .board-cell {
    width: 18px;
    height: 18px;
  }
  
  .piece {
    font-size: 14px;
  }
  
  .board-wrapper {
    padding: 10px;
  }
}
</style>