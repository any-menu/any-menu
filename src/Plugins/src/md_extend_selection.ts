import type { PluginRunCtx, PluginInterface } from '../../Type'

export default {
    metadata: {
        id: 'anymenu-md-extend-selection',
        name: 'md扩大选区',
        version: '1.0.0',
        min_app_version: '1.2.4',
        author: 'LincZero',
        description: '根据 Markdown 语法包含关系扩大选区，从内联样式扩展到行再到块再到标题级',
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide cursor-extend">
  <path d="M17 22h-1a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4h1"/>
  <path d="M7 22h1a4 4 0 0 0 4-4"/>
  <path d="M7 2h1a4 4 0 0 1 4 4"/>

  <path d="m5 9-3 3 3 3"/>
  <path d="m19 9 3 3-3 3"/>
</svg>`
        // 这里的 cursor-extend 结合了 lucide 的 move-horizontal 和 text-cursor 拼凑而成
        // 备用片段:
        // <path d="m6 8-4 4 4 4"/>
        // <path d="m18 8 4 4-4 4"/>
        // 备用 icon:
        // move-horizontal
        // scan-square
        // scan
        // text-cursor
    },

    async run(ctx: PluginRunCtx) {
        let ret = run_with_editor(this)
        if (ret) return
        ret = await run_with_selectedText(this, ctx)
        if (ret) return
        console.warn('无编辑器环境，或需要选中文本后再执行');
    },
} satisfies PluginInterface;

// 编辑器版
function run_with_editor(plugin: PluginInterface) {
    const editorApi = plugin.app.api.getEditorApi?.()
    console.log('editorApi ret', editorApi, plugin.app.api.getEditorApi)
    if (!editorApi) return false

    const text = editorApi.getRange()
    const selections = editorApi.getSelections()
    if (!selections || selections.length === 0) return false
    
    // 暂不支持多光标，先把单光标做好
    const selection = selections[selections.length - 1]

    // 根据 text 和 selection 判断扩大后的范围
    const newRange = expandSelection(text, selection.start, selection.end)

    // 应用新范围
    editorApi.setSelection({start: newRange.start, end: newRange.end})

    return true
}

// 纯光标扩展版
async function run_with_selectedText(_plugin: PluginInterface, ctx: PluginRunCtx): Promise<boolean> {
    // 已选中文本的话，则不进行
    const str = ctx.env.selectedText
    if (str) {
        return false;
    }

    // 这里可以模拟 `Caps + G` (`ctrl+left` + `ctrl+shift+right`)

    return false
}

// 根据 text 和 range 判断扩大后的范围
function expandSelection(text: string, start: number, end: number): { start: number; end: number } {
    // 辅助函数：根据行号范围获取字符偏移
    function getRangeFromLines(lines: string[], startLine: number, endLine: number): { start: number; end: number } {
        let startPos = 0;
        for (let i = 0; i < startLine; i++) {
            startPos += lines[i].length + 1; // +1 for \n
        }
        let endPos = startPos;
        for (let i = startLine; i <= endLine; i++) {
            endPos += lines[i].length;
            if (i < endLine) endPos += 1; // +1 for \n
        }
        return { start: startPos, end: endPos };
    }

    // 查找内联元素范围（粗体、斜体、删除线、行内代码、链接）
    // TODO 有 bug: 当文章存在加粗时，其他会被忽略。搜索时不是使用就近原则而是顺序匹配
    function findInlineRange(text: string, start: number, end: number): { start: number; end: number } | null {
        const markers = ['**', '__', '~~', '`', '*', '_'];
        for (const marker of markers) {
            const left = text.lastIndexOf(marker, start);
            if (left === -1) continue;
            // 避免匹配到更长标记的一部分
            if (marker === '*' && (text[left - 1] === '*' || text[left + 1] === '*')) continue;
            if (marker === '_' && (text[left - 1] === '_' || text[left + 1] === '_')) continue;
            const right = text.indexOf(marker, end);
            if (right === -1) continue;
            if (marker === '*' && (text[right - 1] === '*' || text[right + 1] === '*')) continue;
            if (marker === '_' && (text[right - 1] === '_' || text[right + 1] === '_')) continue;
            if (left < start && right >= end) {
                return { start: left, end: right + marker.length };
            }
        }
        // 处理链接 [text](url)
        const linkStart = text.lastIndexOf('[', start);
        if (linkStart !== -1) {
            const linkEnd = text.indexOf(']', end);
            if (linkEnd !== -1 && linkStart < start && linkEnd >= end) {
                const parenStart = linkEnd + 1;
                if (text[parenStart] === '(') {
                    const parenEnd = text.indexOf(')', parenStart);
                    if (parenEnd !== -1) {
                        return { start: linkStart, end: parenEnd + 1 };
                    }
                }
                return { start: linkStart, end: linkEnd + 1 };
            }
        }
        return null;
    }

    // 查找行范围
    function findLineRange(text: string, start: number, end: number): { start: number; end: number } {
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', end);
        const endPos = lineEnd === -1 ? text.length : lineEnd;
        return { start: lineStart, end: endPos };
    }

    // 查找块范围（代码块、列表、引用、段落）
    function findBlockRange(text: string, start: number, end: number): { start: number; end: number } | null {
        const lines = text.split('\n');
        let startLine = 0;
        let endLine = 0;
        let pos = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineLen = lines[i].length + 1;
            if (pos <= start) startLine = i;
            if (pos <= end) endLine = i;
            pos += lineLen;
            if (pos > end) break;
        }

        // 检查代码块
        let inCode = false;
        let codeFence = '';
        let codeStartLine = -1;
        for (let i = 0; i <= startLine; i++) {
            const line = lines[i].trim();
            if (line.startsWith('```') || line.startsWith('~~~')) {
                if (!inCode) {
                    inCode = true;
                    codeFence = line.substring(0, 3);
                    codeStartLine = i;
                } else if (line.startsWith(codeFence)) {
                    inCode = false;
                }
            }
        }
        if (inCode) {
            let codeEndLine = lines.length - 1;
            for (let i = codeStartLine + 1; i < lines.length; i++) {
                if (lines[i].trim().startsWith(codeFence)) {
                    codeEndLine = i;
                    break;
                }
            }
            return getRangeFromLines(lines, codeStartLine, codeEndLine);
        }

        // 检查列表
        const listMarkerRegex = /^\s*([-*+]|\d+\.)\s+/;
        if (listMarkerRegex.test(lines[startLine])) {
            let listStart = startLine;
            while (listStart > 0 && listMarkerRegex.test(lines[listStart - 1])) {
                listStart--;
            }
            let listEnd = endLine;
            while (listEnd < lines.length - 1 && listMarkerRegex.test(lines[listEnd + 1])) {
                listEnd++;
            }
            return getRangeFromLines(lines, listStart, listEnd);
        }

        // 检查引用
        if (lines[startLine].trim().startsWith('>')) {
            let quoteStart = startLine;
            while (quoteStart > 0 && lines[quoteStart - 1].trim().startsWith('>')) {
                quoteStart--;
            }
            let quoteEnd = endLine;
            while (quoteEnd < lines.length - 1 && lines[quoteEnd + 1].trim().startsWith('>')) {
                quoteEnd++;
            }
            return getRangeFromLines(lines, quoteStart, quoteEnd);
        }

        // 默认段落：连续非空行
        let paraStart = startLine;
        while (paraStart > 0 && lines[paraStart - 1].trim() !== '') {
            paraStart--;
        }
        let paraEnd = endLine;
        while (paraEnd < lines.length - 1 && lines[paraEnd + 1].trim() !== '') {
            paraEnd++;
        }
        return getRangeFromLines(lines, paraStart, paraEnd);
    }

    // 查找标题级范围
    function findHeadingRange(text: string, start: number, _end: number): { start: number; end: number } | null {
        const lines = text.split('\n');
        let startLine = 0;
        let pos = 0;
        for (let i = 0; i < lines.length; i++) {
            if (pos + lines[i].length >= start) {
                startLine = i;
                break;
            }
            pos += lines[i].length + 1;
        }

        let headingLine = -1;
        let headingLevel = 0;
        for (let i = startLine; i >= 0; i--) {
            const match = lines[i].match(/^(#{1,6})\s+/);
            if (match) {
                headingLine = i;
                headingLevel = match[1].length;
                break;
            }
        }
        if (headingLine === -1) return null;

        let endLine = lines.length - 1;
        for (let i = headingLine + 1; i < lines.length; i++) {
            const match = lines[i].match(/^(#{1,6})\s+/);
            if (match) {
                const level = match[1].length;
                if (level <= headingLevel) {
                    endLine = i - 1;
                    break;
                }
            }
        }
        return getRangeFromLines(lines, headingLine, endLine);
    }

    // 主扩展逻辑：按级别逐级扩大
    const inline = findInlineRange(text, start, end);
    if (inline && (inline.start < start || inline.end > end)) {
        return inline;
    }
    const line = findLineRange(text, start, end);
    if (line && (line.start < start || line.end > end)) {
        return line;
    }
    const block = findBlockRange(text, start, end);
    if (block && (block.start < start || block.end > end)) {
        return block;
    }
    const heading = findHeadingRange(text, start, end);
    if (heading && (heading.start < start || heading.end > end)) {
        return heading;
    }
    return { start, end };
}
