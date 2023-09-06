import { CronJob } from 'cron'
import { sleep } from '../../libs/sleep.js'
import { eventReg } from '../../libs/eventReg.js'
import { get, retryAsync } from '../../libs/fetch.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { makeLogger } from '../../libs/logger.js'
import { CQ } from 'go-cqwebsocket'
import dayjs from 'dayjs'

const logger = makeLogger({ pluginName: 'zaobao' })
const cronLogger = logger.changeSubModule('Cron')

export default async () => {
  await init()
  event()
}

function event() {
  eventReg('message', async (event, context, tags) => {
    const { command } = context
    if (command) {
      if (command.name === '早报') {
        await zaobao(context)
      }
    }
  })
}

async function init() {
  const { zaobaoConfig } = global.config

  if (zaobaoConfig.groups.length === 0) return
  new CronJob(
    zaobaoConfig.crontab,
    async function () {
      let message

      try {
        message = await prepareMessage()
      } catch (error) {
        logger.WARNING(`请求接口失败`)
        logger.ERROR(error)
        return
      }

      for (let i = 0; i < zaobaoConfig.groups.length; i++) {
        const group_id = zaobaoConfig.groups[i]

        const fakeContext = {
          message_type: 'group',
          group_id
        }

        await replyMsg(fakeContext, message)

        await sleep(zaobaoConfig.cd * 1000)
      }
    },
    null,
    true
  )
}

async function zaobao(context) {
  await replyMsg(context, await prepareMessage())
}

async function prepareMessage() {
  let response
  try {
    await retryAsync(
      async () => {
        response = await get({ url: 'https://api.2xb.cn/zaob' }).then(res => res.json())
        if (response.datatime !== dayjs().format('YYYY-MM-DD')) {
          throw new Error('wrong time')
        }
      },
      3,
      1000 * 60 * 30
    )
  } catch (error) {
    logger.WARNING('早报获取失败')
    logger.ERROR(error)
    return '早报获取失败'
  }

  return response.msg === 'Success' ? CQ.image(response.imageUrl) : '早报获取失败'
}
