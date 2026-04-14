export default {
    metadata: {
        id: 'anymenu-md-delete-bord',
        name: 'md_去除加粗样式',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero',
        // 取自 'lucide-bold' + 删除线 with 遮罩
        icon: `\
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bold-icon lucide-bold">
  <defs>
    <mask id="eraseMask">
      <rect width="24" height="24" fill="white"/>
      <line x1="2" y1="2" x2="22" y2="22" stroke="black"
        stroke-width="6" stroke-linecap="round"/>
    </mask>
  </defs>

  <g mask="url(#eraseMask)">
    <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8"/>
  </g>

  <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor"
    stroke-width="2" stroke-linecap="round"/>
</svg>`
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
