export default () => {
  return {
    sendMsg,
    replyMsg,
    send_forward_msg
  }
}

//发送私信
export const sendMsg = (who, message) => {
  bot('send_private_msg', {
    user_id: who,
    message
  })
}

/**
 * 回复消息
 *
 * @param {*} context 消息对象
 * @param {string} message 回复内容
 * @param {boolean} at 是否at发送者
 * @param {boolean} reply 是否使用回复形式
 */
export const replyMsg = (context, message, at = false, reply = false) => {
  //不是私聊，需要at发送者
  if (context.message_type !== 'private' && at) {
    message = CQ.at(context.user_id) + ' ' + message
  }
  //不是频道，不是私聊，需要回复
  if (context.message_type !== 'guild' && context.message_type !== 'private' && reply) {
    message = CQ.reply(context.message_id) + ' ' + message
  }
  switch (context.message_type) {
    case 'private':
      //回复私聊
      return bot('send_private_msg', {
        user_id: context.user_id,
        message
      })
    case 'group':
      //回复群
      return bot('send_group_msg', {
        group_id: context.group_id,
        message
      })
    case 'discuss':
      //回复讨论组
      return bot('send_discuss_msg', {
        discuss_id: context.discuss_id,
        message
      })
  }
}

//合并信息发送(messages是数组)
//https://docs.go-cqhttp.org/cqcode/#%E5%90%88%E5%B9%B6%E8%BD%AC%E5%8F%91
export const send_forward_msg = async (context, messages) => {
  if (context.message_type === 'group') {
    const data = await bot('send_group_forward_msg', {
      group_id: context.group_id,
      messages: messages
    })
    return data
  } else if (context.message_type === 'private') {
    const data = await bot('send_private_forward_msg', {
      user_id: context.user_id,
      messages: messages
    })
    return data
  }
}
