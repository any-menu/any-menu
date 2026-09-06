let cache_color = 'red';
let cache_el = null
let cache_el_am_icon = null

export default {
    metadata: {
        id: 'anymenu-md-background',
        name: 'md背景色',
        version: '1.0.4',
        min_app_version: '1.2.4',
        author: 'LincZero',
        icon: 'lucide-paintbrush'
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

        // b1. 选中的文本最外层是 span，则修改属性 (可能之前设置过文字色或背景色，不要再套一层，会较臃肿)
        const spanMatch = str.match(/^<span\s+style="([^"]*)">([\s\S]*)<\/span>$/);
        if (spanMatch) {
            // 解析标签
            let style = spanMatch[1];
            let newStr = spanMatch[2];
            const bgRegex = /background\s*:[^;]*(;?)/i;
            const bgMatch = style.match(bgRegex);
            const bgValue = bgMatch
                ? bgMatch[0].replace(/^background\s*:\s*/i, '').replace(/;?\s*$/, '').trim()
                : null;

            // b11. 已有 bg 属性
            if (bgMatch) {
                // 颜色相同 → 移除 bg 声明
                if (bgValue.toLowerCase() === cache_color.toLowerCase()) {
                    let newStyle = style.replace(bgRegex, '');

                    // 清理多余的分号和空格、属性、标签
                    newStyle = newStyle
                        .replace(/;\s*;/g, ';')        // 合并连续分号
                        .replace(/^\s*;+|;+\s*$/g, '') // 去除首尾分号
                        .trim();
                    if (newStyle) { // 还有其他属性，保留 span 和 style
                        this.app.api.sendText(`<span style="${newStyle}">${newStr}</span>`); return;
                    } else { // style 已空，直接输出纯文本
                        this.app.api.sendText(newStr); return;
                    }
                }
                // 颜色不同 → 替换为新颜色
                else {
                    style = style.replace(bgRegex, `background:${cache_color};`);
                    this.app.api.sendText(`<span style="${style}">${newStr}</span>`); return;
                }
            }
            // b12. 没有 bg 属性，追加
            else {
                style = `background:${cache_color};${style}`;
                this.app.api.sendText(`<span style="${style}">${newStr}</span>`); return;
            }
        }
        // b2. 为选中文本包裹 span 标签
        else {
            this.app.api.sendText(`<span style="background:${cache_color};">${str}</span>`); return;
        }
    },

    onCreateItem(el) {
        // 右键点击时可以选择颜色
        el.addEventListener('mousedown', (e) => {
            if (e.button !== 2) return; // 仅响应右键点击
            if (!cache_el) {
                cache_el = this.buildPanel()
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
    },

    buildPanel() {
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
                const ctx = this.app.api.getRunCtx(); if (ctx) void this.run(ctx);
            }

        return root
    }
}
