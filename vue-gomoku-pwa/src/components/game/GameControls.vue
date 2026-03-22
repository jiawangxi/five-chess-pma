<template>
  <div class="game-controls">
    <div class="game-info">
      <div class="current-player">
        <span class="label">当前玩家:</span>
        <div class="player-indicator" :class="{ 'black': currentPlayer === PieceType.Black, 'white': currentPlayer === PieceType.White }">
          {{ currentPlayer === PieceType.Black ? '黑棋' : '白棋' }}
        </div>
      </div>
      
      <div class="game-status" v-if="gameStatus !== GameStatus.Playing">
        <span class="status-text" :class="statusClass">
          {{ statusText }}
        </span>
      </div>
    </div>

    <div class="control-buttons">
      <button @click="handleNewGame" class="btn btn-primary">
        ? 新游戏
      </button>
      
      <button @click="handleUndo" class="btn btn-secondary" :disabled="!canUndo">
        ? 悔棋
      </button>
      
      <button @click="handleAIMove" class="btn btn-secondary" :disabled="isAIThinking || gameStatus !== GameStatus.Playing">
        ? AI 提示
      </button>
    </div>

    <div class="game-stats">
      <div class="stat-item">
        <span class="stat-label">步数:</span>
        <span class="stat-value">{{ totalMoves }}</span>
      </div>
    </div>

    <div v-if="isAIThinking" class="ai-thinking">
      <div class="thinking-animation">?</div>
      <span>AI 思考中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { PieceType, GameStatus } from '@/types/game'
import { GomokuAI } from '@/utils/ai'
import { AILevel, AI_CONFIGS } from '@/types/ai'

const gameStore = useGameStore()
const isAIThinking = ref(false)

const currentPlayer = computed(() => gameStore.gameState.currentPlayer)
const gameStatus = computed(() => gameStore.gameState.status)
const totalMoves = computed(() => gameStore.gameState.moves.length)
const canUndo = computed(() => gameStore.gameState.moves.length > 0)

const statusText = computed(() => {
  switch (gameStatus.value) {
    case GameStatus.BlackWin:
      return '? 黑棋获胜！'
    case GameStatus.WhiteWin:
      return '? 白棋获胜！'
    case GameStatus.Draw:
      return '? 平局！'
    default:
      return ''
  }
})

const statusClass = computed(() => {
  switch (gameStatus.value) {
    case GameStatus.BlackWin:
      return 'win-black'
    case GameStatus.WhiteWin:
      return 'win-white'
    case GameStatus.Draw:
      return 'draw'
    default:
      return ''
  }
})

const handleNewGame = () => {
  gameStore.resetGame()
}

const handleUndo = () => {
  gameStore.undoMove()
}

const handleAIMove = async () => {
  if (isAIThinking.value) return
  
  isAIThinking.value = true
  
  try {
    const ai = new GomokuAI(AI_CONFIGS[AILevel.Medium])
    const aiMove = await ai.getBestMove(
      gameStore.gameState.board.map(row => [...row]), // 复制数组
      gameStore.gameState.currentPlayer
    )
    
    gameStore.makeMove(aiMove)
  } catch (error) {
    console.error('AI 计算错误:', error)
  } finally {
    isAIThinking.value = false
  }
}
</script>

<style scoped>
.game-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  min-width: 200px;
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.current-player {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.player-indicator {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
}

.player-indicator.black {
  background: linear-gradient(135deg, #333, #000);
  color: white;
}

.player-indicator.white {
  background: linear-gradient(135deg, #fff, #ddd);
  color: #333;
  border: 1px solid #ccc;
}

.game-status {
  text-align: center;
  font-weight: bold;
  font-size: 16px;
}

.status-text.win-black {
  color: #333;
}

.status-text.win-white {
  color: #666;
}

.status-text.draw {
  color: #888;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.btn-secondary {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
}

.game-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #333;
}

.ai-thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(33, 150, 243, 0.1);
  border-radius: 8px;
  font-size: 14px;
  color: #1976D2;
}

.thinking-animation {
  font-size: 18px;
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .game-controls {
    min-width: auto;
    width: 100%;
  }
  
  .control-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .btn {
    flex: 1;
    min-width: 100px;
  }
}
</style>