const plugin = {
    metadata: {
        id: 'anymenu-background',
        name: 'md背景色',
        version: '1.0.0',
        author: 'LincZero'
    },

    async process(str) {
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }
        return `<span style="background:#ff4d4f">${str}</span>`;
    }
}
