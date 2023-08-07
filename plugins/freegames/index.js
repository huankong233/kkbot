export default async () => {
  await init()

  event()
}

import { CronJob } from 'cron'
import { sleep } from '../../libs/sleep.js'
import { replyMsg, sendForwardMsg } from '../../libs/sendMsg.js'
import logger from '../../libs/logger.js'

async function init() {
  const { freegames } = global.config
  if (freegames.groups.length === 0) return
  new CronJob(
    freegames.crontab,
    async function () {
      let messages
      try {
        messages = await prepareMessage()
      } catch (error) {
        logger.WARNING(`freegames get info failed`)
        if (debug) {
          logger.DEBUG(error)
        } else {
          logger.WARNING(error)
        }
        return
      }

      for (let i = 0; i < freegames.groups.length; i++) {
        const group_id = freegames.groups[i]

        const fakeContext = {
          message_type: 'group',
          group_id
        }

        await sendForwardMsg(fakeContext, messages)
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
      const { name } = context.command

      if (name === 'freegames') {
        await freegames(context)
      }
    }
  })
}

import { epicApi, steamApi } from './lib.js'
async function freegames(context) {
  let messages
  try {
    messages = await prepareMessage()
  } catch (error) {
    logger.WARNING(`freegames get info failed`)

    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
    return await replyMsg(context, `接口请求失败`, { reply: true })
  }
  const response = await sendForwardMsg(context, messages)

  if (response.status === 'failed') {
    await replyMsg(context, '发送合并消息失败，可以尝试私聊我哦~', { reply: true })
  }
}

async function prepareMessage() {
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
