// Code from https://github.com/valentine195/obsidian-admonition/blob/master/src/lang/helpers.ts

import { global_setting } from '../setting';
import en from './en';
import zhCN from './zh-cn'

/**
 * 翻译字典 - 所有语言
 * 
 * 扩充方法: 需要合并 localeMap 与附加字典，写入如:
 * 
 * 添加新语言:
 * localeMap = {
 *   ...localeMap,
 *   'fr': fr,
 * }
 * 
 * 扩展原来的语言: (但这种做法存在一个问题: 不好去检查类型是否正确)
 * localeMap = {
 *   en: { ...en, ...extraEN },
 *   'zh': { ...zhCN, ...extraZH },
 *   'zh-TW': { ...zhCN, ...extraZH },
 * }
 * 或
 * localeMap['en'] = { ...localeMap['en'], ...extraDict };
 * localeMap['zh'] = { ...localeMap['zh'], ...extraDict };
 */
export const localeMap: { [key: string]: Partial<typeof en> } = {
  en,
  'zh': zhCN,
  'zh-TW': zhCN,
  // 'zh-cn': zhCN, // moment.locale 则是 zh-cn, getLanguage 不是
};

/**
 * 翻译字典 - 当前语言
 * 可以切换语言: locale = localeMap['<语言>']
 * 
 * obsidian 版本用 import { getLanguage } from 'obsidian'; getLanguage()
 * app 版本用系统 api
 */
export let locale: Partial<typeof en> | undefined

/**
 * 翻译接口函数
 */
export function t(str: keyof typeof en): string {
  if (!locale == undefined) {
    // 别名
    if (global_setting.state.language == 'English') global_setting.state.language = 'en'
    else if (global_setting.state.language == '中文') global_setting.state.language = 'zh'

    locale = localeMap[global_setting.state.language]
  }
  return (locale && locale[str]) || en[str]; // 无翻译对应语言翻译则用英语
}
