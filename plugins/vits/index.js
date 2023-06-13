export const enable = false

export default async () => {
  await loadConfig('vits.jsonc', true)

  event()

  getList()
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
  if (global.config.vits.speakers.get(id)) {
    return await replyMsg(
      context,
      '此id不存在,可前往 https://huggingface.co/spaces/Artrajz/vits-simple-api 查看'
    )
  }

  const text = CQ.unescape(params[1].trim())
  if (!text) {
    return await replyMsg(context, '你还没告诉我要说什么呢')
  }

  let fail = false
  const response = await nodeFetch(`${global.config.vits.url}vits?text=${text}&id=${id}`, {
    responseType: 'arraybuffer'
  })
    .then(res => res.arraybuffer())
    .catch(async error => (fail = true))

  //TODO: 判断语言是否可用
  //困惑: 不支持的语言一样可以生成，但是不清楚是否生成正确

  if (!fail) {
    const base64 = Buffer.from(data).toString('base64')
    await replyMsg(context, CQ.record(`base64://${base64}`))
  } else {
    await replyMsg(context, '获取语音文件失败')
  }
}

export const getList = async () => {
  const { url } = global.config.vits
  let fail = false
  const data = await fetch(`${url}speakers`).catch(error => (fail = true))

  if (fail) {
    global.config.vits.speakers = 'fail'
    msgToConsole('请求speakers失败')
  } else {
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
}
