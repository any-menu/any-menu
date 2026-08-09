/**
 * 插件开发者类型声明包
 * 安装方式: npm install -D anymenu
 *
 * 如果你是脚本/插件开发者，只需阅读此文件即可
 */

/** 插件必须实现的接口 */
export interface PluginInterface {
  /* 
   * 该成员存在，当不放类型里
   * 
   * 不要赋值。插件加载时会自动填充，方便插件访问。
   * 亦同 onLoad 方法给的那个参数，不使用这个也没有问题。
   * 这个只是方便使用的语法糖而已
   */
  app?: PluginAppCtx

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

  /*
   * 旧版接口
   * @deprecated 没有 ctx 环境，未来将废弃，请使用 `run` 接口代替
   *
  process?: (str?: string) => Promise<void | string>;*/

  /**
   * 主入口，点击或选择时触发
   */
  run: (runCtx: PluginRunCtx) => Promise<void>;

  /*
   * 算了，感觉还是直接 callback 给按钮对象让绑定比较方便。
   * 虽然容易被滥用，但仔细一想。用户一样可以通过 document 暴力去找到按钮并控制。限制意义不大
   * 
   * 注册事件回调
   * @param event 事件名称，预定义事件包括但不限于:
   *   - 按钮类 (仅限工具栏按钮，不包含菜单项)
   *     - `onRun`: 等同于 run
   *     - `click`: 右键点击时触发，参数为点击位置和目标元素等信息
   *     - `createBtn`: 按钮创建后触发
   *   - 全局类
   *     - `onPanelShow`: 面板显示时触发
   *     - `onPanelHide`: 面板隐藏时触发
   *     - `onSubPanelShow:子面板ID`: 子面板显示时触发
   *     - `onSubPanelHide:子面板ID`: 子面板隐藏时触发
   *     - `onConfigChange:配置项ID`: 配置项修改时触发
   *     - `onAppEvent:事件名称`: 宿主应用事件（如 Obsidian 的 workspace events）触发时触发
   * @param callback 事件回调函数，参数根据事件类型不同而不同，具体见文档说明
   *
  registerEvent: (event: string, callback: (...args: any[]) => void) => void;
   */

  /**
   * 面板中该脚本的项被创建时调用
   * 
   * @version 1.1.11 新增
   * 
   * TODO 可以移至 AppCtx 中的 registerEvent 方法里，然后这里保留为语法糖
   *   本质上 run 和 onCreateItem 都可以通过 registerEvent 方法进行声明
   */
  onCreateItem?: (el: HTMLElement, ctx: PluginRunCtx) => void;

  /**
   * 插件加载时调用
   * 
   * @param app 全局上下文
   */
  onLoad?: (app: PluginAppCtx) => void;

  /**
   * 插件卸载时调用
   */
  onUnload?: () => void;
}

/** 插件运行时上下文 */
export interface PluginRunCtx {
  /** 环境信息 */
  env: {
    /** 当前选中文本 */
    selectedText?: string
    /** 当前激活的应用/窗口名称 */
    activeAppName?: string
    /** 当前文档/页面标题（如浏览器页面标题、Obsidian 笔记名等） */
    activeDocTitle?: string
    /**
     * 当前文档/页面链接（如浏览器页面 URL、Obsidian 笔记路径等）
     *
     * 目前只支持 Obsidian 环境，App (Tauri) 环境暂未支持
     *   App 端很难获取，UIA 有可能可以但也很麻烦，不一定能拿到
     */
    activeDocUrl?: string

    // TODO: 更多环境
    // - miniEditorText?: string;
    // - historySelected (用来连续复制，或模型连续提供上下文时使用)
    // - 当前选中类型 (文件/图片/文字等...)
  },
}

/** 插件全局上下文
 * 
 * 主要是仅 get 方法、静态的、任何插件任何情景中，这部分的上下文不变
 */
export interface PluginAppCtx {
  env: {
    /** 当前平台 */
    platform: 'app' | 'obsidian-plugin' | string;
    /** 仅 Obsidian 环境拥有 */
    obsidian?: {
      plugin: any; // 仅 obsidian 环境拥有。类型同 import type { Plugin } from "obsidian"
      // app, 略，plugin.app 获取就好
      ctx: any;
    };
    pluginName: string;
    pluginId: string;
  },
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
     * @param basePath 基础路径标识
     *   - `CONFIG` | 表示配置目录
     *   - `PUBLIC` | 表示公共资源目录
     *   - `CACHE`  | (default) 表示缓存目录
     * @param relPath  相对路径，禁止包含 `../` 等路径穿越
     * 
     * TODO 开放任意文件路径的权限，注意禁止 relPath 包含 ../ 等路径穿越
     */
    readFile: (path?: {
      relPath: string,
      basePath?: 'CACHE' | 'NOTE' | 'DICT'
    }) => Promise<string | null>;

    /**
     * 写文件（低~高风险）
     * @param basePath  基础路径标识 (详见 readFile 函数说明)
     * @param relPath   相对路径，禁止包含 `../` 等路径穿越
     * @param content   文件内容
     * @param is_append 是否追加写入
     * 
     * TODO 开放任意文件路径的权限，注意禁止 relPath 包含 ../ 等路径穿越
     */
    writeFile: (
      content: string,
      path?: {
        relPath: string,
        basePath?: 'CACHE' | 'NOTE' | 'DICT'
      },
      is_append?: boolean,
    ) => Promise<boolean>;

    // TODO event 还可以完善: 语法糖 (双击、右击)
    // 补充: onCreateItem 是 registerEvent 的语法糖，run 其实又是 onCreateItem 的语法糖
    //   如果你的任务相对简单，可以直接使用这两个语法糖
    // registerEvent: (event: 'createItem'|'run') => Promise<void>

    // #region 面板相关

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
     * 切换面板的显示/隐藏状态（低风险）
     * 
     * 基本同 hidePanel 和 showPanel
     */
    togglePanel: (item: string) => void;

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

    // #endregion

    // TODO: 
    // - 特定文件访问权限 (低风险)
    // - 全局文件读写权限 (高风险)
    // - cmd 运行权限 (高风险)
    // - 注册多个其他插件，插件组使用。前置: metadata 需要支持插件组类别声明，不会注册到工具栏/多级菜单中
    // 
    // 话说这里要弄权限管理不，如上面那些带风险的接口
    // 然后没有权限的插件调用这些接口时，就会 NOTICE方式提示用户某插件需要，并引导用户自行开启
  };
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

/**
 * 面板上的功能项的定义
 * 
 * 同时也是 toml 扩展名内容的格式
 * 
 * ## 作为面板上的功能项
 * 
 * 统一将不同的来源整合成相同的结果。来源可能是:
 * - 各种词典 (json / yaml / toml)。TODO json/yaml 未支持，需支持一下
 *   - md 类型 (txt一定是md类型 (纯文本类型也行，目前不区分这两))
 *   - command_ob 类型，会转义为执行 ob 命令
 * - 插件 (js)
 * - 注意 csv / txt 不走这里，不会仅面板显示，只走数据库
 */
export interface PanelItem {
  /// 显示名。众多别名/匹配名中的主名称
  label: string
  /** 详见 PluginInterface.metadata.icon 注释，此处的 string 使用前记得 DOMPurify 处理 */
  icon?: string
  /**
   * 现用法:
   * 在字典中表示 callback 的类型
   * 
   * 旧用法:
   * 悬浮时展示说明 (为安全起见，目前仅支持图片链接而非任意html)。
   * 话说如果不包含用例，像ob环境，直接渲染岂不是更好?
   */
  detail?: string

  /// 匹配名，显示名的多个别名、匹配增强名、拼音等
  /// (不是id)
  key?: string
  /** 用于控制其项的排序，越小越靠前，默认为 1000 */
  order?: number
  /** 
   * 多级菜单中的子菜单项
   * - 目前仅菜单栏支持多级菜单，工具栏不支持
   * - 仅 json/yaml/toml 来源支持声明多级菜单，txt 和 js 不支持
   */
  children?: PanelItem[]

  // output_string 与 plugin 互斥，有且仅有一个，另一个为未定义
  // 通常分别为 toml 和 js 定义的面板功能项

  /**
   * exec_type
   * exec_content 根据 exec_type 的不同，表示不同，exec_type 为:
   * - script     | 则 content 为脚本 id。可选通过 id 找到脚本并执行其 run 方法。
   *                但一般情况下会有 plugin 的冗余字段存在，用那个更好。
   * - string     | 输出对应文本
   * - md         | 同 string, 只是声明这是个 md 内容 (即可选使用 md 渲染的方式预览内容)
   * - path       | 输出对应 path/url 的文件 (一般是图片路径，通过剪切板黏贴出来)
   * - command_ob | 仅 obsidian 环境生效，执行 obsidian 命令
   * 
   * 补充: 旧版会使用 detail 来表示 command_ob；
   * 旧版会使用搜索框的特殊标识来表示图片/文件路径
   */
  type?: "script"|"string"|"md"|"path"|"command_ob"|"folder"
  content?: string

  // (仅插件创建的项才有，词典等其他方式创建时这里是未定义)
  plugin?: PluginInterface

  // 下面内容均为废弃项
  /*
    * 执行该项
    * - 字符串: 输出该字符串，一般用于词典。方便声明demo模板
    * - 函数: 自定义回调，一般用于自定义脚本
    * 
    * 废弃，且没有 string 类型的可能
    */
  // callback?: string | PluginInterface_run
  /*
    * 仅脚本支持的部分
    * 
    * 这里的 string 类型是无效的 (应去掉)，放这里只是为了避免 toml_parse 转该类型时编辑器报错
    * 
    * 废弃
    */
  // onCreateItem_callback?: string | PluginInterface_onCreateItem
}

/** 加载过的插件的元数据缓存
 * (基本同 PluginInterface.metadata, icon 和 css 不要)
 * 
 * 同时 `Map<path, MetadataCache>` 也是 cache_plugin_meta.json 文件内容的格式
 */
export interface MetadataCache {
  id: string;
  version: string;
  min_app_version: string;
  name?: string;
  author?: string;
  description?: string;
}
