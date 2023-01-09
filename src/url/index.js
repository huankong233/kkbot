export default () => {
  return {
    confuseURL
  }
}

const bannedHosts = ['danbooru.donmai.us', 'konachan.com', 'fanbox.cc', 'pixiv.net']

/**
 * 链接混淆
 * @param {string} url
 * @returns {string}
 */
export function confuseURL(url, force) {
  url = pixivShorten(url)
  if (force) {
    const host = url.match('(http|https)://(.*)/')[2]
    return url.replace('//', '//\u200B').replace(host, host.replace(/\./g, '.\u200B'))
  }
  for (const host of bannedHosts) {
    if (url.includes(host)) {
      return url.replace('//', '//\u200B').replace(host, host.replace(/\./g, '.\u200B'))
    }
  }
  return url
}

/**
 * pixiv 短链接
 * @param {string} url
 * @returns {string}
 */
export function pixivShorten(url) {
  const pidSearch = /pixiv.+illust_id=([0-9]+)/.exec(url) || /pixiv.+artworks\/([0-9]+)/.exec(url)
  if (pidSearch) return 'https://pixiv.net/i/' + pidSearch[1]
  const uidSearch =
    /pixiv.+member\.php\?id=([0-9]+)/.exec(url) || /pixiv.+users\/([0-9]+)/.exec(url)
  if (uidSearch) return 'https://pixiv.net/u/' + uidSearch[1]
  return url
}
