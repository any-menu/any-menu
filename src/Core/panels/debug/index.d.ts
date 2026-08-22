import { AbsAmPanel } from "../abs";
export declare class AMDebug extends AbsAmPanel {
    private interval;
    static factory(p_panel: AbsAmPanel): AMDebug;
    constructor(p_panel: AbsAmPanel);
    panel_show(): void;
    panel_hide(): void;
    panel_toggle(): void;
}
