export default () => {
  event()
}

//注册事件
import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '能不能好好说话') {
        await nbnhhsh(context)
      }
    }
  })
}

import { post } from '../../libs/fetch.js'
import { missingParams } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'

async function nbnhhsh(context) {
  if (await missingParams(context, context.command.params, 1)) return

  const data = await post({
    url: 'https://lab.magiconch.com/api/nbnhhsh/guess',
    data: {
      text: context.command.params[0]
    }
  })
    .then(res => res.json())
    .then(res => res[0])

  if (!data) return await replyMsg(context, '空空也不知道这是什么意思呢~')

  await replyMsg(context, [`"${data.name}" 可能是:`, `${data.trans.join(',')}`].join('\n'))
}
