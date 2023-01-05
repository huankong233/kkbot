export default () => {
  loadConfig('gugu.jsonc', true)

  event()
}

function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name.search('咕咕') !== -1) {
        await gugu(context)
      }
    }
  })
}

import { getUserData, add } from '../pigeon'

async function gugu(context) {
  const user_id = context.user_id
  if (!(await getUserData(context.user_id))) {
    //插入新用户
    replyMsg(context, `新用户!赠送${global.config.gugu.newUserAdd}只鸽子~`)
    await database.insert({ user_id }).into('pigeon')
    await add(user_id, global.config.gugu.newUserAdd, '新用户赠送')
    gugu(context)
  } else {
    //判断今天还能不能签到
    let data = (await getUserData(user_id))[0]
    if (isToday(data.update_time)) {
      //获得的鸽子数
      let addon = randomMaxToMin(1, global.config.gugu.oldUserAdd)
      await add(user_id, addon, '每日咕咕', { update_time: Date.now() })
      replyMsg(context, `咕咕成功~获得${addon}只鸽子~`)
    } else {
      replyMsg(context, `咕咕失败~今天已经咕咕过了哦~`)
    }
  }
}

//是否已经签到过了
export function isToday(severTime) {
  const updateTime = new Date(severTime)
  const updateMonth = updateTime.getMonth() + 1
  const updateDay = updateTime.getDate()
  const updateYear = updateTime.getFullYear()
  const nowTime = new Date(Date.now())
  const nowMonth = nowTime.getMonth() + 1
  const nowDay = nowTime.getDate()
  const nowYear = nowTime.getFullYear()
  if (nowYear > updateYear) {
    return true
  } else if (nowMonth > updateMonth) {
    return true
  } else if (nowMonth === updateMonth && nowDay > updateDay) {
    return true
  } else {
    return false
  }
}
