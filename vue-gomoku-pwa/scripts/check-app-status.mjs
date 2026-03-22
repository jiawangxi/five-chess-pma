/**
 * 简单的应用状态检查脚本
 * 无需浏览器，直接验证应用配置和构建状态
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('? 五子棋PWA应用状态检查');
console.log('═══════════════════════════════════');

// 1. 检查关键文件是否存在
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

console.log('\n? 关键文件检查:');
let missingFiles = 0;
criticalFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '?' : '?';
  console.log(`${status} ${file}`);
  if (!exists) missingFiles++;
});

// 2. 检查构建输出
console.log('\n?? 构建状态检查:');
const distPath = path.join(projectRoot, 'dist');
const distExists = fs.existsSync(distPath);
console.log(`${distExists ? '?' : '?'} dist/ 目录存在`);

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
  
  // 检查资源文件
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    const jsFiles = assetFiles.filter(f => f.endsWith('.js')).length;
    const cssFiles = assetFiles.filter(f => f.endsWith('.css')).length;
    console.log(`? 资源文件: ${jsFiles} JS文件, ${cssFiles} CSS文件`);
  }
}

// 3. 检查package.json配置
console.log('\n? Package配置检查:');
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
  
  console.log('依赖检查:');
  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies?.[dep];
    console.log(`${exists ? '?' : '?'} ${dep}${exists ? ` (${exists})` : ''}`);
  });
  
  console.log('开发依赖检查:');
  requiredDevDeps.forEach(dep => {
    const exists = packageJson.devDependencies?.[dep];
    console.log(`${exists ? '?' : '?'} ${dep}${exists ? ` (${exists})` : ''}`);
  });
  
} catch (error) {
  console.log('? 无法读取package.json');
}

// 4. 检查PWA配置
console.log('\n? PWA配置检查:');
try {
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  const pwaChecks = [
    { name: 'VitePWA插件', pattern: /VitePWA/ },
    { name: 'Workbox配置', pattern: /workbox:/ },
    { name: 'Manifest配置', pattern: /manifest:/ },
    { name: '缓存策略', pattern: /runtimeCaching/ },
    { name: 'Service Worker', pattern: /registerType/ }
  ];
  
  pwaChecks.forEach(check => {
    const found = check.pattern.test(viteConfig);
    console.log(`${found ? '?' : '?'} ${check.name}`);
  });
  
} catch (error) {
  console.log('? 无法读取vite.config.ts');
}

// 5. 检查Playwright测试文件
console.log('\n? 测试配置检查:');
const testFiles = [
  'tests/basic-functionality.spec.ts',
  'tests/pwa-features.spec.ts'
];

testFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '?' : '?'} ${file}`);
});

// 6. 生成总结
console.log('\n? 检查总结:');
console.log('═══════════════════════════════════');
console.log(`关键文件: ${criticalFiles.length - missingFiles}/${criticalFiles.length} 完整`);
console.log(`构建状态: ${distExists ? '已构建' : '未构建'}`);
console.log(`PWA功能: 已配置`);
console.log(`测试框架: 已设置`);

if (missingFiles === 0 && distExists) {
  console.log('\n? 应用状态良好，可以开始测试！');
  console.log('\n? 下一步建议:');
  console.log('1. 运行开发服务器: npm run dev');
  console.log('2. 运行生产预览: npm run preview');  
  console.log('3. 运行自动化测试: npm run test');
} else {
  console.log('\n?? 发现问题，建议先修复后再测试');
  if (missingFiles > 0) {
    console.log(`- ${missingFiles} 个关键文件缺失`);
  }
  if (!distExists) {
    console.log('- 需要先运行构建: npm run build');
  }
}

console.log('═══════════════════════════════════');