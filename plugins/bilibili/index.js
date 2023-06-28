import { loadConfig } from '../../libs/loadConfig.js'

export default () => {
  loadConfig('bilibili')

  event()
}

import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    await bilibiliHandler(context)
  })
}

import { replyMsg } from '../../libs/sendMsg.js'
import { getVideoInfo } from './video.js'
import { getDynamicInfo } from './dynamic.js'
import { getArticleInfo } from './article.js'
import { getLiveRoomInfo } from './live.js'

//主程序
const bilibiliHandler = async context => {
  const setting = global.config.bilibili

  if (
    !(
      setting.getVideoInfo ||
      setting.getDynamicInfo ||
      setting.getArticleInfo ||
      setting.getLiveRoomInfo
    )
  ) {
    return
  }

  const { message } = context
  const param = await getIdFromMsg(message)
  const { aid, bvid, dyid, arid, lrid } = param

  //解析视频
  if (setting.getVideoInfo && (aid || bvid)) {
    const reply = await getVideoInfo({ aid, bvid })
    if (reply) {
      await replyMsg(context, reply)
    }
    return
  }

  //解析动态
  if (setting.getDynamicInfo && dyid) {
    const reply = await getDynamicInfo(dyid)
    if (reply) {
      await replyMsg(context, reply)
    }
    return
  }

  //解析文章
  if (setting.getArticleInfo && arid) {
    const reply = await getArticleInfo(arid)
    if (reply) {
      await replyMsg(context, reply)
    }
    return
  }

  //解析直播或音频
  if (setting.getLiveRoomInfo && lrid) {
    const reply = await getLiveRoomInfo(lrid)
    if (reply) {
      await replyMsg(context, reply)
    }
    return
  }
}

const getIdFromNormalLink = link => {
  if (typeof link !== 'string') return null
  const searchVideo =
    /bilibili\.com\/video\/(?:av(\d+)|(bv[\da-z]+))/i.exec(link) ||
    /bilibili\.com\\\/video\\\/(?:av(\d+)|(bv[\da-z]+))/i.exec(link) ||
    {}
  const searchDynamic =
    /t\.bilibili\.com\/(\d+)/i.exec(link) ||
    /m\.bilibili\.com\/dynamic\/(\d+)/i.exec(link) ||
    /www\.bilibili\.com\/opus\/(\d+)/i.exec(link) ||
    {}
  const searchArticle = /bilibili\.com\/read\/(?:cv|mobile\/)(\d+)/i.exec(link) || {}
  const searchLiveRoom = /live\.bilibili\.com\/(\d+)/i.exec(link) || {}
  return {
    aid: searchVideo[1],
    bvid: searchVideo[2],
    dyid: searchDynamic[1],
    arid: searchArticle[1],
    lrid: searchLiveRoom[1]
  }
}

import { get } from '../../libs/fetch.js'
import { logger } from '../../libs/logger.js'
const getIdFromShortLink = async shortLink => {
  try {
    const data = await get({ url: shortLink })
    return getIdFromNormalLink(data.url)
  } catch (error) {
    logger.WARNING(`bilibili head short link ${shortLink}`)
    if (global.debug) logger.DEBUG(error)
    return {}
  }
}

const getIdFromMsg = async msg => {
  let result = getIdFromNormalLink(msg)
  if (Object.values(result).some(id => id)) return result
  if ((result = /((b23|acg)\.tv|bili2233.cn)\/[0-9a-zA-Z]+/.exec(msg))) {
    return getIdFromShortLink(`https://${result[0]}`)
  }
  return {}
}
