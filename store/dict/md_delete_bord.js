const plugin = {
    metadata: {
        id: 'anymenu-md-delete-bord',
        name: 'md_去除加粗样式',
        version: '1.0.0',
        author: 'LincZero'
    },

    async process(str) {
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }
        
        const lines = str.split('\n');
        for (let i = 0; i < lines.length; i++) {
            // let line = lines[i]

            // 是否标题
            // const headingMatch = lines[i].match(/^(#{1,6})\s*(.*)$/)
            // if (!headingMatch) continue

            lines[i] = lines[i].replace(/ (\*\*|__)(.*?)\2/g, '$2')      // 先去除加粗
            lines[i] = lines[i].replace(/(\*|_)(.*?)\2/g, '$2')           // 再去除斜体
        }
        str = lines.join('\n')

        return str
    }
}
