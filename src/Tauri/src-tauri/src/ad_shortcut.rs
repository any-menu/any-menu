/** 高级快捷键
 * 
 * 常规的系统级快捷键使用 Tauri 的快捷键插件即可，但非系统级快捷键要自己处理
 * 
 * ## 一些bug问题 - Shift+LeftArrow为例:
 * 
 * ```rust
 * # rdev::simulate 的版本存在问题
 * # simulate() 发出按键后，在按键按下前会自动松开Shift键，松开对应键后再自动按回Shift键。导致Shift键环境丢失
 * # 感觉 rdev 没有设计成能很好地支持快捷键
 * let _ = simulate(&EventType::KeyPress(Key::ShiftLeft));
 * let _ = simulate(&EventType::KeyPress(Key::LeftArrow));
 * let _ = simulate(&EventType::KeyRelease(Key::LeftArrow));
 * let _ = simulate(&EventType::KeyRelease(Key::ShiftLeft));
 * ```
 *
 * ```rust
 * #enigo.key 的版本正常，不区分左右Ctrl/Shift
 * let mut enigo = Enigo::new(&Settings::default()).unwrap();
 * let _ = enigo.key(enigo::Key::Shift, Press);
 * let _ = enigo.key(enigo::Key::LeftArrow, Click);
 * let _ = enigo.key(enigo::Key::Shift, Release);
 * ```
 */

use rdev::{
    grab, listen, simulate, Event, EventType, Key
};
use enigo::{
    Direction::{Click, Press, Release}, Enigo, Keyboard, Mouse, Settings
};
use std::{cell::Cell, sync::{Arc, Mutex}, thread, time::{self, Instant}};
use tauri::Emitter;

use crate::{text, uia};

/** 无法拦截原行为，会阻塞
 * 
 * @deprecated 旧版，由于无法拦截原行为，弃用
 */
pub fn _init_ad_shortcut() {
    let mut caps_active = false;  // 是否激活 Caps 层
    let mut caps_pressed = false; // 是否阻止 CapsLock 原行为

    listen(move |event: Event| {
        match event.event_type {
            EventType::KeyPress(Key::CapsLock) => {
                caps_active = true;
                caps_pressed = true;
            },
            EventType::KeyRelease(Key::CapsLock) => {
                caps_active = false;
                caps_pressed = false;
            },
            EventType::KeyPress(Key::Escape) if caps_pressed => {
                // simulate_keypress(Key::CapsLock); // 模拟 CapsLock 按键（按下和弹起）
            },
            EventType::KeyPress(Key::KeyF) if caps_active => {
                println!("Caps+F detected!");
                // 这里可以用 tauri::api::process::Command 或 tauri::window.emit 通知前端
            }
            _ => {}
        }
    }).unwrap();
}

/** 可以拦截原行为，会阻塞。该函数会在一个独立的线程中被执行sdfs
 * 
 * 一些机制: 
 * - KeyPress 会在长按时一直触发, 直到按下下一个键, 上一个键就不再一直触发 (哪怕还按着)
 */
pub fn init_ad_shortcut(app_handle: tauri::AppHandle) {
    // 变量 - 线程安全
    let state = Arc::new(LayerState::new());
    let enigo_instance = Arc::new(Mutex::new(
        Enigo::new(&Settings::default()).expect("Failed to create Enigo instance")
    ));

    // 注意: 这是一个 Fn (非FnMut/FnOnce) 闭包，可以多次且并发调用。不过目前这里并不需要并发
    // 所以这里的 caps_active 要改成 Cell 类型以确保并发安全
    let callback = move |event: Event| -> Option<Event> {
        // 不处理非按键事件 (鼠标 滚动 按钮等)
        match event.event_type {
            EventType::KeyPress(_) => {} // println!("KeyDown {:?}", key);
            EventType::KeyRelease(_) => {}
            _ => { return Some(event) }
        }

        // (虚拟层)
        // 避免捕获自身模拟的虚拟按键
        if state.virtual_event_flag.get() {
            return Some(event)
        }

        let mut enigo = enigo_instance.lock().unwrap();

        // 默认层 内部，主要是其他层的进出
        match layer_default_caps(&event.event_type, &state, &mut enigo) {
            HandlerResult::Allow => return Some(event),
            HandlerResult::Block => return None,
            HandlerResult::Pass => {}
        };
        match layer_default_sign(&event.event_type, &state) {
            HandlerResult::Allow => return Some(event),
            HandlerResult::Block => return None,
            HandlerResult::Pass => {}
        };
        // match layer_default_space(&event.event_type, &state) {
        //     HandlerResult::Allow => return Some(event),
        //     HandlerResult::Block => return None,
        //     HandlerResult::Pass => {}
        // };
        match layer_default_shift_r(&event.event_type, &state) {
            HandlerResult::Allow => return Some(event),
            HandlerResult::Block => return None,
            HandlerResult::Pass => {}
        };

        // Caps 及其 子层 的内部
        // Caps+C+* 鼠标层 内部
        match layer_caps_curosr(&event.event_type, &state, &mut enigo) {
            HandlerResult::Allow => return Some(event),
            HandlerResult::Block => return None,
            HandlerResult::Pass => {}
        };
        // Caps+* 光标层 内部
        match layer_caps(&event.event_type, &state, &mut enigo, &app_handle) {
            HandlerResult::Allow => return Some(event),
            HandlerResult::Block => return None,
            HandlerResult::Pass => {}
        };

        // "+* 符号层 内部
        match layer_sign(&event.event_type, &state, &mut enigo) {
            HandlerResult::Allow => return Some(event),
            HandlerResult::Block => return None,
            HandlerResult::Pass => {}
        };

        // space+* 编辑器层 内部 (弃用)
        // match _layer_space(&event.event_type, &state, &mut enigo, &app_handle) {
        //     HandlerResult::Allow => return Some(event),
        //     HandlerResult::Block => return None,
        //     HandlerResult::Pass => {}
        // };

        // RShift+* 编辑器/Ctrl层 内部
        match layer_shift_r(&event.event_type, &state, &mut enigo, &app_handle) {
            HandlerResult::Allow => return Some(event),
            HandlerResult::Block => return None,
            HandlerResult::Pass => {}
        };

        Some(event)
    };
    if let Err(error) = grab(callback) {
        println!("Error: {:?}", error)
    }
}

// ========== 状态管理结构体 ==========

/** 键盘层状态 */
struct LayerState {
    caps_active: Cell<bool>,                // 是否激活 Caps 层
    caps_active_used: Cell<bool>,           //     是否使用过^该层
    caps_cursor_active: Cell<bool>,         // 是否激活 Caps_cursor 层
    caps_cursor_active_used: Cell<bool>,    //     是否使用过^该层
    sign_active: Cell<bool>,                // 是否激活 符号层
    sign_active_used: Cell<bool>,           //     是否使用过^该层
    _space_active: Cell<bool>,              // 是否激活 空格层
    _space_active_used: Cell<bool>,         //     是否使用过^该层
    _space_active_time: Cell<Option<Instant>>, // ^该层激活的开启时间
    shift_r_active: Cell<bool>,             // 是否激活 右Shift层
    shift_r_active_used: Cell<bool>,        //     是否使用过^该层

    virtual_event_flag: Cell<bool>,         // 跳过虚拟行为，避免递归 (可以看作是 "虚拟层")
}
impl LayerState {
    fn new() -> Self {
        Self {
            caps_active: Cell::new(false),
            caps_active_used: Cell::new(false),
            caps_cursor_active: Cell::new(false),
            caps_cursor_active_used: Cell::new(false),
            sign_active: Cell::new(false),
            sign_active_used: Cell::new(false),
            _space_active: Cell::new(false),
            _space_active_used: Cell::new(false),
            _space_active_time: Cell::new(None),
            shift_r_active: Cell::new(false),
            shift_r_active_used: Cell::new(false),
            virtual_event_flag: Cell::new(false),
        }
    }

    // 为什么要定义这个函数: Caps+C后，无论先松Caps还是先松C，都应视为退出光标层
    pub fn caps_cursor_quit(
        &self,
        enigo: &mut Enigo,
    ) {
        if !self.caps_cursor_active.get() { return }
        if !self.caps_cursor_active_used.get() { // 没用过，则单击
            let _ = enigo.button(enigo::Button::Left, Click);
        }
        self.caps_cursor_active_used.set(false);
        self.caps_cursor_active.set(false);
    }
}

/// 明确三种责任链 (规则链) 返回语义
enum HandlerResult {
    Allow, // 允许原事件继续传播 -> callback 返回 Some(event)
    Block, // 阻止原事件传播 -> callback 返回 None
    Pass,  // 不在这里处理，继续分发给后续逻辑
}

// #region 默认层 内部

/// Caps 光标层 进出
fn layer_default_caps(
    event_type: &EventType,
    state: &LayerState,
    enigo: &mut Enigo,
) -> HandlerResult {
    match event_type {
        EventType::KeyPress(Key::CapsLock) => {
            state.caps_active.set(true);
            state.caps_active_used.set(false);
            HandlerResult::Block // 禁用原行为
        }
        EventType::KeyRelease(Key::CapsLock) => {
            if !state.caps_active_used.get() { // 没用过，恢复原行为
                state.virtual_event_flag.set(true);
                let _ = simulate(&EventType::KeyRelease(Key::CapsLock));
                thread::sleep(time::Duration::from_millis(10));
                let _ = simulate(&EventType::KeyPress(Key::CapsLock));
                state.virtual_event_flag.set(false);
            }
            state.caps_cursor_quit(enigo); // 退出所有子层
            state.caps_active_used.set(false);
            state.caps_active.set(false);
            HandlerResult::Allow
        }
        _ => HandlerResult::Pass
    }
}

/// "+* 符号层 进出
fn layer_default_sign(
    event_type: &EventType,
    state: &LayerState,
) -> HandlerResult {
    match event_type {
        EventType::KeyPress(Key::Quote) => {
            state.sign_active.set(true);
            state.sign_active_used.set(false);
            HandlerResult::Block // 禁用原行为
        }
        EventType::KeyRelease(Key::Quote) => {
            if !state.sign_active_used.get() { // 没用过，恢复原行为
                state.virtual_event_flag.set(true);
                let _ = simulate(&EventType::KeyRelease(Key::Quote));
                thread::sleep(time::Duration::from_millis(10));
                let _ = simulate(&EventType::KeyPress(Key::Quote));
                state.virtual_event_flag.set(false);
            }
            state.sign_active_used.set(false);
            state.sign_active.set(false);
            HandlerResult::Allow
        }
        _ => HandlerResult::Pass
    }
}

/// Space 编辑器层 进出
fn _layer_default_space(
    event_type: &EventType,
    state: &LayerState,
) -> HandlerResult {
    match event_type {
        EventType::KeyPress(Key::Space) => {
            if !state._space_active.get() { // 避免长按空格频繁更新时间
                state._space_active.set(true);
                state._space_active_used.set(false);
                state._space_active_time.set(Some(Instant::now()));
            }
            // 长按则恢复持续点击的行为
            let over_time: bool = state._space_active_time.get().map_or(false, |start_time| {
                start_time.elapsed() > time::Duration::from_millis(500)
            });
            if over_time {
                return HandlerResult::Allow
            }
            HandlerResult::Block // 禁用原行为
        }
        EventType::KeyRelease(Key::Space) => {
            if !state._space_active_used.get() { // 没用过，恢复原行为
                state.virtual_event_flag.set(true);
                let _ = simulate(&EventType::KeyRelease(Key::Space));
                thread::sleep(time::Duration::from_millis(10));
                let _ = simulate(&EventType::KeyPress(Key::Space));
                state.virtual_event_flag.set(false);
            }
            state._space_active_used.set(false);
            state._space_active.set(false);
            HandlerResult::Allow
        }
        _ => HandlerResult::Pass
    }
}

/// RShift 编辑器/Ctrl层 进出
fn layer_default_shift_r(
    event_type: &EventType,
    state: &LayerState,
) -> HandlerResult {
    match event_type {
        EventType::KeyPress(Key::ShiftRight) => {
            state.shift_r_active.set(true);
            state.shift_r_active_used.set(false);
            HandlerResult::Block // 禁用原行为
        }
        EventType::KeyRelease(Key::ShiftRight) => {
             if !state.shift_r_active_used.get() { // 没用过，恢复原行为
                state.virtual_event_flag.set(true);
                let _ = simulate(&EventType::KeyRelease(Key::ShiftRight));
                thread::sleep(time::Duration::from_millis(10));
                let _ = simulate(&EventType::KeyPress(Key::ShiftRight));
                state.virtual_event_flag.set(false);
            }
            state.shift_r_active_used.set(false);
            state.shift_r_active.set(false);
            HandlerResult::Allow
        }
        _ => HandlerResult::Pass
    }
}

// #endregion

/// Caps+C+* 鼠标层 内部
fn layer_caps_curosr(
    event_type: &EventType,
    state: &LayerState,
    enigo: &mut Enigo,
) -> HandlerResult {
    if !state.caps_active.get() || !state.caps_cursor_active.get() {
        return HandlerResult::Pass
    }

    if let EventType::KeyPress(_) = event_type { // 按下过
        state.caps_cursor_active_used.set(true);
    }

    const MOUSE_STEP: i32 = 18; // 可按需调整
    const MOUSE_STEP2: i32 = 200; // 可按需调整
    // TODO 点击后 "程序聚焦" 层改变，导致事件监听失效
    // TODO 点击不应该用I/O，因为可能存在拖拽操作
    match event_type {
        EventType::KeyPress(Key::KeyI) => {
            let _ = enigo.button(enigo::Button::Left, Click);
            state.caps_active.set(false); // 在解决这个bug之前，这里会强制松开Caps层
            state.caps_cursor_active.set(false);
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyO) => {
            let _ = enigo.button(enigo::Button::Right, Click);
            state.caps_active.set(false); // 在解决这个bug之前，这里会强制松开Caps层
            state.caps_cursor_active.set(false);
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyU) => {
            let _ = enigo.move_mouse(0, -MOUSE_STEP, enigo::Coordinate::Rel); return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyJ) => {
            let _ = enigo.move_mouse(-MOUSE_STEP, 0, enigo::Coordinate::Rel); return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyK) => {
            let _ = enigo.move_mouse(0, MOUSE_STEP, enigo::Coordinate::Rel); return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyL) => {
            let _ = enigo.move_mouse(MOUSE_STEP, 0, enigo::Coordinate::Rel); return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyH) => {
            let _ = enigo.move_mouse(-MOUSE_STEP2, 0, enigo::Coordinate::Rel); return HandlerResult::Block
        },
        EventType::KeyPress(Key::SemiColon) => {
            let _ = enigo.move_mouse(MOUSE_STEP2, 0, enigo::Coordinate::Rel); return HandlerResult::Block
        },
        EventType::KeyPress(Key::Num7) | EventType::KeyPress(Key::KeyY) => {
            let _ = enigo.move_mouse(0, -MOUSE_STEP2, enigo::Coordinate::Rel); return HandlerResult::Block
        },
        EventType::KeyPress(Key::Comma) => {
            let _ = enigo.move_mouse(0, MOUSE_STEP2, enigo::Coordinate::Rel); return HandlerResult::Block
        },
        _ => { return HandlerResult::Pass }
    }
}

/// Caps+* 光标层 内部
fn layer_caps(
    event_type: &EventType,
    state: &LayerState,
    enigo: &mut Enigo,
    app_handle: &tauri::AppHandle,
) -> HandlerResult {
    if !state.caps_active.get() { return HandlerResult::Pass }

    if let EventType::KeyPress(_) = event_type { // 按下过
        state.caps_active_used.set(true);
    }

    match event_type {
        // Caps+C+* 鼠标层 进出
        EventType::KeyPress(Key::KeyC) => {
            state.caps_cursor_active.set(true);
            state.caps_cursor_active_used.set(false);
            return HandlerResult::Block
        },
        EventType::KeyRelease(Key::KeyC) => {
            state.caps_cursor_quit(enigo);
            return HandlerResult::Allow
        },
        EventType::KeyPress(Key::KeyB) => {
            // 临时连续点击
            state.virtual_event_flag.set(true);
            let _ = enigo.button(enigo::Button::Left, Click);
            state.virtual_event_flag.set(false);
            let delay = time::Duration::from_millis(100);
            thread::sleep(delay);
            return HandlerResult::Block
        },
        EventType::KeyRelease(Key::KeyB) => {
            return HandlerResult::Allow
        },
        // Caps+Esc, 伪造 CapsLock 按下和释放事件，来切换大小写
        EventType::KeyPress(Key::Escape) => {
            state.virtual_event_flag.set(true);
            simu_key(enigo, &state, enigo::Key::CapsLock, Press);
            simu_key(enigo, &state, enigo::Key::CapsLock, Release);
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyI) => { simu_key(enigo, &state, enigo::Key::Backspace, Click); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyO) => { simu_key(enigo, &state, enigo::Key::Delete, Click); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyP) => {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::Z, Click); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::LeftBracket) => {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::Shift, Press); simu_key(enigo, &state, enigo::Key::Z, Click);
            simu_key(enigo, &state, enigo::Key::Shift, Release); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyU) => { simu_key(enigo, &state, enigo::Key::UpArrow, Click); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyJ) => { simu_key(enigo, &state, enigo::Key::LeftArrow, Click); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyK) => { simu_key(enigo, &state, enigo::Key::DownArrow, Click); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyL) => { simu_key(enigo, &state, enigo::Key::RightArrow, Click); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyH) => { simu_key(enigo, &state, enigo::Key::Home, Click); return HandlerResult::Block },
        EventType::KeyPress(Key::SemiColon) => { simu_key(enigo, &state, enigo::Key::End, Click); return HandlerResult::Block },
        EventType::KeyPress(Key::Num7) | EventType::KeyPress(Key::KeyY) => {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::Home, Click); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::Comma) => {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::End, Click); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::Space) => { simu_key(enigo, &state, enigo::Key::Return, Click); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyD) | EventType::KeyPress(Key::KeyG) => {
            // TODO 长按层
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::LeftArrow, Click);
            let delay = time::Duration::from_millis(30); thread::sleep(delay); // 等光标到左侧
            simu_key(enigo, &state, enigo::Key::Shift, Press); simu_key(enigo, &state, enigo::Key::RightArrow, Click); simu_key(enigo, &state, enigo::Key::Shift, Release); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyF) => {
            // TODO 长按层
            simu_key(enigo, &state, enigo::Key::Home, Click);
            let delay = time::Duration::from_millis(30); thread::sleep(delay); // 等光标到左侧
            simu_key(enigo, &state, enigo::Key::Shift, Press); simu_key(enigo, &state, enigo::Key::End, Click); simu_key(enigo, &state, enigo::Key::Shift, Release);
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::KeyN) | EventType::KeyPress(Key::KeyM) => {
            // 有bug: 这里会通知前端，召唤出窗口。但窗口召唤后这里的按键监听会失效，并且鼠标无法移动，疑似卡死
            // 但可以按 Esc 退出窗口，并再单击一下 Caps 键。能恢复正常
            // 
            // 问题定位: Caps 激活状态阻止了一些事件。而在新窗口中松开 Caps 无效，返回原状态后依然视为 Caps 激活态。
            // 此时要按一下 Caps 恢复正常
            // 
            // 需要解决: 最好是能在通知前端并弹出新窗口后，依然能继续监听到事件。从而捕获在那之后的各种按键。包括 Caps 松开
            // 
            // 在解决这个bug之前，这里会强制松开Caps层
            app_handle.emit("active-window-toggle", ()).unwrap();
            state.caps_active.set(false); // 在解决这个bug之前，这里会强制松开Caps层
            return HandlerResult::Block
        },
        EventType::KeyPress(Key::ShiftLeft) | EventType::KeyPress(Key::ShiftRight) |
        EventType::KeyPress(Key::ControlLeft) | EventType::KeyPress(Key::ControlRight) => {
            return HandlerResult::Allow
        }
        EventType::KeyPress(_) => { return HandlerResult::Block }, // 未分配则禁止按下，允许其他 // 弃用，要允许Shift
        _ => { return HandlerResult::Allow }
    }
}

/// "+* 符号层 内部
fn layer_sign(
    event_type: &EventType,
    state: &LayerState,
    enigo: &mut Enigo,
) -> HandlerResult {
    if !state.sign_active.get() { return HandlerResult::Pass }

    if let EventType::KeyPress(_) = event_type { // 按下过
        state.sign_active_used.set(true)
    }

    // 输出成对符号
    let simu_sign_part = |enigo: &mut Enigo, sign_l: &'static str, sign_r: &'static str, sign_l_move| {
        let selected_text: String = uia::get_uia_by_windows_selected();
        if selected_text.is_empty() {
            state.virtual_event_flag.set(true);
            let _ = text::send(&(sign_l.to_string() + sign_r), "clipboard");
            let delay = time::Duration::from_millis(50); thread::sleep(delay); // 等待光标位置更新
            for _ in 0..sign_l_move {
                simu_key(enigo, &state, enigo::Key::LeftArrow, Click);
            }
            state.virtual_event_flag.set(false);
        } else {
            state.virtual_event_flag.set(true);
            let _ = text::send(&(sign_l.to_string() + &selected_text + sign_r), "clipboard");
            state.virtual_event_flag.set(false);
        };
    };

    match event_type {
        // 左半区
        EventType::KeyPress(Key::KeyQ) => { simu_text(enigo, &state, "！"); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyW) => { simu_text(enigo, &state, "？"); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyS) => { simu_text(enigo, &state, "……"); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyD) => { simu_text(enigo, &state, "、"); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyF) => { simu_text(enigo, &state, "，"); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyG) => { simu_text(enigo, &state, "。"); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyV) => { simu_text(enigo, &state, "——"); return HandlerResult::Block },
        // 右半区
        EventType::KeyPress(Key::KeyY) => { simu_sign_part(enigo, "“", "”", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyU) => { simu_sign_part(enigo, "\"", "\"", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyI) => { simu_sign_part(enigo, "'", "'", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyO) => { simu_sign_part(enigo, "`", "`", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyP) => { simu_sign_part(enigo, "```\n", "\n```", 4); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyH) => { simu_sign_part(enigo, "【", "】", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyJ) => { simu_sign_part(enigo, "(", ")", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyK) => { simu_sign_part(enigo, "[", "]", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyL) => { simu_sign_part(enigo, "{", "}", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyN) => { simu_sign_part(enigo, "「", "」", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::KeyM) => { simu_sign_part(enigo, "/* ", " */", 3); return HandlerResult::Block },
        EventType::KeyPress(Key::Comma) => { simu_sign_part(enigo, "<", ">", 1); return HandlerResult::Block },
        EventType::KeyPress(Key::Dot) => { simu_sign_part(enigo, "《", "》", 1); return HandlerResult::Block },
        // 未分配则禁止按下，允许其他
        EventType::KeyPress(_) => { return HandlerResult::Block },
        _ => { return HandlerResult::Allow }
    }
}

/// Space+* 编辑器层 内部
fn _layer_space(
    event_type: &EventType,
    state: &LayerState,
    enigo: &mut Enigo,
    app_handle: &tauri::AppHandle,
) -> HandlerResult {
    if !state._space_active.get() { return HandlerResult::Pass }

    if let EventType::KeyPress(_) = event_type { // 按下过
        state._space_active_used.set(true)
    }

    match event_type {
        EventType::KeyPress(Key::KeyI) => {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::Z, Click); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        }
        EventType::KeyPress(Key::KeyO) => {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::Shift, Press); simu_key(enigo, &state, enigo::Key::Z, Click);
            simu_key(enigo, &state, enigo::Key::Shift, Release); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        }
        EventType::KeyPress(Key::KeyN) | EventType::KeyPress(Key::KeyM) => {
            // 有bug: 这里会通知前端，召唤出窗口。但窗口召唤后这里的按键监听会失效，并且鼠标无法移动，疑似卡死
            // 但可以按 Esc 退出窗口，并再单击一下 Caps 键。能恢复正常
            // 
            // 问题定位: Caps 激活状态阻止了一些事件。而在新窗口中松开 Caps 无效，返回原状态后依然视为 Caps 激活态。
            // 此时要按一下 Caps 恢复正常
            // 
            // 需要解决: 最好是能在通知前端并弹出新窗口后，依然能继续监听到事件。从而捕获在那之后的各种按键。包括 Caps 松开
            // 
            // 在解决这个bug之前，这里会强制松开Caps层
            app_handle.emit("active-window-toggle", ()).unwrap();
            state._space_active.set(false); // 在解决这个bug之前，这里会强制松开Caps层
            return HandlerResult::Block
        },

        EventType::KeyPress(_) => { return HandlerResult::Block }, // 未分配则禁止按下，允许其他
        _ => { return HandlerResult::Allow }
    }
}

/// RShift+* 编辑器/Ctrl层 内部
fn layer_shift_r(
    event_type: &EventType,
    state: &LayerState,
    enigo: &mut Enigo,
    app_handle: &tauri::AppHandle,
) -> HandlerResult {
    if !state.shift_r_active.get() { return HandlerResult::Pass }

    if let EventType::KeyPress(_) = event_type { // 按下过
        state.shift_r_active_used.set(true)
    }

    // 当ctrl用
    if let EventType::KeyPress(key) = event_type {
        if let Some(sim_key) = match key {
            Key::KeyQ => Some(enigo::Key::Q),
            Key::KeyW => Some(enigo::Key::W),
            Key::KeyE => Some(enigo::Key::E),
            Key::KeyR => Some(enigo::Key::R),
            Key::KeyT => Some(enigo::Key::T),

            Key::KeyA => Some(enigo::Key::A),
            Key::KeyS => Some(enigo::Key::S),
            Key::KeyD => Some(enigo::Key::D),
            Key::KeyF => Some(enigo::Key::F),
            Key::KeyG => Some(enigo::Key::G),

            Key::KeyX => Some(enigo::Key::X),
            Key::KeyC => Some(enigo::Key::C),
            Key::KeyV => Some(enigo::Key::V),
            Key::KeyB => Some(enigo::Key::B),
            _ => None,
        } {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, sim_key, Click); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        }
    }

    // 其他
    match event_type {
        EventType::KeyPress(Key::KeyZ) => {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::Shift, Press); simu_key(enigo, &state, enigo::Key::Z, Click);
            simu_key(enigo, &state, enigo::Key::Shift, Release); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        }
        EventType::KeyPress(Key::ShiftLeft) => {
           simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::Z, Click); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        }
        EventType::KeyPress(Key::KeyI) => {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::Z, Click); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        }
        EventType::KeyPress(Key::KeyO) => {
            simu_key(enigo, &state, enigo::Key::Control, Press); simu_key(enigo, &state, enigo::Key::Shift, Press); simu_key(enigo, &state, enigo::Key::Z, Click);
            simu_key(enigo, &state, enigo::Key::Shift, Release); simu_key(enigo, &state, enigo::Key::Control, Release);
            return HandlerResult::Block
        }
        EventType::KeyPress(Key::KeyN) | EventType::KeyPress(Key::KeyM) => {
            // 有bug: 这里会通知前端，召唤出窗口。但窗口召唤后这里的按键监听会失效，并且鼠标无法移动，疑似卡死
            // 但可以按 Esc 退出窗口，并再单击一下 Caps 键。能恢复正常
            // 
            // 问题定位: Caps 激活状态阻止了一些事件。而在新窗口中松开 Caps 无效，返回原状态后依然视为 Caps 激活态。
            // 此时要按一下 Caps 恢复正常
            // 
            // 需要解决: 最好是能在通知前端并弹出新窗口后，依然能继续监听到事件。从而捕获在那之后的各种按键。包括 Caps 松开
            // 
            // 在解决这个bug之前，这里会强制松开Caps层
            app_handle.emit("active-window-toggle", ()).unwrap();
            state.shift_r_active.set(false); // 在解决这个bug之前，这里会强制松开Caps层
            return HandlerResult::Block
        }
        // 未分配则禁止按下，允许其他
        EventType::KeyPress(_) => { return HandlerResult::Block },
        _ => { return HandlerResult::Allow }
    }
}

// ========== 辅助函数 ==========

/// 模拟按键操作 (不会被重复捕获版)
fn simu_key(
    enigo: &mut Enigo,
    state: &LayerState,
    key: enigo::Key,
    direction: enigo::Direction,
) {
    state.virtual_event_flag.set(true);
    let _ = enigo.key(key, direction);
    state.virtual_event_flag.set(false);
}

/// 模拟文本输入 (不会被重复捕获版)
fn simu_text(
    enigo: &mut Enigo,
    state: &LayerState,
    text: &str,
) {
    state.virtual_event_flag.set(true);
    let _ = enigo.text(text);
    state.virtual_event_flag.set(false);
}
