export default () => {
  //初始化搜图
  searchInitialization()
  //注册事件
  event()
}

//注册事件
import { eventReg } from '../../libs/eventReg.js'
function event() {
  const { bot, searchImage } = global.config

  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      // 开启搜图模式
      if (context.command.name === `${bot.botName}${searchImage.word.on}`) {
        await turnOnSearchMode(context)
      }
    }
  })

  eventReg(
    'message',
    async (event, context, tags) => {
      // 退出搜图模式
      if (context.command.name === `${searchImage.word.off}${bot.botName}`) {
        await turnOffSearchMode(context)
      } else {
        if (isSearchMode(context.user_id)) {
          await search(context)
          return 'quit'
        }
      }
    },
    100
  )
}

import {
  turnOnSearchMode,
  turnOffSearchMode,
  searchInitialization,
  isSearchMode,
  refreshTimeOfAutoLeave
} from './control.js'

import { add, reduce } from '../pigeon/index.js'
import { replyMsg, sendForwardMsg } from '../../libs/sendMsg.js'

async function search(context) {
  const { user_id } = context
  const { searchImage } = global.config

  //先下载文件
  let messageArray = CQ.parse(context.message)

  let receive = false

  for (let i = 0; i < messageArray.length; i++) {
    const message = messageArray[i]
    if (message._type === 'image') {
      //扣除鸽子
      if (!(await reduce({ user_id, number: searchImage.reduce, reason: '搜图' }))) {
        return await replyMsg(context, `搜索失败,鸽子不足~`, true)
      }

      if (!receive) {
        receive = true
        await replyMsg(context, `${searchImage.word.receive}`, true)
      }

      //刷新时间
      refreshTimeOfAutoLeave(context.user_id)

      await imageHandler(context, message._data.url)
    }
  }
}

import { getUniversalImgURL } from '../../libs/handleUrl.js'
import { downloadFile } from '../../libs/fs.js'
import { ascii2d, SauceNAO, IqDB, TraceMoe, AnimeTrace } from 'image_searcher'
import logger from '../../libs/logger.js'
import fs from 'fs'

async function imageHandler(context, url) {
  const { searchImage } = global.config

  //图片url
  const imageUrl = getUniversalImgURL(url)
  const imagePath = await downloadFile(imageUrl)

  const requestParams = [
    {
      name: 'ascii2d',
      callback: ascii2d,
      params: {
        type: 'bovw',
        proxy: searchImage.ascii2dProxy,
        imagePath
      }
    },
    {
      name: 'SauceNAO',
      callback: SauceNAO,
      params: {
        hide: false,
        imagePath
      }
    },
    {
      name: 'IqDB',
      callback: IqDB,
      params: {
        discolor: false,
        services: [
          'danbooru',
          'konachan',
          'yandere',
          'gelbooru',
          'sankaku_channel',
          'e_shuushuu',
          'zerochan',
          'anime_pictures'
        ],
        imagePath
      }
    },
    {
      name: 'TraceMoe',
      callback: TraceMoe,
      params: {
        cutBorders: true,
        imagePath
      }
    },
    {
      name: 'AnimeTraceAnime',
      callback: AnimeTrace,
      params: {
        model: 'anime_model_lovelive',
        mode: 0,
        preview: true,
        imagePath
      }
    },
    {
      name: 'AnimeTraceGame',
      callback: AnimeTrace,
      params: {
        model: 'game_model_kirakira',
        mode: 0,
        preview: true,
        imagePath
      }
    }
  ]

  const responseData = await request(requestParams)

  await parse(context, responseData, imageUrl)

  //删除文件
  fs.unlinkSync(imagePath)
}

//运行函数防止崩溃
async function request(callbacks) {
  let responseData = []
  for (let i = 0; i < callbacks.length; i++) {
    const item = callbacks[i]
    try {
      if (debug) logger.DEBUG(`[搜图] 引擎:${item.name}搜索中`)
      const start = performance.now()
      let obj = {
        success: true,
        name: item.name,
        res: await item.callback(item.params)
      }
      const end = performance.now()
      obj.cost = end - start
      responseData.push(obj)
    } catch (error) {
      responseData.push({ success: false, name: item.name, res: error })
      logger.WARNING(`[搜图] 引擎:${item.name}请求失败`)

      if (debug) {
        logger.DEBUG(error)
      } else {
        logger.WARNING(error)
      }
    }
  }
  return responseData
}

import { Parser } from './parse.js'

//整理数据
async function parse(context, res, originUrl) {
  const { user_id } = context
  const { bot, searchImage } = global.config

  let messages = [CQ.node(bot.info.nickname, bot.info.user_id, CQ.image(originUrl))]

  res.forEach(async datum => {
    if (!datum.success) {
      messages.push(
        CQ.node(
          bot.info.nickname,
          bot.info.user_id,
          CQ.text(`${datum.name}搜图失败力~已赔偿鸽子${searchImage.back}只`)
        )
      )
      //赔偿
      await add({
        user_id,
        number: searchImage.back,
        reason: `${datum.name}搜图失败赔偿`
      })
    }

    let message = `${datum.name}(耗时:${parseInt(datum.cost)}ms):\n`
    if (datum.res.length === 0) {
      message += '没有搜索结果~'
    } else {
      let limit = datum.res.length >= searchImage.limit ? searchImage.limit : datum.res.length

      for (let i = 0; i < limit; i++) {
        const item = datum.res[i]
        message += Parser[datum.name](item)
      }
    }

    const node = CQ.node(bot.info.nickname, bot.info.user_id, message)
    messages.push(node)
  })

  //发送
  const data = await sendForwardMsg(context, messages)
  if (data.status === 'failed') {
    await replyMsg(context, '发送合并消息失败，可以尝试私聊我哦~(鸽子已返还)')
    await add({ user_id, number: searchImage.reduce, reason: `搜图合并消息发送失败赔偿` })
  }
}
