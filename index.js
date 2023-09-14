import { sendMsg } from './libs/sendMsg.js'
import init from './init.js'
import plugins from './plugins.js'
import { makeSystemLogger } from './libs/logger.js'
const logger = makeSystemLogger({ pluginName: 'index' })

await init()
await plugins()

logger.SUCCESS('机器人已启动成功')

if (!debug) await sendMsg(global.config.botConfig.admin, `机器人已启动成功！`)
