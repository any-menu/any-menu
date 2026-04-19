# 选中文本自动显示工具栏 - 方案设计与实现

## 功能概述

当用户在编辑器中选中文本时，自动弹出工具栏面板，提供快捷操作入口。该功能通过配置项 `auto_show_toolbar_on_select` 控制是否启用，默认关闭。

## 方案选择

### Obsidian 版本

**选定方案：监听 `selectionchange` 事件**

在浏览器/Electron 环境中，`document` 对象会在文本选区发生变化时触发 `selectionchange` 事件。Obsidian 基于 Electron，编辑器使用 CodeMirror 6 渲染，因此可以通过监听该事件来检测文本选中状态的变化。

**方案对比：**

| 方案 | 优点 | 缺点 |
|------|------|------|
| `selectionchange` 事件 | 原生支持、覆盖面广、无需侵入 CM6 内部 | 需要自行判断选区是否在编辑器内 |
| CodeMirror 6 `update` 监听 | 精准控制编辑器选区 | 需要访问 CM6 内部 API，侵入性强 |
| 轮询 `editor.getSelection()` | 实现简单 | 性能开销大，响应不及时 |

最终选择 `selectionchange` 方案，理由：
1. 使用 Obsidian 插件 API `plugin.registerDomEvent()` 注册，生命周期自动管理
2. 无需侵入 CodeMirror 6 内部实现，兼容性好
3. 参考了 [obsidian-note-toolbar](https://github.com/chrisgurney/obsidian-note-toolbar) 项目的类似实现思路

**实现细节：**

1. 在 `registerSelectionToolbar()` 中通过 `plugin.registerDomEvent(document, 'selectionchange', ...)` 注册监听
2. 使用 200ms 防抖避免频繁触发
3. 检查当前活动视图是否为 Markdown 编辑器
4. 有选中文本时，获取光标坐标并显示工具栏面板（仅 `['toolbar']`）
5. 选中文本被清除时，隐藏工具栏面板

### Tauri (App) 版本

App 版本中，工具栏窗口与用户正在编辑的应用是独立的进程和窗口。要实现"选中文本后自动弹出"，需要在操作系统层面实时检测其他应用中的文本选择事件。

**可能的方案：**

| 方案 | 可行性 | 说明 |
|------|--------|------|
| Windows UI Automation 事件订阅 | 中 | 通过 UIA `TextPattern` 的 `TextSelectionChanged` 事件，但并非所有应用都实现了该模式 |
| 全局鼠标钩子 + 定时轮询选区 | 中 | 监测鼠标拖拽结束后，通过 UIA 或剪贴板获取选中文本。灵敏度和准确性需要调优 |
| Accessibility API (macOS) | 中 | macOS 上通过 `AXSelectedTextChanged` 通知检测，但需要辅助功能权限 |
| 剪贴板监听 | 低 | 仅能检测到复制操作，不能检测选中 |

当前 App 版本的架构中，已有通过 Windows UIA (`src-tauri/src/uia.rs`) 获取光标位置和选中文本的能力，但属于主动查询方式（在显示窗口时调用 `get_caret`），尚未实现被动监听选区变化。

**当前状态：** App 版本暂未实现该功能，配置项 `auto_show_toolbar_on_select` 在 App 环境下预留但不生效。后续如需实现，建议从 UIA `TextSelectionChanged` 事件订阅或"全局鼠标钩子 + 轮询"方案入手。

## 配置说明

在 `global_setting.config` 中新增：

```typescript
auto_show_toolbar_on_select: boolean // 选中文本时是否自动显示工具栏，默认 false
```

用户可在设置面板中通过开关控制该功能。

## 文件变更

| 文件 | 变更说明 |
|------|----------|
| `src/Core/setting.ts` | 新增 `auto_show_toolbar_on_select` 配置项 |
| `src/Core/locales/en.ts` | 新增英文翻译 |
| `src/Core/locales/zh-cn.ts` | 新增中文翻译 |
| `src/Obsidian/src/panel/index.ts` | 新增 `registerSelectionToolbar()` 函数 |
| `src/Obsidian/src/main.ts` | 在 `onload()` 中调用注册函数 |
| `src/Obsidian/src/SettingTab.ts` | 新增设置项开关 |
