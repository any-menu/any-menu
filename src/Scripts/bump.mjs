/* 使用: 例如 `pnpm run bump 1.1.5` */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const newVersion = process.argv[2];
if (!newVersion) {
  console.error('❌ 请提供一个新的版本号，例如: pnpm run bump 1.1.5');
  process.exit(1);
}

console.log(`🚀 准备将版本更新至: ${newVersion}\n`);

// 1. 更新 pnpm workspaces 里的版本
try {
  console.log('📦 更新 workspace 子包版本...');
  execSync(`pnpm -r exec pnpm version ${newVersion} --allow-same-version`, { stdio: 'inherit' });
} catch (error) {
  console.error('❌ 执行 pnpm version 失败');
  process.exit(1);
}

// 辅助函数：更新 JSON 文件
function updateJsonFile(filePath) {
  // 注意这里的 '../..'，因为脚本在 src/Scripts 目录下，需要往上退两级到项目根目录
  const fullPath = path.resolve(import.meta.dirname, '../..', filePath);
  if (fs.existsSync(fullPath)) {
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    data.version = newVersion;
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✅ 已更新 ${filePath}`);
  } else {
    console.warn(`⚠️ 找不到文件: ${filePath}`);
  }
}

// 2. 更新 manifest.json
updateJsonFile('manifest.json');

// 3. 更新 tauri.conf.json
updateJsonFile('src/Tauri/src-tauri/tauri.conf.json');

// 4. 更新 Cargo.toml
const cargoTomlPath = path.resolve(import.meta.dirname, '../..', 'src/Tauri/src-tauri/Cargo.toml');
if (fs.existsSync(cargoTomlPath)) {
  let content = fs.readFileSync(cargoTomlPath, 'utf8');
  // 正则匹配：以 version = 开头，只替换第一个匹配项
  content = content.replace(/^version\s*=\s*".*?"/m, `version = "${newVersion}"`);
  fs.writeFileSync(cargoTomlPath, content);
  console.log(`✅ 已更新 src/Tauri/src-tauri/Cargo.toml`);
} else {
  console.warn(`⚠️ 找不到文件: src/Tauri/src-tauri/Cargo.toml`);
}

console.log('\n🎉 所有版本号已成功更新！');
