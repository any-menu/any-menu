// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

use std::{
    thread,
    sync::{
        mpsc::{self},
        Mutex,
    }
};

// 自定义包
mod uia_sender;
use uia_sender::{
    UiaSender, UiaMsg, start_uia_worker,
};
mod focus;
mod ad_shortcut;
mod utils;

// 自定义包 - 仅命令
mod uia;
mod text;
mod text_c;
mod file;
mod toml;
mod other;

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
        .plugin(tauri_plugin_notification::init()) // 本地通知插件
        .setup(|app| {
            if let Ok(mut state) = utils::AM_STATE.lock() {
                state.app_handle = Some(app.app_handle().clone());
            }

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
                let open_user_dir_item = MenuItem::with_id(app, "open_user_dir", "Open User Dir (Debug)", true, None::<&str>)?; // 打开用户文件夹菜单项
                Menu::with_items(app, &[&main_debug_item, &open_user_dir_item, &config_item, &restart_item, &quit_item])?
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
                            // 弃用。现已改为在 tauri.config.json 中声明
                            // let _config_window = tauri::WebviewWindowBuilder::new(
                            //     app,
                            //     "am-config",
                            //     tauri::WebviewUrl::App("config.html".into()), // 或者你的配置页面路径
                            // )
                            // .title("AnyMenu - Config")
                            // .inner_size(1000.0, 750.0)
                            // .min_inner_size(400.0, 300.0)
                            // .center()
                            // .resizable(true)
                            // .drag_drop_enabled(false) // 禁用 Tauri 默认的拖拽拦截，把控制权还给前端 HTML5
                            // .build();
                        }
                    }
                    // 打开用户文件夹
                    "open_user_dir" => {
                        let path = std::path::Path::new("./dict/"); // 暂时硬编码即可
                        if path.exists() {
                            let _ = tauri_plugin_opener::open_path(path, None::<&str>);
                        } else {
                            use tauri_plugin_notification::NotificationExt;
                                    app.notification()
                                        .builder()
                                        .title("Anymenu: 路径不存在")
                                        .body("找不到用户文件夹：./dict/")
                                        .show()
                                        .unwrap();
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
            other::greet,
            uia_sender::get_caret, uia_sender::get_caret_debug, // caret 类
            uia::get_screen_size, // size 类
            uia::get_info, // 其他
            text::send, text::clipboard::clipboard_set_text,
            file::read_file, file::read_folder, file::create_file, file::write_file, file::delete_file, // 文件类
            toml::config_read_to_json, toml::config_write_from_json, // 文件类 - 配置文件版
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
