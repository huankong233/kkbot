export default () => {
  return {
    newBot
  }
}

import { CQWebSocket } from '@tsuk1ko/cq-websocket'
import { CQ } from 'go-cqwebsocket'

/**
 * 启动机器人线程，注册事件等
 */
export const newBot = async () => {
  await loadConfig('bot.jsonc', true)

  try {
    const bot = new CQWebSocket(global.config.bot.connect)

    //注册全局变量
    globalReg({ bot, CQ })

    //修改时区
    process.env.TZ = global.config.bot.timeZone

    //连接相关监听
    bot.on('socket.open', (wsType, attempts) => msgToConsole(`连接中[${wsType}]#${attempts}`))

    bot.on('socket.failed', (wsType, attempts) => {
      msgToConsole(`连接失败[${wsType}]#${attempts}`)
      if (attempts === global.config.bot.connect.reconnectionAttempts) {
        throw new Error(
          `连接失败次数超过设置的${global.config.bot.connect.reconnectionAttempts}次!`
        )
      }
    })

    bot.on('socket.error', (wsType, err) => {
      msgToConsole(`连接错误[${wsType}]`)
      console.error(err)
    })

    bot.on('socket.connect', (wsType, sock, attempts) => {
      msgToConsole(`连接成功[${wsType}]#${attempts}`)
      if (wsType === '/api') {
        if (global.config.bot.online.enable && global.config.bot.debug === false) {
          setTimeout(async () => {
            if (global.config.bot.admin <= 0) {
              msgToConsole('请检查管理员账户')
            } else {
              await sendMsg(global.config.bot.admin, `${global.config.bot.online.msg}#${attempts}`)
            }
          }, 1000)
        }
        if (global.config.bot.debug) {
          msgToConsole(`当前已打开DEBUG模式,可能会有更多的log被输出,非开发人员请关闭~`)
        }
      }
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
        if (
          (await events[i].callback(
            event,
            { command: format(context.message), ...context },
            tags
          )) === 'quit'
        ) {
          break
        }
      }
    })
    bot.on('notice', async context => {
      let events = compare(global.events.notice, 'priority')
      for (let i = 0; i < events.length; i++) {
        if ((await events[i].callback(context)) === 'quit') {
          break
        }
      }
    })
    bot.on('request', async context => {
      let events = compare(global.events.request, 'priority')
      for (let i = 0; i < events.length; i++) {
        if ((await events[i].callback(context)) === 'quit') {
          break
        }
      }
    })

    // connect
    bot.connect()
  } catch (error) {
    console.log(error)
    throw new Error('请检查机器人配置文件!!!')
  }
}

export const compare = (arr, property) => {
  return arr.sort((a, b) => (a[property] < b[property] ? 1 : a[property] > b[property] ? -1 : 0))
}
