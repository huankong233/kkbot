import { eventReg } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'
import fs from 'fs'
import path from 'path'
import { jsonc } from 'jsonc'

export default async () => {
  await initial()

  event()
}

function event() {
  eventReg('message', async (event, context, tags) => {
    const { command } = context
    if (command) {
      if (command.name === '帮助' || command.name === 'help') {
        await help(context)
      }
    }
  })
}

async function initial() {
  const { plugins } = global
  let { helpData } = global.data
  const commandList = []

  for (const key in plugins) {
    const element = plugins[key]
    const commandsPath = path.join(element.dir, `commands.jsonc`)
    if (fs.existsSync(commandsPath)) {
      const commands = jsonc.parse(fs.readFileSync(commandsPath, { encoding: 'utf-8' }))
      commandList.push(...commands)
    }
  }

  helpData['commandList'] = commandList
}

async function help(context) {
  const { botConfig } = global.config
  const { helpData } = global.data
  const {
    user_id,
    command: { params }
  } = context

  const name = params[0]
  const isAdmin = user_id === botConfig.admin

  if (name) {
    const command = helpData.commandList.find(item => item.commandName === name)
    if (command) {
      await replyMsg(
        context,
        [
          `命令:${command.commandName}`,
          `简介( [ ] 为必选参数  ( ) 为可选参数 ):`,
          `${command.commandDescription.join('\n')}`
        ].join('\n'),
        { reply: true }
      )
    } else {
      await replyMsg(context, '没有这个命令哦~', { reply: true })
    }
  } else {
    let str = [`使用"${bot.prefix}帮助 命令名称"来获取详情`, `命令列表:`]
    helpData.commandList.forEach(command => {
      if (command.admin) {
        if (isAdmin) str.push(command.commandName)
      } else {
        str.push(command.commandName)
      }
    })
    await replyMsg(context, str.join('\n'), { reply: true })
  }
}
