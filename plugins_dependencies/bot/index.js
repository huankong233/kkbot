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
    const { connect, admin } = global.config.bot

    const bot = new CQWebSocket(connect)

    //注册全局变量
    globalReg({ bot, CQ })

    //连接相关监听
    bot.on('socket.connecting', (wsType, attempts) => {
      logger.INFO(`连接中[${wsType}]#${attempts}`)
    })

    bot.on('socket.error', (wsType, err, attempts) => {
      if (debug) logger.DEBUG(err)
    })

    bot.on('socket.failed', (wsType, attempts) => {
      logger.WARNING(`连接失败[${wsType}]#${attempts}`)
    })

    bot.on('socket.connect', async (wsType, sock, attempts) => {
      logger.SUCCESS(`连接成功[${wsType}]#${attempts}`)

      if (wsType !== '/api') {
        return
      }

      if (admin <= 0) {
        return logger.NOTICE('未设置管理员账户,请检查!')
      }

      await loginComplete(attempts)
    })

    initEvents()

    // connect
    bot.connect()

    return new Promise((resolve, reject) => {
      bot.on('socket.connect', wsType => (wsType === '/api' ? resolve() : null))
      bot.on('socket.failed', (wsType, attempts) => {
        if (attempts >= connect.reconnectionAttempts) {
          reject(`连接失败次数超过设置的${connect.reconnectionAttempts}次!`)
        }
      })
    })
  } catch (error) {
    logger.WARNING('机器人启动失败!!!')

    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }

    throw new Error('请检查机器人配置文件!!!')
  }
}

import { getLoginInfo } from '../../libs/Api.js'
async function loginComplete(attempts) {
  const { online, admin } = global.config.bot

  global.config.bot.info = (await getLoginInfo()).data

  if (debug) return

  if (!online.enable) return

  await sendMsg(admin, `${online.msg}#${attempts}`)
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
    if (debug) logger.DEBUG(`收到信息:\n`, context)

    const events = compare(global.events.message, 'priority')

    context.message = CQ.unescape(context.message)
    for (let i = 0; i < events.length; i++) {
      global.nowPlugin = events[i].pluginName

      let response
      try {
        response = await events[i].callback(
          event,
          { command: format(context.message), ...context },
          tags
        )
      } catch (error) {
        logger.WARNING(`插件${events[i].pluginName}运行错误`)

        if (debug) {
          logger.DEBUG(error)
        } else {
          logger.WARNING(error)
        }
      }

      if (response === 'quit') break
    }

    global.nowPlugin = null
  })

  bot.on('notice', async context => {
    if (debug) logger.DEBUG(`收到通知:\n`, context)

    let events = compare(global.events.notice, 'priority')
    for (let i = 0; i < events.length; i++) {
      global.nowPlugin = events[i].pluginName

      let response
      try {
        response = await events[i].callback(context)
      } catch (error) {
        logger.WARNING(`插件${events[i].pluginName}运行错误`)
        if (debug) {
          logger.DEBUG(error)
        } else {
          logger.WARNING(error)
        }
      }

      if (response === 'quit') break
    }

    global.nowPlugin = null
  })

  bot.on('request', async context => {
    if (debug) logger.DEBUG(`收到请求:\n`, context)

    let events = compare(global.events.request, 'priority')
    for (let i = 0; i < events.length; i++) {
      global.nowPlugin = events[i].pluginName

      let response
      try {
        response = await events[i].callback(context)
      } catch (error) {
        logger.WARNING(`插件${events[i].pluginName}运行错误`)
        if (debug) {
          logger.DEBUG(error)
        } else {
          logger.WARNING(error)
        }
      }

      if (response === 'quit') break
    }

    global.nowPlugin = null
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
