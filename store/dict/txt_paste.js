export default {
    metadata: {
        id: 'anymenu-txt-paste',
        name: '输出',
        version: '1.0.0',
        min_app_version: '1.2.4',
        author: 'LincZero',
        description: '(仅 App 版本可用) 将当前缓存的选中项输出到目标位置',
        icon: 'lucide-clipboard-paste',
        // 备用 icon:
        // clipboard-paste
        // clipboard-copy or copy
        // scissors
    },

    async run(ctx) {
        const str = ctx.env.selectedText
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }
        
        this.app.api.sendText(str); return;
    },
}
