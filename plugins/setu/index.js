export default () => {
  event()
}

import { eventReg } from '../../libs/eventReg.js'
function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      const { name } = context.command
      const { setu } = global.config
      const match = name.match(setu.reg)
      if (match) {
        await handler(context, match)
      }
    }
  })
}

import { reduce, add } from '../pigeon/index.js'
import { imgAntiShielding } from './AntiShielding.js'
import { deleteMsg } from '../../libs/Api.js'
import { get, post } from '../../libs/fetch.js'
import { replyMsg } from '../../libs/sendMsg.js'

async function handler(context, match) {
  const { user_id } = context
  const { setu } = global.config

  let userData = await database.select('*').where('user_id', user_id).from('setu').first()

  if (!userData) {
    // 第一次看色图
    await database.insert({ user_id }).into('setu')
    userData = { count: 0, update_time: 0 }
  }

  //判断有没有到上限了
  let { count, update_time } = userData

  // 更新count
  count = checkQuota(count, update_time, setu.limit)
  if (!count) {
    const res = await replyMsg(context, CQ.image('https://api.lolicon.app/assets/img/lx.jpg'), {
      reply: true
    })

    if (res.status === 'failed') {
      await replyMsg(context, '因此对于年轻人而言一个重要的功课就是学会去节制欲望.jpg')
    }
    return
  }

  if (!(await reduce({ user_id, number: setu.pigeon, reason: '看色图' }))) {
    return await replyMsg(context, '你的鸽子不够哦~', {
      reply: true
    })
  }

  const requestData = {
    r18: match[1] ? 1 : 0,
    tag: [],
    proxy: global.config.proxy ? false : setu.proxy.enable ? setu.proxy.url : false
  }

  if (match[2]) {
    const groupOut = match[2].split('&amp;')
    groupOut.forEach(item => {
      let groupIn = item.split('|')
      groupIn = groupIn.map(item => {
        // 支持前后或中间配置r18变量
        if (item.match(/[Rr]18/)) {
          requestData.r18 = true
          return item.replaceAll(/[Rr]18/g, '')
        } else {
          return item
        }
      })
      requestData.tag.push(groupIn)
    })
  }

  let responseData

  try {
    responseData = await post({
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
          throw new Error('机器人IP被Ban,请检查')
        } else {
          return jsonc.parse(res)['data']
        }
      })
  } catch (error) {
    await replyMsg(
      context,
      error === '机器人IP被Ban,请检查' ? '机器人IP被Ban,请检查' : '色图服务器爆炸惹',
      {
        reply: true
      }
    )
    await add({ user_id, number: setu.pigeon, reason: '色图加载失败' })

    logger.WARNING('色图加载失败')
    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
    return
  }

  if (responseData.length === 0) {
    await replyMsg(context, '换个标签试试吧~', {
      reply: true
    })
    await add({ user_id, number: setu.pigeon, reason: '没有获取到色图' })
    return
  }

  responseData = responseData[0]

  let fullUrl = `https://www.pixiv.net/artworks/${responseData.pid}`

  let shortUrlData

  if (setu.short.enable) {
    try {
      shortUrlData = await get({
        url: `${setu.short.url}/api/url`,
        data: {
          url: fullUrl
        }
      }).then(res => res.json())
    } catch (error) {
      await replyMsg(context, '短链服务器爆炸惹', {
        reply: true
      })
      await add({ user_id, number: setu.pigeon, reason: '短链加载失败' })
      logger.WARNING('短链加载失败')
      if (debug) {
        logger.DEBUG(error)
      } else {
        logger.WARNING(error)
      }
      return
    }
  }

  const infoMessage = [
    `标题:${responseData.title}`,
    `标签:${responseData.tags.join(' ')}`,
    `AI作品:${responseData.aiType ? '是' : '不是'}`,
    `作品地址:${setu.short.enable ? shortUrlData.url : fullUrl}`,
    '图片还在路上哦~坐和放宽~'
  ].join('\n')

  const infoMessageResponse = await replyMsg(context, infoMessage, {
    reply: true
  })

  let image

  try {
    image = await get({
      url: responseData.urls.original,
      headers: { Referer: 'https://www.pixiv.net/', Host: 'i.pximg.net' }
    }).then(res => res.arrayBuffer())
  } catch (error) {
    await replyMsg(context, '图片获取失败惹', {
      reply: true
    })
    await add({ user_id, number: setu.pigeon, reason: '图片获取失败' })
    logger.WARNING('图片获取失败')
    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
    return
  }

  let base64

  try {
    //反和谐
    base64 = await imgAntiShielding(image, setu.antiShieldingMode)
  } catch (error) {
    await replyMsg(context, '反和谐失败惹', {
      reply: true
    })
    await add({ user_id, number: setu.pigeon, reason: '反和谐失败' })
    logger.WARNING('反和谐失败')
    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
    return
  }

  const message = await replyMsg(context, CQ.image(`base64://${base64}`), {
    reply: true
  })

  if (message.status === 'failed') {
    await replyMsg(context, '色图发送失败', {
      reply: true
    })
    await add({ user_id, number: setu.pigeon, reason: '色图发送失败' })
    return
  } else {
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
  }, setu.withdraw * 1000)
}

import { isToday } from '../gugu/index.js'
import logger from '../../libs/logger.js'
import { jsonc } from 'jsonc'
/**
 * 判断是否超出配额
 * @param {Number} count
 * @param {Number} update_time
 * @param {Number} limit
 * @returns
 */
function checkQuota(count, update_time, limit) {
  if (count >= limit) {
    // 判断时间如果是今天就返回false，不然返回1
    return isToday(update_time) ? false : 1
  } else {
    return count + 1
  }
}
