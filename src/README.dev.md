# For developer

此处仅用于开发备注

每次更新需要修改的版本号: 

- `/src/*/package.json` 所有子项目的 package.json
  其中 Core 子项目的版本决定插件的 min_app_version 字段限制
  这里可以用 pnpm 脚本快速修改，见后文的 "常用命令"
- `/manifest.json` 用于 obsidian 插件
- `/src/Tauri/src-tauri/` 下的 `tauri.conf.json` 和 `Cargo.toml` 用于 App 版本

常用命令

```bash
pnpm -r exec pnpm version 1.0.1 # 同步相同版本号

pnpm -r publish --access public
# -r：递归执行命令（所有子项目）
# --access public：确保公共包可被访问（私有包可不添加）
#  --tag beta: 若为beta版本
# 如没登录需要先 npm adduser
```
