use crate::text_c;

pub mod clipboard {
    /// 将文本写入剪贴板
    #[cfg(target_os = "windows")]
    pub fn clipboard_set_text(text: &str) -> Result<(), String> {
        use std::ffi::OsStr;
        use std::iter::once;
        use std::os::windows::ffi::OsStrExt;
        use std::ptr;
        use winapi::um::winbase::{GlobalAlloc, GlobalLock, GlobalUnlock, GMEM_MOVEABLE};
        use winapi::um::winnt::HANDLE;
        use winapi::um::winuser::CF_UNICODETEXT;
        use winapi::um::winuser::{CloseClipboard, EmptyClipboard, OpenClipboard, SetClipboardData};

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

    /// 从剪贴板获取文本
    #[cfg(target_os = "windows")]
    pub fn clipboard_get_text() -> Result<String, String> {
        use std::ptr;
        use winapi::um::winbase::{GlobalLock, GlobalUnlock};
        use winapi::um::winuser::{CloseClipboard, OpenClipboard, GetClipboardData, CF_UNICODETEXT};

        unsafe {
            if OpenClipboard(ptr::null_mut()) == 0 {
                return Err("Failed to open clipboard".to_string());
            }

            let h_data = GetClipboardData(CF_UNICODETEXT);
            if h_data.is_null() {
                CloseClipboard();
                return Err("No text data in clipboard".to_string());
            }

            let p_data = GlobalLock(h_data);
            if p_data.is_null() {
                CloseClipboard();
                return Err("Failed to lock clipboard data".to_string());
            }

            let mut len = 0;
            while *(p_data as *const u16).add(len) != 0 {
                len += 1;
            }

            let slice = std::slice::from_raw_parts(p_data as *const u16, len);
            let text = String::from_utf16(slice).map_err(|e| e.to_string())?;

            GlobalUnlock(h_data);
            CloseClipboard();
            Ok(text)
        }
    }

    /// 获取并打印当前剪贴板中所有可用的数据格式
    #[cfg(target_os = "windows")]
    pub fn clipboard_get_info() -> Result<String, String> {
        use std::ptr;
        use winapi::um::winuser::*;
        let mut result: String = "".to_string();

        println!("--- 获取剪贴板信息 ---");

        match crate::text_c::get_and_print_all_clipboard_info() {
            Ok(info) => result += &info,
            Err(err) => {
                log::error!("get_and_print_all_clipboard_info failed: {}", err);
                result += &format!("Failed to get clipboard info: {}", err);
            }
        }

        unsafe {
            if OpenClipboard(ptr::null_mut()) == 0 {
                return Err("无法打开剪贴板".to_string());
            }

            let mut formats = Vec::new();
            let mut current_format = EnumClipboardFormats(0);

            if current_format == 0 {
                println!("剪贴板为空或无法访问内容。");
            }

            while current_format != 0 {
                let format_name = get_format_name(current_format);
                formats.push(format!("ID: {:<5} | 名称: {}", current_format, format_name));
                current_format = EnumClipboardFormats(current_format);
            }

            CloseClipboard();
            
            if !formats.is_empty() {
                println!("剪贴板中包含 {} 种可用格式:", formats.len());
                for f in formats {
                    println!("- {}", f);
                }
            }
            
            println!("----------------------");
        }
        Ok(result)
    }

    /// 根据格式ID获取其可读名称
    #[cfg(target_os = "windows")]
    unsafe fn get_format_name(format: u32) -> String {
        use winapi::um::winbase::{GlobalLock, GlobalUnlock};
        use winapi::um::winuser::*;

        // 匹配预定义的标准格式
        match format {
            CF_TEXT => "CF_TEXT (ANSI 文本)".to_string(),
            CF_BITMAP => "CF_BITMAP (位图)".to_string(),
            CF_DIB => "CF_DIB (设备无关位图)".to_string(),
            CF_DIBV5 => "CF_DIBV5 (V5版设备无关位图)".to_string(),
            CF_UNICODETEXT => "CF_UNICODETEXT (Unicode 文本)".to_string(),
            CF_HDROP => "CF_HDROP (文件列表)".to_string(),
            CF_RIFF => "CF_RIFF (音频)".to_string(),
            CF_WAVE => "CF_WAVE (WAVE 音频)".to_string(),
            CF_TIFF => "CF_TIFF (TIFF 图像)".to_string(),
            CF_OEMTEXT => "CF_OEMTEXT (OEM 文本)".to_string(),
            CF_PALETTE => "CF_PALETTE (调色板)".to_string(),
            _ => {
                // 尝试获取自定义格式的注册名称
                let mut name_buf: [u16; 256] = [0; 256];
                let len = GetClipboardFormatNameW(format, name_buf.as_mut_ptr(), name_buf.len() as i32);
                if len > 0 {
                    match String::from_utf16(&name_buf[..len as usize]) {
                        Ok(name) => format!("自定义格式: {}", name),
                        Err(_) => "无法解析的自定义格式名称".to_string(),
                    }
                } else {
                    "未知的非标准格式".to_string()
                }
            }
        }
    }

    /// 模拟黏贴按键
    #[cfg(target_os = "windows")]
    pub fn simulate_paste() -> Result<(), String> {
        use winapi::um::winuser::{keybd_event, KEYEVENTF_KEYUP, VK_CONTROL};

        const VK_V: u8 = b'V'; // 大写V的ascii码是 86 = 0x56

        unsafe {
            keybd_event(VK_CONTROL as u8, 0, 0, 0); // 按下 Ctrl
            keybd_event(VK_V, 0, 0, 0); // 按下 V
            keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0); // 释放 V
            keybd_event(VK_CONTROL as u8, 0, KEYEVENTF_KEYUP, 0); // 释放 Ctrl
        }

        Ok(())
    }

    /// 模拟复制按键
    #[cfg(target_os = "windows")]
    pub fn simulate_copy() -> Result<(), String> {
        log::info!("simulate_copy called start");
        use winapi::um::winuser::{keybd_event, KEYEVENTF_KEYUP, VK_CONTROL, VK_MENU};

        const VK_C: u8 = b'C'; // 大写C的ascii码是 67 = 0x43
        const VK_A: u8 = b'A'; // 大写A的ascii码是 65 = 0x41

        unsafe {
            // 可能的冲突: 释放 Alt和A, 防止与召唤菜单时的按键冲突
            // 焦点转移策略时，需要在菜单召唤前 (焦点转移前) 完成
            keybd_event(VK_A, 0, KEYEVENTF_KEYUP, 0);
            keybd_event(VK_MENU as u8, 0, KEYEVENTF_KEYUP, 0);

            keybd_event(VK_CONTROL as u8, 0, 0, 0); // 按下 Ctrl
            keybd_event(VK_C, 0, 0, 0); // 按下 C
            keybd_event(VK_C, 0, KEYEVENTF_KEYUP, 0); // 释放 C
            keybd_event(VK_CONTROL as u8, 0, KEYEVENTF_KEYUP, 0); // 释放 Ctrl
        }

        log::info!("simulate_copy called end");
        Ok(())
    }

    /// 将文本写入剪贴板
    #[cfg(not(target_os = "windows"))]
    pub fn clipboard_set_text(_text: &str) -> Result<(), String> {
        Err("Clipboard operations not implemented for this platform".to_string())
    }

    /// 从剪贴板获取文本
    #[cfg(not(target_os = "windows"))]
    pub fn clipboard_get_text() -> Result<String, String> {
        Err("Clipboard operations not implemented for this platform".to_string())
    }

    /// 模拟黏贴按键
    #[cfg(not(target_os = "windows"))]
    pub fn simulate_paste() -> Result<(), String> {
        Err("Paste simulation not implemented for this platform".to_string())
    }

    /// 模拟黏贴按键
    #[cfg(not(target_os = "windows"))]
    pub fn simulate_copy() -> Result<(), String> {
        Err("Copy simulation not implemented for this platform".to_string())
    }
}

// #region send

#[tauri::command]
fn send_by_clipboard(text: &str) -> String {
    // 将文本写入剪贴板
    clipboard::clipboard_set_text(text).expect("Failed to set clipboard text");

    // 模拟 Ctrl+V 按键来粘贴
    clipboard::simulate_paste().expect("Failed to simulate paste");

    format!("Successfully pasted: {}", text)
}

#[tauri::command]
fn send_by_enigo(text: &str) -> String {
    use enigo::{Enigo, Keyboard, Settings};

    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    // enigo.move_mouse(500, 200, Abs).unwrap();
    // enigo.button(Button::Left, Click).unwrap();
    enigo.text(text).unwrap();
    format!("Successfully sent: {}", text)
}

#[tauri::command]
pub fn send(text: &str, method: &str) -> String {
    if method == "clipboard" {
        return send_by_clipboard(text);
    } 
    else if method == "enigo" || method == "keyboard" {
        return send_by_enigo(text);
    }
    else { // "auto" // 根据文本长度及是否包含换行符，选择发送方式
        if text.contains('\n') || text.len() > 30 {
            return send_by_clipboard(text);
        } else {
            return send_by_enigo(text);
        }
    }
}

// #endregion

/// 获取当前选中的文本
/// 
/// @description 弃用 改成在uia模块中集成，从而支持uia和剪切板两种模式
/// 
/// method: &str,
/// - 剪切板方式 (目前仅支持)
///   - 但事实上剪切板方式并不好用，缺点很多
///   - 需要在菜单召唤出来前完成ctrl+c的模拟按键 (而对于剪切版的识别可以延后执行)
///   - 需要等待剪切板更新，而这个时间不确定且通常较长，会影响用户体验
///   - 可能会覆盖用户原本的剪切板内容
///   - 无法判断当前是否有选中的文本 (有可能没有选中，这个通过剪切板难以判断)
/// 后续可能会用uia等其他方式
#[tauri::command]
pub fn _get_selected_by_clipboard() -> Option<String> {
    let method = "clipboard";
    match method {
        "clipboard" => {
            match clipboard::simulate_copy() {
                Ok(_) => {}
                Err(_) => { log::error!("Failed to simulate copy"); return None; }
            };
            // 模拟复制后，等待一小会儿，确保剪贴板内容更新。这个时间不确定 (根据系统不同可能不同，但通常不能太短)
            // 不过好在这里的复制时机是展开面板时，而不像我之前搞 autohotkey 或 kanata 那样用热键触发，慢得多
            std::thread::sleep(std::time::Duration::from_millis(100));
            let Ok(selected_text) = clipboard::clipboard_get_text() else {
                log::error!("Failed to get clipboard text");
                return None;
            };
            Some(selected_text)
        }
        _ => { log::error!("Unsupported method: {}", method); return None; }
    }
}

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
