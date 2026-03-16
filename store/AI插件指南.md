# AI 插件指南

## 使用 AI 进行插件开发

我打算我开发的软件弄完api接口后，需要大量的小插件。打算把小插件全部交给 ai 去写，量大且覆盖各种需求。

同时，也打算把这套流程分享给用户，让用户可以自己去用 ai 来创建自己的脚本。

## 使用 AI 进行改进代码

除了开发插件后，用户可能还需要一些插件无法实践的功能 —— 需要通过修改源码来解决。

是的，修复 bug 或添加功能这种修改可能是官方版本需要做的，也可能是用户的 fork 版本需要做的。

所以这里为使用 AI 进行代码修改提供一些补充建议

### 从 issue 到 PR 到 review

这里我使用的流程是 Github Copliot Workspace，当然你有别的方案也可以用

GitHub 官方推出的 Copilot Workspace 就是为你描述的这个流程量身定制的：

(1) 创建 Issue：你或团队成员或用户创建一个 Issue 描述需求 (如果是用户创建的，你或团队先进行补充)

(2) AI 生成 PR

> Github issue 页面的 AI 工具:
> 
> - Assign to Copilot
> - Development > Code with agen mode

如 Assign to Copilot。Copilot 会自动读取整个仓库的代码上下文，给出一个修改计划（Plan），然后直接生成代码变更。

- (ai说可以这样，但我实测不行) 修改可选模型：可以切换不同的 AI 模型，如 GPT/Gemini/Claude 等
- 控制修改范围：在 Workspace 生成代码前，你可以对它下发自定义指令。此时你可以加上你的核心约束 (prompt)：
  “Strictly focus on the issue requirements. Do NOT refactor, reformat, or optimize unrelated code. Keep changes to an absolute minimum.”
  (严格聚焦 Issue 需求，不要重构、格式化或优化无关代码，保持最小变更。)

创建 PR：在 Workspace 确认没问题后，直接点击一键生成 PR。

(3) Review 与修改

如果你在 PR review 时觉得有问题，可以直接在 PR 里使用 Copilot 进行 Review 评论，或者在 Workspace 中继续让它基于你的 Review 意见修改代码。

### prompt 备用

```text
“Please make the minimal necessary changes.”
“Do not refactor existing code unless explicitly requested.”
“Ensure the git diff is as small as possible.”
```
w