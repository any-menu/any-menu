export default {
    metadata: {
        id: 'anymenu-md-delete-line',
        name: 'md_去除水平分割线',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero',
        // modi from: icon: 'lucide-minus'
        icon: `\
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide">
    <path d="M5 12h7"/>
    <path d="M16 12h3"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
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

            // 不是水平分割线
            if (!/^[-*_]{3,}$/.test(line.trim())) {
                result.push(line);
                continue
            }

            // 回退：移除 result 末尾连续的空行
            while (result.length > 0 && result[result.length - 1].trim() === '') {
                result.pop();
            }
            // 前进：跳过后续连续的空行
            while (i + 1 < lines.length && lines[i + 1].trim() === '') {
                i++;
            }
            // 补充一个空行作为段落间隔（前后各有内容时才补）
            const hasPrev = result.length > 0 && result[result.length - 1].trim() !== '';
            const hasNext = i + 1 < lines.length && lines[i + 1].trim() !== '';
            if (hasPrev && hasNext) {
                result.push('');
            }
        }

        str = result.join('\n');
        ctx.api.sendText(str)
    }
}
