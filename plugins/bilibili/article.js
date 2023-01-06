import { humanNum } from './humanNum.js'
import { request } from './utils.js'

export const getArticleInfo = async id => {
  const data = await request(`https://api.bilibili.com/x/article/viewinfo?id=${id}`).catch(e => {
    msgToConsole(`[error] bilibili get article info ${id}`)
    console.log(e)
    return null
  })
  let {
    data: {
      data: {
        stats: { view, reply },
        title,
        author_name,
        origin_image_urls: [img]
      }
    }
  } = data

  return [
    `${CQ.image(img)}`,
    `${CQ.escape(title)}`,
    `UP：${CQ.escape(author_name)}`,
    `${humanNum(view)}阅读 ${humanNum(reply)}评论`,
    `https://www.bilibili.com/read/cv${id}`
  ].join('\n')
}
