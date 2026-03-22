<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-icon">?</div>
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-message">
        抱歉，您要访问的页面不存在或已被移动。
      </p>
      
      <div class="suggestion-links">
        <router-link to="/" class="suggestion-btn primary">
          ? 返回首页
        </router-link>
        <router-link to="/tutorial" class="suggestion-btn secondary">
          ? 游戏教程
        </router-link>
        <router-link to="/settings" class="suggestion-btn secondary">
          ? 游戏设置
        </router-link>
      </div>
      
      <div class="go-back-section">
        <button @click="goBack" class="go-back-btn">
          ← 返回上一页
        </button>
      </div>
    </div>
    
    <!-- 装饰性棋盘背景 -->
    <div class="decorative-board">
      <div 
        v-for="row in 8" 
        :key="row"
        class="board-row"
      >
        <div
          v-for="col in 8"
          :key="col" 
          class="board-cell"
          :class="{ 'has-piece': shouldShowPiece(row, col) }"
        >
          <span v-if="shouldShowPiece(row, col)" class="piece">
            {{ getPieceType(row, col) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { useRouter } from 'vue-router'

export default {
  name: 'NotFoundView',
  setup() {
    const router = useRouter()
    
    // 返回上一页
    const goBack = () => {
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push('/')
      }
    }
    
    // 装饰性棋盘逻辑
    const shouldShowPiece = (row: number, col: number) => {
      // 创建一个简单的棋局图案
      const pattern = [
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 0, 2, 2, 0, 1, 0],
        [1, 0, 2, 0, 0, 2, 0, 1],
        [1, 0, 2, 0, 0, 2, 0, 1],
        [0, 1, 0, 2, 2, 0, 1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0]
      ]
      return pattern[row - 1][col - 1] !== 0
    }
    
    const getPieceType = (row: number, col: number) => {
      const pattern = [
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 0, 2, 2, 0, 1, 0],
        [1, 0, 2, 0, 0, 2, 0, 1],
        [1, 0, 2, 0, 0, 2, 0, 1],
        [0, 1, 0, 2, 2, 0, 1, 0],
        [0, 0, 1, 0, 0, 1, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0]
      ]
      return pattern[row - 1][col - 1] === 1 ? '?' : '?'
    }
    
    return {
      goBack,
      shouldShowPiece,
      getPieceType
    }
  }
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.not-found-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem 2rem;
  text-align: center;
  max-width: 500px;
  width: 100%;
  color: white;
  position: relative;
  z-index: 10;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
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

.error-code {
  font-size: 5rem;
  font-weight: bold;
  margin: 0;
  background: linear-gradient(45deg, #ffd700, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.error-title {
  font-size: 2rem;
  margin: 1rem 0;
  color: #ffd700;
}

.error-message {
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.suggestion-links {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.suggestion-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.2s ease;
  display: block;
}

.suggestion-btn.primary {
  background: rgba(255, 215, 0, 0.8);
  color: #333;
}

.suggestion-btn.primary:hover {
  background: #ffd700;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.suggestion-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.suggestion-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.go-back-section {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 1.5rem;
}

.go-back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.go-back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* 装饰性棋盘背景 */
.decorative-board {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(15deg);
  opacity: 0.1;
  z-index: 1;
  display: grid;
  grid-template-rows: repeat(8, 40px);
  gap: 2px;
  background: rgba(139, 69, 19, 0.3);
  border-radius: 10px;
  padding: 10px;
}

.board-row {
  display: grid;
  grid-template-columns: repeat(8, 40px);
  gap: 2px;
}

.board-cell {
  width: 40px;
  height: 40px;
  background: rgba(210, 105, 30, 0.5);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.piece {
  font-size: 24px;
  animation: fadeIn 1s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0); }
  to { opacity: 1; transform: scale(1); }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .not-found-container {
    padding: 1rem;
  }
  
  .not-found-content {
    padding: 2rem 1rem;
  }
  
  .error-code {
    font-size: 4rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .suggestion-links {
    gap: 0.5rem;
  }
  
  .decorative-board {
    transform: translate(-50%, -50%) rotate(15deg) scale(0.7);
  }
}

@media (max-width: 480px) {
  .error-code {
    font-size: 3rem;
  }
  
  .error-title {
    font-size: 1.2rem;
  }
  
  .error-message {
    font-size: 1rem;
  }
  
  .decorative-board {
    transform: translate(-50%, -50%) rotate(15deg) scale(0.5);
  }
}

/* 响应式网格 */
@media (min-width: 768px) {
  .suggestion-links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .suggestion-btn.primary {
    grid-column: 1 / -1;
  }
}
</style>