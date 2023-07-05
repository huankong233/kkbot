export default async () => {
  await initial()

  event()
}

import { eventReg } from '../../libs/eventReg.js'
function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '帮助') {
        await help(context)
      } else if (context.command.name === 'help') {
        await help(context)
      }
    }
  })
}

import fs from 'fs'
import path from 'path'
import { jsonc } from 'jsonc'

async function initial() {
  let commandList = []

  global.plugins.forEach(plugin => {
    const commandsPath = path.join(plugin.dir, `commands.jsonc`)
    const exists = fs.existsSync(commandsPath)
    if (exists) {
      const commands = jsonc.parse(fs.readFileSync(commandsPath, { encoding: 'utf-8' }))
      commandList.push(...commands)
    }
  })

  global.config.help = { commandList }
}

import { replyMsg } from '../../libs/sendMsg.js'

async function help(context) {
  const { help } = global.config

  const name = context.command.params[0]

  if (name) {
    const command = help.commandList.find(item => item.commandName === name)
    if (command) {
      await replyMsg(
        context,
        [
          `命令:${command.commandName}`,
          `简介( [ ] 为必选参数  ( ) 为可选参数 ):`,
          `${command.commandDescription.join('\n')}`
        ].join('\n')
      )
    } else {
      await replyMsg(context, '没有这个命令哦~')
    }
  } else {
    let str = [`使用"${global.config.bot.prefix}帮助 命令名称"来获取详情`, `命令列表:`]
    help.commandList.forEach(command => str.push(command.commandName))
    await replyMsg(context, str.join('\n'))
  }
}
