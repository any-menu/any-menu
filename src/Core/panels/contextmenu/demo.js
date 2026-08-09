export { parse as toml_parse, stringify as toml_stringify } from "smol-toml";
export const root_menu_demo = [
    {
        label: 'list', children: [
            { label: '列表转表格',
                type: 'md',
                content: `[table]

- 1
  - 2
  - 3
- 2
  - 4 | <
  - 5
    - 6
    - 7\n\n` },
            { label: '列表转目录', type: 'md', content: `[dir]

- vue-demo/
  - build/， 项目构建(webpack)相关代码
  - config/， 配置目录，包括端口号等。我们初学可以使用默认的
  - node_modules/， npm 加载的项目依赖模块
  - src/， 这里是我们要开发的目录
    - assets/， 放置一些图片，如logo等
    - components， 目录里面放了一个组件文件，可以不用
    - App.vue， 项目入口文件，我们也可以直接将组件写这里，而不使用 components 目录
    - main.js， 项目的核心文件。
  - static/， 静态资源目录，如图片、字体等
  - test/， 初始测试目录，可删除
  - .eslintignore
  - .gitignore， git配置
  - .index.html， 首页入口文件，你可以添加一些 meta 信息或统计代码啥的
  - package.json， 项目配置文件
  - READED.md， 项目的说明文档，markdown 格式<br>手动换行测试<br>自动换行测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试k
  - ...\n\n` },
        ]
    },
    {
        label: 'mindmap', children: [
            { label: 'node',
                type: 'md',
                content: `[nodes]

- a
  - b
  - c
  - d
    - e
    - f\n\n` },
            { label: 'plantuml mindmap', type: 'md', content: `[mindmap]

- a
  - b
  - c
  - d
    - e
    - f\n\n` },
            { label: 'pumlWBS', type: 'md', content: `[list2pumlWBS]

- vue-demo/
  - build/
  - config/
  - node_modules/
  - src/
    - < assets/
      - < a
        - b
        - < c
      - d
      - e
    - components
    - App.vue
    - main.js
  - static/
  - test/\n\n` },
            { label: 'mermaid', type: 'md', content: `[mermaid]

- 树结构
  - 基本术语
    - A
    - B(BB)
    - C(CC)
      - A
  - 性质
  - 基本运算
  - 二叉树
    - 分支1
    - 分支2\n\n` },
            { label: 'mermaid mindmap', type: 'md', content: `[listroot(root((mindmap)))|list2mindmap]

- Origins
  - Long history
  - ::icon(fa fa-book)
  - Popularisation
    - British popular psychology author Tony Buzan
- Research
  - On effectiveness<br/>and features
  - On Automatic creation
    - Uses
      - Creative techniques
      - Strategic planning
      - Argument mapping
- Tools
  - Pen and paper
  - Mermaid\n\n` },
            { label: 'markmap', type: 'md', content: `[list2markmap]

- Links
  - [Website](https://markmap.js.org/)
  - [GitHub](https://github.com/gera2ld/markmap)
- Related Projects
  - [coc-markmap](https://github.com/gera2ld/coc-markmap) for Neovim
  - [markmap-vscode](https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode) for VSCode
  - [eaf-markmap](https://github.com/emacs-eaf/eaf-markmap) for Emacs
- Features
  - Lists
    - **strong** ~~del~~ *italic* ==highlight==
    - \`inline code\`
    - [x] checkbox
    - Katex: $x = {-b \pm \sqrt{b^2-4ac} \over 2a}$ <\!-- markmap: fold -->
    - [More Katex Examples](#?d=gist:af76a4c245b302206b16aec503dbe07b:katex.md)
    - Now we can wrap very very very very long text based on \`maxWidth\` option\n\n` }
        ]
    },
    {
        label: 'table', children: [
            { label: '列表转表格', type: 'md', content: `[table]

- 1
  - 2
  - 3
- 2
  - 4 | <
  - 5
    - 6
    - 7\n\n` },
            { label: '合并表格', type: 'md', content: `[exTable]

|*A*| a | < |
|---|---|---|
| ^ | 2 | 3 |\n\n` },
        ]
    },
    {
        label: 'callout', children: [
            { label: 'note', type: 'md', content: `> [!note]\n> \n> Note demo.\n\n` },
            { label: 'warning', type: 'md', content: `> [!warning]\n> \n> Warning demo.\n\n` },
            { label: 'tip', type: 'md', content: `> [!tip]\n> \n> Tip demo.\n\n` },
            { label: 'note_complex', type: 'md', content: `> [!note]+ title\n> Note demo.\n\n` },
        ]
    },
    {
        label: 'mdit container', children: [
            { label: 'note', type: 'md', content: `:::note\n\nNote demo.\n\n:::\n\n` },
            { label: 'warning', type: 'md', content: `:::warning\n\nWarning demo.\n\n:::\n\n` },
            { label: 'tip', type: 'md', content: `:::tip\n\nTip demo.\n\n:::\n\n` },
            { label: 'note_complex', type: 'md', content: `:::note+ title\n\nNote demo.\n\n:::\n\n` },
        ]
    },
    {
        label: 'two layout', children: [
            { label: 'col', type: 'md', content: `:::col

@col

text1

@col

text2

@col

text3

:::\n\n` },
            { label: 'tabs', type: 'md', content: `:::tabs

@tab title1

text1

@tab title2

text2

@tab title3

text3

:::\n\n` },
        ]
    },
];
export const root_menu = [
    { label: 'AnyBlock', icon: 'list-plus', children: root_menu_demo },
];
