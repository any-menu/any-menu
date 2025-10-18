import { ABContextMenu } from "../../../Core/panel/contextmenu/index"

import { hideWindow } from "../module/window"

export class ABContextMenu2 extends ABContextMenu {
  hide(): void {
    super.hide()
    // hideWindow()
  }
}
