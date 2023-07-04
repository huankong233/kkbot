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
export const poke = async context => {
  const { group_id, user_id, self_id } = context
  const { reply, banReply, banTime, banCount, banProb } = global.config.poke

  const fakeContext = { user_id, group_id, self_id, message_type: 'group' }

  //增加计数
  if (!global.config.poke.count[user_id]) global.config.poke.count[user_id] = 0

  if (randomInt(0, 100) <= banProb) {
    global.config.poke.count[user_id]++
  }

  let replyed = false

  if (global.config.poke.count[user_id] >= banCount) {
    global.config.poke.count[user_id] = 0

    const data = await mute(fakeContext, false, banTime)
    if (data) {
      //禁言成功
      replyed = true
      return await replyMsg(fakeContext, banReply[randomInt(0, banReply.length - 1)])
    }
  }

  //回复
  if (!replyed) await replyMsg(fakeContext, reply[randomInt(0, reply.length - 1)])
}
