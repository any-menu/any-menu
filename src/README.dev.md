# For developer

此处仅用于开发备注

## 更新需做

每次更新需要修改的版本号: 

- `/src/*/package.json` 所有子项目的 package.json
  其中 Core 子项目的版本决定插件的 min_app_version 字段限制
  这里可以用 pnpm 脚本 **快速修改**，如: `pnpm -r exec pnpm version 1.2.4`
- `/manifest.json` 用于 obsidian 插件
- `/src/Tauri/src-tauri/` 下的 `tauri.conf.json` 和 `Cargo.toml` 用于 App 版本

现在我弄了一个脚本，方便一些。
运行 `pnpm run bump 1.2.4` 即可 (自行替换目标版本)

---

其中 only-obsidian repo/branch 还需要 npm 上传一下
`npm login`, `npm publish ./src/CoreSource --access public`
如果有插件 API 变动， Type 也需要 npm 上传一下
`npm login`, `npm publish ./src/Type --access public`

## 常用命令

```bash
pnpm -r exec pnpm version 1.2.4 # 同步相同版本号

pnpm -r publish --access public
# -r：递归执行命令（所有子项目）
# --access public：确保公共包可被访问（私有包可不添加）
#  --tag beta: 若为beta版本
# 如没登录需要先 npm adduser

pnpm up -i --latest # 强制列出最新版的包并可选自动升级
```

## 目录介绍

- Type        | 插件类型
- Core        | 核心、跨平台接口 api 预定义。
                有可能会在项目中，也有可能通过 npm 库方式依赖。
- Browser     | 在线测试/使用，本地浏览器快速 debug 项目
- Tauri       | 桌面应用版本 App
- Obsidian    | Obsidian 插件
- Script      | 其他可执行脚本工具
- CoreSource  | (不一定在) Core 模块的未编译版本。
                ignore 了，你可能无法看到该文件夹。
                这个另外存放在 Core 仓库，不存放在主仓库中。
- WebCore     | (不一定在) 纯浏览器环境 (非 App) 的子项目的通用逻辑
- ...         | (不一定在) 可能还有浏览器扩展、 VSCode 扩展等

依赖树：

- Type
  - Core / CoreSource
    - Tauri
    - WebCore (不一定有)
      - Obsidian
      - Browser
      - 可能的浏览器扩展、VSCode扩展等
        (当然，他们不一定在这。
        一是通用代码会比较少，不放一起也行。
        二是可能会为了发布方便，而分仓库存放)

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

## 多仓库问题

去除辅助的插件和辅助工具仓库，主体仓库有:

- any-menu:          多个版本的项目和发布
- obsidian-any-menu: obsidian 版本的项目和发布
                     (从 any-menu 同步, 避免 obsidian 自动审查多余项目的问题)
- any-menu-pro:      (私有) 临时测试

切换仓库常用命令备注:

```bash
# 1．查看当前远程地址(确认一下)
git remote -v

# 2．修改origin的URL为新仓库地址
# or: git remote set-url origin https://github.com/any-menu/any-menu.git
# or: git remote set-url origin https://github.com/any-menu/any-menu-pro.git
git remote add prorepo https://github.com/any-menu/any-menu-pro.git

# 3．推送到新仓库
# or: git push -u origin main
git push -u prorepo main

# or git branch --set-upstream-to=origin/main
```

上面时临时 push 时切换对应的仓库，永久切换默认推送仓库做法如下：

```bash
# 1．查看当前远程地址(确认一下)
git remote -v

# 2. 例如将 normal 作为默认
# 先将 origin 重命名为 pro
git remote rename origin pro
# 再将 normal 重命名为 origin
git remote rename normal origin
```
