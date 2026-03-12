export default {
  // Core setting tab
  'Mini docs': '简易文档',
  'Mini docs2': `使用说明
<br><br>
默认使用 Alt+A 打开搜索框和菜单、Alt+S 打开快速编辑器 (App版也可以用高级快捷键 Caps+M 或 Caps+N) (均可在设置中修改快捷键)
<br><br>
(以上是推荐设置的快捷键，由于 Obsidian 官方不推荐插件默认使用快捷键，请自行分别设置 "Show panel: search and menu" 和 "Show panel: miniEditor" 这两个命令的快捷键)
<br><br>
更多说明和教程浏览:
<ul>
  <li>仓库: https://github.com/any-menu/any-menu</li>
  <li>文档: https://any-menu.github.io/any-menu/</li>
</ul>
!!! 注意: 当前设置面板修改过后，作为插件使用时需要重启插件，使用软件版时需要重启软件，才能生效
`,
  'Local dict': '本地词典',
  'Online dict': '在线词典',

  'Toolbar': '工具栏',
  'Toolbar2': `工具栏自定义。可自定义图标、顺序、启用哪些文件等
\n如果未配置，则默认会使用已启用的脚本文件`,

  // App 专属设置 (app 的非用户友好设置，直接编辑配置文件)
  // 暂无

  // Obsidian 专属设置，setting.ts (obsidian 的可视化设置)
  'Config': '配置',
  'Config2': '暂时并非所有可配置项均支持可视化编辑，部分配置可到插件文件夹下手动编辑data.json文件',
  'Config file2': `注意：在这编辑与你在插件文件夹中文本方式编辑 data.json，除多了 json 格式检查外没有区别。
一般不推荐进行手动编辑，推荐使用其他标签页进行可视化编辑。如果需要在此编辑，建议编辑前先按下 "刷新" 按钮`,
  'Pinyin index': '拼音索引',
  'Pinyin index2': '是否为中文key自动构建拼音索引',
  'Pinyin first index': '拼音首字母索引',
  'Pinyin first index2': '是否为中文key自动构建拼音首字母索引',
  'Dict paths': '词典路径',
  'Dict paths2': '词典保存路径。你可以保存在文档库中方便随时编辑，如 ./dict/；\n\
也可以把词典保存在插件文件中，如 ./.obsidian/plugins/any-menu/',
  'Dict online source': '在线词库来源',
  'Dict online source2': '在线词库来源: gitee 或 github (无法访问 github 则推荐用 gitee)',
  'Debug mode': '调试模式',
  'Debug mode2': '仅供开发者使用',
  'Reload plugin': '重启插件',

  // Online dict / Local dict
  'Id': 'Id',
  'Path': '路径',
  'Name': '名字',
  'Is enabled': '是否已启用',
  'Is downloaded': '是否已下载',
  'Enabled': '已启用',
  'Disabled': '已禁用',
  'Download': '下载',
  'Downloaded': '已下载',
  'Download failed': '下载失败',
  'Uninstall': '卸载',
  'Uninstalled': '已卸载',
  'Uninstalled failed': '卸载失败',

  'Load': '加载',
  'Loading': '加载中',
  'Load failed': '加载失败',
  'Load successed': '加载成功',
  'Refresh dict list': '刷新字典列表',

  // General
  'Submit': '提交',
  'Edit': '编辑',
  'Refresh': '刷新',
  'Delete': '删除',
  'Save': '保存',
  'Cancel': '取消',
  'Close': '关闭',
  'Add': '添加',
  'Drag': '拖动',

  'Config file': '配置文件',
  'Save config': '保存配置',
}
