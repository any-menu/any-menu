import type { PanelItem } from "../../../Type";
import { AbsAmPanel } from "../abs";
export declare class AMToolbar extends AbsAmPanel {
    isShow: boolean;
    static factory(p_panel: AbsAmPanel): AMToolbar;
    constructor(p_panel: AbsAmPanel);
    append_data(toolbarItems: PanelItem[]): void;
    panel_show(): void;
    panel_hide(): void;
    panel_toggle(): void;
}
