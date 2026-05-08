use tauri::State;
use uiautomation::{
    UIAutomation,
};

use std::{
    sync::{
        mpsc::{Sender, Receiver},
        Mutex,
    }
};

use crate::uia;

// 定义全局 Sender 类型
pub struct UiaSender(pub Mutex<Sender<UiaMsg>>);

// 消息枚举，根据需求可扩展
pub enum UiaMsg {
    PrintElement,
}

pub fn start_uia_worker(rx: Receiver<UiaMsg>) {
    // 初始化 uiautomation
    let automation = UIAutomation::new().unwrap();
    let walker = automation.get_control_view_walker().unwrap();

    loop {
        match rx.recv() {
            Ok(UiaMsg::PrintElement) => {
                let _ = uia::get_uia_focused(&walker, &automation, 0);
            }
            Err(_) => break,
        }
    }
}

// #region getCursorXY

// 此处可能汇总多处信息来源 & 此处管理 uid sender

// #[tauri::command]
// fn get_cursor_xy() -> Result<Point, String> {}

// #[derive(serde::Serialize)]
// struct Point {
//     x: i32,
//     y: i32,
// }

#[tauri::command]
pub fn get_caret(_app_handle: tauri::AppHandle, _uia_sender: State<UiaSender>) -> (i32, i32, String, String) {
    let (x, y, str, win_name) = get_message();
    return (x, y, str, win_name);
}

#[tauri::command]
pub fn get_caret_debug(_app_handle: tauri::AppHandle, uia_sender: State<UiaSender>) -> (i32, i32, String, String) {
    // uia
    // 向worker线程发消息
    let tx = uia_sender.0.lock().unwrap();
    let _ = tx.send(UiaMsg::PrintElement);
    
    let _ = uia::get_uia_by_windows(); 

    let (x, y, str, win_name) = get_message();
    return (x, y, str, win_name);
}

/// 汇总一些信息
/// 包括: 坐标、选择文本、窗口名等
fn get_message() -> (i32, i32, String, String) {
    let (x, y) = uia::get_win_message();
    let selected_mode: &str = "uia";
    let selected_text: Option<String> = uia::get_selected(selected_mode, Some(true)).ok();
    (x, y, selected_text.unwrap_or("".to_string()), uia::get_uia_by_windows_winname())
}

// #endregion
