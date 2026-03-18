/** 焦点管理
 * 一个用于监控焦点变化的模块，当聚焦到黑名单/非黑名单窗口时，动态地注册或注销全局快捷键
 */

use tauri::Emitter;

/**
 * 初始化焦点监控线程
 * 
 * 在线程外获取 AppHandle，它是线程安全的 (Send + Sync)
 */
pub fn init_focus_check(app_handle: tauri::AppHandle) {
    // 启动一个后台线程来监控活动窗口
    std::thread::spawn(move || {
        use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW};
        use windows::Win32::Foundation::HWND;
        use std::ffi::OsString;
        use std::os::windows::ffi::OsStringExt;
        use std::time::Duration;
        use std::thread::sleep;

        let mut last_hwnd: HWND = HWND(std::ptr::null_mut());

        loop {
            unsafe {
                let hwnd = GetForegroundWindow();

                // 窗口未变化，继续等待
                if hwnd == last_hwnd {                    
                    sleep(Duration::from_millis(500));
                    continue;
                }
                last_hwnd = hwnd;

                // 获取窗口标题
                // 获取结果示例:
                // - Creating pull request for browser script · GitHub Copilot — Mozilla Firefox
                // - 032-做题策略：链列的找法_哔哩哔哩_bilibili — Mozilla Firefox
                // - 0 - Google 搜索 - Google Chrome
                // - 032-做题策略：链列的找法_哔哩哔哩_bilibili - Google Chrome
                // - ● focus.rs - any-menu (工作区) - Visual Studio Code
                // - AI联动架构，Skill RAG MCP Agent NLU - MdNote_Public - Obsidian v1.11.5
                // 
                // 时机点注意:
                // 这里的主要目的是为了设置快捷键的黑白名单，
                // 你在同一窗口下执行操作 (如浏览器中切换不同的标签页) 导致的窗口名变化，这里并不会检索到
                // 想要更准确地应用召唤前获取，则见 `get_caret/get_message` 时机
                let mut title_flag: [u16; 256] = [0; 256];
                let len = GetWindowTextW(hwnd, &mut title_flag);
                let window_title = OsString::from_wide(&title_flag[..len as usize])
                    .to_string_lossy()
                    .into_owned();

                // 这里可以根据 window_title 判断是否在黑名单内
                // 并注册或注销全局快捷键
                // println!("Active window changed: {}", window_title);

                // 向 JS 前端发送事件
                app_handle.emit("active-app-changed", window_title).unwrap();
            }
            sleep(Duration::from_millis(500));
        }
    });
}
