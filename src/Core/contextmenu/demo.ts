export { parse as toml_parse, stringify as toml_stringify } from "smol-toml"

/**
 * 由于有别名模块，以及支持处理器串行。别名和demo部分均不绑定到处理器上，而是作为独立模块
 */

export type ContextMenuItem = {
  label: string
  // 如果是字符串则表示黏贴该字符串，方便声明demo模板 (TODO demo模板可能需要配图和help url?)
  callback?: string | ((str?: string) => void)
  icon?: string // 目前仅obsidian环境有效，使用lucide图标
  detail?: string // 悬浮时展示说明 (为安全起见，目前仅支持图片链接而非任意html)
  children?: ContextMenuItems
}
export type ContextMenuItems = ContextMenuItem[]

// const root_menu_convert: ContextMenuItems = [
//   { label: '未检测到选中文本 (未开发)' },
// ]

// export const root_menu_demo: ContextMenuItems // 弃用，改为toml配置

export const root_menu_callout: ContextMenuItems = [
  // callout
  {
    label: 'callout', children: [
      { label: 'note', callback: `> [!note]\n> \n> Note demo.\n\n` },
      { label: 'warning', callback: `> [!warning]\n> \n> Warning demo.\n\n` },
      { label: 'tip', callback: `> [!tip]\n> \n> Tip demo.\n\n` },
      { label: 'note_complex', callback: `> [!note]+ title\n> Note demo.\n\n` },
    ]
  },
  // mdit container
  {
    label: 'mdit container', children: [
      { label: 'note', callback: `:::note\nNote demo.\n:::\n\n` },
      { label: 'warning', callback: `:::warning\nWarning demo.\n:::\n\n` },
      { label: 'tip', callback: `:::tip\nTip demo.\n:::\n\n` },
      { label: 'note_complex', callback: `:::note+ title\nNote demo.\n:::\n\n` },
    ]
  },
]

// export const root_menu: ContextMenuItems = [
//   // TODO 转换菜单需要选中文本且文本满足一定规则才会显示，并根据内容进行推荐
//   { label: 'AnyBlock', icon: 'list-plus', children: root_menu_demo },
//   // { label: '转化为AnyBlock', icon: 'list-plus', children: root_menu_convert }
// ]
