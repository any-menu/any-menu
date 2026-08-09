export class SettingItem {
    constructor(parent_el) {
        this.parent_el = parent_el;
        this.el = document.createElement('div');
        parent_el.appendChild(this.el);
        this.el.classList.add('setting-item');
        this.el_info = document.createElement('div');
        this.el.appendChild(this.el_info);
        this.el_info.classList.add('setting-item-info');
        this.el_name = document.createElement('div');
        this.el_info.appendChild(this.el_name);
        this.el_name.classList.add('setting-item-name');
        this.el_desc = document.createElement('div');
        this.el_info.appendChild(this.el_desc);
        this.el_desc.classList.add('setting-item-desc');
        this.el_control = document.createElement('div');
        this.el.appendChild(this.el_control);
        this.el_control.classList.add('setting-item-control');
    }
    setName(name) {
        this.el_name.textContent = name;
        return this;
    }
    setDesc(desc) {
        this.el_desc.textContent = desc;
        return this;
    }
    setHeading(heading) {
        const heading_el = document.createElement('h2');
        this.el.appendChild(heading_el);
        heading_el.classList.add('setting-item-heading');
        heading_el.textContent = heading;
        const collapse_btn = document.createElement('span');
        heading_el.appendChild(collapse_btn);
        collapse_btn.classList.add('collapse-btn');
        this.el.classList.add('has-heading');
        let is_collapsed = false;
        heading_el.addEventListener('click', () => {
            is_collapsed = !is_collapsed;
            if (is_collapsed) {
                heading_el.classList.add('is-collapsed');
                let next_el = this.el.nextElementSibling;
                while (next_el && !next_el.classList.contains('has-heading')) {
                    next_el.classList.add('am-hide');
                    next_el = next_el.nextElementSibling;
                }
            }
            else {
                heading_el.classList.remove('is-collapsed');
                let next_el = this.el.nextElementSibling;
                while (next_el && !next_el.classList.contains('has-heading')) {
                    next_el.classList.remove('am-hide');
                    next_el = next_el.nextElementSibling;
                }
            }
        });
        return this;
    }
    setDivider() {
        const divider_el = document.createElement('hr');
        this.el.appendChild(divider_el);
        divider_el.classList.add('setting-item-divider');
        return this;
    }
    addText(callback) {
        const text = new SettingItemText(this.el_control);
        callback(text);
        return this;
    }
    addTextArea(callback) {
        const text = new SettingItemTextArea(this.el_control);
        callback(text);
        return this;
    }
    addToggle(callback) {
        const toggle = new SettingItemToggle(this.el_control);
        callback(toggle);
        return this;
    }
    addDropdown(callback) {
        const select = new SettingItemSelect(this.el_control);
        callback(select);
        return this;
    }
    addColorPicker(callback) {
        const picker = new SettingItemColorPicker(this.el_control);
        callback(picker);
        return this;
    }
}
class SettingItemAbs {
    constructor(_parent_el) { }
}
export class SettingItemText extends SettingItemAbs {
    constructor(parent_el) {
        super(parent_el);
        this.el = document.createElement('input');
        parent_el.appendChild(this.el);
        this.el.classList.add('setting-item-text');
        this.el.type = 'text';
    }
    setType(type) {
        this.el.dataset.type = type;
        this.el.type = type;
        return this;
    }
    setValue(value) {
        this.el.value = value;
        return this;
    }
    onChange(callback) {
        this.el.addEventListener('change', () => {
            callback(this.el.value, this.el);
        });
        return this;
    }
}
export class SettingItemTextArea extends SettingItemAbs {
    constructor(parent_el) {
        super(parent_el);
        this.el = document.createElement('textarea');
        parent_el.appendChild(this.el);
        this.el.classList.add('setting-item-textarea');
    }
    setValue(value) {
        this.el.value = value;
        return this;
    }
    onChange(callback) {
        this.el.addEventListener('change', () => {
            callback(this.el.value, this.el);
        });
        return this;
    }
}
export class SettingItemToggle extends SettingItemAbs {
    constructor(parent_el) {
        super(parent_el);
        this.el = document.createElement('label');
        parent_el.appendChild(this.el);
        this.el.classList.add('setting-item-toggle');
        this.el_input = document.createElement('input');
        this.el.appendChild(this.el_input);
        this.el_input.type = 'checkbox';
        this.el_input.checked = false;
        this.el_input.addEventListener('change', () => {
            if (this.el_input.checked) {
                this.el.classList.add('is-enabled');
            }
            else {
                this.el.classList.remove('is-enabled');
            }
        });
    }
    setValue(value) {
        this.el_input.checked = value;
        if (this.el_input.checked) {
            this.el.classList.add('is-enabled');
        }
        else {
            this.el.classList.remove('is-enabled');
        }
        return this;
    }
    onChange(callback) {
        this.el_input.addEventListener('change', () => {
            callback(this.el_input.checked, this.el);
        });
        return this;
    }
}
export class SettingItemSelect extends SettingItemAbs {
    constructor(parent_el) {
        super(parent_el);
        this.el = document.createElement('select');
        parent_el.appendChild(this.el);
        this.el.classList.add('setting-item-select');
    }
    setOptions(options) {
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            this.el.appendChild(opt);
        });
    }
    addOption(value, label) {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        this.el.appendChild(opt);
    }
    setValue(value) {
        this.el.value = value;
        return this;
    }
    onChange(callback) {
        this.el.addEventListener('change', () => {
            callback(this.el.value, this.el);
        });
        return this;
    }
}
export class SettingItemColorPicker extends SettingItemAbs {
    constructor(parent_el) {
        super(parent_el);
        this.el = document.createElement('input');
        parent_el.appendChild(this.el);
        this.el.type = 'color';
        this.el.classList.add('setting-item-color-picker');
    }
    setValue(value) {
        this.el.value = value;
        return this;
    }
    onChange(callback) {
        this.el.addEventListener('change', () => {
            callback(this.el.value, this.el);
        });
        return this;
    }
}
