export default {
    metadata: {
        id: 'anymenu-background',
        name: 'md背景色',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero'
    },

    async run(ctx) {
        const str = ctx.selectedText
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }
        ctx.sendText(`<span style="background:#ff4d4f">${str}</span>`);
    }
}
