export default async () => {
  if (global.config.update.enable) {
    await init()
    event()
  }
}

//注册事件
import { eventReg } from '../../libs/eventReg.js'
import { replyMsg, sendMsg } from '../../libs/sendMsg.js'

async function event() {
  //手动检查更新
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '检查更新') {
        await checkUpdate(true, context)
      }
    }
  })
}

import { CronJob } from 'cron'
async function init() {
  const { update } = global.config
  new CronJob(update.crontab, checkUpdate, null, true)
}

//检查更新
import { compare } from 'compare-versions'
import { get } from '../../libs/fetch.js'
export const checkUpdate = async (manual = false, context) => {
  const { proxy, url } = global.config.update

  const local_version = kkbot_framework_version
  const remote_version = await get({ url: proxy + url })
    .then(res => res.json())
    .then(res => res.kkbot_framework_version)

  if (!remote_version) {
    const message = ['检查更新失败', `当前版本${local_version}`, `请检查您的网络状况！`].join('\n')

    if (manual) {
      await replyMsg(context, message)
    } else {
      await sendMsg(global.config.bot.admin, message)
    }

    return
  }

  if (remote_version && local_version) {
    if (compare(local_version, remote_version, '<')) {
      //需要更新，通知admin
      const message = [
        'kkbot有更新哟~',
        `最新版本${remote_version}`,
        `当前版本${local_version}`
      ].join('\n')

      if (manual) {
        await replyMsg(context, message)
      } else {
        await sendMsg(global.config.bot.admin, message)
      }
    }

    if (manual && compare(local_version, remote_version, '>=')) {
      await replyMsg(
        context,
        ['kkbot无需更新哟~', `最新版本${remote_version}`, `当前版本${local_version}`].join('\n')
      )
    }
  }
}
