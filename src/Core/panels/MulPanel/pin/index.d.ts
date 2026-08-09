import { AMPanel } from "..";
import { AbsAmPanel } from "../../abs";
export declare class AMPin extends AbsAmPanel {
    p_panel: AbsAmPanel;
    amPanel: AMPanel;
    static factory(p_panel: AbsAmPanel, amPanel: AMPanel): AMPin;
    constructor(p_panel: AbsAmPanel, amPanel: AMPanel);
    static initEvent(pinEl: HTMLElement, amPanel: AMPanel): void;
    hide(): void;
    show(): void;
}
