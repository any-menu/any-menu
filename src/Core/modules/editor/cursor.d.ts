export declare function get_selection_el(): HTMLElement | null;
export declare function get_selection_rect(): {
    left: number;
    top: number;
    right: number;
    bottom: number;
} | null;
export declare function get_selection_text(): void;
export declare namespace EditorTools {
    const state: {
        el: HTMLTextAreaElement | HTMLInputElement | HTMLElement | null;
        range: {
            start: number;
            end: number;
        } | Range | null;
    };
    function saveCurrentCursor(el: HTMLElement): void;
    function recoverCursor(insertText?: string): boolean;
}
