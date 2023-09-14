import { eventReg } from '../../libs/eventReg.js'
import { get } from '../../libs/fetch.js'
import { makeLogger } from '../../libs/logger.js'
import { replyMsg } from '../../libs/sendMsg.js'

const logger = makeLogger({ pluginName: 'dog' })

export default () => {
  event()
}

function event() {
  eventReg('message', async (event, context, tags) => {
    const { command } = context
    if (command) {
      if (command.name === '舔狗日记') {
        await dog(context)
      }
    }
  })
}

async function dog(context) {
  try {
    const data = await get({ url: 'https://api.oick.cn/dog/api.php' }).then(res => res.text())
    await replyMsg(context, data.slice(1, -1), { reply: true })
  } catch (error) {
    logger.WARNING(`请求接口失败`)
    logger.ERROR(error)
    await replyMsg(context, '接口请求失败~', { reply: true })
  }
}
