<template>
  <div class="tutorial-container">
    <header class="tutorial-header">
      <button @click="goBack" class="back-btn">
        ← 返回
      </button>
      <h1>? 游戏教程</h1>
    </header>

    <main class="tutorial-content">
      <nav class="tutorial-nav">
        <button 
          v-for="(section, index) in sections" 
          :key="index"
          :class="{ active: currentSection === index }"
          @click="currentSection = index"
          class="nav-btn"
        >
          {{ section.icon }} {{ section.title }}
        </button>
      </nav>

      <section class="tutorial-section">
        <component :is="sections[currentSection].component" />
      </section>

      <div class="tutorial-navigation">
        <button 
          @click="previousSection" 
          :disabled="currentSection === 0"
          class="nav-control-btn"
        >
          ? 上一节
        </button>
        <span class="progress-indicator">
          {{ currentSection + 1 }} / {{ sections.length }}
        </span>
        <button 
          @click="nextSection" 
          :disabled="currentSection === sections.length - 1"
          class="nav-control-btn"
        >
          下一节 ?
        </button>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { ref, defineComponent } from 'vue'
import { useRouter } from 'vue-router'

// 教程章节组件
const BasicRules = defineComponent({
  template: `
    <div class="section-content">
      <h2>? 五子棋基础规则</h2>
      
      <div class="rule-card">
        <h3>? 游戏目标</h3>
        <p>在15×15的棋盘上，率先在横、竖、斜任意一个方向连成5个同色棋子的玩家获胜。</p>
      </div>

      <div class="rule-card">
        <h3>? 游戏流程</h3>
        <ol>
          <li><strong>黑子先手</strong>：游戏开始时黑子先下</li>
          <li><strong>轮流落子</strong>：黑白双方轮流在棋盘上落子</li>
          <li><strong>不能悔棋</strong>：棋子落下后不能移动（本游戏支持悔棋功能）</li>
          <li><strong>胜负判定</strong>：先连成5子者获胜</li>
        </ol>
      </div>

      <div class="demo-board">
        <h3>? 示例棋局</h3>
        <div class="mini-board">
          <div class="board-row" v-for="row in 5" :key="row">
            <div 
              class="board-cell" 
              v-for="col in 5" 
              :key="col"
              :class="getCellClass(row, col)"
            >
              {{ getCellContent(row, col) }}
            </div>
          </div>
        </div>
        <p class="demo-description">
          上图展示了黑子在对角线上连成5子获胜的情况
        </p>
      </div>
    </div>
  `,
  setup() {
    const getCellClass = (row: number, col: number) => {
      if (row === col) return 'black-piece'
      return ''
    }
    
    const getCellContent = (row: number, col: number) => {
      if (row === col) return '?'
      return ''
    }
    
    return { getCellClass, getCellContent }
  }
})

const GameStrategy = defineComponent({
  template: `
    <div class="section-content">
      <h2>? 五子棋战术指南</h2>
      
      <div class="strategy-card">
        <h3>?? 基础战术</h3>
        <ul>
          <li><strong>活三</strong>：两端都没有被堵死的三连珠，威胁性很大</li>
          <li><strong>冲四</strong>：一端被堵死的四连珠，对方必须应对</li>
          <li><strong>活四</strong>：两端都可以成五的四连珠，必胜棋型</li>
          <li><strong>双三</strong>：同时形成两个活三，对方无法同时防守</li>
        </ul>
      </div>

      <div class="strategy-card">
        <h3>? 进攻策略</h3>
        <ol>
          <li><strong>抢占中心</strong>：开局尽量占据棋盘中心位置</li>
          <li><strong>多线攻击</strong>：同时在多个方向形成威胁</li>
          <li><strong>制造双杀</strong>：创造对手无法同时防守的局面</li>
          <li><strong>连续冲四</strong>：连续制造冲四威胁直至获胜</li>
        </ol>
      </div>

      <div class="strategy-card">
        <h3>?? 防守要点</h3>
        <ul>
          <li><strong>优先防守活三</strong>：阻止对手形成活四</li>
          <li><strong>关键点位</strong>：占据对手必争之地</li>
          <li><strong>反击机会</strong>：防守的同时寻找反击机会</li>
          <li><strong>全局观念</strong>：不要只看局部，要考虑整体局面</li>
        </ul>
      </div>
    </div>
  `
})

const AIGuide = defineComponent({
  template: `
    <div class="section-content">
      <h2>? AI对战指南</h2>
      
      <div class="ai-card">
        <h3>?? 难度等级说明</h3>
        <div class="difficulty-levels">
          <div class="level-item">
            <span class="level-icon">?</span>
            <div class="level-info">
              <h4>简单</h4>
              <p>2层搜索深度，适合新手练习基础技巧</p>
            </div>
          </div>
          <div class="level-item">
            <span class="level-icon">?</span>
            <div class="level-info">
              <h4>中等</h4>
              <p>4层搜索深度，具备基本战术意识</p>
            </div>
          </div>
          <div class="level-item">
            <span class="level-icon">?</span>
            <div class="level-info">
              <h4>困难</h4>
              <p>6层搜索深度，能够进行中长期规划</p>
            </div>
          </div>
          <div class="level-item">
            <span class="level-icon">?</span>
            <div class="level-info">
              <h4>专家</h4>
              <p>8层搜索深度，具备高级战术水平</p>
            </div>
          </div>
          <div class="level-item">
            <span class="level-icon">?</span>
            <div class="level-info">
              <h4>大师</h4>
              <p>10层搜索深度，接近职业水平</p>
            </div>
          </div>
        </div>
      </div>

      <div class="ai-card">
        <h3>? 对战建议</h3>
        <ul>
          <li><strong>循序渐进</strong>：从简单难度开始，逐步提升</li>
          <li><strong>学习AI思路</strong>：观察AI的落子选择，学习其战术</li>
          <li><strong>分析失误</strong>：败局后分析关键失误点</li>
          <li><strong>多尝试开局</strong>：尝试不同的开局方式</li>
        </ul>
      </div>

      <div class="ai-card">
        <h3>? AI特色功能</h3>
        <ul>
          <li><strong>思考时间显示</strong>：查看AI的计算时间</li>
          <li><strong>搜索节点统计</strong>：了解AI的搜索深度</li>
          <li><strong>威胁检测</strong>：AI能识别各种棋型威胁</li>
          <li><strong>开局库</strong>：AI具备专业开局知识</li>
        </ul>
      </div>
    </div>
  `
})

const GameFeatures = defineComponent({
  template: `
    <div class="section-content">
      <h2>? 功能使用说明</h2>
      
      <div class="feature-card">
        <h3>? 游戏控制</h3>
        <div class="feature-grid">
          <div class="feature-item">
            <span class="feature-icon">?</span>
            <div>
              <h4>新游戏</h4>
              <p>重新开始一局游戏，清空棋盘</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">?</span>
            <div>
              <h4>悔棋</h4>
              <p>撤销上一步操作（AI模式会撤销两步）</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">?</span>
            <div>
              <h4>AI开关</h4>
              <p>切换AI对战模式和双人模式</p>
            </div>
          </div>
        </div>
      </div>

      <div class="feature-card">
        <h3>? 音效系统</h3>
        <div class="feature-grid">
          <div class="feature-item">
            <span class="feature-icon">?</span>
            <div>
              <h4>音效开关</h4>
              <p>控制落子音效、胜利音效等</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">?</span>
            <div>
              <h4>背景音乐</h4>
              <p>播放舒缓的背景音乐</p>
            </div>
          </div>
        </div>
      </div>

      <div class="feature-card">
        <h3>? 存档系统</h3>
        <div class="feature-grid">
          <div class="feature-item">
            <span class="feature-icon">?</span>
            <div>
              <h4>自动保存</h4>
              <p>每15秒自动保存游戏进度</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">?</span>
            <div>
              <h4>恢复游戏</h4>
              <p>刷新页面后可恢复未完成的游戏</p>
            </div>
          </div>
        </div>
      </div>

      <div class="feature-card">
        <h3>? PWA功能</h3>
        <div class="feature-grid">
          <div class="feature-item">
            <span class="feature-icon">?</span>
            <div>
              <h4>安装应用</h4>
              <p>可安装到桌面，像原生应用一样使用</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">?</span>
            <div>
              <h4>离线游戏</h4>
              <p>断网情况下也可以正常游戏</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})

export default {
  name: 'TutorialView',
  components: {
    BasicRules,
    GameStrategy,
    AIGuide,
    GameFeatures
  },
  setup() {
    const router = useRouter()
    const currentSection = ref(0)
    
    const sections = [
      { title: '基础规则', icon: '?', component: 'BasicRules' },
      { title: '战术指南', icon: '?', component: 'GameStrategy' },
      { title: 'AI对战', icon: '?', component: 'AIGuide' },
      { title: '功能说明', icon: '?', component: 'GameFeatures' }
    ]
    
    const goBack = () => {
      router.back()
    }
    
    const previousSection = () => {
      if (currentSection.value > 0) {
        currentSection.value--
      }
    }
    
    const nextSection = () => {
      if (currentSection.value < sections.length - 1) {
        currentSection.value++
      }
    }
    
    return {
      currentSection,
      sections,
      goBack,
      previousSection,
      nextSection
    }
  }
}
</script>

<style scoped>
.tutorial-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tutorial-header {
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

.tutorial-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.tutorial-content {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.tutorial-nav {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 25px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.nav-btn.active {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  color: #ffd700;
  font-weight: bold;
}

.tutorial-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  min-height: 400px;
}

.section-content h2 {
  margin: 0 0 1.5rem 0;
  color: #ffd700;
  text-align: center;
}

.rule-card,
.strategy-card,
.ai-card,
.feature-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.rule-card h3,
.strategy-card h3,
.ai-card h3,
.feature-card h3 {
  margin: 0 0 1rem 0;
  color: #ffd700;
}

.rule-card ol,
.strategy-card ol,
.rule-card ul,
.strategy-card ul,
.ai-card ul {
  padding-left: 1.5rem;
}

.rule-card li,
.strategy-card li,
.ai-card li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.demo-board {
  text-align: center;
  margin-top: 2rem;
}

.mini-board {
  display: inline-grid;
  grid-template-rows: repeat(5, 30px);
  gap: 1px;
  background: #8B4513;
  border: 2px solid #654321;
  border-radius: 8px;
  padding: 5px;
  margin: 1rem 0;
}

.board-row {
  display: grid;
  grid-template-columns: repeat(5, 30px);
  gap: 1px;
}

.board-cell {
  width: 30px;
  height: 30px;
  background: #D2691E;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.board-cell.black-piece {
  background: rgba(255, 215, 0, 0.3);
}

.demo-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

.difficulty-levels {
  display: grid;
  gap: 1rem;
}

.level-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.level-icon {
  font-size: 2rem;
}

.level-info h4 {
  margin: 0 0 0.25rem 0;
  color: #ffd700;
}

.level-info p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.feature-grid {
  display: grid;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.feature-icon {
  font-size: 1.5rem;
}

.feature-item h4 {
  margin: 0 0 0.25rem 0;
  color: #ffd700;
}

.feature-item p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

.tutorial-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1rem 2rem;
}

.nav-control-btn {
  background: rgba(255, 215, 0, 0.8);
  border: none;
  color: #333;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
}

.nav-control-btn:hover:not(:disabled) {
  background: #ffd700;
  transform: translateY(-2px);
}

.nav-control-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
}

.progress-indicator {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 15px;
  font-weight: bold;
  color: #ffd700;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .tutorial-content {
    padding: 0.5rem;
  }
  
  .tutorial-section {
    padding: 1rem;
  }
  
  .tutorial-navigation {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
  
  .level-item,
  .feature-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>