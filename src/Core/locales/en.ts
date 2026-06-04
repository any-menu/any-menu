export default {
  // Core setting tab
  'Mini docs': 'Mini docs',
  'Mini docs2': `Instructions for Use
<br><br>
The default shortcuts are Alt+A to open the search box and menu, and Alt+S to open the quick editor (The App version can also use the advanced shortcuts Caps+M or Caps+N) (All shortcuts can be modified in the settings).
<br><br>
(The shortcuts above are the recommended settings. Because Obsidian officially does not recommend plugins using shortcuts by default, please manually set the shortcuts for the two commands: "Show panel: preset 1" and "Show panel: preset 2").
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

  // 通用可视化设置
  'Config': 'Config',
  'Config2': 'Currently, not all configurable items support visual editing. Some configurations can be edited manually in the plugin/software folder by opening the configuration files.',
  'Config file2': `Note: In this case, editing the data.json file in the plugin folder is the same as in the text mode you used before, except for the additional JSON format check. There is no difference.
It is generally not recommended to perform manual editing. It is recommended to use other tabs for visual editing. If you need to edit here, it is suggested to press the "Refresh" button before doing so.`,

  'Dict config': 'Dict Config',
  'Dict path': 'Dict path',
  'Dict path2': 'Dictionary storage path. You can save it in the document library for easy editing at any time, such as ./dict/; \n\
You can also save the dictionary in the plugin file, such as ./.obsidian/plugins/any-menu/',
  'Dict online source': 'Dict online source',
  'Dict online source2': 'Source of online dictionary: gitee or github',
  'Index engine': 'Index engine',
  'Index engine2': 'Fuzzy matching/reverse order | Prefix tree',

  'Dict index config': 'Dict Index Config',
  'Pinyin index': 'Pinyin index',
  'Pinyin index2': 'Is it the case that the Chinese "key" is automatically constructed with a pinyin index?',
  'Pinyin first index': 'Pinyin first index',
  'Pinyin first index2': 'Is it the case that the Chinese "key" is automatically constructed into an index using the initial letters of pinyin?\n\
(Note: The Chinese pinyin library can be quite large, so the plugin version does not come with the pinyin index function by default. If you need to use it, please manually download the pinyin version from the Github repository)',

  'Other config': 'Other config',
  'Show panel: preset 1': 'Show panel: preset 1',
  'Show panel: preset 2': 'Show panel: preset 2',
  'Show panel: preset 3': 'Show panel: preset 3',
  'Note path': 'Note path',
  'Note path2': 'In the quick note function, the save path of the note.',
  'Debug mode': 'Debug mode',
  'Debug mode2': 'Only for developer use. Mainly for enabling some additional console logging.',
  'Auto show toolbar on select': 'Auto show toolbar on select',
  'Auto show toolbar on select2': 'Automatically show the toolbar when text is selected in the editor',
  'Server port': 'HTTP server port',
  'Server port2': 'For the App version, it is the port for the HTTP service; for the plugin version, it is the port to access.\n\
Both need to be consistent. Enter 0 to disable this service. If you have not installed the local App version, this item is also invalid.',
  'Reload plugin': 'Reload plugin',

  'App config': 'App Config',
  'Send text method': 'Send text method',
  'Send text method2': 'clipboard via clipboard, keyboard via simulated keyboard input, auto automatically selects (based on length, etc.)',
  'Is use ad shortcut': 'Enable advanced shortcut',
  'Is use ad shortcut2': 'Whether to enable advanced shortcuts (e.g., `Caps+` etc.)',

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
