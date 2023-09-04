import { eventReg } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { randomFloat } from '../../libs/random.js'

export default async () => {
  event()
}

function event() {
  eventReg('message', async (event, context, tags) => {
    //屏蔽命令
    if (!context.command) {
      await repeat(context)
    }
  })
}

async function repeat(context) {
  const { group_id, message, user_id } = context
  const { repeatConfig } = global.config
  const { repeatData } = global.data

  if (!repeatData[group_id]) {
    repeatData[group_id] = {
      message,
      user_id: [user_id],
      count: 1
    }
  } else {
    if (message !== repeatData[group_id].message) {
      //替换
      repeatData[group_id] = {
        message: message,
        user_id: [user_id],
        count: 1
      }
    } else {
      //增加计数(并且不是同一个人)
      if (!repeatData[group_id].user_id.includes(user_id)) {
        repeatData[group_id].user_id.push(user_id)
        repeatData[group_id].count++
        //判断次数
        if (repeatData[group_id].count === repeatConfig.times) {
          await replyMsg(context, message)
        }
      }
    }
  }

  //所有规则外还有一定概率触发
  if (randomFloat(0, 100) <= repeatConfig.commonProb) {
    await replyMsg(context, message)
  }
}
