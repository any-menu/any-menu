import { ABContextMenu } from "../../../Core/panel/contextmenu/index"
import { global_setting } from "../../../Core/setting"

import { hideWindow } from "../module/window"

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
