export default async () => {
  await init()

  event()
}

import { CronJob } from 'cron'
import { sleep } from '../../libs/sleep.js'

async function init() {
  const { epicgames } = global.config
  if (epicgames.groups.length === 0) return
  new CronJob(
    epicgames.crontab,
    async function () {
      const messages = await prepareMessage()
      for (let i = 0; i < epicgames.groups.length; i++) {
        const group_id = epicgames.groups[i]

        const fakeContext = {
          message_type: 'group',
          group_id
        }

        const response = await sendForwardMsg(fakeContext, messages)
        if (response.status === 'failed') {
          await replyMsg(fakeContext, '发送合并消息失败')
        }

        await sleep(5000)
      }
    },
    null,
    true
  )
}

import { eventReg } from '../../libs/eventReg.js'
function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === 'epic') {
        await epic(context)
      }
    }
  })
}

import { epicApi } from './lib.js'
import { replyMsg, sendForwardMsg } from '../../libs/sendMsg.js'
export const epic = async context => {
  const messages = await prepareMessage(context)
  const response = await sendForwardMsg(context, messages)

  if (response.status === 'failed') {
    await replyMsg(context, '发送合并消息失败，可以尝试私聊我哦~')
  }
}

async function prepareMessage(context = {}) {
  const { bot } = global.config
  const data = await epicApi()

  let messages = [
    CQ.node(
      global.config.bot.botName,
      context.self_id ?? bot.admin,
      `今日共有${data.length}个免费游戏~`
    )
  ]

  data.forEach(item => {
    messages.push(
      CQ.node(
        global.config.bot.botName,
        context.self_id ?? bot.admin,
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

  return messages
}
