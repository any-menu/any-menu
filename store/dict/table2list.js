export default {
    metadata: {
        id: 'anymenu-table2list',
        name: 'table2list',
        version: '1.0.0',
        min_app_version: '1.1.0',
        author: 'Copilot',
        description: '将 markdown 表格转换为 markdown 列表。每行第一个单元格为顶层列表项，其余单元格为二级列表项',
        icon: 'lucide-list'
    },

    async run(ctx) {
        const str = ctx.env.selectedText
        if (!str) {
            ctx.api.notify('请先选中 markdown 表格文本');
            return;
        }

        // Split into lines and remove empty lines
        const lines = str.split('\n').filter(line => line.trim() !== '');

        // Filter out separator rows (e.g. |---|:--|:---:|)
        const dataLines = lines.filter(line => !/^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/.test(line));

        if (dataLines.length === 0) {
            ctx.api.notify('未找到有效的表格行');
            return;
        }

        // Parse a table row into an array of cell strings
        // 暂时不考虑表格内包含 `\|` 转义的情况
        const parseRow = (line) => {
            return line
                .replace(/^\s*\|/, '')   // remove leading |
                .replace(/\|\s*$/, '')   // remove trailing |
                .split('|')
                .map(cell => cell.trim());
        };

        let result = '';
        for (const line of dataLines) {
            const cells = parseRow(line);
            if (cells.length === 0) continue;

            result += `- ${cells[0]}\n`;
            for (let i = 1; i < cells.length; i++) {
                result += `  - ${cells[i]}\n`; // 这里可以修改 table2list 后列表的缩进风格
            }
        }

        ctx.api.sendText(result);
    }
}
