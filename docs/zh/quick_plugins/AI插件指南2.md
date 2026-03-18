# 使用 AI 快捷添加 AnyMenu 脚本

(图文版)

这里以我自己添加官方插件为例，如果你只是自用的，流程会更加简单

(1) 提issue (或者该issue是用户提出的)

描述好需求，如果是用户提出的，开发者可以先补充完成

![alt text](95d3e912edfed1c8665d6a5c05861b49.png)

(2) 把任务交给 AI

点击右上角的 "Assign to Copilot"

在新的弹窗中

- 可选提示词。"Optional prompt" 窗口里提议填上提示词，例如:
  ```markdown
  尽量少修改，修成较少的代码diff。聚焦于此 issue，不要做无关的重构与优化
  ```
- 可切换模型。右下的 "Auto" 下拉框中可以换用别的 AI 模型，选择取决于此次任务的难度、时长、Token 预期。可选的模型有: (我这里是 copilot 付过费的，且为26年3月版本，你的不一定和这里一致)
  - Claude Opus 4.6、Claude Opus 4.5 (3倍，其余均1倍)
  - Claude Sonnet 4.6、Claude Sonnet 4.5
  - GPT-5.1-Codex-Max、GPT-5.2-Codex、GPT-5.3-Codex、GPT-5.4

![alt text](5f94962272c0062841d073a268ccf5a3.png)

(3) 等待AI完成

不用管他，等待一段时间后，AI 就完成工作啦 (时间与工作量及你选择的模型有关)。

完成后他会通知和请求你 review

![alt text](6eb7687cf1684d07ab78a541812639a6.png)

![alt text](2e5225ad59c97ad94b7cf06f8d04ad2a.png)

(4) 检查并合并

接下来我们来验证一下 —— 运行得不错。然后自己 review 下代码，如果没有问题就可以合并此 PR 啦！

![alt text](94f56da4146f9ef77b98ab9c478cd1fd.png)

![alt text](870cf50ef3a17f79eff80f0f6119bc9d.png)
