const plugin = {
    metadata: {
        name: 'anymenu-background',
        version: '1.0.0',
        author: 'LincZero'
    },

    async process(str) {
        if (!str) return;
        return `<span style="background:#ff4d4f">${str}</span>`;
    }
}
