// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use log::{error, info};
use std::thread;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // uia
    thread::spawn(|| {
        // 在新线程中初始化 uiautomation。否则会报错 "COM library not initialized"
        // 原因: 不要让同一线程中同时使用aio和tauri，他们会都尝试去初始化COM
        let automation = UIAutomation::new().unwrap();
        let walker = automation.get_control_view_walker().unwrap();
        let root = automation.get_root_element().unwrap();
        print_element(&walker, &root, 0).unwrap();
    });

    // 日志插件
    let log_plugin = tauri_plugin_log::Builder::new()
        .level(log::LevelFilter::Debug) // 日志级别
        .clear_targets()
        // 打印到终端
        .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout))
        // 打印到前端控制台 (前端要开下attachConsole)
        // .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview))
        // 打印到日志文件
        // .target(tauri_plugin_log::Target::new(
        //     tauri_plugin_log::TargetKind::Folder {
        //         path: std::path::PathBuf::from("/path/to/logs"), // 会相对于根盘符的绝对路径
        //         file_name: None,
        //     },
        // ))
        .build();

    tauri::Builder::default()
        .plugin(log_plugin)
        .plugin(tauri_plugin_global_shortcut::Builder::new().build()) // 全局快捷键插件
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?; // 退出菜单项
            let config_item = MenuItem::with_id(app, "config", "Config", true, None::<&str>)?; // 新增配置菜单项
            let menu = Menu::with_items(app, &[&quit_item, &config_item])?; // 菜单项数组

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
                        if let Some(window) = app.get_webview_window("config") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                        // 如果配置窗口不存在，创建新窗口
                        else {
                            let _config_window = tauri::WebviewWindowBuilder::new(
                                app,
                                "config",
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
        .invoke_handler(tauri::generate_handler![greet, paste, send, read_file, get_caret_xy])
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
fn send(text: &str) -> String {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();

    // (可选) 根据文本长度及是否包含换行符，选择发送方式
    if text.contains('\n') || text.len() > 30 {
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

// #[tauri::command]
// fn read_folder(dir: &str) -> String {
//     let entries = fs::read_dir(dir)?;

//     let mut files_json = Vec::new();

//     for entry in entries {
//         let entry = entry?;
//         let path = entry.path();

//         if !path.is_file() {
//             continue; // 暂时只处理文件，跳过目录。TODO 后续也可以改成递归
//         }

//         let file_name = path.file_name().unwrap().to_str().unwrap();
//         match fs::read_to_string(&path) {
//             Ok(content) => {
//                 println!("=== 文件: {} ===", file_name);
//                 println!("{}", content);
//                 println!("=== 结束 ===\n");
//                 files_json.push(content);
//             }
//             Err(e) => {
//                 eprintln!("读取文件 {} 时出错: {}", file_name, e);
//             }
//         }
//     }

//     serde_json::to_string(&files_json).unwrap_or_else(|e| {
//         eprintln!("序列化文件内容时出错: {}", e);
//         "[]".to_string()
//     })
// }

// #endregion

// #region getCursorXY

// #[tauri::command]
// fn get_cursor_xy() -> Result<Point, String> {}

#[derive(serde::Serialize)]
struct Point {
    x: i32,
    y: i32,
}

#[tauri::command]
fn get_caret_xy() -> (i32, i32) {
    let mut x = 0;
    let mut y = 0;

    return print_msg();

    // info!("Cursor position: ({}, {})", x, y);

    // return (x, y);
}

// 辅助函数：打印窗口名称（调试用）
#[cfg(target_os = "windows")]
fn print_window_name(hwnd: winapi::shared::windef::HWND) {
    use winapi::um::winuser::GetWindowTextW;
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    
    unsafe {
        let mut buffer = [0u16; 512];
        let len = GetWindowTextW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);
        if len > 0 {
            let window_name = OsString::from_wide(&buffer[0..len as usize]);
            info!("窗口名称: {:?}", window_name);
        } else {
            info!("无法获取窗口名称或窗口无标题");
        }
    }
}

// 打印窗口、编辑器、光标 (插入符号，而非鼠标) 等信息
fn print_msg() -> (i32, i32) { 
    info!("---------------print_msg---------------");

    #[cfg(target_os = "windows")]
    {
        use winapi::um::winuser::{
            GetFocus,
            GetCaretPos,
            GetGUIThreadInfo,
            GUITHREADINFO,
            ClientToScreen, GetWindowRect,
            GetForegroundWindow,
            GetWindowThreadProcessId,
        };
        use winapi::shared::windef::{
            HWND, POINT, RECT
        };
        use std::mem::size_of;

        // GetFocus 方式。不好用，第一次定位聚焦窗口错误，聚焦到应用本身，第二次开始都是 "没有聚焦的窗口"
        // GPT 说好像只能获取 **当前线程** 的焦点窗口，不利于去获取非本应用的窗口信息
        let hwnd: winapi::shared::windef::HWND; // 窗口句柄 (hwnd = Handle to WiNDow)                
        let mut point1: POINT;
        unsafe {
            hwnd = GetFocus();
            if hwnd.is_null() {
                error!("S1: GetFocus: 没有聚焦的窗口");
            } else {
                print_window_name(hwnd); // 打印窗口名称（调试用）
        
                point1 = POINT { x: 0, y: 0 };
                if GetCaretPos(&mut point1) != 0 {
                    use winapi::um::winuser::ClientToScreen;
                    ClientToScreen(hwnd, &mut point1);
                    info!("S1: GetCaretPos: 获取位置成功 ({}, {})", point1.x, point1.y);
                } else {
                    error!("S1: GetCaretPos: 获取位置失败");
                }
            }
        }

        // GetGUIThreadInfo 方式，也不好用。浏览器成功，但VSCode、QQ等失败
        let mut point2: POINT;
        unsafe {
            let mut gui_info: GUITHREADINFO = std::mem::zeroed(); // 获取当前GUI线程信息
            gui_info.cbSize = size_of::<GUITHREADINFO>() as u32;
        
            if GetGUIThreadInfo(0, &mut gui_info) == 0 {
                error!("S2: GetGUIThreadInfo: 获取GUI线程信息失败");
            }
            else {
                // 检查是否有活动的插入符号
                if gui_info.hwndCaret.is_null() {
                    error!("S2: gui_info.hwndCaret: 没有活动的插入符号");
                } else {
                    // 获取插入符号的位置
                    let mut caret_rect = gui_info.rcCaret;
                    let hwnd_caret = gui_info.hwndCaret;
                    
                    // 打印窗口名称（调试用）
                    print_window_name(hwnd_caret);
                    
                    // 将客户区坐标转换为屏幕坐标
                    point2 = POINT { 
                        x: caret_rect.left, 
                        y: caret_rect.bottom // 使用底部坐标，这样窗口会出现在光标下方
                    };
                    
                    if ClientToScreen(hwnd_caret, &mut point2) == 0 {
                        error!("S2: 转换屏幕坐标失败，转换前位置: ({}, {})", point2.x, point2.y);
                    } else {
                        info!("S2: 转换屏幕坐标成功: ({}, {})", point2.x, point2.y);
                    }
                }
            }
        }

        // GetForegroundWindow 方式。准确，获取的是活跃窗口的窗口位置
        let hwnd2: winapi::shared::windef::HWND;
        let mut point3: POINT;
        unsafe {
            hwnd2 = GetForegroundWindow();
            if hwnd2.is_null() {
                error!("S3: GetForegroundWindow: 没有前台窗口");
            } else {
                // 打印窗口名称（调试用）
                print_window_name(hwnd2);

                point3 = POINT { x: 0, y: 0 };
                if GetCaretPos(&mut point3) != 0 {
                    ClientToScreen(hwnd2, &mut point3);
                    info!("S3: GetForegroundWindow + GetCaretPos 获取位置成功: ({}, {})", point3.x, point3.y);
                } else {
                    error!("S3: GetForegroundWindow + GetCaretPos 获取位置失败");
                }
            }
        }
    
        // GetForegroundWindow + GetGUIThreadInfo组合方式。
        // 和之前一样，前者成功，后者浏览器成功，但VSCode、QQ等失败
        unsafe {            
            if hwnd2.is_null() {
                error!("S4: 没有前台窗口");
            } else {
                // 获取前台窗口的线程ID
                let mut pid = 0;
                let thread_id = GetWindowThreadProcessId(hwnd2, &mut pid);
                
                // 打印窗口名称和线程ID（调试用）
                print_window_name(hwnd2);
                
                // 获取线程的GUI信息
                let mut gui_info: GUITHREADINFO = std::mem::zeroed();
                gui_info.cbSize = size_of::<GUITHREADINFO>() as u32;
                
                if GetGUIThreadInfo(thread_id, &mut gui_info) == 0 {
                    error!("S4: 获取前台窗口GUI线程信息失败");
                } else {
                    if gui_info.hwndCaret.is_null() {
                        error!("S4: 前台窗口没有活动的插入符号");
                    } else {
                        let mut caret_rect = gui_info.rcCaret;
                        let hwnd_caret = gui_info.hwndCaret;
                        
                        print_window_name(hwnd_caret);
                        
                        let mut point = POINT { 
                            x: caret_rect.left, 
                            y: caret_rect.bottom 
                        };
                        
                        if ClientToScreen(hwnd_caret, &mut point) == 0 {
                            error!("S4: 前台窗口无法转换为屏幕坐标");
                        } else {
                            info!("S4: 前台窗口光标位置: ({}, {})", point.x, point.y);
                            return (point.x, point.y);
                        }
                    }
                }
            }
        }

        // uiautomation
        {
            // let automation = UIAutomation::new().unwrap();
            // let walker = automation.get_control_view_walker().unwrap();
            // let root = automation.get_root_element().unwrap();

            // print_element(&walker, &root, 0).unwrap();
        }

        return (-1, -1);
    }
}

// use uiautomation::Result; // 这行代码告诉编译器：“在这个函数里，当我写 Result 的时候，我指的不是标准库里的 std::result::Result，而是 uiautomation 这个库里定义的 Result
use uiautomation::UIAutomation;
use uiautomation::UIElement;
use uiautomation::UITreeWalker;

fn print_element(walker: &UITreeWalker, element: &UIElement, level: usize) -> uiautomation::Result<()> {
    for _ in 0..level {
        print!(" ")
    }
    println!("{} - {}", element.get_classname()?, element.get_name()?);

    if let Ok(child) = walker.get_first_child(&element) {
        // print_element(walker, &child, level + 1)?; // 递归

        let mut next = child;
        while let Ok(sibling) = walker.get_next_sibling(&next) {
            print_element(walker, &sibling, level + 1)?;

            next = sibling;
        }
    }
    
    Ok(())
}

// #endregion
