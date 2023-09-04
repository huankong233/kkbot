import { eventReg, missingParams } from '../../libs/eventReg.js'
import { getUserName, setGroupAddRequest, setFriendAddRequest } from '../../libs/Api.js'
import { sendMsg, replyMsg } from '../../libs/sendMsg.js'

export default async () => {
  event()
}

/**
 * 加群 = 请求加群
 * 入群 = 邀请入群
 */

function event() {
  eventReg('notice', async context => {
    await notice(context)
  })

  eventReg('request', async context => {
    await request(context)
  })

  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      const { name, params } = context.command
      if (name === '入群') {
        await invite(context, params, 'invite')
      } else if (name === '加群') {
        await invite(context, params, 'add')
      } else if (name === '好友') {
        await friend(context, params)
      }
    }
  })
}

//notice事件处理
async function notice(context) {
  const { notice_type, sub_type, self_id, user_id, group_id } = context

  const fakeContext = { message_type: 'group', user_id, group_id }

  //判断不是机器人
  if (self_id === user_id) return

  if (notice_type === 'group_increase') {
    if (sub_type === 'approve') {
      await replyMsg(fakeContext, `${await getUserName({ user_id })} 欢迎加群呀~ ヾ(≧▽≦*)o`)
    }
  } else if (notice_type === 'group_decrease') {
    if (sub_type === 'leave') {
      await replyMsg(fakeContext, `${await getUserName({ user_id })} 退群了 (*>.<*)`)
    }
  }
}

import { sleep } from '../../libs/sleep.js'

//request事件处理
async function request(context) {
  const { request_type, sub_type } = context
  const { adminConfig } = global.config

  if (request_type === 'group') {
    if (sub_type === 'add') {
      //申请加群
      await sendNotice(context, '加群', adminConfig.add.agree)
      if (adminConfig.add.agree) {
        await sleep(3000)
        await invite(context, ['批准', context.flag], 'add', true)
      }
    } else if (sub_type === 'invite') {
      //邀请机器人入群
      await sendNotice(context, '入群', adminConfig.invite.agree)
      if (adminConfig.invite.agree) {
        await sleep(3000)
        await invite(context, ['批准', context.flag], 'invite', true)
      }
    }
  }

  if (request_type === 'friend') {
    //添加好友
    await sendNotice(context, '好友', adminConfig.friend.agree)
    if (adminConfig.friend.agree) {
      await sleep(3000)
      await friend(context, ['批准', context.flag], true)
    }
  }
}

//给admin发送通知
async function sendNotice(context, name, auto) {
  const { flag, user_id, group_id, comment } = context
  const { botConfig } = global.config

  let reply = [`用户 : ${user_id}`]

  if (name !== '好友') reply.push(`申请${name} : ${group_id}`)

  reply.push(`验证信息 : ${comment}`)

  if (auto) {
    reply.push(`已自动同意了哦~`)
  } else {
    reply.push(`批准回复 : ${botConfig.prefix}${name} 批准 ${flag}`)

    reply.push(
      `拒绝回复 : ${botConfig.prefix}${name} 拒绝 ${flag} ${
        name !== '好友' ? '拒绝原因(可选)' : ''
      }`
    )
  }

  await sendMsg(botConfig.admin, reply.join('\n'))
}

//同意入群/加群请求
async function invite(context, params, sub_type, auto = false) {
  const { botConfig } = global.config

  if (!auto) {
    // 判断是否为管理员
    if (botConfig.admin !== context.user_id)
      return await replyMsg(context, '你不是管理员', { reply: true })
  }

  if (await missingParams(context, 2)) return

  const approve = params[0] === '批准'
  const flag = params[1]
  const reason = params[2]

  const response = await setGroupAddRequest({ flag, sub_type, approve, reason })

  if (response.status === 'failed') {
    if (auto) {
      return await sendMsg(
        botConfig.admin,
        [`执行失败,失败原因:`, `${response.message}`].join('\n')
      )
    } else {
      return await replyMsg(context, [`执行失败,失败原因:`, `${response.message}`].join('\n'))
    }
  }

  if (!auto) await replyMsg(context, '执行成功(不代表处理结果)')
}

//同意加好友请求
async function friend(context, params, auto = false) {
  const { botConfig } = global.config

  if (!auto) {
    // 判断是否为管理员
    if (botConfig.admin !== context.user_id)
      return await replyMsg(context, '你不是管理员', { reply: true })
  }

  if (await missingParams(context, params, 2)) return

  const approve = params[0] === '批准'
  const flag = params[1]

  const response = await setFriendAddRequest({ flag, approve })

  if (response.status === 'failed') {
    if (auto) {
      return await sendMsg(
        botConfig.admin,
        [`执行失败,失败原因:`, `${response.message}`].join('\n')
      )
    } else {
      return await replyMsg(context, [`执行失败,失败原因:`, `${response.message}`].join('\n'))
    }
  }

  if (!auto) await replyMsg(context, '执行成功(不代表处理结果)')
}
