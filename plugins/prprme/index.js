export default () => {
  global.prprmeCode = {}

  event()
}

//注册事件
import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '舔我') {
        await prprme(context)
      } else if (context.command.name === '别舔了') {
        await stoprprme(context)
      }
    }
  })
}

import { get } from '../../libs/fetch.js'
import { isFriend } from '../../libs/Api.js'
import { replyMsg, sendMsg } from '../../libs/sendMsg.js'

export const prprme = async context => {
  const { user_id } = context

  if (await isFriend({ user_id })) {
    await sendMsg(
      user_id,
      `我真的好喜欢你啊!!\n（回复"${global.config.bot.prefix}别舔了"来停止哦~）`
    )

    let id = setInterval(async () => {
      try {
        const data = await get({ url: 'https://api.uomg.com/api/rand.qinghua?format=json' }).then(
          res => res.json()
        )
        await sendMsg(user_id, data.content)
      } catch (error) {}
    }, 3000)
    global.prprmeCode[context.user_id] = id
  } else {
    await replyMsg(context, '先加一下好友叭~咱也是会害羞的')
  }
}

export const stoprprme = async context => {
  const data = global.prprmeCode[context.user_id]
  if (data) {
    clearInterval(data)
    await bot('send_private_msg', {
      user_id: context.user_id,
      message: '呜呜，对不起惹你生气了'
    })
  }
}
