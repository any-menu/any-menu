export default {
    metadata: {
        id: 'anymenu-md-delete-link-all',
        name: 'md_去除链接文本',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero',
        icon: 'lucide-link-2-off'
    },

    async run(ctx) {
        const str = ctx.env.selectedText
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
            
            lines[i] = lines[i].replace(/\[([^\]]*)\]\([^)]+\)/g, '') // 去除链接文本
        }
        str = lines.join('\n')

        ctx.api.sendText(str)
    }
}
