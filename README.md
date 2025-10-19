<div align="center" style="margin-bottom: 20px">
  <img width="35%" src="./src/Tauri/src-tauri/icons/icon.png">
</div>

[中文](./README.md) | [English](./docs/README.github.md)

# AnyMenu —— InputMethod Assistant / Editor Assistant

**AnyMenu —— 一款强大的输入法助手/编辑器助手**

（开发中，会逐步放出 obsidian 版、windows app 版、其他平台 app 版）

## 使用/教程

### 使用演示/教程

当你配置好词典后，就可以像下面这样用了:

![](./docs/assets/PixPin_2025-10-04_09-45-58.gif)

![](./docs/assets/PixPin_2025-10-04_09-38-24.gif)

(obsidian默认快捷键Alt+S，app默认快捷键Alt+A，快捷键均可在设置面板中调整)
(暂时他两的快捷键不同是同时安装快捷键会冲突)

(obsidian也可以按ctrl+p输入anymenu，用命令来调出，但不建议，命令方式太慢)

### 词典教程

![](./docs/assets/cloud_dict.png)

- (脚本会被认作也是一种特殊的词典)
- 见 [自定义词典](./docs/zh/dict/)
  - [1. 在线下载 AnyMenu 词典](./docs/zh/dict/1.%20在线下载词典.md)
  - [2. 手动下载 AnyMenu 词典](./docs/zh/dict/2.%20手动下载词典.md) (如在离线环境下使用 / 出现网络问题 / 在线市场无法使用 / 下载未经审核的第三方词典)
  - [3. 编写 AnyMenu 词典](./docs/zh/dict/3.%20编写词典.md)
  - [4. 上传自定义的 AnyMenu 词典](./docs/zh/dict/4.%20上传词典.md)

## 什么是AnyMenu? 

### 产品定位

定位: 专注于文本编辑环境的、跨平台、轻量、快速、可自定义的 **输入法伴侣/编辑器编辑伴侣**

用于增强输入法或编辑器编辑功能，快捷生成模板、自动补全

多平台: 支持作为 Obsidian 插件使用、也支持作为跨平台的独立软件使用。

### 亮点

都已经有像 quicker 和 utools 这样的工具了，与同类产品相比，优势是什么？见下，与 [有哪些快捷输入/自动补全方案？](./docs/zh/对比.md)

- 零门槛
  - 不是输入链最短最快的 (最快的是输入法短语，以及热字符串的方案，但有门槛)
    但绝对是使用最符合思维逻辑、最易用的
  - 可以搭配任何输入法方案、任何输入法软件
  - 易用的、快速的、强大的、高自定义的
- 跨平台
  - 如果有空，将会支持 Windows/Linux 平台、Obsidian、VSCode 插件

## 更多功能/设计/使用场景

(这个部分是我开发之前写好的产品设计，不一定都做出来了。后续我有空更新文档时，会再去写哪些还在TODO中)

这里将功能分成多个类别/抽象类别

### 输入文本/转换文本

提供快捷输入功能

- 自定义可视化文本预设菜单
- 字段来源
  - 自带一些包
  - 可以在线下载一些包 (像 ob i18n 那样)
  - obsidian 可以通过 Menu 文件夹来自定义菜单 (像 ob Template 那样)
- 有趣字段
  - Emoji, 颜文字, Color, 脚本的动态字段 (时间和日期等)
- 调用唤出
  - Ctrl+右键 / `/` 唤出 / `Alt+A`
- 支持脚本/动态部分/二次开发与扩展
  - 时间、日期等, js 脚本
- GUI设计
  - 支持：按key/value值进行搜索 (支持无key字段)
  - 支持：快捷编辑
- 性能
  - 可以使用高超的缓存技术进行优化，即使是大量文本也不会全部加载到内存中 (可设置内存大小?)
    类似于使用 redis 优化 mysql 的做法
  - 多层检索方式并用：前缀树 匹配前缀、哈希 匹配完整、倒序 匹配模糊
- i18n 那个逻辑能做片段/css市场？
- AI/GPT (以插件形式提供)

### 带 Editor 时额外支持的功能 (待开发)

带Editor的情况: 限制: 需要能获取到所属环境的编辑器对象 (通过插件/hack)，否则不支持该项功能

如 Obsidian、VSCode、浏览器扩展，均可使用插件获取到内部的编辑器对象，从而做到输入法或软件所无法做到的事情

- 支持: 类似 obsidian 的各种命令。推荐集成: 蚕子的增强编辑，Editing Toolbar 的功能、VSCode的强大菜单
- 可以将 Obsidian 命令放到菜单里 (类似 Editor Toolbar 的自定义工具栏)

### Mini Editor 功能 (待开发)

会自带一个简易的Mini Editor

- 使用逻辑: 选中一段文本 -> 使用2号全局快捷键 -> 呼出Mini Editor且上面有选中的文本 -> 编辑过后会自动替换
- 用于在一些简易的Editor临时使用更强大的功能。如在 notepad、notepad-- 等软件上使用多光标
- 用于局部文本的编辑: 如将选中文本的某一文本替换成另一文本，这样不会影响全局
- 临时备忘录、闪念笔记等

### 一些 Obsidian 插件的部分功能

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

### 雾凇拼音功能

- 雾凇拼音功能 https://github.com/iDvel/rime-ice
  相较于雾凇而言：不用记 (搜索框)、更适合低频的输入内容、适合使用所有输入法的人群。但如果你笔记熟练使用雾凇，通常还是使用输入法更快
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

## FAQ

### 8MB的插件体积似乎有点大 && 我使用的不是全拼拼音

251013版本中，其中有 8MB 都源于 pinyin 库，这个库用于支持拼音搜索，包含了庞大的字典文件

如果你不需要拼音搜索这一功能，可以将相关逻辑删除后重新编译，即可简化体积。否则这部分大小是不可避免的

(后续可能会单独编译一个不支持拼音搜索的mini版本，在该版本中，你仍可以往自定义词典中添加拼音索引来支持拼音搜索)

如果你使用的不是全拼，你可以修改这部分的逻辑，转换为自己的输入法方案。如各种双拼或形码

## 项目/灵感来源

- 灵感来源
  - 以前在用 AutoHotKey、Kanata、RIME/搜狗 自定义词典 时，就想做一个独立于输入法之前外的输入法增强辅助软件。因为当时我还在切换使用不同的输入法并分别去自定义他们，我并不希望我花了大精力在某个输入法软件上后，后期因为要换输入法而重新配置
  - 用各种笔记软件和IDE时你会发现他们一些相同功能的快捷键并不相同，想要较为统一的体验则需要设置成统一的快捷键时。当时就想做一个独立于编辑器之外的编辑器辅助软件，或 MiniEditor 全局或临时局部来提供统一的快捷键和编辑体验。
  - 在使用并做 Ob 的工具栏和菜单时，就想过这个功能应该可以把他提升为一个独立的模块，甚至是可用于各种编辑器软件上。而不是各个编辑器使用一个不同的快捷键和菜单 (obsidian/typora/思源/vscode等)。而这也是该项目名字的由来: You can use the same **menu** on **any** different editing / input method software. (你可以在任何不同的编辑器/输入法软件上使用同一个菜单)
  - 最后，在2025年9月，我于 AnyBlock 的 Obsidian Pro 版本的研发过程中。在开发了 AnyBlock 的编辑器菜单后，我又一次在想……这应当是一个独立功能。(这也是部分项目命名的原因)
- 于是乎，在历史的想法的积累，以及最近项目的导火索的作用下，我开发了这个软件 —— 一个专注于输入法/编辑器辅助增强体验的独立工具

## 鸣谢

(灵感/词典/代码参考，帮助)

- [rime-ice](https://github.com/iDvel/rime-ice) 借用了其 opencc/ 下的 emoji 和 others 字典
- [kanata](https://github.com/jtroo/kanata) 意义在于让我决定用rust作为后端语言开发此项目
- [obsidian-i18n](https://github.com/Obsidian-Forge/obsidian-i18n/) 提供了低成本 (使用gitee服务器而非自建服务器) 的云词库设计
- [any-block pro](https://github.com/any-block/any-block/) 我早期写的多级菜单雏形代码
