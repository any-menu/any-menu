/**
 * 文件读写 - json 文件版 & json 配置文件版
 */
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value as Json, json};
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

/// 浅合并 JSON 对象到目标 (对应 ts Object.assign)
fn shallow_merge(target: &mut Json, source: &Json) -> bool {
    match (&mut *target, source) {
        // 都是 Object，进行浅合并：将 source 的所有键值对插入（或覆盖）到 target
        (Json::Object(t), Json::Object(s)) => {
            for (k, v) in s {
                t.insert(k.clone(), v.clone());
            }
        }
        // 不都是 Object（包含数组、字符串、数字等其他类型），直接整体覆盖
        _ => {
            // 如果 source 是空数组，则保持原样，不覆盖
            if let Json::Array(arr) = source {
                if arr.is_empty() {
                    return true;
                }
            }
            // 否则整体覆盖为 source
            *target = source.clone();
        }
    }
    true
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
        read_json_file(&plugins_path),
        read_json_file(&css_vars_path),
    );

    // 2. 获取写锁，合并数据
    let config_lock = CONFIG.get().expect("CONFIG 未初始化");
    {
        let mut guard = config_lock.write().unwrap();
        let app_config = &mut *guard;
        let _r1 = res1.map_or(false, |j| shallow_merge(&mut app_config.config, &j));
        let _r2 = res2.map_or(false, |j| shallow_merge(&mut app_config.config_plugins, &j));
        let _r3 = res3.map_or(false, |j| shallow_merge(&mut app_config.config_css_vars, &j));
    } // 释放写锁

    // 3. 无论如何均重新保存一遍（避免开发过程中新增的选项丢失）
    write_all_json_config(None).await;

    get_all_json_config_internal()
}

/// 从后端获取对应的配置对象 (不重复读)
#[tauri::command]
pub async fn get_all_json_config() -> AppConfig {
    get_all_json_config_internal()
}

/// 写入单个 JSON 文件（带 pretty 格式化）
async fn write_json_file(path: &str, value: &Json) {
    // JSON 转文本 (带特殊规则)
    let content = match value {
        // b1. 对数组类型采用特殊格式化：元素紧凑序列化，每元素独立一行，末尾不加逗号
        serde_json::Value::Array(arr) => {
            let mut s = String::from("[\n");
            for (i, item) in arr.iter().enumerate() {
                let item_str =
                    serde_json::to_string(item).expect("序列化数组元素失败");
                s.push_str(&item_str);
                if i < arr.len() - 1 {
                    s.push_str(",\n");
                }
            }
            s.push_str("\n]");
            s
        }
        // b2. 非数组使用标准 pretty 格式化
        _ => serde_json::to_string_pretty(value).expect("序列化 JSON 失败"),
    };

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
pub async fn write_all_json_config(obj: Option<AppConfig>) -> bool {
    // 1. 准备要写入的数据
    let (config_data, css_vars_data, plugins_data) = if let Some(new_obj) = obj {
        // 有新配置：获取写锁，在原位浅合并，然后克隆数据，释放锁
        let mut guard = CONFIG.get().expect("CONFIG 未初始化").write().unwrap();
        let app = &mut *guard; // 锁会自动释放
        shallow_merge(&mut app.config, &new_obj.config);
        shallow_merge(&mut app.config_css_vars, &new_obj.config_css_vars);
        shallow_merge(&mut app.config_plugins, &new_obj.config_plugins);
        (
            app.config.clone(),
            app.config_css_vars.clone(),
            app.config_plugins.clone(),
        )
    } else {
        // 无新配置：获取读锁，直接克隆（原逻辑）
        let guard = CONFIG.get().expect("CONFIG 未初始化").read().unwrap();
        let app = &*guard; // 锁会自动释放
        (
            app.config.clone(),
            app.config_css_vars.clone(),
            app.config_plugins.clone(),
        )
    };

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

/// 初始化全局配置（应在程序启动时调用一次）
pub fn init_all_json_config() {
    let app_config = default_app_config();
    CONFIG
        .set(RwLock::new(app_config))
        .expect("CONFIG 已经初始化过");
}
// 与前端的 global_setting 部分一致 (方便复制黏贴同步前后端的默认配置)
fn default_app_config() -> AppConfig { AppConfig {
    config: json!({
        "language": "auto",

        "pinyin_index": true,
        "pinyin_first_index": true,
        "search_engine": "reverse",
        "search_limit": 500,

        "server_port": 41667,
        "dict_online_source": "github",
        "config_paths": "./config/",// 在 obsidian 版本中，这里的默认值会是 "./<.obsidian>/plugins/any-menu/config/"
        "dict_paths": "./dict/",    // 在 obsidian 版本中，这里的默认值会是 "./<.obsidian>/plugins/any-menu/dict/"
        "note_paths": "./notes/",   // 通常放置生成结果 (markdown等)，备注个人开发环境常用: "./notes/" or "H:/Git/Private/Group_Note/MdNote_Public/note/"
        "cache_paths": "./cache/",  // 在 obsidian 版本中，这里的默认值会是 "./<.obsidian>/plugins/any-menu/cache/"
        "send_text_method": "clipboard",
        "app_black_list": ["- Obsidian "],
        "app_ad_shortcut": true,

        "toolbar_list": [],
        "context_menu_list": [],
        "auto_show_toolbar_on_select": false,

        "panel_preset2": [
        {
            "key": "Alt+A",
            "list": ["search", "toolbar", "menu"],
            "is_focus": true,
            "position_mode": "cursor",
        },
        {
            "key": "Alt+S",
            "list": ["search", "toolbar"], // ["miniEditor"]
            "is_focus": true,
            "position_mode": "cursor",
        },
        {
            "key": "Alt+D",
            "list": ["info"],
            "is_focus": true,
            "position_mode": "cursor",
        },
        ],
        
        "theme": "default",
        "darkmode": "auto",
    }),
    config_plugins: json!{[]},
    config_css_vars: json!{[
        { "varName":"--am-text-color",        "value":"#1E1E1E", "darkValue":"#f6f6f6", "name":"文本色" },
        { "varName":"--am-bg-color",          "value":"#f6f6f6", "darkValue":"#2f2f2f", "name":"背景色" },
        { "varName":"--am-bd-color",          "value":"#e0e0e0", "darkValue":"#34343f", "name":"边框色" },

        { "varName":"--am-pre-text-color",    "value":"#5c5c5c", "darkValue":"#e3e3e3", "name":"文本框文本色" },
        { "varName":"--am-pre-bg-color",      "value":"#ffffff", "darkValue":"#282828", "name":"文本框背景色" },
        { "varName":"--am-pre-bd-color",      "value":"#e5e5e5", "darkValue":"#383839", "name":"文本框边框色" },
        { "varName":"--am-pre-bg-hlcolor",    "value":"#005eb5", "darkValue":"#0078d7", "name":"文本框边框高亮色" },

        { "varName":"--am-bright-color",      "value":"#23A8F2", "darkValue":"#23A8F2", "name":"文本高亮色" },
        { "varName":"--am-bright-bg-color",   "value":"#4a89dc", "darkValue":"#4a89dc", "name":"背景高亮色" },

        { "varName":"--ab-tab-root-tx-color", "value":"#5c5c5c", "darkValue":"#9e9e9e", "name":"标签栏文本色" },
        { "varName":"--ab-tab-root-bg-color", "value":"#ffffff", "darkValue":"#0d1117", "name":"标签栏背景色" },
        { "varName":"--ab-tab-root-bd-color", "value":"#e0e0e0", "darkValue":"#34343f", "name":"标签栏边框色" },
        { "varName":"--ab-tab-root-hv-color", "value":"#d7d7d7", "darkValue":"#363639", "name":"标签栏悬停色" },

      //{ "varName":"--ab-menu-text-color",   "value":"#000000", "darkValue":"#CCCCCC", "name":"文本色" },
      //{ "varName":"--ab-menu-bg-color",     "value":"#ffffff", "darkValue":"#1B1B1B", "name":"背景色" },
    ]},   
}}
