# keyboard-layout-editor 源码备份

这里仅用于备份 https://keyboard-layout-editor.com/ 源码，便于日后进行修改。以下均基于 "Default 60%" 进行修改

## 默认层

```json
["~\n`","!\n1","@\n2","#\n3","$\n4","%\n5","^\n6","&\n7","*\n8","(\n9",")\n0","_\n-","+\n=",{w:2},"Backspace"],
[{w:1.5},"Tab","Q","W","E","R","T","Y","U","I","O","P","{\n[","}\n]",{w:1.5},"|\n\\"],
[{c:"#b35050",w:1.75},"Caps Lock\n\n\n\n\n\n\n\n\n光标层\n无动作/Esc",{c:"#cccccc"},"A","S","D","F","G","H","J","K","L",":",{c:"#b35050"},"\"\n'\n\n\n\n\n\n\n\n符号层",{c:"#cccccc",w:2.25},"Enter"],
[{w:2.25},"Shift","Z","X","C","V","B","N","M","<\n,",">\n.","?\n/",{w:2.75},"Shift"],
[{w:1.25},"Ctrl",{w:1.25},"Win",{w:1.25},"Alt",{a:7,w:6.25},"",{a:4,w:1.25},"Alt",{w:1.25},"Win",{w:1.25},"Menu",{w:1.25},"Ctrl"]
```

## Caps-光标层

```json
["~\n`","!\n1","@\n2","#\n3","$\n4","%\n5","^\n6",{c:"#2D6CA1"},"&\n\n\n\n\n\n\n\n\n\n最上",{c:"#cccccc"},"*\n8","(\n9",")\n0","_\n-","+\n=",{w:2},"Backspace"],
[{w:1.5},"Tab","Q","W",{c:"#b35050"},"E\n\n\n\n\n\n\n\n\n数字层","R\n\n\n\n\n\n\n\n\n页层\n选中页","T\n\n\n\n\n\n\n\n\n数字层",{c:"#2D6CA1"},"Y\n\n\n\n\n\n\n\n\n\n最上",{c:"#407DD5"},"U\n\n\n\n\n\n\n\n\n\n上",{c:"#2D6CA1"},"I\n\n\n\n\n\n\n\n\n\n向左删","O\n\n\n\n\n\n\n\n\n\n向右删",{c:"#cccccc"},"P","{\n[","}\n]",{w:1.5},"|\n\\"],
[{c:"#615555",w:1.75},"Caps Lock\n\n\n\n\n\n\n\n\n被占",{c:"#cccccc"},"A","S",{c:"#b35050"},"D\n\n\n\n\n\n\n\n\n词层\n选中词","F\n\n\n\n\n\n\n\n\n行层\n选中行","G\n\n\n\n\n\n\n\n\n词层\n选中词",{c:"#2D6CA1"},"H\n\n\n\n\n\n\n\n\n\n最左",{c:"#407DD5"},"J\n\n\n\n\n\n\n\n\n\n左","K\n\n\n\n\n\n\n\n\n\n下","L\n\n\n\n\n\n\n\n\n\n右",{c:"#2D6CA1"},":\n\n\n\n\n\n\n\n\n\n最右",{c:"#cccccc"},"\"\n'",{w:2.25},"Enter"],
[{c:"#b35050",w:2.25},"Shift\n\n\n\n\n\n\n\n\n选中层",{c:"#cccccc"},"Z","X","C","V","B","N","M",{c:"#2D6CA1"},"<\n\n\n\n\n\n\n\n\n\n最下",{c:"#cccccc"},">\n.","?\n/",{w:2.75},"Shift"],
[{w:1.25},"Ctrl",{w:1.25},"Win",{w:1.25},"Alt",{a:5,w:6.25},"\n回车",{a:4,w:1.25},"Alt",{w:1.25},"Win",{w:1.25},"Menu",{w:1.25},"Ctrl"]
```

## Caps-词层

## Caps-行层

```json
["~\n`","!\n1","@\n2","#\n3","$\n4","%\n5","^\n6",{c:"#2D6CA1"},"&\n\n\n\n\n\n\n\n\n\n最上",{c:"#cccccc"},"*\n8","(\n9",")\n0","_\n-","+\n=",{w:2},"Backspace"],
[{w:1.5},"Tab","Q","W","E","R","T",{c:"#2D6CA1"},"Y\n\n\n\n\n\n\n\n\n\n最上",{c:"#407DD5"},"U\n\n\n\n\n\n\n\n\n\n最上","I\n\n\n\n\n\n\n\n\n\n删左行","O\n\n\n\n\n\n\n\n\n\n删右行",{c:"#cccccc"},"P","{\n[","}\n]",{w:1.5},"|\n\\"],
[{c:"#615555",w:1.75},"Caps Lock\n\n\n\n\n\n\n\n\n被占",{c:"#cccccc"},"A","S","D",{c:"#615555"},"F\n\n\n\n\n\n\n\n\n被占\n选中行",{c:"#cccccc"},"G",{c:"#2D6CA1"},"H\n\n\n\n\n\n\n\n\n\n最左",{c:"#407DD5"},"J\n\n\n\n\n\n\n\n\n\n最左","K\n\n\n\n\n\n\n\n\n\n最下","L\n\n\n\n\n\n\n\n\n\n最右",{c:"#2D6CA1"},":\n\n\n\n\n\n\n\n\n\n最右",{c:"#cccccc"},"\"\n'",{w:2.25},"Enter"],
[{c:"#b35050",w:2.25},"Shift\n\n\n\n\n\n\n\n\n选中层",{c:"#cccccc"},"Z","X","C","V","B","N","M",{c:"#2D6CA1"},"<\n\n\n\n\n\n\n\n\n\n最下",{c:"#cccccc"},">\n.","?\n/",{w:2.75},"Shift"],
[{w:1.25},"Ctrl",{w:1.25},"Win",{w:1.25},"Alt",{a:7,w:6.25},"",{a:4,w:1.25},"Alt",{w:1.25},"Win",{w:1.25},"Menu",{w:1.25},"Ctrl"]
```

## Caps-页层

```json
["~\n`","!\n1","@\n2","#\n3","$\n4","%\n5","^\n6",{c:"#2D6CA1"},"&\n\n\n\n\n\n\n\n\n\n最上页",{c:"#cccccc"},"*\n8","(\n9",")\n0","_\n-","+\n=",{w:2},"Backspace"],
[{w:1.5},"Tab","Q","W","E",{c:"#615555"},"R\n\n\n\n\n\n\n\n\n被占",{c:"#cccccc"},"T",{c:"#2D6CA1"},"Y\n\n\n\n\n\n\n\n\n\n最上页",{c:"#407DD5"},"U\n\n\n\n\n\n\n\n\n\n上页","I\n\n\n\n\n\n\n\n\n\n向左删","O\n\n\n\n\n\n\n\n\n\n向右删",{c:"#cccccc"},"P","{\n[","}\n]",{w:1.5},"|\n\\"],
[{c:"#615555",w:1.75},"Caps Lock\n\n\n\n\n\n\n\n\n被占",{c:"#cccccc"},"A","S","D","F","G",{c:"#2D6CA1"},"H\n\n\n\n\n\n\n\n\n\n左窗口",{c:"#407DD5"},"J\n\n\n\n\n\n\n\n\n\n左标签","K\n\n\n\n\n\n\n\n\n\n下页","L\n\n\n\n\n\n\n\n\n\n右标签",{c:"#2D6CA1"},":\n\n\n\n\n\n\n\n\n\n右窗口",{c:"#cccccc"},"\"\n'",{w:2.25},"Enter"],
[{c:"#b35050",w:2.25},"Shift\n\n\n\n\n\n\n\n\n选中层",{c:"#cccccc"},"Z","X","C","V","B","N","M",{c:"#2D6CA1"},"<\n\n\n\n\n\n\n\n\n\n最下页",{c:"#cccccc"},">\n.","?\n/",{w:2.75},"Shift"],
[{w:1.25},"Ctrl",{w:1.25},"Win",{w:1.25},"Alt",{a:7,w:6.25},"",{a:4,w:1.25},"Alt",{w:1.25},"Win",{w:1.25},"Menu",{w:1.25},"Ctrl"]
```

## Caps-数字层

```json
["~\n`","!\n1","@\n2","#\n3","$\n4","%\n5","^\n6","&\n7","*\n8","(\n9",")\n0","_\n-","+\n=",{w:2},"Backspace"],
[{w:1.5},"Tab","Q","W",{c:"#615555"},"E\n\n\n\n\n\n\n\n\n\n被占",{c:"#cccccc"},"R","T",{c:"#2D6CA1"},"Y\n\n\n\n\n\n\n\n\n\n/",{c:"#407DD5"},"U\n\n\n\n\n\n\n\n\n\n7","I\n\n\n\n\n\n\n\n\n\n8","O\n\n\n\n\n\n\n\n\n\n9",{c:"#2D6CA1"},"P\n\n\n\n\n\n\n\n\n\n-",{c:"#cccccc"},"{\n[","}\n]",{w:1.5},"|\n\\"],
[{c:"#615555",w:1.75},"Caps Lock\n\n\n\n\n\n\n\n\n\n被占",{c:"#cccccc"},"A","S","D","F","G",{c:"#2D6CA1"},"H\n\n\n\n\n\n\n\n\n\n*",{c:"#407DD5"},"J\n\n\n\n\n\n\n\n\n\n4","K\n\n\n\n\n\n\n\n\n\n5","L\n\n\n\n\n\n\n\n\n\n6",{c:"#2D6CA1"},":\n\n\n\n\n\n\n\n\n\n+",{c:"#cccccc"},"\"\n'",{w:2.25},"Enter"],
[{w:2.25},"Shift","Z","X","C","V",{c:"#2D6CA1"},"B\n\n\n\n\n\n\n\n\n\n^","N\n\n\n\n\n\n\n\n\n\n.",{c:"#407DD5"},"M\n\n\n\n\n\n\n\n\n\n1","<\n\n\n\n\n\n\n\n\n\n2",">\n\n\n\n\n\n\n\n\n\n3",{c:"#2D6CA1"},"?\n\n\n\n\n\n\n\n\n\n=",{c:"#cccccc",w:2.75},"Shift"],
[{w:1.25},"Ctrl",{w:1.25},"Win",{w:1.25},"Alt",{c:"#407DD5",a:5,w:6.25},"\n0",{c:"#cccccc",a:4,w:1.25},"Alt",{w:1.25},"Win",{w:1.25},"Menu",{w:1.25},"Ctrl"]
```

## 符号层

> [!warning]
> with bug

```json
["~\n`","!\n1","@\n2","#\n3","$\n4","%\n5","^\n6","&\n7","*\n8","(\n9",")\n0","_\n-","+\n=",{w:2},"Backspace"],
[{w:1.5},"Tab",{c:"#2D6CA1"},"Q\n\n\n\n\n\n\n\n\n\n！","W\n\n\n\n\n\n\n\n\n\n问？",{c:"#cccccc"},"E","R",{c:"#2D6CA1"},"T",{c:"#407DD5"},"Y\n\n\n\n\n\n\n\n\n\n引1 “","U\n\n\n\n\n\n\n\n\n\n引2 \"","I\n\n\n\n\n\n\n\n\n\n引2 '","O\n\n\n\n\n\n\n\n\n\n引2 `",{c:"#cccccc"},"P","{\n[","}\n]",{w:1.5},"|\n\\"],
[{w:1.75},"Caps Lock","A",{c:"#2D6CA1"},"S\n\n\n\n\n\n\n\n\n\n省……","D\n\n\n\n\n\n\n\n\n\n顿、","F\n\n\n\n\n\n\n\n\n\n句2，","G\n\n\n\n\n\n\n\n\n\n句。",{c:"#407DD5"},"H\n\n\n\n\n\n\n\n\n\n括2 【","J\n\n\n\n\n\n\n\n\n\n括2 (","K\n\n\n\n\n\n\n\n\n\n括1 [","L\n\n\n\n\n\n\n\n\n\n括2 {",{c:""},":",{c:"#615555"},"\"\n\n\n\n\n\n\n\n\n\n被占",{c:"#cccccc",w:2.25},"Enter"],
[{w:2.25},"Shift",{c:"#2D6CA1"},"Z\n\n\n\n\n\n\n\n\n\n_","X\n\n\n\n\n\n\n\n\n\n，","C\n\n\n\n\n\n\n\n\n\n。","V\n\n\n\n\n\n\n\n\n\n折——","B\n\n\n\n\n\n\n\n\n\n=",{c:"#407DD5"},"N\n\n\n\n\n\n\n\n\n\n括2「","M\n\n\n\n\n\n\n\n\n\n括2《","<\n\n\n\n\n\n\n\n\n\n括2 /*",">\n\n\n\n\n\n\n\n\n\n括2 <",{c:"#cccccc"},"?\n/",{w:2.75},"Shift"],
[{w:1.25},"Ctrl",{w:1.25},"Win",{w:1.25},"Alt",{a:7,w:6.25},"",{a:4,w:1.25},"Alt",{w:1.25},"Win",{w:1.25},"Menu",{w:1.25},"Ctrl"]
```

## vim默认层

```json
[{c:"#b35050"},"ESC\n\n\n\n\n\n\n\n\n命令层"],
[{c:"#2D6CA1"},"~\n\n\n\n\n\n\n\n\n\n到标注",{c:"#cccccc"},"!\n1","@\n2","#\n3",{c:"#2D6CA1"},"$\n4\n\n\n\n\n\n\n\n行尾",{c:"#cccccc"},"%\n5\n\n\n\n\n\n\n\n括号匹",{c:"#2D6CA1"},"^\n6\n\n\n\n\n\n\n\n行首",{c:"#cccccc"},"&\n7\n\n\n\n\n\n\n\n重复","*\n8\n\n\n\n\n\n\n\n下缩进",{c:"#c9812c"},"(\n9\n\n\n\n\n\n\n\n句左",")\n0\n\n\n\n\n\n\n\n句右","_\n\n\n\n\n\n\n\n\n\n前句首","+\n\n\n\n\n\n\n\n\n下句首\n格式化",{c:"#cccccc",w:2},"Backspace"],
[{w:1.5},"Tab","Q\n\n\n\n\n\n\n\n\n\n录制宏",{c:"#2D6CA1"},"W\n\n\n\nword\n\n\n\n\n\n后一词","E\n\n\n\nend\n\n\n\n\n\n词尾",{c:"#cccccc"},"R\n\n\n\nreplace\n\n\n\n\n\n替换","T\n\n\n\ntill\n\n\n\n\n\ntill",{c:"#c9812c"},"Y\n\n\n\nyank\n\n\n\n\n拷贝行\n拷贝",{c:"#cccccc"},"U\n\n\n\nundo\n\n\n\n\n\n撤销",{t:"#b35050"},"I\n\n\n\nInstall\n\n\n\n\n行首插\n插入层","O\n\n\n\nopen\n\n\n\n\n前分段\n后分段",{t:"#000000"},"P\n\n\n\npaste\n\n\n\n\n黏贴前\n黏贴后","{\n\n\n\n\n\n\n\n\n段首\n杂项","}\n\n\n\n\n\n\n\n\n段尾\n杂项",{w:1.5},"|\n\\"],
[{w:1.75},"Caps Lock",{t:"#b35050"},"A\n\n\n\nappend\n\n\n\n\n和尾加\n附加","S\n\n\n\n\n\n\n\n\n删除行\n删除",{c:"#c9812c",t:"#000000"},"D\n\n\n\nDelete\n\n\n\n\n\n删除","F\n\n\n\nfind\n\n\n\n\n\n查找",{c:"#615555"},"G\n\n\n\n\n\n\n\n\n行号\n附加6",{c:"#407DD5"},"H\n\n\n\n\n\n\n\n\n最上\n左","J\n\n\n\n\n\n\n\n\n并两行\n下","K\n\n\n\n\n\n\n\n\n帮助\n上","L\n\n\n\n\n\n\n\n\n最下\n右",{c:"#cccccc"},":\n\n\n\n\n\n\n\n\n\n重复",{c:"#2D6CA1"},"\"\n\n\n\n\n\n\n\n\n\n到标注",{c:"#cccccc",w:2.25},"Enter"],
[{c:"#b35050",w:2.25},"Shift\n\n\n\n\n\n\n\n\n大写命令层",{c:"#615555"},"Z\n\n\n\n\n\n\n\n\n\n命令5",{c:"#cccccc"},"X\n\n\n\n\n\n\n\n\n\n向左删",{t:"#b35050"},"C\n\n\n\nchange\n\n\n\n\n\n修改",{c:"#b35050",t:"#000000"},"V\n\n\n\nvisual\n\n\n\n\n\n可视层",{c:"#2D6CA1"},"B\n\n\n\n\n\n\n\n\n前一词\n前一词",{c:"#c9812c"},"N\n\n\n\nnext\n\n\n\n\n向前查\n向后查",{c:"#cccccc"},"M\n\n\n\n\n\n\n\n\n\n标注","<\n\n\n\n\n\n\n\n\n左缩进\n反向",">\n\n\n\n\n\n\n\n\n右缩进\n重复令",{c:"#c9812c"},"?\n/\n\n\n\n\n\n\n\n\n向后查",{c:"#cccccc",w:2.75},"Shift"],
[{w:1.25},"Ctrl",{w:1.25},"Win",{w:1.25},"Alt",{a:7,w:6.25},"",{a:4,w:1.25},"Alt",{w:1.25},"Win",{w:1.25},"Menu",{w:1.25},"Ctrl"]
```
