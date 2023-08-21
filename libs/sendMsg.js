import logger from './logger.js'
import { sendPrivateMsg, sendGroupMsg, sendGroupForwardMsg, sendPrivateForwardMsg } from './Api.js'
import * as emoji from 'node-emoji'

/**
 * 回复消息
 * @param {Object} context 消息上下文
 * @param {String|Object} message 回复内容
 * @param {{at:false,reply:false}} params 是否at/reply发送者
 * @param {Boolean} toEmoji 是否转换为emoji
 * @returns {Object}
 */
export async function replyMsg(
  context,
  message,
  { at = false, reply = false } = {},
  toEmoji = true
) {
  const { message_type, user_id, group_id, message_id } = context
  if (toEmoji) {
    message = parseToEmoji(message)
  }

  if (message_type !== 'private') {
    //不是私聊，可以at发送者
    if (at) message = `${CQ.at(user_id)} ${message}`

    //不是私聊，可以回复
    if (reply) message = `${CQ.reply(message_id)}${message}`
  }

  let response

  switch (message_type) {
    case 'private':
      //回复私聊
      response = await sendPrivateMsg({
        user_id,
        message
      })
      break
    case 'group':
      //回复群
      response = await sendGroupMsg({
        group_id,
        message
      })
      break
  }

  if (debug) {
    logger.DEBUG(`发送回复消息:${message}`)
    logger.DEBUG(`响应:\n`, response)
    const stack = new Error().stack.split('\n')
    logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
  }

  return response
}

/**
 * 发送私信
 * @param {Number} user_id
 * @param {String|Object} message
 * @param {Boolean} toEmoji 是否转换为emoji
 * @returns {Object}
 */
export async function sendMsg(user_id, message, toEmoji = true) {
  if (toEmoji) {
    message = parseToEmoji(message)
  }

  const response = await sendPrivateMsg({
    user_id,
    message
  })

  if (debug) {
    logger.DEBUG(`发送私聊消息:${message}`)
    logger.DEBUG(`响应:\n`, response)
    const stack = new Error().stack.split('\n')
    logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
  }

  return response
}

/**
 * 合并信息发送
 * docs:https://docs.go-cqhttp.org/cqcode/#合并转发
 * @param {Object} context 消息对象
 * @param {Array} messages
 * @param {Boolean} toEmoji 是否转换为emoji
 * @returns {Object}
 */
export async function sendForwardMsg(context, messages, toEmoji = true) {
  const { message_type } = context

  if (toEmoji) {
    messages = parseToEmoji(messages)
  }

  let response

  switch (message_type) {
    case 'group':
      response = await sendGroupForwardMsg({
        group_id: context.group_id,
        messages
      })
      break
    case 'private':
      response = await sendPrivateForwardMsg({
        user_id: context.user_id,
        messages
      })
      break
  }

  if (debug) {
    logger.DEBUG(`发送合并消息:\n`, messages)
    logger.DEBUG(`响应:\n`, response)
    const stack = new Error().stack.split('\n')
    logger.DEBUG(`stack信息:\n`, stack.slice(1, stack.length).join('\n'))
  }

  return response
}

/**
 * 消息反转义为emoji
 * @param {String|Object} message
 * @returns {String|Object}
 */
export const parseToEmoji = message => {
  if (typeof message === 'string') {
    return emoji.emojify(message.toString())
  } else {
    if (debug) logger.DEBUG(`不支持转换对象形式的信息,请手动转换`)
    return message
  }
}
