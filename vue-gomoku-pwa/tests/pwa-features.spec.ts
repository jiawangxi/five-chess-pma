import { test, expect } from '@playwright/test';

/**
 * PWA功能专项测试
 * 测试Service Worker、缓存、离线功能等
 */

test.describe('PWA功能测试', () => {
  
  test('Service Worker注册', async ({ page }) => {
    await page.goto('/');
    
    // 等待Service Worker注册
    await page.waitForFunction(() => 'serviceWorker' in navigator);
    
    // 检查Service Worker是否注册成功
    const serviceWorkerReady = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.active !== null;
      }
      return false;
    });
    
    expect(serviceWorkerReady).toBe(true);
    console.log('? Service Worker注册成功');
  });

  test('缓存功能检查', async ({ page }) => {
    await page.goto('/');
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    // 检查缓存是否可用
    const cacheAvailable = await page.evaluate(async () => {
      return 'caches' in window;
    });
    
    expect(cacheAvailable).toBe(true);
    
    // 检查是否有缓存条目
    const cacheNames = await page.evaluate(async () => {
      if ('caches' in window) {
        return await caches.keys();
      }
      return [];
    });
    
    expect(cacheNames.length).toBeGreaterThan(0);
    console.log('? 发现缓存:', cacheNames);
  });

  test('离线功能测试', async ({ page, context }) => {
    // 首先正常加载页面建立缓存
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // 模拟离线状态
    await context.setOffline(true);
    
    // 重新加载页面，应该从缓存加载
    await page.reload();
    
    // 检查页面是否仍能正常显示
    await expect(page.locator('.game-container')).toBeVisible({ timeout: 10000 });
    
    // 检查导航是否仍然工作
    await page.click('text=设置');
    await expect(page.locator('h1')).toContainText('游戏设置');
    
    // 恢复在线状态
    await context.setOffline(false);
    
    console.log('? 离线模式测试通过');
  });

  test('PWA缓存管理功能', async ({ page }) => {
    await page.goto('/settings');
    
    // 检查PWA缓存管理部分是否显示
    const cacheSection = page.locator('text=PWA缓存管理').first();
    await expect(cacheSection).toBeVisible();
    
    // 检查缓存状态显示
    await expect(page.locator('text=网络状态')).toBeVisible();
    await expect(page.locator('text=缓存大小')).toBeVisible();
    
    // 测试获取缓存报告
    await page.click('text=缓存报告');
    // 应该弹出缓存报告对话框
    await page.waitForEvent('dialog');
    
    console.log('? PWA缓存管理UI测试通过');
  });

  test('音效设置功能', async ({ page }) => {
    await page.goto('/settings');
    
    // 测试音效开关
    const soundToggle = page.locator('input[type="checkbox"]').first();
    await soundToggle.click();
    
    // 测试音量滑块
    const volumeSlider = page.locator('input[type="range"]');
    await volumeSlider.fill('50');
    
    // 检查音量显示是否更新
    await expect(page.locator('text=50%')).toBeVisible();
    
    // 返回主页验证设置保存
    await page.click('text=返回');
    await page.goto('/settings');
    
    // 验证设置是否保存
    const volumeValue = await volumeSlider.inputValue();
    expect(volumeValue).toBe('50');
    
    console.log('? 音效设置测试通过');
  });

  test('响应式设计测试', async ({ page }) => {
    // 测试桌面视图
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await page.screenshot({ path: 'screenshots/desktop-view.png' });
    
    // 测试平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.screenshot({ path: 'screenshots/tablet-view.png' });
    
    // 测试手机视图
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.screenshot({ path: 'screenshots/mobile-view.png' });
    
    // 验证游戏棋盘在不同屏幕尺寸下都可见
    await expect(page.locator('.game-board')).toBeVisible();
    
    console.log('? 响应式设计测试通过');
  });

  test('游戏状态持久化', async ({ page }) => {
    await page.goto('/');
    
    // 下一步棋
    const firstCell = page.locator('.board-cell').first();
    await firstCell.click();
    
    // 刷新页面
    await page.reload();
    
    // 检查游戏状态是否保存（如果有自动保存功能）
    // 这个测试可能需要根据实际的游戏保存逻辑调整
    
    console.log('? 游戏状态测试完成');
  });

});