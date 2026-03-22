import { defineConfig, devices } from '@playwright/test';

/**
 * PWA五子棋应用自动化测试配置
 * 用于自动测试PWA功能、缓存策略、设置管理等
 */
export default defineConfig({
  testDir: './tests',
  // 并发运行测试
  fullyParallel: false,
  // 失败重试次数
  retries: process.env.CI ? 2 : 0,
  // 并发worker数量
  workers: process.env.CI ? 1 : undefined,
  // 测试报告配置
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  // 全局测试配置
  use: {
    // 基础URL（会根据开发/生产环境自动调整）
    baseURL: process.env.CI ? 'http://localhost:4173' : 'http://localhost:5175',
    // 追踪配置（失败时保留）
    trace: 'retain-on-failure',
    // 截图配置
    screenshot: 'only-on-failure',
    // 视频录制
    video: 'retain-on-failure',
    // 忽略HTTPS错误
    ignoreHTTPSErrors: true,
  },

  // 测试项目配置
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // PWA测试需要的权限
        permissions: ['notifications'],
        // 模拟移动网络
        offline: false,
        // 启用Service Worker
        serviceWorkers: 'allow'
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // 移动端PWA测试
        permissions: ['notifications'],
        serviceWorkers: 'allow'
      },
    },
    // 离线模式测试
    {
      name: 'offline-test',
      use: {
        ...devices['Desktop Chrome'],
        // 模拟离线环境
        offline: true,
        serviceWorkers: 'allow'
      },
    }
  ],

  // 开发服务器配置
  webServer: [
    {
      command: 'npm run dev',
      port: 5175,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      command: 'npm run preview',
      port: 4173,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'production'
      }
    }
  ],
});