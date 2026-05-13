/**
 * 插件开发者类型声明包
 * 安装方式: npm install -D anymenu
 *
 * 如果你是脚本/插件开发者，只需阅读此文件即可
 */

/** 插件必须实现的接口 */
export interface PluginInterface {
  /** 元数据 */
  metadata: {
    /** 唯一标识符 */
    id: string;
    /** 脚本版本 */
    version: string;
    /** 宿主应用最低版本要求 */
    min_app_version: string;
    /** 插件名称（不提供则默认为 id） */
    name?: string;
    /** 插件作者 */
    author?: string;
    /** 插件描述 */
    description?: string;
    /**
     * 图标
     * - 支持 lucide 图标名，格式: `"lucide-图标名"`，如 `"lucide-table"`。图标名可于 https://lucide.dev/ 查询
     * - 支持 SVG 字符串（应用前采取 dompurify 安全措施）
     * - 不填时会使用名字默认构造图标
     */
    icon?: string;
    /**
     * CSS 字符串，插件加载时自动注入到 `<head>`，卸载时自动移除。
     * 若使用 TypeScript 模板仓库开发，build 工具会自动将 `.css` 文件内容填入此字段。
     */
    css?: string;
  };

  /**
   * 旧版接口
   * @deprecated 没有 ctx 环境，未来将废弃，请使用 `run` 接口代替
   */
  process?: (str?: string) => Promise<void | string>;

  /**
   * 主入口，点击或选择时触发
   */
  run: (ctx: PluginInterfaceCtx) => Promise<void>;

  /**
   * 插件加载时调用
   * TODO
   *   目前没什么用，应该给他一个 ctx，这样可以加载时就进行注册面板等操作
   *   不过目前还是提倡在 run 内判断首次运行时注册，避免软件启用时就做一大堆操作
   */
  onLoad?: () => void;

  /**
   * 插件卸载时调用
   */
  onUnload?: () => void;
}

/** 插件运行时上下文 */
export interface PluginInterfaceCtx {
  /** 环境信息 */
  env: {
    /** 当前选中文本 */
    selectedText?: string;
    /** 当前平台 */
    platform: 'app' | 'obsidian-plugin' | string;
    /** 当前激活的应用/窗口名称 */
    activeAppName?: string;
    /** 当前文档/页面标题（如浏览器页面标题、Obsidian 笔记名等） */
    activeDocTitle?: string;
    /**
     * 当前文档/页面链接（如浏览器页面 URL、Obsidian 笔记路径等）
     *
     * 目前只支持 Obsidian 环境，App (Tauri) 环境暂未支持
     *   App 端很难获取，UIA 有可能可以但也很麻烦，不一定能拿到
     */
    activeDocUrl?: string;

    /** 仅 Obsidian 环境拥有 */
    obsidian?: {
        plugin: any;
        ctx: any;
    };

    // TODO: 更多环境
    // - miniEditorText?: string;
    // - historySelected (用来连续复制，或模型连续提供上下文时使用)
    // - 当前选中类型 (文件/图片/文字等...)
  }
  /** API 接口 */
  api: {
    /**
     * 输出文本到当前位置，输出结束后自动隐藏（低风险）
     */
    sendText: (str: string) => void;

    /**
     * 保存到剪切板（低风险）
     */
    saveToClipboard: (str: string) => void;

    /**
     * 通知用户（低风险）
     */
    notify: (message: string) => void;

    /**
     * 网络请求（中风险，存在信息泄露风险）
     */
    urlRequest: (conf: UrlRequestConfig) => Promise<UrlResponse | null>;

    /**
     * 读文件（低~高风险）
     * @param basePath 基础路径标识，`CONFIG` 表示配置目录，`PUBLIC` 表示公共目录
     * @param relPath  相对路径，禁止包含 `../` 等路径穿越
     * 
     * TODO 开放任意文件路径的权限，注意禁止 relPath 包含 ../ 等路径穿越
     */
    readFile: (basePath: 'CONFIG' | 'PUBLIC', relPath: string) => Promise<string | null>;

    /**
     * 写文件（低~高风险）
     * @param basePath  基础路径标识
     * @param relPath   相对路径，禁止包含 `../` 等路径穿越
     * @param content   文件内容
     * @param is_append 是否追加写入
     * 
     * TODO 开放任意文件路径的权限，注意禁止 relPath 包含 ../ 等路径穿越
     */
    writeFile: (
      basePath: 'CONFIG' | 'PUBLIC',
      relPath: string,
      content: string,
      is_append?: boolean
    ) => Promise<boolean>;

    /**
     * 隐藏面板（低风险）
     * @param list 不传表示隐藏全部，空列表表示不隐藏子面板只隐藏容器
     */
    hidePanel: (list?: string[]) => void;

    /**
     * 显示面板（低风险）
     * @param list     不传则使用配置的默认列表，空列表不额外显示子面板只显示容器
     * @param position 不填表示沿用之前的位置（推荐）
     */
    showPanel: (list?: string[], position?: 'center' | 'cursor') => void;

    /**
     * 注册子面板（中风险，会注入 HTML 元素），注册后通过 `showPanel` 控制显示/隐藏
     * @param options.id 子面板唯一 ID
     * @param options.el
     *   - `HTMLElement`: 插件直接返回元素
     *   - `(el: HTMLElement) => void`（推荐）: 回调方式，宿主在合适时机传入容器元素
     */
    registerSubPanel: (options: {
      id: string;
      el: HTMLElement | ((el: HTMLElement) => void);
    }) => void;

    /**
     * 注销子面板
     */
    unregisterSubPanel: (id: string) => void;

    // TODO: 
    // - 特定文件访问权限 (低风险)
    // - 全局文件读写权限 (高风险)
    // - cmd 运行权限 (高风险)
    // - 注册多个其他插件，插件组使用。前置: metadata 需要支持插件组类别声明，不会注册到工具栏/多级菜单中
    // 
    // 话说这里要弄权限管理不，如上面那些带风险的接口
    // 然后没有权限的插件调用这些接口时，就会 NOTICE方式提示用户某插件需要，并引导用户自行开启
  }
}

/**
 * 请求配置接口
 */
export interface UrlRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: BodyInit | null;
  isParseJson?: boolean; // 是否尝试将响应解析为 JSON
  // SSE / 流式支持
  isStream?: boolean;                 // 是否启用流式模式
  onChunk?: (chunk: string) => void;  // 每个 SSE chunk 的回调
  onDone?: () => void;                // 流结束回调
}

/**
 * 统一响应接口
 */
export interface UrlResponse {
  code: number; // 0 表示成功, -1 表示失败
  data?: UrlResponseData;
  msg?: string;
}
export interface UrlResponseData {
  text: string;
  json?: any;
  originalResponse: any; // 原始响应对象，用于调试
  // 可能还有 arrayBuffer headers json status text
}
