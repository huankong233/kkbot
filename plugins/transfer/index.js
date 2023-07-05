export default async () => {
  event()
}

import { eventReg } from '../../libs/eventReg.js'
function event() {
  eventReg('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '鸽子转账') {
        await transferAccounts(context)
      }
    }
  })
}

import { getUserData, add, reduce } from '../pigeon/index.js'
import { missingParams } from '../../libs/eventReg.js'
import { replyMsg } from '../../libs/sendMsg.js'

export const transferAccounts = async context => {
  const { params } = context.command

  if (await missingParams(context, params, 2)) return

  const from = context.user_id
  const to = params[0].replace(/[^0-9]/gi, '')

  if (from === to) {
    return await replyMsg(context, '请不要给自己转账哦~')
  }

  //转账多少只
  const num = parseFloat(params[1].replace(/[^0-9]/gi, ''))
  if (num <= 0) {
    return await replyMsg(context, '转账失败,金额有误')
  }
  const to_data = await getUserData(to)
  if (!to_data) {
    return await replyMsg(context, '转账失败,转账对象不存在~', true)
  }

  if (!(await reduce({ user_id: from, number: num, reason: `转账给${to}` }))) {
    await replyMsg(context, '转账失败,账户鸽子不足~', true)
  }
  await add({ user_id: to, number: num, reason: `转账来自${from}` })
  await replyMsg(context, '转账成功~', true)
}
