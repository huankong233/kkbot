import { eventReg, haveAt } from '../../libs/eventReg.js'
import { getUserData } from '../../libs/Api.js'
import { replyMsg } from '../../libs/sendMsg.js'

export default function event() {
  //判断用户是否注册过了
  eventReg(
    'message',
    async (event, context, tags) => {
      const { user_id } = context

      const at = haveAt(context)
      const notHaveAccount = !(await getUserData({ user_id }))
      const isCommand =
        context.command && context.command.name.search('咕咕') === -1 && notHaveAccount
      const isAt = at && notHaveAccount

      if (isCommand || isAt) {
        await replyMsg(context, `请先使用"${global.config.botConfig.prefix}咕咕"注册账户`, {
          reply: true
        })
        return 'quit'
      }
    },
    101
  )
}

/**
 * 增加鸽子
 * @param {{number:Number,user_id:Number,reason:String,extra:Object}} params
 * @returns {Promise<Boolean>} 提交状态
 */
export async function add({ number, reason, extra, user_id }) {
  //不允许增加负数的鸽子
  if (number <= 0) return false

  let userData = await getUserData({ user_id })
  if (!userData) throw new Error('user not found')

  //获取拥有的鸽子数
  let origin_pigeon = userData.pigeon_num
  let now_pigeon = origin_pigeon + number

  //更新数据库
  await database
    .update({
      pigeon_num: now_pigeon,
      ...extra
    })
    .where('user_id', user_id)
    .from('pigeon')

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
 * @param {{number:Number,user_id:Number,reason:String,extra:Object}} params
 * @returns {Promise<Boolean>} 提交状态
 */
export async function reduce({ number, reason, extra, user_id }) {
  //不允许减少负数的鸽子
  if (number <= 0) return false

  let userData = await getUserData({ user_id })
  if (!userData) throw new Error('user not found')

  //获取拥有的鸽子数
  let origin_pigeon = userData.pigeon_num
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
