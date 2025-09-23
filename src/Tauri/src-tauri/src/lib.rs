// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// 项目模板 默认的表单功能
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

/// 项目模板 默认的表单功能
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Show the main window
#[tauri::command]
fn show_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        window.unminimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Hide the main window
#[tauri::command]  
fn hide_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggle window visibility
#[tauri::command]
fn toggle_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let is_visible = window.is_visible().map_err(|e| e.to_string())?;
        if is_visible {
            hide_window(app_handle)
        } else {
            show_window(app_handle)
        }
    } else {
        Err("Window not found".to_string())
    }
}

/// Quit the application completely
#[tauri::command]
fn quit_app(app_handle: tauri::AppHandle) -> Result<(), String> {
    app_handle.exit(0);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initially hide the window to simulate tray behavior
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // Prevent window from actually closing, hide it instead
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet, 
            paste, 
            show_window, 
            hide_window, 
            toggle_window,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ----------------------------------------------------------------------------

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
