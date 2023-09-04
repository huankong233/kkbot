export default () => {
  event()
}

export { isToday } from '../../libs/time.js'
import { isToday } from '../../libs/time.js'

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
  const { gugu: guguConfig } = global.config

  if (!(await getUserData(user_id))) {
    //插入新用户
    await replyMsg(context, `新用户!赠送${guguConfig.newUserAdd}只鸽子~`, { reply: true })
    await database.insert({ user_id }).into('pigeon')
    await add({ user_id, number: guguConfig.newUserAdd, reason: '新用户赠送' })
    await gugu(context)
  } else {
    //判断今天还能不能签到
    let data = (await getUserData(user_id))[0]
    if (isToday(data.update_time)) {
      return await replyMsg(context, `咕咕失败~今天已经咕咕过了哦~`, { reply: true })
    }

    //获得的鸽子数
    let addon = randomInt(1, guguConfig.oldUserAdd)
    await add({ user_id, number: addon, reason: '每日咕咕', extra: { update_time: Date.now() } })
    await replyMsg(context, `咕咕成功~获得${addon}只鸽子~`, { reply: true })
  }
}
