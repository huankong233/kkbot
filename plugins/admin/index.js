export default () => {
  loadConfig('admin.jsonc', true)

  event()
}

function event() {
  RegEvent('notice', async context => {
    await notice(context)
  })
  RegEvent('request', async context => {
    await request(context)
  })
  RegEvent('message', async (event, context, tags) => {
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

//notice事件处理
export const notice = async context => {
  const { notice_type, sub_type, self_id, user_id } = context
  if (notice_type === 'group_increase') {
    if (sub_type === 'approve') {
      //判断不是机器人
      if (self_id !== user_id)
        await replyMsg(
          { message_type: 'group', user_id: context.user_id, group_id: context.group_id },
          '欢迎加群~',
          true
        )
    }
  } else if (notice_type === 'group_decrease') {
    if (sub_type === 'leave') {
      if (self_id !== user_id)
        await replyMsg(
          { message_type: 'group', user_id: context.user_id, group_id: context.group_id },
          `用户:${context.user_id},离开了我们~`
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
      await sendMsg(context, '加群', global.config.admin.add.agree)
      if (global.config.admin.add.agree) {
        await invite(context, ['批准', context.flag], 'add')
      }
    } else if (sub_type === 'invite') {
      //邀请机器人入群
      await sendMsg(context, '入群', global.config.admin.invite.agree)
      if (global.config.admin.invite.agree) {
        await invite(context, ['批准', context.flag], 'invite')
      }
    }
  } else if (request_type === 'friend') {
    //添加好友
    await sendMsg(context, '好友', global.config.admin.friend.agree)
    if (global.config.admin.friend.agree) {
      await friend(context, ['批准', context.flag])
    }
  }
}

//给admin发送通知
export const sendMsg = async (context, name, auto) => {
  const { flag, user_id, group_id, comment } = context
  await global.sendMsg(
    global.config.bot.admin,
    [
      `用户 : ${user_id}`,
      name !== '好友' ? `申请${name} : ${group_id}` : null,
      `验证信息 : ${comment}`,
      auto ? null : `批准回复 : ${global.config.bot.prefix}${name} 批准 ${flag}`,
      auto
        ? null
        : `拒绝回复 : ${global.config.bot.prefix}${name} 拒绝 ${flag}${
            name !== '好友' ? ' 拒绝原因(可选)' : ''
          }`,
      auto ? null : `不回复就是忽略了哦~`,
      auto ? '已自动同意了哦~' : null
    ]
      .filter(s => s && s.trim())
      .join('\n')
  )
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
