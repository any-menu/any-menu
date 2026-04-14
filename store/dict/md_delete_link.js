export default {
    metadata: {
        id: 'anymenu-md-delete-link',
        name: 'md_去除链接样式',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero',
        icon: 'lucide-link-2-off'
//         icon: `\
// <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link2-off-icon lucide-link-2-off">
//     <path d="M9 17H7A5 5 0 0 1 7 7"/>
//     <path d="M15 7h2a5 5 0 0 1 4 8"/>
//     <line x1="8" x2="12" y1="12" y2="12"/>
//     <line x1="2" x2="13" y1="2" y2="13"/>
// </svg>`
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
            
            lines[i] = lines[i].replace(/\[([^\]]*)\]\([^)]+\)/g, '$1') // 去除链接样式
        }
        str = lines.join('\n')

        ctx.api.sendText(str)
    }
}
