import { eventReg, haveAt } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'

export default () => {
  event()
}

function event() {
  //判断用户是否注册过了
  eventReg(
    'message',
    async (event, context, tags) => {
      const { user_id } = context

      const at = haveAt(context)
      const haveAccount = !(await getUserData(user_id))
      const isCommand = context.command && haveAccount && context.command.name.search('咕咕') === -1
      const isPrivate = context.message_type === 'private' && !context.command && haveAccount
      const isAt = at && haveAccount

      if (isCommand || isAt || isPrivate) {
        await replyMsg(context, `请先使用"${global.config.bot.prefix}咕咕"注册账户`)
        return 'quit'
      }
    },
    101
  )
}

/**
 * 获取用户信息
 * @param {Object} context
 * @returns false:新用户
 * @returns data:不是新用户
 */
export const getUserData = async user_id => {
  const data = await database.select().from('pigeon').where('user_id', user_id)
  return data.length > 0 ? data : false
}

/**
 * 增加鸽子
 * @param {Object} params
 * @returns true 成功
 * @returns false 失败
 */
export const add = async ({ number, reason, extra, user_id }) => {
  //不允许增加负数的鸽子
  if (number < 0) {
    return false
  }

  //获取拥有的鸽子数
  let origin_pigeon = (await getUserData(user_id))[0].pigeon_num
  let now_pigeon = origin_pigeon + number
  //更新数据库
  await database
    .update({
      pigeon_num: now_pigeon,
      ...extra
    })
    .from('pigeon')
    .where('user_id', user_id)
  //插入历史记录
  await database
    .insert({
      user_id,
      operation: number,
      origin_pigeon,
      now_pigeon,
      update_time: Date.now(),
      reason: reason ?? '没有指定原因'
    })
    .into('pigeon_history')

  return true
}

/**
 * 减少鸽子
 * @param {Object} params
 * @returns true 成功
 * @returns false 失败
 */
export const reduce = async ({ number, reason, extra, user_id }) => {
  //不允许减少负数的鸽子
  if (number < 0) {
    return false
  }

  //获取拥有的鸽子数
  let origin_pigeon = (await getUserData(user_id))[0].pigeon_num
  let now_pigeon = origin_pigeon - number
  if (now_pigeon < 0) {
    //无法扣除
    return false
  } else {
    //更新数据库
    await database
      .update({
        pigeon_num: now_pigeon,
        ...extra
      })
      .from('pigeon')
      .where('user_id', user_id)

    //插入历史记录
    await database
      .insert({
        user_id,
        operation: -number,
        origin_pigeon,
        now_pigeon,
        update_time: Date.now(),
        reason: reason ?? '没有指定原因'
      })
      .into('pigeon_history')

    return true
  }
}
