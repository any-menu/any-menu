/// 主要提供缓存对象，用于表示目前的状态
/// 
/// 当软件展开面板时，会进行以前操作和信息获取。其中一些时机问题为:
/// 
/// - 某些行动和信息获取，必须在软件面板展开前进行的
///   - 如鼠标、光标、屏幕位置，必须在面板展开前获取，从而确定快速面板需要显示的范围
///   - 通常是快速操作
///   - 能够不阻塞地立即返回
/// - 某些行为和信息获取，可能在软件面板展开后进行的
///   - 如通过剪切板获取到的当前复制内容、剪切板信息的获取
///   - 通常是耗时操作，避免其耗时影响面板展开的速度，造成延时导致用户体验下降，否则没必要延后更新
///   - 由于无法立即返回，当更新时，通常还会伴随一个时间通知。
///     其中，后通知的超时通常为500ms，超过这个时间可以认为不会再有动态更新
/// 
/// 总结就是: 该对象会发生不止一次的更新，通常是一次在面板展开前，一次或以上的在面板展开后的耗时操作

use once_cell::sync::Lazy;
use std::sync::{Mutex};
use tauri::Emitter;
use serde_json::json;

// 缓存结构
#[derive(Debug, Clone)]
pub struct AMState {
    // 两个selectedText，需要区分是没有选中文本还是获取失败、以及先清空再延时获取时的等待状态，所以不用Option
    pub selected_text_by_clipboard: Result<String, String>,
    pub selected_html_by_clipboard: Result<String, String>,
    pub selected_text_by_uia: Result<String, String>,

    pub app_handle: Option<tauri::AppHandle>,
}
impl Default for AMState {
    fn default() -> Self {
        Self {
            selected_text_by_clipboard: Err("init".to_string()),    // 初始化状态
            selected_html_by_clipboard: Err("init".to_string()),    // 初始化状态
            selected_text_by_uia: Err("init".to_string()),          // 初始化状态
            app_handle: None,
        }
    }
}
impl AMState {
    /// 一般来说，仅异步更新需要调用此方法。同步更新的话，通常以函数返回值时的方式更新
    pub fn update(&self) {
        if let Some(app_handle) = &self.app_handle {
            // create a JSON payload for the event
            let payload = json!({
                "selected_text_by_clipboard": self.selected_text_by_clipboard.clone().ok(),
                "selected_html_by_clipboard": self.selected_html_by_clipboard.clone().ok(),
                "selected_text_by_uia": self.selected_text_by_uia.clone().ok(),
            });
            app_handle.emit("active-window-toggle", payload).unwrap();
        }
    }
}

// 缓存对象
pub static AM_STATE: Lazy<Mutex<AMState>> = Lazy::new(|| Mutex::new(AMState::default()));

// 旧
// use once_cell::sync::Lazy;
// use std::sync::{Mutex};
// 
// // 缓存选中文本的结果
// pub static CLIPBOARD_CACHE: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));
// pub static UIA_CACHE: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));
