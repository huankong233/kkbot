import { getUserData } from '../../libs/Api.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { getUserName } from '../../libs/Api.js'
import { eventReg } from '../../libs/eventReg.js'

export default () => {
  event()
}

//注册事件
function event() {
  eventReg('message', async (event, context, tags) => {
    const { command } = context

    if (command) {
      if (command.name === '我的鸽子') {
        await query(context)
      } else if (command.name === '查鸽子') {
        await query(context)
      } else if (command.name === '鸽子排行榜') {
        await rankingList(context)
      }
    }
  })
}

//我的鸽子
async function query(context) {
  let {
    user_id,
    command: { params }
  } = context

  if (params && params.length !== 0) {
    user_id = params[0]
  }

  const userData = await getUserData({ user_id })
  const username = await getUserName({ user_id })

  if (!userData) {
    await replyMsg(context, `${username}是谁呀,咱不认识呢~`, { reply: true })
    return
  }

  await replyMsg(context, `用户${username}拥有${userData.pigeon_num}只鸽子`, {
    reply: true
  })
}

async function rankingList(context) {
  // 鸽子排行榜
  const data = await database
    .from('pigeon')
    .limit(10)
    .orderBy([{ column: 'pigeon_num', order: 'DESC' }])

  if (data.length === 0) {
    await replyMsg(context, '还没有用户哦~', { reply: true })
  } else {
    let board = ['排行榜:']
    for (let i = 0; i < data.length; i++) {
      const value = data[i]
      const index = (i + 1).toString().padStart(2, '0')
      const username = await getUserName({ user_id: value.user_id })
      board.push(`第${index}名 名字:"${username}" 拥有${value.pigeon_num}只鸽子`)
    }
    await replyMsg(context, board.join('\n'), { reply: true })
  }
}
