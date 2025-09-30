/**
 * 获取光标、窗口信息、uia信息
 */

use log::{warn, info, error};
use uiautomation::{
    // Result, // 这行代码告诉编译器：“在这个函数里，当我写 Result 的时候，我指的不是标准库里的 std::result::Result，而是 uiautomation 这个库里定义的 Result
    // Result 最好不要use，容易出报错
    UIAutomation,
    UIElement,
    UITreeWalker,
    // actions::Text,
    patterns::UITextPattern,
};

// 辅助函数：打印窗口名称（调试用）
#[cfg(target_os = "windows")]
fn print_window_name(hwnd: winapi::shared::windef::HWND) {
    use winapi::um::winuser::GetWindowTextW;
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    
    unsafe {
        let mut buffer = [0u16; 512];
        let len = GetWindowTextW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);
        if len > 0 {
            let window_name = OsString::from_wide(&buffer[0..len as usize]);
            info!("窗口名称: {:?}", window_name);
        } else {
            info!("无法获取窗口名称或窗口无标题");
        }
    }
}

// 打印窗口、编辑器、光标 (插入符号，而非鼠标) 等信息
pub fn print_msg() -> (i32, i32) { 
    info!("---------------print_msg---------------");

    #[cfg(target_os = "windows")]
    {
        use winapi::um::winuser::{
            GetFocus,
            GetCaretPos,
            GetGUIThreadInfo,
            GUITHREADINFO,
            ClientToScreen,
            GetForegroundWindow,
            GetWindowThreadProcessId,
        };
        use winapi::shared::windef::{
            POINT
        };
        use std::mem::size_of;

        // GetFocus 方式。不好用，第一次定位聚焦窗口错误，聚焦到应用本身，第二次开始都是 "没有聚焦的窗口"
        // GPT 说好像只能获取 **当前线程** 的焦点窗口，不利于去获取非本应用的窗口信息
        let hwnd: winapi::shared::windef::HWND; // 窗口句柄 (hwnd = Handle to WiNDow)                
        let mut point1: POINT;
        unsafe {
            hwnd = GetFocus();
            if hwnd.is_null() {
                error!("S1: GetFocus: 没有聚焦的窗口");
            } else {
                print_window_name(hwnd); // 打印窗口名称（调试用）
        
                point1 = POINT { x: 0, y: 0 };
                if GetCaretPos(&mut point1) != 0 {
                    use winapi::um::winuser::ClientToScreen;
                    ClientToScreen(hwnd, &mut point1);
                    info!("S1: GetCaretPos: 获取位置成功 ({}, {})", point1.x, point1.y);
                } else {
                    error!("S1: GetCaretPos: 获取位置失败");
                }
            }
        }

        // GetGUIThreadInfo 方式，也不好用。浏览器成功，但VSCode、QQ等失败
        let mut point2: POINT;
        unsafe {
            let mut gui_info: GUITHREADINFO = std::mem::zeroed(); // 获取当前GUI线程信息
            gui_info.cbSize = size_of::<GUITHREADINFO>() as u32;
        
            if GetGUIThreadInfo(0, &mut gui_info) == 0 {
                error!("S2: GetGUIThreadInfo: 获取GUI线程信息失败");
            }
            else {
                // 检查是否有活动的插入符号
                if gui_info.hwndCaret.is_null() {
                    error!("S2: gui_info.hwndCaret: 没有活动的插入符号");
                } else {
                    // 获取插入符号的位置
                    let caret_rect = gui_info.rcCaret;
                    let hwnd_caret = gui_info.hwndCaret;
                    
                    // 打印窗口名称（调试用）
                    print_window_name(hwnd_caret);
                    
                    // 将客户区坐标转换为屏幕坐标
                    point2 = POINT { 
                        x: caret_rect.left, 
                        y: caret_rect.bottom // 使用底部坐标，这样窗口会出现在光标下方
                    };
                    
                    if ClientToScreen(hwnd_caret, &mut point2) == 0 {
                        error!("S2: 转换屏幕坐标失败，转换前位置: ({}, {})", point2.x, point2.y);
                    } else {
                        info!("S2: 转换屏幕坐标成功: ({}, {})", point2.x, point2.y);
                    }
                }
            }
        }

        // GetForegroundWindow 方式。准确，获取的是活跃窗口的窗口位置
        let hwnd2: winapi::shared::windef::HWND;
        let mut point3: POINT;
        unsafe {
            hwnd2 = GetForegroundWindow();
            if hwnd2.is_null() {
                error!("S3: GetForegroundWindow: 没有前台窗口");
            } else {
                // 打印窗口名称（调试用）
                print_window_name(hwnd2);

                point3 = POINT { x: 0, y: 0 };
                if GetCaretPos(&mut point3) != 0 {
                    ClientToScreen(hwnd2, &mut point3);
                    info!("S3: GetForegroundWindow + GetCaretPos 获取位置成功: ({}, {})", point3.x, point3.y);
                } else {
                    error!("S3: GetForegroundWindow + GetCaretPos 获取位置失败");
                }
            }
        }
    
        // GetForegroundWindow + GetGUIThreadInfo组合方式。
        // 和之前一样，前者成功，后者浏览器成功，但VSCode、QQ等失败
        unsafe {            
            if hwnd2.is_null() {
                error!("S4: 没有前台窗口");
            } else {
                // 获取前台窗口的线程ID
                let mut pid = 0;
                let thread_id = GetWindowThreadProcessId(hwnd2, &mut pid);
                
                // 打印窗口名称和线程ID（调试用）
                print_window_name(hwnd2);
                
                // 获取线程的GUI信息
                let mut gui_info: GUITHREADINFO = std::mem::zeroed();
                gui_info.cbSize = size_of::<GUITHREADINFO>() as u32;
                
                if GetGUIThreadInfo(thread_id, &mut gui_info) == 0 {
                    error!("S4: 获取前台窗口GUI线程信息失败");
                } else {
                    if gui_info.hwndCaret.is_null() {
                        error!("S4: 前台窗口没有活动的插入符号");
                    } else {
                        let caret_rect = gui_info.rcCaret;
                        let hwnd_caret = gui_info.hwndCaret;
                        
                        print_window_name(hwnd_caret);
                        
                        let mut point = POINT { 
                            x: caret_rect.left, 
                            y: caret_rect.bottom 
                        };
                        
                        if ClientToScreen(hwnd_caret, &mut point) == 0 {
                            error!("S4: 前台窗口无法转换为屏幕坐标");
                        } else {
                            info!("S4: 前台窗口光标位置: ({}, {})", point.x, point.y);
                            return (point.x, point.y);
                        }
                    }
                }
            }
        }

        return (-1, -1);
    }
}

// 仅打印当前聚焦的 element 及其子元素
pub fn print_focused_element(walker: &UITreeWalker, automation: &UIAutomation, level: usize) -> uiautomation::Result<()> {
    let focused = automation.get_focused_element()?; // 当前聚焦元素
    let _root = automation.get_root_element().unwrap(); // 根元素

    // 环境问题
    // VSCode 环境，控制台可能可能会让你按 Alt+Shift+F1, 开启后 VSCode 右下角会显示 "已为屏幕阅读器优化"，这种情况下的 vscode 才能获取到信息
    // classname: 大部分是空 (浏览器 qq vscode 等空)，notepad-- 是 ScintillaEditView，windows notepad 是 RichEditD2DPT
    // controltype: 大部分是Edit，windows notepad 是Document，浏览器搜索框是 ComboBox
    // name: 窗口名/输入框默认名
    info!("classname: {}", focused.get_classname()?);
    info!("controltype: {}", focused.get_control_type()?);
    info!("name: {}", focused.get_name()?);

    // api测试
    // 获取 TextPattern 总是成功的
    // 获取 插入符号状态总是失败的，无论在任何软件的文本框环境中，错误原因总是：不支持此接口
    let text_pattern: UITextPattern = focused.get_pattern::<UITextPattern>().or_else(|e| {
        warn!("1 获取 UITextPattern 失败: {}", e); Err(e)
    })?;

    // 基于 get_caret_range()
    let _ret = (|| -> Result<(), Box<dyn std::error::Error>> {
        let (has_caret, caret_range) = text_pattern.get_caret_range()
            .map_err(|e| { warn!("2 获取插入符号范围失败: {}", e); e })?;
        if !has_caret { warn!("2 当前控件没有插入符号"); return Ok(()); };
        let caret_elem = caret_range.get_enclosing_element()
            .map_err(|e| { warn!("2 获取插入符号元素失败: {}", e); e })?;
        let rect = caret_elem.get_bounding_rectangle()
            .map_err(|e| { warn!("2 获取插入符号边界失败: {}", e); e })?;
        info!("2 插入符号位置: left={}, top={}, width={}, height={}",
            rect.get_left(), rect.get_top(), rect.get_width(), rect.get_height()
        );
        Ok(())
    })();

    // 基于 get_selection()
    let _ret2 = (|| -> Result<(), Box<dyn std::error::Error>> {
        let ranges = text_pattern.get_selection()
            .map_err(|e| { warn!("3 获取选区失败: {}", e); e })?;
        for (i, range) in ranges.iter().enumerate() {
            let elem = range.get_enclosing_element()
                .map_err(|e| { warn!("3 获取选区 {} 元素失败: {}", i, e); e })?;
            let rect = elem.get_bounding_rectangle()
                .map_err(|e| { warn!("3 获取选区 {} 边界失败: {}", i, e); e })?;
            // 这个获取到的是文本框的边界，而不是光标选区的边界
            info!(
                "3 选区 {} 位置: left={}, top={}, width={}, height={}",
                i,
                rect.get_left(),
                rect.get_top(),
                rect.get_width(),
                rect.get_height()
            );
        };
        Ok(())
    })();

    // println!("聚焦元素信息:");
    print_element_tree(walker, &focused, level)
}

// 递归打印传入元素及其子树
fn print_element_tree(walker: &UITreeWalker, element: &UIElement, level: usize) -> uiautomation::Result<()> {
    for _ in 0..level {
        print!(" ");
    }
    println!("{} - {}", element.get_classname()?, element.get_name()?);

    if let Ok(child) = walker.get_first_child(&element) {
        let mut next = child;
        loop {
            print_element_tree(walker, &next, level + 1)?;
            match walker.get_next_sibling(&next) {
                Ok(sibling) => next = sibling,
                Err(_) => break, // 没有下一个兄弟，跳出循环
            }
        }
    }
    Ok(())
}

// 递归打印传入的 element 及其子元素
fn _print_element(walker: &UITreeWalker, element: &UIElement, level: usize) -> uiautomation::Result<()> {
    for _ in 0..level {
        print!(" ")
    }
    println!("{} - {}", element.get_classname()?, element.get_name()?);

    if let Ok(child) = walker.get_first_child(&element) {
        // _print_element(walker, &child, level + 1)?; // 递归

        let mut next = child;
        while let Ok(sibling) = walker.get_next_sibling(&next) {
            _print_element(walker, &sibling, level + 1)?;

            next = sibling;
        }
    }
    
    Ok(())
}
