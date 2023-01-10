export default () => {
  loadConfig('apiCall.jsonc', true)
  global.prprmeCode = {}

  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '舔狗日记') {
        await dog(context)
      } else if (context.command.name === '一言') {
        await oneSay(context)
      } else if (context.command.name === '能不能好好说话') {
        await guess(context)
      } else if (context.command.name === '舔我') {
        await prprme(context)
      } else if (context.command.name === '别舔了') {
        await stoprprme(context)
      }
    }
    if (context.message.match('^(到点了|12点了|生而为人)$')) {
      await comments_163(context)
    }
  })
}

export const dog = async context => {
  const data = await fetch('https://api.oick.cn/dog/api.php')
  await replyMsg(context, data)
}

export const oneSay = async context => {
  const data = await fetch('https://api.oick.cn/dutang/api.php')
  await replyMsg(context, data)
}

export const guess = async context => {
  if (context.command.params[0]) {
    const data = await fetch(
      'https://lab.magiconch.com/api/nbnhhsh/guess',
      {
        text: context.command.params[0]
      },
      'POST'
    )
    await replyMsg(context, `翻译"${data[0].name}":\n${data[0].trans.toString()}`)
  } else {
    await replyMsg(context, '请输入需要猜的话')
  }
}

export const prprme = async context => {
  const data = await bot('get_friend_list')
  let key = false
  // 判断是否为好友
  data.data.forEach(value => {
    if (!key) {
      if (value.user_id === context.user_id) {
        key = true
      }
    }
  })
  if (key) {
    await sendMsg(
      context.user_id,
      `我真的好喜欢你啊!!\n（回复"${global.config.bot.prefix}别舔了"来停止哦~）`
    )
    let id = setInterval(async () => {
      try {
        const data = await fetch('https://api.uomg.com/api/rand.qinghua?format=json')
        await sendMsg(context.user_id, data.content)
      } catch (error) {}
    }, 3000)
    global.prprmeCode[context.user_id] = id
  } else {
    await replyMsg(context, '先加一下好友叭~咱也是会害羞的')
  }
}

export const stoprprme = async context => {
  const data = global.prprmeCode[context.user_id]
  if (data) {
    clearInterval(data)
    await bot('send_private_msg', {
      user_id: context.user_id,
      message: '呜呜，对不起惹你生气了'
    })
  }
}

export const comments_163 = async context => {
  const data = await fetch(
    'https://v2.alapi.cn/api/comment',
    { token: global.config.apiCall.alapi_token },
    'POST'
  )
  await replyMsg(
    context,
    [
      `歌名:${data.data.title}`,
      `${data.data.comment_nickname}说:${data.data.comment_content}`
    ].join('\n')
  )
  await replyMsg(context, CQ.music('163', data.data.song_id))
}
