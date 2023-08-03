export default () => {
  global.config.poke.count = {}

  event()
}

import { eventReg } from '../../libs/eventReg.js'

function event() {
  eventReg('notice', async context => {
    if (
      context.notice_type === 'notify' &&
      context.sub_type === 'poke' &&
      context.group_id &&
      context.target_id === context.self_id
    ) {
      await poke(context)
    }
  })
}

import { mute } from '../mute/index.js'
import { replyMsg } from '../../libs/sendMsg.js'
import { randomInt } from '../../libs/random.js'

//戳一戳
async function poke(context) {
  const { group_id, user_id, self_id } = context
  const { poke } = global.config

  const fakeContext = { user_id, group_id, self_id, message_type: 'group' }

  //增加计数
  if (!poke.count[user_id]) poke.count[user_id] = 0

  if (randomInt(0, 100) <= poke.banProb) {
    poke.count[user_id]++
  }

  let replyed = false

  if (global.config.poke.count[user_id] >= poke.banCount) {
    global.config.poke.count[user_id] = 0

    const data = await mute(fakeContext, false, poke.banTime)
    if (data) {
      //禁言成功
      replyed = true
      return await replyMsg(fakeContext, poke.banReply[randomInt(0, poke.banReply.length - 1)])
    }
  }

  //回复
  if (!replyed) await replyMsg(fakeContext, poke.reply[randomInt(0, poke.reply.length - 1)])
}
