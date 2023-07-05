export default () => {
  event()
}

//注册事件
import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '舔狗日记') {
        await dog(context)
      }
    }
  })
}

import { get } from '../../libs/fetch.js'
import { replyMsg } from '../../libs/sendMsg.js'

async function dog(context) {
  const data = await get({ url: 'https://api.oick.cn/dog/api.php' }).then(res => res.text())
  await replyMsg(context, data.slice(1, -1))
}
