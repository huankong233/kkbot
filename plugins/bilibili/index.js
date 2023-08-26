export default async () => {
  event()
}

import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    await bilibiliHandler(context)
  })
}

import { replyMsg } from '../../libs/sendMsg.js'
import { getVideoInfo } from './libs/video.js'
import { getDynamicInfo } from './libs/dynamic.js'
import { getArticleInfo } from './libs/article.js'
import { getLiveRoomInfo } from './libs/live.js'

//主程序
async function bilibiliHandler(context) {
  const { bilibili } = global.config
  const { message } = context

  if (
    !(
      bilibili.getVideoInfo ||
      bilibili.getDynamicInfo ||
      bilibili.getArticleInfo ||
      bilibili.getLiveRoomInfo
    )
  ) {
    return
  }

  const {
    aid = null,
    bvid = null,
    dyid = null,
    arid = null,
    lrid = null
  } = await parseData(message)

  //解析视频
  if (bilibili.getVideoInfo && (aid || bvid)) {
    const reply = await getVideoInfo({ aid, bvid })
    if (reply) {
      await replyMsg(context, reply)
    }
    return
  }

  //解析动态
  if (bilibili.getDynamicInfo && dyid) {
    const reply = await getDynamicInfo(dyid)
    if (reply) {
      await replyMsg(context, reply)
    }
    return
  }

  //解析文章
  if (bilibili.getArticleInfo && arid) {
    const reply = await getArticleInfo(arid)
    if (reply) {
      await replyMsg(context, reply)
    }
    return
  }

  //解析直播或音频
  if (bilibili.getLiveRoomInfo && lrid) {
    const reply = await getLiveRoomInfo(lrid)
    if (reply) {
      await replyMsg(context, reply)
    }
    return
  }
}

import { get } from '../../libs/fetch.js'
import { logger } from '../../libs/logger.js'
import { parseJSON } from './libs/utils.js'

async function parseData(message) {
  let url = message
  if (message.includes('com.tencent.miniapp_01')) {
    // 小程序
    const data = parseJSON(message)
    url = data?.meta?.detail_1?.qqdocurl
  } else if (message.includes('com.tencent.structmsg')) {
    // 结构化消息
    const data = parseJSON(message)
    url = data?.meta?.news?.jumpUrl
  }

  // 判断是否为短链
  const regex = /((b23|acg)\.tv|bili2233.cn)\/[0-9a-zA-Z]+/.exec(url)
  if (regex) url = await getLinkFromShortLink(`https://${regex[0]}`)
  return getIdFromNormalLink(url)
}

async function getLinkFromShortLink(shortLink) {
  try {
    const data = await get({ url: shortLink })
    return data.url
  } catch (error) {
    logger.WARNING(`bilibili get head short link ${shortLink} failed`)
    return {}
  }
}

function getIdFromNormalLink(link) {
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
    // link
  }
}
