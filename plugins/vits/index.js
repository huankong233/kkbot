import { get } from '../../libs/fetch.js'
import { add, reduce } from '../pigeon/index.js'
import { missingParams } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { makeLogger } from '../../libs/logger.js'
import { CQ } from 'go-cqwebsocket'

const logger = makeLogger({ pluginName: 'vits' })

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

async function Vits(context) {
  const { vitsConfig } = global.config
  const { botData, vitsData } = global.data
  const {
    user_id,
    command: { params }
  } = context

  // 检查ffmpeg
  if (!botData.ffmpeg) {
    await replyMsg(context, '缺少ffmpeg,请联系管理员')
  }

  if (await missingParams(context, 2)) return

  await getList()

  const id = parseFloat(params[0])

  if (!vitsData.speakers.get(id)) {
    return await replyMsg(context, `此id不存在,可前往 ${vitsConfig.helpUrl} 查看有哪些id`)
  }

  const text = CQ.unescape(params[1])
  if (!text) {
    return await replyMsg(context, '你还没告诉我要说什么呢')
  }

  if (!(await reduce({ user_id, number: vitsConfig.cost, reason: `Vits生成` }))) {
    return await replyMsg(context, `生成失败,鸽子不足~`, false, true)
  }

  let response

  try {
    response = await get({ url: `${vitsConfig.url}/vits?text=${text}&id=${id}` }).then(res =>
      res.arrayBuffer()
    )
  } catch (error) {
    await replyMsg(context, '获取语音文件失败')
    await add({ user_id, number: vitsConfig.cost, reason: `Vits生成失败` })
    logger.WARNING('获取语音文件失败')
    logger.ERROR(error)
    return
  }

  const decoder = new TextDecoder('utf-8')
  const resTxt = decoder.decode(response)

  if (resTxt.includes('500')) {
    await replyMsg(context, '模型未适配，请使用其他模型')
    await add({ user_id, number: vitsConfig.cost, reason: `Vits生成失败` })
    return
  } else if (resTxt.includes('404')) {
    await replyMsg(context, '模型不存在，请使用其他模型')
    await add({ user_id, number: vitsConfig.cost, reason: `Vits生成失败` })
    return
  }

  const base64 = Buffer.from(response).toString('base64')
  await replyMsg(context, CQ.record(`base64://${base64}`))
}

async function getList() {
  const { vitsData } = global.data
  const { vitsConfig } = global.config

  if (vitsData.speakers) return

  const data = await get({ url: `${vitsConfig.url}/speakers` }).then(res => res.json())

  if (!data) {
    vitsData.speakers = 'fail'
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

  vitsData.speakers = voiceMap
}
