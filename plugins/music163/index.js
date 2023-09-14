import { eventReg } from '../../libs/eventReg.js'
import { get } from '../../libs/fetch.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { makeLogger } from '../../libs/logger.js'
import { CQ } from 'go-cqwebsocket'

const logger = makeLogger({ pluginName: 'music_163' })

export default () => {
  event()
}

function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.message.match('^(到点了|12点了|生而为人|网抑云)$')) {
      await music_163(context)
    }
  })
}

async function music_163(context) {
  const { music163Config } = global.config
  let data, msg

  try {
    ;({ data, msg } = await get({
      url: 'https://v2.alapi.cn/api/comment',
      data: { token: music163Config.token }
    }).then(res => res.json()))
  } catch (error) {
    logger.WARNING(`请求接口失败`)
    logger.ERROR(error)
    return await replyMsg(context, `接口请求失败`, { reply: true })
  }

  if (!data) return await replyMsg(context, `请求失败,原因:${msg}`, { reply: true })

  await replyMsg(
    context,
    [`歌名:${data.title}`, `${data.comment_nickname}说:${data.comment_content}`].join('\n'),
    { reply: true }
  )

  await replyMsg(context, CQ.music('163', data.song_id))
}
