// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

use std::{
    thread,
    sync::{
        mpsc::{self, Sender, Receiver},
        // Arc,
        Mutex,
    }
};
use tauri::State;
use uiautomation::{
    UIAutomation,
};

// 自定义包
mod uia;
use uia::{
    get_uia_focused,
    get_uia_by_windows,
    get_selected,
    get_info,
};
mod text;
use text::{
    send,
};
mod text_c;
mod file;
use file::{
    read_file,
    read_folder,
    create_file,
    write_file,
    delete_file
};
mod focus;
mod ad_shortcut;

// #region uia thread

// 定义全局 Sender 类型
struct UiaSender(pub Mutex<Sender<UiaMsg>>);

// 消息枚举，根据需求可扩展
enum UiaMsg {
    PrintElement,
}

fn start_uia_worker(rx: Receiver<UiaMsg>) {
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
}

// #endregion

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 日志插件。release 模式无需高亮 (一般也会禁用掉控制台输出)
    #[cfg(debug_assertions)]
    let colors = fern::colors::ColoredLevelConfig {
        error: fern::colors::Color::Red,
        warn: fern::colors::Color::Yellow,
        info: fern::colors::Color::Green,
        debug: fern::colors::Color::Blue,
        trace: fern::colors::Color::Cyan,
    };
    #[cfg(debug_assertions)]
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
    #[cfg(not(debug_assertions))]
    let log_plugin = tauri_plugin_log::Builder::new()
        .level(log::LevelFilter::Debug)
        .build();

    // uia 模块 - 独立线程
    let (tx, rx) = mpsc::channel::<UiaMsg>();
    let uia_sender = UiaSender(Mutex::new(tx));
    thread::spawn(move || { // 传递receiver
        start_uia_worker(rx);
    });

    // Tauri 主程序
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init()) // HTTP 请求插件
        .manage(uia_sender) // 依赖注入，注入到Tauri State管理
        .plugin(log_plugin) // 日志插件
        .plugin(tauri_plugin_global_shortcut::Builder::new().build()) // 全局快捷键插件
        .plugin(tauri_plugin_opener::init()) // 在用户系统的默认应用程序中打开文件或 URL
        .setup(|app| {
            // focus 模块 (被全局快捷键黑白名单依赖) - 独立线程
            focus::init_focus_check(app.app_handle().clone());

            // 高级快捷键模块 - 独立线程
            let app_handle2 = app.app_handle().clone();
            std::thread::spawn(|| {
                ad_shortcut::init_ad_shortcut(app_handle2);
            });

            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?; // 退出菜单项
            let restart_item = MenuItem::with_id(app, "restart", "Restart", true, None::<&str>)?; // 重启菜单项
            let config_item = MenuItem::with_id(app, "config", "Config", true, None::<&str>)?; // 配置菜单项

            // 菜单项数组
            #[cfg(debug_assertions)]
            let menu = {
                // 只在 debug 模式下创建 "Main (Debug)" 菜单项
                let main_debug_item = MenuItem::with_id(app, "main", "Main (Debug)", true, None::<&str>)?;
                Menu::with_items(app, &[&main_debug_item, &config_item, &restart_item, &quit_item])?
            };
            #[cfg(not(debug_assertions))]
            let menu = Menu::with_items(app, &[&config_item, &restart_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone()) // 托盘图标
                .tooltip("any-menu")
                .menu(&menu) // 加载菜单项数组
                // .show_menu_on_left_click(true) // 左键也能展开菜单
                .on_menu_event(|app, event| match event.id.as_ref() {
                    // 退出应用
                    "quit" => {
                        app.exit(0);
                    }
                    // 重启应用
                    "restart" => {
                        app.restart();
                    }
                    // 打开配置窗口
                    "config" => {
                        // 如果窗口已存在，直接显示并聚焦
                        if let Some(window) = app.get_webview_window("am-config") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                        // 如果窗口不存在，创建新窗口
                        else {
                            let _config_window = tauri::WebviewWindowBuilder::new(
                                app,
                                "am-config",
                                tauri::WebviewUrl::App("config.html".into()), // 或者你的配置页面路径
                            )
                            .title("AnyMenu - Config")
                            .inner_size(1000.0, 750.0)
                            .min_inner_size(400.0, 300.0)
                            .center()
                            .resizable(true)
                            .build();
                        }
                    }
                    // 仅调试用 (如正常情况无法召唤main窗口时。正常不应使用，缺少一些窗口显示后的后操作)
                    "main" => {
                        // 如果窗口已存在，直接显示并聚焦
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                        // 如果窗口不存在，创建新窗口
                        else {
                            let _config_window = tauri::WebviewWindowBuilder::new(
                                app,
                                "main",
                                tauri::WebviewUrl::App("index.html".into()), // 或者你的配置页面路径
                            )
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
            greet,
            get_caret, get_caret_debug, get_screen_size, // size类
            get_selected, get_info, // 其他类
            send,
            read_file, read_folder, create_file, write_file, delete_file,
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

// #region getCursorXY

// #[tauri::command]
// fn get_cursor_xy() -> Result<Point, String> {}

// #[derive(serde::Serialize)]
// struct Point {
//     x: i32,
//     y: i32,
// }

#[tauri::command]
fn get_caret(_app_handle: tauri::AppHandle, _uia_sender: State<UiaSender>) -> (i32, i32, String, String) {
    let (x, y, str, win_name) = get_message();
    return (x, y, str, win_name);
}

#[tauri::command]
fn get_caret_debug(_app_handle: tauri::AppHandle, uia_sender: State<UiaSender>) -> (i32, i32, String, String) {
    // uia
    // 向worker线程发消息
    let tx = uia_sender.0.lock().unwrap();
    let _ = tx.send(UiaMsg::PrintElement);
    
    let _ = get_uia_by_windows(); 

    let (x, y, str, win_name) = get_message();
    return (x, y, str, win_name);
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

/// 汇总一些信息
/// 包括: 坐标、选择文本、窗口名等
fn get_message() -> (i32, i32, String, String) {
    let (x, y) = uia::get_win_message();
    let selected_mode: &str = "uia";
    let selected_text: Option<String> = get_selected(selected_mode);
    (x, y, selected_text.unwrap_or("".to_string()), uia::get_uia_by_windows_winname())
}
