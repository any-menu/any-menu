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
    // 
    // let app_handle = app.handle();

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
