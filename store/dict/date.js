let cache_mode = 'ISO'
const mode_list = ['DateTime', 'Date', 'Time', 'ISO', 'Timestamp', 'ISO_Z'] // ISO 指 ISO8601
let cache_hoverEl = null // 悬浮显示的自定义面板
let cache_el_am_icon = null // 工具栏按钮的图标

export default {
    metadata: {
        id: 'anymenu-date',
        name: '日期',
        version: '1.0.4',
        min_app_version: '1.2.4',
        author: 'LincZero',
        description: '输出当前日期与时间，支持多种格式',
        icon: 'lucide-calendar',
        css: `
.md-date-panel {
  display: flex;
  gap: 8px;
}
.md-date-panel>span {
  cursor: pointer;
}
.md-date-panel>span:hover {
  background-color: var(--ab-tab-root-hv-color);
}`
    },

    async run(_ctx) {
        const now = new Date();
        const localeString = now.toLocaleString('sv-SE'); // sv-SE (瑞典语) 输出类似 "2026-03-16 15:30:00" 的本地时间
        const [datePart, timePart] = localeString.split(' '); // 分别取日期和时间
        let dateString = '';

        if (cache_mode == 'DateTime') dateString = localeString;
        else if (cache_mode === 'Date') dateString = datePart;
        else if (cache_mode === 'Time') dateString = timePart;
        // 本地时间的 ISO 风格（无时区），如 "2026-03-16T15:30:00"
        else if (cache_mode == 'ISO') dateString = localeString.replace(' ', 'T');
        // 时间戳，毫秒级，如 "1788882114.557" (最后三位为毫秒)
        else if (cache_mode == 'Timestamp') dateString = (now.getTime() / 1000).toFixed(3);
        // UTC 时间戳（带毫秒和 Z），如 "2026-03-16T15:30:00.123Z"
        else if (cache_mode == 'ISO_Z') dateString = now.toISOString();
        else {
            console.error(`意外的日期类别 "${cache_mode}"`)
            return
        }

        this.app.api.sendText(dateString);
    },

    onCreateItem(el) {
        if (!el.classList.contains('am-toolbar-item')) return // 非工具栏项不参与 (应该让软件而非插件处理?)

        // 鼠标悬浮展开面板
        el.addEventListener('mouseenter', (_) => {
            cache_hoverEl?.remove();
            cache_hoverEl = this.buildPanel(); el.appendChild(cache_hoverEl); cache_hoverEl.classList.add('am-custom-hover-panel')
        })
        el.addEventListener('mouseleave', (_) => {
            cache_hoverEl?.remove();
        })

        // 这里的样式处理应该移到主逻辑而非插件中?
        // 有可能是工具栏项 (.am-toolbar-item) 或多级菜单项 (am-context-menu-item)
        const el_am_icon = el.querySelector(':scope.am-toolbar-item > .am-icon')
        if (el_am_icon) {
            cache_el_am_icon = el_am_icon;
            el_am_icon.classList.add('has-more'); // el_am_icon.style.setProperty('--color', 'currentColor');
        }
    },

    // 创建自定义面板
    buildPanel() {
        const root = document.createElement('div')
            root.className = 'md-date-panel'
        
        for (const mode of mode_list) {
            const item = document.createElement('span');
                root.appendChild(item);
                item.innerText = mode;
            item.onclick = (e) => {
                cache_mode = mode; // el_am_icon.style.setProperty('--color', 'currentColor');
                const ctx = this.app.api.getRunCtx(); if (ctx) void this.run(ctx);
                e.stopPropagation() // 避免按钮的悬浮面板上的点击冒泡到按钮上
            }
        }

        return root
    }
}
