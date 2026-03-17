export default {
    metadata: {
        id: 'anymenu-table-transpose',
        name: '表格转置',
        version: '1.0.0',
        min_app_version: '1.1.0',
        author: 'Copilot',
        description: '将选中的 markdown 表格进行转置（行列互换）',
        icon: 'lucide-table-2'
    },

    async run(ctx) {
        const str = ctx.env.selectedText
        if (!str) {
            console.warn('需要选中表格文本后再执行');
            return;
        }

        // Split into lines and remove empty ones
        const lines = str.split('\n').filter(line => line.trim() !== '');

        // Detect and skip the separator row (contains only |, -, :, and spaces)
        const dataLines = lines.filter(line => !/^\s*\|[\s\-:|]+\|\s*$/.test(line));

        if (dataLines.length === 0) {
            console.warn('未找到有效的表格行');
            return;
        }

        // Parse each row into cells
        const rows = dataLines.map(line => {
            // Split by '|', trim each cell, and filter out empty strings at start/end
            // 暂时不支持表格内带转义的 `\|`
            return line.split('|').map(cell => cell.trim()).filter((cell, idx, arr) => {
                // Keep non-empty cells; also handle leading/trailing empty strings from '|...|' format
                return idx > 0 && idx < arr.length - 1;
            });
        });

        if (rows.length === 0 || rows[0].length === 0) {
            console.warn('表格解析失败');
            return;
        }

        const numCols = rows[0].length;
        const numRows = rows.length;

        // Transpose: original column index becomes new row index
        const transposed = [];
        for (let col = 0; col < numCols; col++) {
            const newRow = [];
            for (let row = 0; row < numRows; row++) {
                newRow.push(rows[row][col] !== undefined ? rows[row][col] : '');
            }
            transposed.push(newRow);
        }

        // Build output markdown table
        const outputLines = [];
        for (let i = 0; i < transposed.length; i++) {
            outputLines.push('| ' + transposed[i].join(' | ') + ' |');
            // Insert separator row after the header (first row)
            if (i === 0) {
                outputLines.push('|' + transposed[i].map(() => '---|').join(''));
            }
        }

        ctx.api.sendText(outputLines.join('\n') + '\n');
    }
}
