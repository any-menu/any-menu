use std::fs;

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
