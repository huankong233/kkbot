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

export const repeat = async context => {
  if (!global.config.repeat.data[context.group_id]) {
    global.config.repeat.data[context.group_id] = {
      message: context.message,
      user_id: [context.user_id],
      count: 1
    }
  } else {
    if (context.message !== global.config.repeat.data[context.group_id].message) {
      //替换
      global.config.repeat.data[context.group_id] = {
        message: context.message,
        user_id: [context.user_id],
        count: 1
      }
    } else {
      //增加计数(并且不是同一个人)
      if (!global.config.repeat.data[context.group_id].user_id.includes(context.user_id)) {
        global.config.repeat.data[context.group_id].user_id.push(context.user_id)
        global.config.repeat.data[context.group_id].count++
        //判断次数
        if (global.config.repeat.data[context.group_id].count === global.config.repeat.times) {
          setTimeout(async () => {
            await replyMsg(context, context.message)
          }, 1000)
        }
      }
    }
  }

  //所有规则外还有一定概率触发
  if (Math.random() * 100 <= global.config.repeat.commonProb) {
    setTimeout(async () => {
      await replyMsg(context, context.message)
    }, 1000)
  }
}
