export default async () => {
  event()
}

import { eventReg } from '../../libs/eventReg.js'
function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      const { name } = context.command

      if (name === '鸽了') {
        await mute(context)
      }
    }
  })
}

import { getGroupMemberInfo, setGroupBan } from '../../libs/Api.js'
import { randomInt } from '../../libs/random.js'
import { replyMsg } from '../../libs/sendMsg.js'

/**
 * 口球
 * @param {Object} context
 * @param {Boolean} manual 是否为手动
 * @param {Array} time
 * @returns
 */
export async function mute(context, manual = true, time = []) {
  const { group_id, user_id, self_id, message_type } = context

  if (message_type === 'private') {
    return manual ? await replyMsg(context, '爬爬爬，私聊来找茬是吧') : false
  }

  //判断对方信息
  const user = await getGroupMemberInfo({ group_id, user_id })
  const userData = user.data

  //判断自己信息
  const self = await getGroupMemberInfo({ group_id, user_id: self_id })
  const selfData = self.data

  if (selfData.role !== 'admin' && selfData.role !== 'owner') {
    return manual
      ? await replyMsg(context, [`咱还不是管理员呢~`, `管理！快给我上管理！(大声)`].join('\n'))
      : false
  }

  if (selfData.role === 'admin') {
    if (userData.role !== 'member') {
      return manual
        ? await replyMsg(
            context,
            `╭(╯^╰)╮ 快来人给他把${userData.role === 'admin' ? '管理员' : '群主'}下了！！`
          )
        : false
    }
  }

  const { mute } = global.config

  const muteTime = randomInt(time[0] ?? mute.time[0], time[1] ?? mute.time[1])

  const response = await setGroupBan({
    group_id: context.group_id,
    user_id: context.user_id,
    duration: muteTime
  })

  if (response.status === 'ok') {
    if (manual) await replyMsg(context, '还鸽不鸽了')
    return true
  } else {
    if (manual) await replyMsg(context, '(ﾟдﾟ；) 失败了?!不可能!!')
    return false
  }
}
