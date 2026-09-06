import { AbsAmPanel } from "../abs";
import { AMSuggestion } from "./AMSuggestion";
export declare class AMSearch extends AbsAmPanel {
    el_input: HTMLInputElement;
    amSuggestion: AMSuggestion;
    private interval;
    static factory(p_panel: AbsAmPanel): AMSearch;
    constructor(p_panel: AbsAmPanel);
    init_el(): HTMLElement;
    panel_show(is_focus?: boolean): void;
    panel_hide(): void;
    panel_toggle(): void;
}
