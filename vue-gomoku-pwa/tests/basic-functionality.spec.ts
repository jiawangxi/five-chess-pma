import { test, expect } from '@playwright/test';

/**
 * PWA五子棋应用基础功能测试
 * 测试主要页面加载、导航和基本交互
 */

test.describe('五子棋PWA基础功能', () => {
  
  test('主页应该正常加载', async ({ page }) => {
    await page.goto('/');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/五子棋/);
    
    // 检查主要元素是否存在
    await expect(page.locator('.game-container')).toBeVisible();
    await expect(page.locator('.game-board')).toBeVisible();
    
    // 截图记录
    await page.screenshot({ path: 'screenshots/homepage-loaded.png' });
  });

  test('页面导航功能', async ({ page }) => {
    await page.goto('/');
    
    // 测试导航到设置页面
    await page.click('text=设置');
    await expect(page.url()).toContain('/settings');
    await expect(page.locator('h1')).toContainText('游戏设置');
    
    // 测试返回按钮
    await page.click('text=返回');
    await expect(page.url()).toBe('http://localhost:5175/');
    
    // 测试导航到教程页面
    await page.click('text=教程');
    await expect(page.url()).toContain('/tutorial');
    
    // 测试导航到历史页面
    await page.goto('/');
    await page.click('text=历史');
    await expect(page.url()).toContain('/history');
    
    // 测试导航到关于页面
    await page.goto('/');
    await page.click('text=关于');
    await expect(page.url()).toContain('/about');
  });

  test('游戏棋盘交互', async ({ page }) => {
    await page.goto('/');
    
    // 等待游戏棋盘加载
    await page.waitForSelector('.game-board');
    
    // 点击棋盘上的第一个格子
    const firstCell = page.locator('.board-cell').first();
    await firstCell.click();
    
    // 检查棋子是否放置成功
    await expect(firstCell).toHaveClass(/black/);
    
    // 截图记录游戏状态
    await page.screenshot({ path: 'screenshots/game-first-move.png' });
  });

  test('AI难度设置同步', async ({ page }) => {
    await page.goto('/');
    
    // 记录初始AI难度
    const initialDifficulty = await page.locator('.difficulty-selector').inputValue();
    
    // 进入设置页面
    await page.click('text=设置');
    
    // 修改AI难度
    await page.selectOption('select[value*="hard"]', 'easy');
    
    // 返回主页
    await page.click('text=返回');
    
    // 验证AI难度是否同步
    const newDifficulty = await page.locator('.difficulty-selector').inputValue();
    expect(newDifficulty).toBe('easy');
  });

  test('主题切换功能', async ({ page }) => {
    await page.goto('/settings');
    
    // 切换到深色主题
    await page.selectOption('select[value*="auto"]', 'dark');
    
    // 检查主题是否应用
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    
    // 切换回浅色主题
    await page.selectOption('select[value*="dark"]', 'light');
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');
  });

});