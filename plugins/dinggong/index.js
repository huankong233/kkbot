export default () => {
  global.config.dinggong = {}
  checkffmpeg()
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
export const checkffmpeg = async () => {
  if ((await bot('can_send_record')).data.yes) {
    global.config.dinggong.ffmpeg = true
    global.config.dinggong.path = getDirName(import.meta.url) + '/../../resources/record/dinggong/'
    global.config.dinggong.records = fs.readdirSync(global.config.dinggong.path)
  } else {
    global.config.dinggong.ffmpeg = false
  }
}

export const dinggong = async context => {
  const { path, records, ffmpeg } = global.config.dinggong
  if (ffmpeg) {
    //语音回复
    await replyMsg(
      context,
      CQ.record(
        `${process.platform === 'win32' ? 'file:///' : ''}${
          path + records[randomMaxToMin(records.length - 1, 0)]
        }`
      )
    )
  } else {
    //正常回复
    await replyMsg(context, '缺少ffmpeg,请联系管理员')
  }
}
