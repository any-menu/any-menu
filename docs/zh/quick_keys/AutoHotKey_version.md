# AnyCaps 的 AutoHotKey 版本使用方法

资源位置: [any-capsLock](https://github.com/any-menu/any-capslock)

## Usage (使用方式)

ahk 脚本方式使用:

- 自行去下载 AutoHotKey 软件，需要下载 **1.1 版本**，而**不是新版**
  - (旧版! 如果你想使用新版你也可以仿照旧版的程序和新版的ahk网站教程去自行编写)
  - 你也可以使用仓库 AutoHotKey/Installer 目录下，所保存的 ahk exe 安装包
- 找到仓库 AutoHotKey/ScriptAndExe 目录下的 `.ahk`，右键使用 ahk 打开，或双击即可使用

exe 可执行程序方式使用:

- 找到 AutoHotKey/ScriptAndExe 目录下的 `.exe`，双击即可使用

> [tips]
> 如果你希望在游戏等环境下运行，需要使用管理员权限打开 exe。
> 如果不成功，则先运行游戏，再管理员权限打开。

## For Developer (开发者备注)

封装成exe的方法：

1. cd到ahk路径/Compiler
2. 执行：`Ahk2Exe.exe xxx.ahk xxx.exe` (或者双击打开Ahk2Exe可视化使用也可以)

封装成exe的作用：

1. 方便分享
2. 提供运行权限（方便使用管理员权限运行，以免在一些应用中无法使用）
