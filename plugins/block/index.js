import { eventReg } from '../../libs/eventReg.js'
import logger from '../../libs/logger.js'
import { replyMsg } from '../../libs/sendMsg.js'

export default () => {
  event()
}

function event() {
  //判断用户是否注册过了
  eventReg(
    'message',
    async (event, context, tags) => {
      return await checkBan(context)
    },
    102
  )
}

async function checkBan(context) {
  const { blockUsers, blockGroups, defaultReply, blockedCommands } = global.config.block
  const { user_id, group_id, command } = context

  if (blockUsers.includes(user_id)) {
    if (debug) logger.DEBUG(`用户 ${user_id} 处于黑名单中`)

    return 'quit'
  }

  if (blockGroups.includes(group_id)) {
    if (debug) logger.DEBUG(`群组 ${group_id} 处于黑名单中`)

    return 'quit'
  }

  if (command) {
    for (let i = 0; i < blockedCommands.length; i++) {
      const element = blockedCommands[i]
      if (element.groupId !== '*' && !element.groupId.includes(group_id)) {
        continue
      }

      if (command.name.match(element.regexp)) {
        if (element.reply !== '') await replyMsg(context, element.reply ?? defaultReply)
        if (debug) logger.DEBUG(`群组 ${group_id} 的命令 ${element.regexp} 处于黑名单中`)
        return 'quit'
      }
    }
  }
}
