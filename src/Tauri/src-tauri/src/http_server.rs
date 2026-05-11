/** 启动 http 服务器
 * 
 * 用于与 Obsidian 插件和浏览器扩展 进行通信、协作
 */

use axum::{
    extract::{ws::{WebSocket, WebSocketUpgrade}, State},
    response::IntoResponse,
    routing::{get, post},
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
        .route("/new_websocket", get(route_new_websocket))
        .route("/selection", post(route_selection))
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

// #region 路由分发1

/** 路由分发1
 * 
 * 获取一个可用端口返回，并后续使用该端口与请求方建立 WebSocket 连接
 */
async fn route_new_websocket(
    State(app_handle): State<AppHandle>,
) -> Json<u16> {
    let mut listener_opt = None;
    let mut allocated_port = 0;

    // 优先尝试 41668 ~ 41800 范围内的端口
    for port in 41668..=41800 {
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        if let Ok(l) = tokio::net::TcpListener::bind(addr).await {
            listener_opt = Some(l);
            allocated_port = port;
            break; // 绑定成功，跳出循环
        }
    }

    // 如果指定范围内的端口全都被占用了，作为兜底，让系统随机分配
    let listener = match listener_opt {
        Some(l) => l,
        None => {
            log::warn!("Ports 41668-41800 are all in use, falling back to random port");
            let addr = SocketAddr::from(([127, 0, 0, 1], 0));
            let l = tokio::net::TcpListener::bind(addr).await.expect("Failed to bind random port");
            allocated_port = l.local_addr().unwrap().port();
            l
        }
    };

    log::info!("Allocated new websocket port: {}", allocated_port);

    // 在后台启动一个新的小规模 Axum 路由，专门用于接收这个端口的 WebSocket 连接
    tauri::async_runtime::spawn(async move {
        let ws_app = Router::new()
            .route("/", get(route_websocket_upgrade))
            .with_state(app_handle);

        // 启动该端口的监听服务
        if let Err(e) = axum::serve(listener, ws_app).await {
            log::error!("WebSocket server on port {} stopped: {}", allocated_port, e);
        }
    });

    // 返回分配好的端口给请求方
    Json(allocated_port)
}

/** WebSocket 升级请求处理器 */
async fn route_websocket_upgrade(
    ws: WebSocketUpgrade,
    State(app_handle): State<AppHandle>,
) -> impl IntoResponse {
    // 将协议升级为 WebSocket，并移交给实际的处理函数
    ws.on_upgrade(move |socket| route_websocket(socket, app_handle))
}

/// 实际处理 WebSocket 消息读写的逻辑
async fn route_websocket(mut socket: WebSocket, app_handle: AppHandle) {
    log::info!("WebSocket connection established");
    
    // 循环等待接收消息
    while let Some(msg) = socket.recv().await {
        match msg {
            Ok(axum::extract::ws::Message::Text(text)) => {
                log::info!("Received WS message: {}", text);
                // 示例：将接收到的消息转发给 Tauri 前端
                let _ = app_handle.emit("websocket-message-received", text.as_str());
            }
            Ok(axum::extract::ws::Message::Close(_)) => {
                log::info!("WebSocket connection closed");
                break;
            }
            Err(e) => {
                log::error!("WebSocket error: {}", e);
                break;
            }
            _ => {} // 处理其他类型的消息（Binary, Ping, Pong 等）
        }
    }
}

// #endregion

// #region 路由分发2

/** 路由分发2
 * 
 * 来自浏览器扩展的信息通知 (post请求)
 */
async fn route_selection(
    axum::extract::State(app_handle): axum::extract::State<AppHandle>,
    Json(payload): Json<SelectionPayload>,
) -> &'static str {
    log::info!("Received selection from browser extension: {:?}", payload.clone());

    // 接收到数据后，通过 Tauri 事件系统将其转发给 Tauri 的前端网页
    // 前端可以通过 listen("browser-selection-changed", ...) 来获取
    let _ = app_handle.emit("browser-selection-changed", payload);

    "OK"
}

/** RPC 消息结构体
 * 
 * 通用。浏览器扩展、Obsidian 插件、AI Agent、自动化脚本 等等均可使用
 */
#[derive(Debug, Deserialize, Serialize, Clone)]
struct SelectionPayload {
    /// 可选的来源标识，例如 "BROWSER_EXTENSION"、"OBSIDIAN_PLUGIN" 等
    source: Option<String>,
    /// 选中的文本内容
    text: String,
    /// 选中的 HTML 内容
    html: String,
}

// #endregion
