export { parse as toml_parse, stringify as toml_stringify } from "smol-toml"

/**
 * 由于有别名模块，以及支持处理器串行。别名和demo部分均不绑定到处理器上，而是作为独立模块
 */

export type ContextMenuItem = {
  label: string // 显示名，众多别名中的主名称
  // 如果是字符串则表示黏贴该字符串，方便声明demo模板 (TODO demo模板可能需要配图和help url?)
  callback?: string | ((str?: string) => Promise<void|string>)
  icon?: string // 目前仅obsidian环境有效，使用lucide图标
  key?: string // 匹配名，显示名的多个别名、匹配增强名、拼音等
  // 悬浮时展示说明 (为安全起见，目前仅支持图片链接而非任意html)。
  // 话说如果不包含用例，像ob环境，直接渲染岂不是更好?
  detail?: string
  children?: ContextMenuItems
}
export type ContextMenuItems = ContextMenuItem[]
