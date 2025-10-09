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
  initSettingTab_api(tab_nav_container, tab_content_container)

  return { tab_nav_container, tab_content_container}
}

export function initSettingTab_2(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  // #region 标签栏切换 (需要最后执行)
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
  // #endregion
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

// 网络字典
function initSettingTab_api(tab_nav_container: HTMLElement, tab_content_container: HTMLElement) {
  const api = new API()

  const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
    tab_nav.textContent = 'Online Dict';
  const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
  tab_nav.setAttribute('index', 'web-dict'); tab_content.setAttribute('index', 'web-dict');

  // 可能包含文字提醒状态 / 表格
  const container = document.createElement('div'); tab_content.appendChild(container);

  const list = document.createElement('ul'); container.appendChild(list);
  list.textContent = `未加载，请手动点击刷新按钮重试`

  const refresh_btn = document.createElement('button'); container.appendChild(refresh_btn);
    refresh_btn.textContent = 'Refresh Dict List'
    refresh_btn.onclick = async () => void getDict()

  void getDict()
  async function getDict() {
    list.textContent = `加载中...`
    const ret = await api.giteeGetDirectory()
    if (!(ret && ret.code == 0 && ret.data?.json)) {
      list.textContent = `加载失败，请检查网络或稍后重试. code:${ret?.code}, msg:${ret?.msg})`
      return
    }
    list.innerHTML = ''
    try {
      const dir = ret.data.json as {id: string, path: string, name: string}[]
      dir.forEach(item => {
        const li = document.createElement('li'); list.appendChild(li);
        li.textContent = `${item.name} (${item.path}) - ${item.name}`
      })
    } catch (error) {
      list.textContent = `加载失败，数据错误`
    }
  }
}
