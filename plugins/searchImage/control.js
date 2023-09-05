import { replyMsg } from '../../libs/sendMsg.js'

export const searchInitialization = () => {
  const { searchImageData } = global.data

  searchImageData.users = []

  //1s运行一次的计时器
  setInterval(async () => {
    searchImageData.users.forEach(async user => {
      if (user.surplus_time <= 0) {
        //退出搜图模式
        await turnOffSearchMode(user.context, false)
      } else {
        user.surplus_time--
      }
    })
  }, 1000)
}

/**
 * 进入搜图模式
 * @param {Object} context
 */
export const turnOnSearchMode = async context => {
  const { botConfig, searchImageConfig } = global.config
  const { searchImageData } = global.data

  searchImageData.users.push({
    context,
    surplus_time: searchImageConfig.autoLeave
  })

  await replyMsg(
    context,
    [
      `${searchImageConfig.word.on_reply}`,
      `记得说"${botConfig.prefix}${searchImageConfig.word.off}${botConfig.botName}"来退出搜图模式哦~`
    ].join('\n')
  )
}

/**
 * 退出搜图模式
 * @param {Object} context
 * @param {Boolean} manual 是否为手动退出
 */
export const turnOffSearchMode = async (context, manual = true) => {
  const { botConfig, searchImageConfig } = global.config
  const { searchImageData } = global.data

  searchImageData.users = searchImageData.users.filter(
    user => user.context.user_id !== context.user_id
  )

  if (manual) {
    await replyMsg(context, `${searchImageConfig.word.off_reply}`, true)
  } else {
    await replyMsg(
      context,
      [
        `已自动退出搜图模式`,
        `下次记得说${botConfig.prefix}${searchImageConfig.word.off}${botConfig.botName}来退出搜图模式哦~`
      ].join('\n')
    )
  }
}

/**
 * 刷新搜图时间
 * @param {Number} user_id
 */
export const refreshTimeOfAutoLeave = user_id => {
  const { searchImageConfig } = global.config
  let user = isSearchMode(user_id)
  user.surplus_time = searchImageConfig.autoLeave
}

/**
 * 判断是否是搜图模式
 * @param {Number} user_id
 * @returns
 */
export const isSearchMode = user_id => {
  const { searchImageData } = global.data
  return searchImageData.users.find(user => user.context.user_id === user_id)
}
