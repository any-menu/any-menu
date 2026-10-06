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
    async run(ctx) {
        let ret = run_with_editor(this);
        if (ret)
            return;
        ret = await run_with_selectedText(this, ctx);
        if (ret)
            return;
        console.warn('无编辑器环境，或需要选中文本后再执行');
    },
};
// 编辑器版
function run_with_editor(plugin) {
    const editorApi = plugin.app.api.getEditorApi?.();
    if (!editorApi)
        return false;
    const text = editorApi.getRange();
    const selections = editorApi.getSelections();
    if (!selections || selections.length === 0)
        return false;
    // 暂不支持多光标，先把单光标做好
    const selection = selections[selections.length - 1];
    // 根据 text 和 selection 判断扩大后的范围
    const newRange = expandSelection(text, selection.start, selection.end);
    // 应用新范围
    editorApi.setSelection({ start: newRange.start, end: newRange.end });
    return true;
}
// 纯光标扩展版
async function run_with_selectedText(_plugin, ctx) {
    // 已选中文本的话，则不进行
    const str = ctx.env.selectedText;
    if (str) {
        return false;
    }
    // 这里可以模拟 `Caps + G` (`ctrl+left` + `ctrl+shift+right`)
    return false;
}
/** 根据 text 和 selection 判断扩大后的范围
 * @author vibe coding by deepseek-v4-pro, review by LincZero
 */
function expandSelection(text, start, end) {
    // ---- 工具函数 ----
    const isEscaped = (s, pos) => {
        let bs = 0, i = pos - 1;
        while (i >= 0 && s[i] === '\\') {
            bs++;
            i--;
        }
        return bs % 2 === 1;
    };
    // 扫描一对相同标记，配对成功则记录区间
    const scanPair = (s, marker, out, opts = {}) => {
        const len = marker.length;
        let open = -1;
        let i = 0;
        while (i <= s.length - len) {
            if (!s.startsWith(marker, i)) {
                i++;
                continue;
            }
            if (isEscaped(s, i)) {
                i += len;
                continue;
            }
            // 单字符标记遇到 ** / __ 时跳过，避免抢占双标记
            if (opts.skipDouble && s[i + 1] === marker[0]) {
                i += 2;
                continue;
            }
            if (open === -1) {
                open = i;
                i += len;
                continue;
            }
            const content = s.substring(open + len, i);
            if (content.length > 0 && (!opts.noNewline || !content.includes('\n'))) {
                out.push({ start: open, end: i + len, priority: len });
            }
            open = -1;
            i += len;
        }
    };
    // 一次扫描：收集全文所有内联元素区间
    const collectInlineRanges = (s) => {
        const out = [];
        // 顺序：长标记先扫
        scanPair(s, '~~', out); // 删除线
        scanPair(s, '==', out); // 高亮
        scanPair(s, '**', out); // 加粗
        scanPair(s, '__', out); // 加粗
        scanPair(s, '`', out, { noNewline: true }); // 行内代码
        scanPair(s, '*', out, { skipDouble: true }); // 斜体
        scanPair(s, '_', out, { skipDouble: true }); // 斜体
        let m;
        // 链接 [text](url)
        const linkRe = /\[([^\]]*)\]\(([^)]*)\)/g;
        while ((m = linkRe.exec(s)) !== null) {
            out.push({ start: m.index, end: m.index + m[0].length, priority: 0 });
        }
        // HTML 标签对 <tag ...>...</tag>
        const htmlRe = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>([\s\S]*?)<\/\1>/g;
        while ((m = htmlRe.exec(s)) !== null) {
            out.push({ start: m.index, end: m.index + m[0].length, priority: 0 });
        }
        return out;
    };
    // 从所有内联区间中挑出“包含当前选区且最内层”的那个
    const findInnermostInline = (s, rs, re) => {
        const ranges = collectInlineRanges(s);
        let best = null;
        for (const r of ranges) {
            if (r.start > rs || r.end < re)
                continue; // 不包含当前选区
            const sizeA = r.end - r.start;
            const sizeB = best ? best.end - best.start : Infinity;
            if (!best || sizeA < sizeB || (sizeA === sizeB && r.priority > best.priority)) {
                best = r;
            }
        }
        // 与选区完全相同时不再返回（让上层去扩到行/块/标题）
        if (best && (best.start < rs || best.end > re))
            return best;
        return null;
    };
    // ---- 行号 <-> 偏移量 ----
    const lines = text.split('\n');
    const lineOffset = [];
    {
        let acc = 0;
        for (const l of lines) {
            lineOffset.push(acc);
            acc += l.length + 1;
        }
    }
    const findLineIdx = (pos) => {
        let lo = 0, hi = lines.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lineOffset[mid] <= pos)
                lo = mid;
            else
                hi = mid - 1;
        }
        return lo;
    };
    const rangeFromLines = (a, b) => ({
        start: lineOffset[a],
        end: lineOffset[b] + lines[b].length,
    });
    const startLine = findLineIdx(start);
    const endLine = findLineIdx(end);
    // ---- 行级 ----
    const findLineRange = () => {
        const ls = text.lastIndexOf('\n', start - 1) + 1;
        let le = text.indexOf('\n', end);
        if (le === -1)
            le = text.length;
        return { start: ls, end: le };
    };
    // ---- 块级：代码块 / 列表 / 引用 / 段落 ----
    const findBlockRange = () => {
        // 代码块（``` 或 ~~~）
        let inCode = false;
        let fence = '';
        let codeStart = -1;
        for (let i = 0; i <= startLine; i++) {
            const t = lines[i].trimStart();
            if (t.startsWith('```') || t.startsWith('~~~')) {
                const f = t.substring(0, 3);
                if (!inCode) {
                    inCode = true;
                    fence = f;
                    codeStart = i;
                }
                else if (t.startsWith(fence)) {
                    inCode = false;
                }
            }
        }
        if (inCode) {
            let codeEnd = lines.length - 1;
            for (let i = codeStart + 1; i < lines.length; i++) {
                if (lines[i].trimStart().startsWith(fence)) {
                    codeEnd = i;
                    break;
                }
            }
            return rangeFromLines(codeStart, codeEnd);
        }
        // 列表
        const listRe = /^\s*([-*+]|\d+\.)\s+/;
        if (listRe.test(lines[startLine])) {
            let a = startLine;
            while (a > 0 && listRe.test(lines[a - 1]))
                a--;
            let b = endLine;
            while (b < lines.length - 1 && listRe.test(lines[b + 1]))
                b++;
            return rangeFromLines(a, b);
        }
        // 引用
        if (lines[startLine].trimStart().startsWith('>')) {
            let a = startLine;
            while (a > 0 && lines[a - 1].trimStart().startsWith('>'))
                a--;
            let b = endLine;
            while (b < lines.length - 1 && lines[b + 1].trimStart().startsWith('>'))
                b++;
            return rangeFromLines(a, b);
        }
        // 默认：连续非空行构成段落
        let a = startLine;
        while (a > 0 && lines[a - 1].trim() !== '')
            a--;
        let b = endLine;
        while (b < lines.length - 1 && lines[b + 1].trim() !== '')
            b++;
        return rangeFromLines(a, b);
    };
    // ---- 标题级 ----
    const findHeadingRange = () => {
        let hLine = -1, hLevel = 0;
        for (let i = startLine; i >= 0; i--) {
            const mm = lines[i].match(/^(#{1,6})\s+/);
            if (mm) {
                hLine = i;
                hLevel = mm[1].length;
                break;
            }
        }
        if (hLine === -1)
            return null;
        let b = lines.length - 1;
        for (let i = hLine + 1; i < lines.length; i++) {
            const mm = lines[i].match(/^(#{1,6})\s+/);
            if (mm && mm[1].length <= hLevel) {
                b = i - 1;
                break;
            }
        }
        return rangeFromLines(hLine, b);
    };
    // ---- 逐级扩展：内联 → 行 → 块 → 标题 ----
    const inline = findInnermostInline(text, start, end);
    if (inline)
        return inline;
    const line = findLineRange();
    if (line.start < start || line.end > end)
        return line;
    const block = findBlockRange();
    if (block.start < start || block.end > end)
        return block;
    const heading = findHeadingRange();
    if (heading && (heading.start < start || heading.end > end))
        return heading;
    // 都扩不动，原样返回
    return { start, end };
}
