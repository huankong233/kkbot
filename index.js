// 定义起始地址
import { getBaseDir } from './libs/getDirname/index.js'
global.baseDir = getBaseDir()

// 初始化机器人
import { newBot } from './libs/bot/index.js'
await newBot()
