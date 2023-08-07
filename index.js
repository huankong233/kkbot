import { sendMsg } from './libs/sendMsg.js'
import logger from './libs/logger.js'
import init from './init.js'
import plugins from './plugins.js'

await init()
await plugins()

logger.SUCCESS('机器人已启动成功')

if (!global.debug) await sendMsg(global.config.bot.admin, `机器人已启动成功！`)
