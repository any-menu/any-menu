const plugin = {
    metadata: {
        id: 'anymenu-md-title-linter',
        name: '清除md中的标题加粗和链接',
        version: '1.0.0',
        author: 'LincZero'
    },

    async process(str) {
		if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }
		
		const lines = str.split('\n');
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i]

			// 是否标题
			const headingMatch = line.match(/^(#{1,6})\s*(.*)$/)
			if (!headingMatch) continue

			
			line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 去除链接
			line = line.replace(/(\*\*|__)(.*?)\1/g, '$2')      // 先去除加粗
			line = line.replace(/(\*|_)(.*?)\1/g, '$2')   	    // 再去除斜体
		}
		str = lines.join('\n')

		return str
    }
}
