import { eventReg } from '../../libs/eventReg.js'
import { makeLogger } from '../../libs/logger.js'
import { replyMsg } from '../../libs/sendMsg.js'

const logger = makeLogger({ pluginName: 'block' })

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
  eventReg(
    'notice',
    async context => {
      return await checkBan(context)
    },
    102
  )
}

async function checkBan(context) {
  const { blockConfig } = global.config
  const { user_id, group_id, command } = context

  if (blockConfig.blockUsers.includes(user_id)) {
    if (debug) logger.DEBUG(`用户 ${user_id} 处于黑名单中`)
    return 'quit'
  }

  if (blockConfig.blockGroups.includes(group_id)) {
    if (debug) logger.DEBUG(`群组 ${group_id} 处于黑名单中`)
    return 'quit'
  }

  if (command) {
    for (let i = 0; i < blockConfig.blockedCommands.length; i++) {
      const element = blockConfig.blockedCommands[i]
      if (element.groupId !== '*' && !element.groupId.includes(group_id)) {
        continue
      }

      if (command.name.match(element.regexp)) {
        if (element.reply !== '') await replyMsg(context, element.reply ?? blockConfig.defaultReply)
        if (debug) logger.DEBUG(`群组 ${group_id} 的命令 ${element.regexp} 处于黑名单中`)
        return 'quit'
      }
    }
  }
}
