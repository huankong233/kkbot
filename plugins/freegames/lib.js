/**
 * 代码魔改于:
 * https://github.com/DIYgod/RSSHub/blob/master/lib/v2/epicgames/index.js
 */

import dayjs from 'dayjs'
import { get } from '../../libs/fetch.js'
export const epicApi = async () => {
  const locale = 'zh-CN'
  const country = 'CN'

  const rootUrl = 'https://store.epicgames.com'
  const apiUrl = `https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=${locale}&country=${country}&allowCountries=${country}`
  const contentBaseUrl = `https://store-content-ipv4.ak.epicgames.com/api/${locale}/content`

  const response = await get({ url: apiUrl }).then(res => res.json())

  const now = dayjs()

  const items = response.data.Catalog.searchStore.elements
    .filter(
      item =>
        item.promotions &&
        item.promotions.promotionalOffers &&
        item.promotions.promotionalOffers[0] &&
        dayjs(item.promotions.promotionalOffers[0].promotionalOffers[0].startDate) <= now &&
        dayjs(item.promotions.promotionalOffers[0].promotionalOffers[0].endDate) > now
    )
    .map(async item => {
      let link = `${rootUrl}/${locale}/p/`
      let contentUrl = `${contentBaseUrl}/products/`
      let isBundles = false
      item.categories.some(category => {
        if (category.path === 'bundles') {
          link = `${rootUrl}/${locale}/bundles/`
          isBundles = true
          contentUrl = `${contentBaseUrl}/bundles/`
          return true
        }
        return false
      })
      const linkSlug =
        item.catalogNs.mappings.length > 0
          ? item.catalogNs.mappings[0].pageSlug
          : item.offerMappings.length > 0
          ? item.offerMappings[0].pageSlug
          : item.productSlug
          ? item.productSlug
          : item.urlSlug
      link += linkSlug
      contentUrl += linkSlug
      let description = item.description
      if (item.offerType !== 'BASE_GAME') {
        const contentResp = await get({
          url: contentUrl
        }).then(res => res.json())

        description = isBundles
          ? contentResp.data.about.shortDescription
          : contentResp.pages[0].data.about.shortDescription
      }

      let image = item.keyImages[0].url
      item.keyImages.some(keyImage => {
        if (keyImage.type === 'DieselStoreFrontWide') {
          image = keyImage.url
          return true
        }
        return false
      })
      return {
        title: item.title,
        author: item.seller.name,
        link,
        description: {
          description,
          image
        },
        pubDate: dayjs(item.promotions.promotionalOffers[0].promotionalOffers[0].startDate).format(
          'YYYY年MM月DD号'
        )
      }
    })
  return await Promise.all(items)
}

import * as cheerio from 'cheerio'
import _ from 'lodash'
export const steamApi = async () => {
  const html = await get(
    {
      url: 'https://store.steampowered.com/search',
      data: {
        maxprice: 'free',
        supportedlang: 'schinese',
        specials: 1
      }
    },
    10
  ).then(res => res.text())

  const $ = cheerio.load(html, { decodeEntities: true })
  return _.map($('#search_resultsRows a'), item => {
    item = $(item)
    const info = item.find('.responsive_search_name_combined')
    const id = item.attr('data-ds-appid')
    const releasedTime = dayjs(item.find('.search_released').text()).format('YYYY年MM月DD日')

    return {
      id,
      url: `https://store.steampowered.com/app/${id}`,
      img: item.find('.search_capsule img').attr('src'),
      title: info.find('.search_name .title', item).text(),
      releasedTime
    }
  })
}
