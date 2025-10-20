/** 高级快捷键
 * 
 * 常规的系统级快捷键使用 Tauri 的快捷键插件即可，但非系统级快捷键要自己处理
 */

use rdev::{
    grab, listen, simulate, Event, EventType, Key
};
use std::{cell::Cell, thread, time};
use tauri::Emitter;

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
 * 一些机制: KeyPress 会在长按时一直触发, 直到按下下一个键, 上一个键就不再一直触发 (哪怕还按着)
 */
pub fn init_ad_shortcut(app_handle: tauri::AppHandle) {
    let caps_active = Cell::new(false);         // 是否激活 Caps 层
    let caps_active_used = Cell::new(false);    // 是否使用过激活后的 Caps 层
    let virtual_event_flag = Cell::new(false);  // 跳过虚拟行为，避免递归

    // 注意: 这是一个 Fn (非FnMut/FnOnce) 闭包，表示可以多次且并发调用
    // 所以这里的 caps_active 要改成 Cell 类型以确保并发安全
    let callback = move |event: Event| -> Option<Event> {
        // 不处理非按键事件 (鼠标 滚动 按钮等)
        match event.event_type {
            EventType::KeyPress(_) => {} // println!("KeyDown {:?}", key);
            EventType::KeyRelease(_) => {}
            _ => { return Some(event) }
        }

        // 模拟按键 - 语法糖
        let simu = |event_type: &EventType| {
            virtual_event_flag.set(true);
            let _ = simulate(event_type);
            virtual_event_flag.set(false);
            // let delay = time::Duration::from_millis(20);
            // thread::sleep(delay);
        };

        // 避免捕获自身模拟的虚拟按键
        if virtual_event_flag.get() {
            return Some(event)
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
                virtual_event_flag.set(true);
                let _ = simulate(&EventType::KeyRelease(Key::CapsLock));
                thread::sleep(time::Duration::from_millis(10));
                let _ = simulate(&EventType::KeyPress(Key::CapsLock));
                virtual_event_flag.set(false);
            }
            return Some(event) // 禁用 CapsLock 键
        }

        // Caps+*
        if caps_active.get() {
            caps_active_used.set(true);
            // Caps+Esc, 伪造 CapsLock 按下和释放事件，来切换大小写
            // 不知道为什么，+Esc的识别总是不够灵敏
            if event.event_type == EventType::KeyRelease(Key::Escape) {
                virtual_event_flag.set(true);
                simu(&EventType::KeyRelease(Key::CapsLock));
                thread::sleep(time::Duration::from_millis(10));
                simu(&EventType::KeyPress(Key::CapsLock));

                return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyI) { simu(&EventType::KeyPress(Key::Backspace)); return None }
            if event.event_type == EventType::KeyPress(Key::KeyO) { simu(&EventType::KeyPress(Key::Delete)); return None }
            if event.event_type == EventType::KeyPress(Key::KeyU) { simu(&EventType::KeyPress(Key::UpArrow)); return None }
            if event.event_type == EventType::KeyPress(Key::KeyJ) { simu(&EventType::KeyPress(Key::LeftArrow)); return None }
            if event.event_type == EventType::KeyPress(Key::KeyK) { simu(&EventType::KeyPress(Key::DownArrow)); return None }
            if event.event_type == EventType::KeyPress(Key::KeyL) { simu(&EventType::KeyPress(Key::RightArrow)); return None }
            if event.event_type == EventType::KeyPress(Key::KeyH) { simu(&EventType::KeyPress(Key::Home)); return None }
            if event.event_type == EventType::KeyPress(Key::KeyL) { simu(&EventType::KeyPress(Key::End)); return None }
            if event.event_type == EventType::KeyPress(Key::KeyD) {
                println!("Caps+D detected!"); return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyF) {
                println!("Caps+F detected!"); return None
            }
            if event.event_type == EventType::KeyPress(Key::KeyN) || event.event_type == EventType::KeyPress(Key::KeyM) {
                println!("Caps+N/M detected!");
                // 有bug: 这里会通知前端，召唤出窗口。但窗口召唤后这里的按键监听会失效，并且鼠标无法移动，疑似卡死
                // 但可以按 Esc 退出窗口，并再单击一下 Caps 键。能恢复正常
                // 
                // 问题定位: Caps 激活状态阻止了一些事件。而在新窗口中松开 Caps 无效，返回原状态后依然视为 Caps 激活态。
                // 此时要按一下 Caps 恢复正常
                // 
                // 需要解决: 最好是能在通知前端并弹出新窗口后，依然能继续监听到事件。从而捕获在那之后的各种按键。包括 Caps 松开
                app_handle.emit("active-window-toggle", ()).unwrap();
                return None
            }
            println!("ignore Caps+* {:?}", event.event_type);
            return None
        }

        Some(event)
    };
    if let Err(error) = grab(callback) {
        println!("Error: {:?}", error)
    }
}

// fn simu(event_type: &EventType) {
//     let _ = simulate(event_type);
//     // let delay = time::Duration::from_millis(20);
//     // thread::sleep(delay);
// }
