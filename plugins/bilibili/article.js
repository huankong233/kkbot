import { logger } from '../../libs/logger.js'
import { humanNum } from './utils.js'
import { get } from '../../libs/fetch.js'

export const getArticleInfo = async id => {
  try {
    const data = await get({ url: `https://api.bilibili.com/x/article/viewinfo?id=${id}` }).then(
      res => res.json()
    )

    let {
      data: {
        stats: { view, reply },
        title,
        author_name,
        origin_image_urls: [img]
      }
    } = data

    return [
      `${CQ.image(img.replace('http', 'https'))}`,
      `${CQ.escape(title)}`,
      `UP：${CQ.escape(author_name)}`,
      `${humanNum(view)}阅读 ${humanNum(reply)}评论`,
      `https://www.bilibili.com/read/cv${id}`
    ].join('\n')
  } catch (error) {
    logger.WARNING(`bilibili get article info ${id}`)
    if (global.debug) logger.DEBUG(error)
    return null
  }
}
