import { humanNum } from './utils.js'
import { get } from '../../../libs/fetch.js'
import { logger } from '../../../libs/logger.js'

export const getLiveRoomInfo = async id => {
  try {
    const data = await get({
      url: `https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${id}`
    }).then(res => res.json())

    let {
      data: {
        room_info: {
          room_id,
          short_id,
          title,
          live_status,
          area_name,
          parent_area_name,
          keyframe,
          online
        },
        anchor_info: {
          base_info: { uname }
        }
      }
    } = data

    return [
      CQ.image(keyframe.replace('http', 'https')),
      CQ.escape(title),
      `主播：${CQ.escape(uname)}`,
      `房间号：${room_id}${short_id ? `  短号：${short_id}` : ''}`,
      `分区：${parent_area_name}${parent_area_name === area_name ? '' : `-${area_name}`}`,
      live_status ? `直播中  ${humanNum(online)}人气` : '未开播',
      `https://live.bilibili.com/${short_id || room_id}`
    ].join('\n')
  } catch (error) {
    logger.WARNING(`bilibili get live room info ${id}`)
    if (global.debug) logger.DEBUG(error)
    return null
  }
}
