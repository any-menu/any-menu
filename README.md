<div align="center" style="margin-bottom: 20px">
  <img width="35%" src="./src/Tauri/src-tauri/icons/icon.png">
</div>

[中文](./README.md) | [English](./docs/README.github.md)

# AnyMenu —— InputMethod Assistant / Editor Assistant

**AnyMenu —— 一款强大的输入法助手/编辑器助手**

（开发中）

使用 - 基本演示:

![](./docs/assets/PixPin_2025-10-04_09-45-58.gif)

![](./docs/assets/PixPin_2025-10-04_09-38-24.gif)

使用 - 自定义词典:

见 [自定义词典](./docs/zh/自定义词典.md) / [dict](./docs/README.dict.md)

## 什么是AnyMenu? 产品定位

定位: 专注于文本编辑环境的、跨平台、轻量、快速、可自定义的 **输入法伴侣/编辑器编辑伴侣**

用于增强输入法或编辑器编辑功能，快捷生成模板、自动补全

多平台: 支持作为 Obsidian 插件使用、也支持作为跨平台的独立软件使用。

都已经有像 quicker 和 utools 这样的工具了，这个东西有什么优势？见 [有哪些快捷输入/自动补全方案？](./docs/zh/对比.md)

## 功能 - 设计

(这个部分是我开发之前写好的产品设计，不一定都做出来了。后续我有空更新文档时，会再去写哪些还在TODO中)

- 零门槛
  - 不是输入链最短最快的 (最快的是输入法短语，以及热字符串的方案，但有门槛)
    但绝对是使用最符合思维逻辑、最易用的
  - 可以搭配任何输入法方案、任何输入法软件
  - 易用的、快速的、强大的、高自定义的
- 跨平台
  - 如果有空，将会支持 Windows/Linux 平台、Obsidian、VSCode 插件
- 功能
  - 自定义可视化文本预设菜单
  - 字段来源
    - 自带一些包
    - 可以在线下载一些包 (像 ob i18n 那样)
    - obsidian 可以通过 Menu 文件夹来自定义菜单 (像 ob Template 那样)
  - 有趣字段
    - Emoji
    - Color
    - 颜文字
    - 支持动态字段: 如时间和日期等
  - 调用唤出
    - Ctrl+右键
    - `/` 唤出
  - 动态部分
    - 时间、日期等
    - 用户自定义 Lua/js/py 脚本
  - 二次开发与扩展
    - 用户自定义 Lua/js/py 脚本
  - GUI设计
    - 支持：按key/value值进行搜索 (支持无key字段)
    - 支持：快捷编辑
  - 性能
    - 可以使用高超的缓存技术进行优化，即使是大量文本也不会全部加载到内存中 (可设置内存大小?)
      类似于使用 redis 优化 mysql 的做法
    - 多层检索方式并用：前缀树 匹配前缀、哈希 匹配完整、倒序 匹配模糊
  - 带Editor的情况
    - 限制: 需要能获取到所属环境的编辑器对象 (通过插件/hack)，否则不支持该项功能
      如 Obsidian、VSCode、浏览器扩展，均可使用插件获取到内部的编辑器对象，从而做到输入法或软件所无法做到的事情
    - 支持: 类似 obsidian 的各种命令。推荐集成: 蚕子的增强编辑，Editing Toolbar 的功能、VSCode的强大菜单
  - 自带一个简易的Mini Editor
    - 使用逻辑: 选中一段文本 -> 使用2号全局快捷键 -> 呼出Mini Editor且上面有选中的文本 -> 编辑过后会自动替换
    - 用于在一些简易的Editor临时使用更强大的功能。如在 notepad、notepad-- 等软件上使用多光标
    - 用于局部文本的编辑: 如将选中文本的某一文本替换成另一文本，这样不会影响全局
    - 临时备忘录、闪念笔记等
  - 雾凇拼音功能 https://github.com/iDvel/rime-ice
    相较于雾凇而言：不用记 (key-value系统)、更适合低频的输入内容、适合使用所有输入法的人群。但如果你笔记熟练使用雾凇，通常还是使用输入法更快
    - 拆字反查（uU+拼音），**拆字辅码**（拼音+`+拆字辅码）
    - 自整理的 Emoji
    - 以词定字（左右中括号：[、]）
    - Unicode（U+Unicode 码位）
    - 数字、人民币大写（R+数字）
    - 日期、时间、星期（详见方案 /date_translator 节点）
    - 农历（转写：N+八位数字；获取当前农历：全拼nl，双拼lunar）
    - 简易计算器（cC+算式）
    - 特殊符号、字符输入（全拼v+首字母缩写；双拼V+首字母缩写）
    - 拼音纠错（模糊音）
- 逻辑复用的扩展功能
  - i18n 那个逻辑能做片段/css市场？
- ai

## 功能 - Obsidian版本可代替插件

如果你在用以下的一些 Obsidian 插件，说不定该插件功能也适合你 (部分功能重叠)

特别是如果你 **同时使用多个编辑器去编辑你的文档时**，你希望在多个编辑器都能获得相同的体验

- 工具栏
  - Editor Toolbar
- 斜杠召唤插入菜单
  - [Slash Commander](https://github.com/alephpiece/obsidian-slash-commander) ⭐89
  - Slash snippets
- 插入内容
  - Emoji Toolbar
- 自动补全
  - LaTex Suit: 虽然初印象他是用来自动补全公式的，但其实他也能自动补全其他东西。
    你可以在设置面板去自定义 snippets
  - Linter: 虽然初印象他是用来格式化文档的，但他设置面板中，也能支持一个功能:
    "自定义命令"/"自定义正则表达式替换"
  - Template: 可以快速创建文件并写入模板
  - QuickAdd: 支持Template/Capture/Macros，其中 Template 就是可以创建模板
- 非Obsidian
  - Windows自带的 `Win+.` 他那个所支持的内容太少了，也不能自定义

## 来源

> 本身来自于 AnyBlock 的 Obsidian Pro 版本的研发过程中。
> 在开发编辑器菜单后，我觉得这个功能应当是一个独立功能。
> 并且很久之前，我也有这么一个产品设计，但一直鸽了。现在也一并做了吧
