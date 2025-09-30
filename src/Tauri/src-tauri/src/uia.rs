/**
 * 获取光标、窗口信息、uia信息
 * 
 * ## 测试
 * 
 * 我为许多种api都给出了编号，下面是对各种环境的测试:
 * 
 * [lt]
 * 
 * - 方案 | 内容 | 成功 | 失败
 * - S系列是 windows api
 *   - S1 | 光标 | 从未成功
 *   - S2 | 光标 | notepad/browser/notepad-- | ob/qq/vscode/vscode屏幕增强
 *   - S3 | 应用窗口 | 恒成功
 *   - S4 | 光标 | notepad/browser/notepad-- | ob/qq/vscode/vscode屏幕增强
 * - U系列是 uiautomation api
 *   - U2 | 光标 | 从未成功
 *   - U3 | 编辑器窗口| 恒成功，但似乎有误差 (概率失败)
 */

use log::{debug, warn, info, error};
use uiautomation::{
    // Result, // 这行代码告诉编译器：“在这个函数里，当我写 Result 的时候，我指的不是标准库里的 std::result::Result，而是 uiautomation 这个库里定义的 Result
    // Result 最好不要use，容易出报错
    UIAutomation,
    UIElement,
    UITreeWalker,
    // actions::Text,
    patterns::{
        UITextPattern,
        UITextEditPattern,
    }
};

// 打印窗口、编辑器、光标 (插入符号，而非鼠标) 等信息
pub fn get_message() -> (i32, i32) { 
    info!("  > print_msg --------------");
    let mut x = -1;
    let mut y = -1;

    #[cfg(target_os = "windows")]
    {
        if let Some((a, b)) = get_message_getfocus() {
            x = a; y = b; 
        };
        if let Some((a, b)) = get_message_getgui() {
            x = a; y = b;
        };
        get_message_getforeground(); // 这个不是光标位置而是窗口位置
        // _get_message_getforeground_gui();
    }

    info!("  < print_msg --------------");
    return (x, y);
}

/** GetFocus 方式。不好用，废弃!
 * 第一次定位聚焦窗口错误，聚焦到应用本身，第二次开始都是 "没有聚焦的窗口"
 * GPT 说好像只能获取 **当前线程** 的焦点窗口，不利于去获取非本应用的窗口信息
 */
fn get_message_getfocus() -> Option<(i32, i32)> {
    use winapi::{
        um::winuser::{
            GetFocus,
            GetCaretPos
        }
    };
    use winapi::shared::windef::POINT;

    let hwnd: winapi::shared::windef::HWND; // 窗口句柄 (hwnd = Handle to WiNDow)
    let mut point1: POINT;
    unsafe {
        hwnd = GetFocus();
        if hwnd.is_null() {
            error!("S1: GetFocus: 没有聚焦的窗口"); return None
        }
        get_message_window_name(hwnd); // 打印窗口名称（调试用）

        point1 = POINT { x: 0, y: 0 };
        if GetCaretPos(&mut point1) == 0 {
            error!("S1: GetCaretPos: 获取位置失败"); return None
        }

        use winapi::um::winuser::ClientToScreen;
        ClientToScreen(hwnd, &mut point1);
        info!("S1: GetCaretPos: 获取位置成功 ({}, {})", point1.x, point1.y);
        (point1.x, point1.y);
    };
    None
}

/**
 * GetGUIThreadInfo 方式，也不好用。
 * 浏览器成功，但VSCode、QQ等失败
 */
fn get_message_getgui() -> Option<(i32, i32)> {
    use winapi::shared::windef::POINT;
    use winapi::um::winuser::{
        GetGUIThreadInfo,
        GUITHREADINFO,
        ClientToScreen,
    };

    let mut point2: POINT;
    unsafe {
        let mut gui_info: GUITHREADINFO = std::mem::zeroed(); // 获取当前GUI线程信息
        gui_info.cbSize = size_of::<GUITHREADINFO>() as u32;
    
        if GetGUIThreadInfo(0, &mut gui_info) == 0 {
            error!("S2: GetGUIThreadInfo: 获取GUI线程信息失败"); return None
        }
        // 检查是否有活动的插入符号
        if gui_info.hwndCaret.is_null() {
            error!("S2: gui_info.hwndCaret: 没有活动的插入符号"); return None
        }
        // 获取插入符号的位置
        let caret_rect = gui_info.rcCaret;
        let hwnd_caret = gui_info.hwndCaret;
        
        // 打印窗口名称（调试用）
        get_message_window_name(hwnd_caret);
        
        // 将客户区坐标转换为屏幕坐标
        point2 = POINT { 
            x: caret_rect.left, 
            y: caret_rect.bottom // 使用底部坐标，这样窗口会出现在光标下方
        };
        
        if ClientToScreen(hwnd_caret, &mut point2) == 0 {
            error!("S2: 转换屏幕坐标失败，转换前位置: ({}, {})", point2.x, point2.y); return None
        }
        info!("S2: 转换屏幕坐标成功: ({}, {})", point2.x, point2.y);
        return Some((point2.x, point2.y));
    }
}

/** GetForegroundWindow 方式。准确，获取的是活跃窗口的窗口位置
 */
fn get_message_getforeground() -> Option<(i32, i32)> {
    use winapi::um::winuser::{
        GetCaretPos,
        ClientToScreen,
        GetForegroundWindow,
        GetWindowThreadProcessId,
    };
    use winapi::shared::windef::POINT;

    let hwnd2: winapi::shared::windef::HWND;
    let mut point3: POINT;
    unsafe {
        hwnd2 = GetForegroundWindow();
        if hwnd2.is_null() {
            error!("S3: GetForegroundWindow: 没有前台窗口"); return None
        }
        // 获取前台窗口的线程ID
        let mut pid = 0;
        let _thread_id = GetWindowThreadProcessId(hwnd2, &mut pid);

        // 打印窗口名称（调试用）
        get_message_window_name(hwnd2);

        point3 = POINT { x: 0, y: 0 };
        if GetCaretPos(&mut point3) == 0 { // 不知道为什么这里的CaretPos总是窗口位置而非Caret位置
            error!("S3: GetForegroundWindow + GetCaretPos 获取位置失败"); return None
        }
        ClientToScreen(hwnd2, &mut point3);
        info!("S3: GetForegroundWindow + GetCaretPos 获取位置成功: ({}, {})", point3.x, point3.y);
        return Some((point3.x, point3.y));
    }
}

/** GetForegroundWindow + GetGUIThreadInfo组合方式。同S2，重复废弃 */
fn _get_message_getforeground_gui() -> Option<(i32, i32)> {
    use winapi::um::winuser::{
        GetGUIThreadInfo,
        ClientToScreen,
        GetForegroundWindow,
        GetWindowThreadProcessId,
        GUITHREADINFO,
    };
    use winapi::shared::windef::POINT;

    let hwnd2: winapi::shared::windef::HWND;
    unsafe {            
        hwnd2 = GetForegroundWindow();
        if hwnd2.is_null() {
            error!("S3: GetForegroundWindow: 没有前台窗口"); return None
        }
        if hwnd2.is_null() {
            error!("S4: 没有前台窗口"); return None
        }
        // 获取前台窗口的线程ID
        let mut pid = 0;
        let thread_id = GetWindowThreadProcessId(hwnd2, &mut pid);
        
        // 打印窗口名称和线程ID（调试用）
        get_message_window_name(hwnd2);
        
        // 获取线程的GUI信息
        let mut gui_info: GUITHREADINFO = std::mem::zeroed();
        gui_info.cbSize = size_of::<GUITHREADINFO>() as u32;
        
        if GetGUIThreadInfo(thread_id, &mut gui_info) == 0 {
            error!("S4: 获取前台窗口GUI线程信息失败"); return None
        }
        if gui_info.hwndCaret.is_null() {
            error!("S4: 前台窗口没有活动的插入符号"); return None
        }
        let caret_rect = gui_info.rcCaret;
        let hwnd_caret = gui_info.hwndCaret;
        
        get_message_window_name(hwnd_caret);
        
        let mut point = POINT { 
            x: caret_rect.left, 
            y: caret_rect.bottom 
        };
        
        if ClientToScreen(hwnd_caret, &mut point) == 0 {
            error!("S4: 前台窗口无法转换为屏幕坐标");
            return None
        }
        info!("S4: 前台窗口光标位置: ({}, {})", point.x, point.y);
        return Some((point.x, point.y));
    }
}

// 辅助函数：打印窗口名称（调试用）
#[cfg(target_os = "windows")]
fn get_message_window_name(hwnd: winapi::shared::windef::HWND) {
    use winapi::um::winuser::GetWindowTextW;
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    
    unsafe {
        let mut buffer = [0u16; 512];
        let len = GetWindowTextW(hwnd, buffer.as_mut_ptr(), buffer.len() as i32);
        if len > 0 {
            let window_name = OsString::from_wide(&buffer[0..len as usize]);
            debug!("    窗口名称: {:?}", window_name);
        } else {
            error!("    无法获取窗口名称或窗口无标题");
        }
    }
}

/** 获取uia信息 - 聚焦窗口中
 */
pub fn get_uia_focused(walker: &UITreeWalker, automation: &UIAutomation, level: usize) -> uiautomation::Result<()> {
    info!("  > print uia msg --------------");
    let focused: UIElement = automation.get_focused_element()?; // 当前聚焦元素
    let _root: UIElement = automation.get_root_element().unwrap(); // 根元素

    let _ = get_uia_uimsg(&focused);
    let _ = get_uia_textpattern(&focused);
    let _ = get_uia_textpattern2(&focused);
    // if let Ok(_text_pattern) = text_pattern {
    //     let _ = get_uia_eltree(walker, &_text_pattern, level);
    // }

    // test_uia_notepad();
    _test_uia_print(walker, &focused, level)?;

    info!("  < print uia msg --------------");
    Ok(())
}

// 打印 uia ui 常见信息
fn get_uia_uimsg(focused: &UIElement) -> uiautomation::Result<()> {
    // 环境问题
    // VSCode 环境问题，控制台可能可能会让你按 Alt+Shift+F1
    // 开启后 VSCode 右下角会显示 "已为屏幕阅读器优化"，这种情况下的 vscode 才能获取到信息
    
    // name:        窗口名/对于输入框是默认名 (而不是输入内容)
    debug!("name:               {}", focused.get_name()?);
    // classname:   大部分是空 (textarea qq vscode 等空)，notepad-- 是 ScintillaEditView，windows notepad 是 RichEditD2DPT
    debug!("classname:          {}", focused.get_classname()?);
    // controltype: 大部分是如textarea是Edit，windows notepad 是Document，浏览器搜索框是 ComboBox
    debug!("controltype:        {}", focused.get_control_type()?);
    debug!("parent:             {}", match focused.get_cached_parent() {
        Ok(p) => p.get_name().unwrap_or_default(),
        Err(_) => "无父元素".to_string()
    });
    debug!("children.len:       {}", match focused.get_cached_children() {
        Ok(children) => children.len() as i32,
        Err(_) => -1
    });
    debug!("process_id:         {}", match focused.get_process_id() {
        Ok(pid) => pid as i64,
        Err(_) => -1
    });
    debug!("is_enabled:         {}", focused.is_enabled()?);
    debug!("is_password:        {}", focused.is_password()?);
    debug!("get_culture:        {}", focused.get_culture()?); // 语言标识符？
    debug!("get_item_type:      {}", focused.get_item_type()?);
    // Firefox是Gecko，大部分如vscode obsidian qq chorome都是Chrome
    debug!("get_framework_id:   {}", focused.get_framework_id()?);
    debug!("has_kb_focus:       {}", focused.has_keyboard_focus()?);
    debug!("is_kb_focusable:    {}", focused.is_keyboard_focusable()?);
    debug!("is_content_element: {}", focused.is_content_element()?);
    debug!("is_control_element: {}", focused.is_control_element()?);
    debug!("rect:               {}", match focused.get_bounding_rectangle() { // 通常是正确可靠的
        Ok(rect) => format!("left={}, top={}, width={}, height={}",
            rect.get_left(), rect.get_top(), rect.get_width(), rect.get_height()
        ),
        Err(e) => format!("获取失败: {}", e)
    });
    debug!("help_text:          {}", focused.get_help_text()?);
    debug!("accelerator_key:    {}", focused.get_accelerator_key()?);
    debug!("access_key:         {}", focused.get_access_key()?);
    debug!("automation_id:      {}", focused.get_automation_id()?);
    debug!("is_offscreen:       {}", focused.is_offscreen()?);
    debug!("labeled_by:         {:?}", focused.get_labeled_by().map(|e| e.get_name().unwrap_or_default()));

    Ok(())
}

/** 获取uia信息 - 聚焦窗口中的文本框? */
fn get_uia_textpattern (el: &UIElement) -> Result<UITextPattern, Box<dyn std::error::Error>> {
    let text_pattern = el.get_pattern::<UITextPattern>().or_else(|e| {
        warn!("U1  获取 UITextPattern 失败: {}", e); Err(e)
    })?;
    info!("U1  获取 UITextPattern 成功");

    // 基于 get_caret_range()
    // 获取 插入符号状态总是失败的，无论在任何软件的文本框环境中，错误原因总是：不支持此接口
    let _ret = (|| -> Result<(), Box<dyn std::error::Error>> {
        let (has_caret, caret_range) = text_pattern.get_caret_range()
            .map_err(|e| { warn!("U2  获取插入符号范围失败: {}", e); e })?;
        if !has_caret { warn!("U2  当前控件没有插入符号"); return Ok(()); };
        let caret_elem = caret_range.get_enclosing_element()
            .map_err(|e| { warn!("U2  获取插入符号元素失败: {}", e); e })?;
        let rect = caret_elem.get_bounding_rectangle()
            .map_err(|e| { warn!("U2  获取插入符号边界失败: {}", e); e })?;
        info!("U2  插入符号位置: left={}, top={}, width={}, height={}",
            rect.get_left(), rect.get_top(), rect.get_width(), rect.get_height()
        );
        Ok(())
    })();

    // 基于 get_selection()
    let _ret2 = (|| -> Result<(), Box<dyn std::error::Error>> {
        let ranges = text_pattern.get_selection()
            .map_err(|e| { warn!("U3  获取选区失败: {}", e); e })?;
        for (i, range) in ranges.iter().enumerate() {
            let elem = range.get_enclosing_element()
                .map_err(|e| { warn!("U3  获取选区 {} 元素失败: {}", i, e); e })?;
            let rect = elem.get_bounding_rectangle()
                .map_err(|e| { warn!("U3  获取选区 {} 边界失败: {}", i, e); e })?;
            // 这个获取到的是文本框的边界，而不是光标选区的边界
            info!(
                "U3  选区 {} 位置: left={}, top={}, width={}, height={}",
                i,
                rect.get_left(),
                rect.get_top(),
                rect.get_width(),
                rect.get_height()
            );
        };
        Ok(())
    })();

    // print UITextPattern 常见信息
    let _ = text_pattern.get_document_range();

    Ok(text_pattern)
}
fn get_uia_textpattern2 (el: &UIElement) -> Result<UITextEditPattern, Box<dyn std::error::Error>> {
    let text_pattern = el.get_pattern::<UITextEditPattern>().or_else(|e| {
        warn!("21  获取 UITextPattern 失败: {}", e); Err(e)
    })?;
    info!("21  获取 UITextPattern 成功");

    // 基于 get_caret_range()
    // 获取 插入符号状态总是失败的，无论在任何软件的文本框环境中，错误原因总是：不支持此接口
    let _ret = (|| -> Result<(), Box<dyn std::error::Error>> {
        // let m = text_pattern.text;
        Ok(())
    })();

    Ok(text_pattern)
}

// 递归打印传入的 element 及其子元素
fn _test_uia_print(walker: &UITreeWalker, element: &UIElement, level: usize) -> uiautomation::Result<()> {
    for _ in 0..level {
        print!(" ")
    }
    println!("{} - {}", element.get_classname()?, element.get_name()?);

    if let Ok(child) = walker.get_first_child(&element) {
        _test_uia_print(walker, &child, level + 1)?; // 递归 第一个儿子
        let mut next = child;
        while let Ok(sibling) = walker.get_next_sibling(&next) {
            _test_uia_print(walker, &sibling, level + 1)?; // 递归 第一个儿子的兄弟

            next = sibling;
        }
    }
    
    Ok(())
}

/** 自动打开记事本并输出文本 */
fn _test_uia_notepad() {
    use uiautomation::actions::Window;
    use uiautomation::controls::WindowControl;
    use uiautomation::core::UIAutomation;
    use uiautomation::inputs::Keyboard;
    use uiautomation::processes::Process;

    Process::create("notepad.exe").unwrap();
    let automation = UIAutomation::new().unwrap();
    let root = automation.get_root_element().unwrap();
    let matcher = automation.create_matcher().from(root).timeout(10000).classname("Notepad").debug(true);
    if let Ok(notepad) = matcher.find_first() {
        println!("Found: {} - {}", notepad.get_name().unwrap(), notepad.get_classname().unwrap());

        notepad.send_text_by_clipboard("This is from clipboard.\n").unwrap();
        notepad.send_keys("Hello, Rust UIAutomation!", 10).unwrap();
        notepad.send_text("\r\n{Win}D.", 10).unwrap();

        let kb = Keyboard::new().interval(10).ignore_parse_err(true);
        kb.send_keys(" {None} (Keys).").unwrap();

        notepad.hold_send_keys("{Ctrl}{Shift}", "{Left}{Left}", 50).unwrap();

        let window: WindowControl = notepad.try_into().unwrap();
        window.maximize().unwrap(); // 最大化窗口
    }
}

