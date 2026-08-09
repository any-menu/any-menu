// import fs from 'fs';       // ❌ 回调版
import fs from 'fs/promises'; // ✅ Promise 版
import path from 'path';

/** 自定义插件：提供文件操作 API
 * 
 * 功能：
 * pnpm dev 后，所有前端对 `/__api/fs/*` 的 POST 请求都会被 Vite 中间件处理
 * 
 * 文件路径：
 * 所有 relPath 都是相对于 Vite 配置中的 root（即项目根目录）的相对路径
 * 
 * 安全限制：
 * 后端会拒绝通过 .. 穿越到项目根目录外的路径访问
 */
export const viteFileApiPlugin = {
  name: 'vite-file-api',
  configureServer(server) {
    const root = server.config.root; // 项目根目录

    // 安全解析相对路径，禁止访问项目外文件
    function resolveSafe(relPath) {
      if (!relPath) throw new Error('relPath is required');
      const full = path.resolve(root, relPath);

      // if (!full.startsWith(root)) {
      //   throw new Error('Access denied');
      // }
      
      const relative = path.relative(root, full);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error('Access denied');
      }

      return full;
    }

    // 递归读取文件夹
    async function readFolderRecursive(dir, depth) {
      const results = [];
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        // 存储相对路径
        results.push(path.relative(root, full));
        if (entry.isDirectory() && depth > 0) {
          const sub = await readFolderRecursive(full, depth - 1);
          results.push(...sub);
        }
      }
      return results;
    }

    // 拦截 /__api/fs 路径的请求
    server.middlewares.use('/__api/fs', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }

      // 收集请求体
      const chunks = [];
      let action = '<undefined>'
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        try {
          const raw = Buffer.concat(chunks).toString();
          const body = JSON.parse(raw);
          const { relPath, content, is_append, recursion_depth } = body;

          const url = new URL(req.url, `http://${req.headers.host}`);
          action = url.pathname.replace('/__api/fs', '');

          let result;
          switch (action) {
            case '/isFolder': {
              const full = resolveSafe(relPath);
              const stat = await fs.stat(full);
              result = stat.isDirectory();
              break;
            }
            case '/readFile': {
              const full = resolveSafe(relPath);
              result = await fs.readFile(full, 'utf-8');
              break;
            }
            case '/readFolder': {
              const full = resolveSafe(relPath);
              const depth = recursion_depth ?? 0;
              result = await readFolderRecursive(full, depth);
              break;
            }
            case '/writeFile': {
              const full = resolveSafe(relPath);
              // 自动创建目录
              await fs.mkdir(path.dirname(full), { recursive: true });
              if (is_append) {
                await fs.appendFile(full, content);
              } else {
                await fs.writeFile(full, content);
              }
              result = true;
              break;
            }
            case '/deleteFile': {
              const full = resolveSafe(relPath);
              await fs.unlink(full);
              result = true;
              break;
            }
            default:
              next();
              return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: result }));
        } catch (err) {
          console.error(`[/__api/fs${action}] Error:`, err);
          const status = err.message === 'Access denied' ? 403 : 500;
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    });
  }
};
