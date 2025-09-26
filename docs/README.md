# 文档

## Demo文件夹

注意 ./demo 文件夹仅用于辅助生成菜单项，并非人类可读文档

修改方式: 文件分两种方式

- 一文件多项
  - 适合单行内容，如快符、emoji、颜表情、其他自定义短语。不适合多行内容
  - csv形式
  - 程序上通常以 SendText 形式输出
- 一文件一项
  - 适合多行内容，允许有更多字段 (icon、detail)
  - md + frontmatter 形式
  - 程序上通常以 Clipborad 形式输出

文件不使用诸如 yml/json 的形式表示嵌套，嵌套统一使用文件夹形式表示。暂不支持单文件去声明多分类

### 概念: 路径、id、key

- key:
  key是短的，可以重复，例如两个不同的emoji，或一个emoji和一个颜表情，可以都叫happy。
  在搜索上，像同声词一样，key可以重复，然后有不同的候选项，可以选重
- id:
  id = 路径 + key + 可选的重复计数，不可重复。
  像文件夹文件一样，同一文件夹下文件不能重名，不同文件夹下则可以

### 多行csv设计

支持多行的多行csv

- toml
- yaml
- md+yaml
- md br table
- json5 (是5)

## 鸣谢

(词典/代码参考，帮助)

https://github.com/iDvel/rime-ice 借用了其 opencc/ 下的 emoji 和 others 字典
