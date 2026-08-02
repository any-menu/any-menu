export declare class AMSuggestion {
    el_suggestion: HTMLElement;
    static factory(el_input: HTMLInputElement, el_input_parent: HTMLElement): AMSuggestion;
    private constructor();
    panel_show(): void;
    panel_hide(): void;
    bind_input(el_input: HTMLInputElement): void;
    private currentFocus;
    private vFocus_update;
    search(el_suggestion: HTMLElement, query: string): Promise<{
        key: string;
        value: string;
    }[]>;
    private search_img;
}
