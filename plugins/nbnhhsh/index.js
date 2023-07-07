export default () => {
  event()
}

//注册事件
import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      const { name } = context.command

      if (name === '能不能好好说话') {
        await nbnhhsh(context)
      }
    }
  })
}

import { post } from '../../libs/fetch.js'
import { missingParams } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'

async function nbnhhsh(context) {
  const {
    command: { params }
  } = context

  if (await missingParams(context, params, 1)) return

  let data
  try {
    data = await post({
      url: 'https://lab.magiconch.com/api/nbnhhsh/guess',
      data: { text: params[0] }
    })
      .then(res => res.json())
      .then(res => res[0])
  } catch (error) {
    if (debug) {
      logger.WARNING(`nbnhhsh get info failed`)
      logger.DEBUG(error)
    }
    return await replyMsg(context, `接口请求失败`, { reply: true })
  }

  if (!data) return await replyMsg(context, '空空也不知道这是什么意思呢~', { reply: true })

  await replyMsg(context, [`"${data.name}" 可能是:`, `${data.trans.join(',')}`].join('\n'), {
    reply: true
  })
}
