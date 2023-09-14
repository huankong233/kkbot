import { eventReg } from '../../libs/eventReg.js'
import { reduce, add } from '../pigeon/index.js'
import { imgAntiShielding } from './AntiShielding.js'
import { deleteMsg } from '../../libs/Api.js'
import { get, post } from '../../libs/fetch.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { isToday } from '../../libs/time.js'
import { makeLogger } from '../../libs/logger.js'
import { confuseURL } from '../../libs/handleUrl.js'
import { CQ } from 'go-cqwebsocket'

const logger = makeLogger({ pluginName: 'setu' })

export default () => {
  event()
}

function event() {
  eventReg('message', async (event, context, tags) => {
    const { command } = context
    if (command) {
      const { setuConfig } = global.config
      const match = command.name.match(setuConfig.reg)
      if (match) {
        await handler(context, match)
      }
    }
  })
}

async function handler(context, match) {
  const { user_id } = context
  const { setuConfig } = global.config

  let userData = await database.select('*').where('user_id', user_id).from('setu').first()

  if (!userData) {
    // 第一次看色图
    await database.insert({ user_id }).into('setu')
    userData = { count: 0, update_time: 0 }
  }

  let { count, update_time } = userData

  if (!isToday(update_time)) {
    // 如果不是今天就清零
    count = 0
  }

  // 每天上限
  if (count >= setuConfig.limit) {
    const res = await replyMsg(context, CQ.image('https://api.lolicon.app/assets/img/lx.jpg'), {
      reply: true
    })

    if (res.status === 'failed') {
      await replyMsg(context, '因此对于年轻人而言一个重要的功课就是学会去节制欲望.jpg')
    }
    return
  }

  if (!(await reduce({ user_id, number: setuConfig.pigeon, reason: '看色图' }))) {
    return await replyMsg(context, '你的鸽子不够哦~', {
      reply: true
    })
  }

  let requestData = {
    r18: match[1] ? 1 : 0,
    tag: [],
    proxy:
      global.config.proxy?.enable ?? false
        ? false
        : setuConfig.proxy.enable
        ? setuConfig.proxy.url
        : false
  }

  if (match[2]) {
    requestData.tag = match[2]
      .split('&')
      .map(element => {
        return element
          .split('|')
          .map(element => {
            // 支持前后或中间配置r18变量
            if (!element.match(/[Rr]18/)) {
              return element
            }
            requestData.r18 = true
            return element === 'r18' || element === 'R18' ? null : element.replaceAll(/[Rr]18/g, '')
          })
          .filter(item => item)
      })
      .filter(item => item.length !== 0)
  }

  let responseData, image

  try {
    ;({ responseData, image } = await getData(requestData))
  } catch (error) {
    let reply = '色图服务器爆炸惹'

    if (error.toString().includes('机器人IP被Ban啦,笨蛋')) {
      reply = '机器人IP被Ban啦,笨蛋'
    } else if (error.toString().includes('换个标签试试吧~')) {
      reply = '换个标签试试吧~'
    }

    await replyMsg(context, reply, {
      reply: true
    })
    await add({ user_id, number: setuConfig.pigeon, reason: reply })

    logger.WARNING(reply)
    logger.ERROR(error)
    return
  }

  let fullUrl = `https://www.pixiv.net/artworks/${responseData.pid}`

  let base64

  try {
    //反和谐
    base64 = await imgAntiShielding(image, setuConfig.antiShieldingMode)
  } catch (error) {
    await replyMsg(context, '反和谐失败惹', {
      reply: true
    })
    await add({ user_id, number: setuConfig.pigeon, reason: '反和谐失败' })
    logger.WARNING('反和谐失败')
    logger.ERROR(error)
    return
  }

  let shortUrlData

  if (setuConfig.short.enable) {
    try {
      shortUrlData = await get({
        url: `${setuConfig.short.url}/api/url`,
        data: {
          url: fullUrl
        }
      }).then(res => res.json())
    } catch (error) {
      await replyMsg(context, '短链服务器爆炸惹', {
        reply: true
      })
      await add({ user_id, number: setuConfig.pigeon, reason: '短链加载失败' })
      logger.WARNING('短链加载失败')
      logger.ERROR(error)
      return
    }
  }

  const infoMessage = [
    `标题: ${responseData.title}`,
    `标签: ${responseData.tags.join(' ')}`,
    `AI作品: ${responseData.aiType ? '是' : '不是'}`,
    `作品地址: ${setuConfig.short.enable ? shortUrlData.url : confuseURL(fullUrl)}`
  ].join('\n')

  const infoMessageResponse = await replyMsg(context, infoMessage, {
    reply: true
  })

  const message = await replyMsg(context, CQ.image(`base64://${base64}`))

  if (message.status === 'failed') {
    await replyMsg(context, '色图发送失败', {
      reply: true
    })
    await add({ user_id, number: setuConfig.pigeon, reason: '色图发送失败' })
    return
  } else {
    count++

    //更新数据
    await database
      .update({
        count,
        update_time: Date.now()
      })
      .where('user_id', user_id)
      .into('setu')
  }

  setTimeout(async () => {
    //撤回消息
    await deleteMsg({
      message_id: message.data.message_id
    })
    await deleteMsg({
      message_id: infoMessageResponse.data.message_id
    })
  }, setuConfig.withdraw * 1000)
}

import { retryAsync } from '../../libs/fetch.js'

async function getData(requestData) {
  return await retryAsync(
    async times => {
      const [responseData] = await post({
        url: 'https://api.lolicon.app/setu/v2',
        data: requestData,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.text())
        .then(async res => {
          if (res === ':D') {
            return ['quit机器人IP被Ban啦,笨蛋']
          } else {
            return JSON.parse(res)['data']
          }
        })

      if (!responseData) {
        if (times > 0) {
          return 'quit换个标签试试吧~'
        } else {
          throw new Error('换个标签试试吧~')
        }
      }

      if (responseData === 'quit机器人IP被Ban啦,笨蛋') {
        return 'quit机器人IP被Ban啦,笨蛋'
      }

      const image = await get({
        url: responseData.urls.original,
        headers: { Referer: 'https://www.pixiv.net/', Host: 'i.pximg.net' }
      }).then(res => res.arrayBuffer())

      const decoder = new TextDecoder('utf-8')
      const resTxt = decoder.decode(image)

      if (!resTxt || resTxt.includes('404')) {
        throw new Error('getImage Failed')
      }

      return {
        responseData,
        image
      }
    },
    5,
    2000
  )
}
