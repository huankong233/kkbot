import { CQ } from 'go-cqwebsocket'
import { CQWebSocket } from '@tsuk1ko/cq-websocket'
import { loadConfig } from '../load/config.js'
import { globalReg } from '../globalReg/index.js'
import { msgToConsole } from '../msgToConsole/index.js'
import { sendMsg } from '../sendMsg/index.js'

/**
 * 启动机器人线程，注册事件等
 */
export async function newBot() {
  loadConfig('bot')

  const { connect, timeZone, debug, online, admin } = global.config.bot

  try {
    const bot = new CQWebSocket(connect)

    //注册全局变量
    globalReg({ bot, CQ })

    //修改时区
    process.env.TZ = timeZone

    //连接相关监听
    bot.on('socket.connecting', (wsType, attempts) => msgToConsole(`连接中[${wsType}]#${attempts}`))

    bot.on('socket.failed', (wsType, attempts) => {
      if (attempts === connect.reconnectionAttempts) {
        msgToConsole(`连接失败次数超过设置的${connect.reconnectionAttempts}次!`, 'WARNING')
        throw new Error(`connect to the websocket server failed`)
      }
    })

    bot.on('socket.error', (wsType, err) => {
      msgToConsole(`连接错误[${wsType}]`, 'WARNING')
      if (debug) msgToConsole(err.toString(), 'DEBUG')
    })

    bot.on('socket.connect', async (wsType, sock, attempts) => {
      msgToConsole(`连接成功[${wsType}]#${attempts}`, 'SUCCESS')

      if (wsType !== '/api') {
        return
      }

      if (debug) {
        return msgToConsole(
          `当前已打开DEBUG模式,可能会有更多的log被输出,非开发人员请关闭~`,
          'NOTICE'
        )
      }

      if (!online.enable) {
        return
      }

      if (admin <= 0) {
        return msgToConsole('请检查管理员账户')
      }

      await sendMsg(admin, `${online.msg}#${attempts}`)
    })

    //初始化事件
    global.events = {
      message: [],
      notice: [],
      request: []
    }

    //事件处理
    bot.on('message', async (event, context, tags) => {
      let events = compare(global.events.message, 'priority')
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
          msgToConsole(`插件${events[i].name}运行错误`, 'WARNING')
          if (debug) msgToConsole(error.toString(), 'DEBUG')
        }

        if (response === 'quit') break
      }
    })

    bot.on('notice', async context => {
      // let events = compare(global.events.notice, 'priority')
      // for (let i = 0; i < events.length; i++) {
      //   if ((await events[i].callback(context)) === 'quit') {
      //     break
      //   }
      // }
    })

    bot.on('request', async context => {
      // let events = compare(global.events.request, 'priority')
      // for (let i = 0; i < events.length; i++) {
      //   if ((await events[i].callback(context)) === 'quit') {
      //     break
      //   }
      // }
    })

    // connect
    bot.connect()
  } catch (error) {
    msgToConsole(error.toString(), 'WARNING')
    throw new Error('请检查机器人配置文件!!!')
  }
}

export function compare(arr, property) {
  return arr.sort((a, b) => (a[property] < b[property] ? 1 : a[property] > b[property] ? -1 : 0))
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
  if (prefix === '' || message[0] === prefix) {
    //空格分割
    let data = message.split(' ').filter(value => {
      return value === '' ? false : value
    })
    return {
      name: data[0].replace(prefix, ''),
      params: data.slice(1, data.length)
    }
  } else {
    return false
  }
}
