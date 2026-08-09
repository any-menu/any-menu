const textIconOptions_default = {
    size: 32,
    pick: "grapheme",
    twoLettersForEnglish: false,
};
function pickFirstGrapheme(text) {
    var _a;
    const trimmed = text.trim();
    if (!trimmed)
        return "";
    const Seg = Intl.Segmenter;
    if (Seg) {
        const seg = new Seg(undefined, { granularity: "grapheme" });
        for (const s of seg.segment(trimmed))
            return s.segment;
    }
    return (_a = Array.from(trimmed)[0]) !== null && _a !== void 0 ? _a : "";
}
function to2(n) {
    return n.toString(16).padStart(2, "0");
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
function startsWithAsciiLetter(s) {
    const c = s.charCodeAt(0);
    return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}
function pickTwoAsciiLetters(s) {
    let out = "";
    for (let i = 0; i < s.length && out.length < 2; i++) {
        const c = s.charCodeAt(i);
        const isLetter = (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
        if (isLetter)
            out += s[i];
    }
    return out.toUpperCase();
}
export function textToIcon(text, opts = {}) {
    const o = Object.assign(Object.assign({}, textIconOptions_default), opts);
    const trimmed = (text !== null && text !== void 0 ? text : "").trim();
    let char;
    const fallbackChar = '?';
    if (trimmed.length === 0) {
        char = fallbackChar;
    }
    else if (o.twoLettersForEnglish && startsWithAsciiLetter(trimmed)) {
        char = pickTwoAsciiLetters(trimmed) || fallbackChar;
    }
    else {
        char =
            o.pick === "grapheme"
                ? (pickFirstGrapheme(trimmed) || fallbackChar)
                : (Array.from(trimmed)[0] || fallbackChar);
    }
    const baseFontSize = Math.floor(o.size * 0.5);
    const fontSize = char.length >= 2 ? Math.floor(baseFontSize * 0.82) : baseFontSize;
    const style = [
        `font-size:${fontSize}px`,
    ].join(";") + ";";
    const html = `<span class="am-icon am-icon-auto" aria-label="${escapeHtml(trimmed || text)}" style="${escapeHtml(style)}">${escapeHtml(char)}</span>`;
    return { text, trimmed, char, html, style };
}
export function textToHashColor(text, bgColorMode = "hsl", fgColorMode = "auto", saturation, lightness) {
    const trimmed = (text !== null && text !== void 0 ? text : "").trim();
    const hash = fnv1a32(trimmed);
    const bgColor = bgColorMode === "hex" ? hashToHex(hash) : hashToHsl(hash, saturation, lightness);
    const fgColor = fgColorMode === "auto" ? pickReadableTextColor(bgColor) : fgColorMode;
    return {
        color: fgColor,
        background: bgColor
    };
    function fnv1a32(input) {
        let hash = 0x811c9dc5;
        for (const ch of input) {
            hash ^= ch.codePointAt(0);
            hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
        }
        return hash >>> 0;
    }
    function hashToHsl(hash, saturation = 65, lightness = 50) {
        const hue = hash % 360;
        return `hsl(${hue} ${clamp(saturation, 0, 100)}% ${clamp(lightness, 0, 100)}%)`;
    }
    function hashToHex(hash) {
        const r = (hash & 0xff0000) >>> 16;
        const g = (hash & 0x00ff00) >>> 8;
        const b = (hash & 0x0000ff) >>> 0;
        return `#${to2(r)}${to2(g)}${to2(b)}`;
    }
    function pickReadableTextColor(bgColor) {
        if (bgColor.startsWith("#") && bgColor.length === 7) {
            const r = parseInt(bgColor.slice(1, 3), 16) / 255;
            const g = parseInt(bgColor.slice(3, 5), 16) / 255;
            const b = parseInt(bgColor.slice(5, 7), 16) / 255;
            const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
            const R = lin(r), G = lin(g), B = lin(b);
            const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
            return L > 0.5 ? "#000" : "#fff";
        }
        const m = bgColor.match(/hsl\(\s*\d+(\.\d+)?\s+(\d+(\.\d+)?)%\s+(\d+(\.\d+)?)%\s*\)/i);
        if (m) {
            const lightness = parseFloat(m[4]);
            return lightness >= 55 ? "#000" : "#fff";
        }
        return "#fff";
    }
}
