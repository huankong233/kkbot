/**
 * 事件快捷注册
 * @param {String} type 事件类型
 * @param {Function} callback 回调函数
 * @param {Number} priority 优先级
 */
export function eventReg(type, callback, priority = 1) {
  const { events } = global

  const obj = {
    callback,
    priority,
    pluginName: global.nowLoadPluginName
  }

  switch (type) {
    case 'message':
      events.message.push(obj)
      break
    case 'notice':
      events.notice.push(obj)
      break
    case 'request':
      events.request.push(obj)
      break
    default:
      throw new Error(`"${type}"事件类型不存在`)
  }
}

/**
 * 检查是否@了机器人
 * @param {object} context
 * @param {string} commandName
 * @returns {{name:String,params:Array}}
 */
export function haveAt(context, commandName = '@') {
  const { message, self_id } = context
  const { prefix } = global.config.bot

  const findString = `[CQ:at,qq=${self_id}]`
  const index = message.indexOf(findString)
  if (index === -1) {
    return false
  }

  // 获取参数
  const parsedMessage = message.substring(index + findString.length, message.length).trim()
  return format(`${prefix}${commandName} ${parsedMessage}`)
}

/**
 * 格式化消息
 * @param {String} message
 * @returns {{name:String,params:Array}}
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
/**
 * 缺少参数统一输出
 * @param {Object} context
 * @param {Object} params
 * @param {Number} paramsLength
 */
export async function missingParams(context, params, paramsLength) {
  const { bot } = global.config

  if (params.length < paramsLength) {
    return await replyMsg(
      context,
      `参数不足，请发送"${bot.prefix}帮助 ${context.command.name}"查看帮助`,
      { reply: true }
    )
  }
}
