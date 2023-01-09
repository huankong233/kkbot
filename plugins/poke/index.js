export default () => {
  loadConfig('poke.jsonc', true)
  global.config.poke.count = {}

  event()
}

function event() {
  RegEvent('notice', async context => {
    if (context.notice_type === 'notify' && context.sub_type === 'poke') {
      await poke(context)
    }
  })
}

//戳一戳
import { mute } from '../mute/index.js'
export const poke = async context => {
  const { group_id, user_id, self_id } = context
  const { reply, banTime, banCount, banProb, ffmpeg, path, records } = global.config.poke
  const fake_context = { user_id, group_id, self_id, message_type: group_id ? 'group' : 'private' }

  //增加计数
  if (!global.config.poke.count[user_id]) global.config.poke.count[user_id] = 0
  if (Math.random() * 100 < banProb) {
    global.config.poke.count[user_id]++
  }

  if (global.config.poke.count[user_id] >= banCount) {
    const data = await mute(fake_context, false, banTime)
    if (data) {
      //禁言成功
      return await replyMsg(fake_context, `气死我了！你再戳！`)
    }
    global.config.poke.count[user_id] = 0
  }

  //回复
  await replyMsg(fake_context, reply[randomMaxToMin(reply.length - 1, 0)])
}
