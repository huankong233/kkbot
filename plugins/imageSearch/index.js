export default () => {
  loadConfig('searchImage.jsonc', true)

  //初始化搜图
  searchInitialization()
  //注册事件
  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === global.config.bot.botName + global.config.searchImage.word.on) {
        await turnOnSearchMode(context)
      }
    }
  })
  RegEvent(
    'message',
    async (event, context, tags) => {
      if (context.command.name === global.config.searchImage.word.off + global.config.bot.botName) {
        await turnOffSearchMode(context)
      } else {
        if (ifSearchMode(context)) {
          search(context)
          return 'quit'
        }
      }
    },
    100
  )
}

export const searchInitialization = () => {
  //删除temp文件夹内的所有文件
  deleteFolder(`./temp/`)
  //创建文件夹
  fs.mkdirSync(`./temp/`)
  global.searchUsers = []
  //1s运行一次的计时器
  setInterval(() => {
    global.searchUsers.forEach(async searchUser => {
      //开启了自动退出
      if (searchUser.autuLeave === true) {
        if (searchUser.surplus_time === 0) {
          //退出搜图模式
          turnOffSearchMode(searchUser.context, false)
          await replyMsg(
            searchUser.context,
            `已自动退出搜图模式\n下次记得说"${global.config.searchImage.word.off}"来退出搜图模式哦~`,
            true
          )
        } else {
          searchUser.surplus_time--
        }
      }
    })
  }, 1000)
}

//删除文件夹
export const deleteFolder = path => {
  let files = []
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path)
    files.forEach((file, index) => {
      let dirPath = path + '/' + file
      if (fs.statSync(dirPath).isDirectory()) {
        deleteFolder(dirPath)
      } else {
        fs.unlinkSync(dirPath)
      }
    })
    fs.rmdirSync(path)
  }
}

//开启搜图模式
export const turnOnSearchMode = async context => {
  if (global.config.searchImage.autoLeave.enable) {
    //开启自动退出搜图模式
    global.searchUsers.push({
      context,
      autuLeave: true,
      surplus_time: global.config.searchImage.autoLeave.time
    })
  } else {
    //关闭自动退出搜图模式
    global.searchUsers.push({
      context,
      autuLeave: false
    })
  }
  await replyMsg(
    context,
    `${global.config.searchImage.word.on_reply}\n记得说"${global.config.bot.prefix}${global.config.searchImage.word.off}${global.config.bot.botName}"来退出搜图模式哦~`,
    true
  )
}

//关闭搜图模式
export const turnOffSearchMode = async (context, reply = true) => {
  let arr = []
  global.searchUsers.forEach(searchUser => {
    if (searchUser.context.user_id !== context.user_id) {
      arr.push(searchUser)
    }
  })
  global.searchUsers = arr
  if (reply) await replyMsg(context, `${global.config.searchImage.word.off_reply}`, true)
}

//刷新搜图模式时间
export const refreshTimeOfAutoLeave = user_id => {
  global.searchUsers.forEach(searchUser => {
    if (searchUser.context.user_id === user_id) {
      searchUser.surplus_time = global.config.searchImage.autoLeave.time
    }
  })
}

//判断是否是搜图模式
export const ifSearchMode = context => {
  let bool = false
  global.searchUsers.forEach(searchUser => {
    if (searchUser.context.user_id === context.user_id) {
      bool = true
    }
  })
  return bool
}

import { add, reduce } from '../pigeon/index.js'
import { ascii2d, SauceNAO, IqDB, TraceMoe, EHentai, Yandex } from 'image_searcher'

//获取通用地址
export const getUniversalImgURL = (url = '') => {
  return url
    .replace('/c2cpicdw.qpic.cn/offpic_new/', '/gchat.qpic.cn/gchatpic_new/')
    .replace(/\/\d+\/+\d+-\d+-/, '/0/0-0-')
    .replace(/\?.*$/, '')
}

export const search = context => {
  //先下载文件
  let data = CQ.parse(context.message)
  let receive = false
  data.forEach(async item => {
    if (item._type === 'image') {
      //扣除鸽子
      if (await reduce(context.user_id, global.config.searchImage.reduce, '搜图')) {
        //收到回复
        if (!receive) {
          receive = true
          await replyMsg(context, `${global.config.searchImage.word.receive}`, true)
        }
        //刷新时间
        refreshTimeOfAutoLeave(context.user_id)
        //图片url
        const imageUrl = getUniversalImgURL(item._data.url)
        const fileName = getRangeCode(10) + '.temp'
        const outPath = './temp'
        const imagePath = `${outPath}/${fileName}`
        await downloadFile(imageUrl, outPath, fileName)
        //请求数据
        const responseData = await request([
          {
            name: 'ascii2d',
            callback: ascii2d,
            params: {
              type: 'bovw',
              imagePath
            }
          },
          {
            name: 'SauceNAO',
            callback: SauceNAO,
            params: {
              hide: false,
              imagePath
            }
          },
          {
            name: 'IqDB',
            callback: IqDB,
            params: {
              discolor: false,
              services: [
                'danbooru',
                'konachan',
                'yandere',
                'gelbooru',
                'sankaku_channel',
                'e_shuushuu',
                'zerochan',
                'anime_pictures'
              ],
              imagePath
            }
          },
          {
            name: 'TraceMoe',
            callback: TraceMoe,
            params: {
              cutBorders: true,
              imagePath
            }
          },
          {
            name: 'Yandex',
            callback: Yandex,
            params: {
              url: imageUrl
            }
          },
          {
            name: 'E-Hentai',
            callback: EHentai,
            params: {
              site: 'ex',
              similar: true,
              EH_COOKIE: global.config.searchImage.EH_COOKIE,
              imagePath
            }
          }
        ])

        parse(context, responseData, imageUrl)

        //删除文件
        fs.unlinkSync(imagePath)
      } else {
        await replyMsg(context, `搜索失败,鸽子不足~`, true)
      }
    }
  })
}

import fs from 'fs'
import fetch from 'node-fetch'
//下载图片
export const downloadFile = async (url, filePath, fileName) => {
  if (!base64 && !fs.existsSync(filePath)) {
    fs.mkdirSync(filePath)
  }
  const res = await fetch(url)
  const dest = fs.createWriteStream(`${filePath}/${fileName}`)
  res.body.pipe(dest)
  return new Promise((resolve, reject) => {
    dest.on('finish', resolve)
    dest.on('error', reject)
  })
}

//运行函数防止崩溃
export const request = async callbacks => {
  let responseData = []
  for (let i = 0; i < callbacks.length; i++) {
    const item = callbacks[i]
    try {
      const start = performance.now()
      let obj = {
        success: true,
        name: item.name,
        res: await item.callback(item.params)
      }
      const end = performance.now()
      obj.cost = end - start
      responseData.push(obj)
    } catch (error) {
      responseData.push({ success: false, name: item.name, res: null })
    }
  }
  return responseData
}

//整理数据
export const parse = async (context, res, originUrl) => {
  let messages = [CQ.node(global.config.bot.botName, context.self_id, CQ.image(originUrl))]
  res.forEach(async datum => {
    if (datum.success) {
      let message = `${datum.name}(耗时:${parseInt(datum.cost)}ms):\n`
      if (datum.res.length === 0) {
        message += '没有搜索结果~'
      } else {
        let limit =
          datum.res.length >= global.config.searchImage.limit
            ? global.config.searchImage.limit
            : datum.res.length
        for (let i = 0; i <= limit - 1; i++) {
          const item = datum.res[i]
          switch (datum.name) {
            case 'ascii2d':
              message += [
                `${await antiShielding(item.image)}`,
                `图片信息:${item.info}`,
                `链接:${confuseURL(item.source.link, true)}`,
                `${
                  item.author && (item.author.text || item.author.link)
                    ? `作者:${item.author.text ? item.author.text : ''}(${
                        item.author.link ? confuseURL(item.author.link, true) : ''
                      })\n`
                    : ''
                }`,
                ``
              ].join('\n')
              break
            case 'SauceNAO':
              message += [
                `${await antiShielding(item.image)}`,
                `标题: ${item.title}`,
                `相似度: ${item.similarity}`,
                `图片信息:`,
                ``
              ].join('\n')
              item.content.forEach((c, index) => {
                if (index % 2) {
                  if (c.link) {
                    message += `${confuseURL(c.text, true)}(${confuseURL(c.link, true)}) \n`
                  } else {
                    message += `${confuseURL(c.text, true)} \n`
                  }
                } else {
                  message += c.text
                  if (index === item.content.length - 1) {
                    message += '\n'
                  }
                }
              })
              message += '\n'
              break
            case 'IqDB':
              message += [
                `${await antiShielding(item.image)}`,
                `分辨率: ${item.resolution}`,
                `相似度: ${item.similarity}`,
                `链接: ${confuseURL(item.url, true)}`,
                ``,
                ``
              ].join('\n')
              break
            case 'TraceMoe':
              message += [
                `${await antiShielding(item.preview)}`,
                `相似度: ${item.similarity}`,
                `文件名: ${item.file}`,
                `动漫名: ${item.name.native}`,
                `NSFW: ${item.nsfw}`,
                `集数: ${item.episode}`,
                `大概位置: ${formatTime(item.from)}——${formatTime(item.to)}`,
                ``,
                ``
              ].join('\n')
              break
            case 'E-Hentai':
              message += [
                `${await antiShielding(item.image, global.config.searchImage.EH_COOKIE)}`,
                `标题: ${item.title}`,
                `时间: ${item.date}`,
                `类型: ${item.type}`,
                `标签: ${item.tags.toString()}`,
                `地址: ${confuseURL(item.link, true)}`,
                ``,
                ``
              ].join('\n')
              break
            case 'Yandex':
              message += [
                `${await antiShielding(`https:${item.thumb.url}`)}`,
                `标题: ${item.snippet.title}`,
                `内容: ${item.snippet.text}`,
                `来源: ${confuseURL(item.snippet.url, true)}`,
                ``,
                ``
              ].join('\n')
              break
          }
        }
      }
      messages.push(CQ.node(global.config.bot.botName, context.self_id, message.slice(0, -1)))
    } else {
      messages.push(
        CQ.node(
          global.config.bot.botName,
          context.self_id,
          CQ.text(`${datum.name}搜图失败~已赔偿鸽子${global.config.searchImage.claim}只`)
        )
      )
      //赔偿
      await add(context.user_id, global.config.searchImage.claim, `${datum.name}搜图失败赔偿`)
    }
  })

  //发送
  const data = await send_forward_msg(context, messages)
  if (data.status === 'failed') {
    await replyMsg(context, '发送合并消息失败，可以尝试私聊我哦~(鸽子已返还)')
    let count = 0
    res.forEach(item => (item.success ? count++ : void 0))
    await add(context.user_id, global.config.searchImage.claim * count, `合并消息发送失败赔偿`)
  }
}

//时间格式化
export const formatTime = stamp => {
  const iso = new Date(stamp).toISOString()
  const [, timeZ] = iso.split('T')
  const [time] = timeZ.split('Z')
  return time
}

//反和谐
import Jimp from 'jimp'
import { imgAntiShielding } from '../setu/AntiShielding.js'
export const antiShielding = async (url, cookie) => {
  //反和谐
  const img = await Jimp.read(
    Buffer.from(
      await fetch(url, {
        method: 'get',
        headers: { 'Content-Type': 'application/octet-stream', cookie }
      }).then(res => res.arrayBuffer())
    )
  )
  const base64 = await imgAntiShielding(img, global.config.searchImage.antiShieldingMode)
  return CQ.image(`base64://${base64}`)
}
