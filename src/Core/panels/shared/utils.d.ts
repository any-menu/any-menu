type TextIconOptions_arg = {
    size?: number;
    pick?: "grapheme" | "codePoint";
    twoLettersForEnglish?: boolean;
};
export type TextIconResult = {
    text: string;
    trimmed: string;
    char: string;
    html: string;
    style: string;
};
export declare function textToIcon(text: string, opts?: TextIconOptions_arg): TextIconResult;
export declare function textToHashColor(text: string, bgColorMode?: "hex" | "hsl", fgColorMode?: "auto" | string, saturation?: number, lightness?: number): {
    color: string;
    background: string;
};
export {};
