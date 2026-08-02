import { global_setting } from '../setting';
import en from './en';
import zhCN from './zh-cn';
const localeMap = {
    en,
    'zh': zhCN,
    'zh-TW': zhCN,
};
export let locale;
export function t(str) {
    if (locale == undefined) {
        if (global_setting.state.language == 'English')
            global_setting.state.language = 'en';
        else if (global_setting.state.language == '中文')
            global_setting.state.language = 'zh';
        locale = localeMap[global_setting.state.language];
    }
    return (locale && locale[str]) || en[str];
}
