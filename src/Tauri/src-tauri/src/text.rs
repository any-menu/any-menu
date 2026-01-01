/// 剪切板冲突问题
/// 
/// 如果同时有两个线程想要打开剪切板，则可能导致其中一个失败。为了避免这种情况。
/// 这里要捋顺一下剪切板的调用时机:
/// 
/// 展开 miniEditor 并显示选择文本时:
/// - getCursorXY (get_caret (get_win_message坐标, get_selected, get_uia_by_windows_winname)) // 仅uia，不剪切板
/// - getScreenSize (get_screen_size)

/// 剪切板 - 仅关注最近项
pub mod clipboard {
    /// 将文本写入剪贴板
    pub fn clipboard_set_text(text: &str) -> Result<(), String> {
        #[cfg(not(target_os = "windows"))]
        return Err("Clipboard operations not implemented for this platform".to_string());

        #[cfg(target_os = "windows")] {
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
                    CloseClipboard(); return Err("Failed to empty clipboard".to_string());
                }

                let wide: Vec<u16> = OsStr::new(text).encode_wide().chain(once(0)).collect();
                let len = wide.len() * std::mem::size_of::<u16>();

                let h_mem: HANDLE = GlobalAlloc(GMEM_MOVEABLE, len);
                if h_mem.is_null() {
                    CloseClipboard(); return Err("Failed to allocate memory".to_string());
                }

                let p_mem = GlobalLock(h_mem);
                if p_mem.is_null() {
                    CloseClipboard(); return Err("Failed to lock memory".to_string());
                }

                ptr::copy_nonoverlapping(wide.as_ptr(), p_mem as *mut u16, wide.len());
                GlobalUnlock(h_mem);

                if SetClipboardData(CF_UNICODETEXT, h_mem).is_null() {
                    CloseClipboard(); return Err("Failed to set clipboard data".to_string());
                }

                CloseClipboard(); Ok(())
            }
        }
    }

    /// 更健壮的 clipboard_get_text() 方法
    /// 尝试改善bug: 直接 clipboard_get_text() 有可能会冲突，获取失败，提示: Failed to open clipboard
    #[cfg(target_os = "windows")]
    fn clipboard_get_both_with_retry(
        max_retries: u32,
        delay: std::time::Duration,
    ) -> Result<(String, String), String> {
        let mut last_error = "Unknown error".to_string();
        for attempt in 0..max_retries {
            match clipboard_get_text() {
                Ok(text) => {
                    let result_html: String = match clipboard_get_html() {
                        Ok(html) => {
                            html
                        },
                        Err(e) => {
                            log::warn!("Failed to get clipboard HTML: {}", e);
                            "".to_string()
                        }
                    };
                    return Ok((text, result_html));
                },
                Err(e) => {
                    last_error = e.to_string();
                    if last_error.contains("Failed to open clipboard") {
                        log::warn!(
                            "Attempt {} to get clipboard text failed: {}. Retrying in {:?}...",
                            attempt + 1,
                            last_error,
                            delay
                        );
                        std::thread::sleep(delay);
                    } else {
                        // For other errors, fail immediately.
                        return Err(last_error);
                    }
                }
            }
        }
        last_error = format!(
            "Failed to get clipboard text after {} retries. Last error: {}",
            max_retries, last_error
        );
        Err(last_error)
    }

    /// 从剪贴板获取文本
    pub fn clipboard_get_text() -> Result<String, String> {
        #[cfg(not(target_os = "windows"))]
        return Err("Clipboard operations not implemented for this platform".to_string());

        #[cfg(target_os = "windows")] {
            use std::ptr;
            use winapi::um::winbase::{GlobalLock, GlobalUnlock};
            use winapi::um::winuser::{CloseClipboard, OpenClipboard, GetClipboardData, CF_UNICODETEXT};

            unsafe {
                if OpenClipboard(ptr::null_mut()) == 0 {
                    return Err("Failed to open clipboard".to_string());
                }

                let h_data = GetClipboardData(CF_UNICODETEXT);
                if h_data.is_null() {
                    CloseClipboard(); return Err("No text data in clipboard".to_string());
                }

                let p_data = GlobalLock(h_data);
                if p_data.is_null() {
                    CloseClipboard(); return Err("Failed to lock clipboard data".to_string());
                }

                let mut len = 0;
                while *(p_data as *const u16).add(len) != 0 {
                    len += 1;
                }

                let slice = std::slice::from_raw_parts(p_data as *const u16, len);
                let text = String::from_utf16(slice).map_err(|e| e.to_string())?;

                GlobalUnlock(h_data);
                CloseClipboard(); Ok(text)
            }
        }
    }

    /// 从剪贴板获取 HTML 内容
    pub fn clipboard_get_html() -> Result<String, String> {
        #[cfg(not(target_os = "windows"))]
        return Err("Clipboard2 operations not implemented for this platform".to_string());

        #[cfg(target_os = "windows")] {
            use std::ffi::CString;
            use std::ptr;
            use std::str;
            use winapi::um::winbase::{GlobalLock, GlobalSize, GlobalUnlock};
            use winapi::um::winuser::{
                CloseClipboard, GetClipboardData, IsClipboardFormatAvailable, OpenClipboard,
                RegisterClipboardFormatA,
            };
        
            let html_format_name = CString::new("HTML Format").unwrap();
            let cf_html = unsafe { RegisterClipboardFormatA(html_format_name.as_ptr()) };
        
            unsafe {
                if IsClipboardFormatAvailable(cf_html) == 0 {
                    return Err("No HTML format data in clipboard".to_string());
                }
        
                if OpenClipboard(ptr::null_mut()) == 0 {
                    return Err("Failed to open clipboard".to_string());
                }
        
                let h_data = GetClipboardData(cf_html);
                if h_data.is_null() {
                    CloseClipboard();
                    return Err("Failed to get clipboard data handle for HTML".to_string());
                }
        
                let p_data = GlobalLock(h_data);
                if p_data.is_null() {
                    CloseClipboard();
                    return Err("Failed to lock clipboard data for HTML".to_string());
                }
        
                let size = GlobalSize(h_data);
                let data_slice = std::slice::from_raw_parts(p_data as *const u8, size);
        
                // 将字节切片转换为字符串，以便解析头部
                let text = str::from_utf8(data_slice).map_err(|e| e.to_string())?;
        
                // 解析头部以找到HTML内容的起始位置
                let mut start_html = 0;
                let mut end_html = text.len();
                for line in text.lines() {
                    if line.starts_with("StartHTML:") {
                        start_html = line["StartHTML:".len()..].parse().unwrap_or(0);
                    }
                    if line.starts_with("EndHTML:") {
                        end_html = line["EndHTML:".len()..].parse().unwrap_or(text.len());
                    }
                    if line.starts_with("<!--") {
                        break;
                    }
                }
                
                // 确保索引在范围内
                if start_html > end_html || end_html > text.len() {
                    GlobalUnlock(h_data);
                    CloseClipboard();
                    return Err("Invalid HTML offsets in clipboard data".to_string());
                }
        
                // 提取HTML片段
                let html_content = &text[start_html..end_html];
        
                GlobalUnlock(h_data);
                CloseClipboard();
        
                Ok(html_content.to_string())
            }
        }
    }

    /// 模拟黏贴按键
    pub fn simulate_paste() -> Result<(), String> {
        #[cfg(not(target_os = "windows"))]
        return Err("Paste simulation not implemented for this platform".to_string());

        #[cfg(target_os = "windows")] {
            use winapi::um::winuser::{
                keybd_event, KEYEVENTF_KEYUP,
                VK_CONTROL, VK_MENU, VK_SHIFT, VK_LWIN, VK_RWIN, GetKeyState
            };

            const VK_V: u8 = b'V'; // 大写V的ascii码是 86 = 0x56

            unsafe {
                // 检查并释放的干扰键，先模拟释放，防止干扰 Ctrl+V
                let interfere_keys = [VK_MENU, VK_SHIFT, VK_LWIN, VK_RWIN];
                let mut _pressed_keys = Vec::new(); // 待恢复
                for &key in &interfere_keys {
                    if (GetKeyState(key) as u16 & 0x8000) == 0 { continue; } // 未按下
                    keybd_event(key as u8, 0, KEYEVENTF_KEYUP, 0); // 释放 干扰键
                    _pressed_keys.push(key);
                }

                keybd_event(VK_CONTROL as u8, 0, 0, 0); // 按下 Ctrl
                keybd_event(VK_V, 0, 0, 0); // 按下 V
                keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0); // 释放 V
                keybd_event(VK_CONTROL as u8, 0, KEYEVENTF_KEYUP, 0); // 释放 Ctrl

                // 可选:
                // 恢复之前被释放的按键状态，以保持用户键盘状态一致
                // 暂时不予恢复。是否恢复都有可能有bug，但感觉恢复的话更容易出问题
                // for &key in &pressed_keys {
                //     keybd_event(key as u8, 0, 0, 0);
                // }
            }
        }

        Ok(())
    }

    /// 模拟复制按键
    pub fn simulate_copy() -> Result<(), String> {
        log::info!("simulate_copy called start");

        #[cfg(not(target_os = "windows"))]
        Err("Copy simulation not implemented for this platform".to_string());

        #[cfg(target_os = "windows")] {
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
        }

        log::info!("simulate_copy called end");
        Ok(())
    }

    /// 通过模拟复制来获取当前选中的文本 (新版)
    /// 
    /// 新版不再使用sleep方式来等待，容易时间过长/过短，而是使用轮询+剪切板id的方式来检测剪切板内容是否更新
    pub fn get_selected_by_clipboard() -> Result<(String, String), String> {
        #[cfg(not(target_os = "windows"))]
        return Err("不支持的操作系统".into());

        #[cfg(target_os = "windows")] {
            use std::time::{Duration, Instant};
            // use windows_sys::Win32::System::DataExchange::GetClipboardSequenceNumber;
            use winapi::um::winuser::*;

            // 1. 获取初始的剪切板序列号
            // 如果当前没有焦点窗口或没有东西被选中，复制操作可能会失败，序列号也不会变
            let initial_sequence_num = unsafe { GetClipboardSequenceNumber() };

            // 2. 模拟复制
            if let Err(e) = simulate_copy() {
                log::error!("Failed to simulate copy: {}", e); return Err("模拟复制失败".into());
            }

            // 3. 等待更新 (带超时的轮询，等待剪切板更新)
            let timeout = Duration::from_millis(500); // 超时时间
            let start_time = Instant::now(); // 开始时间
            loop {
                let current_sequence_num = unsafe { GetClipboardSequenceNumber() };
                // 剪切板已更新，退出
                if current_sequence_num != initial_sequence_num {
                    // 实践中，即使序列号变了，内容写入也可能还有微小延迟，
                    // 加一个极短的 sleep 是一个“带保险带”的做法，但通常非必需。
                    std::thread::sleep(Duration::from_millis(10));
                    break;
                }
                // 超时
                if start_time.elapsed() > timeout {
                    // 正常的。可能是没有选中文本，也可能是剪切板更新超时
                    log::warn!("Timeout waiting for clipboard update. Maybe nothing was selected.");
                    return Err("null".into());
                }
                // 继续轮询 (先短暂休眠，避免CPU空转)
                std::thread::sleep(Duration::from_millis(5));
            }

            // 4. 获取复制的内容
            return match clipboard_get_both_with_retry(10, Duration::from_millis(50)) {
                Ok((text, html)) => Ok((text, html)),
                Err(e) => {
                    log::error!("Failed to get clipboard text after update: {}", e);
                    Err(format!("获取剪切板文本失败: {}", e))
                }
            };
        }

        /// 通过模拟复制来获取当前选中的文本 (旧版)
        /// 
        /// 模拟Ctrl+C一般是用 winuser::keybd_event / enigo，不用 simulate (组合键存在问题)
        /// 
        /// 需要注意的是: ctrl+c模拟函数到按键按出来，以及按出来后到剪切板刷新。都需要等待一段时间，再获取时结果才是正确的
        /// 这个时间不确定 (根据系统不同可能不同，但通常不能太短)
        /// 
        /// 优化: 不过好在这里的复制时机是展开面板时，该函数可以线程/闭包执行。
        /// 而不像我之前搞 autohotkey 或 kanata 那样用热键触发，慢得多
        fn _get_selected_by_clipboard() -> Option<String> {
            // 2. 模拟复制
            if let Err(e) = simulate_copy() {
                log::error!("Failed to simulate copy: {}", e); return None;
            }

            // 3. 等待更新
            std::thread::sleep(std::time::Duration::from_millis(100));

            // 4. 获取复制的内容
            return match clipboard_get_text() {
                Ok(text) => Some(text),
                Err(_) => {
                    log::error!("Failed to get clipboard text");
                    None
                }
            };
        }
    }

    /// 获取并打印当前剪贴板中所有可用的数据格式
    #[cfg(target_os = "windows")]
    pub fn clipboard_get_info() -> Result<String, String> {
        use std::ptr;
        use winapi::um::winuser::*;
        let mut result: String = "".to_string();

        match crate::text_c::get_clipboard_info_all() {
            Ok(info) => result += &info,
            Err(err) => {
                log::error!("get_and_print_all_clipboard_info failed: {}", err);
                result += &format!("Failed to get clipboard info: {}", err);
            }
        }

        let mut formats = Vec::new();
        unsafe {
            if OpenClipboard(ptr::null_mut()) == 0 {
                return Err("无法打开剪贴板".to_string());
            }

            let mut current_format = EnumClipboardFormats(0);

            if current_format == 0 {
                log::error!("剪贴板为空或无法访问内容。");
            }

            while current_format != 0 {
                let format_name = get_format_name(current_format);
                formats.push(format!("ID: {:<5} | 名称: {}", current_format, format_name));
                current_format = EnumClipboardFormats(current_format);
            }

            CloseClipboard();
        }
        if !formats.is_empty() {
            println!("剪贴板中包含 {} 种可用格式:", formats.len());
            for f in formats {
                println!("- {}", f);
            }
        }

        Ok(result)
    }

    /// 根据格式ID获取其可读名称
    #[cfg(target_os = "windows")]
    unsafe fn get_format_name(format: u32) -> String {
        // use winapi::um::winbase::{GlobalLock, GlobalUnlock};
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
                let len = unsafe { GetClipboardFormatNameW(format, name_buf.as_mut_ptr(), name_buf.len() as i32) };
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

    fn send_by_clipboard(text: &str) -> String {
        // 将文本写入剪贴板
        clipboard::clipboard_set_text(text).expect("Failed to set clipboard text");

        // 模拟 Ctrl+V 按键来粘贴
        clipboard::simulate_paste().expect("Failed to simulate paste");

        format!("Successfully pasted: {}", text)
    }

    fn send_by_enigo(text: &str) -> String {
        use enigo::{Enigo, Keyboard, Settings};

        let mut enigo = Enigo::new(&Settings::default()).unwrap();
        // enigo.move_mouse(500, 200, Abs).unwrap();
        // enigo.button(Button::Left, Click).unwrap();
        enigo.text(text).unwrap();
        format!("Successfully sent: {}", text)
    }
}
