# 五子棋 PWA 游戏

一个现代化的五子棋（Gomoku）游戏，支持 PWA 离线功能，基于 Vue 3 + TypeScript 构建。

## 特性

- **完整的五子棋游戏体验** - 支持人机对战和双人对战
- **智能AI对手** - 多种难度级别的AI算法
- **PWA支持** - 可安装到桌面，支持离线游戏
- **现代化UI** - 响应式设计，适配各种设备
- **高性能** - 基于 Vite 构建，快速加载
- **自动更新** - 支持版本检测和热更新
- **本地存储** - 游戏记录和设置自动保存

## 在线体验

访问：[五子棋 PWA 游戏](https://your-project.pages.edgeone.app)（EdgeOne Pages 免费域名，部署完成后更新）

> ? **部署状态**: 已配置自动部署，每次 Git 推送都会自动更新

## 安装到设备

1. 在浏览器中打开游戏
2. 点击浏览器菜单中的"添加到主屏幕"
3. 确认安装

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **开发语言**: TypeScript
- **构建工具**: Vite
- **PWA**: vite-plugin-pwa + Workbox
- **样式**: CSS3 + 响应式设计
- **部署**: 腾讯云 EdgeOne Pages

## 本地开发

### 环境要求

- Node.js 16+ 
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 游戏规则

五子棋是一种两人对弈的策略游戏：

1. **目标**: 在15×15的棋盘上，率先在横、竖、斜任意方向连成五子的一方获胜
2. **执棋**: 黑棋先行，双方轮流落子
3. **限制**: 棋子落下后不可移动或悔棋
4. **获胜**: 形成连续的五个同色棋子即可获胜

## AI算法

游戏内置了多级难度的AI算法：

- **初级**: 基础启发式评估
- **中级**: Minimax算法 + α-β剪枝
- **高级**: 深度搜索 + 位置评估函数
- **专家**: 开局库 + 中局战术 + 残局精算

## 项目结构

```
src/
├── components/          # Vue组件
│   ├── GameBoard.vue   # 游戏棋盘
│   └── GameControl.vue # 游戏控制
├── utils/              # 工具函数
│   ├── gameLogic.ts    # 游戏逻辑
│   ├── aiEngine.ts     # AI引擎
│   ├── pwaManager.ts   # PWA管理
│   └── versionManager.ts # 版本管理
├── styles/             # 样式文件
└── App.vue            # 主应用组件
```

## 部署

本项目已配置自动部署到腾讯云 EdgeOne Pages：

1. 推送代码到 GitHub
2. EdgeOne Pages 自动检测更新
3. 自动构建和部署

## 配置文件

- `vite.config.ts` - Vite配置 + PWA设置
- `edgeone.config.json` - EdgeOne Pages部署配置
- `manifest.json` - PWA应用清单

## 性能优化

- **代码分割**: 将AI引擎与UI核心分离
- **压缩优化**: 使用Terser进行代码压缩
- **缓存策略**: 7层缓存机制覆盖所有资源
- **资源优化**: 图片压缩和格式优化

## 贡献

欢迎提交 Issues 和 Pull Requests！

### 开发流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/jiawangxi/five-chess-pma/issues)
- 项目主页: [GitHub仓库](https://github.com/jiawangxi/five-chess-pma)

---

如果这个项目对你有帮助，请给个 Star 支持一下！