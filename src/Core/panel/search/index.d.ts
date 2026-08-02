import { AMSuggestion } from "./AMSuggestion";
export declare class AMSearch {
    el_parent: HTMLElement | null;
    el: HTMLElement;
    el_input: HTMLInputElement | null;
    amSuggestion: AMSuggestion | null;
    static factory(el_parent: HTMLElement): AMSearch;
    constructor(el_parent: HTMLElement);
    createDom(el: HTMLElement): HTMLElement;
    panel_show(is_focus?: boolean): void;
    panel_hide(): void;
    panel_toggle(): void;
}
