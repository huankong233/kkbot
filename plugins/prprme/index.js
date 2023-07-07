export default () => {
  global.config.prprme = {}

  event()
}

//注册事件
import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      const { name } = context.command

      if (name === '舔我') {
        await prprme(context)
      } else if (name === '别舔了') {
        await stoprprme(context)
      }
    }
  })
}

import { get } from '../../libs/fetch.js'
import { isFriend } from '../../libs/Api.js'
import { replyMsg, sendMsg } from '../../libs/sendMsg.js'

async function prprme(context) {
  const { user_id } = context
  const { prprme, bot } = global.config

  if (await isFriend({ user_id })) {
    await sendMsg(
      user_id,
      [`我真的好喜欢你啊!!`, `（回复"${bot.prefix}别舔了"来停止哦~）`].join('\n')
    )

    let id = setInterval(async () => {
      try {
        const data = await get({ url: 'https://api.uomg.com/api/rand.qinghua?format=json' }).then(
          res => res.json()
        )
        await sendMsg(user_id, data.content)
      } catch (error) {
        clearInterval(id)
        if (debug) {
          logger.WARNING(`prprme get info failed`)
          logger.DEBUG(error)
        }
        return await replyMsg(context, `接口请求失败`)
      }
    }, 3000)

    prprme[user_id] = id
  } else {
    await replyMsg(context, '先加一下好友叭~咱也是会害羞的', { reply: true })
  }
}

async function stoprprme(context) {
  const { prprme } = global.config
  const { user_id } = context

  const data = prprme[user_id]
  if (data) {
    clearInterval(data)
    await sendMsg(user_id, '呜呜，对不起惹你生气了')
  }
}
