import { CQ } from 'go-cqwebsocket'
import { CQWebSocket } from '@tsuk1ko/cq-websocket'
import { globalReg } from '../../libs/globalReg.js'
import { logger } from '../../libs/logger.js'
import { sendMsg } from '../../libs/sendMsg.js'
import { format } from '../../libs/eventReg.js'

export default async function () {
  await newBot()
}

/**
 * 启动机器人,注册事件等
 */
export async function newBot() {
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
      bot.on('socket.connect', wsType => (wsType === '/api' ? resolve() : null))
      bot.on('socket.failed', (wsType, attempts) =>
        attempts >= connect.reconnectionAttempts
          ? reject(`连接失败次数超过设置的${connect.reconnectionAttempts}次!`)
          : null
      )
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
    if (global.debug) {
      switch (context.message_type) {
        case 'group':
          logger.DEBUG(
            `收到来自群组(${context.group_id}),用户(${context.user_id})发送消息的: ${context.message}`
          )
          break
        case 'discuss':
          logger.DEBUG(
            `收到来自讨论组(${context.group_id}),用户(${context.user_id})发送消息的: ${context.message}`
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
    if (global.debug) logger.DEBUG(`收到类型为${context.notice_type}的通知`)

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
    if (global.debug) logger.DEBUG(`收到类型为${context.request_type}的请求`)

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
 * @returns {Array}
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
