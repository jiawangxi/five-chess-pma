<template>
  <div class="game-board" @click="handleBoardClick" ref="boardRef">
    <div 
      v-for="(row, rowIndex) in gameStore.gameState.board"
      :key="rowIndex"
      class="board-row"
    >
      <div
        v-for="(cell, colIndex) in row"
        :key="colIndex"
        class="board-cell"
        :class="{
          'has-piece': cell !== PieceType.Empty,
          'highlight': isHighlighted(rowIndex, colIndex)
        }"
        @click="() => handleCellClick(rowIndex, colIndex)"
      >
        <div
          v-if="cell !== PieceType.Empty"
          class="piece"
          :class="{
            'black': cell === PieceType.Black,
            'white': cell === PieceType.White
          }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { PieceType } from '@/types/game'

const gameStore = useGameStore()
const boardRef = ref<HTMLElement>()
const highlightedPosition = ref<{ row: number; col: number } | null>(null)

const handleCellClick = (row: number, col: number) => {
  if (gameStore.makeMove({ row, col })) {
    highlightedPosition.value = { row, col }
    setTimeout(() => {
      highlightedPosition.value = null
    }, 500)
  }
}

const handleBoardClick = (event: MouseEvent) => {
  // 阻止事件冒泡
  event.stopPropagation()
}

const isHighlighted = (row: number, col: number) => {
  return highlightedPosition.value?.row === row && highlightedPosition.value?.col === col
}
</script>

<style scoped>
.game-board {
  display: grid;
  grid-template-rows: repeat(15, 1fr);
  gap: 0;
  background: linear-gradient(135deg, #d4af37, #ffd700);
  border: 3px solid #8b4513;
  border-radius: 8px;
  padding: 10px;
  aspect-ratio: 1;
  max-width: min(90vw, 90vh);
  margin: 0 auto;
  position: relative;
}

.board-row {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  gap: 0;
}

.board-cell {
  aspect-ratio: 1;
  border: 1px solid #8b4513;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
}

.board-cell:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.board-cell.highlight {
  background-color: rgba(255, 0, 0, 0.3);
  animation: pulse 0.5s ease-in-out;
}

.piece {
  width: 80%;
  height: 80%;
  border-radius: 50%;
  border: 2px solid #333;
  position: absolute;
  transition: all 0.3s ease;
  transform: scale(0);
  animation: dropIn 0.3s ease forwards;
}

.piece.black {
  background: radial-gradient(circle at 30% 30%, #666, #000);
  border-color: #333;
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, #ddd);
  border-color: #999;
}

@keyframes dropIn {
  from {
    transform: scale(0) translateY(-20px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% { 
    background-color: rgba(255, 0, 0, 0.3); 
  }
  50% { 
    background-color: rgba(255, 0, 0, 0.6); 
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .game-board {
    max-width: 95vw;
    padding: 5px;
  }
  
  .board-cell {
    min-height: 15px;
  }
}

@media (max-width: 480px) {
  .game-board {
    max-width: 98vw;
    padding: 3px;
  }
  
  .board-cell {
    min-height: 12px;
  }
  
  .piece {
    width: 85%;
    height: 85%;
  }
}
</style>