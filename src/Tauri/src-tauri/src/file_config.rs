/**
 * 文件读写 - 配置文件版
 */

use serde_json::Value as Json;
// use std::env;

use crate::file_toml;

const CONFIG_PATH: &str = "./am-user.toml"; // TODO 放C盘会更利于软件版本更新时复用

#[tauri::command]
fn config_read_to_json() -> Result<Json, String> {
    file_toml::toml_read_to_json(CONFIG_PATH)
}

// 全局配置管理 (支持多线程读取)

static CONFIG: OnceLock<RwLock<Json>> = OnceLock::new();

use std::sync::{OnceLock, RwLock};

/// 初始化全局配置
pub fn init_config() -> Result<(), String> {
    // 打印 CWD
    #[cfg(debug_assertions)]
    if let Ok(cwd) = env::current_dir() {
        println!("CWD: {:?}", cwd);
    }

    let json = config_read_to_json()?;

    CONFIG
        .set(RwLock::new(json))
        .map_err(|_| "Config already initialized".to_string())
}

/// 读取全局配置的某个字段（任意线程均可调用）
///
/// 示例：`config_get(|c| c["server"]["port"].clone())`
pub fn config_get<F, T>(f: F) -> Result<T, String>
where
    F: FnOnce(&Json) -> T,
{
    let lock = CONFIG.get().ok_or("Config not initialized")?;
    let guard = lock.read().map_err(|e| e.to_string())?;
    Ok(f(&guard))
}

/// 热重载：重新从文件读取并替换全局配置
pub fn _config_reload() -> Result<(), String> {
    let json = config_read_to_json()?;
    let lock = CONFIG.get().ok_or("Config not initialized")?;
    let mut guard = lock.write().map_err(|e| e.to_string())?;
    *guard = json;
    Ok(())
}
