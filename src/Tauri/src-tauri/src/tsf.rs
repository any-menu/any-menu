/* Windows TSF (Text Services Framework)
 * 
 * TODO
 *   暂不可用，原因应该是未注册为 TSF 服务。Rust 弄这个好像很麻烦，参考也很少。
 *   未来也许可以参考 https://github.com/huanfeng/WindInput/blob/main/wind_tsf/src/HotkeyManager.cpp 项目，
 *   额外使用一个 cpp 项目进行辅助。
 * 
 *   但是哪怕使用成功 TSF 服务，对于是否能满足我的目标需求，很可能也不行。
 * 
 * 下面是 AI 生成的实验性代码，仅供实验用。
 */

// Cargo.toml 依赖:
// [dependencies]
// windows = { version = "0.52", features = ["Win32_UI_TextServices", "Win32_System_Com"] }

/*
use windows::{
    core::*,
    Win32::System::Com::*,
    // Win32::System::Ole::*,
    Win32::UI::TextServices::*,
    // Win32::Foundation::BOOL,
};

/// 获取当前文档全文以及当前选区范围（以字符索引表示）。
/// 返回 (全文字符串, (选区起始, 选区结束))。
pub fn get_full_text_and_selection(store: &ITextStoreACP) -> Result<(String, (i32, i32))> {
    unsafe {
        // 使用 -1 表示文档末尾（TS_ACTIVE_END 的等效值）
        let acp_end: i32 = -1;

        // 先尝试获取文档总长度（通过 GetText 返回的读取字符数）
        // 我们使用一个较大的缓冲区，然后根据实际读取长度截取
        let mut buffer = vec![0u16; 1024 * 1024]; // 1MB 缓冲区，足够大多数文档
        let mut read: u32 = 0;
        store.GetText(
            0,
            acp_end,
            &mut buffer,
            &mut read,
            &mut [],              // prgruninfo: 不需要运行信息
            std::ptr::null_mut(), // pcchruninforet
            std::ptr::null_mut(), // pacpnext
        )?;

        let full_text = String::from_utf16_lossy(&buffer[..read as usize]);

        // 获取当前选区
        let mut sel = TS_SELECTION_ACP {
            acpStart: 0,
            acpEnd: 0,
            style: TS_SELECTIONSTYLE {
                ase: TS_AE_NONE,
                fInterimChar: BOOL(0),
            },
        };
        let mut fetched: u32 = 0;
        store.GetSelection(0, &mut [sel], &mut fetched)?;
        let (start, sel_end) = (sel.acpStart, sel.acpEnd);

        Ok((full_text, (start, sel_end)))
    }
}

/// 替换指定范围的文本（从 start 到 end，不含 end）为 replacement。
pub fn replace_text_range(
    store: &ITextStoreACP,
    start: i32,
    end: i32,
    replacement: &str,
) -> Result<()> {
    unsafe {
        // 先选中要替换的范围
        let sel = TS_SELECTION_ACP {
            acpStart: start,
            acpEnd: end,
            style: TS_SELECTIONSTYLE {
                ase: TS_AE_NONE,
                fInterimChar: BOOL(0),
            },
        };
        store.SetSelection(&[sel])?;

        // 将 replacement 转换为 UTF-16 并插入到选区（替换）
        let replacement_utf16: Vec<u16> = replacement.encode_utf16().collect();
        store.InsertTextAtSelection(
            0,
            &replacement_utf16,
            std::ptr::null_mut(), // pacpstart
            std::ptr::null_mut(), // pacpend
            std::ptr::null_mut(), // pchange
        )?;
        Ok(())
    }
}

/// 设置当前选区为 [start, end)。
pub fn set_selection(store: &ITextStoreACP, start: i32, end: i32) -> Result<()> {
    unsafe {
        let sel = TS_SELECTION_ACP {
            acpStart: start,
            acpEnd: end,
            style: TS_SELECTIONSTYLE {
                ase: TS_AE_NONE,
                fInterimChar: BOOL(0),
            },
        };
        store.SetSelection(&[sel])?;
        Ok(())
    }
}

/// 调试函数：获取 TSF 环境，读取/修改当前焦点文档，并打印结果。
pub fn debug_tsf() -> Result<()> {
    unsafe {
        println!("========== TSF Debug Start111 ==========");

        // 1. 初始化 COM（单线程套间）
        let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
        // S_OK 和 S_FALSE 都表示成功（S_FALSE 表示已经初始化）
        if hr.is_err() {
            return Err(hr.into());
        }

        println!("========== TSF Debug Start222 ==========");

        // 2. 创建 TSF 线程管理器
        let thread_mgr: ITfThreadMgr =
            CoCreateInstance(&CLSID_TF_ThreadMgr, None, CLSCTX_INPROC_SERVER)?;
        let _client_id = thread_mgr.Activate()?;

        println!("========== TSF Debug Start333 ==========");

        // 3. 获取当前焦点文档管理器
        let doc_mgr_result = thread_mgr.GetFocus();
        match doc_mgr_result {
            Ok(doc_mgr) => println!("Got focus successfully"),
            Err(e) => {
                println!("GetFocus failed, HRESULT: {:?}", e);
                return Err(e.into());
            }
        }
        let doc_mgr: ITfDocumentMgr = thread_mgr.GetFocus()?;







        

        println!("========== TSF Debug Start444 ==========");

        // 4. 获取顶部上下文，并转换为 ITextStoreACP
        let context: ITfContext = doc_mgr.GetTop()?;
        let store: ITextStoreACP = context.cast()?;

        println!("========== TSF Debug Start ==========");

        // ---- 调用函数1：获取全文与选区 ----
        let (full_text, (sel_start, sel_end)) = get_full_text_and_selection(&store)?;
        println!("[1] Full text ({} chars): {:?}", full_text.len(), full_text);
        println!("    Selection range: [{}, {})", sel_start, sel_end);
        if sel_start < sel_end {
            let selected = &full_text[sel_start as usize..sel_end as usize];
            println!("    Selected text: {:?}", selected);
        }

        // ---- 调用函数2：替换选区内容 ----
        let replacement = "[[REPLACED]]";
        println!("[2] Replacing selection with '{}'...", replacement);
        replace_text_range(&store, sel_start, sel_end, replacement)?;

        // 重新获取全文与选区验证替换效果
        let (new_full_text, (new_start, new_end)) = get_full_text_and_selection(&store)?;
        println!(
            "    After replacement, full text ({} chars): {:?}",
            new_full_text.len(),
            new_full_text
        );
        println!("    New selection range: [{}, {})", new_start, new_end);

        // ---- 调用函数3：设置选区到文档开头前5个字符 ----
        let set_start = 0;
        let set_end = 5.min(new_full_text.len() as i32);
        println!("[3] Setting selection to [{}, {})...", set_start, set_end);
        set_selection(&store, set_start, set_end)?;

        // 验证最终选区
        let (_, (final_start, final_end)) = get_full_text_and_selection(&store)?;
        println!("    Final selection range: [{}, {})", final_start, final_end);

        println!("========== TSF Debug End ==========");

        // 5. 清理：停用线程管理器并反初始化 COM
        thread_mgr.Deactivate()?;
        CoUninitialize();
        Ok(())
    }
}
*/
