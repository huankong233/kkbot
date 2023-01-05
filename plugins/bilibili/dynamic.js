import { humanNum } from './humanNum'
import { purgeLink, purgeLinkInText, request } from './utils'

export const getDynamicInfo = async id => {
  try {
    const {
      data: { card }
    } = await request(
      `https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/get_dynamic_detail?dynamic_id=${id}`
    )

    return dynamicCard2msg(card)
  } catch (e) {
    msgToConsole(`[error] bilibili get dynamic info ${id}`)
    console.log(e)
    return null
  }
}

const parseDynamicCard = ({
  desc: {
    type,
    dynamic_id_str,
    bvid,
    origin,
    user_profile: {
      info: { uname }
    }
  },
  card,
  extension
}) => {
  const data = {
    dyid: dynamic_id_str,
    type,
    uname,
    card: { bvid, ...JSON.parse(card) }
  }
  if (origin) {
    data.origin = {
      desc: {
        ...origin,
        user_profile: data.card.origin_user
      },
      card: data.card.origin
    }
  }
  if (extension && extension.vote) {
    data.vote = JSON.parse(extension.vote)
  }
  return data
}

const dynamicCard2msg = async (card, forPush = false) => {
  if (!card) {
    if (forPush) return null
    return {
      type: -1,
      text: '该动态已被删除',
      reply: true
    }
  }
  const parsedCard = parseDynamicCard(card)
  const {
    dyid,
    type,
    uname,
    card: { item }
  } = parsedCard

  const lines = [`https://t.bilibili.com/${dyid}`, `UP：${CQ.escape(uname)}`, '']

  // 推送时过滤抽奖结果
  if (type === 1 && forPush && item.content.includes('详情请点击互动抽奖查看')) return null

  if (type in formatters) lines.push(...(await formatters[type](parsedCard, forPush)))
  else lines.push(`未知的动态类型 type=${type}`)

  return {
    type,
    text: lines.join('\n').trim()
  }
}

const ifArray = (cond, ...items) => (cond ? items : [])

const formatters = {
  // 转发
  1: async ({ origin, card }, forPush = false) => [
    CQ.escape(purgeLinkInText(card.item.content.trim())),
    '',
    (
      await dynamicCard2msg(origin, forPush).catch(e => {
        msgToConsole(`${getTime()} [error] bilibili parse original dynamic`, card)
        console.log(e)
        return null
      })
    ).text || `https://t.bilibili.com/${origin.dynamic_id_str}`
  ],

  // 图文动态
  2: async ({
    card: {
      item: { description, pictures }
    }
  }) => [
      CQ.escape(purgeLinkInText(description.trim())),
      ...pictures.map(({ img_src }) => CQ.image(img_src))
    ],

  // 文字动态
  4: ({ card: { item }, vote }) => {
    const lines = [CQ.escape(purgeLinkInText(item.content.trim()))]
    // 投票
    if (vote) {
      const { choice_cnt, desc, endtime, join_num, options } = vote
      lines.push(
        '',
        `【投票】${desc}`,
        `截止日期：${new Date(endtime * 1000).toLocaleString()}`,
        `参与人数：${humanNum(join_num)}`,
        '',
        `投票选项（最多选择${choice_cnt}项）`,
        ...options.flatMap(({ desc, img_url }) => [
          `- ${desc}`,
          ...ifArray(img_url, CQ.image(img_url))
        ])
      )
    }
    return lines
  },

  // 视频
  8: ({ card: { aid, bvid, dynamic, pic, title, stat, owner } }) => [
    ...ifArray(dynamic, CQ.escape(purgeLinkInText(dynamic.trim())), ''),
    CQ.image(pic),
    `av${aid}`,
    CQ.escape(title.trim()),
    `UP：${CQ.escape(owner.name)}`,
    `${humanNum(stat.view)}播放 ${humanNum(stat.danmaku)}弹幕`,
    `https://www.bilibili.com/video/${bvid}`
  ],

  // 文章
  64: ({ card: { title, id, summary, image_urls } }) => [
    ...ifArray(image_urls.length, CQ.image(image_urls[0])),
    CQ.escape(title.trim()),
    CQ.escape(summary.trim()),
    `https://www.bilibili.com/read/cv${id}`
  ],

  // 音频
  256: ({ card: { title, id, cover, intro, author, playCnt, replyCnt, typeInfo } }) => [
    ...ifArray(intro, CQ.escape(purgeLinkInText(intro.trim())), ''),
    CQ.image(cover),
    `au${id}`,
    CQ.escape(title.trim()),
    `歌手：${CQ.escape(author)}`,
    `分类：${typeInfo}`,
    `${humanNum(playCnt)}播放 ${humanNum(replyCnt)}评论`,
    `https://www.bilibili.com/audio/au${id}`
  ],

  // 类似外部分享的东西
  2048: ({
    card: {
      sketch: { title, cover_url, target_url }
    }
  }) => [
      CQ.image(cover_url),
      CQ.escape(title),
      CQ.escape(purgeLink(target_url))
    ],

  // 直播
  4200: ({
    card: { title, cover, roomid, short_id, area_v2_parent_name, area_v2_name, live_status, online }
  }) => [
      CQ.image(cover),
      CQ.escape(title),
      `房间号：${roomid}${short_id ? `  短号：${short_id}` : ''}`,
      `分区：${area_v2_parent_name}${area_v2_parent_name === area_v2_name ? '' : `-${area_v2_name}`}`,
      live_status ? `直播中  ${humanNum(online)}人气` : '未开播',
      `https://live.bilibili.com/${short_id || roomid}`
    ],

  // 直播
  4308: ({
    card: {
      live_play_info: { cover, title, room_id, parent_area_name, area_name, live_status, online }
    }
  }) => [
      CQ.image(cover),
      CQ.escape(title),
      `房间号：${room_id}`,
      `分区：${parent_area_name}${parent_area_name === area_name ? '' : `-${area_name}`}`,
      live_status ? `直播中  ${humanNum(online)}人气` : '未开播',
      `https://live.bilibili.com/${room_id}`
    ]
}
