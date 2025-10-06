/**
 * 入口文件
 * 
 * 接管三个处理点：
 * - 代码块"ab" (代码块)
 * - cm (实时模式)
 * - 接管渲染后 (渲染/阅读模式)
 */

import {
  MarkdownRenderChild, MarkdownRenderer, loadMermaid, Plugin, MarkdownView,
  setIcon,
  type MarkdownPostProcessorContext
} from 'obsidian'
import { registerABContextMenu } from './contextmenu'

export default class AnyMenuPlugin extends Plugin {
  // settings: ABSettingInterface

  async onload() {
    console.log('>>> Loading plugin AnyMenu')

    // 初始化菜单
    registerABContextMenu(this)

    // 注册一个命令
    this.addCommand({
      id: 'any-menu-panel',
      name: '展开 AnyMenu 面板',
      callback: () => {
        // 命令触发时执行的函数
        console.log('你的命令被执行了！');
        // 在这里调用你的核心功能
      },
      // hotkeys: [] // 通常不在代码里重复定义，而在manifest中声明
    });
  }

  async loadSettings() {
    // const data = await this.loadData() // 如果没有配置文件则为null
		// this.settings = Object.assign({}, AB_SETTINGS, data); // 合并默认值和配置文件的值

    // // 如果没有配置文件则生成一个默认值的配置文件
    // if (!data) {
    //   this.saveData(this.settings)
    // }
	}
	async saveSettings() {
		// await this.saveData(this.settings)
	}

  onunload() {
    console.log('<<< Unloading plugin AnyMenu')
  }
}
