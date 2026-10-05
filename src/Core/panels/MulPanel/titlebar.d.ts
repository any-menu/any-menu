import { AbsAmPanel } from "../abs";
import { type AMPanel } from ".";
export declare class AMTitlebar extends AbsAmPanel {
    amPanel: AMPanel;
    static factory(amPanel: AMPanel): AMTitlebar;
    constructor(amPanel: AMPanel);
    panel_hide(): void;
    panel_show(): void;
    private createFoldBtn;
    private createHideBtn;
    private createPanelManagerBtn;
    private createReverseBtn;
    private createRefreshBtn;
}
