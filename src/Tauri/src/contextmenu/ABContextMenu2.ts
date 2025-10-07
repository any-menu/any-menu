import { ABContextMenu } from "../../../Core/contextmenu/index"
import { global_setting } from "../../../Core/Setting"

import { hideWindow } from "../module/window"
import { invoke } from "@tauri-apps/api/core"

global_setting.api.sendText = async (str: string) => {
  // 非 Tauri 程序中，我们采用了非失焦的方式展开菜单
  // 但 Tauri 程序中，我们采用了失焦的方式展开菜单
  // 这里应该多一个判断。不过这里恒为后者
  hideWindow()
  await new Promise(resolve => setTimeout(resolve, 2)) // 等待一小段时间确保窗口已隐藏且焦点已切换
  // await invoke("paste", { text: 'paste from button' })
  await invoke("send", { text: str, method: global_setting.config.send_text_method })
}

export class ABContextMenu2 extends ABContextMenu {
  public override async sendText(str: string) {
    await global_setting.api.sendText(str)
    this.visual_hide()
  }

  visual_hide(): void {
    super.visual_hide()
    hideWindow()
  }
}
