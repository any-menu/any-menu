// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::{
  menu::{Menu, MenuItem},
  tray::TrayIconBuilder,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?; // 退出菜单项
            let menu = Menu::with_items(app, &[&quit_item])?; // 菜单项数组

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone()) // 托盘图标
                .tooltip("any-menu")
                .menu(&menu) // 加载菜单项数组
                // .show_menu_on_left_click(true) // 左键也能展开菜单
                .on_menu_event(|app, event| match event.id.as_ref() { // 菜单事件
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                // .on_tray_icon_event(|tray, event| {
                //     if let TrayIconEvent::Click {
                //         button: MouseButton::Left,
                //         button_state: _,
                //         ..
                //     } = event
                //     {
                //         let app = tray.app_handle();
                //         if let Some(window) = app.get_webview_window("main") {
                //             let _ = window.show();
                //             let _ = window.set_focus();
                //         }
                //     }
                // })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![paste])
        .invoke_handler(tauri::generate_handler![send])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// 项目模板 默认的表单功能
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// ----------------------------------------------------------------------------

// #region paste

#[tauri::command]
fn paste(text: &str) -> String {
    // format!("Hello, {}! You've been pasted from Rust!", name)

    // 将文本写入剪贴板
    set_clipboard_text(text).expect("Failed to set clipboard text");

    // 模拟 Ctrl+V 按键来粘贴
    simulate_paste().expect("Failed to simulate paste");

    format!("Successfully pasted: {}", text)
}

/// 将文本写入剪贴板
#[cfg(target_os = "windows")]
fn set_clipboard_text(text: &str) -> Result<(), String> {
    use std::ffi::OsStr;
    use std::iter::once;
    use std::os::windows::ffi::OsStrExt;
    use std::ptr;
    use winapi::um::winuser::{OpenClipboard, EmptyClipboard, SetClipboardData, CloseClipboard};
    use winapi::um::winbase::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE};
    use winapi::um::winnt::HANDLE;
    use winapi::um::winuser::CF_UNICODETEXT;

    unsafe {
        if OpenClipboard(ptr::null_mut()) == 0 {
            return Err("Failed to open clipboard".to_string());
        }

        if EmptyClipboard() == 0 {
            CloseClipboard();
            return Err("Failed to empty clipboard".to_string());
        }

        let wide: Vec<u16> = OsStr::new(text).encode_wide().chain(once(0)).collect();
        let len = wide.len() * std::mem::size_of::<u16>();
        
        let h_mem: HANDLE = GlobalAlloc(GMEM_MOVEABLE, len);
        if h_mem.is_null() {
            CloseClipboard();
            return Err("Failed to allocate memory".to_string());
        }

        let p_mem = GlobalLock(h_mem);
        if p_mem.is_null() {
            CloseClipboard();
            return Err("Failed to lock memory".to_string());
        }

        ptr::copy_nonoverlapping(wide.as_ptr(), p_mem as *mut u16, wide.len());
        GlobalUnlock(h_mem);

        if SetClipboardData(CF_UNICODETEXT, h_mem).is_null() {
            CloseClipboard();
            return Err("Failed to set clipboard data".to_string());
        }

        CloseClipboard();
        Ok(())
    }
}

/// 模拟黏贴按键
#[cfg(target_os = "windows")]
fn simulate_paste() -> Result<(), String> {
    use winapi::um::winuser::{keybd_event, VK_CONTROL, KEYEVENTF_KEYUP};
    
    // VK_V 的值是 0x56
    const VK_V: u8 = 0x56;
    
    unsafe {
        // 按下 Ctrl
        keybd_event(VK_CONTROL as u8, 0, 0, 0);
        
        // 按下 V
        keybd_event(VK_V, 0, 0, 0);
        
        // 释放 V
        keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0);
        
        // 释放 Ctrl
        keybd_event(VK_CONTROL as u8, 0, KEYEVENTF_KEYUP, 0);
    }
    
    Ok(())
}

/// 将文本写入剪贴板
#[cfg(not(target_os = "windows"))]
fn set_clipboard_text(_text: &str) -> Result<(), String> {
    Err("Clipboard operations not implemented for this platform".to_string())
}

/// 模拟黏贴按键
#[cfg(not(target_os = "windows"))]
fn simulate_paste() -> Result<(), String> {
    Err("Paste simulation not implemented for this platform".to_string())
}

// #endregion paste

// #region enigo

use enigo::{Enigo, Keyboard, Settings};

#[tauri::command]
fn send(text: &str) -> String {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    
    // (可选) 根据文本长度及是否包含换行符，选择发送方式
    if (text.contains('\n') || text.len() > 30) {
        return paste(text);
    } else {
        // 继续使用enigo发送
    }

    // enigo.move_mouse(500, 200, Abs).unwrap();
    // enigo.button(Button::Left, Click).unwrap();
    enigo.text(text).unwrap();

    format!("Successfully sent: {}", text)
}

// #endregion

// #region window sendText

// // 使用windows的SendInput函数直接发送文本
// #[cfg(target_os = "windows")]
// fn send_text_directly(text: &str) -> Result<(), String> {
//     use winapi::um::winuser::{SendInput, INPUT, INPUT_KEYBOARD, KEYEVENTF_UNICODE, KEYEVENTF_KEYUP};
//     use winapi::shared::minwindef::WORD;
    
//     let mut inputs = Vec::new();
    
//     for ch in text.chars() {
//         let unicode_value = ch as u32;
        
//         // 对于基本平面字符 (U+0000 到 U+FFFF)
//         if unicode_value <= 0xFFFF {
//             // 按下键
//             inputs.push(INPUT {
//                 type_: INPUT_KEYBOARD,
//                 u: unsafe {
//                     std::mem::transmute(winapi::um::winuser::KEYBDINPUT {
//                         wVk: 0,
//                         wScan: unicode_value as WORD,
//                         dwFlags: KEYEVENTF_UNICODE,
//                         time: 0,
//                         dwExtraInfo: 0,
//                     })
//                 },
//             });
            
//             // 释放键
//             inputs.push(INPUT {
//                 type_: INPUT_KEYBOARD,
//                 u: unsafe {
//                     std::mem::transmute(winapi::um::winuser::KEYBDINPUT {
//                         wVk: 0,
//                         wScan: unicode_value as WORD,
//                         dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
//                         time: 0,
//                         dwExtraInfo: 0,
//                     })
//                 },
//             });
//         } else {
//             // 对于扩展平面字符，需要使用代理对 (Surrogate Pairs)
//             let code_point = unicode_value - 0x10000;
//             let high_surrogate = 0xD800 + (code_point >> 10);
//             let low_surrogate = 0xDC00 + (code_point & 0x3FF);
            
//             // 高代理
//             inputs.push(INPUT {
//                 type_: INPUT_KEYBOARD,
//                 u: unsafe {
//                     std::mem::transmute(winapi::um::winuser::KEYBDINPUT {
//                         wVk: 0,
//                         wScan: high_surrogate as WORD,
//                         dwFlags: KEYEVENTF_UNICODE,
//                         time: 0,
//                         dwExtraInfo: 0,
//                     })
//                 },
//             });
            
//             inputs.push(INPUT {
//                 type_: INPUT_KEYBOARD,
//                 u: unsafe {
//                     std::mem::transmute(winapi::um::winuser::KEYBDINPUT {
//                         wVk: 0,
//                         wScan: high_surrogate as WORD,
//                         dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
//                         time: 0,
//                         dwExtraInfo: 0,
//                     })
//                 },
//             });
            
//             // 低代理
//             inputs.push(INPUT {
//                 type_: INPUT_KEYBOARD,
//                 u: unsafe {
//                     std::mem::transmute(winapi::um::winuser::KEYBDINPUT {
//                         wVk: 0,
//                         wScan: low_surrogate as WORD,
//                         dwFlags: KEYEVENTF_UNICODE,
//                         time: 0,
//                         dwExtraInfo: 0,
//                     })
//                 },
//             });
            
//             inputs.push(INPUT {
//                 type_: INPUT_KEYBOARD,
//                 u: unsafe {
//                     std::mem::transmute(winapi::um::winuser::KEYBDINPUT {
//                         wVk: 0,
//                         wScan: low_surrogate as WORD,
//                         dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
//                         time: 0,
//                         dwExtraInfo: 0,
//                     })
//                 },
//             });
//         }
//     }
    
//     unsafe {
//         let result = SendInput(
//             inputs.len() as u32,
//             inputs.as_ptr(),
//             std::mem::size_of::<INPUT>() as i32,
//         );
        
//         if result == 0 {
//             return Err("Failed to send input".to_string());
//         }
//     }
    
//     Ok(())
// }

// #endregion
