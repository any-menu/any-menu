export default {
    metadata: {
        id: 'anymenu-md-heading-down',
        name: 'md_降低标题等级',
        version: '1.0.0',
        min_app_version: '1.1.0',
        author: 'LincZero',
        description: "将 Markdown 标题降低一级，例如 H1 -> H2。注意不能包含 H6",
        // modi from: icon: 'lucide-heading-6'
        icon: `\
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide">
  <path d="M4 12h8"/>
  <path d="M4 18V6"/>
  <path d="M12 18V6"/>

  <path d="M17.5 11l3 3-3 3"/>
</svg>`
    },

    async run(ctx) {
        let str = ctx.env.selectedText
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }
        
        const lines = str.split('\n'); // 所有文本行列表
        const result = []; // 所有文本行列表 - 已经遍历过的、处理过的

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const match = line.match(/^(#{1,6})(\s)/);
            if (match) {
                const hashes = match[1];
                if (hashes.length === 6) {
                    console.warn(`第 ${i + 1} 行已是 H6，无法降低：${line}`);
                    result.push(line);
                    return // (可选) 也可不退出
                } else {
                    // 增加一个 #，降低等级
                    result.push('#' + line);
                }
            } else {
                result.push(line);
            }
        }

        str = result.join('\n');
        ctx.api.sendText(str)
    }
}
