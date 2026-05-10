/** 启动 http 服务器
 * 
 * 用于与 Obsidian 插件和浏览器扩展 进行通信、协作
 */

use axum::{
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tauri::{AppHandle, Emitter};
use tower_http::cors::{Any, CorsLayer};

use crate::file_config;

// 启动本地 HTTP 服务器
pub fn start_local_server(app_handle: AppHandle) {
    // 在后台单独的线程/任务中启动 HTTP 服务器，避免阻塞 Tauri 主线程
    tauri::async_runtime::spawn(async move { // 异步协程 (tokio)
        start_local_server2(app_handle).await;
    });
}
async fn start_local_server2(app_handle: AppHandle) {
    // 允许任意来源的跨域请求 (CORS)，因为 content script 是注入在各个网页中的
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/selection", post(handle_selection))
        .layer(cors)
        .with_state(app_handle);

    // 绑定本地端口
    let port: u16 = file_config::config_get(|c| c["config"]["server_port"].as_u64().map(|v| v as u16))
        .unwrap_or(None)
        .unwrap_or(41667);
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    log::info!("Listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}

// #region 路由分发

// -------- 与浏览器扩展的通信 ---------

#[derive(Debug, Deserialize, Serialize, Clone)]
struct SelectionPayload {
    source: Option<String>,
    text: String,
    html: String,
}
// Axum 的 handler，接收来自浏览器扩展的 POST 请求
async fn handle_selection(
    axum::extract::State(app_handle): axum::extract::State<AppHandle>,
    Json(payload): Json<SelectionPayload>,
) -> &'static str {
    log::info!("Received selection from browser extension: {:?}", payload.clone());

    // 接收到数据后，通过 Tauri 事件系统将其转发给 Tauri 的前端网页
    // 前端可以通过 listen("browser-selection-changed", ...) 来获取
    let _ = app_handle.emit("browser-selection-changed", payload);

    "OK"
}

// #endregion
