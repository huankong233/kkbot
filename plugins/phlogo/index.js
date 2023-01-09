export default () => {
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === 'phlogo') {
        await phlogo(context)
      }
    }
  })
}

export const phlogo = async context => {
  if (context.command.params.length >= 2) {
    const { execSync } = await import('child_process')
    try {
      const path = getDirName(import.meta.url)
      const data = execSync(
        `python3 ${path}/./phlogo/start.py ${context.command.params[0]} ${context.command.params[1]}`
      )
      const buf = Buffer.from(data)
      await replyMsg(context, CQ.image(buf.toString()))
    } catch (error) {
      await replyMsg(context, '制作失败')
    }
  } else {
    await replyMsg(context, `参数不足，请发送"${global.config.bot.prefix}帮助 phlogo"查看帮助`)
  }
}
