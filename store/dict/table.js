export default {
    metadata: {
        id: 'anymenu-table',
        name: '多种方式生成表格',
        version: '1.1.0',
        min_app_version: '1.1.0',
        author: 'LincZero',
        description: '输出 markdown 表格。支持多种生成方式。如选中 "c列数r行数"，或选中 tsv/csv 内容等',
        icon: 'lucide-table'
    },

    async run(ctx) {
        const str = ctx.env.selectedText

        // b1. 不选中内容
        if (!str || str.trim() === '') {
            ctx.api.sendText(`\
|   |   |   |
|---|---|---|
|   |   |   |
`);
            return;
        }

        // b2. 选中 cXrY 或 rXcY 格式
        const match1 = str.match(/^c(\d+)r(\d+)$/);
        const match2 = str.match(/^r(\d+)c(\d+)$/);
        if (match1) {
            const col = Number(match1[1]);
            const row = Number(match1[2]);
            ctx.api.sendText(makeEmptyTable(col, row));
            return;
        } else if (match2) {
            const row = Number(match2[1]);
            const col = Number(match2[2]);
            ctx.api.sendText(makeEmptyTable(col, row));
            return;
        }

        // b3. 选中 csv 或 tsv 内容
        // - csv: Comma-separatedvalues（逗号分隔值）
        // - tsv: Tab-separatedvalues（制表符分隔值）
        // - dsv: Delimiter-separatedvalues（分隔符分隔值，分隔符可以自定义）
        const parsedTable = parseDelimitedText(str);
        if (parsedTable) {
            ctx.api.sendText(toMarkdownTable(parsedTable));
            return;
        }

        ctx.api.notify('输入的文本格式不符合要求，无法生成表格');
        console.warn('输入的文本格式不符合要求，无法生成表格', str);
    }
}

function makeEmptyTable(col, row) {
    const head = '|' + Array(col).fill('   ').join('|') + '|';
    const sep = '|' + Array(col).fill('---').join('|') + '|';
    const body = Array(Math.max(row - 1, 0)).fill(head).join('\n');

    return body ? `${head}\n${sep}\n${body}\n` : `${head}\n${sep}\n`;
    /*
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

    return table_all;*/
}

/** 解析带分割符的文本 (csv/tsv/dsv)
 * 
 * 最少需为 2x2 的表格数据，且每行列数需一致，避免误识别
 * (可修改成宽松版，不要求列数一致，没覆盖到的就为空)
 * 
 * @return {string[][]|null}
 */
function parseDelimitedText(text) {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== '');

    if (lines.length < 2) { // 至少两行才认为是表格数据
        return null;
    }

    // 分隔符。优先级：tab > 逗号 > 其他 (连续空白字符)
    const hasTab = lines.some(line => line.includes('\t'));
    const splitter = hasTab ? /\t+/ : /\s+/;

    // 最终数据
    const rows = lines.map(line => line.split(splitter).map(cell => cell.trim()));

    // 验证数据的合法性
    // 每行至少 2 列，且列数一致，才认为是表格数据
    const colCount = rows[0].length;
    if (colCount < 2) {
        return null;
    }
    for (const row of rows) {
        if (row.length !== colCount) {
            return null;
        }
    }

    return rows;
}

/** 将表格数据转换为 Markdown 表格 */
function toMarkdownTable(rows) {
    const escapeCell = (cell) => String(cell).replace(/\|/g, '\\|');

    const header = `| ${rows[0].map(escapeCell).join(' | ')} |`;
    const separator = `| ${rows[0].map(() => '---').join(' | ')} |`;
    const body = rows
        .slice(1)
        .map(row => `| ${row.map(escapeCell).join(' | ')} |`)
        .join('\n');

    return body ? `${header}\n${separator}\n${body}\n` : `${header}\n${separator}\n`;
}
