/** Tauri 多窗口配置与状态同步器 (Synchronizer) */

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    fs,
    path::PathBuf,
    sync::Mutex,
};
use tauri::{AppHandle, Manager, State};

// ---------- 数据结构 ----------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalSetting {
    pub config: Value,
    pub state: Value,
}

/// 应用全局状态：使用 Option 表示配置是否已经初始化
pub struct AppState {
    pub setting: Mutex<Option<GlobalSetting>>,
    pub file_path: PathBuf,
}

/// 命令: 获取当前设置（可能为 null）
#[tauri::command]
fn get_global_setting(state: State<'_, AppState>) -> Option<GlobalSetting> {
    let setting = state.setting.lock().ok()?;
    setting.clone() // 如果是 None，则返回 None
}

/// 命令: 广播设置变更
#[tauri::command]
fn broadcast_global_setting(
    window: tauri::Window,
    state: State<'_, AppState>,
    setting: GlobalSetting,
) -> Result<(), String> {
    // 1. 更新内存
    {
        let mut current = state
            .setting
            .lock()
            .map_err(|e| format!("锁失败: {}", e))?;
        *current = Some(setting.clone());
    }

    // 2. 持久化到磁盘（以便应用重启后从窗口可加载）
    let json = serde_json::to_string(&setting).map_err(|e| format!("序列化失败: {}", e))?;
    fs::write(&state.file_path, &json)
        .map_err(|e| format!("写入文件失败: {}", e))?;

    // 3. 向除当前窗口外的所有窗口广播事件
    let label = window.label().to_string();
    let app_handle = window.app_handle();
    for (win_label, win) in app_handle.windows() {
        if win_label != label {
            win.emit("global-setting-updated", &setting)
                .unwrap_or_else(|e| {
                    eprintln!("[WindowSync] 向窗口 {} 发送事件失败: {}", win_label, e);
                });
        }
    }

    Ok(())
}

// ---------- 初始化：尝试从磁盘加载，但初始仍为 None ----------
fn load_persisted_setting(path: &PathBuf) -> Option<GlobalSetting> {
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let mut file_path = app
                .path()
                .app_data_dir()
                .expect("无法获取 app data 目录");
            fs::create_dir_all(&file_path).ok();
            file_path.push("global_setting.json");

            // 尝试加载持久化配置，但初始状态仍是 None（表示未初始化）
            // 注意：这里不自动设置，仅作缓存备用
            let persisted = load_persisted_setting(&file_path);
            // 如果需要保留持久化数据以加速从窗口启动，可以将持久化内容直接放入内存，
            // 但为了遵循“主窗口提供初始配置”，这里不自动激活，而是让主窗口在启动时覆盖。
            // 一种折中：如果存在持久化文件，将其作为初始值，这样从窗口启动时不必等待主窗口；
            // 但主窗口启动后会立即覆盖。这取决于业务需求。此处保持 Option，完全交由主窗口初始化。
            let initial = None; // 改为 Some(persisted) 可启用持久化预热，主窗口启动后仍会覆盖

            app.manage(AppState {
                setting: Mutex::new(initial),
                file_path,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_global_setting,
            broadcast_global_setting
        ])
        .run(tauri::generate_context!())
        .expect("应用程序运行失败");
}
