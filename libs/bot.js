import { CQ } from 'go-cqwebsocket'
import { CQWebSocket } from '@tsuk1ko/cq-websocket'
import { loadConfig } from './loadConfig.js'
import { globalReg } from './globalReg.js'
import { logger } from './logger.js'
import { sendMsg } from './sendMsg.js'

/**
 * 启动机器人线程，注册事件等
 */
export async function newBot() {
  loadConfig('bot')

  try {
    const { connect, timeZone, online, admin } = global.config.bot
    const { debug } = global

    const bot = new CQWebSocket(connect)

    //注册全局变量
    globalReg({ bot, CQ })

    //修改时区
    process.env.TZ = timeZone

    //连接相关监听
    bot.on('socket.connecting', (wsType, attempts) => {
      logger.INFO(`连接中[${wsType}]#${attempts}`)
    })

    bot.on('socket.failed', (wsType, attempts) => {
      if (attempts === connect.reconnectionAttempts) {
        logger.WARNING(`连接失败次数超过设置的${connect.reconnectionAttempts}次!`)
        throw new Error(`connect to the websocket server failed`)
      }
    })

    bot.on('socket.error', (wsType, err) => {
      logger.WARNING(`连接错误[${wsType}]`)
      if (debug) logger.DEBUG(err)
    })

    bot.on('socket.connect', async (wsType, sock, attempts) => {
      logger.SUCCESS(`连接成功[${wsType}]#${attempts}`)

      if (wsType !== '/api') {
        return
      }

      if (admin <= 0) {
        return logger.NOTICE('未设置管理员账户,请检查!')
      }

      if (debug) {
        return logger.DEBUG(`当前已打开DEBUG模式,可能会有更多的log被输出,非开发人员请关闭~`)
      }

      if (!online.enable) {
        return
      }

      await sendMsg(admin, `${online.msg}#${attempts}`)
    })

    initEvents()

    // connect
    bot.connect()

    return new Promise((resolve, reject) => {
      bot.on('socket.connect', resolve)
    })
  } catch (error) {
    logger.WARNING('机器人启动失败!!!')
    if (global.debug) logger.DEBUG(error)
    throw new Error('请检查机器人配置文件!!!')
  }
}

function initEvents() {
  //初始化事件
  global.events = {
    message: [],
    notice: [],
    request: []
  }

  //事件处理
  bot.on('message', async (event, context, tags) => {
    if (global.config.bot.debug) {
      switch (context.message_type) {
        case 'group':
          logger.DEBUG(
            `收到来自群组(${context.group_id})/用户(${context.user_id})发送消息的: ${context.message}`
          )
          break
        case 'discuss':
          logger.DEBUG(
            `收到来自讨论组(${context.group_id})/用户(${context.user_id})发送消息的: ${context.message}`
          )
          break
        case 'private':
          logger.DEBUG(`收到来自私聊用户(${context.user_id})发送消息的: ${context.message}`)
          break
      }
    }

    const events = compare(global.events.message, 'priority')

    context.message = CQ.unescape(context.message)
    for (let i = 0; i < events.length; i++) {
      let response
      try {
        response = await events[i].callback(
          event,
          { command: format(context.message), ...context },
          tags
        )
      } catch (error) {
        logger.WARNING(`插件${events[i].pluginName}运行错误`)
        if (debug) logger.DEBUG(error)
      }

      if (response === 'quit') break
    }
  })

  bot.on('notice', async context => {
    if (global.config.bot.debug) logger.DEBUG(`收到类型为${context.notice_type}的通知`)

    let events = compare(global.events.notice, 'priority')
    for (let i = 0; i < events.length; i++) {
      let response
      try {
        response = await events[i].callback(context)
      } catch (error) {
        logger.WARNING(`插件${events[i].pluginName}运行错误`)
        if (debug) logger.DEBUG(error)
      }

      if (response === 'quit') break
    }
  })

  bot.on('request', async context => {
    if (global.config.bot.debug) logger.DEBUG(`收到类型为${context.request_type}的请求`)

    let events = compare(global.events.request, 'priority')
    for (let i = 0; i < events.length; i++) {
      let response
      try {
        response = await events[i].callback(context)
      } catch (error) {
        logger.WARNING(`插件${events[i].pluginName}运行错误`)
        if (debug) logger.DEBUG(error)
      }

      if (response === 'quit') break
    }
  })
}

/**
 * 排序数组 (大的在前面)
 * @param {Array} arr
 * @param {String} property
 * @param {String} sortType up->升序 down->降序
 * @returns
 */
export function compare(arr, property, sortType = 'up') {
  return arr.sort((a, b) => {
    if (a[property] > b[property]) {
      return sortType === 'up' ? -1 : 1
    }

    if (a[property] < b[property]) {
      return sortType === 'up' ? 1 : -1
    }

    return 0
  })
}

/**
 * 格式化消息
 * @param message
 * @returns
 */
export function format(message) {
  const { prefix } = global.config.bot
  // 去头去尾空格
  message = message.trim()

  // 判断是否是一个命令
  if (message.indexOf(prefix) === -1) {
    return false
  }

  // 参数分割
  let command = message.split(' ').filter(value => value !== '')

  return {
    name: command[0].replace('/', ''),
    params: command.slice(1, command.length)
  }
}
