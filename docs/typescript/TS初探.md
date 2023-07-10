# TS初探

参考[Microsof TS入门教程](https://learn.microsoft.com/zh-cn/training/modules/typescript-get-started/)


### 生成tsconfig.json文件

运行**tsc --init**即可生成默认的tsconfig.json配置文件。

各选项的作用详见[TSConfig参考](https://www.staging-typescript.org/tsconfig)

### 将 TypeScript 编译为 JavaScript

运行**tsc module01.ts**即可将module01.ts编译为js。
需注意的是
1. 在单个文件上运行 tsc 命令时，编译器将忽略 tsconfig.json 文件。
2. 若要加载配置文件并编译文件夹中的所有 .ts 文件，请在不使用文件名的情况下运行 tsc。 此命令应该会将 .js 文件添加到 build 文件夹。 请记得删除根文件夹中的多余的 .js 文件。

