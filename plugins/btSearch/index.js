import { CQ } from 'go-cqwebsocket'
import { eventReg } from '../../libs/eventReg.js'
import { add, reduce } from '../pigeon/index.js'
import { replyMsg, sendForwardMsg } from '../../libs/sendMsg.js'
import { missingParams } from '../../libs/eventReg.js'
import { get } from '../../libs/fetch.js'
import { makeLogger } from '../../libs/logger.js'
import * as cheerio from 'cheerio'
import _ from 'lodash'

const logger = makeLogger({ pluginName: 'btSearch' })

export default () => {
  event()
}

//注册事件
function event() {
  eventReg('message', async (event, context, tags) => {
    const { command } = context
    if (command) {
      if (command.name === 'BT搜索' || command.name === 'bt搜索' || command.name === 'Bt搜索') {
        await search(context)
      }
    }
  })
}

//启动函数
async function search(context) {
  const {
    user_id,
    command: { params }
  } = context
  const { btSearchConfig } = global.config

  if (!(await reduce({ user_id, number: btSearchConfig.cost, reason: `BT搜索` }))) {
    return await replyMsg(context, `搜索失败,鸽子不足~`, { reply: true })
  }

  if (await missingParams(context, 1)) return

  const keyword = params[0]
  const page = params[1] ?? 1

  try {
    const html = await getInfo(keyword, page)
    const data = parse(html)
    const messages = makeMessages(data, page, keyword)
    let response
    if (messages === '没有搜索结果') {
      response = await replyMsg(context, messages)
    } else {
      response = await sendForwardMsg(context, messages)
    }
    if (response.status === 'failed') {
      await replyMsg(context, '发送失败,请尝试私聊', {
        reply: true
      })
      await add({ user_id, number: btSearchConfig.cost, reason: 'BT搜索失败' })
    }
  } catch (error) {
    logger.WARNING('获取信息失败')
    logger.ERROR(error)
    await replyMsg(context, '获取信息失败', { reply: true })
    await add({ user_id, number: btSearchConfig.cost, reason: `BT搜索失败` })
  }
}

async function getInfo(keyword, page) {
  const { btSearchConfig } = global.config
  const url = `${btSearchConfig.site}/search/${keyword}/${page}`
  return await get({ url }).then(res => res.text())
}

function parse(html) {
  const $ = cheerio.load(html, { decodeEntities: true })
  const lastPage = $('.pagination a').eq(-2).html() ?? 1
  const data = $('#archiveResult').text().includes('No result')
    ? '没有搜索结果'
    : _.map($('#archiveResult tr'), (item, index) => {
        if (index === 0) return
        return {
          name: $(item).find('td:nth-child(1)').text() ?? '空',
          size: $(item).find('td:nth-child(2)').text() ?? '空',
          date: $(item).find('td:nth-child(3)').text() ?? '空',
          seed:
            $(item)
              .find('td:nth-child(4) a:nth-child(2)')
              .attr('href')
              .match(/magnet:\?xt=urn:btih:[A-Z0-9]{40}/)[0] ?? '空'
        }
      }).filter(v => v !== undefined)

  return {
    lastPage,
    data
  }
}

function makeMessages(info, nowPage, keyword) {
  const { lastPage, data } = info
  const { botConfig } = global.config
  const { botData } = global.data
  if (data === '没有搜索结果') {
    return data
  } else {
    let messages = [
      CQ.node(
        botData.info.nickname,
        botData.info.user_id,
        [
          `现在是第 ${nowPage} 页 共有 ${lastPage} 页`,
          `可使用命令"${botConfig.prefix}BT搜索 ${keyword} 指定页数"来进行翻页`
        ].join('\n')
      )
    ]

    data.forEach(datum => {
      messages.push(
        CQ.node(
          botData.info.nickname,
          botData.info.user_id,
          [
            `文件名: ${datum.name}`,
            `创建时间: ${datum.date}`,
            `文件大小: ${datum.size}`,
            `文件链接: ${datum.seed}`
          ].join('\n')
        )
      )
    })

    return messages
  }
}
