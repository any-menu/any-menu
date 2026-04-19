export default {
  // Core setting tab
  'Mini docs': 'Mini docs',
  'Mini docs2': `Instructions for Use
<br><br>
The default shortcuts are Alt+A to open the search box and menu, and Alt+S to open the quick editor (The App version can also use the advanced shortcuts Caps+M or Caps+N) (All shortcuts can be modified in the settings).
<br><br>
(The shortcuts above are the recommended settings. Because Obsidian officially does not recommend plugins using shortcuts by default, please manually set the shortcuts for the two commands: "Show panel: search and menu" and "Show panel: miniEditor").
<br><br>
For more instructions and tutorials:
<ul>
  <li>repository: https://github.com/any-menu/any-menu</li>
  <li>document: https://any-menu.github.io/any-menu/</li>
</ul>
!!! Note: After modifying the current settings panel, when using the plugin, you need to restart the plugin; when using the software version, you need to restart the software for the changes to take effect.
`,
  'Local dict': 'Local dict',
  'Online dict': 'Online dict',

  'Toolbar': 'Toolbar',
  'Toolbar2': `Toolbar customization. You can customize icons, order, which files to enable, etc.
\nIf not configured, the enabled script files will be used by default`,
  'Menu': 'Menu',
  'Menu2': `Menu customization. You can customize the order, which files to enable, etc.
\nIf not configured, the enabled class JSON files will be used by default`,

  // App 专属设置 (app 的非用户友好设置，直接编辑配置文件)
  // 暂无

  // Obsidian 专属设置，setting.ts (obsidian 的可视化设置)
  'Config': 'Config',
  'Config2': 'Currently, not all configurable items support visual editing. For some configurations, you can manually edit the data.json file in the plugin folder.',
  'Config file2': `Note: In this case, editing the data.json file in the plugin folder is the same as in the text mode you used before, except for the additional JSON format check. There is no difference.
It is generally not recommended to perform manual editing. It is recommended to use other tabs for visual editing. If you need to edit here, it is suggested to press the "Refresh" button before doing so.`,
  'Pinyin index': 'Pinyin index',
  'Pinyin index2': 'Is it the case that the Chinese "key" is automatically constructed with a pinyin index?',
  'Pinyin first index': 'Pinyin first index',
  'Pinyin first index2': 'Is it the case that the Chinese "key" is automatically constructed into an index using the initial letters of pinyin?',
  'Dict paths': 'Dict paths',
  'Dict paths2': 'Dictionary storage path. You can save it in the document library for easy editing at any time, such as ./dict/; \n\
You can also save the dictionary in the plugin file, such as ./.obsidian/plugins/any-menu/',
  'Dict online source': 'Dict online source',
  'Dict online source2': 'Source of online dictionary: gitee or github',
  'Debug mode': 'Debug mode',
  'Debug mode2': 'Only for developer use',
  'Auto show toolbar on select': 'Auto show toolbar on select',
  'Auto show toolbar on select2': 'Automatically show the toolbar when text is selected in the editor',
  'Reload plugin': 'Reload plugin',

  // Online dict / Local dict
  'Id': 'Id',
  'Path': 'Path',
  'Name': 'Name',
  'Author': 'Author',
  'Description': 'Description',
  'Is enabled': 'Enabled',
  'Is downloaded': 'Downloaded',
  'Enabled': 'Enabled',
  'Disabled': 'Disabled',
  'Download': 'Download',
  'Downloaded': 'Downloaded',
  'Downloading': 'Downloading',
  'Download failed': 'Download failed',
  'Uninstall': 'Uninstall',
  'Uninstalled': 'Uninstalled',
  'Uninstalled failed': 'Uninstalled failed',

  'Load': 'Load',
  'Loading': 'Loading',
  'Load failed': 'Load failed',
  'Load successed': 'Load successed',
  'Refresh dict list': 'Refresh dict list',
  'Change dataview mode': 'Change dataview mode',

  // General
  'Submit': 'Submit',
  'Edit': 'Edit',
  'Refresh': 'Refresh',
  'Delete': 'Delete',
  'Save': 'Save',
  'Cancel': 'Cancel',
  'Close': 'Close',
  'Add': 'Add',
  'Drag': 'Drag',

  'Config file': 'Config file',
  'Save config': 'Save config',
}
