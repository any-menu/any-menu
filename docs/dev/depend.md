# depend 依赖问题

- LincZero (同作者) 的 @editableblock/ 系列
  主要提供 quicker note 的代码高亮或 markdown 高亮
- pinyin
  拼音检索功能。话说这个禁用掉的话可以节省挺多空间的。后期可以推出不支持拼音功能的 mini 版本

> [!WARNING]
> 注意: tauri 项目的前端部分用了强缓存的 .vite。
> 如果要在 node_modules 中临时调试子库，需要删除 node_modules/.vite 避免强缓存，
> 否则临时修改 node_modules 后使用的还会是旧版本的代码
