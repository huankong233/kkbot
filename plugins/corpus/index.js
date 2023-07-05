export default async () => {
  await loadRules()

  event()
}

import * as emoji from 'node-emoji'
import { eventReg } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    const { bot } = global.config
    context.message = emoji.unemojify(context.message)

    if (context.command) {
      if (context.command.name === `${bot.botName}学习`) {
        await learn(context, context.command.params)
      } else if (context.command.name === `${bot.botName}忘记`) {
        await forget(context, context.command.params)
      }
    } else {
      await corpus(context)
    }
  })
}

const ENUM_SCENCE = {
  a: ['private', 'group'],
  g: ['group'],
  p: ['private']
}

const isCtxMatchScence = ({ message_type }, scence) => {
  if (!(scence in ENUM_SCENCE)) return false
  return ENUM_SCENCE[scence].includes(message_type)
}

export const corpus = async context => {
  const rules = global.config.corpus.data
  for (let { regexp, reply, scene } of rules) {
    // 判断生效范围
    if (!isCtxMatchScence(context, scene)) continue

    // 执行正则判断
    const reg = new RegExp(regexp)
    const exec = reg.exec(context.message)
    if (!exec) continue

    reply = reply.replace(
      /\[CQ:at\]/g,
      context.message_type === 'private' ? '' : CQ.at(context.user_id)
    )

    let msg = exec[0].replace(reg, reply)
    msg = emoji.emojify(msg, name => name)
    if (msg.length) await replyMsg(context, msg)
  }
}

export const loadRules = async () => {
  global.config.corpus.data = []
  const data = await database.select().from('corpus').where('hide', 0)
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
    global.config.corpus.data.push(obj)
  })
}

import { reduce, add } from '../pigeon/index.js'

// 满足要求的内容
const available = {
  mode: [0, 1],
  scene: ['p', 'g', 'a']
}

// 学习
import { missingParams } from '../../libs/eventReg.js'
export const learn = async (context, params) => {
  const { user_id } = context
  const { corpus, bot } = global.config

  if (await missingParams(context, params, 4)) return

  if (!(await reduce({ user_id, number: corpus.add, reason: '添加关键字' }))) {
    return await replyMsg(context, '鸽子不足~')
  }

  const messages = CQ.parse(params[0].trim())
  let keyword, mode

  let type = null
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    if (type === null) {
      type = message._type
      type === 'text'
        ? ([keyword, mode] = [emoji.unemojify(message._data.text), parseInt(params[1].trim())])
        : ([keyword, mode] = [`[CQ:image,file=${message.file}`, 0])
    } else {
      return await replyMsg(context, `不能同时存在图片或文字哦~`)
    }
  }

  const reply = emoji.unemojify(params[2].trim())
  const scene = params[3].trim()

  //判断参数是否合法
  if (!available.mode.includes(mode)) {
    return await replyMsg(
      context,
      `模式不合法,请发送"${bot.prefix}帮助 ${bot.botName}学习"查看细节`
    )
  }

  if (!available.scene.includes(scene)) {
    return await replyMsg(
      context,
      `生效范围不合法,请发送"${bot.prefix}帮助 ${bot.botName}学习"查看细节`
    )
  }

  //确保不重复
  const repeat = await database.select().from('corpus').where({ keyword, hide: 0 })
  if (repeat.length !== 0) {
    return await replyMsg(context, '这个"触发词"已经存在啦~')
  }

  if (await database.insert({ user_id, keyword, mode, reply, scene }).into('corpus')) {
    await loadRules()
    await replyMsg(context, `${bot.botName}学会啦~`)
  } else {
    await replyMsg(context, '学习失败~')
    await add({ user_id, number: corpus.add, reason: '添加关键字' })
  }
}

//忘记
export const forget = async (context, params) => {
  const { user_id } = context
  const { corpus } = global.config

  if (await missingParams(context, params, 1)) return

  if (!(await reduce({ user_id, number: corpus.delete, reason: '删除关键字' }))) {
    return await replyMsg(context, '鸽子不足~')
  }

  const keyword = emoji.unemojify(params[0])

  //查找是否存在这个关键字
  const data = (await database.select().from('corpus').where({ keyword: keyword, hide: 0 }))[0]
  if (!data) {
    return await replyMsg(context, '这个关键词不存在哦~')
  }

  //判断所有者
  if (data.user_id !== context.user_id && context.user_id !== global.config.bot.admin) {
    return await replyMsg(context, '删除失败，这不是你的词条哦')
  }

  if (await database('corpus').where('id', data.id).update({ hide: 1 })) {
    await loadRules()
    return await replyMsg(context, '删除成功啦~')
  }
}
