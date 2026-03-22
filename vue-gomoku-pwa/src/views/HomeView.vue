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
                occupied: cell !== null,
                black: cell === 'black',
                white: cell === 'white',
                winner: isWinnerCell(rowIndex, colIndex)
              }"
              @click="makeMove(rowIndex, colIndex)"
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
      <button @click="newGame" class="btn btn-primary">
        🔄 新游戏
      </button>
      <button @click="undoMove" :disabled="moves.length === 0" class="btn btn-secondary">
        ↶ 悔棋
      </button>
      <div class="ai-toggle">
        <label>
          <input type="checkbox" v-model="aiEnabled" />
          🤖 AI对手
        </label>
      </div>
      <div class="sound-controls">
        <button @click="toggleSound" class="btn btn-sound" :class="{ active: soundEnabled }">
          {{ soundEnabled ? '🔊' : '🔇' }} 音效
        </button>
        <button @click="toggleBackgroundMusic" class="btn btn-music" :class="{ active: backgroundMusicEnabled }">
          {{ backgroundMusicEnabled ? '🎵' : '🎼' }} 音乐
        </button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { ref, reactive, nextTick, onMounted, onUnmounted } from 'vue'
import { gameStorage } from '../utils/gameStorage'
import { soundManager } from '../utils/soundManager'

interface GameState {
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

export default {
  name: 'HomeView',
  setup() {
    // 游戏状态
    const board = reactive(Array(15).fill().map(() => Array(15).fill(null)))
    const currentPlayer = ref('black')
    const winner = ref(null)
    const moves = ref([])
    const aiEnabled = ref(true)
    const winnerLine = ref([])
    const gameId = ref('')
    const gameStartTime = ref(0)
    const lastMoveTime = ref(0)
    const showAutoSaveRestore = ref(false)
    const soundEnabled = ref(true)
    const backgroundMusicEnabled = ref(true)

    // 检查是否为获胜位置的棋子
    const isWinnerCell = (row, col) => {
      return winnerLine.value.some(([r, c]) => r === row && c === col)
    }

    // 检查获胜条件
    const checkWinner = (row, col, player) => {
      const directions = [
        [1, 0], [0, 1], [1, 1], [1, -1]
      ]

      for (const [dx, dy] of directions) {
        const line = [[row, col]]
        
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
          winnerLine.value = line.slice(0, 5)
          return player
        }
      }
      return null
    }

    // 简化的AI逻辑
    const makeAIMove = () => {
      const emptyCells = []
      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          if (board[i][j] === null) {
            emptyCells.push([i, j])
          }
        }
      }

      if (emptyCells.length === 0) return

      // 简单策略：优先在棋盘中心区域下棋
      const centerCells = emptyCells.filter(([r, c]) => {
        const distanceFromCenter = Math.abs(r - 7) + Math.abs(c - 7)
        return distanceFromCenter <= 4
      })

      const targetCells = centerCells.length > 0 ? centerCells : emptyCells
      const randomIndex = Math.floor(Math.random() * targetCells.length)
      const [row, col] = targetCells[randomIndex]
      
      const player = currentPlayer.value
      board[row][col] = player
      moves.value.push({ row, col, player })
      lastMoveTime.value = Date.now()

      // 播放AI落子音效
      const soundName = player === 'black' ? 'placeBlack' : 'placeWhite'
      soundManager.playSound(soundName, { pitch: 0.9 }) // AI音效音调稍低

      const gameWinner = checkWinner(row, col, player)
      if (gameWinner) {
        winner.value = gameWinner
        // 播放获胜音效
        setTimeout(() => soundManager.playSound('gameWin'), 200)
        return
      }

      currentPlayer.value = player === 'black' ? 'white' : 'black'
    }

    // 玩家下棋
    const makeMove = async (row, col) => {
      if (board[row][col] !== null || winner.value) return

      const player = currentPlayer.value
      board[row][col] = player
      moves.value.push({ row, col, player })
      lastMoveTime.value = Date.now()

      // 播放落子音效
      const soundName = player === 'black' ? 'placeBlack' : 'placeWhite'
      soundManager.playSound(soundName)

      const gameWinner = checkWinner(row, col, player)
      if (gameWinner) {
        winner.value = gameWinner
        // 播放获胜音效
        setTimeout(() => soundManager.playSound('gameWin'), 200)
        return
      }

      currentPlayer.value = player === 'black' ? 'white' : 'black'

      // AI回合
      if (aiEnabled.value && currentPlayer.value === 'white' && !winner.value) {
        await nextTick()
        setTimeout(makeAIMove, 500)
      }
    }

    // 新游戏
    const newGame = () => {
      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          board[i][j] = null
        }
      }
      currentPlayer.value = 'black'
      winner.value = null
      moves.value = []
      winnerLine.value = []
    }

    // 悔棋
    const undoMove = () => {
      if (moves.value.length === 0) return

      // 播放悔棋音效
      soundManager.playSound('undoMove')

      const lastMove = moves.value.pop()
      board[lastMove.row][lastMove.col] = null
      currentPlayer.value = lastMove.player
      winner.value = null
      winnerLine.value = []

      // 如果是AI模式，再撤销一步AI的棋
      if (aiEnabled.value && moves.value.length > 0) {
        const aiMove = moves.value.pop()
        board[aiMove.row][aiMove.col] = null
      }
      
      lastMoveTime.value = Date.now()
    }

    // 获取当前游戏状态
    const getCurrentGameState = (): GameState => {
      return {
        board: board.map(row => [...row]),
        currentPlayer: currentPlayer.value,
        moves: [...moves.value],
        winner: winner.value,
        aiEnabled: aiEnabled.value,
        gameStartTime: gameStartTime.value,
        lastMoveTime: lastMoveTime.value,
        gameId: gameId.value
      }
    }

    // 从游戏状态恢复
    const restoreGameState = (gameState: GameState) => {
      // 清空当前棋盘
      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          board[i][j] = null
        }
      }

      // 恢复棋盘状态
      gameState.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          board[rowIndex][colIndex] = cell
        })
      })

      currentPlayer.value = gameState.currentPlayer
      winner.value = gameState.winner
      moves.value = [...gameState.moves]
      aiEnabled.value = gameState.aiEnabled
      gameStartTime.value = gameState.gameStartTime
      lastMoveTime.value = gameState.lastMoveTime
      gameId.value = gameState.gameId

      // 重新计算获胜线
      if (winner.value && moves.value.length > 0) {
        const lastMove = moves.value[moves.value.length - 1]
        checkWinner(lastMove.row, lastMove.col, winner.value)
      }
    }

    // 恢复自动存档
    const restoreAutoSave = () => {
      const autoSaveData = gameStorage.loadAutoSave()
      if (autoSaveData) {
        restoreGameState(autoSaveData)
        showAutoSaveRestore.value = false
        console.log('✅ 成功恢复自动存档')
      }
    }

    // 忽略自动存档
    const dismissAutoSave = () => {
      gameStorage.clearAutoSave()
      showAutoSaveRestore.value = false
      startNewGame()
    }

    // 开始新游戏（带初始化）
    const startNewGame = () => {
      // 播放开始游戏音效
      soundManager.playSound('gameStart')
      
      newGame()
      gameId.value = Date.now().toString(36) + Math.random().toString(36).substr(2)
      gameStartTime.value = Date.now()
      lastMoveTime.value = Date.now()
    }

    // 重写newGame函数
    const newGameWithInit = () => {
      if (moves.value.length > 0) {
        // 如果当前有游戏进行中，询问是否确认
        if (confirm('当前游戏尚未结束，确定要开始新游戏吗？')) {
          startNewGame()
        }
      } else {
        startNewGame()
      }
    }

    // 音效控制函数
    const toggleSound = () => {
      soundEnabled.value = !soundEnabled.value
      soundManager.setSoundEffectsEnabled(soundEnabled.value)
      // 播放按钮音效
      if (soundEnabled.value) {
        soundManager.playSound('buttonClick')
      }
    }

    const toggleBackgroundMusic = () => {
      backgroundMusicEnabled.value = !backgroundMusicEnabled.value
      soundManager.setBackgroundMusicEnabled(backgroundMusicEnabled.value)
      soundManager.playSound('buttonClick')
    }

    // 初始化音效设置
    const initAudioSettings = () => {
      const config = soundManager.getConfig()
      soundEnabled.value = config.soundEffects
      backgroundMusicEnabled.value = config.backgroundMusic
    }

    // 组件挂载时初始化
    onMounted(async () => {
      // 初始化音效系统
      initAudioSettings()
      
      // 用户首次交互后初始化音频（浏览器限制）
      const initAudio = async () => {
        await soundManager.preloadSounds()
        if (backgroundMusicEnabled.value) {
          setTimeout(() => soundManager.playBackgroundMusic(), 1000)
        }
        document.removeEventListener('click', initAudio)
        document.removeEventListener('touchstart', initAudio)
      }
      
      document.addEventListener('click', initAudio)
      document.addEventListener('touchstart', initAudio)

      // 检查是否有自动存档需要恢复
      if (gameStorage.hasAutoSave()) {
        showAutoSaveRestore.value = true
      } else {
        startNewGame()
      }

      // 启用自动保存
      gameStorage.enableAutoSave(getCurrentGameState, 15000) // 每15秒自动保存一次
    })

    // 组件卸载时清理
    onUnmounted(() => {
      gameStorage.disableAutoSave()
      soundManager.stopBackgroundMusic()
    })

    return {
      board,
      currentPlayer,
      winner,
      moves,
      aiEnabled,
      showAutoSaveRestore,
      soundEnabled,
      backgroundMusicEnabled,
      makeMove,
      newGame: newGameWithInit,
      undoMove,
      isWinnerCell,
      restoreAutoSave,
      dismissAutoSave,
      toggleSound,
      toggleBackgroundMusic
    }
  }
}
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.game-header {
  text-align: center;
  margin-bottom: 1rem;
}

.game-header h1 {
  color: white;
  font-size: 2rem;
  margin: 0 0 1rem 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.game-status {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1rem;
}

.status-item {
  background: rgba(255,255,255,0.9);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.label {
  font-weight: bold;
  color: #333;
}

.player {
  margin-left: 0.5rem;
  font-weight: bold;
}

.player.black { color: #333; }
.player.white { color: #666; }

.winner-announcement {
  background: linear-gradient(45deg, #ff6b6b, #feca57);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.game-board-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.board-wrapper {
  background: #8B4513;
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  border: 3px solid #654321;
}

.game-board {
  display: grid;
  grid-template-rows: repeat(15, 1fr);
  gap: 1px;
  background: #DEB887;
  border: 2px solid #8B4513;
  border-radius: 0.5rem;
  overflow: hidden;
}

.board-row {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 1px;
}

.board-cell {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #DEB887, #D2B48C);
  border: 1px solid #8B4513;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.board-cell:hover:not(.occupied) {
  background: linear-gradient(135deg, #F4E4BC, #E6D2A3);
  transform: scale(1.1);
  z-index: 1;
}

.board-cell.occupied {
  cursor: not-allowed;
}

.board-cell.winner {
  background: linear-gradient(135deg, #FFD700, #FFA500) !important;
  box-shadow: 0 0 10px rgba(255,215,0,0.8);
  animation: glow 1s ease-in-out infinite alternate;
}

@keyframes glow {
  from { box-shadow: 0 0 10px rgba(255,215,0,0.8); }
  to { box-shadow: 0 0 20px rgba(255,215,0,1); }
}

.piece {
  font-size: 16px;
  animation: placeStone 0.3s ease-out;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

@keyframes placeStone {
  0% {
    transform: scale(0) rotate(180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.game-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.btn-secondary {
  background: linear-gradient(45deg, #ffeaa7, #fab1a0);
  color: #333;
}

.ai-toggle {
  background: rgba(255,255,255,0.9);
  padding: 0.75rem 1rem;
  border-radius: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.ai-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: bold;
  color: #333;
}

.ai-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.sound-controls {
  display: flex;
  gap: 0.5rem;
}

.btn-sound,
.btn-music {
  background: rgba(255,255,255,0.8);
  color: #333;
  min-width: 80px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-sound.active,
.btn-music.active {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
}

.btn-sound:not(.active),
.btn-music:not(.active) {
  background: rgba(255,255,255,0.5);
  opacity: 0.7;
}

.btn-sound:hover,
.btn-music:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* 自动存档恢复弹窗 */
.auto-save-restore {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.restore-dialog {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.restore-dialog h3 {
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
}

.restore-dialog p {
  color: #666;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.restore-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.restore-actions .btn {
  min-width: 120px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .game-header h1 {
    font-size: 1.5rem;
  }
  
  .game-status {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .board-cell {
    width: 20px;
    height: 20px;
  }
  
  .piece {
    font-size: 14px;
  }
  
  .game-controls {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn {
    width: 100%;
    max-width: 200px;
  }

  .sound-controls {
    width: 100%;
    justify-content: center;
  }

  .btn-sound,
  .btn-music {
    flex: 1;
    max-width: 100px;
  }
}

@media (max-width: 480px) {
  .board-cell {
    width: 18px;
    height: 18px;
  }
  
  .piece {
    font-size: 12px;
  }
}
</style>