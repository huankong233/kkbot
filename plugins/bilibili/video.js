import { stringify } from 'qs'
import { request } from './utils.js'
import { humanNum } from './humanNum.js'

export const getVideoInfo = async param => {
  try {
    const data = await request(`https://api.bilibili.com/x/web-interface/view?${stringify(param)}`)

    if (data.code === -404) return { text: '该视频已被删除', reply: true }
    if (data.code !== 0) return { text: data.message, reply: true }

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

    return {
      ids: [aid, bvid],
      text: [
        `${CQ.image(pic)}`,
        `av${aid}`,
        `${CQ.escape(title)}`,
        `UP：${CQ.escape(name)}`,
        `${humanNum(view)}播放 ${humanNum(danmaku)}弹幕`,
        `https://www.bilibili.com/video/${bvid}`
      ].join('\n')
    }
  } catch (e) {
    msgToConsole(`[error] bilibili get video info ${param}`)
    console.log(e)
    return {}
  }
}
