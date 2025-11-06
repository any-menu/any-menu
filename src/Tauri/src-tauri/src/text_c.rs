use std::ffi::OsString;
use std::mem::{size_of, zeroed};
use std::os::windows::ffi::OsStringExt;
use std::ptr::{self, null_mut};
use winapi::shared::minwindef::{HGLOBAL, UINT};
// use winapi::shared::windef::HDROP;
// use winapi::um::shellapi::{DragQueryFileW, DragFinish};
use winapi::um::winbase::{GlobalLock, GlobalSize, GlobalUnlock};
// use winapi::um::wingdi::{BITMAPINFOHEADER, CF_DIB};
use winapi::um::winuser::*;

// /// 主函数，执行所有操作
// fn main() {
//     if let Err(e) = get_and_print_all_clipboard_info() {
//         eprintln!("\n发生严重错误: {}", e);
//     }
// }

/// 获取并打印剪贴板中所有能解析的信息
pub fn get_and_print_all_clipboard_info() -> Result<(), String> {
    println!("==================================================");
    println!("        开始读取当前剪贴板的详细信息");
    println!("==================================================");

    unsafe {
        // 1. 打开剪贴板
        if OpenClipboard(ptr::null_mut()) == 0 {
            return Err("无法打开剪贴板。可能被其他程序占用。".to_string());
        }

        // 2. 遍历所有可用格式
        let mut current_format = EnumClipboardFormats(0);
        if current_format == 0 {
            println!("剪贴板为空，或无法枚举格式。");
            CloseClipboard();
            return Ok(());
        }

        while current_format != 0 {
            print_format_details(current_format);
            current_format = EnumClipboardFormats(current_format);
        }

        // 3. 关闭剪贴板
        CloseClipboard();
    }
    
    println!("\n==================================================");
    println!("                 信息读取完毕");
    println!("==================================================");
    Ok(())
}

/// 根据格式ID，打印该格式的详细信息
unsafe fn print_format_details(format: UINT) {
    let format_name = get_format_name(format);
    println!("\n--- 格式ID: {:<5} | 名称: {} ---", format, format_name);

    // 获取该格式的数据句柄
    let handle = GetClipboardData(format);
    if handle.is_null() {
        println!("    -> 无法获取此格式的数据句柄。");
        return;
    }

    // 根据不同的格式类型，调用不同的解析函数
    match format {
        CF_UNICODETEXT => print_as_text(handle),
        // CF_HDROP => print_as_file_list(handle),
        // CF_DIB => print_as_dib_info(handle),
        _ => {
            // 对于其他格式，特别是自定义格式，尝试读取其原始字节
            // HTML格式是一个常见的自定义格式
            if format_name.contains("HTML Format") {
                print_as_html(handle);
            } else {
                print_as_raw_bytes(handle);
            }
        }
    }
}

// ========== 具体格式的解析函数 ==========

/// 解析并打印文本内容 (CF_UNICODETEXT)
unsafe fn print_as_text(handle: HGLOBAL) {
    let data_ptr = GlobalLock(handle);
    if data_ptr.is_null() {
        println!("    -> 无法锁定内存以读取文本。");
        GlobalUnlock(handle);
        return;
    }

    let mut len = 0;
    let mut p_char = data_ptr as *const u16;
    while *p_char != 0 {
        len += 1;
        p_char = p_char.add(1);
    }
    
    let slice = std::slice::from_raw_parts(data_ptr as *const u16, len);
    match String::from_utf16(slice) {
        Ok(text) => println!("    内容 (Unicode 文本):\n```\n{}\n```", text),
        Err(_) => println!("    -> 无法将数据解析为有效的 UTF-16 文本。"),
    }

    GlobalUnlock(handle);
}

// /// 解析并打印文件列表 (CF_HDROP)
// unsafe fn print_as_file_list(handle: HGLOBAL) {
//     let hdrop = handle as HDROP;

//     // 获取文件总数
//     let file_count = DragQueryFileW(hdrop, 0xFFFFFFFF, ptr::null_mut(), 0);
//     if file_count == 0 {
//         println!("    -> CF_HDROP 句柄有效，但报告文件数量为 0。");
//         return;
//     }
    
//     println!("    内容 (文件列表)，共 {} 个项目:", file_count);

//     // 遍历并获取每个文件的路径
//     for i in 0..file_count {
//         let mut buffer: [u16; MAX_PATH] = [0; MAX_PATH];
//         let len = DragQueryFileW(hdrop, i, buffer.as_mut_ptr(), buffer.len() as u32);
//         if len > 0 {
//             let path = OsString::from_wide(&buffer[..len as usize]);
//             println!("      - {}", path.to_string_lossy());
//         }
//     }
//     // 注意：CF_HDROP 的句柄不需要 GlobalUnlock，而是 DragFinish
//     // 但由于我们是读取，不是拖放操作的发起者，不应调用 DragFinish
// }

// /// 解析并打印图片信息 (CF_DIB)
// unsafe fn print_as_dib_info(handle: HGLOBAL) {
//     let data_ptr = GlobalLock(handle);
//     if data_ptr.is_null() {
//         println!("    -> 无法锁定内存以读取图片信息。");
//         GlobalUnlock(handle);
//         return;
//     }
    
//     // DIB 数据以 BITMAPINFOHEADER 结构开始
//     let header = &*(data_ptr as *const BITMAPINFOHEADER);
    
//     println!("    内容 (设备无关位图信息):");
//     println!("      - 结构大小: {} 字节", header.biSize);
//     println!("      - 图像宽度: {} 像素", header.biWidth);
//     println!("      - 图像高度: {} 像素", header.biHeight);
//     println!("      - 颜色平面: {}", header.biPlanes);
//     println!("      - 每像素位数 (bpp): {}", header.biBitCount);
//     println!("      - 压缩类型: {}", header.biCompression);
//     println!("      - 图像大小: {} 字节", header.biSizeImage);

//     GlobalUnlock(handle);
// }

/// 解析并打印HTML内容 (自定义格式 "HTML Format")
unsafe fn print_as_html(handle: HGLOBAL) {
    let data_ptr = GlobalLock(handle);
    if data_ptr.is_null() {
        println!("    -> 无法锁定内存以读取HTML内容。");
        GlobalUnlock(handle);
        return;
    }

    // HTML格式的数据是ANSI文本，不是Unicode
    let size = GlobalSize(handle);
    let slice = std::slice::from_raw_parts(data_ptr as *const u8, size);
    
    // 尝试将其作为ANSI文本（使用系统默认代码页）进行转换
    // 注意：这里用 to_string_lossy，因为我们不知道确切的编码，但这通常有效
    match std::str::from_utf8(slice) {
        Ok(text) => {
            println!("    内容 (HTML 原始代码):\n```html\n{}\n```", text.trim_end_matches('\0'));
        },
        Err(_) => println!("    -> 无法将数据解析为有效的 UTF-8 文本 (可能为其他编码)。"),
    }
    
    GlobalUnlock(handle);
}

/// 对于未知但有数据的格式，打印其原始字节大小
unsafe fn print_as_raw_bytes(handle: HGLOBAL) {
    let size = GlobalSize(handle);
    if size > 0 {
        println!("    -> 这是一个自定义或未知格式，包含 {} 字节的原始数据。", size);
    } else {
        println!("    -> 这是一个自定义或未知格式，没有数据或大小为0。");
    }
}


/// 辅助函数：根据格式ID获取可读名称
#[cfg(target_os = "windows")]
unsafe fn get_format_name(format: u32) -> String {
    match format {
        CF_TEXT => "CF_TEXT (ANSI Text)".to_string(),
        CF_BITMAP => "CF_BITMAP (Bitmap)".to_string(),
        CF_DIB => "CF_DIB (Device-Independent Bitmap)".to_string(),
        CF_DIBV5 => "CF_DIBV5 (V5 DIB)".to_string(),
        CF_UNICODETEXT => "CF_UNICODETEXT (Unicode Text)".to_string(),
        CF_HDROP => "CF_HDROP (File List)".to_string(),
        CF_RIFF => "CF_RIFF (Audio)".to_string(),
        CF_WAVE => "CF_WAVE (WAVE Audio)".to_string(),
        CF_TIFF => "CF_TIFF (TIFF Image)".to_string(),
        CF_OEMTEXT => "CF_OEMTEXT (OEM Text)".to_string(),
        CF_PALETTE => "CF_PALETTE (Color Palette)".to_string(),
        _ => {
            let mut name_buf: [u16; 256] = [0; 256];
            let len = GetClipboardFormatNameW(format, name_buf.as_mut_ptr(), name_buf.len() as i32);
            if len > 0 {
                format!("自定义格式: {}", String::from_utf16_lossy(&name_buf[..len as usize]))
            } else {
                "未知的非标准格式".to_string()
            }
        }
    }
}
