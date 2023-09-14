import { CQ } from 'go-cqwebsocket'
import { CQWebSocket } from '@tsuk1ko/cq-websocket'
import { globalReg } from '../../libs/globalReg.js'
import { makeLogger } from '../../libs/logger.js'
import { sendMsg } from '../../libs/sendMsg.js'
import { format } from '../../libs/eventReg.js'
import * as emoji from 'node-emoji'
import { countRunTime } from '../../libs/time.js'

const logger = makeLogger({ pluginName: 'bot', subModule: 'connect' })
const eventLogger = logger.changeSubModule('events')

/**
 * 启动机器人,注册事件等
 */
export default async function () {
  const { botConfig } = global.config
  const { botData } = global.data
  try {
    const bot = new CQWebSocket(botConfig.connect)

    //注册全局变量
    globalReg({ bot })

    //连接相关监听
    bot.on('socket.connecting', (wsType, attempts) => {
      logger.INFO(`连接中[${wsType}]#${attempts}`)
    })

    bot.on('socket.max_reconnect', (wsType, attempts) => {
      throw new Error(`重试次数超过设置的${botConfig.connect.reconnectionAttempts}次!`)
    })

    bot.on('socket.error', (wsType, err, attempts) => {
      if (debug) logger.DEBUG(err)
    })

    bot.on('socket.failed', (wsType, attempts) => {
      logger.WARNING(`连接失败[${wsType}]#${attempts}`)
    })

    bot.on('socket.connect', async (wsType, sock, attempts) => {
      logger.SUCCESS(`连接成功[${wsType}]#${attempts}`)
      if (wsType !== '/api') return (botData.wsType = wsType)
      await loginComplete(attempts)
    })

    initEvents()

    // connect
    bot.connect()

    return new Promise((resolve, reject) => {
      bot.on('socket.connect', wsType => (wsType !== botData.wsType ? resolve() : null))
    })
  } catch (error) {
    logger.WARNING('机器人启动失败!!!')
    logger.ERROR(error)
    throw new Error('请检查机器人配置文件!!!')
  }
}

async function loginComplete(attempts) {
  const { botConfig } = global.config

  if (dev) return

  if (!botConfig.online.enable) return

  if (botConfig.admin <= 0) {
    return logger.NOTICE('未设置管理员账户,请检查!')
  }

  await sendMsg(botConfig.admin, `${botConfig.online.msg}#${attempts}`)
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
    if (debug) eventLogger.DEBUG(`收到信息:\n`, context)
    const events = compare(global.events.message, 'priority')
    context.message = emoji.unemojify(CQ.unescape(context.message)).trim()
    for (let i = 0; i < events.length; i++) {
      global.nowPlugin = events[i].pluginName

      let response, time
      try {
        if (pref) {
          eventLogger.INFO(`插件${events[i].pluginName}事件触发中`)
          ;({ response, time } = countRunTime(async () => {
            await events[i].callback(event, { command: format(context.message), ...context }, tags)
          }))
          eventLogger.SUCCESS(`插件${events[i].pluginName}耗时:${time}ms`)
        } else {
          response = await events[i].callback(
            event,
            { command: format(context.message), ...context },
            tags
          )
        }
      } catch (error) {
        eventLogger.WARNING(`插件${events[i].pluginName}运行错误`)
        eventLogger.ERROR(error)
      }

      global.nowPlugin = null
      if (response === 'quit') break
    }
  })

  bot.on('notice', async context => {
    if (debug) eventLogger.DEBUG(`收到通知:\n`, context)

    let events = compare(global.events.notice, 'priority')

    for (let i = 0; i < events.length; i++) {
      global.nowPlugin = events[i].pluginName

      let response, time
      try {
        if (pref) {
          eventLogger.INFO(`插件${events[i].pluginName}事件触发中`)
          ;({ response, time } = countRunTime(async () => {
            await events[i].callback(context)
          }))
          eventLogger.SUCCESS(`插件${events[i].pluginName}耗时:${time}ms`)
        } else {
          response = await events[i].callback(context)
        }
      } catch (error) {
        eventLogger.WARNING(`插件${events[i].pluginName}运行错误`)
        eventLogger.ERROR(error)
      }

      global.nowPlugin = null
      if (response === 'quit') break
    }
  })

  bot.on('request', async context => {
    if (debug) eventLogger.DEBUG(`收到请求:\n`, context)
    let events = compare(global.events.request, 'priority')

    for (let i = 0; i < events.length; i++) {
      global.nowPlugin = events[i].pluginName

      let response, time
      try {
        if (pref) {
          eventLogger.INFO(`插件${events[i].pluginName}事件触发中`)
          ;({ response, time } = countRunTime(async () => {
            await events[i].callback(context)
          }))
          eventLogger.SUCCESS(`插件${events[i].pluginName}耗时:${time}ms`)
        } else {
          response = await events[i].callback(context)
        }
      } catch (error) {
        eventLogger.WARNING(`插件${events[i].pluginName}运行错误`)
        eventLogger.ERROR(error)
      }

      global.nowPlugin = null
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
