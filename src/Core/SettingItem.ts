/** 设置项 (简易)
 * 
 * 链式调用式设计
 * 
 * 用法类似 Obsidian 的 GUI 配置
 */
export class SettingItem {
  el: HTMLElement
  el_info: HTMLElement
  el_name: HTMLElement
  el_desc: HTMLElement
  el_control: HTMLElement

  constructor(
    public parent_el: HTMLElement
  ) {
    this.el = document.createElement('div'); parent_el.appendChild(this.el);
      this.el.classList.add('setting-item');

    this.el_info = document.createElement('div'); this.el.appendChild(this.el_info);
      this.el_info.classList.add('setting-item-info');

    this.el_name = document.createElement('div'); this.el_info.appendChild(this.el_name);
      this.el_name.classList.add('setting-item-name');

    this.el_desc = document.createElement('div'); this.el_info.appendChild(this.el_desc);
      this.el_desc.classList.add('setting-item-desc');

    this.el_control = document.createElement('div'); this.el.appendChild(this.el_control);
      this.el_control.classList.add('setting-item-control');
  }

  /// 添加或修改设置项名
  setName(name: string) {
    this.el_name.textContent = name;
    return this
  }

  /// 添加或修改设置项说明
  setDesc(desc: string) {
    this.el_desc.textContent = desc;
    return this
  }

  /// 添加标题
  setHeading(heading: string) {
    const heading_el = document.createElement('h2'); this.el.appendChild(heading_el);
      heading_el.classList.add('setting-item-heading');
      heading_el.textContent = heading;
    return this
  }

  /// 添加分割线
  setDivider() {
    const divider_el = document.createElement('hr'); this.el.appendChild(divider_el);
      divider_el.classList.add('setting-item-divider');
    return this
  }

  /*
   * Obsidian版本还有:
   * - setClass
   * - setTooltip
   * - setHeading
   * - setDisabled
   */

  // #region 添加一些子组件

  addText(callback: (text: SettingItemText) => void) {
    const text = new SettingItemText(this.el_control);
    callback(text);
    return this;
  }

  addToggle(callback: (toggle: SettingItemToggle) => void) {
    const toggle = new SettingItemToggle(this.el_control);
    callback(toggle);
    return this;
  }

  addDropdown(callback: (select: SettingItemSelect) => void) {
    const select = new SettingItemSelect(this.el_control);
    callback(select);
    return this;
  }

  // addButton(callback: () => void) {
  //   return this;
  // }
  // addSearch
  // addComponent
  // addTextArea
  // addColorPicker
  // addProgressBar
  // addSlider
  // addMomentFormat

  // #endregion
}

export type Setting = SettingItem

/// 设置项 - 文本输入框
class SettingItemText {
  el: HTMLInputElement

  constructor(parent_el: HTMLElement) {
    this.el = document.createElement('input'); parent_el.appendChild(this.el);
      this.el.classList.add('setting-item-text');
      this.el.type = 'text';
  }

  setValue(value: string) {
    this.el.value = value;
    return this
  }

  onChange(callback: (value: string) => void) {
    this.el.addEventListener('input', () => {
      callback(this.el.value);
    });
    return this
  }
}

/// 设置项 - 切换开关
class SettingItemToggle {
  el: HTMLElement
  el_input: HTMLInputElement

  constructor(parent_el: HTMLElement) {
    this.el = document.createElement('label'); parent_el.appendChild(this.el);
      this.el.classList.add('setting-item-toggle');
    this.el_input = document.createElement('input'); this.el.appendChild(this.el_input);
      this.el_input.type = 'checkbox';
      this.el_input.checked = false; // 默认 false

    // 滑块风格样式所需要的
    this.el_input.addEventListener('change', () => {
      if (this.el_input.checked) {
        this.el.classList.add('is-enabled');
      } else {
        this.el.classList.remove('is-enabled');
      }
    })
  }

  setValue(value: boolean) {
    this.el_input.checked = value;

    // 滑块风格样式所需要的
    if (this.el_input.checked) {
      this.el.classList.add('is-enabled');
    } else {
      this.el.classList.remove('is-enabled');
    }
    return this
  }

  onChange(callback: (value: boolean) => void) {
    this.el_input.addEventListener('change', () => {
      callback(this.el_input.checked);
    });
    return this
  }
}

/// 设置项 - 下拉选择框
class SettingItemSelect {
  el: HTMLSelectElement

  constructor(parent_el: HTMLElement) {
    this.el = document.createElement('select'); parent_el.appendChild(this.el);
      this.el.classList.add('setting-item-select');
  }

  setOptions(options: { value: string, label: string }[]) {
    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      this.el.appendChild(opt);
    });
  }

  addOption(value: string, label: string) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    this.el.appendChild(opt);
  }

  setValue(value: string) {
    this.el.value = value;
    return this
  }

  onChange(callback: (value: string) => void) {
    this.el.addEventListener('change', () => {
      callback(this.el.value);
    });
    return this
  }
}
