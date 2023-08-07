import logger from '../../../libs/logger.js'

/**
 * 净化链接
 * @param {string} link
 */
export function purgeLink(link) {
  try {
    const url = new URL(link)
    if (url.hostname === 'live.bilibili.com') {
      url.search = ''
      url.hash = ''
      return url.href
    }
    url.searchParams.delete('spm_id_from')
    return url.href
  } catch (e) {}
  return link
}

/**
 * 净化文本中的链接
 * @param {string} text
 */
export const purgeLinkInText = text =>
  text.replace(/https?:\/\/[-\w~!@#$%&*()+=;':,.?/]+/g, url => purgeLink(url))

/**
 * 转换数目
 * @param {Number} num
 * @returns
 */
export const humanNum = num => (num < 10000 ? num : `${(num / 10000).toFixed(1)}万`)

/**
 * CQ:json 转换专用
 */
export const parseJSON = text => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  let jsonText = text.substring(start, end + 1)
  if (text.includes('[CQ:json,')) jsonText = CQ.unescape(jsonText)
  try {
    return JSON.parse(jsonText)
  } catch (error) {
    logger.WARNING('转换CQ:json失败')
    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
    return null
  }
}
