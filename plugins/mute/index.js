export default () => {
  loadConfig('mute.jsonc', true)
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '鸽了') {
        mute(context)
      }
    }
  })
}

//我的鸽子
export const mute = async (context, message = true, params) => {
  if (context.group_id !== undefined) {
    //判断对方信息
    const state = await global.bot('get_group_member_info', {
      group_id: context.group_id,
      user_id: context.user_id,
      no_cache: true
    })
    //判断自己信息
    const bot = await global.bot('get_group_member_info', {
      group_id: context.group_id,
      user_id: context.self_id,
      no_cache: true
    })
    if (bot.data.role !== 'admin' && bot.data.role !== 'owner') {
      if (message) {
        return replyMsg(context, `咱还不是管理员呢~\n管理！快给我上管理！(小声)`)
      } else {
        return false
      }
    }
    if (state.data.role !== 'member') {
      if (message) {
        return replyMsg(context, '没你官大(')
      } else {
        return false
      }
    }
    const muteTime = message
      ? randomMaxToMin(global.config.mute.time[1], global.config.mute.time[0])
      : randomMaxToMin(params[0], params[1])
    await global.bot('set_group_ban', {
      group_id: context.group_id,
      user_id: context.user_id,
      duration: muteTime
    })
    if (message) {
      await replyMsg(context, '还鸽不鸽了')
    } else {
      return true
    }
  } else {
    if (message) {
      await replyMsg(context, '爬爬爬，私聊来找茬是吧')
    } else {
      return false
    }
  }
}
