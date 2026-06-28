# Custom ContextMenu

## 新内容

取自 AnyBlock Pro/src/contextmenu/

## 旧内容

这可以是一个与原插件无关的独立模块

基本功能：

- 支持obsidian与通用环境
- 允许通过非常简单的方式（json/可视化json）右键并自定义菜单
- 支持基本功能：插入文本、允许eval js
- 支持用户/插件自定义：其他插件可以通过api注册创建空demo/demo示例
- 支持多级菜单
- 支持选中文本后的 “转化” (使用自定义js实现)，
  如选中一部分后转化为代码块/引用块等/callout块等。或是去除空格、csv转table等等自定义js创建的功能
- 支持md文件/文件夹转demo json

ts类型：

```typescript
export type ContextMenuItem = {
  label: string;
  callback?: string | ((str: string) => void);
  children?: ContextMenuItems
}
export type ContextMenuItems = ContextMenuItem[]
```

自定义json类型:

```json
[{
  "label": "string",
  "text": "undefined | string",
  "callback": "undefined | string about ((str: string) => void)",
  "children": []
}]
```
