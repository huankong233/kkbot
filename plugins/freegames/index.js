export default async () => {
  await init()

  event()
}

import { CronJob } from 'cron'
import { sleep } from '../../libs/sleep.js'

async function init() {
  const { freegames } = global.config
  if (freegames.groups.length === 0) return
  new CronJob(
    freegames.crontab,
    async function () {
      const messages = await prepareMessage()
      for (let i = 0; i < freegames.groups.length; i++) {
        const group_id = freegames.groups[i]

        const fakeContext = {
          message_type: 'group',
          group_id
        }

        const response = await sendForwardMsg(fakeContext, messages)
        if (response.status === 'failed') {
          await replyMsg(fakeContext, '发送合并消息失败')
        }

        await sleep(freegames.cd)
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
      if (context.command.name === 'freegames') {
        await freegames(context)
      }
    }
  })
}

import { epicApi, steamApi } from './lib.js'
import { replyMsg, sendForwardMsg } from '../../libs/sendMsg.js'
export const freegames = async context => {
  const messages = await prepareMessage(context)
  const response = await sendForwardMsg(context, messages)

  if (response.status === 'failed') {
    await replyMsg(context, '发送合并消息失败，可以尝试私聊我哦~')
  }
}

async function prepareMessage(context = {}) {
  const { bot } = global.config
  const epic = await epicApi()
  const steam = await steamApi()

  let messages = []

  messages.push(
    CQ.node(bot.info.nickname, bot.info.user_id, `今日epic共有${epic.length}个免费游戏~`)
  )

  epic.forEach(item => {
    messages.push(
      CQ.node(
        bot.info.nickname,
        bot.info.user_id,
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

  messages.push(
    CQ.node(bot.info.nickname, bot.info.user_id, `今日steam共有${steam.length}个免费游戏~`)
  )

  steam.forEach(item => {
    messages.push(
      CQ.node(
        bot.info.nickname,
        bot.info.user_id,
        [
          `${CQ.image(item.img)}`,
          `游戏名:${item.title}`,
          `发行日期:${item.releasedTime}`,
          `购买链接:${item.url}`
        ].join('\n')
      )
    )
  })

  return messages
}
