const plugin = {
    metadata: {
        id: 'anymenu-md-delete-link-all',
        name: 'md_去除链接文本',
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
            
            lines[i] = lines[i].replace(/\[([^\]]+)\]\([^)]+\)/g, '') // 去除链接文本
        }
        str = lines.join('\n')

        return str
    }
}
