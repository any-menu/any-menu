module.exports = {
  compact: true,
  controlFlowFlattening: false,       // 性能敏感就关掉
  renameGlobals: false,               // 关键：不重命名全局变量和导出名
  identifierNamesGenerator: 'hexadecimal',
  stringArray: true,
  stringArrayEncoding: ['base64'],
  // 显式保留所有公共 API 的名称（手动列出）
  // reservedNames: [
  //   '^YourPublicClass$',
  //   '^yourPublicFunction$',
  //   '^someConstant$'
  //   // ... 你的库对外暴露的所有名字
  // ],
  sourceMap: false,
};

/*
学习笔记：

## 背景需求

其他文件夹正常依赖于文件夹A，并且文件夹A不存在固定的入口index.ts，其他文件夹通常直接引用文件夹A中的各种文件。

现需要将文件夹编译js并混淆，可能会上传npm并依赖回来。此时其他文件夹能够完全不改动任何代码，使用编译和混淆后的文件夹A。

## 方法

(1) tsconfig.json 关键配置

```json
{
  "compilerOptions": {
    "declaration": true,
    "rootDir": "./",
    "outDir": "./dist",
  },
  "exclude": [
    "dist", "node_modules"
  ]
}
```

(2) package.json 关键配置

```json
{
  "main": "index.js",
  "types": "index.d.ts",
  "files": ["dist"],
  "publishConfig": {
    "directory": "dist"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json && javascript-obfuscator dist --output dist --config obfuscator.config.js"
  },
  "devDependencies": {
    "@types/node": "^25.9.2",
    "javascript-obfuscator": "^5.4.3",
    "node": "^22.20.0",
  },
}
```

(3) 添加 obfuscator.config.js

内容略，见此文件

(4) 使用

正常 `npm run build` 即可，其他 npm 也正常上传下载即可

(然后可以把 npm 下载位置移动回原位，或使用别名系统将原来的位置设置到对应的位置)
*/