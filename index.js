import { getBaseDir } from './libs/getDirname.js'
import { getVersion } from './libs/loadVersion.js'
import { loadPlugins, loadPluginDir, loadPlugin } from './libs/loadPlugin.js'
import logger from './libs/logger.js'

// 是否启用DEBUG模式
global.debug = process.argv[2] === '--dev'

// 定义起始地址
global.baseDir = getBaseDir()

// 初始化package.json内容
getVersion()

// 初始化机器人
if ((await loadPlugin('bot', 'plugins_dependencies')) !== 'success') {
  throw new Error('机器人加载失败')
}

// 加载前置插件
await loadPluginDir('plugins_dependencies')
await loadPlugins(['pigeon'])

// 再加载剩余的插件
await loadPluginDir('plugins')

logger.SUCCESS('机器人已启动成功')
