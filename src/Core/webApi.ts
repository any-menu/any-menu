/**
 * take from: https://github.com/Obsidian-Forge/obsidian-i18n/
 * 然后我去除了obsidian依赖
 * 
 * 也是 api.request 的二次封装
 */

import { global_setting } from './setting'

/**
 * gitee api (二次封装 base api (网络与本地文件读写))
 * 
 * 与后端交互的 API，此处使用了较为节约成本的 gitee 作为存储和交互的服务器
 * 暂时用不上的放后面，并进行了一些分类
 */
export class API {
  giteeOwner = 'any-menu';
  giteeRepo = 'any-menu';
  giteeBranch = 'main';
  giteeBaseUrl = `https://gitee.com/${this.giteeOwner}/${this.giteeRepo}/raw/${this.giteeBranch}/`; // raw是原文本，blob是网页
  giteeBlobUrl = `https://gitee.com/${this.giteeOwner}/${this.giteeRepo}/blob/${this.giteeBranch}/`; // raw是原文本，blob是网页
  giteeApiUrl = `https://gitee.com/api/v5/repos/${this.giteeOwner}/${this.giteeRepo}/`; // 后面的子api一般有: contents issue collaborators releases 等
  
  path = `store/dict/`
  giteeLanguage = 'zh-cn';
  I18N_ADMIN_TOKEN = '';

  constructor() {
  }

  // #region 查 - 词典相关

  // 获取网络目录 (有那些词典可以下载)
  public async giteeGetDirectory() {
    return await global_setting.api.urlRequest({
      url: `${this.giteeBaseUrl}store/directory/dir.json`,
      method: 'GET',
      isParseJson: true
    });
  }

  // 获取本地目录 (已经下载了哪些词典)
  public async localGetDirectory() {
    const ret: string[] = await global_setting.api.readFolder(global_setting.config.dict_paths)
    return ret
  }

  // 获取网络文件内容
  public async giteeGetDict(relPath: string) {
    return await global_setting.api.urlRequest({
      url: `${this.giteeBaseUrl}store/dict/${relPath}`,
      method: 'GET',
      isParseJson: false
    });
  }

  /**
   * 从 Gitee 下载词典文件到本地
   * @param relPath 词典文件的相对路径，例如 'example.json'
   * @returns {Promise<boolean>} 下载并写入成功返回 true，否则返回 false
   */
  public async downloadDict(relPath: string): Promise<boolean> {
    const ret = await this.giteeGetDict(relPath);
    if (ret === null || ret.code !== 0 || !ret.data) {
      console.error(`Failed to download dict from Gitee: ${relPath}`, ret);
      return false;
    }

    return await global_setting.api.writeFile(`${global_setting.config.dict_paths}/${relPath}`, ret.data.text);
  }

  // #endregion
}
