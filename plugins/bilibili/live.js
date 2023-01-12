import { humanNum } from './humanNum.js'
import { request } from './utils.js'

export const getLiveRoomInfo = async id => {
  const data = await request(
    `https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=${id}`
  ).catch(e => {
    msgToConsole(`[error] bilibili get live room info ${id}`)
    console.log(e)
  })
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
    CQ.image(keyframe),
    CQ.escape(title),
    `主播：${CQ.escape(uname)}`,
    `房间号：${room_id}${short_id ? `  短号：${short_id}` : ''}`,
    `分区：${parent_area_name}${parent_area_name === area_name ? '' : `-${area_name}`}`,
    live_status ? `直播中  ${humanNum(online)}人气` : '未开播',
    `https://live.bilibili.com/${short_id || room_id}`
  ].join('\n')
}
