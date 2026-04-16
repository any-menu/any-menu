# For developer

此处仅用于开发备注

## 更新需做

每次更新需要修改的版本号: 

- `/src/*/package.json` 所有子项目的 package.json
  其中 Core 子项目的版本决定插件的 min_app_version 字段限制
  这里可以用 pnpm 脚本 **快速修改**，见后文的 "常用命令"
- `/manifest.json` 用于 obsidian 插件
- `/src/Tauri/src-tauri/` 下的 `tauri.conf.json` 和 `Cargo.toml` 用于 App 版本

## 常用命令

```bash
pnpm -r exec pnpm version 1.0.1 # 同步相同版本号

pnpm -r publish --access public
# -r：递归执行命令（所有子项目）
# --access public：确保公共包可被访问（私有包可不添加）
#  --tag beta: 若为beta版本
# 如没登录需要先 npm adduser

pnpm up -i --latest # 强制列出最新版的包并可选自动升级
```

## 插件接口设计

export default 对象 vs export default class

结论：推荐改为 class 方式，理由如下：

| 对比维度 | 当前：export default {} 对象 | 推荐：export default class |
|---|---|---|
| TypeScript 类型检查 | ❌ 对象字面量无法在编写时做接口约束，只有 Zod 运行时校验 | ✅ implements PluginInterface 编译期就报错 |
| 内部状态 | ⚠️ 需要用闭包或模块级变量，容易污染 | ✅ this.xxx 天然私有状态 |
| this 引用 | ⚠️ 对象字面量方法里 this 有时会丢失上下文 | ✅ 类方法 this 始终指向实例 |
| Zod 验证兼容性 | PluginManager 里已经注意到"Zod 会 strip 未定义字段导致 this.xxx 失败"，并特地绕过用了 rawPlugin 而非 result.data | class 实例同样需要此处理，但 Zod 对 class 实例的 safeParse 行为一致，不影响 |
| 模板友好性 | ⚠️ 新手不清楚可以放哪些内部方法 | ✅ class 结构更清晰，继承 base class 还能得到默认实现 |
| 加载侧改动量 | — | 极小：module.default 拿到的是 class，new module.default() 实例化即可 |

建议方案：export default class MyPlugin implements PluginInterface
PluginManager 侧只需在 loadPlugin 中判断：如果 module.default 是 function（即 class），则 new 一下再验证。这样向后兼容对象写法，同时支持 class 写法。
