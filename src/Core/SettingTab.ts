/**
 * 初始化设置标签页
 * @param el 
 * @returns 方便继续添加标签项
 */
export function initSettingTab(el: HTMLElement): { tab_nav_container: HTMLElement, tab_content_container: HTMLElement } {
  el.classList.add('tab-root')
  const tab_nav_container = document.createElement('div'); el.appendChild(tab_nav_container); tab_nav_container.classList.add('tab-nav-container');
  const tab_content_container = document.createElement('div'); el.appendChild(tab_content_container); tab_content_container.classList.add('tab-content-container');

  // #region mini docs (用于在首页显示一些简单的使用说明、链接)
  {
    const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
      tab_nav.textContent = 'Mini docs';
    const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'mini-docs'); tab_content.setAttribute('index', 'mini-docs');

    const div = document.createElement('div'); tab_content.appendChild(div);
      div.textContent = `默认使用 Alt + A 打开菜单
更多说明和教程浏览仓库: https://github.com/any-menu/any-menu`

    tab_nav.classList.add('active');
    tab_content.classList.add('active');
  }
  // #endregion

  // #region mini docs (用于在首页显示一些简单的使用说明、链接)
  {
    const tab_nav = document.createElement('div'); tab_nav_container.appendChild(tab_nav); tab_nav.classList.add('item');
      tab_nav.textContent = 'Plugin store';
    const tab_content = document.createElement('div'); tab_content_container.appendChild(tab_content); tab_content.classList.add('item');
    tab_nav.setAttribute('index', 'plugin-store'); tab_content.setAttribute('index', 'plugin-store');

    const div = document.createElement('div'); tab_content.appendChild(div);
      div.textContent = `开发中`
  }
  // #endregion

  // #region 标签栏切换
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

  return { tab_nav_container, tab_content_container}
}
