#!/usr/bin/env node
// 入口：源码仓库里直接跑 .ts（Node 22.18+/24 支持类型擦除）；
// 从 npm 安装时 Node 不会擦除 node_modules 里的 .ts，所以用发布前编译好的 dist/
process.removeAllListeners('warning')
const installed = /[\\/]node_modules[\\/]/.test(new URL(import.meta.url).pathname)
await import(installed ? '../dist/cli/main.js' : '../src/cli/main.ts')
