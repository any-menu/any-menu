import { type AMPanel } from ".";
import { AbsAmPanel } from "../abs";
export declare class AMTitlebar extends AbsAmPanel {
    amPanel: AMPanel;
    static factory(amPanel: AMPanel): AMTitlebar;
    constructor(amPanel: AMPanel);
    panel_hide(): void;
    panel_show(): void;
    private createHideBtn;
    private createPanelManagerBtn;
    private createReverseBtn;
    private createRefreshBtn;
}
