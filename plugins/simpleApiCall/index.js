export default () => {
  global.prprmeCode = {}

  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '舔狗日记') {
        dog(context)
      } else if (context.command.name === '一言') {
        oneSay(context)
      } else if (context.command.name === '能不能好好说话') {
        guess(context)
      } else if (context.command.name === '舔我') {
        prprme(context)
      } else if (context.command.name === '别舔了') {
        stoprprme(context)
      }
    }
  })
}

async function dog(context) {
  const data = await fetch('https://api.oick.cn/dog/api.php')
  await replyMsg(context, data)
}

async function oneSay(context) {
  const data = await fetch('https://api.oick.cn/dutang/api.php')
  await replyMsg(context, data)
}

async function guess(context) {
  if (context.command.params[0]) {
    const data = await fetch('https://lab.magiconch.com/api/nbnhhsh/guess', {
      text: context.command.params[0]
    }, 'POST')
    await replyMsg(context, `翻译"${data[0].name}":\n${data[0].trans.toString()}`)
  } else {
    await replyMsg(context, '请输入需要猜的话')
  }
}

async function prprme(context) {
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
    bot('send_private_msg', {
      user_id: context.user_id,
      message: '我真的好喜欢你啊!!\n（回复/别舔了来停止哦~）'
    })
    let id = setInterval(async () => {
      try {
        const data = await fetch('https://api.uomg.com/api/rand.qinghua?format=json')
        console.log(data)
        bot('send_private_msg', {
          user_id: context.user_id,
          message: data.content
        })
      } catch (error) {
        if (global.config.bot.debug) {
          console.log(error)
        }
      }
    }, 3000)
    global.prprmeCode[context.user_id] = id
  } else {
    replyMsg(context, '先加一下好友叭~咱也是会害羞的')
  }
}

async function stoprprme(context) {
  const data = global.prprmeCode[context.user_id]
  if (data) {
    clearInterval(data)
    bot('send_private_msg', {
      user_id: context.user_id,
      message: '呜呜，对不起惹你生气了'
    })
  }
}
