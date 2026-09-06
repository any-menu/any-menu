let cache_color = 'red';
let cache_el = null // 注册的自定义面板
let cache_hoverEl = null // 悬浮显示的自定义面板
let cache_el_am_icon = null // 工具栏按钮的图标

const emoji_dict = {
    'red':      '🟥',
    'blue':     '🟦',
    'green':    '🟩',
    'brown':    '🟫',
    'orangered':'🟧',
    'yellow':   '🟨',
    'purple':   '🟪',
    'black':    '⬛',
    'white':    '⬜'
}

export default {
    metadata: {
        id: 'anymenu-md-color-highlight',
        name: 'md多色高亮',
        version: '1.0.4',
        min_app_version: '1.2.4',
        author: 'LincZero',
        icon: 'lucide-highlighter',
        css: `
.md-color-highlight-panel>span {
  cursor: pointer;
}`
    },

    onUnload() {
        this.app.api.unregisterSubPanel('md-color-panel-highlight')
    },

    async run(ctx) {
        const str = ctx.env.selectedText
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }
        const cache_emoji = emoji_dict[cache_color]

        // b1. 选中的文本最外层是 span，则修改属性 (可能之前设置过文字色或背景色，不要再套一层，会较臃肿)
        const spanMatch = str.match(/^==(.)(.*)==$/u); // 注意 `u` 模式保证第一个匹配项是完整的 Unicode/Emoji 字符
        if (spanMatch) {
            // 解析标签
            let emoji = spanMatch[1];
            let newStr = spanMatch[2];

            // b11. 已有 highlight-emoji 属性
            if (cache_emoji) {
                // 颜色相同 → 移除声明
                if (emoji == cache_emoji) {
                    this.app.api.sendText(newStr); return;
                }
                // 颜色不同 → 替换为新颜色
                else {
                    this.app.api.sendText(`==${cache_emoji}${newStr}==`); return;
                }
            }
            // b12. 没有 highlight-emoji 属性，追加
            else {
                this.app.api.sendText(`==${cache_emoji}${emoji}${newStr}==`); return;
            }
        }
        // b2. 为选中文本包裹 span 标签
        else {
            this.app.api.sendText(`==${cache_emoji}${str}==`); return;
        }
    },

    onCreateItem(el) {
        if (!el.classList.contains('am-toolbar-item')) return // 非工具栏项不参与 (应该让软件而非插件处理?)

        // 右键点击展开面板
        el.addEventListener('mousedown', (e) => {
            if (e.button !== 2) return; // 仅响应右键点击
            if (!cache_el) {
                cache_el = this.buildPanel()
                this.app.api.registerSubPanel({ id: 'md-color-panel-highlight', el: cache_el })
            }

            // 切换到当前面板
            this.app.api.hidePanel(['menu'])
            this.app.api.showPanel(['md-color-panel-highlight'])

            e.preventDefault()
            e.stopPropagation()
        })

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
            el_am_icon.classList.add('has-more'); el_am_icon.style.setProperty('--color', cache_color);
        }
    },

    // 创建自定义面板
    buildPanel() {
        const root = document.createElement('div')
            root.className = 'md-color-highlight-panel'
        
        for (const [key, value] of Object.entries(emoji_dict)) {
            const item = document.createElement('span');
                root.appendChild(item);
                item.innerText = value;
            item.onclick = (e) => {
                cache_color = key; cache_el_am_icon.style.setProperty('--color', cache_color);
                const ctx = this.app.api.getRunCtx(); if (ctx) void this.run(ctx);
                e.stopPropagation() // 避免按钮的悬浮面板上的点击冒泡到按钮上
            }
        }

        return root
    }
}
