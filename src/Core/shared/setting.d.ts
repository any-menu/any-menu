import type { UrlRequestConfig, UrlResponse } from '../../Type';
export declare const global_setting: {
    platform: 'app' | 'obsidian-plugin' | 'browser-plugin' | 'vscode-plugin' | 'browser';
    isDebug: boolean;
    focusStrategy: true | false;
    config: {
        language: 'auto' | 'English' | '中文' | string;
        pinyin_index: boolean;
        pinyin_first_index: boolean;
        search_engine: 'reverse' | 'trie';
        search_limit: number;
        server_port: number;
        dict_online_source: 'gitee' | 'github';
        config_paths: string;
        dict_paths: string;
        note_paths: string;
        cache_paths: string;
        send_text_method: 'keyboard' | 'clipboard' | 'auto';
        auto_show_toolbar_on_select: boolean;
        auto_append_to_contextmenu: 'disable' | 'right' | 'bottom' | 'both' | 'replace';
        app_black_list: string[];
        app_ad_shortcut: boolean;
        toolbar_list: string[];
        context_menu_list: string[];
        panel_preset2: [
            {
                key: string;
                list: string[];
                is_focus: boolean;
                position_mode: 'center' | 'cursor' | 'mouse';
            },
            {
                key: string;
                list: string[];
                is_focus: boolean;
                position_mode: 'center' | 'cursor' | 'mouse';
            },
            {
                key: string;
                list: string[];
                is_focus: boolean;
                position_mode: 'center' | 'cursor' | 'mouse';
            }
        ];
        theme: string;
        darkmode: 'light' | 'dark' | 'auto';
    };
    config_css_vars: {
        varName: string;
        name?: string;
        value: string;
        darkValue?: string;
    }[];
    config_plugins: {
        path: string;
        version?: string;
        enabled: boolean;
    }[];
    config_: {
        is_auto_startup: boolean;
        pinyin_method: 'pinyin';
        menu_position: 'cursor' | 'mouse' | 'screen';
    };
    state: {
        language: 'en' | 'zh' | 'zh-TW' | string;
        isDark: boolean;
        isPin: boolean;
        editor_engine: 'codeblock' | 'cm';
        selectedText?: string;
        infoText: string;
        activeAppName?: string;
        activeDocTitle?: string;
        activeDocUrl?: string;
    };
    api: {
        safeInnerHTML: (el: HTMLElement, content: string) => void;
        isFolder: (relPath: string) => Promise<boolean>;
        readFile: (relPath: string) => Promise<string | null>;
        readFolder: (relPath: string, recursion_depth?: number) => Promise<string[]>;
        writeFile: (relPath: string, content: string, is_append?: boolean) => Promise<boolean>;
        deleteFile: (relPath: string) => Promise<boolean>;
        loadConfig: () => Promise<boolean | string>;
        saveConfig: () => Promise<boolean>;
        getCursorXY: () => Promise<{
            x: number;
            y: number;
        }>;
        getScreenSize: () => Promise<{
            width: number;
            height: number;
        }>;
        getInfo: () => Promise<string | null>;
        notify: (message: string) => Promise<void>;
        pin: (isPin?: boolean) => Promise<void>;
        sendText: (text: string, mode?: 'IMG_MODE') => Promise<void>;
        saveToClipboard: (text: string) => Promise<void>;
        urlRequest: (conf: UrlRequestConfig) => Promise<UrlResponse | null>;
        getSystemIsDark: () => boolean;
    };
    other: {
        obsidian_plugin: any | null;
        obsidian_ctx: any | null;
        obsidian_run_command: null | ((commandId: string) => Promise<void>);
        renderMarkdown: null | ((markdown: string, el: HTMLElement, ctx?: any) => Promise<void>);
        app_show: (pos?: 'cursor' | 'center', panel_list?: string[]) => Promise<void>;
        app_hide: (panel_list?: string[], forceBlurApp?: boolean) => Promise<void>;
        app_showInExplorer: (relPath: string) => Promise<void>;
        app_selectInExplorer: (relPath: string) => Promise<string | null>;
        app_convertFileSrc: (relPath: string) => Promise<string>;
        app_createTitlebar: (el: HTMLElement) => Promise<void>;
    };
};
export declare function proxy_global_setting(): void;
