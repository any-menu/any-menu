/**
 * 文件读取 - 配置文件版
 * 
 * 类似于 file.rs，但针对于配置文件再做了层封装
 * (当然，为了应对配置文件路径的修改，path 是参数)
 * 
 * demo:
 * - 读取toml
 * - 然后像修改 object 那样任意修改内容 (增删查改字段)
 * - 最后保存回 toml 文件 (且必须保留注释)
 * 
 * 注意:
 * 该模块来源于 GPT-5.2 + review 修改
 */

use std::{fs, path::PathBuf};

use serde_json::Value as Json;
use toml_edit::{Array, ArrayOfTables, DocumentMut, Item, Table, Value};

#[tauri::command]
fn config_read_raw(path: &str) -> Result<String, String> {
    config_ensure_file(&path)?;
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn config_read_to_json(path: &str) -> Result<Json, String> {
    let raw = config_read_raw(path)?;
    // 先用 toml_edit::DocumentMut 解析
    let doc = raw.parse::<DocumentMut>().map_err(|e| e.to_string())?;
    // 然后转 JSON 返回
    Ok(item_to_json(doc.as_item()))
}

/// 前端传入“最终 object”（任意增删改字段），后端合并到原 TOML，并写回（保留注释）
#[tauri::command]
pub fn config_write_from_json(path: &str, new_json: Json) -> Result<(), String> {
    config_ensure_file(&path)?;
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut doc = raw.parse::<DocumentMut>().map_err(|e| e.to_string())?;

    merge_item_with_json(doc.as_item_mut(), &new_json)?;

    fs::write(&path, doc.to_string()).map_err(|e| e.to_string())?;
    Ok(())
}

/// json -> toml (保留原 toml 注释)
/// 核心：合并逻辑（尽量“原地改”，从而保留注释/格式）
/// @author GPT-5.2
fn merge_item_with_json(item: &mut Item, json: &Json) -> Result<(), String> {
    match json {
        Json::Object(map) => {
            // 目标是 table
            let table = ensure_table(item);

            // 1) 删除：TOML 有但 JSON 没有的 key
            let existing_keys: Vec<String> = table.iter().map(|(k, _)| k.to_string()).collect();
            for k in existing_keys {
                if !map.contains_key(&k) {
                    table.remove(&k);
                }
            }

            // 2) 更新/新增
            for (k, v) in map {
                if v.is_null() {
                    // 用 null 表示“删除字段”
                    table.remove(k);
                    continue;
                }

                let entry = table.entry(k).or_insert(Item::None);

                match v {
                    Json::Object(_) => {
                        // 确保是 table，然后递归 merge
                        if !entry.is_table() {
                            *entry = Item::Table(Table::new());
                        }
                        merge_item_with_json(entry, v)?;
                    }
                    Json::Array(_) => {
                        // 直接覆盖为 array（数组内部注释通常难保留；但这是最简单实现）
                        *entry = json_to_item(v)?;
                    }
                    _ => {
                        // 标量直接覆盖
                        *entry = json_to_item(v)?;
                    }
                }
            }
            Ok(())
        }
        _ => Err("root must be a JSON object".into()),
    }
}

fn ensure_table(item: &mut Item) -> &mut Table {
    if !item.is_table() {
        *item = Item::Table(Table::new());
    }
    item.as_table_mut().unwrap()
}

/// json -> toml (toml_edit::Item) 转换（最小 demo 版本）
fn json_to_item(json: &Json) -> Result<Item, String> {
    match json {
        Json::Null => Err("TOML has no null; use null only as 'delete' marker".into()),
        Json::Bool(b) => Ok(Item::Value(Value::from(*b))),
        Json::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(Item::Value(Value::from(i)))
            } else if let Some(f) = n.as_f64() {
                Ok(Item::Value(Value::from(f)))
            } else {
                Err("unsupported number".into())
            }
        }
        Json::String(s) => Ok(Item::Value(Value::from(s.as_str()))),
        Json::Array(arr) => {
            // 检查数组是否包含对象
            let has_objects = arr.iter().any(|v| v.is_object());
            
            if has_objects {
                // 如果是对象数组，则转换为 TOML 的 ArrayOfTables ([[...]])
                let mut aot = ArrayOfTables::new();
                for v in arr {
                    if let Json::Object(map) = v {
                        let mut t = Table::new();
                        for (k, val) in map {
                            if !val.is_null() {
                                t.insert(k, json_to_item(val)?);
                            }
                        }
                        aot.push(t);
                    } else {
                        return Err("TOML does not support mixed arrays of objects and scalars".into());
                    }
                }
                Ok(Item::ArrayOfTables(aot))
            } else {
                // 普通标量数组 (如 [1, 2, 3] 或 ["a", "b"])
                let mut a = Array::new();
                for v in arr {
                    let tv = json_to_value(v)?;
                    a.push(tv);
                }
                Ok(Item::Value(Value::Array(a)))
            }
        }
        Json::Object(map) => {
            let mut t = Table::new();
            for (k, v) in map {
                if v.is_null() {
                    continue;
                }
                t.insert(k, json_to_item(v)?);
            }
            Ok(Item::Table(t))
        }
    }
}

/// json -> value
fn json_to_value(json: &Json) -> Result<Value, String> {
    match json {
        Json::Null => Err("TOML has no null".into()),
        Json::Bool(b) => Ok(Value::from(*b)),
        Json::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(Value::from(i))
            } else if let Some(f) = n.as_f64() {
                Ok(Value::from(f))
            } else {
                Err("unsupported number".into())
            }
        }
        Json::String(s) => Ok(Value::from(s.as_str())),
        Json::Array(arr) => {
            let mut a = Array::new();
            for v in arr {
                a.push(json_to_value(v)?);
            }
            Ok(Value::Array(a))
        }
        Json::Object(_) => Err(
            "array element cannot be object in this minimal demo. Use tables / array-of-tables instead."
                .into(),
        ),
    }
}

/// toml -> json
fn item_to_json(item: &Item) -> Json {
    match item {
        Item::None => Json::Null,
        Item::Value(v) => value_to_json(v),
        Item::Table(t) => {
            let mut obj = serde_json::Map::new();
            for (k, v) in t.iter() {
                obj.insert(k.to_string(), item_to_json(v));
            }
            Json::Object(obj)
        }
        Item::ArrayOfTables(aot) => {
            // [[x]] -> JSON array of objects
            let arr = aot
                .iter()
                .map(|t| {
                    let mut obj = serde_json::Map::new();
                    for (k, v) in t.iter() {
                        obj.insert(k.to_string(), item_to_json(v));
                    }
                    Json::Object(obj)
                })
                .collect::<Vec<_>>();
            Json::Array(arr)
        }
    }
}

/// value -> json
fn value_to_json(v: &Value) -> Json {
    match v {
        Value::String(s) => Json::String(s.value().to_string()),
        Value::Integer(i) => Json::Number((*i.value()).into()),
        Value::Float(f) => Json::Number(serde_json::Number::from_f64(*f.value()).unwrap()),
        Value::Boolean(b) => Json::Bool(*b.value()),
        Value::Datetime(dt) => Json::String(dt.value().to_string()),
        Value::Array(a) => Json::Array(a.iter().map(value_to_json).collect()),
        Value::InlineTable(it) => {
            // 最小 demo：inline table 转 object
            let mut obj = serde_json::Map::new();
            for (k, v) in it.iter() {
                obj.insert(k.to_string(), value_to_json(v));
            }
            Json::Object(obj)
        }
    }
}

// 文件路径与默认内容 (相对路径转绝对路径)
// fn config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
//     let dir = app
//         .path()
//         .app_config_dir()
//         .map_err(|e| e.to_string())?;
//     let _ = fs::create_dir_all(&dir);
//     Ok(dir.join("app.toml"))
// }

/// 保证配置文件和内容存在
fn config_ensure_file(path: &str) -> Result<(), String> {
    if PathBuf::from(path).exists() {
        return Ok(());
    }
    let default_toml = r#"
[config]
language = "English"        # 语言 'auto'|'English'|'中文'|string

pinyin_index = true         # 是否为中文key自动构建拼音索引
pinyin_first_index = true   # 是否为中文key自动构建拼音首字母索引
# 搜索引擎类型，'reverse'|'trie' (模糊匹配/倒序 | 前缀树)
search_engine = "reverse"
# 查询结果的首页显示数
# 对于模糊匹配引擎: 是显示数，目前不影响搜索引擎的查询数量，即只影响渲染
# 对于前缀树引擎: 是查询数
# 暂时以滚动形式显示，不支持类似输入法的通过 '方括号' 翻页，否则这个数量可以限制更多
search_limit = 500

#  发送文本的方式。
# 'keyboard'|'clipboard'|'auto'
# enigo/keyboard为模拟键盘输入，clipboard为复制到剪贴板,
# 建议为 clipboard (或 auto，auto根据文本长度和是否有换行符决定)
# 'keyboard' 好处是快，适合明确的短文本，缺点是不适合复杂情况或未知情况，例如:
# - 被字符转义: QQ等环境，当把一个 emoji 拆成两字符输出，然后被转义成两个用于表示未知的字符，如 '😀' -> '��'
# - 输出长文本后难以撤销: 撤销操作会分多次运行，具体示编辑器的一些刷新机制或优化有关 (vscode等通常按字符，ob等按单词撤回)
# - 受自动补全和缩进影响: 如输出emoji中，由于经常包含括号和双引号等符号，可能被自动补全成一对。又如自动换行，可能会被自动缩进，导致重复缩进
# 仅当你清楚以上情况，总是输出短语时，才建议使用 keyboard
# 
# TODO: 后续是否有可能不同的字典/词表用不同的发送方式? 例如有些词表用来表示按键操作组
# 
send_text_method = "clipboard"
# 在线词库来源 'gitee'|'github'
dict_online_source = "gitee"
# 词库路径列表。在debug模式下不使用这个路径，而是硬编码
dict_paths = "./dict/"
# 记录笔记的基础路径
note_paths = "./notes/"

# app版选项 (插件版不支持)
# app黑名单，其中 'obsidian' 主要针对同时安装anymenu ob插件版和app版的情况。ob进黑名单则插件优先 (推荐)，否则app版优先
app_black_list = ["- Obsidian v"]
# app是否使用高级快捷键
app_ad_shortcut = true

# 工具栏列表。可控制显示是否显示与显示顺序，为空则默认全显示
toolbar_list = []
# 多级菜单列表。细节同上
context_menu_list = []
"#;
    fs::write(path, default_toml).map_err(|e| e.to_string())
}

/*
// 前端 demo

import { invoke } from "@tauri-apps/api/core";

export async function demo() {
  // 1) 读成 object
  const obj = (await invoke("config_read_to_json")) as any;

  // 2) 像改普通 JS object 一样随便改（增删查改）
  obj.title = "Changed Title";
  obj.window.width = 1024;

  // 新增字段
  obj.newSection = { enabled: true, name: "hello" };

  // 新增数组
  obj.tags = ["a", "b", "c"];

  // 删除字段：用 null 表示删除（对应后端 merge 的约定）
  obj.version = null;

  // 3) 写回（保留注释）
  await invoke("config_write_from_json", { newJson: obj });

  // 你也可以再读 raw 看注释是否还在
  const raw = (await invoke("read_toml_raw")) as string;
  console.log(raw);
}
*/
