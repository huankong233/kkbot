export default () => {
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '我的鸽子') {
        query(context)
      } else if (context.command.name === '查鸽子') {
        query(context)
      } else if (context.command.name === '鸽子排行榜') {
        rankingList(context)
      }
    }
  })
}

import { getUserData } from '../pigeon/index.js'

//我的鸽子
async function query(context) {
  let user_id = context.user_id
  const params = context.command.params
  if (params && params.length !== 0) {
    user_id = params[0]
  }
  // 数据
  const pigeon_num = await getUserData(user_id)
  if (pigeon_num !== false) {
    replyMsg(
      context,
      `${user_id === context.user_id ? '你' : `用户${user_id}`}拥有${pigeon_num[0].pigeon_num
      }只鸽子`,
      true
    )
  } else {
    //用户不存在
    replyMsg(context, `${user_id}是谁呀，咱不认识`, true)
  }
}

async function rankingList(context) {
  // 鸽子排行榜
  const data = await database
    .from('pigeon')
    .limit(10)
    .orderBy([{ column: 'pigeon_num', order: 'DESC' }])
  console.log(data)
  if (data.length === 0) {
    await replyMsg(context, '这个数据库里还没有用户哦~')
  } else {
    let str = '排行榜:\n'
    for (const value of data) {
      const index = data.indexOf(value) + 1
      const username = await getUserName(value.user_id)
      str += '第' + index + '名，' + '名字:' + username + '，拥有' + value.pigeon_num + '只鸽子\n'
    }
    await replyMsg(context, str.slice(0, -1))
  }
}

export async function getUserName(user_id) {
  const res = await bot('get_stranger_info', {
    user_id
  })
  return res.data.nickname
}
