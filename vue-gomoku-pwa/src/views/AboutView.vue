<template>
  <div class="game-container">
    <header class="game-header">
      <h1>? 五子棋 PWA</h1>
      <p>享受智能对战的乐趣</p>
    </header>
    
    <main class="game-main">
      <div class="board-container">
        <GameBoard />
      </div>
      
      <aside class="controls-container">
        <GameControls />
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import GameBoard from '@/components/game/GameBoard.vue'
import GameControls from '@/components/game/GameControls.vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

onMounted(() => {
  gameStore.initializeBoard()
})
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.game-header {
  text-align: center;
  color: white;
  margin-bottom: 20px;
}

.game-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.game-header p {
  margin: 8px 0 0 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.game-main {
  display: flex;
  gap: 20px;
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.board-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.controls-container {
  flex-shrink: 0;
  width: 250px;
  display: flex;
  align-items: flex-start;
}

/* 移动端响应式布局 */
@media (max-width: 768px) {
  .game-container {
    padding: 12px;
  }

  .game-header h1 {
    font-size: 2rem;
  }

  .game-main {
    flex-direction: column;
    gap: 16px;
  }

  .controls-container {
    width: 100%;
    order: 1;
  }

  .board-container {
    order: 2;
  }
}

@media (max-width: 480px) {
  .game-container {
    padding: 8px;
  }

  .game-header h1 {
    font-size: 1.5rem;
  }

  .game-header p {
    font-size: 1rem;
  }
}
</style>
