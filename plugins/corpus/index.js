import { CQ } from 'go-cqwebsocket'
import { eventReg } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { reduce, add } from '../pigeon/index.js'
import { missingParams } from '../../libs/eventReg.js'

const ENUM_SCENCE = {
  a: ['private', 'group'],
  g: ['group'],
  p: ['private']
}

// 满足要求的内容
const available = {
  mode: [0, 1],
  scene: ['p', 'g', 'a']
}

export default async () => {
  await loadRules()
  event()
}

function event() {
  eventReg('message', async (event, context, tags) => {
    const { botConfig } = global.config
    const { command } = context

    if (command) {
      if (command.name === `${botConfig.botName}学习`) {
        await learn(context)
      } else if (command.name === `${botConfig.botName}忘记`) {
        await forget(context)
      }
    } else {
      await corpus(context)
    }
  })
}

function isCtxMatchScence({ message_type }, scence) {
  if (!(scence in ENUM_SCENCE)) return false
  return ENUM_SCENCE[scence].includes(message_type)
}

async function corpus(context) {
  const { message, user_id, message_type } = context
  const { corpusData } = global.data

  for (let { regexp, reply, scene } of corpusData.rules) {
    // 判断生效范围
    if (!isCtxMatchScence(context, scene)) continue

    // 执行正则判断
    const reg = new RegExp(regexp)
    const exec = reg.exec(message)
    if (!exec) continue

    reply = reply.replace(/\[CQ:at\]/g, message_type === 'private' ? '' : CQ.at(user_id))

    let msg = exec[0].replace(reg, reply)
    if (msg.length) await replyMsg(context, msg)
  }
}

async function loadRules() {
  const { corpusData } = global.data
  corpusData.rules = []
  const data = await database.select('*').from('corpus').where('hide', 0)
  data.forEach(value => {
    let obj = {
      reply: value.reply,
      scene: value.scene
    }
    if (value.mode === 0) {
      obj.regexp = value.keyword
    } else if (value.mode === 1) {
      obj.regexp = '^' + value.keyword + '$'
    }
    corpusData.rules.push(obj)
  })
}

// 学习
async function learn(context) {
  const {
    user_id,
    command: { params }
  } = context
  const { corpusConfig, botConfig } = global.config

  if (await missingParams(context, 4)) return

  if (!(await reduce({ user_id, number: corpusConfig.add, reason: '添加关键字' }))) {
    return await replyMsg(context, '鸽子不足~', { reply: true })
  }

  const messages = CQ.parse(params[0])
  let keyword, mode

  let type = null
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    if (type === null) {
      type = message._type
      type === 'text'
        ? ([keyword, mode] = [message._data.text, parseInt(params[2])])
        : ([keyword, mode] = [`[CQ:image,file=${message.file}`, 0])
    } else {
      await add({ user_id, number: corpusConfig.add, reason: '添加关键词失败' })
      return await replyMsg(context, `不能同时存在图片或文字哦~`, { reply: true })
    }
  }

  const reply = params[1]
  const scene = params[3]

  //判断参数是否合法
  if (!available.mode.includes(mode)) {
    await add({ user_id, number: corpusConfig.add, reason: '添加关键词失败' })
    return await replyMsg(
      context,
      `模式不合法,请发送"${botConfig.prefix}帮助 ${botConfig.botName}学习"查看细节`,
      { reply: true }
    )
  }

  if (!available.scene.includes(scene)) {
    await add({ user_id, number: corpusConfig.add, reason: '添加关键词失败' })
    return await replyMsg(
      context,
      `生效范围不合法,请发送"${botConfig.prefix}帮助 ${botConfig.botName}学习"查看细节`,
      { reply: true }
    )
  }

  //确保不重复
  const repeat = await database.select('*').from('corpus').where({ keyword, hide: 0 })

  if (repeat.length !== 0) {
    await add({ user_id, number: corpusConfig.add, reason: '添加关键词失败' })
    return await replyMsg(context, '这个"关键词"已经存在啦~', { reply: true })
  }

  if (await database.insert({ user_id, keyword, mode, reply, scene }).into('corpus')) {
    await loadRules()
    await replyMsg(context, `${botConfig.botName}学会啦~`, { reply: true })
  } else {
    await add({ user_id, number: corpusConfig.add, reason: '添加关键词失败' })
    await replyMsg(context, '学习失败~', { reply: true })
  }
}

//忘记
async function forget(context) {
  const {
    user_id,
    command: { params }
  } = context
  const { corpusConfig, botConfig } = global.config

  if (await missingParams(context, 1)) return

  if (!(await reduce({ user_id, number: corpusConfig.delete, reason: '删除关键词' }))) {
    return await replyMsg(context, '鸽子不足~', { reply: true })
  }

  const keyword = params[0]

  //查找是否存在这个关键字
  const data = await database.select('*').from('corpus').where({ keyword, hide: 0 }).first()

  if (!data) {
    await add({ user_id, number: corpusConfig.delete, reason: '删除关键词失败' })
    return await replyMsg(context, '这个关键词不存在哦~', { reply: true })
  }

  //判断所有者
  if (data.user_id !== user_id && botConfig.admin !== user_id) {
    await add({ user_id, number: corpusConfig.delete, reason: '删除关键词失败' })
    return await replyMsg(context, '删除失败，这不是你的词条哦', { reply: true })
  }

  if (await database('corpus').where('id', data.id).update({ hide: 1 })) {
    await loadRules()
    return await replyMsg(context, '删除成功啦~', { reply: true })
  }
}
