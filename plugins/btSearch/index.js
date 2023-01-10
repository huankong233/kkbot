export default () => {
  loadConfig('searchBt.jsonc', true)

  //注册事件
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === 'BT搜索') {
        await init(context)
      }
    }
  })
}

import { add, reduce } from '../pigeon/index.js'
//启动函数
export const init = async context => {
  if (!(await reduce(context.user_id, global.config.searchBt.cost, `BT搜索`))) {
    return await replyMsg(context, `搜索失败,鸽子不足~`, true)
  }

  const keyword = context.command.params[0]
  if (!keyword) {
    return replyMsg(context, '请指定关键词')
  }
  const page = context.command.params[1] ? context.command.params[1] : 1
  const data = await search(keyword, page)
  if (data === '获取失败') {
    await replyMsg(context, '获取信息失败')
    await add(context.user_id, global.config.searchBt.cost, `BT搜索失败`)
  }
  let messages = [
    CQ.node(
      global.config.bot.botName,
      context.self_id,
      data.lastPage === '获取失败或只有一页'
        ? data.lastPage
        : [
            `共${data.lastPage}页`,
            `可使用命令"${global.config.bot.prefix}BT搜索 ${keyword} 指定页数"来进行翻页`
          ].join('\n')
    )
  ]
  data.data.forEach(datum => {
    messages.push(
      CQ.node(
        global.config.bot.botName,
        context.self_id,
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

  const status = await send_forward_msg(context, messages)
  if (status.status === 'failed') {
    await replyMsg(context, '发送合并消息失败，可以尝试私聊我哦~(鸽子已返还)')
    await add(context.user_id, global.config.searchBt.cost, `BT搜索_合并消息发送失败赔偿`)
  }
}

import fetch from 'node-fetch'
//搜索
export const search = async (keyword, page, count = 1) => {
  const url = `${global.config.searchBt.site}/s/${keyword}_rel_${page}.html`
  try {
    const html = await fetch(url).then(res => res.text())
    const data = parse(html)
    for (let i = 0; i < data.length; i++) {
      data[i].href = await getDownloadLink(data[i].href)
    }
    return { data, lastPage: getLastPage(html) }
  } catch (error) {
    console.log(error)
    count++
    if (count <= global.config.searchBt.try) {
      return await search(keyword, page, count)
    } else {
      return '获取失败'
    }
  }
}

import * as cheerio from 'cheerio'
import _ from 'lodash'
//获取页面详细
export const parse = html => {
  const $ = cheerio.load(html, { decodeEntities: true })
  return _.map($('.search-item'), item => {
    const list = $('span b', item)
    const a = $('a', item)
    return {
      title: a.text(),
      type: $('.fileType1', item).text(),
      createTime: list.eq(0).text(),
      fileSize: list.eq(1).text(),
      hot: list.eq(2).text(),
      href: a.attr('href')
    }
  }).filter(v => v !== undefined)
}

//获取总页数
export const getLastPage = html => {
  const $ = cheerio.load(html, { decodeEntities: true })
  const last = $('.last_p', html).html()
  return last ? last.match('_rel_(.*).html')[1] : '获取失败或只有一页'
}

//获取磁力地址
export const getDownloadLink = async (href, count = 1) => {
  try {
    const data = await fetch(global.config.searchBt.site + href).then(res => res.text())
    const $ = cheerio.load(data, { decodeEntities: true })
    const link = $('#down-url', data).attr('href')
    return link ? link : '获取失败'
  } catch (error) {
    count++
    if (count <= global.config.searchBt.try) {
      return await getDownloadLink(href, count)
    } else {
      return '获取失败'
    }
  }
}
