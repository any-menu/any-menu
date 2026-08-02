import type { PanelItem } from "../../../Type";
export declare class AMToolbar {
    el_parent: HTMLElement;
    el: HTMLElement;
    isShow: boolean;
    static factory(el_parent: HTMLElement): AMToolbar;
    constructor(el_parent: HTMLElement);
    append_data(toolbarItems: PanelItem[]): void;
    panel_show(): void;
    panel_hide(): void;
    panel_toggle(): void;
}
