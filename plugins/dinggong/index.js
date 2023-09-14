import fs from 'fs'
import path from 'path'
import { eventReg } from '../../libs/eventReg.js'
import { randomInt } from '../../libs/random.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { CQ } from 'go-cqwebsocket'
import { getDirName } from '../../libs/getDirName.js'
import { makeLogger } from '../../libs/logger.js'

const logger = makeLogger({ pluginName: 'dinggong' })

export default () => {
  init()
  event()
}

function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '钉宫语录') {
        await dinggong(context)
      }
    }
  })
}

async function init() {
  let { botData } = global.data
  if (botData.ffmpeg) {
    const baseDir = getDirName(import.meta.url)
    const resourcesPath = path.join(baseDir, 'resources')
    global.data.dinggongData = {
      resourcesPath,
      records: fs.readdirSync(resourcesPath)
    }
  } else {
    logger.WARNING('未安装ffmpeg，无法发送语音')
  }
}

async function dinggong(context) {
  let { botData, dinggongData } = global.data
  const { resourcesPath, records } = dinggongData
  if (botData.ffmpeg) {
    const recordName = records[randomInt(records.length - 1, 0)]
    await replyMsg(context, path.basename(recordName, '.mp3'), { reply: true })
    //语音回复
    await replyMsg(context, CQ.record(`file:///${path.join(resourcesPath, recordName)}`))
  } else {
    await replyMsg(context, '缺少ffmpeg,请联系管理员', { reply: true })
  }
}
