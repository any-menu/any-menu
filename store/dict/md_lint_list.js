/**
 * 说明: Markdown 列表风格规范化插件
 *
 * 由于 Markdown 规范的宽泛性，Markdown 列表存在许多不同的风格：
 * - 列表标志支持 `+-*` 多种符号开头
 * - 列表符号后面有单空格（一般写法）和三空格（对齐写法）两种
 * - 列表的缩进可能有 tab、2空格或4空格三种形式
 *
 * 手动编写、使用不同的 Markdown 实时编辑器编写、复制他人的 Markdown、
 * 复制 GPT 生成的 Markdown、复制网页 HTML 并由不同的 html2md 库转化等，
 * 都可能导致同一文档中存在多种列表风格。
 *
 * 本插件将选中的 Markdown 文本中的无序列表统一规范化为指定风格。
 * 可在下方 "用户可配置项" 处修改默认行为。
 */

// === 用户可配置项 ===

/** 列表标记符号，可选: '-'（减号）| '+'（加号）| '*'（星号） */
const LIST_MARKER = '-'

/** 标记符号后的空格数，可选: 1（普通单空格写法）| 3（三空格对齐写法） */
const MARKER_SPACES = 1

/** 每级缩进单位，可选: '  '（2空格）| '    '（4空格）| '\t'（tab） */
const INDENT_UNIT = '  '

/** Tab 展开宽度（空格数），用于计算原始缩进的层级，可选: 2 | 4 | 8。
 * 仅当列表中多种缩进风格混用时使用，用于比较层级关系 */
const TAB_WIDTH = 4

// === 内部工具函数 ===

/**
 * 将缩进字符串中的 tab 展开为空格，返回展开后的字符数
 * @param {string} indent - 原始缩进字符串（可能含 tab 和空格）
 * @returns {number} 展开后的宽度（空格数）
 */
function expandIndentWidth(indent) {
    return indent.replace(/\t/g, ' '.repeat(TAB_WIDTH)).length
}

// === 插件主体 ===

export default {
    metadata: {
        id: 'anymenu-md-lint-list',
        name: 'md_规范化列表风格',
        version: '1.0.0',
        min_app_version: '1.1.0',
        author: 'LincZero', // co-author: Claude Sonnet 4.6
        description: '规范化 Markdown 无序列表的标记符号、间距和缩进风格',
        icon: `lucide-list-check`
    },

    async run(ctx) {
        let str = ctx.env.selectedText
        if (!str) {
            console.warn('需要选中文本后再执行');
            return;
        }

        const lines = str.split('\n')

        // 第一遍：收集所有无序列表项的原始缩进宽度（将 tab 展开为空格后计算长度）
        const indentWidthSet = new Set()
        for (const line of lines) {
            const match = line.match(/^(\s*)([-*+])\s+/)
            if (match) {
                const expandedWidth = expandIndentWidth(match[1])
                indentWidthSet.add(expandedWidth)
            }
        }

        // 确定缩进单位宽度：取所有非零缩进宽度中的最小值，以此推算层级
        // 若文档中所有列表项均在顶层（无嵌套），则 minNonZeroWidth 保持为 TAB_WIDTH
        const sortedWidths = [...indentWidthSet].sort((a, b) => a - b)
        const minNonZeroWidth = sortedWidths.find(w => w > 0) || TAB_WIDTH

        // 第二遍：规范化每一行
        const markerSpaceStr = ' '.repeat(MARKER_SPACES)
        const result = lines.map(line => {
            // 匹配无序列表行：可选缩进 + 标记符号(- * +) + 至少一个空格 + 内容
            const match = line.match(/^(\s*)([-*+])(\s+)([\s\S]*)$/)
            if (!match) return line // 非列表行保持不变

            const originalIndent = match[1]
            const content = match[4]

            // 将原始缩进展开为空格，再计算层级（向下取整，避免轻微偏差导致层级偏高）
            const expandedWidth = expandIndentWidth(originalIndent)
            const level = Math.floor(expandedWidth / minNonZeroWidth)

            // 用配置的缩进单位和标记符号重新组装
            const newIndent = INDENT_UNIT.repeat(level)
            return `${newIndent}${LIST_MARKER}${markerSpaceStr}${content}`
        })

        ctx.api.sendText(result.join('\n'))
    }
}
