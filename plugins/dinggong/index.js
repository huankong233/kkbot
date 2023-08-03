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

async function init() {
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

async function dinggong(context) {
  const { bot, dinggong } = global.config
  const { resourcesPath, records } = dinggong
  if (bot.ffmpeg) {
    const recordName = records[randomInt(records.length - 1, 0)]
    await replyMsg(context, path.basename(recordName, '.mp3'), { reply: true })
    //语音回复
    await replyMsg(context, CQ.record(`file:///${path.join(resourcesPath, recordName)}`))
  } else {
    await replyMsg(context, '缺少ffmpeg,请联系管理员', { reply: true })
  }
}
