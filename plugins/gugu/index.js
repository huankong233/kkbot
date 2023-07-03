export default () => {
  event()
}

import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name.search('咕咕') !== -1) {
        await gugu(context)
      }
    }
  })
}

import { getUserData, add } from '../pigeon/index.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { randomInt } from '../../libs/random.js'

async function gugu(context) {
  const { user_id } = context
  if (!(await getUserData(user_id))) {
    //插入新用户
    await replyMsg(context, `新用户!赠送${global.config.gugu.newUserAdd}只鸽子~`)
    await database.insert({ user_id }).into('pigeon')
    await add({ user_id, number: global.config.gugu.newUserAdd, reason: '新用户赠送' })
    gugu(context)
  } else {
    //判断今天还能不能签到
    let data = (await getUserData(user_id))[0]
    if (isToday(data.update_time)) {
      return await replyMsg(context, `咕咕失败~今天已经咕咕过了哦~`)
    }

    //获得的鸽子数
    let addon = randomInt(1, global.config.gugu.oldUserAdd)
    await add({ user_id, number: addon, reason: '每日咕咕', extra: { update_time: Date.now() } })
    await replyMsg(context, `咕咕成功~获得${addon}只鸽子~`)
  }
}

/**
 * 判断时间戳是否是今天的
 * @param {Number} timestamp
 * @returns
 */
export function isToday(timestamp) {
  // 获取当前的时间戳
  let now = Date.now()
  // 创建一个 Date 对象，用来获取今天的日期
  let today = new Date(now)
  // 将今天的日期设置为 0 时 0 分 0 秒 0 毫秒，即今天的起始时间
  today.setHours(0, 0, 0, 0)
  // 获取今天的起始时间戳
  let start = today.getTime()
  // 如果参数的时间戳大于等于今天的起始时间戳，并且小于明天的起始时间戳，说明是今天
  if (timestamp >= start && timestamp < start + 24 * 60 * 60 * 1000) {
    return true
  } else {
    return false
  }
}
