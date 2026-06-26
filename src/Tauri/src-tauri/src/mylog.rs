/**
 * 日志系统
 * 
 * 两种策略:
 * - 使用 Tauri log plugin。优点：
 *   - 拥有 webview 转发功能
 * - 使用 log4rs。优点:
 *   - 拥有动态修改日志配置 (目标(终端/文件等)、日志级别)
 *   - 轮转日志
 *   - 终端与文件双格式
 * 
 * 学习笔记:
 * 
 * 依赖库的日志会和自己的日志串一起。
 * 原因是 Rust 的 log 门面机制：
 * 只要全局注册了一个 logger，所有通过 log 宏输出的库（包括 enigo）都会进入这个 logger。
 */

pub fn _init_log_plugin() -> tauri::plugin::TauriPlugin<tauri::Wry> {
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
                let time_str = chrono::Local::now().format("[%Y-%m-%dT%H:%M:%S]");
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

    // 来源限制。避免记录虚拟按键行为，风险
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

// --------------------- 下面是 log4rs 版本 ----------------------
// by deepseek-v4-pro

use log::LevelFilter;
use log4rs::{
    append::{
        console::ConsoleAppender,
        rolling_file::{
            policy::compound::CompoundPolicy,
            policy::compound::roll::fixed_window::FixedWindowRoller,
            policy::compound::trigger::size::SizeTrigger,
            RollingFileAppender,
        },
    },
    config::{Appender, Config, Root},
    encode::pattern::PatternEncoder,
};

pub fn init_log4rs() {
    // ---------- 通用编码格式 (用于文件，用于 release 模式) -------
    let encoder = Box::new(PatternEncoder::new(
        "[{d(%Y-%m-%dT%H:%M:%S)}] [{l:<5}] {m} [{M}]\n",
    ));

    // ---------- 1. 终端输出（debug / release 不同表现）----------
    let console_appender = {
        #[cfg(debug_assertions)]
        {
            // 带颜色的终端输出
            let encoder = Box::new(PatternEncoder::new(
                "[{d(%Y-%m-%dT%H:%M:%S)}] [{h({l:<5})}] {m} [{M}]\n",
            ));
            ConsoleAppender::builder()
                .encoder(encoder)
                .build()
        }
        #[cfg(not(debug_assertions))]
        {
            // release 模式：仅输出到 stderr 或完全禁用（按需调整）
            ConsoleAppender::builder()
                .encoder(encoder.clone())
                .target(log4rs::append::console::Target::Stderr)
                .build()
        }
    };

    // ---------- 2. 文件输出（滚动日志）----------
    let logs_dir = "./logs";
    std::fs::create_dir_all(logs_dir).expect("无法创建日志目录");
    // 轮转策略：文件名 pattern 中包含日期占位符，log4rs 会每天生成新文件
    // 同时限制总文件数（这里固定窗口 7 个），并限制单文件大小（10MB 触发轮转）
    let roller = FixedWindowRoller::builder()
        .build(
            &format!("{}/app.{{}}.log", logs_dir), // {} 会被替换为序号 0~6
            7,                                     // 最多保留 7 个文件
        )
        .expect("FixedWindowRoller 构建失败");
    let size_trigger = SizeTrigger::new(10 * 1024 * 1024); // 10MB
    let compound_policy = CompoundPolicy::new(Box::new(size_trigger), Box::new(roller));
    let file_appender = RollingFileAppender::builder()
        .encoder(encoder)
        .build(
            format!("{}/app.log", logs_dir), // 当前写入文件
            Box::new(compound_policy),
        )
        .expect("RollingFileAppender 构建失败");

    // ---------- 3. 组装配置 ----------
    let config = Config::builder()
        .appender(Appender::builder().build("console", Box::new(console_appender)))
        .appender(Appender::builder().build("file", Box::new(file_appender)))
        // 额外为特定模块单独设置级别（会覆盖 Root 设置）
        .logger(
            log4rs::config::Logger::builder()
                .additive(false)           // 不传播到 Root
                .build("enigo::platform::win_impl", LevelFilter::Off),
        )
        // 全局默认：Debug 级别，输出到控制台和文件
        .build(
            Root::builder()
                .appender("console")
                .appender("file")
                .build(LevelFilter::Debug),
        )
        .expect("log4rs Config 构建失败");

    // ---------- 4. 初始化全局 logger ----------
    log4rs::init_config(config).expect("log4rs 初始化失败");

    // 可选：将之前的 panic hook 也接入 log
    // std::panic::set_hook(Box::new(|info| { log::error!("Panic: {}", info); }));
}
