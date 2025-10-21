# AnyCaps 高级快捷键

## AnyCaps 设计方案

- [按键设计方案, 教程](./Tutorial.md) (**Core**)
  - 比较: AnyCaps 这套 "Caps" 的特点优点
- 其他文章
  - [早期研究、方案设计草稿](./09.%20案例：Caps%20Lock作修改键.md)
  - [仓库历史](./History.md)

## AnyMenu 软件版本补充

部分逻辑是只有使用 AnyMenu 才有的 (无法理解这句话则先看下一节)

如果你使用的是 AnyMenu，这里在上面的方案基础上，还添加了打开 AnyMenu 的快捷键:

- `Caps+M`: Open any **Menu**
- `Caps+N`: Open mini **Note**

此外，由于其他软件版本的一些 api 限制，一些选中文本触发的、鼠标操控的、依赖 Editor 相关的，都只有 AnyMenu 版本才能支持

## 其他软件版本

先引: 这里存在两个需要区分的概念: **热键的软件方案** 和 **热键的设计方案**

热键的设计方案

> AnyCaps 是 LincZero 大佬设计一套使用 Caps 等其他按键的类 vim 方案
> (与 vim 方案区别很大，更易用)
> 
> 而这套方案只定义了当你按下哪些键后，会发生什么行为。而并不负责程序。

热键的软件方案

> 你可以自由选择多种不同的程序去使用这套方案
> 
> 如 LincZero 开发的 AnyMenu、或传统的 AutoHotKey、或 Kanata 这种专门的热键软件
> 
> (*AnyMenu 仅 App 版支持，插件版本难以捕获和阻止原按键行为*)

理解后我们再来看其他的软件方案，你还可以选择其他的热键软件方案:

- 热键软件方案
  - 这套按键除了 AnyMenu 自带，可以在上面使用外。你也可以通过 AutoHotKey 和 Kanata 来使用！
  - [比较这几套软件](./Other_version.md) 我会更推荐使用 AnyMenu 版本，原因见该链接
  - AnyMenu 软件版使用方法: 安装 AnyMenu 后即可生效使用 (或者你也可以单独关闭 AnyMenu 的此项功能)
  - [AutoHotKey 软件版使用方法](./AutoHotKey_version.md)
  - [Kanta 软件版使用方法](./Kanata_version.md)

## 设置

该功能默认开启，你可以单独关闭这个功能，对应选项: `app_ad_shortcut = false`
