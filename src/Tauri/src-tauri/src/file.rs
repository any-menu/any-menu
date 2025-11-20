use std::fs;
use std::path::Path;

#[tauri::command]
pub fn read_file(path: &str) -> Option<String> {
    match fs::read_to_string(&path) {
        Ok(content) => {
            Some(content)
        }
        Err(e) => {
            log::error!("读取文件 {} 时出错: {}", path, e);
            None
        }
    }
}

/// 读取目录下的所有文件路径，并返回文件路径列表
/// 似乎不会改变目录的形式 (绝对/相对路径)
#[tauri::command]
pub fn read_folder(path: &str) -> Option<Vec<String>> {
    let Ok(entries) = fs::read_dir(path) else {
        log::error!("读取目录 {} 时出错: 目录不存在或无法访问", path);
        return None;
    };

    let mut file_paths = Vec::new(); // 文件路径列表
    for entry in entries {
        let Ok(entry) = entry else { continue }; // 跳过无法读取的条目
        let file_path = entry.path();
        if !file_path.is_file() { continue; } // 跳过目录
        let Some(path_str) = file_path.to_str() else { continue; }; // 跳过无法转换为字符串的路径
        file_paths.push(path_str.to_string());
    }

    Some(file_paths)
}

#[tauri::command]
pub fn create_file(path: &str, content: &str) -> bool {
    match fs::write(path, content) {
        Ok(_) => true,
        Err(e) => {
            log::error!("创建文件 {} 时出错: {}", path, e);
            false
        }
    }
}

#[tauri::command]
/// 写入内容到指定文件。
/// 如果目录不存在，则会创建目录
/// 如果文件不存在，则会创建新文件。
/// 如果文件已存在，则会覆盖所有内容 (使用参数三为true，则变为追加模式)
/// 
/// # Arguments
///
/// * `path` - 文件的完整路径
/// * `content` - 要写入的字符串内容
/// * `isappend` - 可选参数，是否以追加模式写入，默认为覆盖模式
/// 
/// # Returns
/// 
/// * `bool` - 操作成功返回 `true`，失败则返回 `false`
pub fn write_file(path: &str, content: &str, isappend: bool) -> bool {
    use std::io::Write;

    let file_path = Path::new(path);

    // 获取文件所在的父目录
    if let Some(parent_dir) = file_path.parent() {
        // 如果父目录不存在，则使用 create_dir_all 创建它
        // create_dir_all 会递归创建所有不存在的父目录
        if let Err(e) = fs::create_dir_all(parent_dir) {
            log::error!("创建目录 {} 时出错: {}", parent_dir.display(), e);
            return false;
        }
    }

    // 写入文件
    log::info!("模式判断, {:?}", isappend);
    let result = if isappend {
        // 追加模式
        log::info!("追加模式");
        fs::OpenOptions::new()
            .create(true) // 如果文件不存在则创建
            .append(true)
            .open(file_path)
            .and_then(|mut file| file.write_all(content.as_bytes()))
    } else {
        // 覆盖模式（fs::write 的行为）
        log::info!("覆盖模式");
        fs::write(file_path, content)
    };

    match result {
        Ok(_) => true,
        Err(e) => {
            log::error!("写入文件 {} 时出错: {}", path, e);
            false
        }
    }
}

#[tauri::command]
pub fn delete_file(path: &str) -> bool {
    match fs::remove_file(path) {
        Ok(_) => true,
        Err(e) => {
            log::error!("删除文件 {} 时出错: {}", path, e);
            false
        }
    }
}
