/**
 * 这里采用的 api 实现是 OPFS
 * 优点：无后端 + 持久化，除了适合快速本地调试，还适合线上演示
 */

import { global_setting } from "../../../Core/shared/setting";

export async function initApi() {
  global_setting.platform = 'browser'

  // #region OPFS 准备

  // 获取 OPFS 根目录句柄
  const root = await navigator.storage.getDirectory();

  /* ---------- 路径与句柄工具 ---------- */

  // 将相对路径拆分为段（自动忽略空段和首尾 '/'）
  const splitPath = (relPath: string): string[] =>
    relPath.split('/').filter(seg => seg.length > 0);

  // 逐级获取目录句柄。create = true 时自动创建不存在的目录。
  const getDirectoryHandle = async (
    segments: string[],
    create = false
  ): Promise<FileSystemDirectoryHandle | null> => {
    let current = root;
    for (const seg of segments) {
      try {
        current = await current.getDirectoryHandle(seg, { create });
      } catch {
        return null;
      }
    }
    return current;
  };

  // 获取文件句柄。create = true 时会自动创建父目录及文件本身。
  const getFileHandle = async (
    relPath: string,
    create = false
  ): Promise<FileSystemFileHandle | null> => {
    const segments = splitPath(relPath);
    if (segments.length === 0) return null;   // 根目录不能视为文件
    const dirSegments = segments.slice(0, -1);
    const fileName = segments[segments.length - 1];
    const dirHandle = await getDirectoryHandle(dirSegments, create);
    if (!dirHandle) return null;
    try {
      return await dirHandle.getFileHandle(fileName, { create });
    } catch {
      return null;
    }
  };

  // #endregion

  global_setting.api.readFolder = async (relPath: string, recursion_depth?: number): Promise<string[]> => {
    const segments = splitPath(relPath);
    const dirHandle = await getDirectoryHandle(segments, false);
    if (!dirHandle) return [];

    const depth = recursion_depth ?? 1;       // 默认仅直接子项
    const result: string[] = [];

    const collect = async (
      handle: FileSystemDirectoryHandle,
      prefix: string,
      level: number
    ) => {
      if (level > depth) return;
      for await (const [name, child] of (handle as any).entries()) {
        const childPath = prefix ? `${prefix}/${name}` : name;
        if (child.kind === 'file') {
          result.push(childPath);
        } else if (child.kind === 'directory') {
          // 目录本身也作为条目返回
          result.push(childPath);
          // 若未达到深度限制则继续递归
          if (level < depth) {
            await collect(child, childPath, level + 1);
          }
        }
      }
    };

    await collect(dirHandle, '', 1);
    return result;
  }

  global_setting.api.readFile = async (relPath: string): Promise<string | null> => {
    const fileHandle = await getFileHandle(relPath, false);
    if (!fileHandle) return null;
    try {
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      return null;
    }
  }

  global_setting.api.writeFile = async (relPath: string, content: string, isAppend?: boolean): Promise<boolean> => {
    try {
      const fileHandle = await getFileHandle(relPath, true);
      if (!fileHandle) return false;

      let finalContent = content;
      if (isAppend) {
        const existing = await global_setting.api.readFile(relPath);
        finalContent = (existing ?? '') + content;
      }

      const writable = await fileHandle.createWritable();
      await writable.write(finalContent);
      await writable.close();
      return true;
    } catch (e) {
      console.error('OPFS writeFile error:', e);
      return false;
    }
  }
}
