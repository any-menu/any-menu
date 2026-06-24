/**
 * 文件读写 - json 文件版 & json 配置文件版
 */
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value as Json};
use std::sync::{OnceLock, RwLock};
use tokio::fs;

const CONFIG_PATH: &str = "./config/"; // TODO App 版本可以考虑放C盘，使软件更新后更易于复用

/// 全局应用配置（支持多线程读取）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    config: Json,
    config_css_vars: Json,
    config_plugins: Json,
}
static CONFIG: OnceLock<RwLock<AppConfig>> = OnceLock::new();

/// 初始化全局配置（应在程序启动时调用一次）
pub fn init_all_json_config() {
    let app_config = AppConfig {
        config: Json::Object(Map::new()),
        config_css_vars: Json::Object(Map::new()),
        config_plugins: Json::Object(Map::new()),
    };
    CONFIG
        .set(RwLock::new(app_config))
        .expect("CONFIG 已经初始化过");
}

/// 浅合并 JSON 对象到目标 (对应 ts Object.assign)
fn shallow_merge(target: &mut Json, source: &Json) -> bool {
    if let (Json::Object(t), Json::Object(s)) = (target, source) {
        for (k, v) in s {
            t.insert(k.clone(), v.clone());
        }
        true
    } else {
        eprintln!("源配置或目标配置不都是Object");
        false
    }
}

/// 内部获取配置快照
fn get_all_json_config_internal() -> AppConfig {
    let config_lock = CONFIG.get().expect("CONFIG 未初始化");
    let guard = config_lock.read().unwrap();
    guard.clone() // 利用 Clone trait 复制一份
}

// ----------------------------------------------------

/// 读取并解析单个 JSON 文件
/// 
/// - 文件不存在：返回空对象（视为成功）
/// - 解析失败：返回 Err(false)
async fn read_json_file(path: &str) -> Result<Json, bool> {
    let content = match fs::read_to_string(path).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("没配置文件，将自动生成一个: {}", e);
            return Ok(Json::Object(Map::new()));
        }
    };

    match serde_json::from_str(&content) {
        Ok(v) => Ok(v),
        Err(e) => {
            eprintln!("配置解析失败，请检查格式是否正确: {}", e);
            Err(false)
        }
    }
}

/// 读取全部三个配置文件，并应用合并（对应 loadConfig）
#[tauri::command]
pub async fn read_all_json_config() -> AppConfig {
    // 1. 并行读取文件
    let config_path = format!("{}config.json", CONFIG_PATH);
    let css_vars_path = format!("{}config_css_vars.json", CONFIG_PATH);
    let plugins_path = format!("{}config_plugins.json", CONFIG_PATH);
    let (res1, res2, res3) = tokio::join!(
        read_json_file(&config_path),
        read_json_file(&css_vars_path),
        read_json_file(&plugins_path),
    );

    // 2. 获取写锁，合并数据
    let config_lock = CONFIG.get().expect("CONFIG 未初始化");
    {
        let mut guard = config_lock.write().unwrap();
        let app_config = &mut *guard;
        let _r1 = res1.map_or(false, |j| shallow_merge(&mut app_config.config, &j));
        let _r2 = res2.map_or(false, |j| shallow_merge(&mut app_config.config_css_vars, &j));
        let _r3 = res3.map_or(false, |j| shallow_merge(&mut app_config.config_plugins, &j));
    } // 释放写锁

    // 3. 无论如何均重新保存一遍（避免开发过程中新增的选项丢失）
    write_all_json_config().await;

    get_all_json_config_internal()
}

/// 从后端获取对应的配置对象 (不重复读)
#[tauri::command]
pub async fn get_all_json_config() -> AppConfig {
    get_all_json_config_internal()
}

/// 写入单个 JSON 文件（带 pretty 格式化）
async fn write_json_file(path: &str, value: &Json) {
    let content = serde_json::to_string_pretty(value).expect("序列化 JSON 失败");

    // 确保父目录存在（递归创建）
    if let Some(parent) = std::path::Path::new(path).parent() {
        if let Err(e) = tokio::fs::create_dir_all(parent).await {
            eprintln!("创建目录 {} 失败: {}", parent.display(), e);
            return; // 无法创建目录时放弃写入
        }
    }

    // 写入文件
    if let Err(e) = std::fs::write(path, content) {
        eprintln!("写入配置文件失败 {}: {}", path, e);
    }
}

/// 保存全部三个配置文件（对应 saveConfig）
#[tauri::command]
pub async fn write_all_json_config() -> bool {
    // 1. 获取读锁，克隆数据后立即释放锁
    let (config_data, css_vars_data, plugins_data) = {
        let guard = CONFIG.get().expect("CONFIG 未初始化").read().unwrap();
        let app = &*guard;
        (
            app.config.clone(),
            app.config_css_vars.clone(),
            app.config_plugins.clone(),
        )
    }; // 锁在此处释放

    let config_path = format!("{}config.json", CONFIG_PATH);
    let css_vars_path = format!("{}config_css_vars.json", CONFIG_PATH);
    let plugins_path = format!("{}config_plugins.json", CONFIG_PATH);

    // 2. 并行写入（类似 Promise.all）（无锁守卫）
    let _ = tokio::join!(
        write_json_file(&config_path, &config_data),
        write_json_file(&css_vars_path, &css_vars_data),
        write_json_file(&plugins_path, &plugins_data),
    );

    true
}
