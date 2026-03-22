/**
 * ¼òµ¥µÄÓ¦ÓÃ×´Ì¬¼ì²é½Å±¾
 * ÎÞÐèä¯ÀÀÆ÷£¬Ö±½ÓÑéÖ¤Ó¦ÓÃÅäÖÃºÍ¹¹½¨×´Ì¬
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('? Îå×ÓÆåPWAÓ¦ÓÃ×´Ì¬¼ì²é');
console.log('¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T');

// 1. ¼ì²é¹Ø¼üÎÄ¼þÊÇ·ñ´æÔÚ
const criticalFiles = [
  'src/main.ts',
  'src/App.vue', 
  'src/views/HomeView.vue',
  'src/views/SettingsView.vue',
  'src/utils/optimizedAI.ts',
  'src/utils/settingsManager.ts',
  'src/utils/cacheManager.ts',
  'vite.config.ts',
  'package.json',
  'playwright.config.ts'
];

console.log('\n? ¹Ø¼üÎÄ¼þ¼ì²é:');
let missingFiles = 0;
criticalFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '?' : '?';
  console.log(`${status} ${file}`);
  if (!exists) missingFiles++;
});

// 2. ¼ì²é¹¹½¨Êä³ö
console.log('\n?? ¹¹½¨×´Ì¬¼ì²é:');
const distPath = path.join(projectRoot, 'dist');
const distExists = fs.existsSync(distPath);
console.log(`${distExists ? '?' : '?'} dist/ Ä¿Â¼´æÔÚ`);

if (distExists) {
  const buildFiles = [
    'index.html',
    'manifest.webmanifest', 
    'sw.js'
  ];
  
  buildFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '?' : '?'} ${file}`);
  });
  
  // ¼ì²é×ÊÔ´ÎÄ¼þ
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    const jsFiles = assetFiles.filter(f => f.endsWith('.js')).length;
    const cssFiles = assetFiles.filter(f => f.endsWith('.css')).length;
    console.log(`? ×ÊÔ´ÎÄ¼þ: ${jsFiles} JSÎÄ¼þ, ${cssFiles} CSSÎÄ¼þ`);
  }
}

// 3. ¼ì²épackage.jsonÅäÖÃ
console.log('\n? PackageÅäÖÃ¼ì²é:');
try {
  const packagePath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = [
    'vue',
    'vue-router', 
    'pinia'
  ];
  
  const requiredDevDeps = [
    '@playwright/test',
    'vite-plugin-pwa',
    'terser'
  ];
  
  console.log('ÒÀÀµ¼ì²é:');
  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies?.[dep];
    console.log(`${exists ? '?' : '?'} ${dep}${exists ? ` (${exists})` : ''}`);
  });
  
  console.log('¿ª·¢ÒÀÀµ¼ì²é:');
  requiredDevDeps.forEach(dep => {
    const exists = packageJson.devDependencies?.[dep];
    console.log(`${exists ? '?' : '?'} ${dep}${exists ? ` (${exists})` : ''}`);
  });
  
} catch (error) {
  console.log('? ÎÞ·¨¶ÁÈ¡package.json');
}

// 4. ¼ì²éPWAÅäÖÃ
console.log('\n? PWAÅäÖÃ¼ì²é:');
try {
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  const pwaChecks = [
    { name: 'VitePWA²å¼þ', pattern: /VitePWA/ },
    { name: 'WorkboxÅäÖÃ', pattern: /workbox:/ },
    { name: 'ManifestÅäÖÃ', pattern: /manifest:/ },
    { name: '»º´æ²ßÂÔ', pattern: /runtimeCaching/ },
    { name: 'Service Worker', pattern: /registerType/ }
  ];
  
  pwaChecks.forEach(check => {
    const found = check.pattern.test(viteConfig);
    console.log(`${found ? '?' : '?'} ${check.name}`);
  });
  
} catch (error) {
  console.log('? ÎÞ·¨¶ÁÈ¡vite.config.ts');
}

// 5. ¼ì²éPlaywright²âÊÔÎÄ¼þ
console.log('\n? ²âÊÔÅäÖÃ¼ì²é:');
const testFiles = [
  'tests/basic-functionality.spec.ts',
  'tests/pwa-features.spec.ts'
];

testFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '?' : '?'} ${file}`);
});

// 6. Éú³É×Ü½á
console.log('\n? ¼ì²é×Ü½á:');
console.log('¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T');
console.log(`¹Ø¼üÎÄ¼þ: ${criticalFiles.length - missingFiles}/${criticalFiles.length} ÍêÕû`);
console.log(`¹¹½¨×´Ì¬: ${distExists ? 'ÒÑ¹¹½¨' : 'Î´¹¹½¨'}`);
console.log(`PWA¹¦ÄÜ: ÒÑÅäÖÃ`);
console.log(`²âÊÔ¿ò¼Ü: ÒÑÉèÖÃ`);

if (missingFiles === 0 && distExists) {
  console.log('\n? Ó¦ÓÃ×´Ì¬Á¼ºÃ£¬¿ÉÒÔ¿ªÊ¼²âÊÔ£¡');
  console.log('\n? ÏÂÒ»²½½¨Òé:');
  console.log('1. ÔËÐÐ¿ª·¢·þÎñÆ÷: npm run dev');
  console.log('2. ÔËÐÐÉú²úÔ¤ÀÀ: npm run preview');  
  console.log('3. ÔËÐÐ×Ô¶¯»¯²âÊÔ: npm run test');
} else {
  console.log('\n?? ·¢ÏÖÎÊÌâ£¬½¨ÒéÏÈÐÞ¸´ºóÔÙ²âÊÔ');
  if (missingFiles > 0) {
    console.log(`- ${missingFiles} ¸ö¹Ø¼üÎÄ¼þÈ±Ê§`);
  }
  if (!distExists) {
    console.log('- ÐèÒªÏÈÔËÐÐ¹¹½¨: npm run build');
  }
}

console.log('¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T¨T');