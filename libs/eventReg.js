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

import { format } from '../plugins_dependencies/bot/index.js'
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
