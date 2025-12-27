// Code from https://github.com/valentine195/obsidian-admonition/blob/master/src/lang/helpers.ts

import { getLanguage } from 'obsidian'; // https://github.com/obsidianmd/obsidian-translations?tab=readme-ov-file#existing-languages

import en from './en';
import zhCN from './zh-cn'

const localeMap: { [key: string]: Partial<typeof en> } = {
  en,
  'zh': zhCN,
  'zh-TW': zhCN,
  // 'zh-cn': zhCN, // moment.locale 则是 zh-cn, getLanguage 不是
};

const locale = localeMap[getLanguage()];

export function t(str: keyof typeof en): string {
  return (locale && locale[str]) || en[str];
}
