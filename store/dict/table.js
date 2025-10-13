const plugin = {
    metadata: {
        id: 'anymenu-table',
        name: '用cNrN生成表格',
        version: '1.0.0',
        author: '槑头脑'
    },

    async process(str) {
		if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }
		const match = str.match(/c(\d+)r(\d+)/)
		if (!match) {
			console.warn('格式错误，请输入 c列数r行数', str);
			return;
		}

		const col = match[1];
		const row = match[2];

		let table_row = "|";
		let table_row_first = "| $0";
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

		return table_all;
    }
}
