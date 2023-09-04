import { CQ } from 'go-cqwebsocket'
import { replyMsg } from './sendMsg.js'

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
 * @returns {{name:String,params:Array} | false}
 */
export function haveAt(context, commandName = '@') {
  const { message, self_id } = context
  const { botConfig } = global.config

  const messageArr = CQ.parse(message)
  if (messageArr[0]?._type === 'at' && messageArr[0]?._data?.qq === self_id.toString()) {
    const parsedMessage = message.replace(messageArr[0].toString(), '')
    return format(`${botConfig.prefix}${commandName} ${parsedMessage}`)
  } else {
    return false
  }
}

/**
 * 格式化消息
 * @param {String} message
 * @returns {{name:String,params:Array} | false}
 */
export function format(message) {
  const { botConfig } = global.config

  // 判断是否是一个命令
  if (message[0] !== botConfig.prefix) return false

  // 参数分割
  let command = message.split(' ').filter(value => value !== '')

  return {
    name: command[0].replace('/', ''),
    params: command.slice(1, command.length)
  }
}

/**
 * 缺少参数统一输出
 * @param {Object} context
 * @param {Number} paramsLength
 */
export async function missingParams(context, paramsLength) {
  const { botConfig } = global.config
  const { command } = context

  if (!command) throw new Error(`未提供"command"字段`)

  if (command.params.length < paramsLength) {
    return await replyMsg(
      context,
      `参数不足，请发送"${botConfig.prefix}帮助 ${command.name}"查看帮助`,
      { reply: true }
    )
  }
}
