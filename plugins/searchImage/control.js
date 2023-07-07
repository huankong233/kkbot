import fs from 'fs'
import path from 'path'
import { deleteFolder } from '../../libs/fs.js'
import { replyMsg } from '../../libs/sendMsg.js'

export const searchInitialization = () => {
  const tempDir = path.join(baseDir, 'temp')
  //删除temp文件夹内的所有文件
  deleteFolder(tempDir)
  //创建文件夹
  fs.mkdirSync(tempDir)
  global.search = { users: [] }

  //1s运行一次的计时器
  setInterval(async () => {
    global.search.users.forEach(async user => {
      if (user.surplus_time === 0) {
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
  const { bot, searchImage } = global.config

  global.search.users.push({
    context,
    surplus_time: searchImage.autoLeave
  })

  await replyMsg(
    context,
    [
      `${searchImage.word.on_reply}`,
      `记得说${bot.prefix}${searchImage.word.off}${bot.botName}来退出搜图模式哦~`
    ].join('\n')
  )
}

/**
 * 退出搜图模式
 * @param {Object} context
 * @param {Boolean} manual 是否为手动退出
 */
export const turnOffSearchMode = async (context, manual = true) => {
  const { bot, searchImage } = global.config

  global.search.users = global.search.users.filter(user => user.context.user_id !== context.user_id)

  if (manual) {
    await replyMsg(context, `${searchImage.word.off_reply}`, true)
  } else {
    await replyMsg(
      context,
      [
        `已自动退出搜图模式`,
        `下次记得说${bot.prefix}${searchImage.word.off}${bot.botName}来退出搜图模式哦~`
      ].join('\n')
    )
  }
}

/**
 * 刷新搜图时间
 * @param {Number} user_id
 */
export const refreshTimeOfAutoLeave = user_id => {
  let user = isSearchMode(user_id)
  user.surplus_time = global.config.searchImage.autoLeave
}

/**
 * 判断是否是搜图模式
 * @param {Number} user_id
 * @returns
 */
export const isSearchMode = user_id =>
  global.search.users.find(user => user.context.user_id === user_id)
