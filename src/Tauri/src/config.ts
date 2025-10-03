// #region 项目模板 默认的表单功能、与后端沟通

import { global_setting } from '../../Core/Setting';

window.addEventListener("DOMContentLoaded", () => {
  const el = document.querySelector("#am-config");
  if (!el) return

  const textarea = document.createElement('textarea'); el.appendChild(textarea);
    textarea.value = JSON.stringify(global_setting.config, null, 2)
  textarea.oninput = () => {
    textarea.classList.add('no-save')
  }

  const save_btn = document.createElement('button'); el.appendChild(save_btn); save_btn.classList.add('btn-2');
    save_btn.textContent = 'Save Config'

  save_btn.onclick = () => {
    try {
      const new_config = JSON.parse(textarea.value)
      global_setting.config = {...global_setting.config, ...new_config}

      // TODO 保存配置文件 & 刷新某些对象/界面
      // global_setting.save_config()

      textarea.classList.remove('no-save', 'error-save')
      console.log('配置已保存，重启应用后生效')
    } catch (error) {
      textarea.classList.remove('no-save')
      textarea.classList.add('error-save')
      console.error('配置保存失败，请检查格式是否正确', error)
    }
  }
})

// #endregion
