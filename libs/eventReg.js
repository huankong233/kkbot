/**
 * 事件快捷注册
 * @param {String} type 事件类型
 * @param {Function} callback 回调函数
 * @param {Number} priority 优先级
 */
export function eventReg(type, callback, priority = 1) {
  switch (type) {
    case 'message':
      global.events.message.push({
        callback,
        priority,
        pluginName: global.nowLoadPluginName
      })
      break
    case 'notice':
      global.events.notice.push({
        callback,
        priority,
        pluginName: global.nowLoadPluginName
      })
      break
    case 'request':
      global.events.request.push({
        callback,
        priority,
        pluginName: global.nowLoadPluginName
      })
      break
    default:
      throw new Error(`"${type}"事件类型不存在`)
  }
}

/**
 * 检查是否@了机器人
 * @param {Object} context
 * @returns {Object}
 */
export function haveAt(context) {
  const { message, self_id } = context
  const { prefix } = global.config.bot

  const findString = `[CQ:at,qq=${self_id}]`
  const index = message.indexOf(findString)
  if (index === -1) {
    return false
  }

  // 获取参数
  const parsedMessage = message.substring(index + findString.length, message.length).trim()
  return format(`${prefix}@ ${parsedMessage}`)
}

/**
 * 格式化消息
 * @param {String} message
 * @returns {Object}
 */
export function format(message) {
  const { prefix } = global.config.bot
  // 去头去尾空格
  message = message.trim()

  // 判断是否是一个命令
  if (message[0] !== prefix) {
    return false
  }

  // 参数分割
  let command = message.split(' ').filter(value => value !== '')

  return {
    name: command[0].replace('/', ''),
    params: command.slice(1, command.length)
  }
}

import { replyMsg } from './sendMsg.js'
export async function missingParams(context, params, paramsLength) {
  const { bot } = global.config

  if (params.length < paramsLength) {
    return await replyMsg(
      context,
      `参数不足，请发送"${bot.prefix}帮助 ${context.command.name}"查看帮助`,
      false,
      true
    )
  }
}
