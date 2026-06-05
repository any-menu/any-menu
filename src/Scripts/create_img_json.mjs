/*
需求记录

编写一个 ejs 脚本，可以通过 node 直接运行。

可以带命令，如 `node create_dict.js H:\...\yuexinmao-img-dict`

该脚本的功能：

- 遍历该文件夹下所有的 .jpg .png .gif 文件，并生成用于索引这些内容的 json 文件。
- 生成的 json 文件会位于该文件夹下，名为 `<文件夹名>.img.json`
- json 格式为 `{"path": "相对目标路径", "keyword": "文件名(无后缀)"}[]`。最好可以该列表项中每个json为一行，不但可以大大减少行数，还能很方便人类阅读和修改。
- 脚本除了可以单独使用 node 运行，后续可能还会被简单修改/不修改，用于我项目中的软件指令。而我项目中使用的是 `import ... from ...` 的规范，所以让你生成 es 规范的 js。一是更现代化，二是避免后期混用时修改规范/让规范共存时的设置麻烦。
 */

/* 使用: 例如 `node src/Scripts/create_img_json.mjs H:\...\yuexinmao-img-dict` */

import fs from 'node:fs/promises';
import path from 'node:path';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.png', '.gif']);

/** 遍历文件夹，返回所有图片文件的路径 */
async function walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walkDir(fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

/** 将目标路径转换为相对于基准路径的 Unix 风格路径 */
function toRelativeUnixPath(baseDir, targetPath) {
  return path.relative(baseDir, targetPath).split(path.sep).join('/');
}

/** 从数据生成json文本。每个json占一行，且整体是一个数组 */
function buildJsonText(items) {
  if (items.length === 0) {
    return '[]\n';
  }
  return `[\n${items.map(item => JSON.stringify(item)).join(',\n')}\n]\n`;
}

async function main() {
  // 获取目标文件夹
  const targetDirArg = process.argv[2];
  if (!targetDirArg) {
    console.error('用法: node <脚本路径>/create_img_json.mjs <目标文件夹路径>');
    process.exit(1);
  }
  const targetDir = path.resolve(targetDirArg);

  // 验证目标文件夹
  let stat;
  try {
    stat = await fs.stat(targetDir);
  } catch {
    console.error(`目标路径不存在: ${targetDir}`);
    process.exit(1);
  }
  if (!stat.isDirectory()) {
    console.error(`目标路径不是文件夹: ${targetDir}`);
    process.exit(1);
  }

  // 基本参数
  const folderName = path.basename(targetDir);
  const outputPath = path.join(targetDir, `${folderName}.img.json`);

  // 遍历并得到数据，并美化数据
  const imageFiles = await walkDir(targetDir);
  const items = imageFiles
    .filter(file => path.resolve(file) !== path.resolve(outputPath))
    .map(file => ({
      path: toRelativeUnixPath(targetDir, file),
      keyword: path.basename(file, path.extname(file)),
    }))
    .sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'));

  // 从数据生成 json 并写入文件
  const jsonText = buildJsonText(items);
  await fs.writeFile(outputPath, jsonText, 'utf8');

  console.log(`已生成: ${outputPath}`);
  console.log(`共索引 ${items.length} 个图片文件`);
}

main().catch(err => {
  console.error('执行失败:');
  console.error(err);
  process.exit(1);
});
