import { test, expect } from '@playwright/test';

/**
 * ÉèÖÃÒ³Ãæ×¨Ïî²âÊÔºÍÎÊÌâÐÞ¸´
 * ÓÅÏÈ½â¾öÒÑÖªµÄÉèÖÃÒ³ÃæÎÊÌâ
 */

test.describe('Settings Page Deep Testing', () => {
  
  test('Settings page access and layout', async ({ page }) => {
    // Ö±½Ó·ÃÎÊÉèÖÃÒ³Ãæ
    await page.goto('/settings');
    
    // ¼ì²éÒ³ÃæÊÇ·ñÕý³£¼ÓÔØ
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    
    // »ñÈ¡Ò³Ãæ±êÌâÎÄ±¾
    const heading = await page.locator('h1').textContent();
    console.log('? Settings page heading:', heading);
    
    // ¼ì²éÒ³ÃæÊÇ·ñÓÐemojiÂÒÂëÎÊÌâ
    const pageContent = await page.content();
    if (pageContent.includes('?') && pageContent.includes('ÉèÖÃ')) {
      console.log('? Found emoji encoding issues');
    } else {
      console.log('? No obvious encoding issues');
    }
    
    // ½ØÍ¼±£´æµ±Ç°×´Ì¬
    await page.screenshot({ path: 'screenshots/settings-page-layout.png' });
  });

  test('Find and test all interactive elements', async ({ page }) => {
    await page.goto('/settings');
    
    // µÈ´ýÒ³Ãæ¼ÓÔØÍê³É
    await page.waitForLoadState('networkidle');
    
    // ²éÕÒËùÓÐÏÂÀ­Ñ¡Ôñ¿ò
    const selects = await page.locator('select').all();
    console.log(`? Found ${selects.length} select elements`);
    
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      const options = await select.locator('option').all();
      console.log(`   Select ${i + 1}: ${options.length} options`);
      
      // »ñÈ¡µ±Ç°Öµ
      const currentValue = await select.inputValue();
      console.log(`   Current value: ${currentValue}`);
      
      // ³¢ÊÔÇÐ»»Ñ¡Ïî
      if (options.length > 1) {
        try {
          await select.selectOption({ index: 1 });
          console.log(`   ? Successfully changed select ${i + 1}`);
        } catch (error) {
          console.log(`   ? Failed to change select ${i + 1}:`, error.message);
        }
      }
    }
    
    // ²éÕÒËùÓÐ¸´Ñ¡¿ò
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    console.log(`? Found ${checkboxes.length} checkbox elements`);
    
    // ²éÕÒËùÓÐ»¬¿é
    const ranges = await page.locator('input[type="range"]').all();
    console.log(`? Found ${ranges.length} range sliders`);
    
    // ²éÕÒËùÓÐ°´Å¥
    const buttons = await page.locator('button').all();
    console.log(`? Found ${buttons.length} buttons`);
    
    // ½ØÍ¼¼ÇÂ¼ËùÓÐ¿Ø¼þ×´Ì¬
    await page.screenshot({ path: 'screenshots/settings-controls.png' });
  });

  test('Test navigation from homepage to settings', async ({ page }) => {
    // ´ÓÊ×Ò³¿ªÊ¼
    await page.goto('/');
    
    // ²éÕÒÉèÖÃ°´Å¥/Á´½ÓµÄ¸÷ÖÖ¿ÉÄÜ·½Ê½
    const settingsSelectors = [
      'text=??',
      'text=ÉèÖÃ',
      'text=Settings',
      '[href="/settings"]',
      '[href*="settings"]',
      'button:has-text("Éè")',
      'a:has-text("Éè")',
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
        // ¼ÌÐø³¢ÊÔÏÂÒ»¸öÑ¡ÔñÆ÷
      }
    }
    
    if (!found) {
      console.log('? Could not find settings navigation button');
      // ½ØÍ¼ÏÔÊ¾µ±Ç°Ò³Ãæ
      await page.screenshot({ path: 'screenshots/homepage-no-settings-btn.png' });
      return;
    }
    
    // µÈ´ýµ¼º½Íê³É
    await page.waitForURL('**/settings', { timeout: 5000 });
    
    // ÑéÖ¤µ½´ïÁËÉèÖÃÒ³Ãæ
    await expect(page.locator('h1')).toBeVisible();
    console.log('? Successfully navigated to settings');
  });

  test('Test settings persistence', async ({ page }) => {
    await page.goto('/settings');
    
    // ²éÕÒµÚÒ»¸ö¿ÉÓÃµÄÏÂÀ­¿ò²¢ÐÞ¸Ä
    const firstSelect = page.locator('select').first();
    if (await firstSelect.isVisible()) {
      const options = await firstSelect.locator('option').all();
      if (options.length > 1) {
        // ÇÐ»»µ½µÚ¶þ¸öÑ¡Ïî
        await firstSelect.selectOption({ index: 1 });
        const newValue = await firstSelect.inputValue();
        console.log(`Changed setting to: ${newValue}`);
        
        // µ¼º½µ½ÆäËûÒ³ÃæÔÙ»ØÀ´
        await page.goto('/');
        await page.goto('/settings');
        
        // ¼ì²éÉèÖÃÊÇ·ñ±£´æ
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
    
    // ²éÕÒPWA»º´æ¹ÜÀíÏà¹ØµÄ¿Ø¼þ
    const cacheButtons = [
      'text=»º´æ±¨¸æ',
      'text=ÇåÀí»º´æ',
      'text=¸üÐÂ»º´æ',
      'text=Cache',
      'button:has-text("»º´æ")',
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
        // ¼ÌÐø¼ì²é
      }
    }
    
    console.log(`Found ${foundCacheControls} PWA cache controls`);
    
    // ¼ì²éÊÇ·ñÏÔÊ¾»º´æ×´Ì¬ÐÅÏ¢
    const cacheInfo = [
      'text=ÍøÂç×´Ì¬',
      'text=»º´æ´óÐ¡',
      'text=PWA',
      'text=ÀëÏß'
    ];
    
    for (const selector of cacheInfo) {
      try {
        if (await page.locator(selector).isVisible()) {
          console.log(`? Found cache info: ${selector}`);
        }
      } catch (error) {
        // ¼ÌÐø¼ì²é
      }
    }
    
    await page.screenshot({ path: 'screenshots/settings-cache-controls.png' });
  });

});