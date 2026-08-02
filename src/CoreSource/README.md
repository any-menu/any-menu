## 目录

- shared/         | 通用部分 (其他所有子模块均可以依赖这个。尽量简单，
                    使子模块迁移到其他项目中基本重新实现这个简单的东西即可迁移)
  - locals/       | 多语言
  - setting.ts
- modules/        | 子模块
  - pluginManager/| js插件管理器 (不含普通词典)
- panels/         | 面板类别的子模块，相当于 `modules/panels/` 的路径提升和简写。
                    主面板和子面板
  - settingPanel  | 设置面板
  - ...           | (详见 `panels/README.md`)
- styles/         | 样式
- (outter)        | 外部零散文件。里面的东西不依赖于此 (否则应在 shared 中)，
                    这里的东西依赖于子文件夹里东西。

## 依赖关系

- shared/
  - modules/ & panels/
    - (outter)

## npm 发布说明

注意 files 和 publishConfig.directory 两个选项

1. 首先 publishConfig.directory 切换到目标目录 (只执行一次)
2. 然后在目标目录中可以找到 package.json，使用其 files 进行上传
