import { AbsAmPanel } from '../abs';
export * from '../contextmenu/index';
export * from '../search/index';
import { AMSearch } from '../search/index';
import { AMToolbar } from '../toolbar/index';
import { AMContextMenu } from '../contextmenu/index';
import { AMMiniEditor } from '../miniEditor/index';
import { AMPin } from './pin/index';
import { AMTitlebar } from './titlebar';
export declare let activeAMPanel: AMPanel | null;
export declare class AMPanel extends AbsAmPanel {
    sub_panels: {
        amTitlebar: AMTitlebar | null;
        amPin: AMPin | null;
        amSearch: AMSearch | null;
        amToolbar: AMToolbar | null;
        amContextMenu: AMContextMenu | null;
        amMiniEditor: AMMiniEditor | null;
        amCustom: HTMLElement | null;
    };
    alt_v_state: boolean;
    show_panel_list: string[];
    sub_panel_list: {
        id: string;
        obj: AbsAmPanel;
    }[];
    custom_sub_panel: {
        [key: string]: HTMLElement;
    };
    static factory(p_el: HTMLElement): AMPanel;
    private constructor();
    private initSubPanels;
    destroy(): void;
    panel_show(pos?: {
        x: number;
        y: number;
    }, list?: string[], is_focus?: boolean, is_reverse?: boolean): void;
    panel_hide(list?: string[], focusHide?: boolean): void;
    panel_toggle(item: string): void;
    register_sub_panel(id: string, el: HTMLElement | ((el: HTMLElement) => void)): void;
    unregister_sub_panel(id: string): void;
    visual_listener_mousedown: (ev: MouseEvent) => void;
    visual_listener_keydown: (ev: KeyboardEvent) => void;
    get_size(list?: string[]): {
        width: number;
        height: number;
    };
    static fix_position(screen_size: {
        width: number;
        height: number;
    }, panel_size: {
        width: number;
        height: number;
    }, selection_rect: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }, mode?: "revert" | "side", x_dire?: "right" | "center", y_dire?: "top" | "bottom"): {
        x: number;
        y: number;
        is_reverse: boolean;
    };
    static fix_position_when_move(screen_size: {
        width: number;
        height: number;
    }, panel_size: {
        width: number;
        height: number;
    }, target_pos: {
        x: number;
        y: number;
    }): {
        x: number;
        y: number;
    };
}
