export default async () => {
  await loadConfig('update.jsonc', true)
  global.config.update.count = 0
  event()
}

//注册事件
async function event() {
  if (global.config.update.enable) {
    await checkUpdate()
    global.config.update.id = setInterval(async () => {
      await checkUpdate()
    }, global.config.update.hz)
  }
  //手动检查更新
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '检查更新') {
        await checkUpdate(true)
      }
    }
  })
}

//检查更新
import fs from 'fs'
import { compare } from 'compare-versions'
export const checkUpdate = async (manual = false) => {
  const { proxy, url } = global.config.update
  try {
    const remote_version = (await fetch(proxy + url)).version
    const local_version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version
    if (compare(local_version, remote_version, '<')) {
      //需要更新，通知admin
      await sendMsg(
        global.config.bot.admin,
        ['kkbot有更新哟~', `最新版本${remote_version} | 当前版本${local_version}`].join('\n')
      )
      clearInterval(global.config.update.id)
    }
    if (manual && compare(local_version, remote_version, '=')) {
      await sendMsg(
        global.config.bot.admin,
        ['kkbot无需更新哟~', `最新版本${remote_version}`, `当前版本${local_version}`].join('\n')
      )
    }
  } catch (error) {
    global.config.update.count++
    if (global.config.update.count === global.config.update.max) {
      await sendMsg(
        global.config.bot.admin,
        ['检查更新失败', `当前版本${local_version} | 请检查您的网络状况！`].join('\n')
      )
      clearInterval(global.config.bot.id)
    }
  }
}
