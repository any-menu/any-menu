let cache_color = 'red';
let cache_el = null
let cache_el_am_icon = null

export default {
    metadata: {
        id: 'anymenu-md-background',
        name: 'md背景色',
        version: '1.0.2',
        min_app_version: '1.2.0',
        author: 'LincZero',
        icon: 'lucide-highlighter'
    },

    onUnload() {
        this.app.api.unregisterSubPanel('md-background-panel')
    },

    async run(ctx) {
        const str = ctx.env.selectedText
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }

        // 如果选中的文本已经包含 span 了 (可能之前设置过文字色或背景色)，则直接修改属性而不是再套一层
        const spanMatch = str.match(/^<span\s+style="([^"]*)">([\s\S]*)<\/span>$/);
        if (spanMatch) {
            let style = spanMatch[1];
            let newStr = spanMatch[2];
            const bgRegex = /background\s*:[^;]*(;?)/i;
            if (bgRegex.test(style)) {
                // 已有 background 属性，直接替换
                style = style.replace(bgRegex, `background:${cache_color};`);
            } else {
                // 没有 background 属性，追加
                style = `background:${cache_color};${style}`;
            }
            this.app.api.sendText(`<span style="${style}">${newStr}</span>`);
        } else {
            this.app.api.sendText(`<span style="background:${cache_color}">${str}</span>`);
        }
    },

    onCreateItem(el) {
        // 右键点击时可以选择颜色
        el.addEventListener('mousedown', (e) => {
            if (e.button !== 2) return; // 仅响应右键点击
            if (!cache_el) {
                cache_el = buildPanel()
                this.app.api.registerSubPanel({ id: 'md-background-panel', el: cache_el })
            }

            // 切换到当前面板
            this.app.api.hidePanel(['menu'])
            this.app.api.showPanel(['md-background-panel'])

            e.preventDefault()
            e.stopPropagation()
        })

        // 这里的样式处理应该移到主逻辑而非插件中?
        // 有可能是工具栏项 (.am-toolbar-item) 或多级菜单项 (am-context-menu-item)
        const el_am_icon = el.querySelector(':scope.am-toolbar-item > .am-icon')
        if (el_am_icon) {
            cache_el_am_icon = el_am_icon;
            el_am_icon.classList.add('has-more'); el_am_icon.style.setProperty('--color', cache_color);
        }
    }
}

function buildPanel() {
    const root = document.createElement('div')
        root.className = 'md-background-panel'
    
    const input = document.createElement('input');
        root.appendChild(input);
        input.type = 'color';
        input.value = cache_color;
        input.click();
        input.onchange = () => {
            cache_color = input.value; cache_el_am_icon.style.setProperty('--color', cache_color);
            input.value = cache_color
        }

    return root
}
