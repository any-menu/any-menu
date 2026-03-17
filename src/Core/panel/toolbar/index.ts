import { global_setting } from "../../../Core/setting"
import { init_item, type PanelItem } from "../PanelItem"

export class AMToolbar {
  public el_parent: HTMLElement;
  public el: HTMLElement;
  
  isShow = true

  static factory(
    el_parent: HTMLElement,
  ) {
    return new AMToolbar(el_parent)
  }

  constructor(
    el_parent: HTMLElement,
  ) {
    this.el_parent = el_parent
    this.el = document.createElement('div'); el_parent.appendChild(this.el); this.el.classList.add('am-toolbar');
    this.hide()
  }

  /** 添加 index 项
   * 
   * 旧版中。这里的顺序需要等待所有文件加载完成后，根据已排序好的列表进行初始化，从而控制顺序
   * 新版中。这里使用配置的 order 属性来控制顺序。一是可以动态填充，更快也能工作中插入，二是更简单可控
   * 无 order 属性的则视为 1000，同 order 则根据顺序插入
   */
  append_data(toolbarItems: PanelItem[]) {
    // TODO: toolbar 理应支持 alt key，以后再做
    // let alt_key_index = current_node.children.length // alt+key 快捷键 (目前仅支持顺序的 [1-90a-z]，将0放9后面优化手感。超出不显示，不支持自定义)

    const li_list = (): void => {
      toolbarItems.forEach((item: PanelItem) => {
        // alt_key_key
        // let alt_key_key: string = ''
        // if (alt_key_index < 9) {
        //   alt_key_key = (alt_key_index + 1).toString()
        // } else if (alt_key_index == 9) {
        //   alt_key_key = "0"
        // } else if (alt_key_index < 36) {
        //   alt_key_key = String.fromCharCode(97 + alt_key_index - 10)
        // }
        // alt_key_index++

        // 项顺序检查 (order)
        if (global_setting.config.toolbar_list.length == 0) {} // 没限制则全部放行
        else if (global_setting.config.toolbar_list.includes(item.label)) { // 有则添加顺序
          const index = global_setting.config.toolbar_list.indexOf(item.label)
          item.order = index
        }
        else { // 没有则不显示
          return
        }

        // 项元素
        const li = document.createElement('div'); li.classList.add('am-toolbar-item');

        // 根据 order 插入节点
        const order = item.order ?? 1000; li.dataset.order = order.toString();
        let inserted = false; // 若为 true，表示已插入到某个节点的前面
        for (const child of Array.from(this.el.children) as HTMLElement[]) {
          const childOrderAttr = child.dataset.order;
          const childOrder = childOrderAttr !== undefined ? parseInt(childOrderAttr, 10) : 1000;
          if (childOrder > order) { // 找到第一个 order 比当前大的节点，插在它前面
            this.el.insertBefore(li, child);
            inserted = true;
            break;
          }
        }
        if (!inserted) { // 如果没有比它大的，说明应该是最大的，直接追加在最后
          this.el.appendChild(li);
        }

        // 项的 图标 名字 功能 说明 等
        init_item(this, li, item, 'icon')
      })
    }

    li_list()
  }

  // #region 显示/隐藏菜单

  show() {
    this.el.classList.remove('am-hide'); this.isShow = true;

    this.el.classList.add('visible')
    this.el?.classList.remove('show-altkey')
  }

  hide() {
    if (global_setting.state.isPin) return
    this.el.classList.add('am-hide'); this.isShow = false;
  }

  // #endregion
}
