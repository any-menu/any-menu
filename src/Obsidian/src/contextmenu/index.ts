import {
  App, MarkdownView, Plugin, PluginSettingTab, Setting, Menu,
  TFile, ItemView, WorkspaceLeaf,
  type MenuItem, type Editor,
  type MarkdownFileInfo,
  EditorPosition,
  Notice
} from 'obsidian'
import { ABContextMenu } from '@/Core/contextmenu/index'
import { type ContextMenuItems, root_menu } from "@/Core/contextmenu/demo"

// import { ABContextMenu, root_menu_raw, root_menu } from '../../../Pro/src/contextmenu' // [!code hl] obsidian pro
// onMounted(() => {
//   const myMenu = new ABContextMenu()
//   myMenu.append_data(root_menu)
//   myMenu.append_data(root_menu_raw)
//   myMenu.attach(ref_container.value)
// })

/**
 * 用于obsidian原菜单上的追加。
 * 若非需要在原菜单基础上追加，则使用父类ABContextMenu即可
 * 
 * 与父类不同:
 * 
 * - 父类
 *   - 静态创建菜单 (可以多个元素共用一个菜单)
 *     append_xxx 时添加div到菜单元素
 *   - 生命与监听:
 *     生命挂钩于元素、attach到元素
 *     监听由 attach() 负责
 *   - 使用逻辑: new ABContextMenu(...).append_data(...).append_xxx(el)
 * - Ob类
 *   - 动态创建菜单
 *     append_xxx 时监听菜单事件并于事件发生时动态添加div到菜单元素
 *   - 生命与监听
 *     不用管理生命挂钩、attach挂钩的元素
 *     监听由 append_xxx() 负责
 *   - 使用逻辑: registerABContextMenu(plugin) -> new ABContextMenu_Ob(...).append_xxx(...)
 */
export class ABContextMenu_Ob extends ABContextMenu {
  constructor(
    public plugin: Plugin,
    public target: string, // 'editor' | 'file' | 'file-menu' | 'editor-menu' | 'status-bar' | 'body' | HTMLElement ...
    menuItems?: ContextMenuItems,
  ) {
    super(undefined, menuItems)
  }

  override attach(targetElement: HTMLElement | string): void {
    // 预创建菜单版本
    if (this.el_container) return super.attach(targetElement)

    return
  }

  // 将 ContextMenuItems 添加到菜单中
  override append_data(menuItems: ContextMenuItems) {
    // 预创建菜单版本
    if (this.el_container) return super.append_data(menuItems)

    if (this.target === 'editor' || this.target === 'editor-menu') {
      const plugin = this.plugin
      plugin.registerEvent(
        plugin.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
          addMenuItems(menu, menuItems, editor)
        })
      )
    } else {
      console.error("不支持的attach目标字符串", this.target)
    }

    // 递归添加菜单项
    function addMenuItems(menu: Menu, menuItems: ContextMenuItems, editor: Editor) {
      for (const menuItem of menuItems) {
        menu.addItem((item: MenuItem) => {
          // 菜单项标题
          item.setTitle(menuItem.label)
          
          // 菜单项图标
          if (menuItem.icon) item.setIcon(menuItem.icon)

          // 菜单项功能
          if (menuItem.callback == undefined) {}
          else if (typeof menuItem.callback === 'string') item.onClick(() => editor.replaceSelection(menuItem.callback as string))
          else if (typeof menuItem.callback === 'function') item.onClick(() => { (menuItem.callback as ((str?: string) => void))() })

          // 菜单项说明，悬浮时展示说明 (为安全起见，目前仅支持图片链接而非任意html)
          let tooltip: HTMLElement|undefined = undefined
          // @ts-ignore
          const dom = menu.dom
          if (menuItem.detail && dom) {
            menu.registerDomEvent(dom, 'mouseenter', (evt: MouseEvent) => {
              tooltip = document.createElement('div'); dom.appendChild(tooltip);
              tooltip.addClass('ab-contextmenu-tooltip')
              const domRect = dom.getBoundingClientRect()
              tooltip.setAttr('style', `
                position: fixed;
                top: ${domRect.top + 1}px;
                left: ${domRect.right + 1}px;
                z-index: 9999;
                background: var(--background-secondary);
                padding: 8px;
                border-radius: 4px;
                box-shadow: var(--shadow-elevation-high);
                max-width: 300px;
              `)
              // top: ${evt.clientY + 10}px;
              // left: ${evt.clientX + 10}px;
              const img = document.createElement('img'); tooltip.appendChild(img);
                img.setAttr('src', menuItem.detail as string);
                img.setAttr('style', 'max-width: 100%; height: auto; display: block;');
            })
            menu.registerDomEvent(dom, 'mouseleave', (evt: MouseEvent) => {
              if (!tooltip) return
              dom.removeChild(tooltip)
              tooltip = undefined
            })
          }

          // 菜单项的子菜单
          if (menuItem.children && menuItem.children.length > 0) {
            // 官方没这个api，隐含api
            // 且这个api到了第三级菜单开始，就会有bug: 切换悬浮的二级菜单对象时，三级菜单不会更新
            // @ts-ignore
            const submenu = item.setSubmenu()
            addMenuItems(submenu, menuItem.children, editor) // 递归
            // const submenu = new Menu()
            // item.setSubmenu(submenu)
          }
        })
      }
    }
  }
}

/** 注册obsidian右键菜单
 * 
 * 推荐在onload中调用
 */
export function registerABContextMenu(plugin: Plugin) {
  const abContextMenu = new ABContextMenu_Ob(plugin, 'editor-menu') // 会 plugin.app.workspace.on('editor-menu', ...)
  abContextMenu.append_data(root_menu)
}

/** 注册obsidian右键菜单 (Demo)
 * 
 * by gpt
 * 
 * 推荐在onload中调用
 */
export function registerABContextMenuDemo(plugin: Plugin) {
  // 右键菜单 - 文件浏览器
  plugin.registerEvent(
    plugin.app.workspace.on('file-menu', (menu: Menu, file: TFile) => {
      // 只在右键点击 .md 文件时添加菜单项
      if (file instanceof TFile && file.extension === 'md') {
        menu.addItem((item: MenuItem) => {
          item
            .setTitle("我的文件菜单操作")
            .setIcon("document") // 使用内置图标
            .onClick(async () => {
              new Notification(`你点击了文件: ${file.path}`)
              console.log(`文件路径: ${file.path}`)
            });
        });
      }
    })
  )

  // 右键菜单 - 编辑器
  plugin.registerEvent(
    plugin.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView | MarkdownFileInfo) => {
      menu.addItem((item: MenuItem) => {
        item
          .setTitle("我的编辑器菜单操作")
          .setIcon("pencil") // 使用内置图标
          .onClick(() => {
            // 在光标位置插入文本
            editor.replaceSelection('你好，Obsidian！')
          });
      });
    })
  )

  // 右键菜单 - 右下角状态栏 (自定义div)
  const myCustomDiv = plugin.addStatusBarItem().createEl('div', { // 创建一个我们自己的 div 元素，并添加到状态栏
    text: '右键点我!',
    cls: 'my-custom-div' // 添加一个class方便样式化
  })
  plugin.registerDomEvent(myCustomDiv, 'contextmenu', (event: MouseEvent) => {
    // 1. 阻止默认的浏览器右键菜单
    event.preventDefault()

    // 2. 创建一个新的、独立的 Menu 实例
    const menu = new Menu()

    // 3. 向菜单中添加自定义项目
    menu.addItem((item: MenuItem) =>
      item
        .setTitle("操作 A")
        .setIcon("info")
        .onClick(() => {
          new Notification("你点击了操作 A")
        })
    );

    menu.addItem((item: MenuItem) =>
      item
        .setTitle("操作 B")
        .setIcon("checkmark")
        .onClick(() => {
          new Notification("你点击了操作 B")
        })
    );

    // 添加一个分割线
    menu.addSeparator()

    menu.addItem((item: MenuItem) =>
      item
        .setTitle("危险操作")
        .setIcon("trash")
        .setSection('danger') // 可以把项目分组到 'danger' 区，通常会用红色显示
        .onClick(() => {
          new Notification("这是一个危险操作！")
        })
    );

    // 4. 在鼠标点击的位置显示菜单
    menu.showAtMouseEvent(event)
  })
}

// 初始化菜单 - 原始通用版本 (独立面板，非obsidian内置菜单)
export function registerAMContextMenu(plugin: Plugin) {
  const amContextMenu = new ABContextMenu(document.body as HTMLDivElement)
  amContextMenu.append_data(root_menu)

  // 注册命令
  plugin.addCommand({
    id: 'any-menu-panel',
    name: '展开 AnyMenu 面板',
    // callback: () => {},
    editorCallback: (editor, view) => { // 仅于编辑器界面才能触发的回调
      // 方法1: 使用 editor 对象获取光标位置
      const cursor = editor.getCursor();
      console.log('光标位置:', cursor);
      console.log('行号:', cursor.line);
      console.log('列号:', cursor.ch);
      
      // 显示通知
      showNotification(plugin, cursor);

      const pos = getCursorPixelPosition(plugin);
      if (pos) {
        amContextMenu.visual_show(pos.left + 2, pos.bottom + 2)
      }
    }
    // hotkeys: [] // 通常不在代码里重复定义，而在manifest中声明
  });

  // 注册工具带
  plugin.addRibbonIcon('crosshair', '获取光标位置', () => {
    getCursorPosition(plugin);

    getCursorPixelPosition(plugin);
  });
}

function getCursorPosition(plugin: Plugin) {
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  
  if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      
      // 获取光标位置的详细信息
      const line = cursor.line;
      const ch = cursor.ch;
      
      // 获取光标所在行的文本
      const lineText = editor.getLine(line);
      
      // 获取光标前的文本
      const textBeforeCursor = lineText.substring(0, ch);
      
      // 获取光标后的文本
      const textAfterCursor = lineText.substring(ch);
      
      console.log('详细信息:');
      console.log('行号:', line);
      console.log('列号:', ch);
      console.log('当前行文本:', lineText);
      console.log('光标前文本:', textBeforeCursor);
      console.log('光标后文本:', textAfterCursor);
      
      showNotification(plugin, cursor);
  } else {
      console.log('没有活动的 Markdown 编辑器');
  }
}

// 方法3: 获取选区范围（如果有选中文本）
function getSelectionRange(plugin: Plugin) {
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  
  if (activeView) {
      const editor = activeView.editor;
      
      // 获取选区的起始和结束位置
      const from = editor.getCursor('from');
      const to = editor.getCursor('to');
      
      // 获取选中的文本
      const selectedText = editor.getSelection();
      
      console.log('选区信息:');
      console.log('起始位置:', from);
      console.log('结束位置:', to);
      console.log('选中文本:', selectedText);
      
      return { from, to, selectedText };
  }
}

// 显示通知
function showNotification(plugin: Plugin, cursor: EditorPosition) {
  new Notice(`光标位置: 行 ${cursor.line + 1}, 列 ${cursor.ch + 1}`);
}

function getCursorPixelPosition(plugin: Plugin): {left: number, top: number, right: number, bottom: number}|null {
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  
  if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      
      // 方法1: 使用 CodeMirror 的 coordsAtPos 方法
      // @ts-ignore - 访问 CodeMirror 的内部方法
      const cm = editor.cm;
      if (cm) {
          // CodeMirror 6 (新版 Obsidian)
          const coords = cm.coordsAtPos(editor.posToOffset(cursor));
          
          if (coords) {
              console.log('cm pos', coords);

              new Notice(`光标位置: X=${Math.round(coords.left)}px, Y=${Math.round(coords.top)}px`);
              
              return {left: coords.left, top: coords.top, right: coords.right, bottom: coords.bottom};
          }
      }

      // 方法2: 通过 DOM 元素获取位置
      const cursorElement = getCursorElement();
      if (cursorElement) {
          const rect = cursorElement.getBoundingClientRect();
          console.log('cursorEl pos', rect);

          return {left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom};
      }
  }

  console.warn("get cursor pixel position fail")
  return null
}

// 获取光标 DOM 元素
function getCursorElement(): HTMLElement | null {
  // 查找 CodeMirror 光标元素
  const cursor = document.querySelector('.cm-cursor') as HTMLElement;
  return cursor;
}

// 获取相对于编辑器的位置
function getCursorPositionRelativeToEditor(plugin: Plugin) {
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  
  if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      
      // @ts-ignore
      const cm = editor.cm;
      if (cm) {
          const coords = cm.coordsAtPos(editor.posToOffset(cursor));
          const editorElement = cm.dom;
          const editorRect = editorElement.getBoundingClientRect();
          
          if (coords) {
              const relativeX = coords.left - editorRect.left;
              const relativeY = coords.top - editorRect.top;
              
              console.log('相对于编辑器的位置:');
              console.log('X:', relativeX, 'px');
              console.log('Y:', relativeY, 'px');
              
              return { x: relativeX, y: relativeY };
          }
      }
  }
}

// 获取绝对屏幕位置（相对于页面）
function getAbsoluteCursorPosition(plugin: Plugin) {
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  
  if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      
      // @ts-ignore
      const cm = editor.cm;
      if (cm) {
          const coords = cm.coordsAtPos(editor.posToOffset(cursor));
          
          if (coords) {
              // 加上页面滚动偏移
              const absoluteX = coords.left + window.pageXOffset;
              const absoluteY = coords.top + window.pageYOffset;
              
              console.log('绝对位置（相对于页面）:');
              console.log('X:', absoluteX, 'px');
              console.log('Y:', absoluteY, 'px');
              
              return { x: absoluteX, y: absoluteY };
          }
      }
  }
}
