export default () => {
  //判断用户是否注册过了
  RegEvent(
    'message',
    async (event, context, tags) => {
      if (context.command) {
        if (!(await getUserData(context.user_id))) {
          if (context.command.name.search('咕咕') === -1) {
            await replyMsg(context, `请先使用"${global.config.bot.prefix}咕咕"注册账户`)
            return 'quit'
          }
        }
      }
    },
    101
  )
}

/**
 * 判断是否为新用户
 * @param {Double} user_id
 * @returns false:新用户
 * @returns data:不是新用户
 */
export const getUserData = async user_id => {
  const data = await database.select().from('pigeon').where('user_id', user_id)
  if (data.length === 0) {
    return false
  } else {
    return data
  }
}

/**
 * 增加鸽子
 * @param {Double} user_id
 * @param {Double} num
 * @param {String} reason
 * @param {Object} extra
 * @returns true 成功
 * @returns false 失败
 */
export const add = async (user_id, num, reason = '没有指定原因', extra = {}) => {
  //不允许增加负数的鸽子
  if (num < 0) {
    return false
  }
  //获取拥有的鸽子数
  let origin_pigeon = (await getUserData(user_id))[0].pigeon_num
  let now_pigeon = origin_pigeon + num
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
      operation: num,
      origin_pigeon,
      now_pigeon,
      update_time: Date.now(),
      reason
    })
    .into('pigeon_history')
  return true
}

/**
 * 减少鸽子
 * @param {Double} user_id
 * @param {Double} num
 * @param {String} reason
 * @param {Object} extra
 * @returns true 成功
 * @returns false 失败
 */
export const reduce = async (user_id, num, reason = '没有指定原因', extra = {}) => {
  //不允许减少负数的鸽子
  if (num < 0) {
    return false
  }
  //获取拥有的鸽子数
  let origin_pigeon = (await getUserData(user_id))[0].pigeon_num
  let now_pigeon = origin_pigeon - num
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
        operation: -num,
        origin_pigeon,
        now_pigeon,
        update_time: Date.now(),
        reason
      })
      .into('pigeon_history')
    return true
  }
}
