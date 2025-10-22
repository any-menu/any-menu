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
use std::{cell::Cell, sync::{Arc, Mutex, MutexGuard}, thread, time::{self, Instant}};
use tauri::Emitter;

use crate::{text, uia};

/** 无法拦截原行为，会阻塞 */
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

/** 可以拦截原行为，会阻塞
 * 
 * 一些机制: 
 * - KeyPress 会在长按时一直触发, 直到按下下一个键, 上一个键就不再一直触发 (哪怕还按着)
 */
pub fn init_ad_shortcut(app_handle: tauri::AppHandle) {
    let caps_active = Cell::new(false);             // 是否激活 Caps 层
    let caps_active_used = Cell::new(false);        //     是否使用过^该层
    let caps_cursor_active = Cell::new(false);      // 是否激活 Caps_cursor 层
    let caps_cursor_active_used = Cell::new(false); //     是否使用过^该层
    let sign_active = Cell::new(false);             // 是否激活 符号层
    let sign_active_used = Cell::new(false);        //     是否使用过^该层
    let space_active = Cell::new(false);            // 是否激活 空格层
    let space_active_used = Cell::new(false);       //     是否使用过^该层
    let space_active_time = Cell::new(Option::<Instant>::None); // ^该层激活的开启时间

    let virtual_event_flag = Cell::new(false);  // 跳过虚拟行为，避免递归

    let enigo_instance = Arc::new(Mutex::new(
        Enigo::new(&Settings::default()).expect("Failed to create Enigo instance")
    ));

    // 注意: 这是一个 Fn (非FnMut/FnOnce) 闭包，表示可以多次且并发调用
    // 所以这里的 caps_active 要改成 Cell 类型以确保并发安全
    let callback = move |event: Event| -> Option<Event> {
        // 不处理非按键事件 (鼠标 滚动 按钮等)
        match event.event_type {
            EventType::KeyPress(_) => {} // println!("KeyDown {:?}", key);
            EventType::KeyRelease(_) => {}
            _ => { return Some(event) }
        }

        // 避免捕获自身模拟的虚拟按键
        if virtual_event_flag.get() {
            return Some(event)
        }

        // 模拟按键 - 语法糖
        // let simu = |event_type: &EventType| { // 如 simu(&EventType::KeyRelease(Key::CapsLock));
        //     virtual_event_flag.set(true);
        //     let _ = simulate(event_type);
        //     virtual_event_flag.set(false);
        //     // let delay = time::Duration::from_millis(20);
        //     // thread::sleep(delay);
        // };
        // let simu2 = |key: Key| { // 如 simu2(Key::CapsLock);
        //     virtual_event_flag.set(true);
        //     let _ = simulate(&EventType::KeyPress(key));
        //     let _ = simulate(&EventType::KeyRelease(key));
        //     virtual_event_flag.set(false);
        //     // let delay = time::Duration::from_millis(20);
        //     // thread::sleep(delay);
        // };
        let mut enigo = enigo_instance.lock().unwrap();
        let mut simu3 = |key: enigo::Key, direction: enigo::Direction| {
            virtual_event_flag.set(true);
            let _ = (&mut enigo).key(key, direction);
            virtual_event_flag.set(false);
        };
        let simu_text = |enigo: &mut MutexGuard<'_, Enigo>, text: &str| {
            virtual_event_flag.set(true);
            let _ = enigo.text(text);
            virtual_event_flag.set(false);
        };

        // 为什么要定义这个函数: Caps+C后，无论先松Caps还是先松C，都应视为退出光标层
        fn caps_cursor_quit(
            enigo: &mut MutexGuard<'_, Enigo>, 
            caps_cursor_active: &Cell<bool>, 
            caps_cursor_active_used: &Cell<bool>
        ) {
            if !caps_cursor_active.get() { return }
            if !caps_cursor_active_used.get() { // 没用过，则单击
                let _ = enigo.button(enigo::Button::Left, Click);
            }
            caps_cursor_active_used.set(false);
            caps_cursor_active.set(false);
        }

        // #region 默认层

        // Caps+* 光标层 进出
        if event.event_type == EventType::KeyPress(Key::CapsLock) {
            caps_active.set(true);
            caps_active_used.set(false);
            return None // 禁用原行为
        }
        if event.event_type == EventType::KeyRelease(Key::CapsLock) {
            if !caps_active_used.get() { // 没用过，恢复原行为
                virtual_event_flag.set(true);
                let _ = simulate(&EventType::KeyRelease(Key::CapsLock));
                thread::sleep(time::Duration::from_millis(10));
                let _ = simulate(&EventType::KeyPress(Key::CapsLock));
                virtual_event_flag.set(false);
            }
            caps_cursor_quit(&mut enigo, &caps_cursor_active, &caps_cursor_active_used); // 退出所有子层
            caps_active_used.set(false);
            caps_active.set(false);
            return Some(event)
        }

        // '+* 符号层 进出
        if event.event_type == EventType::KeyPress(Key::Quote) {
            sign_active.set(true);
            sign_active_used.set(false);
            return None // 禁用原行为
        }
        if event.event_type == EventType::KeyRelease(Key::Quote) {
            if !sign_active_used.get() { // 没用过，恢复原行为
                virtual_event_flag.set(true);
                let _ = simulate(&EventType::KeyRelease(Key::Quote));
                thread::sleep(time::Duration::from_millis(10));
                let _ = simulate(&EventType::KeyPress(Key::Quote));
                virtual_event_flag.set(false);
            }
            sign_active_used.set(false);
            sign_active.set(false);
            return Some(event)
        }

        // Space 空格层 进出
        if !caps_active.get() {
            if event.event_type == EventType::KeyPress(Key::Space) {
                if !space_active.get() {
                    space_active.set(true);
                    space_active_used.set(false);
                    space_active_time.set(Some(Instant::now()));
                }
                // 长按则恢复持续点击的行为
                let over_time: bool = space_active_time.get().map_or(false, |start_time| {
                    start_time.elapsed() > time::Duration::from_millis(500)
                });
                if over_time {
                    return Some(event)
                }
                return None // 禁用原行为
            }
            if event.event_type == EventType::KeyRelease(Key::Space) {
                if !space_active_used.get() { // 没用过，恢复原行为
                    virtual_event_flag.set(true);
                    let _ = simulate(&EventType::KeyRelease(Key::Space));
                    thread::sleep(time::Duration::from_millis(10));
                    let _ = simulate(&EventType::KeyPress(Key::Space));
                    virtual_event_flag.set(false);
                }
                space_active_used.set(false);
                space_active.set(false);
                return Some(event)
            }
        }

        // #endregion

        // #region Caps+C+* 鼠标层
        if caps_active.get() && caps_cursor_active.get() {
            if let EventType::KeyPress(_) = event.event_type { // 按下过
                caps_cursor_active_used.set(true);
            }

            const MOUSE_STEP: i32 = 18; // 可按需调整
            const MOUSE_STEP2: i32 = 200; // 可按需调整
            // TODO 点击后 "程序聚焦" 层改变，导致事件监听失效
            // TODO 点击不应该用I/O，因为可能存在拖拽操作
            if event.event_type == EventType::KeyPress(Key::KeyI) {
                let _ = enigo.button(enigo::Button::Left, Click);
                caps_active.set(false); // 在解决这个bug之前，这里会强制松开Caps层
                caps_cursor_active.set(false);
                return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyO) {
                let _ = enigo.button(enigo::Button::Right, Click);
                caps_active.set(false); // 在解决这个bug之前，这里会强制松开Caps层
                caps_cursor_active.set(false);
                return None
            }
            // TODO 支持斜向移动
            if event.event_type == EventType::KeyPress(Key::KeyU) { let _ = enigo.move_mouse(0, -MOUSE_STEP, enigo::Coordinate::Rel); return None }
            if event.event_type == EventType::KeyPress(Key::KeyJ) { let _ = enigo.move_mouse(-MOUSE_STEP, 0, enigo::Coordinate::Rel); return None }
            if event.event_type == EventType::KeyPress(Key::KeyK) { let _ = enigo.move_mouse(0, MOUSE_STEP, enigo::Coordinate::Rel); return None }
            if event.event_type == EventType::KeyPress(Key::KeyL) { let _ = enigo.move_mouse(MOUSE_STEP, 0, enigo::Coordinate::Rel); return None }
            if event.event_type == EventType::KeyPress(Key::KeyH) { let _ = enigo.move_mouse(-MOUSE_STEP2, 0, enigo::Coordinate::Rel); return None }
            if event.event_type == EventType::KeyPress(Key::SemiColon) { let _ = enigo.move_mouse(MOUSE_STEP2, 0, enigo::Coordinate::Rel); return None }
            if event.event_type == EventType::KeyPress(Key::Num7) ||
                event.event_type == EventType::KeyPress(Key::KeyY) { let _ = enigo.move_mouse(0, -MOUSE_STEP2, enigo::Coordinate::Rel); return None }
            if event.event_type == EventType::KeyPress(Key::Comma) { let _ = enigo.move_mouse(0, MOUSE_STEP2, enigo::Coordinate::Rel); return None }
        }
        // #endregion

        // #region Caps+* 光标层
        if caps_active.get() {
            if let EventType::KeyPress(_) = event.event_type { // 按下过
                caps_active_used.set(true);
            }

            // Caps+C+* 鼠标层进出
            if event.event_type == EventType::KeyPress(Key::KeyC) {
                caps_cursor_active.set(true);
                caps_cursor_active_used.set(false);
                return None
            }
            if event.event_type == EventType::KeyRelease(Key::KeyC) {
                caps_cursor_quit(&mut enigo, &caps_cursor_active, &caps_cursor_active_used);
                return Some(event)
            }

            // Caps+Esc, 伪造 CapsLock 按下和释放事件，来切换大小写
            // 不知道为什么，+Esc的识别总是不够灵敏
            if event.event_type == EventType::KeyRelease(Key::Escape) {
                virtual_event_flag.set(true);
                simu3(enigo::Key::CapsLock, Press);
                simu3(enigo::Key::CapsLock, Release);
                return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyB) {
                // 临时连续点击
                virtual_event_flag.set(true);
                let _ = enigo.button(enigo::Button::Left, Click);
                virtual_event_flag.set(false);
                let delay = time::Duration::from_millis(100);
                thread::sleep(delay);
                return None
            }
            if event.event_type == EventType::KeyRelease(Key::KeyB) {
                return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyI) { simu3(enigo::Key::Backspace, Click); return None }
            if event.event_type == EventType::KeyPress(Key::KeyO) { simu3(enigo::Key::Delete, Click); return None }
            if event.event_type == EventType::KeyPress(Key::KeyP) {
                simu3(enigo::Key::Control, Press); simu3(enigo::Key::Z, Click); simu3(enigo::Key::Control, Release);
                return None
            }
            if event.event_type == EventType::KeyPress(Key::LeftBracket) {
                simu3(enigo::Key::Control, Press); simu3(enigo::Key::Shift, Press); simu3(enigo::Key::Z, Click);
                simu3(enigo::Key::Shift, Release); simu3(enigo::Key::Control, Release);
                return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyU) { simu3(enigo::Key::UpArrow, Click); return None }
            if event.event_type == EventType::KeyPress(Key::KeyJ) { simu3(enigo::Key::LeftArrow, Click); return None }
            if event.event_type == EventType::KeyPress(Key::KeyK) { simu3(enigo::Key::DownArrow, Click); return None }
            if event.event_type == EventType::KeyPress(Key::KeyL) { simu3(enigo::Key::RightArrow, Click); return None }
            if event.event_type == EventType::KeyPress(Key::KeyH) { simu3(enigo::Key::Home, Click); return None }
            if event.event_type == EventType::KeyPress(Key::SemiColon) { simu3(enigo::Key::End, Click); return None }
            if event.event_type == EventType::KeyPress(Key::Num7) || event.event_type == EventType::KeyPress(Key::KeyY) {
                simu3(enigo::Key::Control, Press); simu3(enigo::Key::Home, Click); simu3(enigo::Key::Control, Release);
                return None
            }
            if event.event_type == EventType::KeyPress(Key::Comma) {
                simu3(enigo::Key::Control, Press); simu3(enigo::Key::End, Click); simu3(enigo::Key::Control, Release);
                return None
            }
            if event.event_type == EventType::KeyPress(Key::Space) { simu3(enigo::Key::Return, Click); return None }
            if event.event_type == EventType::KeyPress(Key::KeyD) ||
                event.event_type == EventType::KeyPress(Key::KeyG)
            {
                // TODO 长按层
                simu3(enigo::Key::Control, Press); simu3(enigo::Key::LeftArrow, Click);
                let delay = time::Duration::from_millis(30); thread::sleep(delay); // 等光标到左侧
                simu3(enigo::Key::Shift, Press); simu3(enigo::Key::RightArrow, Click); simu3(enigo::Key::Shift, Release); simu3(enigo::Key::Control, Release);
                return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyF) {
                // TODO 长按层
                simu3(enigo::Key::Home, Click);
                let delay = time::Duration::from_millis(30); thread::sleep(delay); // 等光标到左侧
                simu3(enigo::Key::Shift, Press); simu3(enigo::Key::End, Click); simu3(enigo::Key::Shift, Release);
                return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyN) ||
                event.event_type == EventType::KeyPress(Key::KeyM
            ) {
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
                caps_active.set(false); // 在解决这个bug之前，这里会强制松开Caps层
                return None
            }

            // Caps+未分配 (可能是Key，或Ctrl/Shift)，或松开按键，不处理
            // if let EventType::KeyPress(_) = event.event_type {
            //     println!("ignore Caps+* {:?}", event.event_type);
            //     return None
            // }
            return Some(event)
        }
        // #endregion

        // #region '+* 符号层
        if sign_active.get() {
            if let EventType::KeyPress(_) = event.event_type { // 按下过
                sign_active_used.set(true)
            }

            // 左半区
            if event.event_type == EventType::KeyPress(Key::KeyQ) { simu_text(&mut enigo, "！"); return None }
            if event.event_type == EventType::KeyPress(Key::KeyW) { simu_text(&mut enigo, "？"); return None }
            if event.event_type == EventType::KeyPress(Key::KeyS) { simu_text(&mut enigo, "……"); return None }
            if event.event_type == EventType::KeyPress(Key::KeyD) { simu_text(&mut enigo, "、"); return None }
            if event.event_type == EventType::KeyPress(Key::KeyF) { simu_text(&mut enigo, "，"); return None }
            if event.event_type == EventType::KeyPress(Key::KeyG) { simu_text(&mut enigo, "。"); return None }
            if event.event_type == EventType::KeyPress(Key::KeyV) { simu_text(&mut enigo, "——"); return None }

            // 右半区
            let mut sign_l: Option<&'static str> = None; // 左符号
            let mut sign_r: Option<&'static str> = None; // 右符号
            let mut sign_l_move: u16 = 1;
            if event.event_type == EventType::KeyPress(Key::KeyY) { sign_l = Some("“"); sign_r = Some("”"); }
            if event.event_type == EventType::KeyPress(Key::KeyU) { sign_l = Some("\""); sign_r = Some("\""); }
            if event.event_type == EventType::KeyPress(Key::KeyI) { sign_l = Some("'"); sign_r = Some("'"); }
            if event.event_type == EventType::KeyPress(Key::KeyO) { sign_l = Some("`"); sign_r = Some("`"); }
            if event.event_type == EventType::KeyPress(Key::KeyP) { sign_l = Some("```\n"); sign_r = Some("\n```"); sign_l_move = 4; }
            if event.event_type == EventType::KeyPress(Key::KeyH) { sign_l = Some("【"); sign_r = Some("】"); }
            if event.event_type == EventType::KeyPress(Key::KeyJ) { sign_l = Some("("); sign_r = Some(")"); }
            if event.event_type == EventType::KeyPress(Key::KeyK) { sign_l = Some("["); sign_r = Some("]"); }
            if event.event_type == EventType::KeyPress(Key::KeyL) { sign_l = Some("{"); sign_r = Some("}"); }
            if event.event_type == EventType::KeyPress(Key::KeyN) { sign_l = Some("「"); sign_r = Some("」"); }
            if event.event_type == EventType::KeyPress(Key::KeyM) { sign_l = Some("/* "); sign_r = Some(" */"); sign_l_move = 3; }
            if event.event_type == EventType::KeyPress(Key::Comma) { sign_l = Some("<"); sign_r = Some(">"); }
            if event.event_type == EventType::KeyPress(Key::Dot) { sign_l = Some("《"); sign_r = Some("》"); }
            if sign_l.is_some() && sign_r.is_some() {
                let sign_l = sign_l.unwrap();
                let sign_r = sign_r.unwrap();

                let selected_text: String = uia::get_uia_by_windows_selected();
                if selected_text.is_empty() {
                    virtual_event_flag.set(true);
                    let _ = text::send(&(sign_l.to_string() + sign_r), "clipboard");
                    let delay = time::Duration::from_millis(50); thread::sleep(delay); // 等待光标位置更新
                    for _ in 0..sign_l_move {
                        simu3(enigo::Key::LeftArrow, Click);
                    }
                    virtual_event_flag.set(false);
                    return None
                } else {
                    virtual_event_flag.set(true);
                    let _ = text::send(&(sign_l.to_string() + &selected_text + sign_r), "clipboard");
                    virtual_event_flag.set(false);
                    return None
                }
            }
        }
        // #endregion

        // #region Space 空格层

        if space_active.get() {
            if let EventType::KeyPress(_) = event.event_type { // 按下过
                space_active_used.set(true)
            }

            if event.event_type == EventType::KeyPress(Key::KeyI) {
                simu3(enigo::Key::Control, Press); simu3(enigo::Key::Z, Click); simu3(enigo::Key::Control, Release);
                return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyO) {
                simu3(enigo::Key::Control, Press); simu3(enigo::Key::Shift, Press); simu3(enigo::Key::Z, Click);
                simu3(enigo::Key::Shift, Release); simu3(enigo::Key::Control, Release);
                return None
            }

            if event.event_type == EventType::KeyPress(Key::KeyN) ||
                event.event_type == EventType::KeyPress(Key::KeyM
            ) {
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
                space_active.set(false); // 在解决这个bug之前，这里会强制松开Caps层
                return None
            }
        }

        // #endregion

        Some(event)
    };
    if let Err(error) = grab(callback) {
        println!("Error: {:?}", error)
    }
}
