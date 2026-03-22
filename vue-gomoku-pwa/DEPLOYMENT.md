# 部署配置说明
# 
# 本项目支持多种部署方式：

## 1. 静态网站托管
# - Vercel (推荐)
# - Netlify  
# - GitHub Pages
# - Firebase Hosting
# - Surge.sh

## 2. 服务器部署
# - Nginx 静态文件服务
# - Apache 服务器
# - CDN + OSS 对象存储

## 3. 容器化部署
# - Docker
# - Kubernetes

## 构建命令
# npm run build:prod

## 输出目录
# dist/

## 环境要求
# - Node.js 20+
# - npm 9+

## HTTPS 要求
# PWA 应用需要 HTTPS 环境才能正常使用 Service Worker
# 本地开发可使用 mkcert 生成本地证书

## 缓存策略
# - HTML: no-cache
# - JS/CSS: 1年缓存 (hash文件名)
# - 图片/字体: 6个月缓存