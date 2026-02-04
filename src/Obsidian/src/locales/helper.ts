// Code from https://github.com/valentine195/obsidian-admonition/blob/master/src/lang/helpers.ts

import { getLanguage } from 'obsidian'; // https://github.com/obsidianmd/obsidian-translations?tab=readme-ov-file#existing-languages

import { global_setting } from '@/Core/setting';
export { t } from '@/Core/locales/helper'

// obsidian 强制为 'auto' 类型
// if (global_setting.config.language == 'auto') { // 触发时机有问题
global_setting.state.language = getLanguage()
