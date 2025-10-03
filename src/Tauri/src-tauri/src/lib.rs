// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use std::thread;

use std::sync::{
    mpsc::{self, Sender, Receiver},
    // Arc,
    Mutex,
};
use tauri::State;
use uiautomation::{
    UIAutomation,
};

// 自定义包
mod uia;
use uia::{
    get_message,
    get_uia_focused,
};


// #region uia thread

// 定义全局 Sender 类型
struct UiaSender(pub Mutex<Sender<UiaMsg>>);

// 消息枚举，根据需求可扩展
enum UiaMsg {
    PrintElement,
}

fn start_uia_worker(rx: Receiver<UiaMsg>) {
    thread::spawn(move || {
        // 初始化 uiautomation
        let automation = UIAutomation::new().unwrap();
        let walker = automation.get_control_view_walker().unwrap();

        loop {
            match rx.recv() {
                Ok(UiaMsg::PrintElement) => {
                    let _ = get_uia_focused(&walker, &automation, 0);
                }
                Err(_) => break,
            }
        }
    });
}

// #endregion

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // uia
    // 新增：初始化channel
    let (tx, rx) = mpsc::channel::<UiaMsg>();
    let uia_sender = UiaSender(Mutex::new(tx));
    // 启动worker线程，传递receiver
    start_uia_worker(rx);

    // 日志插件
    let colors = fern::colors::ColoredLevelConfig {
        error: fern::colors::Color::Red,
        warn: fern::colors::Color::Yellow,
        info: fern::colors::Color::Green,
        debug: fern::colors::Color::Blue,
        trace: fern::colors::Color::Cyan,
    };
    let log_plugin = tauri_plugin_log::Builder::new()
        .level(log::LevelFilter::Debug) // 日志级别
        .with_colors(colors) // 日志高亮
        .format(move |out, message, record| { // 日志格式。主要修改点: 对齐日志级别、对齐日志内容、后移不定长的输出位置
            let time_str = chrono::Local::now().format("[%Y-%m-%d][%H:%M:%S]");
            out.finish(format_args!(
                "{time} [{level:<5}] {message} [{target}]",
                time = time_str,
                level = colors.color(record.level()),
                message = message,
                target = record.target(),
            ));
        })
        // .clear_targets() // 日志目标 (下面分别是: 终端、前端、文件，可按需使用)
        // .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout))
        // .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview))
        // .target(tauri_plugin_log::Target::new(
        //     tauri_plugin_log::TargetKind::Folder {
        //         path: std::path::PathBuf::from("/path/to/logs"), // 会相对于根盘符的绝对路径
        //         file_name: None,
        //     },
        // ))*/
        .build();

    // Tauri 主程序
    tauri::Builder::default()
        .manage(uia_sender) // 依赖注入，注入到Tauri State管理
        .plugin(log_plugin) // 日志插件
        .plugin(tauri_plugin_global_shortcut::Builder::new().build()) // 全局快捷键插件
        .plugin(tauri_plugin_opener::init()) // 在用户系统的默认应用程序中打开文件或 URL
        .setup(|app| {
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?; // 退出菜单项
            let config_item = MenuItem::with_id(app, "config", "Config", true, None::<&str>)?; // 新增配置菜单项
            let menu = Menu::with_items(app, &[&config_item, &quit_item])?; // 菜单项数组

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone()) // 托盘图标
                .tooltip("any-menu")
                .menu(&menu) // 加载菜单项数组
                // .show_menu_on_left_click(true) // 左键也能展开菜单
                .on_menu_event(|app, event| match event.id.as_ref() {
                    // 菜单事件
                    "quit" => {
                        app.exit(0);
                    }
                    // 打开配置窗口
                    "config" => {
                        // 如果配置窗口已存在，直接显示并聚焦
                        if let Some(window) = app.get_webview_window("am-config") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                        // 如果配置窗口不存在，创建新窗口
                        else {
                            let _config_window = tauri::WebviewWindowBuilder::new(
                                app,
                                "am-config",
                                tauri::WebviewUrl::App("config.html".into()), // 或者你的配置页面路径
                            )
                            .title("AnyMenu - Config")
                            .inner_size(600.0, 500.0)
                            .min_inner_size(400.0, 300.0)
                            .center()
                            .resizable(true)
                            .build();
                        }
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
        .invoke_handler(tauri::generate_handler![
            greet, paste, send, get_caret_xy, get_screen_size,
            read_file, read_folder, create_file,
        ])
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

/// 模拟黏贴按键
#[cfg(target_os = "windows")]
fn simulate_paste() -> Result<(), String> {
    use winapi::um::winuser::{keybd_event, KEYEVENTF_KEYUP, VK_CONTROL};

    const VK_V: u8 = 0x56; // VK_V 的值是 0x56

    unsafe {
        keybd_event(VK_CONTROL as u8, 0, 0, 0); // 按下 Ctrl
        keybd_event(VK_V, 0, 0, 0); // 按下 V
        keybd_event(VK_V, 0, KEYEVENTF_KEYUP, 0); // 释放 V
        keybd_event(VK_CONTROL as u8, 0, KEYEVENTF_KEYUP, 0); // 释放 Ctrl
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
fn send(text: &str, method: &str) -> String {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();

    // (可选) 根据文本长度及是否包含换行符，选择发送方式
    if method == "clipboard" {
        return paste(text);
    } 
    else if method == "enigo" || method == "keyboard" {
        // enigo.move_mouse(500, 200, Abs).unwrap();
        // enigo.button(Button::Left, Click).unwrap();
        enigo.text(text).unwrap();
        return format!("Successfully sent: {}", text);
    }
    else { // "auto"
        if text.contains('\n') || text.len() > 30 {
            return paste(text);
        }
        enigo.text(text).unwrap();
        return format!("Successfully sent: {}", text);
    }
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

// #region fs

use std::fs;

#[tauri::command]
fn read_file(path: &str) -> Option<String> {
    match fs::read_to_string(&path) {
        Ok(content) => {
            Some(content)
        }
        Err(e) => {
            eprintln!("读取文件 {} 时出错: {}", path, e);
            None
        }
    }
}

#[tauri::command]
fn create_file(path: &str, content: &str) -> bool {
    match fs::write(path, content) {
        Ok(_) => true,
        Err(e) => {
            eprintln!("创建文件 {} 时出错: {}", path, e);
            false
        }
    }
}

/// 读取目录下的所有文件路径，并返回文件路径列表
/// 似乎不会改变目录的形式 (绝对/相对路径)
#[tauri::command]
fn read_folder(path: &str) -> Option<Vec<String>> {
    let Ok(entries) = fs::read_dir(path) else {
        eprintln!("读取目录 {} 时出错: 目录不存在或无法访问", path);
        return None;
    };

    let mut file_paths = Vec::new(); // 文件路径列表
    for entry in entries {
        let Ok(entry) = entry else { continue }; // 跳过无法读取的条目
        let file_path = entry.path();
        if !file_path.is_file() { continue; } // 跳过目录
        let Some(path_str) = file_path.to_str() else { continue; }; // 跳过无法转换为字符串的路径
        file_paths.push(path_str.to_string());
    }

    Some(file_paths)
}

// #endregion

// #region getCursorXY

// #[tauri::command]
// fn get_cursor_xy() -> Result<Point, String> {}

// #[derive(serde::Serialize)]
// struct Point {
//     x: i32,
//     y: i32,
// }

#[tauri::command]
fn get_caret_xy(_app_handle: tauri::AppHandle, uia_sender: State<UiaSender>) -> (i32, i32) {
    // let mut x = 0;
    // let mut y = 0;
    // return (x, y);

    // uia
    // 向worker线程发消息
    let tx = uia_sender.0.lock().unwrap();
    let _ = tx.send(UiaMsg::PrintElement);

    let (x, y) = get_message();
    return (x, y);
}

// #endregion

// #region getScreenSize

#[tauri::command]
fn get_screen_size(app_handle: tauri::AppHandle) -> Result<(i32, i32), String> {
    // 窗口所在的显示器
    let window = app_handle
        // .get_window("main") // tauri v1
        .get_webview_window("main") // tauri v2
        .ok_or("Main window not found")?;
    let window_monitor = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("No monitor found for current window")?;
    let at_size = window_monitor.size();
    log::info!("at_size:        width={}, height={}", at_size.width, at_size.height);

    // 主显示器
    // let primary_monitor = app_handle
    //     .primary_monitor()
    //     .map_err(|e| e.to_string())?
    //     .ok_or("No primary monitor found")?;
    // let primary_size = primary_monitor.size();
    // log::info!("primary_size:   width={}, height={}", primary_size.width, primary_size.height);

    // 所有显示器的第一个显示器（通常是主显示器）
    // let monitors = app_handle
    //     .available_monitors()
    //     .map_err(|e| e.to_string())?;
    // let monitor = monitors
    //     .into_iter()
    //     .next()
    //     .ok_or("No monitors available")?;
    // let first_size = monitor.size();
    // log::info!("first_size:     width={}, height={}", first_size.width, first_size.height);

    // 其他方案: 也可以用第三方库，如 screen

    // 返回
    Ok((at_size.width as i32, at_size.height as i32))
}

// #endregion
