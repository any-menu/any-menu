/**
 * 日志系统
 * 
 * 两种策略:
 * 1. 使用 Tauri log plugin。拥有 webview 转发功能 (虽然现在也不用) 
 * 2. 使用 log4rs。拥有: 动态修改日志配置 (目标(终端/文件等)、日志级别)，轮转日志
 * 
 * 学习笔记:
 * 依赖库的日志会和自己的日志串一起。
 * 原因是 Rust 的 log 门面机制：
 * 只要全局注册了一个 logger，所有通过 log 宏输出的库（包括 enigo）都会进入这个 logger。
 */

pub fn get_log_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    // 提前读取配置中的 cache_paths (废弃，没必要修改日志位置，直接硬编码)
    // let cache_paths: Option<String> = file_json::CONFIG.get().expect("CONFIG 未初始化").read().unwrap()
    //     .config["cache_paths"].as_str().map(|s| s.to_string());
    let cache_paths: &str = "./logs/";

    let mut builder;
    #[cfg(debug_assertions)]
    {
        let colors = fern::colors::ColoredLevelConfig {
            error: fern::colors::Color::Red,
            warn: fern::colors::Color::Yellow,
            info: fern::colors::Color::Green,
            debug: fern::colors::Color::Blue,
            trace: fern::colors::Color::Cyan,
        };

        builder = tauri_plugin_log::Builder::new()
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
            // 重新设置日志目标 (下面分别是: 终端、前端、文件，可按需使用)
            .clear_targets()
            .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout))
            .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview));
    }
    // 其中 release 模式无需高亮、美化等 (一般也会禁用掉控制台输出)
    #[cfg(not(debug_assertions))]
    {
        builder = tauri_plugin_log::Builder::new()
            .level(log::LevelFilter::Debug)
            .clear_targets();
    }

    // 来源限制
    // builder = builder.level_for("enigo", log::LevelFilter::Off); // 禁用 enigo 的所有日志
    builder = builder.level_for("enigo::platform::win_impl", log::LevelFilter::Off); // 禁某些子模块

    // 如果 cache_paths 存在，才添加文件目标
    builder = builder.target(tauri_plugin_log::Target::new(
        tauri_plugin_log::TargetKind::Folder {
            // 若 path: std::path::PathBuf::from("/path/to/logs") 则 会相对于根盘符的绝对路径
            path: std::path::PathBuf::from(cache_paths),
            file_name: None,
        },
    ));

    builder.build()
}
