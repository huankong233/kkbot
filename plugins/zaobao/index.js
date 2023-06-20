export default async () => {
  // 仅限非开发模式启用
  if (!global.config.bot.debug) {
    await loadConfig('zaobao.jsonc', true)
    event()
    init()
  }
}

//注册事件
async function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '早报') {
        await zaobao(context)
      }
    }
  })
}

export const init = () => {
  let temp = []
  global.config.zaobao.groups.forEach(group_id => {
    temp.push({
      group_id,
      said: false,
      timestamp: 0
    })
  })
  global.config.zaobao.groups = temp

  startInterval()
}

import { isToday } from '../gugu/index.js'

export const startInterval = () => {
  setInterval(async function () {
    const date = new Date()
    if (date.getHours() === global.config.zaobao.time && date.getMinutes() === 2) {
      const response = await fetch(global.config.zaobao.api)
      global.config.zaobao.groups.forEach(async (group, index) => {
        if (group.said && !isToday(group.timestamp)) {
          // 已发送过并且是同一天
          return
        }

        await replyMsg(
          { message_type: 'group', group_id: group.group_id },
          CQ.image(response.imageUrl)
        )

        global.config.zaobao.groups[index] = {
          timestamp: Date.now(),
          group_id: group.group_id,
          said: true
        }
      })
    }
  }, 60000)
}

export const zaobao = async context => {
  const response = await fetch(global.config.zaobao.api)
  if (response.msg === 'Success') {
    await replyMsg(context, CQ.image(response.imageUrl))
  }
}
