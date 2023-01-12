export default async () => {
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === 'epic') {
        await epic(context)
      }
    }
  })
}

import { epicApi } from './lib.js'
export const epic = async context => {
  const data = await epicApi()
  let messages = [
    CQ.node(global.config.bot.botName, context.self_id, `今日共有${data.length}个免费游戏~`)
  ]
  data.forEach(item => {
    messages.push(
      CQ.node(
        global.config.bot.botName,
        context.self_id,
        [
          `${CQ.image(item.description.image)}`,
          `游戏名:${item.title}`,
          `开发商:${item.author}`,
          `发行日期:${item.pubDate}`,
          `简介:${item.description.description}`,
          `购买链接:${item.link}`
        ].join('\n')
      )
    )
  })
  const response = await send_forward_msg(context, messages)
  if (response.status === 'failed') {
    await replyMsg(context, '发送合并消息失败，可以尝试私聊我哦~')
  }
}
