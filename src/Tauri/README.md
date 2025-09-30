# Tauri版本

## 项目记录

创建模板

```bash
pnpm create tauri-app
# Project name: tauri-app
# Identifier: com.tauri.tauri
# Choose which language to use for your frontend (ts/js、rust、.NET): ts/js
# Choose your package mmanager (pnpm/yarn/npm/deno/bun): pnpm
# Choose your UI template (Vanilla/Vue/Svelte/React/Solid/Angular/Preact): Vanilla
# Choose your UI flavor (ts/js): ts
cd tauri-app
pnpm install

pnpm tauri dev # or pnpm tauri build
```

在不使用交叉编译的情况下，`pnpm tauri build` 会在 stc-tauri/target/debug或release/ 中生成可执行程序。
windows 环境生成 exe，Linux 环境生成 deb 等

## 快捷面板模板

(类似于 wox/utools/quicker/... 那样的模板)

依赖

```bash
pnpm tauri add global-shortcut # 用于全局快捷键
```

tauri.conf.json

```json
// v1文档: https://v1.tauri.app/v1/api/js/window/ https://v1.tauri.app/v1/api/config/
// v2文档: https://v2.tauri.app/reference/javascript/api/namespacewindow/#properties-6
"windows": [
  {
    "label": "main",
    "title": "any-menu",
    "width": 800,
    "height": 600,
    "visible": false,     // 初始隐藏
    "decorations": false, // 无标题栏和边框
    "skipTaskbar": true,  // 不在任务栏显示
    "alwaysOnTop": true,  // 始终置顶
    "resizable": false,   // 可拖拽设置大小
    "center": false,
    "transparent": true,  // 透明
    "shadow": false,      // 阴影
  }
],
```

权限

src-tauri/capabilities/default.json

```json
// 文档: https://v2.tauri.app/reference/acl/core-permissions/#default-permission-8
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "core:window:allow-show",
    "core:window:allow-hide",
    "core:window:allow-set-position",
    "core:window:allow-minimize",
    "core:window:allow-unminimize",
    "core:window:allow-set-focus",
    "core:window:allow-center",
    "core:window:allow-set-always-on-top",
    "core:window:allow-set-ignore-cursor-events",
    "log:default",
    "global-shortcut:allow-is-registered",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister"
  ]
}
```

## 模板原README

```md
# Tauri + Vanilla TS

This template should help get you started developing with Tauri in vanilla HTML, CSS and Typescript.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
```
