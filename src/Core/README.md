目录

- locals/         | 多语言
- panel/          | 主面板和子面板
- pluginManager/  | js插件管理器 (不含普通词典)
- settingPanel    | 设置面板
- styles/         | 样式

依赖关系

- locals | setting
  - pluginManager
    - panel
      - pluginManager 的 initTool
