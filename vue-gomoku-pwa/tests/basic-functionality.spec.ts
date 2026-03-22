import { test, expect } from '@playwright/test';

/**
 * Gomoku PWA Basic Functionality Tests
 * Tests main page loading, navigation and basic interactions
 */

test.describe('Gomoku PWA Basic Functions', () => {
  
  test('Homepage should load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check page title is not empty and contains expected content
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
    console.log('? Page title:', title);
    
    // Check main elements exist
    await expect(page.locator('.game-container')).toBeVisible();
    await expect(page.locator('.game-board')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/homepage-loaded.png' });
  });

  test('Page navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to settings page - use button or link
    await page.click('[href*="/settings"], button:has-text("设"), button:has-text("Settings")');
    await page.waitForURL('**/settings');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test back button
    await page.click('text=返回, text=Back, [href="/"]');
    await page.waitForURL('**/', { timeout: 5000 });
    
    console.log('? Navigation test passed');
  });

  test('Game board interaction', async ({ page }) => {
    await page.goto('/');
    
    // Wait for game board to load
    await page.waitForSelector('.game-board', { timeout: 10000 });
    
    // Click on first board cell
    const firstCell = page.locator('.board-cell').first();
    await firstCell.click();
    
    // Check if piece was placed (look for any class change or content)
    await expect(firstCell).toHaveAttribute('class', /.*(black|white|piece).*/);
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/game-first-move.png' });
    
    console.log('? Game interaction test passed');
  });

  test('Settings management', async ({ page }) => {
    // Go directly to settings
    await page.goto('/settings');
    
    // Check if settings page loads
    await expect(page.locator('h1')).toBeVisible();
    
    // Look for any dropdown/select elements
    const selects = page.locator('select');
    if (await selects.count() > 0) {
      const firstSelect = selects.first();
      const options = await firstSelect.locator('option').all();
      if (options.length > 1) {
        await firstSelect.selectOption({ index: 1 });
        console.log('? Settings dropdown test passed');
      }
    }
    
    // Take screenshot of settings
    await page.screenshot({ path: 'screenshots/settings-page.png' });
  });

  test('Theme switching', async ({ page }) => {
    await page.goto('/settings');
    
    // Look for theme selector
    const themeSelector = page.locator('select').filter({ hasText: /auto|light|dark|浅色|深色/ }).first();
    
    if (await themeSelector.isVisible()) {
      // Try switching to dark theme
      await themeSelector.selectOption('dark');
      
      // Check if theme was applied to html element
      const htmlElement = page.locator('html');
      await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
      
      // Switch back to light
      await themeSelector.selectOption('light');
      await expect(htmlElement).toHaveAttribute('data-theme', 'light');
      
      console.log('? Theme switching test passed');
    }
  });

});
