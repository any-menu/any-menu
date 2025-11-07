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
 * 
 * (这里的vscode屏幕增强可以按 `Alt+Shift+F1` 可以开启)
 */

use log::{debug, warn, info, error};

use crate::text;

/// 汇总各种方式
pub fn get_message() -> (i32, i32, String, String) {
    let (x, y) = get_win_message();
    let selected_mode: &str = "uia";
    let selected_text: Option<String> = get_selected(selected_mode);
    (x, y, selected_text.unwrap_or("".to_string()), get_uia_by_windows_winname())
}

// #region winapi 方式

// 打印窗口、编辑器、光标 (插入符号，而非鼠标) 等信息
fn get_win_message() -> (i32, i32) { 
    info!("  > print_msg --------------");
    let mut x = -1;
    let mut y = -1;

    #[cfg(target_os = "windows")]
    {
        // if let Some((a, b)) = get_message_getfocus() {
        //     x = a; y = b; 
        // };
        if let Some((a, b)) = get_win_message_getgui() {
            x = a; y = b;
        };
        // get_message_getforeground(); // 这个不是光标位置而是窗口位置
        // _get_message_getforeground_gui();
    }

    info!("  < print_msg --------------");
    return (x, y);
}

/** GetFocus 方式。不好用，废弃!
 * 第一次定位聚焦窗口错误，聚焦到应用本身，第二次开始都是 "没有聚焦的窗口"
 * GPT 说好像只能获取 **当前线程** 的焦点窗口，不利于去获取非本应用的窗口信息
 */
fn _get_win_message_getfocus() -> Option<(i32, i32)> {
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
fn get_win_message_getgui() -> Option<(i32, i32)> {
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
fn _get_win_message_getforeground() -> Option<(i32, i32)> {
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

// #endregion

// #region uiautomation-rs 方式

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

/** 获取uia信息 - 聚焦窗口中
 */
pub fn get_uia_focused(_walker: &UITreeWalker, automation: &UIAutomation, _level: usize) -> uiautomation::Result<()> {
    info!("  > print uia msg --------------");
    let focused: UIElement = automation.get_focused_element()?; // 当前聚焦元素
    let _root: UIElement = automation.get_root_element().unwrap(); // 根元素

    let _ = get_uia_uimsg(&focused);
    let _ = get_uia_textpattern(&focused);
    let _ = get_uia_textpattern2(&focused);
    // if let Ok(_text_pattern) = text_pattern {
    //     let _ = get_uia_eltree(walker, &_text_pattern, level);
    // }

    // _test_uia_notepad();
    // _test_uia_print(walker, &focused, level)?;

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
            // range.get_text(max_length)
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

/** 递归打印传入的 element 及其子元素
 * 
 * 以下是不同环境下的测试:
 * 
 * - QQ环境: - [] (Edit) 群名 -> - [] (Text) <消息框内容>
 * - 浏览器input/textarea: 显示的是默认值而不是当前值，- [] (Edit) file content
 * - Obsidian: Edit -> 一堆散乱的 Text/Image (格式)，特别阅读模式，基本无法还原成源md
 * - notepad--:
 *   - [ScintillaEditView] (Edit)
 *     - [QWidget] (Group)
 *     - [QWidget] (Group) 
 *       - [QScrollBar] (ScrollBar)
 * - notepad: - [RichEditD2DPT] (Document) 文本编辑器
 * - VSCode: - [] (Edit) 现在无法访问编辑器。 若要启用屏幕阅读器优化模式，请使用 Shift+Alt+F1
 * - VSCode增强: - [] (Edit) Cargo.toml, 编辑器组2 -> [] (Text) [package] <文件内容>
 */
fn _test_uia_print(walker: &UITreeWalker, element: &UIElement, level: usize) -> uiautomation::Result<()> {
    for _ in 0..level {
        print!(" ")
    }
    println!("- [{}] ({}) {}",
        element.get_classname()?, element.get_control_type()?, element.get_name()?);

    // 递归
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

// #endregion

// #region windows-rs uia 方式

/** 不用uia-rs crate，而是用windows crate 的尝试
 * 
 * 一些测试环境: Ob QQ Ndd (Notepad--) N (Notepad) VSC，均通过会标识 "可靠"
 */
#[cfg(target_os = "windows")]
pub fn get_uia_by_windows() -> Result<(), String> {
    use windows::{
        core::*,
        // Win32::Foundation::*,
        Win32::System::Com::*,
        Win32::UI::Accessibility::*,
        Win32::UI::WindowsAndMessaging::*,
    };

    unsafe {
        // 初始化 COM
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        // #region 窗口类

        println!("=== Windows 焦点元素信息获取 Demo ===\n");

        // 获取当前焦点窗口 (可靠)
        let hwnd = GetForegroundWindow();
        // if hwnd.0 == 0 { // 报错，无法解决
        //     println!("无法获取焦点窗口");
        //     CoUninitialize();
        //     return Err("无法获取焦点窗口".into());
        // }
        println!("焦点窗口句柄: {:?}", hwnd);

        // 获取窗口标题 (可靠, 通常是用 ` - ` 连接的一连串字符，Notepad和QQ则是同名)
        let mut title = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut title);
        if len > 0 {
            let title_str = String::from_utf16_lossy(&title[..len as usize]);
            println!("窗口标题: {}", title_str);
        }

        // 获取窗口类名 (可靠，几乎全Chrome_WidgetWin_1，Ndd是Qt5152QWindowIcon，N是Notepad)
        let mut class_name = [0u16; 256];
        let len = GetClassNameW(hwnd, &mut class_name);
        if len > 0 {
            let class_str = String::from_utf16_lossy(&class_name[..len as usize]);
            println!("窗口类名: {}\n", class_str);
        }

        // #endregion

        // #region 窗口内的元素类
        // 使用 UI Automation 获取焦点元素 (可靠)
        println!("--- UI Automation 信息 ---");
        let ui_automation: IUIAutomation = match CoCreateInstance(
            &CUIAutomation,
            None,
            CLSCTX_INPROC_SERVER,
        ) {
            Ok(ua) => ua,
            Err(e) => {
                CoUninitialize();
                println!("无法创建 UI Automation 实例: {:?}", e);
                return Err("无法创建 UI Automation 实例".into());
            }
        };

        // 获取焦点元素 (可靠)
        let element = match ui_automation.GetFocusedElement() {
            Ok(element) => {
                println!("成功获取焦点元素");
                element
            }
            Err(e) => {
                CoUninitialize();
                println!("无法获取焦点元素: {:?}", e);
                return Err("无法获取焦点元素".into());
            }
        };

        // 获取元素名称 (Ob Ndd 没有, Notepad是'文本编辑器'，VSC要开阅读模式，QQ是对面名/群名。
        // 非对话框中，可以选择别人的信息，获取的是整个信息的内容。
        // 因为这个元素不是窗口元素，而是窗口内的输入框的元素，名字缺失可以理解)
        if let Ok(name) = element.CurrentName() {
            println!("元素名称: {}", name);
        }

        // 获取控件类型 (几乎全Edit，Ndd是MenuBar，N是Document，与窗口类名相对应)
        if let Ok(control_type) = element.CurrentControlType() {
            println!("控件类型 ID: {}, Name: {}", control_type.0, get_control_type_name(control_type.0));
        }

        // 获取元素的自动化 ID (几乎全没有，Ndd是CCNotePad.nd_mainmenu)
        if let Ok(automation_id) = element.CurrentAutomationId() {
            println!("Automation ID: {}", automation_id);
        }

        // 获取元素类名 (几乎全没有，Ndd是QMenuBar，Notepad是RichEditD2DPT)
        if let Ok(class_name) = element.CurrentClassName() {
            println!("元素类名: {}", class_name);
        }

        // 获取元素边界矩形 (可靠)
        if let Ok(rect) = element.CurrentBoundingRectangle() {
            println!("边界矩形: Left={}, Top={}, Right={}, Bottom={}, Width={}, Height={}", 
                rect.left, rect.top, rect.right, rect.bottom,
                rect.right - rect.left, rect.bottom - rect.top
            );
        }

        // 其他属性 (可靠，在文本框聚焦后，这三个全true的)
        if let Ok(is_enabled) = element.CurrentIsEnabled() {
            println!("是否启用: {}", is_enabled.as_bool());
        }
        if let Ok(has_keyboard_focus) = element.CurrentHasKeyboardFocus() {
            println!("是否有键盘焦点: {}", has_keyboard_focus.as_bool());
        }
        if let Ok(is_keyboard_focusable) = element.CurrentIsKeyboardFocusable() {
            println!("是否可获得键盘焦点: {}", is_keyboard_focusable.as_bool());
        }

        // #endregion

        // #region 窗口内的元素类 - 模式

        println!("\n--- 文本/值 信息 ---");

        // 文本模式 (Text Pattern)，以获取选中内容和插入符位置 (可靠，Ndd常失灵)
        if let Ok(text_pattern) = element.GetCurrentPattern(UIA_TextPatternId) {
            let text_pattern: IUIAutomationTextPattern = match text_pattern.cast() {
                Ok(tp) => tp,
                Err(e) => {
                    println!("无法转换为 Text Pattern: {:?}", e);
                    CoUninitialize();
                    return Err("无法转换为 Text Pattern".into());
                }
            };

            // 获取选中的文本范围 (似乎不一定支持多光标，识别的是主光标区域)
            if let Ok(selection) = text_pattern.GetSelection() {
                let count = match selection.Length() {
                    Ok(c) => c,
                    Err(_) => { return Err("无法获取选中区域数量".into()); }
                };
                println!("选中区域数量: {}", count);

                for i in 0..count {
                    if let Ok(range) = selection.GetElement(i) {
                        if let Ok(text) = range.GetText(-1) {
                            println!("选中的文本 [{}]: {}", i, text);
                        }
                    }
                }
            }

            // 获取整个文档的文本 (不一定准，一般可用，VSC要开阅读模式，Ob哪怕开了源码模式也会排版混乱)
            if let Ok(document_range) = text_pattern.DocumentRange() {
                if let Ok(full_text) = document_range.GetText(50) {
                    println!("文档文本（前50字符）: {}", full_text);
                }
            }
        } else {
            println!("元素不支持文本模式 (Text Pattern)");
        }

        // 值模式 (Value Pattern) (大部分都没有，N和QQ有)
        if let Ok(value_pattern) = element.GetCurrentPattern(UIA_ValuePatternId) {
            let value_pattern: IUIAutomationValuePattern = match value_pattern.cast() {
                Ok(vp) => vp,
                Err(e) => {
                    CoUninitialize();
                    println!("无法转换为 Value Pattern: {:?}", e);
                    return Err("无法转换为 Value Pattern".into());
                }
            };
            if let Ok(value) = value_pattern.CurrentValue() {
                println!("元素值: {}", value);
            }
        } else {
            println!("元素不支持值模式 (Value Pattern)");
        }

        // #endregion

        CoUninitialize();
        Ok(())
    }
}

#[cfg(not(target_os = "windows"))]
pub fn get_uia_by_windows() -> Result<()> {
    log::error!("目前仅支持 windows 平台"); None
}

fn get_uia_by_windows_winname() -> String {
    #[cfg(not(target_os = "windows"))]
    {
        return "".to_string();
    }

    use windows::Win32::UI::WindowsAndMessaging::*;
    unsafe {
        // 获取当前焦点窗口 (可靠)
        let hwnd = GetForegroundWindow();

        // 获取窗口标题 (可靠, 通常是用 ` - ` 连接的一连串字符，Notepad和QQ则是同名)
        let mut title_flag = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut title_flag);
        if len > 0 {
            let title_str = String::from_utf16_lossy(&title_flag[..len as usize]);
            return title_str;
        }
        "".to_string()
    }
}

// 辅助函数：将控件类型 ID 转换为可读名称
fn get_control_type_name(control_type: i32) -> &'static str {
    match control_type {
        50000 => "Button",
        50001 => "Calendar",
        50002 => "CheckBox",
        50003 => "ComboBox",
        50004 => "Edit",
        50005 => "Hyperlink",
        50006 => "Image",
        50007 => "ListItem",
        50008 => "List",
        50009 => "Menu",
        50010 => "MenuBar",
        50011 => "MenuItem",
        50012 => "ProgressBar",
        50013 => "RadioButton",
        50014 => "ScrollBar",
        50015 => "Slider",
        50016 => "Spinner",
        50017 => "StatusBar",
        50018 => "Tab",
        50019 => "TabItem",
        50020 => "Text",
        50021 => "ToolBar",
        50022 => "ToolTip",
        50023 => "Tree",
        50024 => "TreeItem",
        50025 => "Custom",
        50026 => "Group",
        50027 => "Thumb",
        50028 => "DataGrid",
        50029 => "DataItem",
        50030 => "Document",
        50031 => "SplitButton",
        50032 => "Window",
        50033 => "Pane",
        50034 => "Header",
        50035 => "HeaderItem",
        50036 => "Table",
        50037 => "TitleBar",
        50038 => "Separator",
        _ => "Unknown",
    }
}

// #endregion

fn get_selected_by_uia() -> Option<String> {
    #[cfg(not(target_os = "windows"))]
    {
        return None;
    }
    
    use windows::{
        core::*,
        Win32::System::Com::*,
        Win32::UI::Accessibility::*
    };

    unsafe {
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        let ui_automation: IUIAutomation = match CoCreateInstance(
            &CUIAutomation,
            None,
            CLSCTX_INPROC_SERVER,
        ) {
            Ok(ua) => ua,
            Err(_) => { CoUninitialize(); return None; }
        };

        // 获取焦点元素 (可靠)
        let element = match ui_automation.GetFocusedElement() {
            Ok(element) => element,
            Err(_) => { CoUninitialize(); return None; }
        };

        // 文本模式 (Text Pattern)，以获取选中内容和插入符位置 (可靠，Ndd常失灵)
        let text_pattern = match element.GetCurrentPattern(UIA_TextPatternId) {
            Ok(tp) => tp,
            Err(_) => { CoUninitialize(); return None; }
        };

        // 类型转换
        let text_pattern: IUIAutomationTextPattern = match text_pattern.cast() {
            Ok(tp) => tp,
            Err(_) => { CoUninitialize(); return None; }
        };

        // 获取选中的文本范围 (似乎不一定支持多光标，识别的是主光标区域)
        if let Ok(selection) = text_pattern.GetSelection() {
            let count = match selection.Length() {
                Ok(c) => c,
                Err(_) => { CoUninitialize(); return None; }
            };

            for i in 0..count {
                if let Ok(range) = selection.GetElement(i) {
                    if let Ok(text) = range.GetText(-1) {
                        return Some(text.to_string());
                    }
                }
            }
        }

        CoUninitialize(); return None;
    }
}

/// 获取当前选中的文本
/// 
/// method: &str,
/// - 剪切板方式 (目前仅支持)
///   - 但事实上剪切板方式并不好用，缺点很多
///   - 需要在菜单召唤出来前完成ctrl+c的模拟按键 (而对于剪切版的识别可以延后执行)
///   - 需要等待剪切板更新，而这个时间不确定且通常较长，会影响用户体验
///   - 可能会覆盖用户原本的剪切板内容
///   - 无法判断当前是否有选中的文本 (有可能没有选中，这个通过剪切板难以判断)
/// 后续可能会用uia等其他方式
fn get_selected_by_clipboard() -> Option<String> {
    match text::clipboard::simulate_copy() {
        Ok(_) => {}
        Err(_) => { log::error!("Failed to simulate copy"); return None; }
    };
    // 模拟复制后，等待一小会儿，确保剪贴板内容更新。这个时间不确定 (根据系统不同可能不同，但通常不能太短)
    // 不过好在这里的复制时机是展开面板时，而不像我之前搞 autohotkey 或 kanata 那样用热键触发，慢得多
    std::thread::sleep(std::time::Duration::from_millis(100));
    let Ok(selected_text) = text::clipboard::clipboard_get_text() else {
        log::error!("Failed to get clipboard text");
        return None;
    };
    Some(selected_text)
}

#[tauri::command]
pub fn get_selected(method: &str) -> Option<String> {
    // let method = "clipboard";
    match method {
        "clipboard" => {
            return get_selected_by_clipboard();
        },
        "uia" => {
            return get_selected_by_uia();
        }
        _ => { log::error!("Unsupported method: {}", method); return None; }
    }
}

#[tauri::command]
pub fn get_info() -> Option<String> {
    let mut result_text = String::new();

    let clipboard_text: String = text::clipboard::clipboard_get_text().unwrap_or("failed".into());
    result_text.push_str(&format!("Clipboard Text: {}\n", clipboard_text));

    match text::clipboard::clipboard_get_info() {
        Ok(info) => {
            let mut result_text = String::new();
            result_text.push_str(&format!("Clipboard Info:\n{}\n", info));
            result_text.push_str(&format!("Clipboard Text: {}\n", clipboard_text));
            return Some(result_text);
        },
        Err(_) => {
            log::error!("Failed to get clipboard info");
        }
    }

    return Some(result_text);
}
