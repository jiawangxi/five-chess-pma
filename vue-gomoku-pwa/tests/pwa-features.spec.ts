import { test, expect } from '@playwright/test';

/**
 * PWA¹¦ÄÜ×¨Ïî²âÊÔ
 * ²âÊÔService Worker¡¢»º´æ¡¢ÀëÏß¹¦ÄÜµÈ
 */

test.describe('PWA¹¦ÄÜ²âÊÔ', () => {
  
  test('Service Worker×¢²á', async ({ page }) => {
    await page.goto('/');
    
    // µÈ´ýService Worker×¢²á
    await page.waitForFunction(() => 'serviceWorker' in navigator);
    
    // ¼ì²éService WorkerÊÇ·ñ×¢²á³É¹¦
    const serviceWorkerReady = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration.active !== null;
      }
      return false;
    });
    
    expect(serviceWorkerReady).toBe(true);
    console.log('? Service Worker×¢²á³É¹¦');
  });

  test('»º´æ¹¦ÄÜ¼ì²é', async ({ page }) => {
    await page.goto('/');
    
    // µÈ´ýÒ³ÃæÍêÈ«¼ÓÔØ
    await page.waitForLoadState('networkidle');
    
    // ¼ì²é»º´æÊÇ·ñ¿ÉÓÃ
    const cacheAvailable = await page.evaluate(async () => {
      return 'caches' in window;
    });
    
    expect(cacheAvailable).toBe(true);
    
    // ¼ì²éÊÇ·ñÓÐ»º´æÌõÄ¿
    const cacheNames = await page.evaluate(async () => {
      if ('caches' in window) {
        return await caches.keys();
      }
      return [];
    });
    
    expect(cacheNames.length).toBeGreaterThan(0);
    console.log('? ·¢ÏÖ»º´æ:', cacheNames);
  });

  test('ÀëÏß¹¦ÄÜ²âÊÔ', async ({ page, context }) => {
    // Ê×ÏÈÕý³£¼ÓÔØÒ³Ãæ½¨Á¢»º´æ
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Ä£ÄâÀëÏß×´Ì¬
    await context.setOffline(true);
    
    // ÖØÐÂ¼ÓÔØÒ³Ãæ£¬Ó¦¸Ã´Ó»º´æ¼ÓÔØ
    await page.reload();
    
    // ¼ì²éÒ³ÃæÊÇ·ñÈÔÄÜÕý³£ÏÔÊ¾
    await expect(page.locator('.game-container')).toBeVisible({ timeout: 10000 });
    
    // ¼ì²éµ¼º½ÊÇ·ñÈÔÈ»¹¤×÷
    await page.click('text=ÉèÖÃ');
    await expect(page.locator('h1')).toContainText('ÓÎÏ·ÉèÖÃ');
    
    // »Ö¸´ÔÚÏß×´Ì¬
    await context.setOffline(false);
    
    console.log('? ÀëÏßÄ£Ê½²âÊÔÍ¨¹ý');
  });

  test('PWA»º´æ¹ÜÀí¹¦ÄÜ', async ({ page }) => {
    await page.goto('/settings');
    
    // ¼ì²éPWA»º´æ¹ÜÀí²¿·ÖÊÇ·ñÏÔÊ¾
    const cacheSection = page.locator('text=PWA»º´æ¹ÜÀí').first();
    await expect(cacheSection).toBeVisible();
    
    // ¼ì²é»º´æ×´Ì¬ÏÔÊ¾
    await expect(page.locator('text=ÍøÂç×´Ì¬')).toBeVisible();
    await expect(page.locator('text=»º´æ´óÐ¡')).toBeVisible();
    
    // ²âÊÔ»ñÈ¡»º´æ±¨¸æ
    await page.click('text=»º´æ±¨¸æ');
    // Ó¦¸Ãµ¯³ö»º´æ±¨¸æ¶Ô»°¿ò
    await page.waitForEvent('dialog');
    
    console.log('? PWA»º´æ¹ÜÀíUI²âÊÔÍ¨¹ý');
  });

  test('ÒôÐ§ÉèÖÃ¹¦ÄÜ', async ({ page }) => {
    await page.goto('/settings');
    
    // ²âÊÔÒôÐ§¿ª¹Ø
    const soundToggle = page.locator('input[type="checkbox"]').first();
    await soundToggle.click();
    
    // ²âÊÔÒôÁ¿»¬¿é
    const volumeSlider = page.locator('input[type="range"]');
    await volumeSlider.fill('50');
    
    // ¼ì²éÒôÁ¿ÏÔÊ¾ÊÇ·ñ¸üÐÂ
    await expect(page.locator('text=50%')).toBeVisible();
    
    // ·µ»ØÖ÷Ò³ÑéÖ¤ÉèÖÃ±£´æ
    await page.click('text=·µ»Ø');
    await page.goto('/settings');
    
    // ÑéÖ¤ÉèÖÃÊÇ·ñ±£´æ
    const volumeValue = await volumeSlider.inputValue();
    expect(volumeValue).toBe('50');
    
    console.log('? ÒôÐ§ÉèÖÃ²âÊÔÍ¨¹ý');
  });

  test('ÏìÓ¦Ê½Éè¼Æ²âÊÔ', async ({ page }) => {
    // ²âÊÔ×ÀÃæÊÓÍ¼
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await page.screenshot({ path: 'screenshots/desktop-view.png' });
    
    // ²âÊÔÆ½°åÊÓÍ¼
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.screenshot({ path: 'screenshots/tablet-view.png' });
    
    // ²âÊÔÊÖ»úÊÓÍ¼
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.screenshot({ path: 'screenshots/mobile-view.png' });
    
    // ÑéÖ¤ÓÎÏ·ÆåÅÌÔÚ²»Í¬ÆÁÄ»³ß´çÏÂ¶¼¿É¼û
    await expect(page.locator('.game-board')).toBeVisible();
    
    console.log('? ÏìÓ¦Ê½Éè¼Æ²âÊÔÍ¨¹ý');
  });

  test('ÓÎÏ·×´Ì¬³Ö¾Ã»¯', async ({ page }) => {
    await page.goto('/');
    
    // ÏÂÒ»²½Æå
    const firstCell = page.locator('.board-cell').first();
    await firstCell.click();
    
    // Ë¢ÐÂÒ³Ãæ
    await page.reload();
    
    // ¼ì²éÓÎÏ·×´Ì¬ÊÇ·ñ±£´æ£¨Èç¹ûÓÐ×Ô¶¯±£´æ¹¦ÄÜ£©
    // Õâ¸ö²âÊÔ¿ÉÄÜÐèÒª¸ù¾ÝÊµ¼ÊµÄÓÎÏ·±£´æÂß¼­µ÷Õû
    
    console.log('? ÓÎÏ·×´Ì¬²âÊÔÍê³É');
  });

});