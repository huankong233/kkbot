export default async () => {
  loadConfig('repeat.jsonc', true)
  global.config.repeat.data = {}

  event()
}

function event() {
  RegEvent('message', async (event, context, tags) => {
    repeat(context)
  })
}

function repeat(context) {
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
        global.config.repeat.data[context.group_id].user_id.push(context.user_id);
        global.config.repeat.data[context.group_id].count++;
        //判断次数
        if (global.config.repeat.data[context.group_id].count === global.config.repeat.times) {
          setTimeout(() => {
            replyMsg(context, context.message)
          }, 2000);
        }
      }
    }
  }
  //所有规则外还有一定概率触发
  if (randomMaxToMin(100, 0.00001) <= global.config.repeat.commonProb) {
    setTimeout(() => {
      replyMsg(context, context.message)
    }, 2000);
  }
}