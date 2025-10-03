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
mod text;
use text::{
    paste,
    send,
    get_selected,
};
mod file;
use file::{
    read_file,
    create_file,
    read_folder,
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
                            .inner_size(1000.0, 750.0)
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
            greet, get_caret_xy, get_screen_size,
            paste, send, get_selected,
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
