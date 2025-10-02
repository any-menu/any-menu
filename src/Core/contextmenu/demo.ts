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
