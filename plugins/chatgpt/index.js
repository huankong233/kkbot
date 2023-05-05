export default () => {
  loadConfig('chatgpt.jsonc', true)

  //注册事件
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.message.indexOf(`[CQ:at,qq=${context.self_id}]`) !== -1) {
      // 初始化数据
      let params = context.message
        .trim()
        .split(' ')
        .filter(value => {
          return value === '' ? false : value
        })
      context.params = params.slice(1, params.length)
      await chat(context)
    }

    if (context.command) {
      if (context.command.name === 'chatgpt') {
        await chat(context)
      }
    }
  })
}

import { add, reduce } from '../pigeon/index.js'
import fetch from 'node-fetch'

async function chat(context) {
  if (!context.params[0]) {
    return await replyMsg(context, `请求失败,请提供prompt~`, true)
  }

  if (!(await reduce(context.user_id, global.config.chatgpt.cost, `chatgpt`))) {
    return await replyMsg(context, `请求失败,鸽子不足~`, true)
  }

  let params = {}
  if (global.config.chatgpt.basicAuth.enable) {
    params['headers'] = {
      Authorization: `Basic ${Buffer.from(
        `${global.config.chatgpt.basicAuth.username}:${global.config.chatgpt.basicAuth.password}`
      ).toString('base64')}`
    }
  }

  let response
  try {
    response = await fetch(
      `${global.config.chatgpt.url}/ask?prompt=${global.config.chatgpt.basicPrompt}${context.params[0]}`,
      params
    ).then(res => res.text())
  } catch (error) {
    console.log(error)
    await add(context.user_id, global.config.searchBt.cost, `chatgpt失败`)
    return await replyMsg(context, `请求失败,鸽子已返还~`, true)
  }

  if (response === '401 Unauthorized') {
    await add(context.user_id, global.config.searchBt.cost, `chatgpt失败`)
    return await replyMsg(context, `请求失败,鉴权失败请联系机器人管理员,鸽子已返还~`, true)
  }

  return await replyMsg(context, response)
}
