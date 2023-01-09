export default () => {
  event()
}

function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '鲁迅说') {
        await luxun(context)
      }
    }
  })
}

//notice事件处理
export const luxun = async context => {
  if (context.command.params.length >= 1) {
    const { execSync } = await import('child_process')
    try {
      const path = getDirName(import.meta.url)
      const data = execSync(`python3 ${path}/./luxun/start.py ${context.command.params[0]}`)
      const buf = Buffer.from(data)
      const response = buf.toString()
      await replyMsg(context, CQ.image(`base64://${response}`))
    } catch (error) {
      const buf = Buffer.from(error.stderr)
      const response = buf.toString()
      if (response.search('too long') !== -1) {
        await replyMsg(context, '太长鲁迅说不完了')
      } else {
        await replyMsg(context, '制作失败')
      }
    }
  } else {
    await replyMsg(context, `参数不足，请发送"${global.config.bot.prefix}帮助 鲁迅说"查看帮助`)
  }
}
