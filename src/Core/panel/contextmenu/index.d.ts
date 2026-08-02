import type { PanelItem } from "../../../Type";
type MENU_NODE = {
    el: HTMLElement | null;
    parent: MENU_NODE | null;
    children: MENU_NODE[];
    vFocus_index: number;
};
export declare class AMContextMenu {
    el_parent: HTMLElement | undefined;
    el: HTMLDivElement | undefined;
    static factory(el_parent?: HTMLElement, menuItems?: PanelItem[], el_input?: HTMLInputElement): AMContextMenu;
    constructor(el_parent?: HTMLElement, menuItems?: PanelItem[]);
    panel_show(): void;
    panel_hide(): void;
    panel_toggle(): void;
    menu_el_data_root: MENU_NODE;
    menu_el_data_current: MENU_NODE;
    append_data(menuItems: PanelItem[]): void;
    append_el(el: HTMLElement): void;
    append_headerEditor(header_old: string, header_callback: (header_new: string) => void): void;
    vFocus_bind_arrowKeyArea(el_input: HTMLInputElement): void;
    private vFocus_update;
}
export {};
