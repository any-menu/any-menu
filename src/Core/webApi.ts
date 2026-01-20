/**
 * gitee/github api
 * 
 * take from: https://github.com/Obsidian-Forge/obsidian-i18n/
 * 然后我去除了obsidian依赖
 * 
 * 也是 api.request 的二次封装
 */

import { global_setting } from './setting'

/**
 * gitee/github api (二次封装 base api (网络与本地文件读写))
 * 
 * 与后端交互的 API，此处使用了较为节约成本的 gitee 作为存储和交互的服务器
 * 暂时用不上的放后面，并进行了一些分类
 * 
 * 注意: apiUrl 或加 token，通常有更高的速度 (1000次/h) 和访问次数，普通 url 则很容易出现 403
 */
export class API {
  giteeOwner = 'any-menu';
  giteeRepo = 'any-menu';
  giteeBranch = 'main';

  // gitee 相关
  giteeBaseUrl = `https://gitee.com/${this.giteeOwner}/${this.giteeRepo}/raw/${this.giteeBranch}/`; // raw是原文本，blob是网页
  giteeBlobUrl = `https://gitee.com/${this.giteeOwner}/${this.giteeRepo}/blob/${this.giteeBranch}/`; // raw是原文本，blob是网页
  giteeApiUrl = `https://gitee.com/api/v5/repos/${this.giteeOwner}/${this.giteeRepo}/`;
  // 后面的子api一般有: contents issue collaborators releases raw 等，见: https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoRawPath
  // https://gitee.com/api/v5/repos/{owner}/{repo}/raw/{path}  
  giteeToken: string|null = '6ca4bf01f660cc1b4fdc98f14aaff4f9'; // onlyReadApi x

  // 弃用
  // path = `store/dict/`
  // giteeLanguage = 'zh-cn';
  // I18N_ADMIN_TOKEN = '';

  constructor() {}

  /// 获取网络目录 (有那些词典可以下载)
  public async giteeGetDirectory() {
    return await global_setting.api.urlRequest({
      url: `${this.giteeBaseUrl}store/directory/dir.json`,
      method: 'GET',
      ...(!this.giteeToken ? {} : { headers: {
        "Authorization": `Bearer ${this.giteeToken}`
      }}),
      isParseJson: true
    });
  }

  /// 获取网络文件内容
  public async giteeGetDict(relPath: string) {
    return await global_setting.api.urlRequest({
      url: `${this.giteeBaseUrl}store/dict/${relPath}`,
      method: 'GET',
      ...(!this.giteeToken ? {} : { headers: {
        "Authorization": `Bearer ${this.giteeToken}`
      }}),
      isParseJson: false,
    });
  }

  /// 获取网络目录 (有那些词典可以下载)
  public async giteeGetDirectory3() {
    const res = await global_setting.api.urlRequest({
      url: `${this.giteeApiUrl}contents/store/directory/dir.json?ref=${this.giteeBranch}`,
      method: 'GET',
      ...(!this.giteeToken ? {} : { headers: {
        "Authorization": `Bearer ${this.giteeToken}`
      }}),
      isParseJson: true,
    })

    if (global_setting.isDebug) console.log('giteeGetDirectory3 res', res)

    // if (res && res.data && res.data.text) {
    //   // Gitee API returns content base64 encoded, so we need to decode it.
    //   // Assuming global_setting.api.base64Decode exists and works with ArrayBuffer.
    //   // The result of base64Decode should be a string to be parsed as JSON.
    //   const decodedContent = global_setting.api.base64Decode(res.data.text);
    //   try {
    //     res.data = JSON.parse(decodedContent);
    //   } catch (e) {
    //     console.error("Failed to parse decoded directory content", e);
    //     res.code = -1; // Indicate failure
    //     res.data = null;
    //   }
    // }
    return res;
  }

  /// 获取网络文件内容
  public async giteeGetDict3(relPath: string) {
    const res = await global_setting.api.urlRequest({
      url: `${this.giteeApiUrl}contents/store/dict/${relPath}?ref=${this.giteeBranch}`,
      method: 'GET',
      ...(!this.giteeToken ? {} : { headers: {
        "Authorization": `Bearer ${this.giteeToken}`
      }}),
      isParseJson: true // The API response is JSON
    })

    if (global_setting.isDebug) console.log('giteeGetDict3 res', res)

    // if (res && res.data && res.data.content) {
    //   // Content is base64 encoded
    //   const decodedContent = global_setting.api.base64Decode(res.data.content);
    //   // The original giteeGetDict returned a raw text string, so we simulate that.
    //   // The wrapper object from urlRequest is modified to contain the decoded text.
    //   if (res.data.text === undefined) {
    //       res.data.text = decodedContent;
    //   }
    // } else if (res && res.code === 0 && !res.data) {
    //     // Handle case where file might be empty
    //     res.data = { text: '' };
    // }
    return res;
  }

  /// 获取本地目录 (已经下载了哪些词典)
  public async localGetDirectory() {
    const ret: string[] = await global_setting.api.readFolder(global_setting.config.dict_paths)
    return ret
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

    return await global_setting.api.writeFile(`${global_setting.config.dict_paths}${relPath}`, ret.data.text);
  }

}
