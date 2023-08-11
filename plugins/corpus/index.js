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
      const { name } = context.command

      if (name === `${bot.botName}学习`) {
        await learn(context)
      } else if (name === `${bot.botName}忘记`) {
        await forget(context)
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

function isCtxMatchScence({ message_type }, scence) {
  if (!(scence in ENUM_SCENCE)) return false
  return ENUM_SCENCE[scence].includes(message_type)
}

async function corpus(context) {
  const { message, user_id, message_type } = context
  const { corpus } = global.config

  for (let { regexp, reply, scene } of corpus.data) {
    // 判断生效范围
    if (!isCtxMatchScence(context, scene)) continue

    // 执行正则判断
    const reg = new RegExp(regexp)
    const exec = reg.exec(message)
    if (!exec) continue

    reply = reply.replace(/\[CQ:at\]/g, message_type === 'private' ? '' : CQ.at(user_id))

    let msg = exec[0].replace(reg, reply)
    msg = emoji.emojify(msg, name => name)
    if (msg.length) await replyMsg(context, msg)
  }
}

async function loadRules() {
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
async function learn(context) {
  const {
    user_id,
    command: { params }
  } = context
  const { corpus, bot } = global.config

  if (await missingParams(context, params, 4)) return

  if (!(await reduce({ user_id, number: corpus.add, reason: '添加关键字' }))) {
    return await replyMsg(context, '鸽子不足~', { reply: true })
  }

  const messages = CQ.parse(params[0].trim())
  let keyword, mode

  let type = null
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    if (type === null) {
      type = message._type
      type === 'text'
        ? ([keyword, mode] = [message._data.text, parseInt(params[2].trim())])
        : ([keyword, mode] = [`[CQ:image,file=${message.file}`, 0])
    } else {
      return await replyMsg(context, `不能同时存在图片或文字哦~`, { reply: true })
    }
  }

  const reply = params[1].trim()
  const scene = params[3].trim()

  //判断参数是否合法
  if (!available.mode.includes(mode)) {
    return await replyMsg(
      context,
      `模式不合法,请发送"${bot.prefix}帮助 ${bot.botName}学习"查看细节`,
      { reply: true }
    )
  }

  if (!available.scene.includes(scene)) {
    return await replyMsg(
      context,
      `生效范围不合法,请发送"${bot.prefix}帮助 ${bot.botName}学习"查看细节`,
      { reply: true }
    )
  }

  //确保不重复
  const repeat = await database.select().from('corpus').where({ keyword, hide: 0 })
  if (repeat.length !== 0) {
    return await replyMsg(context, '这个"关键词"已经存在啦~', { reply: true })
  }

  if (await database.insert({ user_id, keyword, mode, reply, scene }).into('corpus')) {
    await loadRules()
    await replyMsg(context, `${bot.botName}学会啦~`, { reply: true })
  } else {
    await add({ user_id, number: corpus.add, reason: '添加关键词' })
    await replyMsg(context, '学习失败~', { reply: true })
  }
}

//忘记
async function forget(context) {
  const {
    command: { params },
    user_id
  } = context
  const { corpus, bot } = global.config

  if (await missingParams(context, params, 1)) return

  if (!(await reduce({ user_id, number: corpus.delete, reason: '删除关键词' }))) {
    return await replyMsg(context, '鸽子不足~', { reply: true })
  }

  const keyword = params[0]

  //查找是否存在这个关键字
  const data = (await database.select().from('corpus').where({ keyword: keyword, hide: 0 }))[0]

  if (!data) {
    return await replyMsg(context, '这个关键词不存在哦~', { reply: true })
  }

  //判断所有者
  if (data.user_id !== user_id && bot.admin !== user_id) {
    return await replyMsg(context, '删除失败，这不是你的词条哦', { reply: true })
  }

  if (await database('corpus').where('id', data.id).update({ hide: 1 })) {
    await loadRules()
    return await replyMsg(context, '删除成功啦~', { reply: true })
  }
}
