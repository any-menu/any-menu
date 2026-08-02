import { EditableBlock_Cm } from "@editableblock/cm/dist/EditableBlock_Cm/src/";
import { EditableBlock_Code } from "@editableblock/code/dist/EditableBlock_Code/src/";
import { AbsAmPanel } from "../abs";
export declare class AMMiniEditor extends AbsAmPanel {
    cache_text: string;
    editableBlock: EditableBlock_Cm | EditableBlock_Code;
    private editableBlock_cm;
    private editableBlock_code;
    isShow: boolean;
    static factory(p_panel: AbsAmPanel): AMMiniEditor;
    constructor(p_panel: AbsAmPanel);
    flag: 'miniEditor' | 'info' | '';
    set_flag(mode: 'miniEditor' | 'info'): void;
    changeEngine(btn_md_mode: HTMLElement, engine?: 'codeblock' | 'cm'): void;
    panel_show(new_text?: string, is_focus?: boolean): void;
    panel_hide(): void;
    panel_toggle(): void;
    visual_listener_keydown: (ev: KeyboardEvent) => void;
}
