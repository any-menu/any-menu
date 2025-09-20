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

## 模板原README

```md
# Tauri + Vanilla TS

This template should help get you started developing with Tauri in vanilla HTML, CSS and Typescript.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
```
