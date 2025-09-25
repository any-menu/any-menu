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
