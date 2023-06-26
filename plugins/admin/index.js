import { loadConfig } from '../../libs/loadConfig.js'
import { eventReg } from '../../libs/eventReg.js'

export default () => {
  loadConfig('admin')

  event()
}

function event() {
  eventReg('notice', async context => {
    await notice(context)
  })

  eventReg('request', async context => {
    await request(context)
  })

  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '入群') {
        await invite(context, context.command.params, 'invite')
      } else if (context.command.name === '加群') {
        await invite(context, context.command.params, 'add')
      } else if (context.command.name === '好友') {
        await friend(context, context.command.params)
      }
    }
  })
}

import { sendMsg, replyMsg } from '../../libs/sendMsg.js'
import { getUserName } from '../query/index.js'

//notice事件处理
export const notice = async context => {
  const { notice_type, sub_type, self_id, user_id, group_id } = context
  //判断不是机器人
  if (self_id === user_id) return

  if (notice_type === 'group_increase') {
    if (sub_type === 'approve') {
      await replyMsg(
        { message_type: 'group', user_id, group_id },
        `欢迎加群呀~${await getUserName(user_id)}`,
        true
      )
    }
  }

  if (notice_type === 'group_decrease') {
    if (sub_type === 'leave') {
      await replyMsg(
        { message_type: 'group', user_id, group_id },
        `${await getUserName(user_id)}退群了 (*>.<*)`
      )
    }
  }
}

//request事件处理
export const request = async context => {
  const { request_type, sub_type } = context

  if (request_type === 'group') {
    if (sub_type === 'add') {
      //申请加群
      await sendNotice(context, '加群', global.config.admin.add.agree)
      if (global.config.admin.add.agree) {
        await invite(context, ['批准', context.flag], 'add')
      }
    } else if (sub_type === 'invite') {
      //邀请机器人入群
      await sendNotice(context, '入群', global.config.admin.invite.agree)
      if (global.config.admin.invite.agree) {
        await invite(context, ['批准', context.flag], 'invite')
      }
    }
  }

  if (request_type === 'friend') {
    //添加好友
    await sendNotice(context, '好友', global.config.admin.friend.agree)
    if (global.config.admin.friend.agree) {
      await friend(context, ['批准', context.flag])
    }
  }
}

//给admin发送通知
export const sendNotice = async (context, name, auto) => {
  const { flag, user_id, group_id, comment } = context

  let reply = [`用户 : ${user_id}`]
  if (name !== '好友') reply.push(`申请${name} : ${group_id}`)
  reply.push(`验证信息 : ${comment}`)
  if (auto) {
    reply.push(`批准回复 : ${global.config.bot.prefix}${name} 批准 ${flag}`)
    let refuse = `拒绝回复 : ${global.config.bot.prefix}${name} 拒绝 ${flag}`
    if (name !== '好友') refuse += '拒绝原因(可选)'
    reply.push(refuse)
  } else {
    reply.push(`已自动同意了哦~`)
  }

  await sendMsg(global.config.bot.admin, reply.filter(s => s && s.trim()).join('\n'))
}

//同意入群/加群请求
export const invite = async (context, params, sub_type) => {
  if (params[0] === '批准') {
    await bot('set_group_add_request', {
      flag: params[1],
      sub_type,
      approve: true
    })
  } else if (params[0] === '拒绝') {
    await bot('set_group_add_request', {
      flag: params[1],
      sub_type,
      approve: false,
      reason: params[2] ? params[2] : ''
    })
  } else {
    return await replyMsg(context, '方法不存在')
  }
  await replyMsg(context, '执行成功(不代表处理结果)')
}

//同意加好友请求
export const friend = async (context, params) => {
  if (params[0] === '批准') {
    await bot('set_friend_add_request', {
      flag: params[1],
      approve: true
    })
  } else if (params[0] === '拒绝') {
    await bot('set_friend_add_request', {
      flag: params[1],
      approve: false
    })
  } else {
    return await replyMsg(context, '方法不存在')
  }
  await replyMsg(context, '执行成功(不代表处理结果)')
}
