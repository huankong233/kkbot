import { CQ } from 'go-cqwebsocket'
import { eventReg } from '../../libs/eventReg.js'
import { get } from '../../libs/fetch.js'
import { isFriend } from '../../libs/Api.js'
import { replyMsg, sendMsg } from '../../libs/sendMsg.js'
import { makeLogger } from '../../libs/logger.js'

const logger = makeLogger({ pluginName: 'prprme' })

export default () => {
  event()
}

function event() {
  eventReg('message', async (event, context, tags) => {
    const { command } = context

    if (command) {
      if (command.name === '舔我') {
        await prprme(context)
      } else if (command.name === '别舔了') {
        await stoprprme(context)
      }
    }
  })
}

async function prprme(context) {
  const { user_id } = context
  const { botConfig } = global.config
  const { prprmeData } = global.data

  if (!(await isFriend({ user_id }))) {
    await replyMsg(context, '先加一下好友叭~咱也是会害羞的', { reply: true })
  }

  await sendMsg(
    user_id,
    [`我真的好喜欢你啊!!`, `（回复"${botConfig.prefix}别舔了"来停止哦~）`].join('\n')
  )

  prprmeData[user_id] = setInterval(async () => {
    try {
      const data = await get({ url: 'https://api.uomg.com/api/rand.qinghua?format=json' }).then(
        res => res.json()
      )
      await sendMsg(user_id, data.content)
    } catch (error) {
      clearInterval(id)
      logger.WARNING(`请求接口失败`)
      logger.ERROR(error)
      return await replyMsg(context, `接口请求失败`)
    }
  }, 3000)
}

async function stoprprme(context) {
  const { prprmeData } = global.data
  const { user_id } = context

  const id = prprmeData[user_id]
  if (id) {
    clearInterval(id)
    await sendMsg(user_id, CQ.image('https://s1.ax1x.com/2023/09/04/pPrn9B9.jpg'))
  }
}
