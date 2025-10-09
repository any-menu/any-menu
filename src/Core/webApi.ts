/**
 * take from: https://github.com/Obsidian-Forge/obsidian-i18n/
 * 然后我去除了obsidian依赖
 * 
 * 也是 api.request 的二次封装
 */

import { global_setting, UrlRequestConfig, UrlResponse } from './setting'

/**
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
    // Ensure plugin data directory exists
    if (!await app.vault.adapter.exists(pluginDataDir)) {
      await app.vault.adapter.mkdir(pluginDataDir);
    }
    const localFiles = new Set((await app.vault.adapter.list(pluginDataDir)).files.map(f => f.split('/').pop()));
  }

  // 获取翻译文件
  public async giteeGetDict(path: string) {
    return await global_setting.api.urlRequest({
      url: `${this.giteeBaseUrl}store/dict/${path}`,
      method: 'GET',
      isParseJson: false
    });
  }

  // #endregion
}
