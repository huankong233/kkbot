import { purgeLinkInText, humanNum } from './utils.js'
import { get } from '../../../libs/fetch.js'
import { CQ } from 'go-cqwebsocket'
import { logger } from '../index.js'

const additionalFormatters = {
  // 投票
  ADDITIONAL_TYPE_VOTE: ({ vote: { desc, end_time, join_num } }) => [
    `【投票】${CQ.escape(desc)}`,
    `截止日期：${new Date(end_time * 1000).toLocaleString()}`,
    `参与人数：${humanNum(join_num)}`,
    '投票详情见原动态'
  ],

  // 预约
  ADDITIONAL_TYPE_RESERVE: ({ reserve: { title, desc1, desc2 } }) => {
    const lines = [CQ.escape(title)]
    const desc = [desc1?.text, desc2?.text].filter(v => v)
    if (desc.length > 0) lines.push(CQ.escape(desc.join('  ')))
    return lines
  }
}

const majorFormatters = {
  // 图片
  MAJOR_TYPE_DRAW: async ({ draw: { items } }) => {
    return items.map(({ src }) => CQ.image(src.replace('http://', 'https://')))
  },

  // 视频
  MAJOR_TYPE_ARCHIVE: ({ archive: { cover, aid, bvid, title, stat } }) => [
    CQ.image(cover.replace('http://', 'https://')),
    `av${aid}`,
    CQ.escape(title.trim()),
    `${humanNum(stat.play)}播放 ${humanNum(stat.danmaku)}弹幕`,
    `https://www.bilibili.com/video/${bvid}`
  ],

  // 文章
  MAJOR_TYPE_ARTICLE: ({ article: { covers, id, title, desc } }) => [
    ...(covers.length ? [CQ.image(covers[0].replace('http://', 'https://'))] : []),
    `《${CQ.escape(title.trim())}》`,
    CQ.escape(desc.trim()),
    `https://www.bilibili.com/read/cv${id}`
  ],

  // 音乐
  MAJOR_TYPE_MUSIC: ({ music: { cover, id, title, label } }) => [
    CQ.image(cover.replace('http://', 'https://')),
    `au${id}`,
    CQ.escape(title.trim()),
    `分类：${label}`,
    `https://www.bilibili.com/audio/au${id}`
  ],

  // 直播
  MAJOR_TYPE_LIVE: ({ live: { cover, title, id, live_state, desc_first, desc_second } }) => [
    CQ.image(cover.replace('http://', 'https://')),
    CQ.escape(title),
    `房间号：${id}`,
    `分区：${desc_first}`,
    live_state ? `直播中  ${desc_second}` : '未开播',
    `https://live.bilibili.com/${id}`
  ],

  // 通用动态？
  MAJOR_TYPE_OPUS: ({
    opus: {
      jump_url,
      pics,
      summary: { text },
      title
    }
  }) => [
    ...(pics.length ? [CQ.image(pics[0].url.replace('http://', 'https://'))] : []),
    `《${CQ.escape(title.trim())}》`,
    CQ.escape(text.trim()),
    jump_url.replace(/^\/\//, 'https://')
  ]
}

const formatDynamic = async item => {
  const { module_author: author, module_dynamic: dynamic } = item.modules
  const lines = [`https://t.bilibili.com/${item.id_str}`, `UP：${CQ.escape(author.name)}`]

  const desc = dynamic?.desc?.text?.trim()
  if (desc) lines.push('', CQ.escape(purgeLinkInText(desc)))

  const major = dynamic?.major
  if (major && major.type in majorFormatters) {
    lines.push('', ...(await majorFormatters[major.type](major)))
  }

  const additional = dynamic?.additional
  if (additional && additional.type in additionalFormatters) {
    lines.push('', ...(await additionalFormatters[additional.type](additional)))
  }

  if (item.type === 'DYNAMIC_TYPE_FORWARD') {
    if (item.orig.type === 'DYNAMIC_TYPE_NONE') {
      lines.push('', '【转发的源动态已被作者删除】')
    } else {
      lines.push('', ...(await formatDynamic(item.orig)))
    }
  }

  return lines
}

export const getDynamicInfoFromItem = async item => {
  return {
    id: item.id_str,
    type: item.type,
    text: (await formatDynamic(item)).join('\n')
  }
}

export const getDynamicInfo = async id => {
  const { bilibiliConfig } = global.config

  try {
    const {
      data: { data, code, message }
    } = await get({
      url: 'https://api.bilibili.com/x/polymer/web-dynamic/v1/detail',
      data: {
        timezone_offset: new Date().getTimezoneOffset(),
        id,
        features: 'itemOpusStyle'
      },
      headers: {
        Cookie: bilibiliConfig.DEDE_USER_COOKIE,
        'User-Agent': bilibiliConfig.USER_AGENT
      }
    }).then(res => res.json())

    if (code === 4101131 || code === 4101105) {
      return '动态不存在'
    }

    if (code !== 0) {
      return `Error: (${code})${message}`
    }

    if (!data?.item) {
      return 'Error: 无内容'
    }

    const lines = await formatDynamic(data.item)
    return lines.join('\n')
  } catch (error) {
    logger.WARNING(`获取动态信息失败`)
    logger.ERROR(error)
    return null
  }
}
