export default async () => {
  global.config.repeat.data = {}

  event()
}

import { eventReg } from '../../libs/eventReg.js'
function event() {
  eventReg('message', async (event, context, tags) => {
    //屏蔽命令
    if (!context.command) {
      await repeat(context)
    }
  })
}

import { replyMsg } from '../../libs/sendMsg.js'

async function repeat(context) {
  const { group_id, message, user_id } = context
  const { repeat } = global.config
  if (!repeat.data[group_id]) {
    repeat.data[group_id] = {
      message,
      user_id: [user_id],
      count: 1
    }
  } else {
    if (message !== repeat.data[group_id].message) {
      //替换
      repeat.data[group_id] = {
        message: message,
        user_id: [user_id],
        count: 1
      }
    } else {
      //增加计数(并且不是同一个人)
      if (!repeat.data[group_id].user_id.includes(user_id)) {
        repeat.data[group_id].user_id.push(user_id)
        repeat.data[group_id].count++
        //判断次数
        if (repeat.data[group_id].count === repeat.times) {
          await replyMsg(context, message)
        }
      }
    }
  }

  //所有规则外还有一定概率触发
  if (Math.random() * 100 <= repeat.commonProb) {
    await replyMsg(context, message)
  }
}
