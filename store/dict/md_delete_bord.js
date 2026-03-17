export default {
    metadata: {
        id: 'anymenu-md-delete-bord',
        name: 'md_去除加粗样式',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero',
        icon: 'lucide-bold'
    },

    async run(ctx) {
        let str = ctx.env.selectedText
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

            lines[i] = lines[i].replace(/(\*\*|__)(.*?)\1/g, '$2')        // 先去除加粗
            lines[i] = lines[i].replace(/(\*|_)(.*?)\1/g, '$2')           // 再去除斜体
        }
        str = lines.join('\n')

        ctx.api.sendText(str)
    }
}
