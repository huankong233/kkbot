import { getBaseDir } from './libs/getDirname.js'
import { getVersion } from './libs/loadVersion.js'
import { loadPlugins, loadPluginDir, loadPlugin } from './libs/loadPlugin.js'
import { rewriteConsoleLog } from './libs/log/index.js'
import { sendMsg } from './libs/sendMsg.js'
import logger from './libs/logger.js'

// 是否启用DEBUG模式
const isDev = typeof process.argv.find(item => item === '--dev') !== 'undefined'
global.debug = isDev

// 定义起始地址
global.baseDir = getBaseDir()

// 初始化package.json内容
getVersion()

// 重写conosle.log
rewriteConsoleLog()

// 初始化机器人
if ((await loadPlugin('bot', 'plugins_dependencies')) !== 'success') {
  throw new Error('机器人加载失败')
}

// 加载插件(存在依赖关系在里面)
await loadPluginDir('plugins_dependencies')
await loadPlugins(['pigeon', 'query'])
await loadPluginDir('plugins')
await loadPlugins(['searchImage', 'help'])

logger.SUCCESS('机器人已启动成功')

if (!debug) await sendMsg(global.config.bot.admin, `机器人已启动成功，并加载了所有设定的插件！`)
