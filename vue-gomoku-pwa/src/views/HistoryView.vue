<template>
  <div class="history-container">
    <header class="history-header">
      <button @click="goBack" class="back-btn">
        ← 返回
      </button>
      <h1>? 游戏记录</h1>
    </header>

    <main class="history-content">
      <div v-if="gameHistory.length === 0" class="empty-state">
        <div class="empty-icon">?</div>
        <h2>暂无游戏记录</h2>
        <p>开始游戏后，历史记录会出现在这里</p>
        <button @click="startNewGame" class="start-game-btn">
          ? 开始新游戏
        </button>
      </div>

      <div v-else class="history-list">
        <div class="history-stats">
          <div class="stat-item">
            <span class="stat-value">{{ totalGames }}</span>
            <span class="stat-label">总局数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ winRate }}%</span>
            <span class="stat-label">胜率</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ avgGameTime }}</span>
            <span class="stat-label">平均时长</span>
          </div>
        </div>

        <div class="filter-controls">
          <select v-model="filterType" class="filter-select">
            <option value="all">全部记录</option>
            <option value="win">胜利记录</option>
            <option value="lose">失败记录</option>
            <option value="ai">AI对战</option>
            <option value="human">人人对战</option>
          </select>
          <button @click="clearHistory" class="clear-btn">
            ?? 清空记录
          </button>
        </div>

        <div class="history-items">
          <div 
            v-for="(game, index) in filteredHistory" 
            :key="game.id"
            class="history-item"
            @click="viewGameDetail(game)"
          >
            <div class="game-info">
              <div class="game-result">
                <span :class="['result-badge', game.result]">
                  {{ getResultText(game.result) }}
                </span>
              </div>
              <div class="game-meta">
                <span class="game-mode">{{ game.mode }}</span>
                <span class="game-time">{{ formatDate(game.endTime) }}</span>
              </div>
            </div>
            <div class="game-stats">
              <div class="stat">
                <span class="stat-number">{{ game.moves }}</span>
                <span class="stat-unit">手</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ formatDuration(game.duration) }}</span>
                <span class="stat-unit">用时</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface GameRecord {
  id: string
  result: 'win' | 'lose' | 'draw'
  mode: 'AI对战' | '人人对战'
  moves: number
  duration: number
  startTime: number
  endTime: number
  difficulty?: string
}

export default {
  name: 'HistoryView',
  setup() {
    const router = useRouter()
    const gameHistory = ref<GameRecord[]>([])
    const filterType = ref('all')

    // 模拟游戏记录数据（实际项目中应从存储加载）
    const loadGameHistory = () => {
      // 这里应该从 IndexedDB 或其他存储加载真实数据
      gameHistory.value = [
        {
          id: '1',
          result: 'win',
          mode: 'AI对战',
          moves: 87,
          duration: 480000, // 8分钟
          startTime: Date.now() - 86400000,
          endTime: Date.now() - 86400000 + 480000,
          difficulty: '困难'
        },
        {
          id: '2',
          result: 'lose',
          mode: 'AI对战',
          moves: 56,
          duration: 320000, // 5分20秒
          startTime: Date.now() - 172800000,
          endTime: Date.now() - 172800000 + 320000,
          difficulty: '专家'
        }
        // 更多记录...
      ]
    }

    // 过滤后的历史记录
    const filteredHistory = computed(() => {
      if (filterType.value === 'all') {
        return gameHistory.value
      }
      
      return gameHistory.value.filter(game => {
        switch (filterType.value) {
          case 'win':
            return game.result === 'win'
          case 'lose':
            return game.result === 'lose'
          case 'ai':
            return game.mode === 'AI对战'
          case 'human':
            return game.mode === '人人对战'
          default:
            return true
        }
      })
    })

    // 统计数据
    const totalGames = computed(() => gameHistory.value.length)
    
    const winRate = computed(() => {
      if (totalGames.value === 0) return 0
      const wins = gameHistory.value.filter(g => g.result === 'win').length
      return Math.round((wins / totalGames.value) * 100)
    })
    
    const avgGameTime = computed(() => {
      if (totalGames.value === 0) return '0分钟'
      const totalTime = gameHistory.value.reduce((sum, g) => sum + g.duration, 0)
      const avgMinutes = Math.round(totalTime / totalGames.value / 60000)
      return `${avgMinutes}分钟`
    })

    // 格式化日期
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        return '今天 ' + date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } else if (days === 1) {
        return '昨天'
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return date.toLocaleDateString('zh-CN')
      }
    }

    // 格式化游戏时长
    const formatDuration = (ms: number) => {
      const minutes = Math.floor(ms / 60000)
      const seconds = Math.floor((ms % 60000) / 1000)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // 获取结果文本
    const getResultText = (result: string) => {
      switch (result) {
        case 'win': return '胜利'
        case 'lose': return '失败'
        case 'draw': return '平局'
        default: return '未知'
      }
    }

    // 查看游戏详情
    const viewGameDetail = (game: GameRecord) => {
      // 这里可以打开游戏回放界面
      console.log('查看游戏详情:', game)
    }

    // 清空历史记录
    const clearHistory = () => {
      if (confirm('确定要清空所有游戏记录吗？此操作无法撤销。')) {
        gameHistory.value = []
      }
    }

    // 开始新游戏
    const startNewGame = () => {
      router.push('/')
    }

    // 返回上一页
    const goBack = () => {
      router.back()
    }

    onMounted(() => {
      loadGameHistory()
    })

    return {
      gameHistory,
      filterType,
      filteredHistory,
      totalGames,
      winRate,
      avgGameTime,
      formatDate,
      formatDuration,
      getResultText,
      viewGameDetail,
      clearHistory,
      startNewGame,
      goBack
    }
  }
}
</script>

<style scoped>
.history-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.history-header {
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

.history-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.history-content {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  margin: 0 0 1rem 0;
  color: #ffd700;
}

.empty-state p {
  margin: 0 0 2rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.start-game-btn {
  background: rgba(255, 215, 0, 0.8);
  border: none;
  color: #333;
  padding: 1rem 2rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1rem;
  transition: all 0.2s ease;
}

.start-game-btn:hover {
  background: #ffd700;
  transform: translateY(-2px);
}

.history-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.filter-select {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.filter-select option {
  background: #333;
  color: white;
}

.clear-btn {
  background: rgba(244, 67, 54, 0.8);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: #f44336;
}

.history-items {
  display: grid;
  gap: 1rem;
}

.history-item {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.game-info {
  flex: 1;
}

.game-result {
  margin-bottom: 0.5rem;
}

.result-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
}

.result-badge.win {
  background: rgba(76, 175, 80, 0.8);
  color: white;
}

.result-badge.lose {
  background: rgba(244, 67, 54, 0.8);
  color: white;
}

.result-badge.draw {
  background: rgba(158, 158, 158, 0.8);
  color: white;
}

.game-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.game-stats {
  display: flex;
  gap: 1.5rem;
  text-align: center;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-weight: bold;
  color: #ffd700;
}

.stat-unit {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .history-content {
    padding: 0.5rem;
  }
  
  .history-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .game-stats {
    justify-content: space-around;
    width: 100%;
  }
}
</style>