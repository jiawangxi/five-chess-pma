<template>
  <div class="game-container">
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
    </footer>
  </div>
</template>

<script>
import { ref, reactive, nextTick } from 'vue'

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
      
      board[row][col] = currentPlayer.value
      moves.value.push({ row, col, player: currentPlayer.value })

      const gameWinner = checkWinner(row, col, currentPlayer.value)
      if (gameWinner) {
        winner.value = gameWinner
        return
      }

      currentPlayer.value = currentPlayer.value === 'black' ? 'white' : 'black'
    }

    // 玩家下棋
    const makeMove = async (row, col) => {
      if (board[row][col] !== null || winner.value) return

      board[row][col] = currentPlayer.value
      moves.value.push({ row, col, player: currentPlayer.value })

      const gameWinner = checkWinner(row, col, currentPlayer.value)
      if (gameWinner) {
        winner.value = gameWinner
        return
      }

      currentPlayer.value = currentPlayer.value === 'black' ? 'white' : 'black'

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
    }

    return {
      board,
      currentPlayer,
      winner,
      moves,
      aiEnabled,
      makeMove,
      newGame,
      undoMove,
      isWinnerCell
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