import en from './en';
export declare let locale: Partial<typeof en> | undefined;
export declare function t(str: keyof typeof en): string;
