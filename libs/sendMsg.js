import logger from './logger.js'
import { sendPrivateMsg, sendGroupMsg, sendGroupForwardMsg, sendPrivateForwardMsg } from './Api.js'
import * as emoji from 'node-emoji'

/**
 * 回复消息
 * @param {Object} context 消息上下文
 * @param {String} message 回复内容
 * @param {Object} params 是否at/reply发送者
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
    if (typeof message === 'string') {
      message = emoji.emojify(message)
    } else if (typeof message === 'object') {
      if (message._data.content) message._data.content = emoji.emojify(message._data.content)
    } else {
      throw new Error('未知类型')
    }
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
 * @param {String} message
 * @returns {Object}
 */
export async function sendMsg(user_id, message, toEmoji = true) {
  if (toEmoji) {
    if (typeof message === 'string') {
      message = emoji.emojify(message)
    } else if (typeof message === 'object') {
      if (message._data.content) message._data.content = emoji.emojify(message._data.content)
    } else {
      throw new Error('未知类型')
    }
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
 * @returns {Object}
 */
export async function sendForwardMsg(context, messages, toEmoji = true) {
  const { message_type } = context

  if (toEmoji) {
    messages = messages.map(function (node) {
      node._data.content = emoji.emojify(node._data.content)
      return node
    })
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
