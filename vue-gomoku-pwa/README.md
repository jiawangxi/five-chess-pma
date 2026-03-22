# ? 五子棋大师 - 智能AI对战游戏

[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-FF6B35.svg)](https://web.dev/progressive-web-apps/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg)](https://vitejs.dev/)

一款现代化的五子棋PWA游戏，采用Vue 3 + TypeScript开发，支持AI对战、离线游戏、自动保存等功能。

## ? 特色功能

### ? 智能AI引擎
- **5级难度系统**: 简单 → 中等 → 困难 → 专家 → 大师
- **Minimax算法**: 采用Alpha-Beta剪枝优化
- **威胁检测**: 智能识别活四、冲四、活三等棋型
- **置换表缓存**: 提高AI搜索效率
- **开局库**: 天元开局及优势位置

### ? 沉浸式音效
- **程序化音效**: 基于Web Audio API无需外部文件
- **差异化音调**: 黑棋低沉、白棋清脆
- **胜利音效**: 上行三和弦庆祝
- **背景音乐**: C大调循环旋律
- **音效控制**: 可独立开关音效和音乐

### ? 智能存档系统
- **自动保存**: 每15秒自动备份游戏进度
- **断线恢复**: 刷新页面后可恢复未完成游戏
- **多槽存档**: 支持10个存档位（未来功能）
- **本地存储**: 基于LocalStorage，无需网络

### ? PWA应用体验
- **离线游戏**: Service Worker支持断网游戏
- **桌面安装**: 可安装到桌面和移动设备
- **响应式设计**: 适配手机、平板、桌面
- **原生手感**: 接近原生应用的用户体验

## ? 游戏截图

```
? 五子棋大师
┌─────────────────────┐
│ 当前玩家: ? 黑子      │
│ ? AI思考中...       │
├─────────────────────┤
│ · · · · · · · · · · │
│ · · · ? · · · · · · │
│ · · · · ? · · · · · │
│ · · · · · ? · · · · │
│ · · · · · · · · · · │
├─────────────────────┤
│ ?新游戏 ?悔棋 ?AI │
│ ?音效 ?音乐       │
│ AI难度: ? 大师      │
└─────────────────────┘
```

## ? 快速开始

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 安装依赖
```bash
git clone [repository-url]
cd vue-gomoku-pwa
npm install
```

### 开发运行
```bash
npm run dev
```
访问 `http://localhost:5173`

### 生产构建
```bash
npm run build
npm run preview
```

### 类型检查
```bash
npm run type-check
```

## ? 项目结构

```
vue-gomoku-pwa/
├── public/              # 静态资源
│   ├── manifest.json    # PWA配置清单
│   └── sw.js           # Service Worker
├── src/
│   ├── components/     # Vue组件
│   ├── views/          # 页面组件
│   │   └── HomeView.vue # 主游戏界面
│   ├── utils/          # 工具模块
│   │   ├── optimizedAI.ts    # AI引擎
│   │   ├── soundManager.ts   # 音效系统
│   │   └── gameStorage.ts    # 存档管理
│   ├── router/         # 路由配置
│   └── assets/         # 资源文件
├── openspec/           # 项目规格文档
└── package.json
```

## ? 技术架构

### 前端框架
- **Vue 3**: Composition API + `<script setup>`
- **TypeScript**: 完整类型安全保障
- **Vite**: 快速构建工具
- **Vue Router**: 单页应用路由

### AI算法
- **搜索算法**: Minimax + Alpha-Beta剪枝
- **评估函数**: 基于五子棋棋型评分
- **优化策略**: 迭代加深 + 置换表
- **候选生成**: 威胁优先搜索

### 音效技术
- **Web Audio API**: 程序化音效生成
- **DTMF音调**: 基于电话音调的和谐音效
- **动态合成**: 运行时生成，无外部依赖
- **音量控制**: 主音量 + 独立音效控制

### 存储方案
- **LocalStorage**: 游戏状态持久化
- **自动保存**: 定时备份机制
- **数据压缩**: JSON序列化优化

## ? 游戏规则

### 基础规则
1. **棋盘**: 15×15格子，黑子先手
2. **胜利条件**: 横、竖、斜任一方向连成5子
3. **禁手**: 本游戏无禁手规则，自由下棋

### AI难度说明
- **? 简单**: 2层搜索，适合新手
- **? 中等**: 4层搜索，基础策略
- **? 困难**: 6层搜索，良好棋力
- **? 专家**: 8层搜索，高级对局
- **? 大师**: 10层搜索，最强水平

## ? 音效设计

### 音效列表
- **黑棋落子**: 523.25Hz (C5) - 沉稳音调
- **白棋落子**: 783.99Hz (G5) - 清脆音调  
- **游戏胜利**: C-E-G三和弦上行
- **悔棋操作**: E-C下行音阶
- **按钮点击**: 800Hz方波短音
- **背景音乐**: C大调音阶循环

### 技术特点
- ? **和谐音律**: 基于音乐理论设计
- ? **程序生成**: 无需音频文件
- ? **零依赖**: 减小应用体积
- ?? **实时调节**: 音调和音量可调

## ? AI性能指标

| 难度等级 | 搜索深度 | 思考时间 | 棋力水平 | 适合人群 |
|---------|----------|----------|----------|----------|
| 简单    | 2层      | <0.5s    | 入门     | 初学者   |
| 中等    | 4层      | <2s      | 业余1级  | 休闲玩家 |
| 困难    | 6层      | <4s      | 业余3级  | 进阶玩家 |
| 专家    | 8层      | <8s      | 业余5级  | 高手对局 |
| 大师    | 10层     | <12s     | 准职业   | 挑战极限 |

## ?? 开发指南

### 添加新音效
```typescript
// 在 soundManager.ts 中添加配置
soundConfig: {
  newSound: {
    frequency: 440,        // 音调频率
    duration: 0.2,         // 持续时间
    type: 'sine',          // 波形类型
    volume: 0.5            // 音量大小
  }
}

// 播放音效
soundManager.playSound('newSound', {
  pitch: 1.2,              // 音调调节
  volume: 0.8              // 音量调节
})
```

### 调整AI参数
```typescript
// 在 optimizedAI.ts 中修改配置
constructor(difficulty: AIDifficulty) {
  const configs = {
    custom: {
      maxDepth: 8,          // 搜索深度
      maxThinkTime: 5000,   // 思考时间限制(ms)
      enableOpening: true,  // 开启开局库
      randomFactor: 0.1     // 随机因子
    }
  }
}
```

### 扩展存档功能
```typescript
// 在 gameStorage.ts 中添加方法
saveToCloud(gameState: GameState) {
  // 实现云端存档
}

loadFromCloud(): Promise<GameState> {
  // 实现云端加载
}
```

## ? 性能优化

### 构建优化
- **代码分割**: AI引擎独立打包
- **Tree Shaking**: 移除未使用代码
- **压缩优化**: Gzip压缩减小体积
- **懒加载**: 按需加载组件

### 运行时优化
- **置换表**: 缓存搜索结果
- **剪枝算法**: 减少搜索节点
- **候选筛选**: 优先搜索有效位置
- **时间控制**: 避免长时间阻塞

## ? 未来规划

### 近期计划 (v2.0)
- [ ] 游戏历史记录 (IndexedDB)
- [ ] 用户设置持久化
- [ ] 游戏统计面板
- [ ] 棋谱回放功能

### 远期规划 (v3.0)
- [ ] 在线对战模式
- [ ] AI训练模式
- [ ] 自定义棋盘主题
- [ ] 多语言支持

### 高级功能 (v4.0)
- [ ] 神经网络AI
- [ ] 实时对战匹配
- [ ] 锦标赛模式
- [ ] 社交分享功能

## ? 贡献指南

### 如何贡献
1. Fork 项目仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范
- 使用 TypeScript 编写代码
- 遵循 Vue 3 Composition API 规范
- 添加适当的类型注解和注释
- 确保代码通过 ESLint 检查

## ? 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ? 致谢

- **Vue.js团队** - 优秀的前端框架
- **TypeScript团队** - 强大的类型系统
- **五子棋社区** - 游戏规则和算法参考
- **Web Audio API** - 音效技术支持

## ? 联系方式

- **项目地址**: [GitHub Repository](#)
- **问题反馈**: [Issues](#)
- **讨论交流**: [Discussions](#)

---

> ? **体验地址**: [五子棋大师在线版](#)
> 
> ? **设计理念**: 打造最好用的五子棋PWA应用，结合AI智能与现代Web技术
>
> ? **技术特色**: Vue3 + TS + PWA + AI = 完美游戏体验

*Made with ?? by CodeMaker*