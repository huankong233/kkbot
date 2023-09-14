import { stringify } from 'qs'
import { humanNum } from './utils.js'
import { get } from '../../../libs/fetch.js'
import { CQ } from 'go-cqwebsocket'
import { logger } from '../index.js'

export async function getVideoInfo(param) {
  try {
    const data = await get({
      url: `https://api.bilibili.com/x/web-interface/view?${stringify(param)}`
    }).then(res => res.json())

    if (data.code === -404) return '该视频已被删除'
    if (data.code !== 0) return data.message

    const {
      data: {
        bvid,
        aid,
        pic,
        title,
        owner: { name },
        stat: { view, danmaku }
      }
    } = data

    return [
      `${CQ.image(pic.replace('http://', 'https://'))}`,
      `av${aid}`,
      `${CQ.escape(title)}`,
      `UP：${CQ.escape(name)}`,
      `${humanNum(view)}播放 ${humanNum(danmaku)}弹幕`,
      `https://www.bilibili.com/video/${bvid}`
    ].join('\n')
  } catch (error) {
    logger.WARNING(`获取视频信息失败`)
    logger.ERROR(error)
    return null
  }
}
