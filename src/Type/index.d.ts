/**
 * 插件开发者类型声明包
 * 安装方式: npm install -D anymenu
 *
 * 如果你是脚本/插件开发者，只需阅读此文件即可
 */

// 不要给全局 app，每个插件 app 的应独立。
// 例如插件 id 和插件名的获取、例如权限控制。
// 
// declare global {
//   // eslint-disable-next-line no-var
//   var app: PluginAppCtx;
// }

/** 插件必须实现的接口 (接口/类二选一) */
export interface PluginInterface {
  /* 
   * 该成员存在，当不放类型里
   * 
   * 不要赋值。插件加载时会自动填充，方便插件访问。
   * 亦同 onLoad 方法给的那个参数，不使用这个也没有问题。
   * 这个只是方便使用的语法糖而已
   * 
   * 缺点: 插件每次使用都要判空 `app?.xxx`
   */
  app?: PluginAppCtx;

  /** 元数据 */
  metadata: PluginMetadata;

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

/** 插件必须实现的类 (接口/类二选一)
 * @deprecated 暂废弃，不支持。
 *   Type/` 导入非 type 的行为，与使用 Blob 加载插件的行为，相冲突
 */
export abstract class PluginBase implements PluginInterface {
  // 由加载器自动注入
  app: PluginAppCtx;

  // 必须由用户提供
  abstract metadata: PluginMetadata;

  abstract run(runCtx: PluginRunCtx): Promise<void>;

  onCreateItem(el: HTMLElement, ctx: PluginRunCtx): void;

  onLoad(app: PluginAppCtx): void;

  onUnload(): void;
}

export interface PluginMetadata {
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
}

/** 插件运行时上下文
 * (一些软件/插件运行期间会频繁变化的东西)
 */
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
  editorApi?: EditorApi
}

/** 插件全局上下文
 * 
 * 主要是仅 get 方法、静态的、任何插件任何情景中，这部分的上下文不变
 */
export interface PluginAppCtx {
  env: {
    /** 当前平台 */
    platform: 'app' | 'obsidian-plugin' | string,
    /** 仅 Obsidian 环境拥有 */
    obsidian?: {
      plugin: any, // 仅 obsidian 环境拥有。类型同 import type { Plugin } from "obsidian"
      // app, 略，plugin.app 获取就好
      ctx: any,
    };
    pluginName: string;
    pluginId: string;
  },

  /** 常用通用 API 接口 */
  api: {
    /**
     * 主动获取运行时的上下文 (低风险)
     * 
     * 如可能，请使用 run 函数自带的 ctx 参数，而非从这里调用
     */
    getRunCtx: () => PluginRunCtx | null;

    /**
     * 主动获取运行时的编辑器环境与 api (低风险)
     */
    getEditorApi: null | (() => EditorApi | null);

    /**
     * 输出文本到当前位置，输出结束后自动隐藏（低风险）
     * 
     * 额外功能:
     * - 编辑器版本:
     *   - 选中文本并转化输出: 输出后应自动选中新内容并更新选中状态 (文本、范围、位置等)
     *   - 无输出模板: 输出后不自动选中
     * - 非编辑器版本: 输出后不自动选中 (也无法)
     * 
     * @returns
     *   - 编辑器版本: 可判断输出成功则 true，失败 false
     *   - 非编辑器版本: 通常返回 null 表示无法判断是否成功
     */
    sendText: (str: string) => Promise<boolean | null>;

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
     * @param is_append 是否追加写入 @default false
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
  },

  /** 模块 API 接口 (v1.2.5 新增，开发中)
   * 
   * ## 模块拆分系统
   * 
   * 一是分类后更简洁和易用
   * 二是可以做自动权限管理和标签管理
   *   - 标注类型: 插件是什么类型的插件 (作用于哪些模块)，方便用于搜索自己喜欢的插件
   *   - 权限限制: 插件声明权限后，才会给插件相关的上下文 api，否则不给。(所有插件的 global app 环境都是独立的，这点与 ob 不同)
   *   - 标注平台: 例如如果是使用了 editor 和 ob_editor 的插件，有可能做了多平台适配或仅编辑器适配。
   * 三是方便以后新增更多的模块，甚至允许插件定义模块，插件依赖/扩展其他插件的情况
   *   - 明确插件依赖图 (有可能存在多依赖，所以不是树，是单向有环图)
   *   - 插件依赖插件系统 (模块/插件可以自己去定义模块接口，所以可能会出现插件依赖插件的情况)
   * 
   * ## 默认依赖图
   * 
   * - 通用 api
   *   - 文本处理器 (editor 类)
   *     - ... (这里可能有多个分支，ob / ty / app / 内部编辑器)
   *   - 数据库模块 (搜索系统会使用。会有两个依赖于此的面板，搜索面板 & 数据库后台管理面板)
   *   - 文件管理器 (未开发) (依赖 文件IO，，包括常用的文件工具)
   *   - 插件管理器 (依赖 网络IO+文件IO，进行插件的状态管理)
   *   - 剪切板管理器 (未开发) (类似 quick-clipboard 软件)
   *   - 窗口管理器 (未开发) (包括窗口名，窗口类，窗口内容 (仅少数窗口可) 等)
   *   - 面板管理器 (TODO 当前 titlebar 那个的实现逻辑应该改为悬浮显示面板管理器)
   *     - 按位置分类: 快速面板、悬浮面板、独立面板、设置面板、……
   *     - 按功能分类: 编辑器面板、文件管理面板、剪切板面板、……
   * 
   * ## 模块分类
   * 
   * 例如，`面板模块` 为一大类。不提供核心功能，而是依赖核心功能创建可视化面板，来方便利用核心功能。
   * 
   * 但好像意义不大，太多复合类别的东西了
   */
  modules?: {
    // 通用 IO (文件/网络等)
    // TODO 思考: 文件IO 和网络IO
    // - 若拆分，则利于权限管理
    // - 若不拆分，则更整洁，避免模块类别过多
    // - 或者二次分类，可能会比较好
    io: {
      readFile: typeof this.api.readFile,
      writeFile: typeof this.api.readFile,
      urlRequest: typeof this.api.urlRequest,
      // TODO 加密存写系统
    },

    // 光标系统
    cursor: {
      sendText: typeof this.api.sendText,
      saveToClipboard: typeof this.api.saveToClipboard,
    },

    // 数据库系统
    // TODO 这个也弄一个 debug 管理面板出来
    db: {
      add_data_by_json: (json: {key: string, name?: string, value: string}[]) => void,
      call_command: (script_id: string) => void,
    },

    // (仅特定环境?) 剪切板管理系统
    // TODO 可视化面板
    clipboard: {
    },

    // (仅特定环境) 编辑器系统 (外部编辑器 & 内置编辑器应该都能用)
    editor: {
      getEditorApi: typeof this.api.getEditorApi,
    },

    // (仅特定环境) obsidian 编辑器系统
    editor_ob: {
      plugin: any; // 仅 obsidian 环境拥有。类型同 import type { Plugin } from "obsidian"
      ctx: any;
    },

    // (仅特定环境?) 窗口环境
    window: {
      getRunCtx: typeof this.api.getRunCtx,
    },

    // ------------------ 面板类模块 ------------------

    // 自定义面板模块。TODO 需区分悬浮面板、常驻面板、弹窗面板、设置面板
    panel: {
      hidePanel: typeof this.api.hidePanel,
      showPanel: typeof this.api.showPanel,
      togglePanel: typeof this.api.togglePanel,
      registerSubPanel: typeof this.api.registerSubPanel,
      unregisterSubPanel: typeof this.api.unregisterSubPanel,

      notify: typeof this.api.notify,
      add_drag_handle: (handleEl: HTMLElement, targetEl: HTMLElement,
        callback?: (is_move: boolean) => void
      ) => void,
    },

    // 插件管理，可以开/关/下载/卸载插件 (高危险)
    // TODO 管理面板归类过来此处
    pluginsManager: {
    },

    // (未开发) 文件库管理器
    filesManager: {
    },

    // 内部编辑器面板
    editor_panel: {
    },

    // 多级菜单系统
    // TODO 完善 debug 管理面板 (设置面板中的那个)
    contextMenu: {
      append_data: (items: PanelItem[]) => void,
      // remove_data:
    },

    // 自定义按钮模块 (工具栏系统)
    // TODO 完善 debug 管理面板 (设置面板中的那个)
    toolbar: {
      append_date: (items: PanelItem[]) => void,
      // remove_data:
      // onCreateItem
    },

    // 插件快速定义语法糖:
    // 字典类: 等同于一个使用了 数据库+命令+多级菜单系统 的模板插件
    // interface 类: 等同于一个仅使用高频功能的模板插件
    //   高频核心: 一个自定义命令 + 一个工具栏注册的callback

    // 事件系统。无，不使用统一全局的事件系统，而是分散到模块中
    // ~~event: {};~~
  },
}

/** 不一定存在，编辑器api。仅当调出面板的环境是编辑器且软件能一定程度与该软件交互时，才可用
 * 
 * 参考了 Obsidian 的 Editor 接口。
 *   注意他的定位系统主要是 line-ch 体系，我这里直接使用绝对位置，减少接口复杂度。
 *   他的编辑和光标改动都会走 tr 事务，我这里不走。
 *   变更内容时，他主要使用 replaceRange 并配合事务。这点参考了。
 */
export interface EditorApi {
  // 文章内容
  getRange: (range?: EditorRange) => string // 第二个参数默认范围为全文

  replaceRange: (text: string, range?: EditorRange) => void // 第二个参数默认范围为全文
  replaceRanges: (list: {text: string, range: EditorRange}[]) => void

  getSelections(): EditorRange[] // 光标为非选中状态时也认为存在选区
  setSelection: (range: EditorRange) => void // 语法糖版本
  setSelections: (range_list: EditorRange[]) => void // 若环境不支持多光标，则仅最后一个生效
}
type EditorRange = {start: number, end: number}

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

// ----------------- TODO 下面的类型其实与插件开发无关。有空把他们移走 -----------------

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
