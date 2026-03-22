import { defineConfig, devices } from '@playwright/test';

/**
 * PWAÎå×ÓÆåÓ¦ÓÃ×Ô¶¯»¯²âÊÔÅäÖÃ
 * ÓÃÓÚ×Ô¶¯²âÊÔPWA¹¦ÄÜ¡¢»º´æ²ßÂÔ¡¢ÉèÖÃ¹ÜÀíµÈ
 */
export default defineConfig({
  testDir: './tests',
  // ²¢·¢ÔËÐÐ²âÊÔ
  fullyParallel: false,
  // Ê§°ÜÖØÊÔ´ÎÊý
  retries: process.env.CI ? 2 : 0,
  // ²¢·¢workerÊýÁ¿
  workers: process.env.CI ? 1 : undefined,
  // ²âÊÔ±¨¸æÅäÖÃ
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  // È«¾Ö²âÊÔÅäÖÃ
  use: {
    // »ù´¡URL£¨»á¸ù¾Ý¿ª·¢/Éú²ú»·¾³×Ô¶¯µ÷Õû£©
    baseURL: 'http://localhost:4174',
    // ×·×ÙÅäÖÃ£¨Ê§°ÜÊ±±£Áô£©
    trace: 'retain-on-failure',
    // ½ØÍ¼ÅäÖÃ
    screenshot: 'only-on-failure',
    // ÊÓÆµÂ¼ÖÆ
    video: 'retain-on-failure',
    // ºöÂÔHTTPS´íÎó
    ignoreHTTPSErrors: true,
  },

  // ²âÊÔÏîÄ¿ÅäÖÃ
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // PWA²âÊÔÐèÒªµÄÈ¨ÏÞ
        permissions: ['notifications'],
        // Ä£ÄâÒÆ¶¯ÍøÂç
        offline: false,
        // ÆôÓÃService Worker
        serviceWorkers: 'allow'
      },
    },
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // ÒÆ¶¯¶ËPWA²âÊÔ
        permissions: ['notifications'],
        serviceWorkers: 'allow'
      },
    },
    // ÀëÏßÄ£Ê½²âÊÔ
    {
      name: 'offline-test',
      use: {
        ...devices['Desktop Chrome'],
        // Ä£ÄâÀëÏß»·¾³
        offline: true,
        serviceWorkers: 'allow'
      },
    }
  ],

  // ¿ª·¢·þÎñÆ÷ÅäÖÃ
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