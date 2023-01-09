export default async () => {
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '鸽子转账') {
        transferAccounts(context)
      }
    }
  })
}

import { getUserData, add, reduce } from '../pigeon/index.js'

export const transferAccounts = async context => {
  const params = context.command.params
  if (params.length < 2) {
    return await replyMsg(
      context,
      `红包发送失败,所需参数至少需要两个,发送"${global.config.bot.prefix}帮助 鸽子转账"查看细节`
    )
  }
  const from = context.user_id
  const to = parseFloat(params[0])
  if (from === to) {
    return await replyMsg(context, '请不要给自己转账哦~')
  }
  //转账多少只
  const num = parseInt(params[1])
  if (num <= 0) {
    return await replyMsg(context, '转账失败,金额有误')
  }
  const to_data = await getUserData(to)
  if (!to_data) {
    return await replyMsg(context, '转账失败,转账对象不存在~', true)
  }

  if (!(await reduce(from, num, `转账给${to}`))) {
    await replyMsg(context, '转账失败,账户鸽子不足~', true)
  }
  await add(to, num, `转账来自${from}`)
  await replyMsg(context, '转账成功~', true)
}
