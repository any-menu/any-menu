import type { PanelItem } from "../../../Type";
import { AbsAmPanel } from "../abs";
type MENU_NODE = {
    el: HTMLElement | null;
    parent: MENU_NODE | null;
    children: MENU_NODE[];
    vFocus_index: number;
};
export declare const all_append_data: PanelItem[];
export declare class AMContextMenu extends AbsAmPanel {
    static factory(p_panel: AbsAmPanel, menuItems?: PanelItem[], el_input?: HTMLInputElement): AMContextMenu;
    constructor(p_panel: AbsAmPanel, menuItems?: PanelItem[]);
    panel_show(): void;
    panel_hide(): void;
    panel_toggle(): void;
    menu_el_data_root: MENU_NODE;
    menu_el_data_current: MENU_NODE;
    append_data(menuItems: PanelItem[]): void;
    static li_list(ul: HTMLElement, menuItems: PanelItem[], current_node: MENU_NODE, is_root?: boolean): void;
    append_el(el: HTMLElement): void;
    append_headerEditor(header_old: string, header_callback: (header_new: string) => void): void;
    vFocus_bind_arrowKeyArea(el_input: HTMLInputElement): void;
    private vFocus_update;
}
export {};
