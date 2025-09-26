import { ABContextMenu } from "../../../Core/contextmenu/index"

import { hideWindow } from "../module/window"
import { invoke } from "@tauri-apps/api/core"

export class ABContextMenu2 extends ABContextMenu {
  public override async sendText(str: string) {
    // 获取当前焦点元素（通常是输入框、文本区域或可编辑元素）
    const activeElement: Element|null = document.activeElement

    // 检查该元素是否是可编辑的输入框或文本域
    if (!activeElement) {
      console.warn('没有活动的元素，将demo文本生成到剪贴板')
      navigator.clipboard.writeText(str).catch(err => console.error("Could not copy text: ", err))
    } else {
      // EditableBlock_Raw.insertTextAtCursor(activeElement as HTMLElement, str)

      // [!code hl] Tauri
      // 非 Tauri 程序中，我们采用了非失焦的方式展开菜单
      // 但 Tauri 程序中，我们采用了失焦的方式展开菜单
      // 这里应该多一个判断。不过这里恒为后者
      hideWindow()
      await new Promise(resolve => setTimeout(resolve, 2)) // 等待一小段时间确保窗口已隐藏且焦点已切换
      // await invoke("paste", { text: 'paste from button' })
      await invoke("send", { text: str })
    }

    this.visual_hide()
  }
}
