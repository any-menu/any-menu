// Code from https://github.com/valentine195/obsidian-admonition/blob/master/src/lang/helpers.ts

import { getLanguage } from 'obsidian'; // https://github.com/obsidianmd/obsidian-translations?tab=readme-ov-file#existing-languages

import { localeConfig, localeMap } from '@/Core/locales/helper';
export { t } from '@/Core/locales/helper'

localeConfig.locale = localeMap[getLanguage()]
