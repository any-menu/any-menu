import { global_setting } from './setting';
import { API } from './webApi'

/**
 * 初始化设置标签页 (!!! 需要依次调用 initSettingTab_1 和 initSettingTab_2)
 * @param el
 * @returns 方便继续添加标签项
 */
export function initSettingTab_1(el: HTMLElement): { tab_nav_container: HTMLElement, tab_content_container: HTMLElement } {
  el.classList.add('tab-root')
  const tab_nav_container = document.createElement('div'); el.appendChild(tab_nav_container); tab_nav_container.classList.add('tab-nav-container');
  const tab_content_container = document.createElement('div'); el.appendChild(tab_content_container); tab_content_container.classList.add('tab-content-container');

  initSettingTab_miniDocs(tab_nav_container, tab_content_container)
  // TODO 应该按先本地再云库的顺序依次而非异步更新，1. 后者不是必须加载的 2. 后者需要先检查本地是否已存在
  initSettingTab_localDict(tab_nav_container, tab_content_container)
  initSettingTab_webDict(tab_nav_container, tab_content_container)

  return { tab_nav_container, tab_content_container}
}

/// 标签栏切换 (需要最后执行)
export function initSettingTab_2(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  for (const nav of tab_nav_container.querySelectorAll('div.item')) {
    const index: string|null = nav.getAttribute('index')
    if (index == null) continue
    ;(nav as HTMLElement).onclick = () => {
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
    }
  }
}

// mini docs (用于在首页显示一些简单的使用说明、链接)
function initSettingTab_miniDocs(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = 'Mini docs';
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'mini-docs'); tab_content.setAttribute('index', 'mini-docs');

  const div = document.createElement('div'); tab_content.appendChild(div);
    div.textContent = `默认使用 Alt + A 打开菜单\n
更多说明和教程浏览仓库: https://github.com/any-menu/any-menu`

  tab_nav.classList.add('active');
  tab_content.classList.add('active');
}

const local_dict_list: { // 本地/已下载的词典
  id: string,
  isDownloaded: boolean, isEnabled: boolean
}[] = []
const web_dict_list: { // 可下载/已下载的网络字典
  id: string, path: string, name: string,
  isDownloaded: boolean, isEnabled: boolean
}[] = []

/** 网络字典 */
function initSettingTab_webDict(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const api = new API()

  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = 'Online Dict';
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'web-dict'); tab_content.setAttribute('index', 'web-dict');

  // 可能包含文字提醒状态 / 表格
  const container = document.createElement('div'); tab_content.appendChild(container);
  const span = document.createElement('span'); container.appendChild(span);
  const table = document.createElement('table'); container.appendChild(table);
    table.classList.add('dict-table');
  const table_thead = document.createElement('thead'); table.appendChild(table_thead);
    const tr = document.createElement('tr'); table_thead.appendChild(tr);
    if (global_setting.isDebug) {
      const td1 = document.createElement('td'); tr.appendChild(td1); td1.textContent = 'id';
    }
    const td2 = document.createElement('td'); tr.appendChild(td2); td2.textContent = 'path';
    const td3 = document.createElement('td'); tr.appendChild(td3); td3.textContent = 'name';
    const td4 = document.createElement('td'); tr.appendChild(td4); td4.textContent = 'downloaded'; td4.classList.add('btn');
    const td5 = document.createElement('td'); tr.appendChild(td5); td5.textContent = 'enabled'; td5.classList.add('btn');
  const table_tbody = document.createElement('tbody'); table.appendChild(table_tbody);
  const refresh_btn = document.createElement('button'); container.appendChild(refresh_btn);
    refresh_btn.textContent = 'Refresh Dict List'
    refresh_btn.onclick = async () => void getDict()
  table.style.display = 'none'; span.style.display = 'block'; span.textContent = `未加载，请手动点击刷新按钮重试`;

  // 动态加载内容
  void getDict()
  async function getDict() {
    table.style.display = 'none'; span.style.display = 'block'; span.textContent = `加载中...`

    const ret = await api.giteeGetDirectory()
    if (!(ret && ret.code == 0 && ret.data?.json)) {
      table.style.display = 'none'; span.style.display = 'block'; span.textContent = `加载失败，请检查网络或稍后重试. code:${ret?.code}, msg:${ret?.msg})`
      return
    }
    table.style.display = 'table'; span.style.display = 'none'; span.textContent = '加载成功'
    table_tbody.innerHTML = ''
    try {
      const dir = ret.data.json as {id: string, path: string, name: string}[]
      web_dict_list.length = 0 // clear array
      dir.forEach(item => {
        web_dict_list.push({...item, isDownloaded: false, isEnabled: false})
        const tr = document.createElement('tr'); table_tbody.appendChild(tr); tr.setAttribute('target-id', item.id);
        if (global_setting.isDebug) {
          const td1 = document.createElement('td'); tr.appendChild(td1); td1.textContent = item.id;
        }
        const td2 = document.createElement('td'); tr.appendChild(td2);
          const a = document.createElement('a'); td2.appendChild(a);
          a.href = `${api.giteeBlobUrl}store/dict/${item.path}`
          a.textContent = item.path
          a.target = '_blank'
        const td3 = document.createElement('td'); tr.appendChild(td3); td3.textContent = item.name;
        const td4 = document.createElement('td'); tr.appendChild(td4); td4.textContent = '未下载'; td4.classList.add('btn');
          td4.onclick = async () => {
            // const ret = await api.giteeGetDict(item.path)
          }
        const td5 = document.createElement('td'); tr.appendChild(td5); td5.textContent = '未启用'; td5.classList.add('btn');
      })
    } catch (error) {
      table.style.display = 'none'; span.style.display = 'block'; span.textContent = `加载失败，数据错误`
    }
  }
}

/** 本地字典 */
function initSettingTab_localDict(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = 'Local Dict';
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'local-dict'); tab_content.setAttribute('index', 'local-dict');

  // 可能包含文字提醒状态 / 表格
  const container = document.createElement('div'); tab_content.appendChild(container);
  const span = document.createElement('span'); container.appendChild(span);
  const table = document.createElement('table'); container.appendChild(table);
    table.classList.add('dict-table');
  const table_thead = document.createElement('thead'); table.appendChild(table_thead);
    const tr = document.createElement('tr'); table_thead.appendChild(tr);
    const td2 = document.createElement('td'); tr.appendChild(td2); td2.textContent = 'name';
    const td3 = document.createElement('td'); tr.appendChild(td3); td3.textContent = 'path';
    const td5 = document.createElement('td'); tr.appendChild(td5); td5.textContent = 'enabled'; td5.classList.add('btn');
  const table_tbody = document.createElement('tbody'); table.appendChild(table_tbody);
  const refresh_btn = document.createElement('button'); container.appendChild(refresh_btn);
    refresh_btn.textContent = 'Refresh Dict List'
    refresh_btn.onclick = async () => void getDict()
  table.style.display = 'none'; span.style.display = 'block'; span.textContent = `未加载，请手动点击刷新按钮重试`;

  // 动态加载内容
  void getDict()
  async function getDict() {
    table.style.display = 'none'; span.style.display = 'block'; span.textContent = `加载中...`

    const ret: string[] = await global_setting.api.readFolder(global_setting.config.dict_paths)
    table.style.display = 'table'; span.style.display = 'none'; span.textContent = '加载成功'
    table_tbody.innerHTML = ''
    try {
      local_dict_list.length = 0 // clear array
      ret.forEach(item => {
        local_dict_list.push({id: item, isDownloaded: false, isEnabled: false})
        const tr = document.createElement('tr'); table_tbody.appendChild(tr); tr.setAttribute('target-id', item);
        const td2 = document.createElement('td'); tr.appendChild(td2); td2.textContent = item.split('/').pop() || item;
        // const td3 = document.createElement('td'); tr.appendChild(td3); td3.textContent = item;
        const td5 = document.createElement('td'); tr.appendChild(td5); td5.textContent = '未启用'; td5.classList.add('btn');
          td5.setAttribute('target-id', item);
          td5.onclick = async () => {
            local_dict_list.forEach(d => {
              if (d.id === item) d.isEnabled = !d.isEnabled
              // 然后更新字典对象
            })
          }
      })
    } catch (error) {
      table.style.display = 'none'; span.style.display = 'block'; span.textContent = `加载失败，数据错误`
    }
  }
}
