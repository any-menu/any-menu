/**
 * 显示窗口相关
 * 
 * (不是 windows)
 */

use enigo::{
    Direction::{Click, Press, Release}, Enigo, Keyboard, Settings
};

/** 
 * 主动释放焦点
 * 
 * 虽然隐藏窗口能自动失焦；但窗口有可能处于强制置顶状态，从而无法隐藏，所以还要主动失焦
 * 
 * 实现思路
 * - Windows：
 *   模拟一次 Alt+Esc 按键 (该按键会隐藏当前窗口并切换焦点，不过对于置顶窗口不会隐藏，只会切换焦点)。
 *   即系统会将焦点切换到 Z 序中的下一个窗口（通常就是之前活跃的应用）。
 *   如果窗口有置顶属性，Alt+Esc 依然会转移焦点。
 *   - (可选) 一个保险措施: 可以在模拟前取消置顶，模拟按键后恢复。
 *   - (可选) 另一个方案是取消置顶并隐藏窗口，然后重新召唤一个无聚焦状态的置顶窗口。
 *   - 但以上两种可选方案可能会出现窗口闪烁一下的情况？不确定，暂不使用
 * - macOS：
 *   调用 [NSApp deactivate]，应用窗口保持可见，系统自动把焦点交还给上一个活跃应用。
 * - Linux（X11）：
 *   借助 xdotool 发送 Alt+Escape 按键组合。
 */
#[tauri::command]
pub fn release_focus() {
    // (可选) 如果窗口已置顶，临时取消，确保焦点能正常转移
    // let was_on_top = window.is_always_on_top().unwrap_or(false);
    // if was_on_top {
    //     let _ = window.set_always_on_top(false);
    // }

    #[cfg(target_os = "windows")]
    {
        let mut enigo = Enigo::new(&Settings::default())
            .expect("Failed to create Enigo instance");
        let _ = enigo.key(enigo::Key::Alt, Press);
        let _ = enigo.key(enigo::Key::Escape, Click);
        let _ = enigo.key(enigo::Key::Alt, Release);
    }

    // by deepseek v4, 未验证
    // #[cfg(target_os = "linux")]
    // {
    //     let mut enigo = Enigo::new();
    //     enigo.key_down(Key::Alt);
    //     enigo.key_click(Key::Escape);
    //     enigo.key_up(Key::Alt);
    // }

    // by deepseek v4, 未验证
    // #[cfg(target_os = "macos")]
    // {
    //     // 通过 AppleScript 让当前应用失焦，效果等同于 NSApp deactivate
    //     let script = r#"tell application "System Events"
    //         set frontmost of process "你的应用名" to false
    //     end tell"#;
    //     // 你可以动态获取应用名，例如从 tauri::api::process 或 tauri.conf.json 读取
    //     std::process::Command::new("osascript")
    //         .arg("-e")
    //         .arg(script)
    //         .spawn()
    //         .ok();
    // }

    // (可选) 恢复置顶状态
    // if was_on_top {
    //     let _ = window.set_always_on_top(true);
    // }
}
