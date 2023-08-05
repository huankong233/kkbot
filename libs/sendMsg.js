import logger from './logger.js'
import {
  sendPrivateMsg,
  sendGroupMsg,
  sendDiscussMsg,
  sendGroupForwardMsg,
  sendPrivateForwardMsg
} from './Api.js'

/**
 * 回复消息
 * @param {Object} context 消息上下文
 * @param {String} message 回复内容
 * @param {Object} params 是否at/reply发送者
 * @returns {Object}
 */
export async function replyMsg(context, message, { at = false, reply = false } = {}) {
  const { message_type, user_id, group_id, message_id, discuss_id } = context

  if (message_type !== 'private') {
    //不是私聊，可以at发送者
    if (at) message = `${CQ.at(user_id)} ${message}`

    //不是私聊，可以回复
    if (reply) message = `${CQ.reply(message_id)}${message}`
  }

  if (global.debug) {
    const stack = new Error().stack.split('\n')
    logger.DEBUG(`发送回复消息:${message},stack信息:`)
    console.log(stack.slice(1, stack.length).join('\n'))
  }

  switch (message_type) {
    case 'private':
      //回复私聊
      return await sendPrivateMsg({
        user_id,
        message
      })
    case 'group':
      //回复群
      return await sendGroupMsg({
        group_id,
        message
      })
    case 'discuss':
      //回复讨论组
      return await sendDiscussMsg({
        discuss_id,
        message
      })
  }
}

/**
 * 发送私信
 * @param {Number} user_id
 * @param {String} message
 * @returns {Object}
 */
export async function sendMsg(user_id, message) {
  if (global.debug) {
    const stack = new Error().stack.split('\n')
    logger.DEBUG(`发送私聊消息:${message},stack信息:`)
    console.log(stack.slice(1, stack.length).join('\n'))
  }

  return await sendPrivateMsg({
    user_id,
    message
  })
}

/**
 * 合并信息发送
 * docs:https://docs.go-cqhttp.org/cqcode/#合并转发
 * @param {Object} context 消息对象
 * @param {Array} messages
 * @returns {Object}
 */
export async function sendForwardMsg(context, messages) {
  const { message_type } = context

  if (global.debug) {
    logger.DEBUG(`发送合并消息:`)
    console.log(messages)

    logger.DEBUG(`stack信息:`)
    const stack = new Error().stack.split('\n')
    console.log(stack.slice(1, stack.length).join('\n'))
  }

  switch (message_type) {
    case 'group':
      return await sendGroupForwardMsg({
        group_id: context.group_id,
        messages: messages
      })
    case 'private':
      return await sendPrivateForwardMsg({
        user_id: context.user_id,
        messages: messages
      })
  }
}
