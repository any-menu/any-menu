export declare class SettingItem {
    parent_el: HTMLElement;
    el: HTMLElement;
    el_info: HTMLElement;
    el_name: HTMLElement;
    el_desc: HTMLElement;
    el_control: HTMLElement;
    constructor(parent_el: HTMLElement);
    setName(name: string): this;
    setDesc(desc: string): this;
    setHeading(heading: string): this;
    setDivider(): this;
    addText(callback: (text: SettingItemText) => void): this;
    addPath(callback: (text: SettingItemPath) => void): this;
    addTextArea(callback: (text: SettingItemTextArea) => void): this;
    addToggle(callback: (toggle: SettingItemToggle) => void): this;
    addDropdown(callback: (select: SettingItemSelect) => void): this;
    addColorPicker(callback: (picker: SettingItemColorPicker) => void): this;
}
export type Setting = SettingItem;
declare abstract class SettingItemAbs {
    constructor(_parent_el: HTMLElement);
}
export declare class SettingItemText extends SettingItemAbs {
    el: HTMLInputElement;
    constructor(parent_el: HTMLElement);
    setType(type: 'text' | 'number' | 'date' | 'color' | 'email' | 'url' | 'time' | 'password' | 'search' | 'file'): this;
    setDisabled(disabled: boolean): this;
    setValue(value: string): this;
    onChange(callback: (value: string, el: HTMLInputElement) => void): this;
}
export declare class SettingItemPath extends SettingItemAbs {
    el: HTMLInputElement;
    btn?: HTMLButtonElement;
    constructor(parent_el: HTMLElement);
    setType(type: 'text' | 'number' | 'date' | 'color' | 'email' | 'url' | 'time' | 'password' | 'search' | 'file'): this;
    setDisabled(disabled: boolean): this;
    setValue(value: string): this;
    onChange(callback: (value: string, el: HTMLInputElement) => void): this;
}
export declare class SettingItemTextArea extends SettingItemAbs {
    el: HTMLTextAreaElement;
    constructor(parent_el: HTMLElement);
    setDisabled(disabled: boolean): this;
    setValue(value: string): this;
    onChange(callback: (value: string, el: HTMLTextAreaElement) => void): this;
}
export declare class SettingItemToggle extends SettingItemAbs {
    el: HTMLElement;
    el_input: HTMLInputElement;
    constructor(parent_el: HTMLElement);
    setDisabled(disabled: boolean): this;
    setValue(value: boolean): this;
    onChange(callback: (value: boolean, el: HTMLElement) => void): this;
}
export declare class SettingItemSelect extends SettingItemAbs {
    el: HTMLSelectElement;
    constructor(parent_el: HTMLElement);
    setOptions(options: {
        value: string;
        label: string;
    }[]): void;
    addOption(value: string, label: string): void;
    setDisabled(disabled: boolean): this;
    setValue(value: string): this;
    onChange(callback: (value: string, el: HTMLElement) => void): this;
}
export declare class SettingItemColorPicker extends SettingItemAbs {
    el: HTMLInputElement;
    constructor(parent_el: HTMLElement);
    setDisabled(disabled: boolean): this;
    setValue(value: string): this;
    onChange(callback: (value: string, el: HTMLElement) => void): this;
}
export {};
