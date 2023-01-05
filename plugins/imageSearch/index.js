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
      if (context.command.name === global.config.searchImage.word.on) {
        turnOnSearchMode(context)
      }
    }
  })
  RegEvent(
    'message',
    async (event, context, tags) => {
      if (context.command.name === global.config.searchImage.word.off) {
        turnOffSearchMode(context)
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

export function searchInitialization() {
  //删除temp文件夹内的所有文件
  deleteFolder(`./temp/`)
  //创建文件夹
  fs.mkdirSync(`./temp/`)
  global.searchUsers = []
  //1s运行一次的计时器
  setInterval(() => {
    global.searchUsers.forEach(searchUser => {
      //开启了自动退出
      if (searchUser.autuLeave === true) {
        if (searchUser.surplus_time === 0) {
          //退出搜图模式
          turnOffSearchMode(searchUser.context, false)
          replyMsg(
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
function deleteFolder(path) {
  let files = []
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path)
    files.forEach(function (file, index) {
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
function turnOnSearchMode(context) {
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
  replyMsg(
    context,
    `${global.config.searchImage.word.on_reply}\n记得说"${global.config.searchImage.word.off}"来退出搜图模式哦~`,
    true
  )
}

//关闭搜图模式
function turnOffSearchMode(context, reply = true) {
  let arr = []
  global.searchUsers.forEach(searchUser => {
    if (searchUser.context.user_id !== context.user_id) {
      arr.push(searchUser)
    }
  })
  global.searchUsers = arr
  if (reply) replyMsg(context, `${global.config.searchImage.word.off_reply}`, true)
}

//刷新搜图模式时间
function refreshTimeOfAutoLeave(user_id) {
  global.searchUsers.forEach(searchUser => {
    if (searchUser.context.user_id === user_id) {
      searchUser.surplus_time = global.config.searchImage.autoLeave.time
    }
  })
}

//判断是否是搜图模式
function ifSearchMode(context) {
  let bool = false
  global.searchUsers.forEach(searchUser => {
    if (searchUser.context.user_id === context.user_id) {
      bool = true
    }
  })
  return bool
}

import { add, reduce } from '../pigeon'
import { ascii2d, SauceNAO, IqDB, TraceMoe, EHentai } from 'image_searcher'

//获取通用地址
function getUniversalImgURL(url = '') {
  return url
    .replace('/c2cpicdw.qpic.cn/offpic_new/', '/gchat.qpic.cn/gchatpic_new/')
    .replace(/\/\d+\/+\d+-\d+-/, '/0/0-0-')
    .replace(/\?.*$/, '')
}

async function search(context) {
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
          replyMsg(context, `${global.config.searchImage.word.receive}`, true)
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

        //提前下载好eh图片
        for (let i = 0; i < responseData.length; i++) {
          const datum = responseData[i]
          if (datum.success && datum.name === 'E-Hentai') {
            let limit =
              datum.res.length >= global.config.searchImage.limit
                ? global.config.searchImage.limit
                : datum.res.length
            for (let i = 0; i <= limit - 1; i++) {
              const item = datum.res[i]
              //下载图片
              const fileName = 'base64://'
              const base64 = await downloadFile(
                item.image,
                '',
                '',
                global.config.searchImage.EH_COOKIE,
                true
              )
              item.fileName = fileName + base64
            }
          }
        }

        parse(context, responseData, imageUrl)
        if (global.config.bot.debug) {
          console.log(`搜图完成`)
        }
        //删除文件
        fs.unlinkSync(imagePath)
      } else {
        replyMsg(context, `搜索失败,鸽子不足~`, true)
      }
    }
  })
}

import fs from 'fs'
import fetch from 'node-fetch'
//下载图片
async function downloadFile(url, filePath, fileName, cookie = '', base64 = false) {
  if (!base64 && !fs.existsSync(filePath)) {
    fs.mkdirSync(filePath)
  }
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/octet-stream', cookie }
  })
  if (base64) {
    const resData = await res.arrayBuffer()
    return new Buffer.from(resData, 'binary').toString('base64')
  } else {
    const dest = fs.createWriteStream(`${filePath}/${fileName}`)
    res.body.pipe(dest)
    return new Promise((resolve, reject) => {
      dest.on('finish', resolve)
      dest.on('error', reject)
    })
  }
}

//运行函数防止崩溃
async function request(callbacks) {
  let responseData = []
  for (let i = 0; i < callbacks.length; i++) {
    const item = callbacks[i]
    if (global.config.bot.debug) {
      console.log(`${item.name}搜图中`)
    }
    try {
      responseData.push({
        success: true,
        name: item.name,
        res: await item.callback(item.params)
      })
    } catch (error) {
      if (global.config.bot.debug) {
        console.log(`${item.name}搜图失败`)
        console.log(error)
      }
      responseData.push({ success: false, name: item.name, res: null })
    }
  }
  return responseData
}

//整理数据
function parse(context, res, originUrl) {
  let messages = [
    CQ.node(global.config.bot.botName, context.self_id, CQ.image(originUrl))
  ]
  res.forEach(async datum => {
    if (datum.success) {
      let message = `${datum.name}:\n`
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
              message += `${CQ.image(item.image)}\n图片信息:${item.info}\n链接:${item.source.link
                }\n${item.author && (item.author.text || item.author.link)
                  ? `作者:${item.author.text ? item.author.text : ''}(${item.author.link ? item.author.link : ''
                  })\n`
                  : ''
                }`
              break
            case 'SauceNAO':
              message += `${CQ.image(item.image)}\n标题:${item.title}\n相似度:${item.similarity
                }\n图片信息:\n`
              item.content.forEach((c, index) => {
                if (index % 2) {
                  message += `${c.text}(${c.link})\n`
                } else {
                  message += c.text
                }
              })
              break
            case 'IqDB':
              message += `${CQ.image(item.image)}\n分辨率:${item.resolution}\n相似度:${item.similarity
                }\n链接:${item.url}\n`
              break
            case 'TraceMoe':
              message += `${CQ.image(item.preview)}\n相似度:${item.similarity}\n动漫名:${item.name.native
                }\nNSFW:${item.nsfw}\n文件名:${item.file}\n大概位置:${formatTime(item.from)['minutes']
                }:${formatTime(item.from)['seconds']}——${formatTime(item.to)['minutes']
                }:${formatTime(item.from)['seconds']}\n集数:${item.episode}\n`
              break
            case 'E-Hentai':
              message += `${CQ.image(item.fileName)}\n标题:${item.title}\n时间:${item.date
                }\n类型:${item.type}\n标签:${item.tags.toString()}\n地址:${item.link}`
              break
          }
        }
      }
      messages.push(
        CQ.node(global.config.bot.botName, context.self_id, message.slice(0, -1))
      )
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
  send_forward_msg(context, messages)
}

//时间格式化
export const formatTime = second => {
  const data = global.formatTime(second)
  return data.hours + '小时' + data.minutes + '分钟' + data.seconds + '秒'
}
