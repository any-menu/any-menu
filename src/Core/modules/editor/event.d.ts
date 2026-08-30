export declare class DocumentListeners {
    isContextOpening: boolean;
    isKeyboardSelection: boolean;
    isMouseSelecting: boolean;
    isMouseDown: boolean;
    pointerX: number;
    pointerY: number;
    protected previewSelection: Selection | null;
    constructor();
    register(): void;
    unregister(): void;
    onContextMenu: () => void;
    onKeyDown: (ev: KeyboardEvent) => void;
    onKeyUp: (event: KeyboardEvent) => void;
    onDoubleClick: (event: MouseEvent) => Promise<void>;
    onMouseDown: (event: MouseEvent) => void;
    onMouseUp: (event: MouseEvent) => Promise<void>;
    onMouseMove: (event: MouseEvent) => void;
    onSelectionChange: (_event: Event) => void;
    selection_whiteList: string | null;
    setSelection_whiteList(className: string): void;
    show_whiteList: string | null;
    setShow_whiteList(className: string): void;
    protected updateSelectedText(): void;
    protected getMsg_and_showPanel(): Promise<void>;
}
