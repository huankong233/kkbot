export default () => {
  event()
}

import { eventReg } from '../../libs/eventReg.js'

//注册事件
function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '我的鸽子') {
        await query(context)
      } else if (context.command.name === '查鸽子') {
        await query(context)
      } else if (context.command.name === '鸽子排行榜') {
        await rankingList(context)
      }
    }
  })
}

import { getUserData } from '../pigeon/index.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { getStrangerInfo } from '../../libs/Api.js'

//我的鸽子
export const query = async context => {
  let { user_id } = context

  const { params } = context.command
  if (params && params.length !== 0) {
    user_id = params[0]
  }

  const user_data = await getUserData(user_id)
  if (!user_data) {
    await replyMsg(context, `${user_id}是谁呀,咱不认识呢~`, true)
    return
  }

  const nickname = user_id === context.user_id ? '你' : `用户${user_id}`
  await replyMsg(context, `${nickname}拥有${user_data[0].pigeon_num}只鸽子`, true)
}

export const rankingList = async context => {
  // 鸽子排行榜
  const data = await database
    .from('pigeon')
    .limit(10)
    .orderBy([{ column: 'pigeon_num', order: 'DESC' }])

  if (data.length === 0) {
    await replyMsg(context, '这个数据库里还没有用户哦~')
  } else {
    let board = ['排行榜:']
    for (let i = 0; i < data.length; i++) {
      const value = data[i]
      const index = (i + 1).toString().padStart(2, '0')
      const username = await getUserName(value.user_id)
      board.push(`第${index}名 名字:${username} 拥有${value.pigeon_num}只鸽子`)
    }
    await replyMsg(context, board.join('\n'))
  }
}

/**
 * 获取用户名
 * @param {Number} user_id
 * @returns
 */
export const getUserName = async user_id => {
  const res = await getStrangerInfo({ user_id })
  return res.data.nickname
}
