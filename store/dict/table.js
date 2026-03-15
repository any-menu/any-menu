export default {
    metadata: {
        id: 'anymenu-table',
        name: '用cNrN生成表格',
        version: '1.0.1',
        min_app_version: '1.1.0',
        author: 'LincZero'
    },

    async run(ctx) {
        const str = ctx.selectedText
        if (!str) {
            ctx.sendText(`\
|   |   |   |
|---|---|---|
|   |   |   |
`);
            return;
        }

        let col, row;
        const match1 = str.match(/^c(\d+)r(\d+)$/);
        const match2 = str.match(/^r(\d+)c(\d+)$/);
        if (match1) {
            col = match1[1];
            row = match1[2];
        } else if (match2) {
            row = match2[1];
            col = match2[2];
        } else {
            console.warn('格式错误，请输入 c列数r行数', str);
            return;
        }

        let table_row = "|";
        let table_row_first = "|";
        let table_row_ = "|";

        for (let i = 0; i < col; ++i)
        {
            table_row += "   |";
            table_row_first += "   |";
            table_row_ += " - |";
        }

        let table_all = `${table_row_first}\n${table_row_}`;

        for (let i = 1; i < row; ++i)
        {
            table_all += `\n${table_row}`;
        }

        table_all += "\n";

        ctx.sendText(table_all);
    }
}
