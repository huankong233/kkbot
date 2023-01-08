export default async () => {
  loadConfig('corpus.jsonc', true)
  await loadRules()

  event()
}

import emoji from 'node-emoji'

function event() {
  RegEvent('message', async (event, context, tags) => {
    context.message = emoji.unemojify(context.message)
    corpus(context)
    if (context.command) {
      if (context.command.name === global.config.bot.botName + '学习') {
        await learn(context, context.command.params)
      } else if (context.command.name === global.config.bot.botName + '忘记') {
        await forget(context, context.command.params)
      }
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

function corpus(ctx) {
  const rules = global.config.corpus.data
  let stop = false

  for (let { regexp, reply, scene } of rules) {
    if ([regexp, reply, scene].some(v => !(typeof v === 'string' && v.length))) continue
    if (!isCtxMatchScence(ctx, scene)) continue

    const reg = new RegExp(regexp)
    const exec = reg.exec(ctx.message)
    if (!exec) continue

    stop = true
    reply = reply.replace(/\[CQ:at\]/g, ctx.message_type === 'private' ? '' : CQ.at(ctx.user_id))

    let replyMsg = exec[0].replace(reg, reply)
    replyMsg = emoji.emojify(replyMsg, name => name)
    if (replyMsg.length) global.replyMsg(ctx, replyMsg)
    break
  }

  return stop
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

const available = {
  mode: [0, 1],
  scene: ['p', 'g', 'a']
}

// 学习
async function learn(context, params) {
  if (!(await reduce(context.user_id, global.config.corpus.add, '添加关键字'))) {
    return await replyMsg(context, '鸽子不足~')
  }

  if (params.length !== 4) {
    return await replyMsg(context, '参数错误~请查看帮助')
  }

  const user_id = context.user_id
  const keyword = emoji.unemojify(params[0])
  const mode = parseInt(params[1])
  const reply = emoji.unemojify(params[2])
  const scene = params[3]

  //判断参数是否合法
  if (!available.mode.includes(mode)) {
    return await replyMsg(context, '参数错误~模式不合法')
  }
  if (!available.scene.includes(scene)) {
    return await replyMsg(context, '参数错误~生效范围不合法')
  }

  //确保不重复
  const repeat = await database.select().from('corpus').where({ keyword: keyword, hide: 0 })
  if (repeat.length !== 0) {
    return await replyMsg(context, '这个"触发词"已经存在啦~')
  }
  if (await database.insert({ user_id, keyword, mode, reply, scene }).into('corpus')) {
    await loadRules()
    await replyMsg(context, `${global.config.bot.botName}学会啦~`)
  } else {
    await replyMsg(context, '学习失败~')
    await add(context.user_id, global.config.corpus.add, '添加关键字')
  }
}

//忘记
async function forget(context, params) {
  if (!(await reduce(context.user_id, global.config.corpus.delete, '删除关键字'))) {
    return await replyMsg(context, '鸽子不足~')
  }

  if (params.length !== 1) {
    return await replyMsg(context, '参数错误~请查看帮助')
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
    loadRules()
    return await replyMsg(context, '删除成功啦~')
  }
  return await replyMsg(context, '删除失败，数据库侧')
}
