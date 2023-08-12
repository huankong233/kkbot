export default () => {
  event()
}

import { eventReg } from '../../libs/eventReg.js'

//注册事件
function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === 'BT搜索') {
        await init(context)
      }
    }
  })
}

import { add, reduce } from '../pigeon/index.js'
import { replyMsg, sendForwardMsg } from '../../libs/sendMsg.js'
import { missingParams } from '../../libs/eventReg.js'

//启动函数
async function init(context) {
  const {
    user_id,
    command: { params }
  } = context
  const { btSearch, bot } = global.config

  if (!(await reduce({ user_id, number: btSearch.cost, reason: `BT搜索` }))) {
    return await replyMsg(context, `搜索失败,鸽子不足~`, { reply: true })
  }

  if (await missingParams(context, params, 1)) return

  const keyword = params[0]
  const page = params[1] ?? 1

  const data = await search(keyword, page)

  if (data === '获取信息失败') {
    await replyMsg(context, '获取信息失败', { reply: true })
    await add({ user_id, number: btSearch.cost, reason: `BT搜索失败` })
  } else if (data === '没有搜索结果') {
    await replyMsg(context, '没有搜索结果', { reply: true })
    await add({ user_id, number: btSearch.cost, reason: `BT搜索没有搜索结果` })
  } else {
    let messages = [
      CQ.node(
        bot.info.nickname,
        bot.info.user_id,
        data.lastPage === '获取信息失败'
          ? '获取失败'
          : [
              `共${data.lastPage}页`,
              `可使用命令"${bot.prefix}BT搜索 ${keyword} 指定页数"来进行翻页`
            ].join('\n')
      )
    ]

    if (data.data.length === 0) {
      messages.push(CQ.node(bot.info.nickname, bot.info.user_id, `没有匹配内容`))
    } else {
      data.data.forEach(datum => {
        messages.push(
          CQ.node(
            bot.info.nickname,
            bot.info.user_id,
            [
              `文件名:${datum.title}`,
              `文件类型:${datum.type}`,
              `创建时间:${datum.createTime}`,
              `文件大小:${datum.fileSize}`,
              `文件热度:${datum.hot}`,
              `文件链接:${datum.href}`
            ].join('\n')
          )
        )
      })

      const status = await sendForwardMsg(context, messages, false)
      if (status.status === 'failed') {
        await replyMsg(context, '发送合并消息失败，可以尝试私聊我哦~(鸽子已返还)', { reply: true })
        await add({ user_id, number: btSearch.cost, reason: `BT搜索_合并消息发送失败赔偿` })
      }
    }
  }
}

import { get } from '../../libs/fetch.js'
//搜索
async function search(keyword, page) {
  const { btSearch } = global.config

  let html

  try {
    html = await get({ url: `${btSearch.site}/s/${keyword}_rel_${page}.html` }).then(res =>
      res.text()
    )
  } catch (error) {
    logger.WARNING(`BT搜索请求接口失败`)
    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
    return '获取信息失败'
  }

  const data = parse(html)

  if (data.length === 0) {
    return '没有搜索结果'
  } else {
    for (let i = 0; i < data.length; i++) {
      data[i].href = await getDownloadLink(data[i].href)
    }
    return { data, lastPage: getLastPage(html) }
  }
}

import * as cheerio from 'cheerio'
import _ from 'lodash'
import logger from '../../libs/logger.js'
//获取页面详细
function parse(html) {
  const $ = cheerio.load(html, { decodeEntities: true })
  return _.map($('.search-item'), item => {
    item = $(item)
    if (item.text() === '没有找到记录！') {
      return undefined
    } else {
      const list = item.find('span b')
      const a = item.find('a')
      return {
        title: a.text() ?? '空',
        type: item.find('.fileType1').text() ?? '空',
        createTime: list.eq(0).text() ?? '空',
        fileSize: list.eq(1).text() ?? '空',
        hot: list.eq(2).text() ?? '空',
        href: a.attr('href') ?? '空'
      }
    }
  }).filter(v => v !== undefined)
}

//获取总页数
function getLastPage(html) {
  const $ = cheerio.load(html, { decodeEntities: true })
  const last = $('.last_p').html()
  if (last) {
    return last.match('_rel_(.*).html')[1]
  } else {
    //获取失败，判断有几条数据
    const count = $('.search-statu', html).text()
    const number = parseInt(count.match('大约(.*)条结果')[1])
    if (count) {
      if (number === 0) {
        return '没有数据'
      } else if (number <= 10) {
        return '1'
      } else {
        return parseInt(number / 10).toString()
      }
    } else {
      return '获取信息失败'
    }
  }
}

//获取磁力地址
async function getDownloadLink(href) {
  let data

  try {
    data = await get({ url: global.config.btSearch.site + href }).then(res => res.text())
  } catch (error) {
    logger.WARNING('获取磁力地址失败')

    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
    return '获取信息失败'
  }

  const $ = cheerio.load(data, { decodeEntities: true })
  const link = $('#down-url', data).attr('href')
  return link ?? '获取信息失败'
}
