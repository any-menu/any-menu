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
  // web_dict_list.length = 0

  el.classList.add('tab-root')
  const tab_nav_container = document.createElement('div'); el.appendChild(tab_nav_container); tab_nav_container.classList.add('tab-nav-container');
  const tab_content_container = document.createElement('div'); el.appendChild(tab_content_container); tab_content_container.classList.add('tab-content-container');

  initSettingTab_miniDocs(tab_nav_container, tab_content_container)
  // TODO 应该按先本地再云库的顺序依次而非异步更新，1. 后者不是必须加载的 2. 后者需要先检查本地是否已存在
  // 或者像 vue 那样响应式更新，watch (local_dict_list -> update web_dict_list)
  void initSettingTab_localDict(tab_nav_container, tab_content_container)
  void initSettingTab_webDict(tab_nav_container, tab_content_container)

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
    div.innerHTML = `\
<details>
  <summary>使用说明 (中文)</summary>
  默认使用 Alt+A 打开搜索框和菜单、Alt+S 打开快速编辑器 (App版也可以用高级快捷键 Caps+M 或 Caps+N) (均可在设置中修改快捷键)
  <br>
  (以上是推荐设置的快捷键，由于Obsidian官方不推荐插件默认使用快捷键，请自行分别设置 "Show panel: search and menu" 和 "Show panel: miniEditor" 这两个命令的快捷键)
  <br>
  更多说明和教程浏览:
  <ul>
    <li>仓库: https://github.com/any-menu/any-menu</li>
    <li>文档: https://any-menu.github.io/any-menu/</li>
  </ul>
  <br>
  !!! 注意: 当前设置面板修改过后，需要重启插件/软件才能生效
</details>
<br>
<details>
  <summary>Instructions for Use (English)</summary>
  The default shortcuts are Alt+A to open the search box and menu, and Alt+S to open the quick editor (The App version can also use the advanced shortcuts Caps+M or Caps+N) (All shortcuts can be modified in the settings).
  <br>
  (The shortcuts above are the recommended settings. Because Obsidian officially does not recommend plugins using shortcuts by default, please manually set the shortcuts for the two commands: "Show panel: search and menu" and "Show panel: miniEditor").
  <br>
  For more instructions and tutorials:
  <ul>
    <li>repository: https://github.com/any-menu/any-menu</li>
    <li>document: https://any-menu.github.io/any-menu/</li>
  </ul>
  <br>
  !!! Note: After modifying the current settings panel, you need to restart the plugin/software for the changes to take effect.
</details>`

  tab_nav.classList.add('active');
  tab_content.classList.add('active');
}

const local_dict_list: { // 本地/已下载的词典
  path: string, // 相对于obsidian根目录的文件路径
  relPath: string, // 相对于本地词典文件夹的相对文件路径
  isDownloaded: boolean, isEnabled: boolean
}[] = []
const web_dict_list: { // 可下载/已下载的网络字典
  id: string,   // 注册id
  relPath: string, // 相对于网络词典文件夹的文件路径
  name: string, // 注册名
  isDownloaded: boolean, isEnabled: boolean
}[] = []
// TODO 封装成一个插件管理容器类就最好的，然后封装下面三个:
function local_dict_list_onChange() {
  // 去修改 web_dict_list 的 isDownloaded isEnabled
  // 并运行 initMenuData
}
// function local_dict_list_add() {}
// function local_dict_list_remove() {}

/** 网络字典 */
async function initSettingTab_webDict(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const api = new API()

  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = 'Online dict';
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
    refresh_btn.textContent = 'Refresh dict list'
    refresh_btn.onclick = async () => void getDict()
  table.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = `未加载，请手动点击刷新按钮重试`;

  // 动态加载内容
  await getDict()
  async function getDict() {
    table.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = `加载中...`

    const ret = await api.giteeGetDirectory()
    if (!(ret && ret.code == 0 && ret.data?.json)) {
      table.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = `加载失败，请检查网络或稍后重试. code:${ret?.code}, msg:${ret?.msg})`
      return
    }
    table.classList.remove('am-hide'); span.classList.add('am-hide'); span.textContent = '加载成功'
    table_tbody.innerHTML = ''
    try {
      const dir = (ret.data.json as {id: string, path: string, name: string}[]).map(item => ({
        id: item.id,
        relPath: item.path,
        name: item.name
      }))
      web_dict_list.length = 0 // clear array
      dir.forEach(item => {
        web_dict_list.push({...item, isDownloaded: false, isEnabled: false})
        const tr = document.createElement('tr'); table_tbody.appendChild(tr); tr.setAttribute('target-id', item.id);
        if (global_setting.isDebug) {
          const td1 = document.createElement('td'); tr.appendChild(td1); td1.textContent = item.id;
        }
        const td2 = document.createElement('td'); tr.appendChild(td2);
          const a = document.createElement('a'); td2.appendChild(a);
          a.href = `${api.giteeBlobUrl}store/dict/${item.relPath}`
          a.textContent = item.relPath
          a.target = '_blank'
        const td3 = document.createElement('td'); tr.appendChild(td3); td3.textContent = item.name;
        const td4 = document.createElement('td'); tr.appendChild(td4); td4.classList.add('btn');
          if (local_dict_list.find(d => d.relPath === item.relPath)) {
            td4.textContent = '已下载'; td4.setAttribute('color', 'green');
          } else {
            td4.textContent = '未下载'; td4.setAttribute('color', 'gray');
          }
          td4.onclick = async () => {
            const color = td4.getAttribute('color')
            if (color === 'green') { // 已下载，需要卸载
              global_setting.api.deleteFile(`${global_setting.config.dict_paths}${item.relPath}`).then(success => {
                if (!success) {
                  td4.textContent = '卸载失败'; td4.setAttribute('color', 'green');
                  return
                }
                td4.textContent = '已卸载'; td4.setAttribute('color', 'gray');
                const index = local_dict_list.findIndex(d => d.relPath === item.relPath)
                if (index >= 0) {
                  local_dict_list.splice(index, 1)
                  local_dict_list_onChange()
                }
              })
            } else { // 未下载/下载失败
              api.downloadDict(item.relPath).then(success => {
                if (!success) {
                  td4.textContent = '下载失败'; td4.setAttribute('color', 'red');
                  return
                }
                td4.textContent = '已下载'; td4.setAttribute('color', 'green');
                local_dict_list.push({path: `${global_setting.config.dict_paths}${item.relPath}`, relPath: item.relPath, isDownloaded: true, isEnabled: true})
                local_dict_list_onChange()
              })
            }
          }
        const td5 = document.createElement('td'); tr.appendChild(td5); td5.textContent = '暂采用下载即启用策略'; td5.classList.add('btn');
      })
    } catch (error) {
      table.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = `加载失败，数据错误`
    }
  }
}

/** 本地字典 */
async function initSettingTab_localDict(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = 'Local dict';
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
    const td4 = document.createElement('td'); tr.appendChild(td4); td4.textContent = 'uninstall'; td4.classList.add('btn');
    const td5 = document.createElement('td'); tr.appendChild(td5); td5.textContent = 'enabled'; td5.classList.add('btn');
  const table_tbody = document.createElement('tbody'); table.appendChild(table_tbody);
  const refresh_btn = document.createElement('button'); container.appendChild(refresh_btn);
    refresh_btn.textContent = 'Refresh dict list'
    refresh_btn.onclick = async () => void getDict()
  table.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = `未加载，请手动点击刷新按钮重试`;

  // 动态加载内容
  await getDict()
  async function getDict() {
    table.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = `加载中...`

    const ret: string[] = await global_setting.api.readFolder(global_setting.config.dict_paths)
    table.classList.remove('am-hide'); span.classList.add('am-hide'); span.textContent = '加载成功'
    table_tbody.innerHTML = ''
    try {
      local_dict_list.length = 0 // clear array
      ret.forEach((item: string) => {
        const relPath = item.replace(global_setting.config.dict_paths, '')
        local_dict_list.push({path: item, relPath: relPath, isDownloaded: false, isEnabled: false})
        const tr = document.createElement('tr'); table_tbody.appendChild(tr); tr.setAttribute('target-id', item);
        const td2 = document.createElement('td'); tr.appendChild(td2); td2.textContent = item.split('/').pop() || item;
        const td3 = document.createElement('td'); tr.appendChild(td3); td3.textContent = relPath;
        const td4 = document.createElement('td'); tr.appendChild(td4); td4.textContent = '卸载'; td4.classList.add('btn');
          td4.textContent = '已下载'; td4.setAttribute('color', 'green');
          td4.onclick = async () => {
            const color = td4.getAttribute('color')
            if (color !== 'green') { console.error('Unreachable'); return }
            global_setting.api.deleteFile(`${global_setting.config.dict_paths}${relPath}`).then(success => {
              if (!success) {
                td4.textContent = '卸载失败'; td4.setAttribute('color', 'green');
                return
              }
              tr.remove()
              const index = local_dict_list.findIndex(d => d.relPath === relPath)
              if (index >= 0) {
                local_dict_list.splice(index, 1)
                local_dict_list_onChange()
              }
            })
          }
        const td5 = document.createElement('td'); tr.appendChild(td5); td5.textContent = '暂采用下载即启用策略'; td5.classList.add('btn');
      })
      local_dict_list_onChange()
    } catch (error) {
      table.classList.add('am-hide'); span.classList.remove('am-hide'); span.textContent = `加载失败，数据错误`
    }
  }
}
