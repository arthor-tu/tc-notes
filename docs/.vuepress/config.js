/*
 * @Author: tcq
 * @Date: 2023-04-18 16:32:39
 * @LastEditors: tcq
 * @LastEditTime: 2023-04-20 15:56:24
 * @Description: 
 * @FilePath: \gjs-vuePress-developer\docs\.vuepress\config.js
 */

const path = require('path');
const rootPath = path.dirname(__dirname);


//导入生成侧边栏的工具类
const { sideBarTool } = require(path.join(__dirname, './utils/index.js'))

// 需要排除的一些目录
let unDirIncludes = ['node_modules', 'assets', 'public']
// 只需要处理后缀的文件类型
let SuffixIncludes = ['md', 'html']
//使用方法生生成侧边栏
// 侧边栏
let sidebar = sideBarTool.genSideBarGroup(rootPath, unDirIncludes, SuffixIncludes, {})

console.log(JSON.stringify(sidebar));

module.exports = {
  title: '沙之书 Arthor的笔记',
  description: '欢迎访问 Arthor 的笔记',
  base: "/",
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
  host: "0.0.0.0",
  port: "5000",
  dest: "./dist",
  themeConfig: {
    // logo: "/img/logo_gjs.png",
    sidebar,
    nav: [],
    // sidebar: 'auto'
  },
}