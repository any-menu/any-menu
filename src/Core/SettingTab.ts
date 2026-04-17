import { t } from './locales/helper';
import { global_setting } from './setting';
import { API } from './webApi'

/**
 * 初始化设置标签页 (!!! 需要依次调用 initSettingTab_1 和 initSettingTab_2)
 * @param el
 * @returns 方便继续添加标签项
 */
export function initSettingTab_1(el: HTMLElement): { tab_nav_container: HTMLElement, tab_content_container: HTMLElement } {
  // // 避免重复触发，导致重复添加标签项
  // el.innerHTML = ''
  // local_dict_list.length = 0

  el.classList.add('tab-root')
  const tab_nav_container = document.createElement('div'); el.appendChild(tab_nav_container); tab_nav_container.classList.add('tab-nav-container');
  const tab_content_container = document.createElement('div'); el.appendChild(tab_content_container); tab_content_container.classList.add('tab-content-container');

  initSettingTab_miniDocs(tab_nav_container, tab_content_container)
  // TODO 应该按先本地再云库的顺序依次而非异步更新，1. 后者不是必须加载的 2. 后者需要先检查本地是否已存在
  // 或者像 vue 那样响应式更新，watch (local_dict_list -> update web_dict_list)
  void initSettingTab_localDict(tab_nav_container, tab_content_container)
  void initSettingTab_webDict(tab_nav_container, tab_content_container)
  void initSettingTab_toolbar(tab_nav_container, tab_content_container)
  void initSettingTab_contextMenu(tab_nav_container, tab_content_container)

  return { tab_nav_container, tab_content_container}
}

/// 标签栏切换 (需要最后执行)
export function initSettingTab_2(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  for (const nav of tab_nav_container.querySelectorAll('div.item')) {
    const index: string|null = nav.getAttribute('index')
    if (index == null) continue
    ;(nav as HTMLElement).addEventListener('click', () => {
      for (const nav_item of tab_nav_container.children) {
        nav_item.classList.remove('active');
      }
      nav.classList.add('active');
      let content: HTMLElement|null = null
      for (const content_ of tab_content_container.children) {
        content_.classList.remove('active');
        if (content_.getAttribute('index') === index) content = content_ as HTMLElement;
      }
      content?.classList.add('active');
    });
  }
}

/** mini docs (用于在首页显示一些简单的使用说明、链接) */
function initSettingTab_miniDocs(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = t('Mini docs');
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'mini-docs'); tab_content.setAttribute('index', 'mini-docs');

  const div = document.createElement('div'); tab_content.appendChild(div); div.classList.add('am-inner-html');
    // white-space: normal
    /**
     * @security 此处使用 innerHTML 渲染 i18n 静态内容
     * - 内容来源：开发者维护的翻译文件
     * - 风险评估：低 (无用户输入)
     * - 审查周期：每次翻译文件更新时人工审查
     */
    div.innerHTML = t('Mini docs2')

  tab_nav.classList.add('active');
  tab_content.classList.add('active');
}

const local_dict_list: { // 本地/已下载的词典
  path: string, // 相对于obsidian根目录的文件路径
  relPath: string, // 相对于本地词典文件夹的相对文件路径
  isDownloaded: boolean, isEnabled: boolean
}[] = []
// TODO 封装成一个插件管理容器类就最好的，然后封装下面三个:
function local_dict_list_onChange() {
  // 并运行 initMenuData
}
// function local_dict_list_add() {}
// function local_dict_list_remove() {}

/**
 * 网络字典
 * id (debug) | 路径 | 名字 | 是否下载 | 是否启用
 */
async function initSettingTab_webDict(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = t('Online dict');
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'web-dict'); tab_content.setAttribute('index', 'web-dict');

  // 自动刷新
  tab_nav.addEventListener('click', () => void getDictData_and_showData())

  // 基础容器
  const container = document.createElement('div'); tab_content.appendChild(container);
  const span = document.createElement('span'); container.appendChild(span); span.textContent = `未加载，请手动点击刷新按钮重试`; // 文字提醒状态
  const dataview = document.createElement('div'); container.appendChild(dataview); dataview.classList.add('am-hide'); // 数据展示
  {
    const buttons = document.createElement('div'); container.appendChild(buttons); buttons.classList.add('setting-buttons') // 按钮组
    const dataview_mode_btn = document.createElement('button'); buttons.appendChild(dataview_mode_btn);
      dataview_mode_btn.textContent = t('Change dataview mode')
      dataview_mode_btn.onclick = async () => {
        let viewmode_ = dataview.dataset.viewmode;
        let viewmode: 'card'|'table' = (viewmode_ !== 'card') ? 'card' : 'table'
        void getDictData_and_showData(viewmode)
      }
    const refresh_btn = document.createElement('button'); buttons.appendChild(refresh_btn);
      refresh_btn.textContent = t('Refresh dict list')
      refresh_btn.onclick = async () => void getDictData_and_showData()
  }

  // 首次刷新
  void getDictData_and_showData()

  /** 获取要展示的数据 + 展示已获取的数据 */
  async function getDictData_and_showData(mode: 'table'|'card' = 'card') {
    const api = new API()
    const data = await getDictData()
    if (!data) return
    const data_header = [
      ...(global_setting.isDebug ? [{
        name: t('Id'),
        callback: (el: HTMLElement, item: any) => el.innerText = item.id,
      }] : []),
      {
        name: t('Path'),
        callback: (el: HTMLElement, item: any) => {
          const a = document.createElement('a'); el.appendChild(a);
            a.target = '_blank'
            a.textContent = item.path
          // github repo 路径
          if ((item.path as string).includes('/')) {
            a.href = `https://github.com/${item.path}`
          }
          // dict 路径
          else {
            a.href = `${api.blobUrl()}store/dict/${item.path}`
          }
        }
      },
      {
        name: t('Name'),
        callback: (el: HTMLElement, item: any) => el.innerText = item.name
      },
      {
        name: t('Is downloaded'),
        callback: (el: HTMLElement, item: any) => {
          const td4_btn = document.createElement('button'); el.appendChild(td4_btn); td4_btn.classList.add('btn');
          if (local_dict_list.find(d => d.relPath === item.path)) {
            td4_btn.textContent = t('Downloaded'); td4_btn.setAttribute('color', 'green');
          } else {
            td4_btn.textContent = t('Download'); td4_btn.setAttribute('color', 'gray');
          }
          td4_btn.onclick = async () => {
            const color = td4_btn.getAttribute('color')
            if (color === 'green') { // 已下载，需要卸载
              global_setting.api.deleteFile(`${global_setting.config.dict_paths}${item.path}`).then(success => {
                if (!success) {
                  td4_btn.textContent = t('Uninstalled failed'); td4_btn.setAttribute('color', 'green');
                  return
                }
                td4_btn.textContent = t('Uninstalled'); td4_btn.setAttribute('color', 'gray');
                const index = local_dict_list.findIndex(d => d.path === item.path)
                if (index >= 0) {
                  local_dict_list.splice(index, 1)
                  local_dict_list_onChange()
                }
              })
            } else { // 未下载/下载失败
              // github repo 路径
              if ((item.path as string).includes('/')) {
                console.warn('未支持 repo 路径2', item.path)
                return
              }
              // dict 路径
              api.getFile_fromStorePath_and_writeFile(item.path).then(success => {
                if (!success) {
                  td4_btn.textContent = t('Download failed'); td4_btn.setAttribute('color', 'red');
                  return
                }
                td4_btn.textContent = t('Downloaded'); td4_btn.setAttribute('color', 'green');
                local_dict_list.push({path: `${global_setting.config.dict_paths}${item.path}`, relPath: item.path, isDownloaded: true, isEnabled: true})
                local_dict_list_onChange()
              })
            }
          }
        }
      },
      // {
      //   name: t('Is enabled')
      // },
    ]
    if (mode === 'card') json2card(dataview, data, data_header)
    else json2table(dataview, data, data_header)
  }

  /** 获取要展示的数据 */
  async function getDictData() {
    dataview.innerHTML = ''; dataview.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = t('Loading')

    const api = new API()
    const ret = await api.getDir_fromStorePath()
    if (!(ret && ret.code == 0 && ret.data?.json)) {
      console.error('Failed to load dict list from repo', ret)
      dataview.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = `${t('Load failed')}，请检查网络或稍后重试. code:${ret?.code}, msg:${ret?.msg}`
      return
    }
    dataview.classList.remove('am-hide'); span.classList.add('am-hide'); span.textContent = t('Load successed')

    const dir = (ret.data.json as {id: string, path: string, name: string}[]).map(item => ({
      id: item.id,
      path: item.path,
      name: item.name
    }))
    return dir
  }
}

/**
 * 本地字典
 * 名字 | 路径 | 卸载 | 是否启用
 */
async function initSettingTab_localDict(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = t('Local dict');
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'local-dict'); tab_content.setAttribute('index', 'local-dict');

  // 自动刷新
  tab_nav.addEventListener('click', () => void getDictData_and_showData())

  // 基础容器
  const container = document.createElement('div'); tab_content.appendChild(container);
  const span = document.createElement('span'); container.appendChild(span); span.textContent = `未加载，请手动点击刷新按钮重试`; // 文字提醒状态
  const dataview = document.createElement('div'); container.appendChild(dataview); dataview.classList.add('am-hide'); // 数据展示
  {
    const buttons = document.createElement('div'); container.appendChild(buttons); buttons.classList.add('setting-buttons') // 按钮组
    const dataview_mode_btn = document.createElement('button'); buttons.appendChild(dataview_mode_btn);
      dataview_mode_btn.textContent = t('Change dataview mode')
      dataview_mode_btn.onclick = async () => {
        let viewmode_ = dataview.dataset.viewmode;
        let viewmode: 'card'|'table' = (viewmode_ !== 'card') ? 'card' : 'table'
        void getDictData_and_showData(viewmode)
      }
    const refresh_btn = document.createElement('button'); buttons.appendChild(refresh_btn);
      refresh_btn.textContent = t('Refresh dict list')
      refresh_btn.onclick = async () => void getDictData_and_showData()
  }

  // 首次刷新
  void getDictData_and_showData()

  /** 获取要展示的数据 + 展示已获取的数据 */
  async function getDictData_and_showData(mode: 'table'|'card' = 'card') {
    const data = await getDictData()
    if (!data) return
    const data_header = [
      {
        name: t('Name'),
        callback: (el: HTMLElement, item: any) => el.innerText = item.path.split('/').pop() || item.path,
      },
      // {
      //   name: t('Path'),
      // },
      {
        name: t('Uninstall'),
        callback: (el: HTMLElement, item: any) => {
          const td4_btn = document.createElement('button'); el.appendChild(td4_btn); td4_btn.classList.add('btn');
          td4_btn.textContent = t('Downloaded'); td4_btn.setAttribute('color', 'green');
          td4_btn.onclick = async () => {
            const color = td4_btn.getAttribute('color')
            if (color !== 'green') { console.error('Unreachable'); return }
            global_setting.api.deleteFile(`${global_setting.config.dict_paths}${item.relPath}`).then(success => {
              if (!success) {
                td4_btn.textContent = t('Uninstalled failed'); td4_btn.setAttribute('color', 'green');
                return
              }
              const index = local_dict_list.findIndex(d => d.relPath === item.relPath)
              if (index >= 0) {
                local_dict_list.splice(index, 1)
                local_dict_list_onChange()
              }
              void getDictData_and_showData()
            })
          }
        }
      },
      {
        name: t('Is enabled'),
        callback: (el: HTMLElement, item: any) => {
          const td5_btn = document.createElement('button'); el.appendChild(td5_btn); td5_btn.classList.add('btn');
          const ret_ = global_setting.config.plugins.find(p => p.name === item.relPath)
          const ret = ret_ ?? {
            name: item.relPath,
            enabled: false
          }
          if (!ret_) {
            global_setting.config.plugins.push(ret); // global_setting.api.saveConfig(); 应执行，但在循环中，末尾再执行
          }
          if (ret.enabled) {
            td5_btn.textContent = t('Enabled'); td5_btn.setAttribute('color', 'green');
          } else {
            td5_btn.textContent = t('Disabled'); td5_btn.setAttribute('color', 'gray');
          }
          td5_btn.onclick = async () => {
            ret.enabled = !ret.enabled; global_setting.api.saveConfig();
            if (ret.enabled) {
              td5_btn.textContent = t('Enabled'); td5_btn.setAttribute('color', 'green');
            } else {
              td5_btn.textContent = t('Disabled'); td5_btn.setAttribute('color', 'gray');
            }
          }
        },
      }
    ]
    if (mode === 'card') json2card(dataview, data, data_header)
    else json2table(dataview, data, data_header)
  }

  /** 获取要展示的数据 */
  async function getDictData() {
    dataview.innerHTML = ''; dataview.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = t('Loading');
    const ret: string[] = await global_setting.api.readFolder(global_setting.config.dict_paths)
    dataview.classList.remove('am-hide'); span.classList.add('am-hide'); span.textContent = t('Load successed');

    local_dict_list.length = 0
    const dir = ret.map(item => {
      const relPath = item.replace(global_setting.config.dict_paths, '')
      local_dict_list.push({path: item, relPath: relPath, isDownloaded: false, isEnabled: false})
      return {
        path: item,
        relPath: relPath
      }
    })
    local_dict_list_onChange()
    return dir
  }
}

/**
 * 自定义工具栏
 * 
 * ## 拖拽失败 - 由 Tauri 机制导致的问题
 * 
 * Tauri 的安全策略阻止了拖拽事件。默认情况下，前端事件被 Tauri 拦截，走它自己的事件
 * 比如说tauri://drag-drop, tauri://drag-leave, tauri://drag-enter等。
 * 那么方案就有两个:
 * (1) 声明"dragDropEnabled": false，这样前端的拖拽事件就能正常工作了。但既然Tauri以权限控制与安全为主，可能这会有问题
 * (2) 使用 Tauri 提供的拖拽事件。但我这里是 Core 模块，并不一定用于 Tauri，不太想去依赖 Tauri
 * 测试: window.addEventListener('pointerdown', () => { console.log('pointerdown works'); }); // 此处正常
 */
function initSettingTab_toolbar(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = t('Toolbar');
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'toolbar-custom'); tab_content.setAttribute('index', 'toolbar-custom');

  // 自动刷新。但注意这可能会覆盖未保存的状态
  tab_nav.addEventListener('click', fn_refresh)

  const p = document.createElement('div'); tab_content.appendChild(p); p.textContent = t('Toolbar2');

  // #region 修改 toolbar 的 GUI。将修改同步回配置对象和文件

  // El_rows 容器
  const el_rows = document.createElement('div'); tab_content.appendChild(el_rows); el_rows.classList.add('setting_row')
  // dataset.index ('data-index') 用于表示当前行所在元素是第几行。并且该值能在 delete/drag 操作后保持正确性
  // 重新给 DOM 行写回 index (保证 delete / drag 后 index 不会错)
  function __sync_dom_indexes() {
    const rows: NodeListOf<HTMLDivElement> = el_rows.querySelectorAll(':scope > div');
    rows.forEach((row, i) => {
      row.dataset.index = String(i);
    });
  }
  let __drag_from_index = -1; // 标记 - 从第几行开始拖拽

  // El_row 行容器，初次渲染
  for (let i = 0; i < global_setting.config.toolbar_list.length; i++) {
    create_el_row(global_setting.config.toolbar_list[i], i)
  }

  // Add 按钮
  const add_btn = document.createElement('button'); tab_content.appendChild(add_btn); add_btn.classList.add('setting_row-add-btn');
    add_btn.innerHTML = SVG_ICON_ADD; add_btn.title = t('Add');
  add_btn.addEventListener('click', () => {
    const newName = '';
    const newIndex = global_setting.config.toolbar_list.length;
    global_setting.config.toolbar_list.push(newName); global_setting.api.saveConfig();
    const { el_row_name } = create_el_row(newName, newIndex);
    el_row_name.focus();
  });

  // Refresh 按钮 (主要是方便 debug 检查配置对象和界面是否保持一致性)
  const refresh_btn = document.createElement('button'); tab_content.appendChild(refresh_btn); refresh_btn.classList.add('setting_row-refresh-btn');
    refresh_btn.innerHTML = SVG_ICON_REFRESH; refresh_btn.title = t('Refresh');
  function fn_refresh() {
    el_rows.innerHTML = ''
    for (let i = 0; i < global_setting.config.toolbar_list.length; i++) {
      create_el_row(global_setting.config.toolbar_list[i], i)
    }
  };
  refresh_btn.addEventListener('click', fn_refresh)

  /// 创建一行 el_row，并负责与 global_setting 同步
  function create_el_row(name: string, index: number) {
    const el_row = document.createElement('div'); el_rows.appendChild(el_row); el_row.classList.add('item_row');
      el_row.dataset.index = String(index);
      el_row.draggable = true; // 让整行可拖拽（但我们只允许从 drag-btn 发起）

    // Drag, 需注意: 拖动后 index 需要重排
    const el_row_drag = document.createElement('span'); el_row.appendChild(el_row_drag); el_row_drag.classList.add('drag-btn');
      el_row_drag.innerHTML = SVG_ICON_GRIP; el_row_drag.title = t('Drag');

    // Name，TODO 以后可以标记下是否是正确的项
    const el_row_name = document.createElement('input'); el_row.appendChild(el_row_name); el_row_name.classList.add('name');
      el_row_name.value = name;
    el_row_name.addEventListener('change', () => {
      const idx = Number(el_row.dataset.index); if (Number.isNaN(idx)) return;
      global_setting.config.toolbar_list[idx] = el_row_name.value; global_setting.api.saveConfig();
    });

    // Icon
    // 该选项暂不支持

    // Delete
    const el_row_delete = document.createElement('button'); el_row.appendChild(el_row_delete); el_row_delete.classList.add('delete-btn');
      el_row_delete.innerHTML = SVG_ICON_DELETE; el_row_delete.title = t('Delete');
    el_row_delete.addEventListener('click', () => {
      const idx = Number(el_row.dataset.index); if (Number.isNaN(idx)) return;
      if (idx < 0 || idx >= global_setting.config.toolbar_list.length) return;
      global_setting.config.toolbar_list.splice(idx, 1); global_setting.api.saveConfig();
      el_row.remove()
      __sync_dom_indexes();
    });

    // El_row 行为 + 排除非 Drag 元素发起
    {
      el_row.addEventListener('dragstart', (e) => {
        // TODO 只允许从 drag-btn 发起拖拽 (支持点击到 svg/path 等内部元素)
        // 这里的 e.target 始终为 item_row，无法判断是否从 drag-btn 发起
        // const target = e.target as HTMLElement;
        // if (!target || !target.classList || !target.classList.contains('drag-btn')) {
        //   console.log('dragstart sdfsada 1', e.target)
        //   e.preventDefault();
        //   return;
        // }
        // if (!target || !(target.closest && target.closest('.drag-btn'))) {
        //   console.log('dragstart sdfsada 2', e.target)
        // }

        // 缓存开始行
        const idx = Number(el_row.dataset.index);
        if (Number.isNaN(idx)) {
          e.preventDefault();
          return;
        }
        __drag_from_index = idx;

        el_row.classList.add('dragging');

        // Firefox 需要 setData 才能拖。同时这里允许拖拽到软件外任意文本区域并输出 `idx`
        try { e.dataTransfer?.setData('text/plain', String(idx)); } catch {}
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      });
      el_row.addEventListener('dragend', () => {
        __drag_from_index = -1;

        el_row.classList.remove('dragging');
      });
      el_row.addEventListener('dragenter', (e) => {
        e.preventDefault();  // 必须阻止默认才能触发 drop
      });
      el_row.addEventListener('dragover', (e) => {
        e.preventDefault(); // 必须阻止默认才能触发 drop
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

        // 高亮定位提醒
        const toIndex = Number(el_row.dataset.index);
        const fromIndex = __drag_from_index;
        if (fromIndex < 0 || Number.isNaN(toIndex) || fromIndex == toIndex) return
        if (fromIndex < toIndex) { // 往下拖
          el_row.classList.add('drag-over-bottom')
        } else { // 往上拖
          el_row.classList.add('drag-over-top')
        }
      });
      el_row.addEventListener('dragleave', (_) => {
        // 高亮定位提醒
        el_row.classList.remove('drag-over-top', 'drag-over-bottom')
      });
      el_row.addEventListener('drop', (e) => {
        e.preventDefault();

        // 高亮定位提醒
        el_row.classList.remove('drag-over-top', 'drag-over-bottom')

        // 1. 确认 from-to index
        const toIndex = Number(el_row.dataset.index)
        const fromIndex = __drag_from_index
        if (Number.isNaN(toIndex)) return
        if (fromIndex < 0) return
        if (fromIndex === toIndex) return
        if (fromIndex >= global_setting.config.toolbar_list.length) return

        // 2. 修改配置对象和文件
        const [moved] = global_setting.config.toolbar_list.splice(fromIndex, 1);
        global_setting.config.toolbar_list.splice(toIndex, 0, moved);
        global_setting.api.saveConfig();

        // 3. 修改 DOM (移动行节点)
        const fromRow = el_rows.querySelector(`:scope > div[data-index="${fromIndex}"]`)
        if (fromRow) {
          // 注意：fromIndex splice 后，toIndex 语义保持“放到目标行位置”
          el_rows.insertBefore(fromRow, (fromIndex < toIndex) ? el_row.nextSibling : el_row)
        }
        __sync_dom_indexes() // 重写 index，避免后续 change/delete 用旧 index
      });
    }

    return { el_row, el_row_name } // 返回 el_row_name 方便聚焦
  }
  // #endregion
}

/** 自定义多级菜单 */
function initSettingTab_contextMenu(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = t('Menu');
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'context-menu-custom'); tab_content.setAttribute('index', 'context-menu-custom');

  // 自动刷新。但注意这可能会覆盖未保存的状态
  tab_nav.addEventListener('click', fn_refresh)

  const p = document.createElement('div'); tab_content.appendChild(p); p.textContent = t('Menu2');

  // #region 修改 contextMenu 的 GUI。将修改同步回配置对象和文件

  // El_rows 容器
  const el_rows = document.createElement('div'); tab_content.appendChild(el_rows); el_rows.classList.add('setting_row')
  // dataset.index ('data-index') 用于表示当前行所在元素是第几行。并且该值能在 delete/drag 操作后保持正确性
  // 重新给 DOM 行写回 index (保证 delete / drag 后 index 不会错)
  function __sync_dom_indexes() {
    const rows: NodeListOf<HTMLDivElement> = el_rows.querySelectorAll(':scope > div');
    rows.forEach((row, i) => {
      row.dataset.index = String(i);
    });
  }
  let __drag_from_index = -1; // 标记 - 从第几行开始拖拽

  // El_row 行容器，初次渲染
  for (let i = 0; i < global_setting.config.context_menu_list.length; i++) {
    create_el_row(global_setting.config.context_menu_list[i], i)
  }

  // Add 按钮
  const add_btn = document.createElement('button'); tab_content.appendChild(add_btn); add_btn.classList.add('setting_row-add-btn');
    add_btn.innerHTML = SVG_ICON_ADD; add_btn.title = t('Add');
  add_btn.addEventListener('click', () => {
    const newName = '';
    const newIndex = global_setting.config.context_menu_list.length;
    global_setting.config.context_menu_list.push(newName); global_setting.api.saveConfig();
    const { el_row_name } = create_el_row(newName, newIndex);
    el_row_name.focus();
  });

  // Refresh 按钮 (主要是方便 debug 检查配置对象和界面是否保持一致性)
  const refresh_btn = document.createElement('button'); tab_content.appendChild(refresh_btn); refresh_btn.classList.add('setting_row-refresh-btn');
    refresh_btn.innerHTML = SVG_ICON_REFRESH; refresh_btn.title = t('Refresh');
  function fn_refresh() {
    el_rows.innerHTML = ''
    for (let i = 0; i < global_setting.config.context_menu_list.length; i++) {
      create_el_row(global_setting.config.context_menu_list[i], i)
    }
  };
  refresh_btn.addEventListener('click', fn_refresh)

  /// 创建一行 el_row，并负责与 global_setting 同步
  function create_el_row(name: string, index: number) {
    const el_row = document.createElement('div'); el_rows.appendChild(el_row); el_row.classList.add('item_row');
      el_row.dataset.index = String(index);
      el_row.draggable = true; // 让整行可拖拽（但我们只允许从 drag-btn 发起）

    // Drag, 需注意: 拖动后 index 需要重排
    const el_row_drag = document.createElement('span'); el_row.appendChild(el_row_drag); el_row_drag.classList.add('drag-btn');
      el_row_drag.innerHTML = SVG_ICON_GRIP; el_row_drag.title = t('Drag');

    // Name，TODO 以后可以标记下是否是正确的项
    const el_row_name = document.createElement('input'); el_row.appendChild(el_row_name); el_row_name.classList.add('name');
      el_row_name.value = name;
    el_row_name.addEventListener('change', () => {
      const idx = Number(el_row.dataset.index); if (Number.isNaN(idx)) return;
      global_setting.config.context_menu_list[idx] = el_row_name.value; global_setting.api.saveConfig();
    });

    // Icon
    // 该选项暂不支持

    // Delete
    const el_row_delete = document.createElement('button'); el_row.appendChild(el_row_delete); el_row_delete.classList.add('delete-btn');
      el_row_delete.innerHTML = SVG_ICON_DELETE; el_row_delete.title = t('Delete');
    el_row_delete.addEventListener('click', () => {
      const idx = Number(el_row.dataset.index); if (Number.isNaN(idx)) return;
      if (idx < 0 || idx >= global_setting.config.context_menu_list.length) return;
      global_setting.config.context_menu_list.splice(idx, 1); global_setting.api.saveConfig();
      el_row.remove()
      __sync_dom_indexes();
    });

    // El_row 行为 + 排除非 Drag 元素发起
    {
      el_row.addEventListener('dragstart', (e) => {
        // TODO 只允许从 drag-btn 发起拖拽 (支持点击到 svg/path 等内部元素)
        // 这里的 e.target 始终为 item_row，无法判断是否从 drag-btn 发起
        // const target = e.target as HTMLElement;
        // if (!target || !target.classList || !target.classList.contains('drag-btn')) {
        //   console.log('dragstart sdfsada 1', e.target)
        //   e.preventDefault();
        //   return;
        // }
        // if (!target || !(target.closest && target.closest('.drag-btn'))) {
        //   console.log('dragstart sdfsada 2', e.target)
        // }

        // 缓存开始行
        const idx = Number(el_row.dataset.index);
        if (Number.isNaN(idx)) {
          e.preventDefault();
          return;
        }
        __drag_from_index = idx;

        el_row.classList.add('dragging');

        // Firefox 需要 setData 才能拖。同时这里允许拖拽到软件外任意文本区域并输出 `idx`
        try { e.dataTransfer?.setData('text/plain', String(idx)); } catch {}
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
      });
      el_row.addEventListener('dragend', () => {
        __drag_from_index = -1;

        el_row.classList.remove('dragging');
      });
      el_row.addEventListener('dragenter', (e) => {
        e.preventDefault();  // 必须阻止默认才能触发 drop
      });
      el_row.addEventListener('dragover', (e) => {
        e.preventDefault(); // 必须阻止默认才能触发 drop
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

        // 高亮定位提醒
        const toIndex = Number(el_row.dataset.index);
        const fromIndex = __drag_from_index;
        if (fromIndex < 0 || Number.isNaN(toIndex) || fromIndex == toIndex) return
        if (fromIndex < toIndex) { // 往下拖
          el_row.classList.add('drag-over-bottom')
        } else { // 往上拖
          el_row.classList.add('drag-over-top')
        }
      });
      el_row.addEventListener('dragleave', (_) => {
        // 高亮定位提醒
        el_row.classList.remove('drag-over-top', 'drag-over-bottom')
      });
      el_row.addEventListener('drop', (e) => {
        e.preventDefault();

        // 高亮定位提醒
        el_row.classList.remove('drag-over-top', 'drag-over-bottom')

        // 1. 确认 from-to index
        const toIndex = Number(el_row.dataset.index)
        const fromIndex = __drag_from_index
        if (Number.isNaN(toIndex)) return
        if (fromIndex < 0) return
        if (fromIndex === toIndex) return
        if (fromIndex >= global_setting.config.context_menu_list.length) return

        // 2. 修改配置对象和文件
        const [moved] = global_setting.config.context_menu_list.splice(fromIndex, 1);
        global_setting.config.context_menu_list.splice(toIndex, 0, moved);
        global_setting.api.saveConfig();

        // 3. 修改 DOM (移动行节点)
        const fromRow = el_rows.querySelector(`:scope > div[data-index="${fromIndex}"]`)
        if (fromRow) {
          // 注意：fromIndex splice 后，toIndex 语义保持“放到目标行位置”
          el_rows.insertBefore(fromRow, (fromIndex < toIndex) ? el_row.nextSibling : el_row)
        }
        __sync_dom_indexes() // 重写 index，避免后续 change/delete 用旧 index
      });
    }

    return { el_row, el_row_name } // 返回 el_row_name 方便聚焦
  }
  // #endregion
}

// take from https://lucide.dev/icons/grip
const SVG_ICON_GRIP = `<svg xmlns="http://www.w3.org/2000/svg"
  width="20" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-icon lucide-grip">
  <circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="5" r="1"/>
  <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  <circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="5" cy="19" r="1"/>
</svg>`
// take from https://lucide.dev/icons/trash
const SVG_ICON_DELETE = `<svg xmlns="http://www.w3.org/2000/svg"
  width="20" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash">
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
  <path d="M3 6h18"/>
  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
</svg>`
// take from https://lucide.dev/icons/plus
const SVG_ICON_ADD = `<svg xmlns="http://www.w3.org/2000/svg"
  width="20" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus">
  <path d="M5 12h14"/>
  <path d="M12 5v14"/>
</svg>`
// take from https://lucide.dev/icons/refresh-cw
const SVG_ICON_REFRESH = `<svg xmlns="http://www.w3.org/2000/svg"
  width="20" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw-icon lucide-refresh-cw">
  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
</svg>`

/**
 * 数据生成表格
 * 
 * 类似于 anyblock 的 listdata2table，但这里的 data 源于对象而非纯文本，
 * 因为还支持: 图标、链接、按钮 等
 * 同时支持更好的操控：分页加载、搜索、筛选 等
 * 
 * @param container 元素容器
 * @param data 要显示的数据
 * @param data_header 与函数一同决定要如何渲染要显示的数据
 *   函数决定如何排列数据渲染出来的函数
 *   而 data_header 决定: 表头、按钮，等
 */
function json2table(
  container: HTMLElement, data: any[],
  data_header: {
    name: string,
    callback: (el: HTMLElement, item:any) => void
  }[]
) {
  container.dataset.viewmode = 'table'
  const table = document.createElement('table'); container.appendChild(table);
    table.classList.add('dataview-table');

  // 表头
  const table_thead = document.createElement('thead'); table.appendChild(table_thead);
  const tr = document.createElement('tr'); table_thead.appendChild(tr);
  for(const header_item of data_header) {
    const td = document.createElement('td'); tr.appendChild(td); td.textContent = header_item.name
  }

  // 表体
  const table_tbody = document.createElement('tbody'); table.appendChild(table_tbody);
  data.forEach(item => {
    const tr = document.createElement('tr'); table_tbody.appendChild(tr); tr.setAttribute('target-id', item.id);
    for(const header_item of data_header) {
      const td = document.createElement('td'); tr.appendChild(td);
      header_item.callback(td, item)
    }
  })
}

function json2card(
  container: HTMLElement, data: any[],
  data_header: {
    name: string,
    callback: (el: HTMLElement, item:any) => void
  }[]
) {
  container.dataset.viewmode = 'card'
  const div = document.createElement('div'); container.appendChild(div);
    div.classList.add('dataview-card');

  // 卡片
  data.forEach(item => {
    const card = document.createElement('div'); div.appendChild(card); card.classList.add('card');
    for(const header_item of data_header) {
      const card_item = document.createElement('div'); card.appendChild(card_item);
      const card_item1 = document.createElement('span'); card_item.appendChild(card_item1);
        card_item.innerText = header_item.name + ': '
      const card_item2 = document.createElement('span'); card_item.appendChild(card_item2);
        header_item.callback(card_item2, item);
    }
  })
}
