export default () => {
  init()
  event()
}

import { eventReg } from '../../libs/eventReg.js'
function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '钉宫语录') {
        await dinggong(context)
      }
    }
  })
}

import fs from 'fs'
import path from 'path'
import { getDirName } from '../../libs/getDirname.js'

export const init = async () => {
  const { bot } = global.config
  if (bot.ffmpeg) {
    const baseDir = getDirName(import.meta.url)
    const resourcesPath = path.join(baseDir, 'resources')
    global.config.dinggong = {
      resourcesPath,
      records: fs.readdirSync(resourcesPath)
    }
  }
}

import { randomInt } from '../../libs/random.js'
import { replyMsg } from '../../libs/sendMsg.js'

export const dinggong = async context => {
  const { bot, dinggong } = global.config
  const { resourcesPath, records } = dinggong
  if (bot.ffmpeg) {
    const recordName = records[randomInt(records.length - 1, 0)]
    //语音回复
    await replyMsg(context, CQ.record(`file:///${path.join(resourcesPath, recordName)}`))
    await replyMsg(context, path.basename(recordName, '.mp3'))
  } else {
    await replyMsg(context, '缺少ffmpeg,请联系管理员')
  }
}
