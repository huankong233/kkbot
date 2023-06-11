export const enable = false

export default () => {
  loadConfig('chatgpt.jsonc', true)

  //注册事件
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (global.config.chatgpt.private && context.message_type === 'private') {
      await chat(context, 1)
    }

    const index = context.message.indexOf(`[CQ:at,qq=${context.self_id}]`)

    if (index !== -1) {
      await chat(context, 2, index + `[CQ:at,qq=${context.self_id}]`.length + 1)
    }

    if (context.command) {
      if (context.command.name === 'gpt') {
        await chat(context, 3)
      }
    }
  })
}

import { add, reduce } from '../../../plugins/pigeon/index.js'
import fetch from 'node-fetch'

async function chat(context, type, index) {
  let prompt = getPrompt(context.message, type, index)

  if (!prompt) {
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
      `${global.config.chatgpt.url}/ask?prompt=${global.config.chatgpt.basicPrompt}${prompt}`,
      params
    ).then(res => res.text())
  } catch (error) {
    console.log(error)
    await add(context.user_id, global.config.searchBt.cost, `chatgpt失败`)
    return await replyMsg(context, `请求失败,鸽子已返还~`, true)
  }

  if (response === '401 Unauthorized') {
    await add(context.user_id, global.config.searchBt.cost, `chatgpt失败`)
    return await replyMsg(context, `请求失败,鉴权失败请联系管理员,鸽子已返还~`, true)
  }

  return await replyMsg(context, response)
}

// 提取prompt
function getPrompt(message, type, index) {
  switch (type) {
    case 1:
      return message
      break
    case 2:
      return message.substring(index, message.length)
      break
    case 3:
      const type3Index = message.indexOf(`chatgpt`)
      return message.substring(type3Index + 8, message.length)
      break
  }
}
