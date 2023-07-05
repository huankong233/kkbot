export default async () => {
  event()
}

//注册事件
import { eventReg } from '../../libs/eventReg.js'
function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === 'Vits') {
        await Vits(context)
      }
    }
  })
}

import nodeFetch from 'node-fetch'
import { add, reduce } from '../pigeon/index.js'
import { missingParams } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'

export const Vits = async context => {
  // 检查ffmpeg
  if (!global.config.bot.ffmpeg) {
    await replyMsg(context, '缺少ffmpeg,请联系管理员')
  }

  const params = context.command.params

  if (await missingParams(context, params, 2)) return

  await getList()

  const id = parseFloat(params[0])

  console.log(global.config.vits.speakers.get(id))

  if (!global.config.vits.speakers.get(id)) {
    return await replyMsg(context, `此id不存在,可前往 ${global.config.vits.helpUrl} 查看`)
  }

  const text = CQ.unescape(params[1].trim())
  if (!text) {
    return await replyMsg(context, '你还没告诉我要说什么呢')
  }

  if (
    !(await reduce({
      user_id: context.user_id,
      number: global.config.vits.cost,
      reason: `Vits生成`
    }))
  ) {
    return await replyMsg(context, `生成失败,鸽子不足~`, false, true)
  }

  let fail = false
  const response = await nodeFetch(`${global.config.vits.url}/vits?text=${text}&id=${id}`, {
    responseType: 'arraybuffer'
  })
    .then(res => res.arrayBuffer())
    .catch(async error => {
      if (global.config.bot.debug) console.log(error)
      fail = true
    })

  if (fail) {
    await replyMsg(context, '获取语音文件失败')
    await add({ user_id: context.user_id, number: global.config.vits.cost, reason: `Vits生成失败` })
    return
  }

  const decoder = new TextDecoder('utf-8')
  const resTxt = decoder.decode(response)

  console.log(resTxt)

  if (resTxt.includes('500')) {
    await replyMsg(context, '模型未适配，请使用其他模型')
    await add({ user_id: context.user_id, number: global.config.vits.cost, reason: `Vits生成失败` })
    return
  } else if (resTxt.includes('404')) {
    await replyMsg(context, '模型不存在，请使用其他模型')
    await add({ user_id: context.user_id, number: global.config.vits.cost, reason: `Vits生成失败` })
    return
  }

  const base64 = Buffer.from(response).toString('base64')
  await replyMsg(context, CQ.record(`base64://${base64}`))
}

import { get } from '../../libs/fetch.js'
import logger from '../../libs/logger.js'
export const getList = async () => {
  if (global.config.vits.speakers) return

  const { url } = global.config.vits

  const data = await get({ url: `${url}/speakers` }).then(res => res.json())

  if (!data) {
    global.config.vits.speakers = 'fail'
    logger.WARNING('请求speakers失败')
    return
  }

  if (!data.VITS.length) {
    logger.WARNING('[VITS] empty model list', data)
    return
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
