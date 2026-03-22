# 腾讯云 EdgeOne Pages 部署指南

## ? 部署概述

本指南将帮你将五子棋PWA游戏部署到腾讯云 EdgeOne Pages，实现：
- ? 全国CDN加速访问
- ? 自动HTTPS证书
- ? Git自动化部署
- ? PWA完整支持

## ? 前置条件

1. **腾讯云账号**：[注册地址](https://cloud.tencent.com/)
2. **Git仓库**：GitHub、GitLab 或 Coding
3. **项目代码**：已完成PWA配置的五子棋项目

## ? 部署步骤

### 第一步：开通 EdgeOne Pages 服务

1. 登录腾讯云控制台
2. 搜索"EdgeOne Pages"或"静态网站托管"
3. 开通服务（免费额度足够个人使用）

### 第二步：创建项目

1. 进入 EdgeOne Pages 控制台
2. 点击"新建项目"
3. 选择"从Git仓库导入"

### 第三步：配置构建设置

```json
{
  "构建命令": "npm run build",
  "输出目录": "dist",
  "根目录": "./vue-gomoku-pwa",
  "Node.js版本": "18.x"
}
```

### 第四步：环境变量设置

在项目设置中添加环境变量：
```
NODE_ENV=production
VITE_APP_VERSION=1.0.0
```

### 第五步：自定义域名（可选）

1. 在域名管理中添加自定义域名
2. 配置DNS解析到提供的CNAME
3. 等待SSL证书自动签发（通常5-10分钟）

## ? 项目结构要求

确保你的项目结构如下：
```
vue-gomoku-pwa/
├── src/
├── public/
├── package.json
├── vite.config.ts
├── edgeone.config.json  ← 平台配置文件
└── dist/                ← 构建输出（自动生成）
```

## ?? 重要配置说明

### PWA Service Worker 配置

确保 `edgeone.config.json` 中的 Service Worker 配置正确：
```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control", 
          "value": "max-age=0, no-cache"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    }
  ]
}
```

### 路由配置

为了支持SPA路由，确保配置了回退规则：
```json
{
  "routing": {
    "rewrites": [
      {
        "source": "/*",
        "destination": "/index.html"
      }
    ]
  }
}
```

## ? 自动部署流程

配置完成后，每次推送代码到主分支将自动触发：
1. 代码拉取
2. 依赖安装 (`npm install`)
3. 项目构建 (`npm run build`)
4. 文件部署
5. CDN缓存刷新

## ? 部署验证清单

部署完成后，请验证以下功能：

### 基础功能
- [ ] 网站可正常访问
- [ ] HTTPS证书有效
- [ ] 游戏功能正常

### PWA功能
- [ ] 可以添加到主屏幕
- [ ] 离线状态下能访问
- [ ] Service Worker正常注册
- [ ] 缓存策略工作正常

### 性能检查
- [ ] 首屏加载时间 < 3秒
- [ ] Lighthouse PWA评分 > 90
- [ ] 移动端响应式正常

## ?? 常见问题解决

### 问题1：构建失败
**原因**：依赖安装失败或构建命令错误
**解决**：
```bash
# 本地测试构建
cd vue-gomoku-pwa
npm install
npm run build
```

### 问题2：PWA不工作
**原因**：Service Worker被缓存策略阻止
**解决**：检查 `edgeone.config.json` 中的 headers 配置

### 问题3：路由404错误
**原因**：SPA路由重写规则未配置
**解决**：确保配置了 `/*` 到 `/index.html` 的重写规则

### 问题4：更新不生效
**原因**：CDN缓存未刷新
**解决**：在控制台手动刷新CDN缓存

## ? 性能优化建议

### 1. 图片优化
- 使用 WebP 格式
- 合理设置图片大小
- 启用懒加载

### 2. 缓存策略
- 静态资源长期缓存
- HTML文件不缓存
- Service Worker文件不缓存

### 3. 代码分割
- 路由级别代码分割
- 第三方库单独打包
- 按需加载组件

## ? 监控和维护

### 访问统计
EdgeOne Pages 提供：
- 访问量统计
- 流量使用情况
- 错误率监控
- 性能指标

### 日志查看
- 构建日志
- 访问日志
- 错误日志
- 性能日志

## ? 技术支持

如遇到问题，可以：
1. 查看腾讯云 EdgeOne Pages 文档
2. 提交工单咨询
3. 社区论坛求助

## ? 部署完成后

恭喜！你的五子棋PWA游戏已成功部署。你现在拥有：
- ? 全球CDN加速的游戏网站
- ? 可安装的PWA应用
- ? 自动化的部署流程
- ? 基础的监控功能

享受你的专业级五子棋游戏吧！