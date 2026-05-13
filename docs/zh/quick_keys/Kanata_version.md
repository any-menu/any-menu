# AnyCaps 的 AutoHotKey 版本使用方法

资源位置: [any-capsLock](https://github.com/any-menu/any-capslock)

## Usage (使用方式)

kbd 脚本方式使用:

- 自行去下载 Kanata 软件，该软件 github 开源
- 将 .kbd 文件放置于 Kanata 的可执行文件同目录下，然后双击运行 kanata 程序即可
  - 推荐使用 gui_cmd_allowed 的版本运行

> 如果你是windows，直接用 exe 是可执行程序就行了。
> 如果你是MacOS或Linux，或想使用最新版，到Github找Kanata仓库下载
> 
> kanata.kbd 是脚本，与exe在同一目录下，双击exe就可以运行了！
> 
> 有不了解的地方，可以见脚本中的注释，或者见我官网中，产品文档的部分或Kanata的笔记部分

不同的 exe 版本区别:

- 带 `gui` 的表示使用系统托盘，否则则是命令行窗口。
  前者体验更好也不怕误关软件，后者可以查看错误日志以便进行调试排查，适合开发阶段使用。
- 带 `cmd_allower` 的表示该版本支持 cmd 命令。
  允许使用一些 powershell 等命令来做到更强大的功能

> [tips]
> 如果你希望在游戏等环境下运行，需要使用管理员权限打开 exe。
> 如果不成功，则先运行游戏，再管理员权限打开。
