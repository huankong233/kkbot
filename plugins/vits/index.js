export default async () => {
  // 仅限非开发模式启用
  if (!global.config.bot.debug) {
    await loadConfig('vits.jsonc', true)
    event()
    getList()
  }
}

//注册事件
async function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === 'Vits') {
        await Vits(context)
      }
    }
  })
}

import nodeFetch from 'node-fetch'
import { add, reduce } from '../pigeon/index.js'

export const Vits = async context => {
  // 检查ffmpeg
  if (!global.config.bot.ffmpeg) {
    await replyMsg(context, '缺少ffmpeg,请联系管理员')
  }

  const params = context.command.params
  if (params.length < 2) {
    return await replyMsg(context, '提供的参数不足哦')
  }

  if (!global.config.vits.speakers) {
    return await replyMsg(context, '模型数据还在准备中哦')
  } else if (global.config.vits.speakers === 'fail') {
    return await replyMsg(context, '模型数据加载失败请联系管理员')
  }

  const id = parseFloat(params[0])
  if (!global.config.vits.speakers.get(id)) {
    return await replyMsg(context, `此id不存在,可前往 ${global.config.vits.helpUrl} 查看`)
  }

  const text = CQ.unescape(params[1].trim())
  if (!text) {
    return await replyMsg(context, '你还没告诉我要说什么呢')
  }

  if (!(await reduce(context.user_id, global.config.vits.cost, `Vits生成`))) {
    return await replyMsg(context, `生成失败,鸽子不足~`, false, true)
  }

  let fail = false
  const response = await nodeFetch(`${global.config.vits.url}vits?text=${text}&id=${id}`, {
    responseType: 'arraybuffer'
  })
    .then(res => res.arrayBuffer())
    .catch(async error => {
      if (global.config.bot.debug) console.log(error)
      fail = true
    })

  if (fail) {
    await replyMsg(context, '获取语音文件失败')
    await add(context.user_id, global.config.vits.cost, `Vits生成失败`)
    return
  }

  const decoder = new TextDecoder('utf-8')
  if (decoder.decode(response).includes('500 Internal Server Error')) {
    await replyMsg(context, '获取语音文件失败,请尝试换别的模型')
    await add(context.user_id, global.config.vits.cost, `Vits生成失败`)
    return
  }

  const base64 = Buffer.from(response).toString('base64')
  await replyMsg(context, CQ.record(`base64://${base64}`))
}

export const getList = async () => {
  const { url } = global.config.vits
  let fail = false
  const data = await fetch(`${url}speakers`).catch(error => {
    if (global.config.bot.debug) console.log(error)
    fail = true
  })

  if (fail) {
    global.config.vits.speakers = 'fail'
    msgToConsole('请求speakers失败')
    return
  }

  if (!data.VITS.length) {
    console.error('[VITS] empty model list', data)
    return `Error: VITS 模型列表为空`
  }

  const voiceMap = new Map()
  data.VITS.forEach(item => {
    if (item.id) voiceMap.set(item.id, item)

    const keys = Object.keys(item)
    const id = keys.length === 1 ? Math.ceil(keys[0]) : NaN
    if (!Number.isNaN(id)) voiceMap.set(id, { id, name: item[id] })
  })

  global.config.vits.defaultVoiceId = Object.keys(data.VITS[0])[0] || ''
  global.config.vits.speakers = voiceMap
}
