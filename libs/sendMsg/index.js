/**
 * 发送私信
 * @param {number} user_id
 * @param {string} message
 */
export async function sendMsg(user_id, message) {
  return await bot('send_private_msg', {
    user_id,
    message
  })
}

/**
 * 回复消息
 * @param {object} context 消息上下文
 * @param {string} message 回复内容
 * @param {boolean} at 是否at发送者
 * @param {boolean} reply 是否使用回复形式
 */
export async function replyMsg(context, message, at, reply) {
  const { message_type, user_id, group_id, message_id, discuss_id } = context

  if (message_type !== 'private') {
    //不是私聊，可以at发送者
    if (at) message = `${CQ.at(user_id)} ${message}`

    //不是私聊，可以回复
    if (reply) message = `${CQ.reply(message_id)}${message}`
  }

  switch (message_type) {
    case 'private':
      //回复私聊
      return await bot('send_private_msg', {
        user_id,
        message
      })
    case 'group':
      //回复群
      return await bot('send_group_msg', {
        group_id,
        message
      })
    case 'discuss':
      //回复讨论组
      return await bot('send_discuss_msg', {
        discuss_id,
        message
      })
  }
}

/**
 * 合并信息发送
 * docs:https://docs.go-cqhttp.org/cqcode/#合并转发
 * @param {Object} context 消息对象
 * @param {Array} messages
 */
export async function send_forward_msg(context, messages) {
  const { message_type } = context
  switch (message_type) {
    case 'group':
      return await bot('send_group_forward_msg', {
        group_id: context.group_id,
        messages: messages
      })
    case 'private':
      return await bot('send_private_forward_msg', {
        user_id: context.user_id,
        messages: messages
      })
  }
}
