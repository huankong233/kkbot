export default () => {
  loadConfig('bilibili.jsonc', true)

  event()
}

function event() {
  RegEvent('message', async (event, context, tags) => {
    bilibiliHandler(context)
  })
}

import fetch from 'node-fetch'
import { getVideoInfo } from './video.js'
import { getDynamicInfo } from './dynamic.js'
import { getArticleInfo } from './article.js'
import { getLiveRoomInfo } from './live.js'

const getIdFromNormalLink = link => {
  if (typeof link !== 'string') return null
  const searchVideo =
    /bilibili\.com\/video\/(?:av(\d+)|(bv[\da-z]+))/i.exec(link) ||
    /bilibili\.com\\\/video\\\/(?:av(\d+)|(bv[\da-z]+))/i.exec(link) ||
    {}
  const searchDynamic =
    /t\.bilibili\.com\/(\d+)/i.exec(link) || /m\.bilibili\.com\/dynamic\/(\d+)/i.exec(link) || {}
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

const getIdFromShortLink = async shortLink => {
  try {
    const data = await fetch(shortLink)
    return getIdFromNormalLink(data.url)
  } catch (e) {
    msgToConsole(`[error] bilibili head short link ${shortLink}`)
    console.log(e)
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

//回复
const replyResult = async ({ context, message, at, reply }) => {
  await replyMsg(context, message, at, reply)
}

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

  const { group_id: gid, message: msg } = context
  const param = await getIdFromMsg(msg)
  const { aid, bvid, dyid, arid, lrid } = param

  //解析视频
  if (setting.getVideoInfo && (aid || bvid)) {
    const { text, ids, reply } = await getVideoInfo({ aid, bvid })
    if (text) {
      replyResult({
        context,
        message: text,
        at: false,
        reply: !!reply,
        gid,
        ids
      })
    }
    return true
  }

  //解析动态
  if (setting.getDynamicInfo && dyid) {
    const reply = await getDynamicInfo(dyid)
    if (reply) {
      replyResult({
        context,
        message: reply.text,
        at: false,
        reply: !!reply.reply,
        gid,
        ids: [dyid]
      })
    }
    return true
  }

  //解析文章
  if (setting.getArticleInfo && arid) {
    const reply = await getArticleInfo(arid)
    if (reply) {
      replyResult({
        context,
        message: reply,
        gid,
        ids: [arid]
      })
    }
    return true
  }

  //解析直播或音频
  if (setting.getLiveRoomInfo && lrid) {
    const reply = await getLiveRoomInfo(lrid)
    if (reply) {
      replyResult({
        context,
        message: reply,
        gid,
        ids: [lrid]
      })
    }
    return true
  }
}
