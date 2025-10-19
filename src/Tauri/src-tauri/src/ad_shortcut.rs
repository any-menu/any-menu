/** 高级快捷键
 * 
 * 常规的系统级快捷键使用 Tauri 的快捷键插件即可，但非系统级快捷键要自己处理
 */

use rdev::{
    grab, listen, simulate, Event, EventType, Key
};
use std::{cell::Cell, thread, time};

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

/** 可以拦截原行为，会阻塞 */
pub fn init_ad_shortcut() {
    let caps_active = Cell::new(false);         // 是否激活 Caps 层
    let caps_active_used = Cell::new(false);    // 是否使用过激活后的 Caps 层
    let skip_next_caps_event = Cell::new(false);// 跳过一次原 Caps 行为

    // 注意: 这是一个 Fn (非FnMut/FnOnce) 闭包，表示可以多次且并发调用
    // 所以这里的 caps_active 要改成 Cell 类型以确保并发安全
    let callback = move |event: Event| -> Option<Event> {
        // 避免捕获自身模拟的虚拟按键
        if skip_next_caps_event.get() {
            if event.event_type == EventType::KeyRelease(Key::CapsLock) {
                return Some(event)
            }
            if event.event_type == EventType::KeyPress(Key::CapsLock) {
                skip_next_caps_event.set(false);
                return Some(event)
            }
        }

        // CapsLock 状态
        if event.event_type == EventType::KeyPress(Key::CapsLock) {
            caps_active.set(true);
            caps_active_used.set(false);
            return None // 禁用 CapsLock 键
        }
        if event.event_type == EventType::KeyRelease(Key::CapsLock) {
            caps_active.set(false);
            if !caps_active_used.get() { // 没用过，则正常大小写切换
                skip_next_caps_event.set(true);
                let _ = simulate(&EventType::KeyRelease(Key::CapsLock));
                thread::sleep(time::Duration::from_millis(10));
                let _ = simulate(&EventType::KeyPress(Key::CapsLock));
                thread::sleep(time::Duration::from_millis(10));
            }
            return Some(event) // 禁用 CapsLock 键
        }

        // Caps+N
        if caps_active.get() {
            caps_active_used.set(true);
            // Caps+Esc, 伪造 CapsLock 按下和释放事件，来切换大小写
            // 不知道为什么，+Esc的识别总是不够灵敏
            if event.event_type == EventType::KeyRelease(Key::Escape) {
                skip_next_caps_event.set(true);
                let _ = simulate(&EventType::KeyRelease(Key::CapsLock));
                thread::sleep(time::Duration::from_millis(10));
                let _ = simulate(&EventType::KeyPress(Key::CapsLock));

                return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyF) {
                println!("Caps+F detected!");
                // 这里可以用 tauri::api::process::Command 或 tauri::window.emit 通知前端
                return None
            }
            return None
        }

        Some(event)
    };
    if let Err(error) = grab(callback) {
        println!("Error: {:?}", error)
    }
}
