/**
 * @deprecated 旧版 API，弃用。现在用 Core/webApi.ts 代替
 * take from: https://github.com/Obsidian-Forge/obsidian-i18n/
 */

import { RequestUrlParam, requestUrl } from 'obsidian'

/**
 * 与后端交互的 API，此处使用了较为节约成本的 gitee 作为存储和交互的服务器
 * 暂时用不上的放后面，并进行了一些分类
 */
export class API {
  giteeOwner = 'any-menu';
  giteeRepo = 'any-menu';
  giteeBranch = 'main';
  giteeBaseUrl = `https://gitee.com/${this.giteeOwner}/${this.giteeRepo}/raw/${this.giteeBranch}/`; // raw而不是blob，前者是原文本，后者是网页
  giteeApiUrl = `https://gitee.com/api/v5/repos/${this.giteeOwner}/${this.giteeRepo}/`; // 后面的子api一般有: contents issue collaborators releases 等
  
  path = `store/dict/`
  giteeLanguage = 'zh-cn';
  I18N_ADMIN_TOKEN = '';

  constructor() {
  }

  // #region 查 - 词典相关

  // 获取目录
  public async giteeGetDirectory() {
    const RequestUrlParam: RequestUrlParam = {
      url: `${this.giteeBaseUrl}store/directory/dir.json`,
      method: 'GET'
    };
    try {
      const response = await requestUrl(RequestUrlParam); // arrayBuffer headers json status text
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  // 获取翻译文件
  public async giteeGetDict() {
    try {
      const RequestUrlParam: RequestUrlParam = {
        url: `${this.giteeBaseUrl}store/dict/AdQuote.toml`,
        method: 'GET'
      };
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.text };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }
  // 获取翻译文件
  // public async githubGetTranslation(type: string, id: string, version: string) {
  //   try {
  //     const RequestUrlParam: RequestUrlParam = {
  //       url: `https://raw.githubusercontent.com/0011000000110010/obsidian-i18n/refs/heads/${this.giteeBranch}/${type}/dict/${id}/zh-cn/${version}.json`,
  //       method: 'GET'
  //     };
  //     console.log(RequestUrlParam)
  //     const response = await requestUrl(RequestUrlParam);
  //     return { 'code': 0, 'data': response.json };
  //   } catch (error) {
  //     return { 'code': -1, 'msg': error };
  //   }
  // }

  // #endregion

  // #region 查 - 文件

  /** 从 Gitee 下载文件
   * 从 Gitee 下载文件
   * 这个函数通过 Gitee API 下载指定仓库中的文件。
   * @param url 文件在 Gitee 仓库中的相对路径
   * @returns 一个对象，包含状态（state）和数据（data）。如果请求成功，state 为 true，data 为文件内容；如果请求失败，state 为 false，data 为错误信息。
   */
  public async giteeDownload(url: string) {
    try {
      const RequestUrlParam: RequestUrlParam = {
        url: url,
        method: 'GET'
      };
      console.log(RequestUrlParam)
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.text };
    } catch (error) {
      console.log(error)
      return { 'code': -1, 'msg': error };
    }
  }

  /** 从 Gitee 获取文件
   * 从 Gitee 获取文件
   * 这个函数通过 Gitee API 获取指定仓库中的文件内容。
   * @param url 文件在 Gitee 仓库中的相对路径
   * @returns 一个对象，包含状态（state）和数据（data）。如果请求成功，state 为 true，data 为文件内容；如果请求失败，state 为 false，data 为错误信息。
   */
  public async giteeGetFile(url: string) {
    const RequestUrlParam: RequestUrlParam = {
      url: `${this.giteeBaseUrl}${url}`,
      method: 'GET'
    };
    try {
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }

  }

  // #endregion

  // #region 查 - 状态

  public async version() {
    const RequestUrlParam: RequestUrlParam = {
      url: `${this.giteeBaseUrl}version.json`,
      method: 'GET'
    };
    try {
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  // 获取token
  public async giteeGetToken() {
    const RequestUrlParam: RequestUrlParam = {
      url: `${this.giteeBaseUrl}version.json`,
      method: 'GET'
    };
    try {
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json.token };
    } catch (error) {
      console.error('I18N', `token获取失败(如果没有自定义token则无法使用提交功能)\n${error}`);
      return { 'code': -1, 'msg': error };
    }
  }

  /** 贡献者 */
  public async giteeGetContributor() {
    try {
      const RequestUrlParam: RequestUrlParam = {
        url: `${this.giteeBaseUrl}translation/contributor/zh-cn.json`,
        method: 'GET'
      };
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  // #endregion

  // #region 查 - Gitee API
  public async giteeGetSha(path: string) {
    try {
      const RequestUrlParam: RequestUrlParam = {
        url: `${this.giteeApiUrl}contents/${path}`,
        method: 'GET',
        body: JSON.stringify({
          access_token: this.I18N_ADMIN_TOKEN,
          owner: this.giteeOwner,
          repo: this.giteeRepo,
          path: path
        }),
      };
      console.log(RequestUrlParam);
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  public async giteeGetContents(path: string) {
    try {
      const RequestUrlParam: RequestUrlParam = {
        url: `${this.giteeApiUrl}contents/${path}`,
        method: 'GET',
        body: JSON.stringify({ access_token: this.I18N_ADMIN_TOKEN, owner: this.giteeOwner, repo: this.giteeRepo, path: path }),
      };
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  /** 获取 Gitee 仓库的所有 Issue
   * 获取 Gitee 仓库的所有 Issue
   * 这个函数通过 Gitee API 获取指定仓库的所有 Issue 信息。
   * @returns 一个对象，包含状态（state）和数据（data）。如果请求成功，state 为 true，data 为 Issue 列表；如果请求失败，state 为 false，data 为错误信息。
   */
  public async giteeGetAllIssue() {
    const RequestUrlParam: RequestUrlParam = {
      url: `${this.giteeApiUrl}issues`,
      method: 'GET'
    };
    try {
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  /** 获取 Gitee 仓库的特定 Issue
   * 获取 Gitee 仓库的特定 Issue
   * 这个函数通过 Gitee API 获取指定仓库的特定 Issue 信息。
   * @param number Issue 的编号
   * @returns 一个对象，包含状态（state）和数据（data）。如果请求成功，state 为 true，data 为 Issue 信息；如果请求失败，state 为 false，data 为错误信息。
   */
  public async giteeGetIssue(number: string) {
    const RequestUrlParam: RequestUrlParam = {
      url: `${this.giteeApiUrl}issues/${number}`,
      method: 'GET'
    };
    try {
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  /** 异步获取 Gitee 用户信息的函数。
   * 异步获取 Gitee 用户信息的函数。
   * 
   * 该函数通过向 Gitee API 发送 GET 请求来获取当前认证用户的基本信息。
   * 需要在请求头中包含一个有效的 Gitee 访问令牌。
   * @returns 一个对象，包含获取操作的状态和数据。
   */
  public async giteeUser() {
    const RequestUrlParam: RequestUrlParam = {
      url: `https://gitee.com/api/v5/user`,
      method: 'GET',
      headers: {
        'Authorization': `token ${this.I18N_ADMIN_TOKEN}`
      }
    };
    try {
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  /** 检查用户是否是仓库的成员。
   * 检查用户是否是仓库的成员。
   * @param owner 仓库的所有者。
   * @param repo 仓库的名称。
   * @param username 要检查的用户名。
   * @param accessToken 用于身份验证的访问令牌。
   * @returns 一个对象，包含检查结果的状态和数据。
   */
  public async checkUser(username: string) {
    const RequestUrlParam = {
      url: `${this.giteeApiUrl}collaborators/${username}`,
      method: 'GET',
      headers: {
        'Authorization': `token ${this.I18N_ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        owner: this.giteeOwner,
        repo: this.giteeRepo,
        username: username
      })
    };
  
    try {
      const response = await requestUrl(RequestUrlParam);
      if (response.status === 204) {
        return { 'code': 0, 'data': true };
      } else {
        return { 'code': -1, 'msg': false };
      }
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  /** 插件本体最新版本 */
  public async giteeGetReleasesLatest() {
    try {
      const RequestUrlParam: RequestUrlParam = {
        url: `${this.giteeApiUrl}releases/latest`,
        method: 'GET'
      };
      console.log(RequestUrlParam)
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      console.log(error)
      return { 'code': -1, 'msg': error };
    }
  }

  // #endregion

  // #region 写

  /** 创建一个新的 Gitee Issue
   * 创建一个新的 Gitee Issue
   * 这个函数通过 Gitee API 在指定仓库中创建一个新的 Issue。
   * @param title Issue 的标题
   * @param body Issue 的内容
   * @param label Issue 的标签
   * @returns 一个对象，包含状态（state）和数据（data）。如果请求成功，state 为 true，data 为新创建的 Issue 信息；如果请求失败，state 为 false，data 为错误信息。
   */
  // public async giteePostIssue(title: string, body: string, label: string) {
  //   try {
  //     let token;
  //     if (this.settings.I18N_SHARE_TOKEN !== '') {
  //       token = this.settings.I18N_SHARE_TOKEN;
  //     } else {
  //       const tempToken = await this.giteeGetToken();
  //       console.log(tempToken);
  //       token = tempToken.state ? atob(tempToken.data) : '';
  //     }
  //     if (token === '') return;
  //     const RequestUrlParam: RequestUrlParam = {
  //       url: `https://gitee.com/api/v5/repos/${this.geteeOwner}/issues`,
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Charset': 'UTF-8'
  //       },
  //       body: JSON.stringify({
  //         access_token: token,
  //         repo: this.geteeRepo,
  //         title: title,
  //         body: body,
  //         labels: label
  //       }),
  //     };
  //     const response = await requestUrl(RequestUrlParam);
  //     return { 'state': true, 'data': response.json };
  //   } catch (error) {
  //     this.i18n.notice.result('提交操作', false, `${error}`);
  //     return { 'state': false, 'data': error };
  //   }
  // }

  /** 更新 Gitee Issue 的状态
   * 更新 Gitee Issue 的状态
   * 这个函数通过 Gitee API 更新指定仓库中 Issue 的状态。
   * @param number Issue 的编号
   * @param state 要更新的状态
   * @returns 一个对象，包含状态（state）和数据（data）。如果请求成功，state 为 true，data 为更新后的 Issue 信息；如果请求失败，state 为 false，data 为错误信息。
   */
  public async giteePatchIssue(number: string, state: string) {
    const RequestUrlParam: RequestUrlParam = {
      url: `https://gitee.com/api/v5/repos/${this.giteeOwner}/issues/${number}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Charset': 'UTF-8'
      },
      body: JSON.stringify({
        access_token: this.I18N_ADMIN_TOKEN,
        owner: this.giteeOwner,
        repo: this.giteeRepo,
        number: number,
        state: state
      }),
    };
    try {
      const response = await requestUrl(RequestUrlParam);
      return { 'code': 0, 'data': response.json };
    } catch (error) {
      return { 'code': -1, 'msg': error };
    }
  }

  // public async giteePostIssueComments(number: string, body: string) {
  //   try {
  //     let token;
  //     if (this.settings.I18N_SHARE_TOKEN !== '') {
  //       token = this.settings.I18N_SHARE_TOKEN;
  //     } else {
  //       const tempToken = await this.giteeGetToken();
  //       console.log(tempToken);
  //       token = tempToken.state ? atob(tempToken.data) : '';
  //     }
  //     if (token === '') return;
  //     const RequestUrlParam: RequestUrlParam = {
  //       url: `${this.giteeApiUrl}issues/${number}/comments`,
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Charset': 'UTF-8'
  //       },
  //       body: JSON.stringify({
  //         access_token: token,
  //         owner: this.geteeOwner,
  //         repo: this.geteeRepo,
  //         number: number,
  //         body: body
  //       }),
  //     };
  //     const response = await requestUrl(RequestUrlParam);
  //     return { 'code': 0, 'data': response.json };
  //   } catch (error) {
  //     return { 'code': -1, 'msg': error };
  //   }
  // }

  /** 异步创建或更新 Gitee 仓库中的文件内容。
   * 异步创建或更新 Gitee 仓库中的文件内容。
   * @param path 要创建或更新的文件的路径。
   * @param content 新的文件内容，经过Base64编码。
   * @param message 提交信息，描述本次创建或更新的内容。
   * @returns 一个对象，包含操作的状态和数据。
   */
  // public async giteeCreateFileContent(path: string, content: string, message: string) {
  //   // 构建请求参数对象
  //   const RequestUrlParam: RequestUrlParam = {
  //     url: `${this.giteeApiUrl}contents/${path}`,
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'charset': 'UTF-8'
  //     },
  //     // 构建请求体，包含必要的认证和文件信息
  //     body: JSON.stringify({
  //       access_token: this.settings.I18N_ADMIN_TOKEN,
  //       owner: this.geteeOwner,
  //       repo: this.geteeRepo,
  //       path: path,
  //       content: content,
  //       message: message
  //     }),
  //   };
  //   try {
  //     const response = await requestUrl(RequestUrlParam);
  //     return { 'code': 0, 'data': response.json };
  //   } catch (error) {
  //     return { 'code': -1, 'msg': error };
  //   }
  // }

  /** 异步更新 Gitee 仓库中指定路径的文件内容。
   * 异步更新 Gitee 仓库中指定路径的文件内容。
   * @param path 要更新的文件的路径。
   * @param content 新的文件内容，经过Base64编码。
   * @param sha 文件的最新提交哈希值，用于验证和更新。
   * @param message 提交信息，描述本次更新的内容。
   * @returns 一个对象，包含更新操作的状态和数据。
   */
  // public async giteeUpdateFileContent(path: string, content: string, sha: string, message: string) {
  //   const RequestUrlParam: RequestUrlParam = {
  //     url: `${this.giteeApiUrl}contents/${path}`,
  //     method: 'PUT',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Charset': 'UTF-8'
  //     },
  //     body: JSON.stringify({
  //       access_token: this.i18n.settings.I18N_ADMIN_TOKEN,
  //       owner: this.geteeOwner,
  //       repo: this.geteeRepo,
  //       content: content,
  //       sha: sha,
  //       message: message
  //     })
  //   };
  //   try {
  //     const response = await requestUrl(RequestUrlParam);
  //     return { 'code': 0, 'data': response.json };
  //   } catch (error) {
  //     return { 'code': -1, 'msg': error };
  //   }
  // }

  // #endregion
}
