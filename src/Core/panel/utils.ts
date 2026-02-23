/**
 * 主要使用 textToItem (gen by GPT-5.2)
 */

type TextIconOptions = {
  /** icon 宽高（px） */
  size?: number;
  /** 圆角（px），设为 size/2 可变圆形 */
  radius?: number;
  /** 字体族 */
  fontFamily?: string;
  /** 字重 */
  fontWeight?: number | string;
  /** 自动根据背景色选择黑/白字；也可以手动指定如 "#fff" */
  textColor?: "auto" | string;
  /** 背景色生成方式 */
  bgMode?: "hsl" | "hex";
  /** HSL 模式下：饱和度与亮度 */
  saturation?: number; // 0-100
  lightness?: number; // 0-100
  /** 取首字符策略 */
  pick?: "grapheme" | "codePoint";
  /** 文本为空时的占位字符 */
  fallbackChar?: string;

  /**
   * 若为 true：当文本是英文/拉丁字母开头时，使用 2 个字符作为图标内容（如 "GitHub" => "GI"）
   * - 仅对 [A-Za-z] 开头的情况启用（避免中文/emoji 被截成两段）
   * - 会自动 upperCase
   */
  twoLettersForEnglish?: boolean;
};

const textIconOptions_default: Required< // 类型是不为空版的 TextIconOptions
  Pick<
    TextIconOptions,
    | "size"
    | "radius"
    | "fontFamily"
    | "fontWeight"
    | "textColor"
    | "bgMode"
    | "saturation"
    | "lightness"
    | "pick"
    | "fallbackChar"
    | "twoLettersForEnglish"
  >
> = {
  size: 32,
  radius: 8,
  fontFamily: `system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif`,
  fontWeight: 600,
  textColor: "auto",
  bgMode: "hsl",
  saturation: 65,
  lightness: 50,
  pick: "grapheme",
  fallbackChar: "?",
  twoLettersForEnglish: false,
};

export type TextIconResult = {
  text: string;
  trimmed: string;
  char: string;
  hash: number;
  bgColor: string;
  fgColor: string;
  /** 可直接 innerHTML 的字符串 */
  html: string;
  /** 仅 style="" 的内容 */
  style: string;
};

/** 生成一个稳定的 32-bit hash（FNV-1a） */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5; // offset basis
  for (const ch of input) {
    hash ^= ch.codePointAt(0)!;
    hash = (hash + (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
  }
  return hash >>> 0;
}

/** 尝试按“用户可见字符”(grapheme)截取首字符（支持 emoji/组合字符更��） */
function pickFirstGrapheme(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const Seg = (Intl as any).Segmenter as
    | (new (locales?: string | string[], options?: { granularity: "grapheme" }) => {
        segment(input: string): Iterable<{ segment: string }>;
      })
    | undefined;

  if (Seg) {
    const seg = new Seg(undefined, { granularity: "grapheme" });
    for (const s of seg.segment(trimmed)) return s.segment;
  }
  return Array.from(trimmed)[0] ?? "";
}

/** 背景色：推荐 HSL，比较均匀且更好看 */
function hashToHsl(hash: number, saturation = 65, lightness = 50): string {
  const hue = hash % 360;
  return `hsl(${hue} ${clamp(saturation, 0, 100)}% ${clamp(lightness, 0, 100)}%)`;
}

/** 背景色：hash -> #RRGGBB（可选） */
function hashToHex(hash: number): string {
  const r = (hash & 0xff0000) >>> 16;
  const g = (hash & 0x00ff00) >>> 8;
  const b = (hash & 0x0000ff) >>> 0;
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

function to2(n: number): string {
  return n.toString(16).padStart(2, "0");
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** 计算背景色的相对亮度，决定用黑/白字（粗略但实用） */
export function pickReadableTextColor(bgColor: string): "#000" | "#fff" {
  if (bgColor.startsWith("#") && bgColor.length === 7) {
    const r = parseInt(bgColor.slice(1, 3), 16) / 255;
    const g = parseInt(bgColor.slice(3, 5), 16) / 255;
    const b = parseInt(bgColor.slice(5, 7), 16) / 255;
    const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const R = lin(r),
      G = lin(g),
      B = lin(b);
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

/** HTML 属性转义（避免注入） */
function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** 判断是否以英文/拉丁字母开头（简单但符合你需求的“英文”判定） */
function startsWithAsciiLetter(s: string): boolean {
  const c = s.charCodeAt(0);
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

/**
 * 英文双字母策略：
 * - 取文本中前 2 个“字母”(A-Za-z)（忽略空格/符号）
 * - 不足 2 个则退化为 1 个
 * - 最终转大写
 */
function pickTwoAsciiLetters(s: string): string {
  let out = "";
  for (let i = 0; i < s.length && out.length < 2; i++) {
    const c = s.charCodeAt(i);
    const isLetter = (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
    if (isLetter) out += s[i];
  }
  return out.toUpperCase();
}

/** 生成 icon 信息与 HTML 字符串 */
export function textToIcon(text: string, opts: TextIconOptions = {}): TextIconResult {
  const o = { ...textIconOptions_default, ...opts };

  const trimmed = (text ?? "").trim();

  let char: string;
  if (trimmed.length === 0) {
    char = o.fallbackChar;
  } else if (o.twoLettersForEnglish && startsWithAsciiLetter(trimmed)) {
    char = pickTwoAsciiLetters(trimmed) || o.fallbackChar;
  } else {
    char =
      o.pick === "grapheme"
        ? (pickFirstGrapheme(trimmed) || o.fallbackChar)
        : (Array.from(trimmed)[0] || o.fallbackChar);
  }

  const hash = fnv1a32(trimmed || o.fallbackChar);

  const bgColor = o.bgMode === "hex" ? hashToHex(hash) : hashToHsl(hash, o.saturation, o.lightness);
  const fgColor = o.textColor === "auto" ? pickReadableTextColor(bgColor) : o.textColor;

  // 2 个字符时字号稍微小一点，避免挤
  const baseFontSize = Math.floor(o.size * 0.5);
  const fontSize = char.length >= 2 ? Math.floor(baseFontSize * 0.82) : baseFontSize;

  const style =
    [
      "display:inline-flex",
      "align-items:center",
      "justify-content:center",
      `width:${o.size}px`,
      `height:${o.size}px`,
      `border-radius:${o.radius}px`,
      `background:${bgColor}`,
      `color:${fgColor}`,
      `font-family:${o.fontFamily}`,
      `font-weight:${o.fontWeight}`,
      `font-size:${fontSize}px`,
      "line-height:1",
      "user-select:none",
      "flex:0 0 auto",
    ].join(";") + ";";

  const html = `<span aria-label="${escapeHtml(trimmed || text)}" title="${escapeHtml(trimmed || text)}" style="${escapeHtml(style)}">${escapeHtml(char)}</span>`;

  return { text, trimmed, char, hash, bgColor, fgColor, html, style };
}

/** 直接创建 DOM 元素（浏览器环境） */
export function createTextIconElement(text: string, opts: TextIconOptions = {}): HTMLSpanElement {
  const r = textToIcon(text, opts);
  const span = document.createElement("span");
  span.setAttribute("aria-label", r.trimmed || r.text);
  span.title = r.trimmed || r.text;
  span.style.cssText = r.style;
  span.textContent = r.char;
  return span;
}
