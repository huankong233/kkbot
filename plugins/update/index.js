import { eventReg } from '../../libs/eventReg.js'
import { replyMsg, sendMsg } from '../../libs/sendMsg.js'
import { CronJob } from 'cron'
import { compare } from 'compare-versions'
import { get } from '../../libs/fetch.js'
import { makeLogger } from '../../libs/logger.js'

const logger = makeLogger({ pluginName: 'update' })

export default async () => {
  const { updateConfig } = global.config
  if (updateConfig.enable) {
    await init()
    event()
  }
}

async function event() {
  eventReg('message', async (event, context, tags) => {
    const { command } = context
    if (command) {
      if (command.name === '检查更新') {
        await checkUpdate(true, context)
      }
    }
  })
}

async function init() {
  const { updateConfig } = global.config
  new CronJob(updateConfig.crontab, checkUpdate, null, true)
}

async function checkUpdate(manual = false, context) {
  const { botConfig, updateConfig } = global.config
  const { proxy, url } = updateConfig

  const local_version = kkbot_framework_version
  let remote_version

  try {
    remote_version = await get({ url: `${global.config.proxy ? '' : proxy}${url}` })
      .then(res => res.json())
      .then(res => res.kkbot_framework_version)
  } catch (error) {
    logger.DEBUG('检查更新失败')
  }

  if (!remote_version) {
    const message = ['检查更新失败', `当前版本: ${local_version}`, `请检查您的网络状况！`].join(
      '\n'
    )
    manual
      ? await replyMsg(context, message, { reply: true })
      : await sendMsg(botConfig.admin, message)
    return
  } else if (local_version) {
    if (compare(local_version, remote_version, '<')) {
      //需要更新，通知admin
      const message = [
        'kkbot有更新哟~',
        `最新版本: ${remote_version}`,
        `当前版本: ${local_version}`
      ].join('\n')

      if (manual) {
        await replyMsg(context, message, { reply: true })
      } else {
        await sendMsg(botConfig.admin, message)
      }
    }

    if (manual && compare(local_version, remote_version, '>=')) {
      await replyMsg(
        context,
        ['kkbot无需更新哟~', `最新版本: ${remote_version}`, `当前版本: ${local_version}`].join(
          '\n'
        ),
        { reply: true }
      )
    }
  }
}
