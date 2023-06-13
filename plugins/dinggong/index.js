export default () => {
  global.config.dinggong = {}
  init()
  event()
}

function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '钉宫语录') {
        await dinggong(context)
      }
    }
  })
}

import fs from 'fs'
export const init = async () => {
  if (global.config.bot.ffmpeg) {
    global.config.dinggong.path = getDirName(import.meta.url) + '/../../resources/record/dinggong/'
    global.config.dinggong.records = fs.readdirSync(global.config.dinggong.path)
  }
}

export const dinggong = async context => {
  const { path, records } = global.config.dinggong
  if (global.config.bot.ffmpeg) {
    const record = records[randomMaxToMin(records.length - 1, 0)]
    //语音回复
    await replyMsg(context, CQ.record(`file:///${path + record}`))
    await replyMsg(context, record.slice(0, record.length - 4).trim())
  } else {
    await replyMsg(context, '缺少ffmpeg,请联系管理员')
  }
}
