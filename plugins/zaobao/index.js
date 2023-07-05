export default async () => {
  await init()

  event()
}

import { CronJob } from 'cron'
import { sleep } from '../../libs/sleep.js'

async function init() {
  const { zaobao } = global.config
  if (zaobao.groups.length === 0) return
  new CronJob(
    zaobao.crontab,
    async function () {
      const message = await prepareMessage()
      for (let i = 0; i < zaobao.groups.length; i++) {
        const group_id = zaobao.groups[i]

        const fakeContext = {
          message_type: 'group',
          group_id
        }

        await replyMsg(fakeContext, message)

        await sleep(zaobao.cd)
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
      if (context.command.name === '早报') {
        await zaobao(context)
      }
    }
  })
}

import { get } from '../../libs/fetch.js'
import { replyMsg } from '../../libs/sendMsg.js'
export const zaobao = async context => {
  await replyMsg(context, await prepareMessage())
}

export const prepareMessage = async () => {
  const response = await get({ url: 'https://api.2xb.cn/zaob' }).then(res => res.json())
  if (response.msg === 'Success') {
    return CQ.image(response.imageUrl)
  }
}
