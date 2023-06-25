// 是否启用DEBUG模式
global.debug = true

// 定义起始地址
import { getBaseDir } from './libs/getDirname.js'
global.baseDir = getBaseDir()

// 初始化机器人
import { newBot } from './libs/bot.js'
await newBot()

import { loadPluginDir, loadPlugin } from './libs/loadPlugin.js'

// 加载前置插件
await loadPluginDir('plugins_dependencies')

// 再加载剩余的插件
await loadPluginDir('plugins')
