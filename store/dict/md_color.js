let cache_color = 'red';
let cache_el = null // 注册的自定义面板
let cache_hoverEl = null // 悬浮显示的自定义面板
let cache_el_am_icon = null // 工具栏按钮的图标

export default {
    metadata: {
        id: 'anymenu-md-color',
        name: 'md文字色',
        version: '1.0.4',
        min_app_version: '1.2.4',
        author: 'LincZero',
        icon: 'lucide-baseline'
        // 备用 icon:
        // 文字编辑类别: https://lucide.dev/icons/categories#text
        // 
        // 基线: lucide-baseline
        // 下滑线: lucide-underline
        // 加粗: lucide-bold
        // 斜体: lucide-italic
        // 高亮: lucide-highlighter
        // 字体: lucide-type
        // 描边: lucide-type-outline
        // 游标: lucide-text-cursor
        // 调色盘: lucide-palette
        // 颜料刷1: lucide-paintbrush
        // 取色: lucide-pipette
        // 橡皮擦: lucide-eraser
    },

    onUnload() {
        this.app.api.unregisterSubPanel('md-color-panel')
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
            const colorRegex = /(?<![a-zA-Z-])color\s*:[^;]*(;?)/i; // 用负向后行断言，避免误匹配 background-color
            const colorMatch = style.match(colorRegex);
            const colorValue = colorMatch
                ? colorMatch[0].replace(/^color\s*:\s*/i, '').replace(/;?\s*$/, '').trim()
                : null;

            // b11. 已有 color 属性
            if (colorMatch) {
                // 颜色相同 → 移除 color 声明
                if (colorValue.toLowerCase() === cache_color.toLowerCase()) {
                    let newStyle = style.replace(colorRegex, '');

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
                    style = style.replace(colorRegex, `color:${cache_color};`);
                    this.app.api.sendText(`<span style="${style}">${newStr}</span>`); return;
                }
            }
            // b12. 没有 color 属性，追加
            else {
                style = `color:${cache_color};${style}`;
                this.app.api.sendText(`<span style="${style}">${newStr}</span>`); return;
            }
        }
        // b2. 为选中文本包裹 span 标签
        else {
            this.app.api.sendText(`<span style="color:${cache_color};">${str}</span>`); return;
        }
    },

    onCreateItem(el) {
        if (!el.classList.contains('am-toolbar-item')) return // 非工具栏项不参与 (应该让软件而非插件处理?)

        // 右键点击展开面板
        el.addEventListener('mousedown', (e) => {
            if (e.button !== 2) return; // 仅响应右键点击
            if (!cache_el) {
                cache_el = this.buildPanel()
                this.app.api.registerSubPanel({ id: 'md-color-panel', el: cache_el })
            }

            // 切换到当前面板
            this.app.api.hidePanel(['menu'])
            this.app.api.showPanel(['md-color-panel'])

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
            root.className = 'md-color-panel'
        
        const input = document.createElement('input');
            root.appendChild(input);
            input.type = 'color';
            input.value = cache_color;
            // input.click();
            input.onchange = (e) => {
                cache_color = input.value; cache_el_am_icon.style.setProperty('--color', cache_color);
                input.value = cache_color
                const ctx = this.app.api.getRunCtx(); if (ctx) void this.run(ctx);
            }
            input.onclick = (e) => {
                e.stopPropagation() // 避免按钮的悬浮面板上的点击冒泡到按钮上
            }

        return root
    }
}
