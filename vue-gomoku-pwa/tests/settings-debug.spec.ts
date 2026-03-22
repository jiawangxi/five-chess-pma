import { test, expect } from '@playwright/test';

/**
 * 设置页面专项测试和问题修复
 * 优先解决已知的设置页面问题
 */

test.describe('Settings Page Deep Testing', () => {
  
  test('Settings page access and layout', async ({ page }) => {
    // 直接访问设置页面
    await page.goto('/settings');
    
    // 检查页面是否正常加载
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // 获取页面标题文本
    const heading = await page.locator('h1').textContent();
    console.log('? Settings page heading:', heading);
    
    // 检查页面是否有emoji乱码问题
    const pageContent = await page.content();
    if (pageContent.includes('?') && pageContent.includes('设置')) {
      console.log('? Found emoji encoding issues');
    } else {
      console.log('? No obvious encoding issues');
    }
    
    // 截图保存当前状态
    await page.screenshot({ path: 'screenshots/settings-page-layout.png' });
  });

  test('Find and test all interactive elements', async ({ page }) => {
    await page.goto('/settings');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 查找所有下拉选择框
    const selects = await page.locator('select').all();
    console.log(`? Found ${selects.length} select elements`);
    
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      const options = await select.locator('option').all();
      console.log(`   Select ${i + 1}: ${options.length} options`);
      
      // 获取当前值
      const currentValue = await select.inputValue();
      console.log(`   Current value: ${currentValue}`);
      
      // 尝试切换选项
      if (options.length > 1) {
        try {
          await select.selectOption({ index: 1 });
          console.log(`   ? Successfully changed select ${i + 1}`);
        } catch (error) {
          console.log(`   ? Failed to change select ${i + 1}:`, error.message);
        }
      }
    }
    
    // 查找所有复选框
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    console.log(`? Found ${checkboxes.length} checkbox elements`);
    
    // 查找所有滑块
    const ranges = await page.locator('input[type="range"]').all();
    console.log(`? Found ${ranges.length} range sliders`);
    
    // 查找所有按钮
    const buttons = await page.locator('button').all();
    console.log(`? Found ${buttons.length} buttons`);
    
    // 截图记录所有控件状态
    await page.screenshot({ path: 'screenshots/settings-controls.png' });
  });

  test('Test navigation from homepage to settings', async ({ page }) => {
    // 从首页开始
    await page.goto('/');
    
    // 查找设置按钮/链接的各种可能方式
    const settingsSelectors = [
      'text=??',
      'text=设置',
      'text=Settings',
      '[href="/settings"]',
      '[href*="settings"]',
      'button:has-text("设")',
      'a:has-text("设")',
      '.settings-btn',
      '#settings-btn'
    ];
    
    let found = false;
    for (const selector of settingsSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          console.log(`? Found settings link with selector: ${selector}`);
          await element.click();
          found = true;
          break;
        }
      } catch (error) {
        // 继续尝试下一个选择器
      }
    }
    
    if (!found) {
      console.log('? Could not find settings navigation button');
      // 截图显示当前页面
      await page.screenshot({ path: 'screenshots/homepage-no-settings-btn.png' });
      return;
    }
    
    // 等待导航完成
    await page.waitForURL('**/settings', { timeout: 5000 });
    
    // 验证到达了设置页面
    await expect(page.locator('h1')).toBeVisible();
    console.log('? Successfully navigated to settings');
  });

  test('Test settings persistence', async ({ page }) => {
    await page.goto('/settings');
    
    // 查找第一个可用的下拉框并修改
    const firstSelect = page.locator('select').first();
    if (await firstSelect.isVisible()) {
      const options = await firstSelect.locator('option').all();
      if (options.length > 1) {
        // 切换到第二个选项
        await firstSelect.selectOption({ index: 1 });
        const newValue = await firstSelect.inputValue();
        console.log(`Changed setting to: ${newValue}`);
        
        // 导航到其他页面再回来
        await page.goto('/');
        await page.goto('/settings');
        
        // 检查设置是否保存
        const savedValue = await firstSelect.inputValue();
        if (savedValue === newValue) {
          console.log('? Settings persistence works');
        } else {
          console.log('? Settings not persisted');
        }
      }
    }
  });

  test('Check for PWA cache controls', async ({ page }) => {
    await page.goto('/settings');
    
    // 查找PWA缓存管理相关的控件
    const cacheButtons = [
      'text=缓存报告',
      'text=清理缓存',
      'text=更新缓存',
      'text=Cache',
      'button:has-text("缓存")',
      'button:has-text("cache")'
    ];
    
    let foundCacheControls = 0;
    for (const selector of cacheButtons) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          foundCacheControls++;
          console.log(`? Found cache control: ${selector}`);
        }
      } catch (error) {
        // 继续检查
      }
    }
    
    console.log(`Found ${foundCacheControls} PWA cache controls`);
    
    // 检查是否显示缓存状态信息
    const cacheInfo = [
      'text=网络状态',
      'text=缓存大小',
      'text=PWA',
      'text=离线'
    ];
    
    for (const selector of cacheInfo) {
      try {
        if (await page.locator(selector).isVisible()) {
          console.log(`? Found cache info: ${selector}`);
        }
      } catch (error) {
        // 继续检查
      }
    }
    
    await page.screenshot({ path: 'screenshots/settings-cache-controls.png' });
  });

});