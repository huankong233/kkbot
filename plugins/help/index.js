export default async () => {
  loadConfig('help.jsonc', true)
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '帮助') {
        await help(context)
      }
    }
  })
}

export const help = async context => {
  const help = global.config.help
  const name = context.command.params[0]
  if (name) {
    let str = '没有这个命令!'
    if (help[name] !== undefined) {
      str = `${name}:${help[name]}`
    }
    await replyMsg(context, str)
  } else {
    let str = `使用"${global.config.bot.prefix}帮助 命令名称"来获取详情\n命令列表:\n`
    for (const key in help) {
      str += key + '\n'
    }
    await replyMsg(context, str.slice(0, -1))
  }
}
