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
