export * from './contextmenu/index';
export * from './search/index';
import { AMSearch } from './search/index';
import { AMToolbar } from './toolbar/index';
import { AMContextMenu } from './contextmenu/index';
import { AMMiniEditor } from './miniEditor/index';
export declare const global_el: {
    amPanel: AMPanel | null;
    amSearch: AMSearch | null;
    amToolbar: AMToolbar | null;
    amContextMenu: AMContextMenu | null;
    amMiniEditor: AMMiniEditor | null;
    amCustom: HTMLElement | null;
    alt_v_state: boolean;
};
export declare class AMPanel {
    el: HTMLElement;
    static factory(el: HTMLElement): {
        amSearch: AMSearch | null;
        amContextMenu: AMContextMenu | null;
    };
    private constructor();
    static panel_show(pos: {
        x: number;
        y: number;
    } | undefined, list?: string[], is_focus?: boolean, is_reverse?: boolean): void;
    static panel_hide(list?: string[]): void;
    static panel_toggle(item: string): void;
    private SubPanel;
    register_sub_panel(id: string, el: HTMLElement | ((el: HTMLElement) => void)): void;
    unregister_sub_panel(id: string): void;
    static visual_listener_mousedown(ev: MouseEvent): void;
    static visual_listener_keydown(ev: KeyboardEvent): void;
    static cache_last_panel_list: string[];
    static get_size(list?: string[]): {
        width: number;
        height: number;
    };
    static fix_position(screen_size: {
        width: number;
        height: number;
    }, panel_size: {
        width: number;
        height: number;
    }, cursor: {
        x: number;
        y: number;
    }, mode?: "revert" | "side", center_x?: boolean): {
        x: number;
        y: number;
    };
}
