import {App, PluginSettingTab, Setting, Modal, sanitizeHTMLToDom} from "obsidian"
import { initSettingTab } from "@/Core/SettingTab"

export class AMSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: any) {
    super(app, plugin);
  }

  display(): void {
    const {containerEl} = this;
    const { tab_nav_container, tab_content_container } = initSettingTab(containerEl)
  }
}
