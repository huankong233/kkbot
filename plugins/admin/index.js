export default async () => {
  event()
}

/**
 * 加群 = 请求加群
 * 入群 = 邀请入群
 */

import { eventReg } from '../../libs/eventReg.js'
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

import { sendMsg, replyMsg } from '../../libs/sendMsg.js'
import { getUserName } from '../query/index.js'

//notice事件处理
async function notice(context) {
  const { notice_type, sub_type, self_id, user_id, group_id } = context

  const fakeContext = { message_type: 'group', user_id, group_id }

  //判断不是机器人
  if (self_id === user_id) return

  if (notice_type === 'group_increase') {
    if (sub_type === 'approve') {
      await replyMsg(fakeContext, `欢迎加群呀~${await getUserName(user_id)}`)
    }
  }

  if (notice_type === 'group_decrease') {
    if (sub_type === 'leave') {
      await replyMsg(fakeContext, `${await getUserName(user_id)}退群了 (*>.<*)`)
    }
  }
}

import { sleep } from '../../libs/sleep.js'

//request事件处理
async function request(context) {
  const { request_type, sub_type } = context
  const { admin } = global.config

  if (request_type === 'group') {
    if (sub_type === 'add') {
      //申请加群
      await sendNotice(context, '加群', admin.add.agree)
      if (admin.add.agree) {
        await sleep(3000)
        await invite(context, ['批准', context.flag], 'add')
      }
    } else if (sub_type === 'invite') {
      //邀请机器人入群
      await sendNotice(context, '入群', admin.invite.agree)
      if (admin.invite.agree) {
        await sleep(3000)
        await invite(context, ['批准', context.flag], 'invite')
      }
    }
  }

  if (request_type === 'friend') {
    //添加好友
    await sendNotice(context, '好友', admin.friend.agree)
    if (admin.friend.agree) {
      await sleep(3000)
      await friend(context, ['批准', context.flag])
    }
  }
}

//给admin发送通知
async function sendNotice(context, name, auto) {
  const { flag, user_id, group_id, comment } = context
  const { bot } = global.config

  let reply = [`用户 : ${user_id}`]

  if (name !== '好友') reply.push(`申请${name} : ${group_id}`)

  reply.push(`验证信息 : ${comment}`)

  if (auto) {
    reply.push(`已自动同意了哦~`)
  } else {
    reply.push(`批准回复 : ${bot.prefix}${name} 批准 ${flag}`)

    reply.push(
      `拒绝回复 : ${bot.prefix}${name} 拒绝 ${flag} ${name !== '好友' ? '拒绝原因(可选)' : ''}`
    )
  }

  await sendMsg(bot.admin, reply.join('\n'))
}

import { missingParams } from '../../libs/eventReg.js'
import { setGroupAddRequest } from '../../libs/Api.js'

//同意入群/加群请求
async function invite(context, params, sub_type) {
  const { bot } = global.config

  // 判断是否为管理员
  if (bot.admin !== context.user_id) return await replyMsg(context, '你不是管理员', { reply: true })

  if (await missingParams(context, params, 2)) return

  const approve = params[0] === '批准'
  const flag = params[1]
  const reason = params[2]

  const response = await setGroupAddRequest({ flag, sub_type, approve, reason })

  if (response.status === 'failed') {
    return await replyMsg(context, [`执行失败,失败原因:`, `${response.message}`].join('\n'))
  }

  await replyMsg(context, '执行成功(不代表处理结果)')
}

//同意加好友请求
import { setFriendAddRequest } from '../../libs/Api.js'
async function friend(context, params) {
  const { bot } = global.config
  // 判断是否为管理员
  if (bot.admin !== context.user_id) return await replyMsg(context, '你不是管理员', { reply: true })

  if (await missingParams(context, params, 2)) return

  const approve = params[0] === '批准'
  const flag = params[1]

  const response = await setFriendAddRequest({ flag, approve })

  if (response.status === 'failed') {
    return await replyMsg(context, [`执行失败,失败原因:`, `${response.message}`].join('\n'))
  }

  await replyMsg(context, '执行成功(不代表处理结果)')
}
