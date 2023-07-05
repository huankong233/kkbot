export default () => {
  event()
}

//注册事件
import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.message.match('^(到点了|12点了|生而为人|网抑云)$')) {
      await comments_163(context)
    }
  })
}

import { get } from '../../libs/fetch.js'
import { replyMsg } from '../../libs/sendMsg.js'

export const comments_163 = async context => {
  const data = await get({
    url: 'https://v2.alapi.cn/api/comment',
    data: { token: global.config.music163.token }
  }).then(res => res.json())

  if (!data.data) return await replyMsg(context, `请求失败,原因:${data.msg}`)

  await replyMsg(
    context,
    [
      `歌名:${data.data.title}`,
      `${data.data.comment_nickname}说:${data.data.comment_content}`
    ].join('\n')
  )

  await replyMsg(context, CQ.music('163', data.data.song_id))
}
