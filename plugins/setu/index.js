export default () => {
  loadConfig('setu.jsonc', true)

  event()
}

function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      const match = context.command.name.match(global.config.setu.reg)
      if (match) {
        await setu(context, match)
      }
    }
  })
}

import { reduce } from '../pigeon/index.js'
import { isToday } from '../gugu/index.js'
import { imgAntiShielding } from './AntiShielding.js'
import Jimp from 'jimp'
import req from 'node-fetch'

export const setu = async (context, match) => {
  const user_id = context.user_id
  //判断有没有到上限了
  let count_data = await database.select().where('user_id', user_id).from('setu')
  if (count_data.length === 0) {
    //第一次看色图()
    await database.insert({ user_id }).into('setu')
    await setu(context, match)
  } else {
    let count = count_data[0].count
    if (count >= global.config.setu.limit) {
      //超出配额
      if (!isToday(count_data[0].update_time)) {
        //判断时间
        return await replyMsg(context, CQ.image('https://api.lolicon.app/assets/img/lx.jpg'))
      } else {
        //如果不是今天
        count = 1
      }
    } else {
      count++
    }

    if (!(await reduce(context.user_id, global.config.setu.pigeon, '看色图'))) {
      return await replyMsg(context, '你的鸽子不够哦~')
    }

    const data = {
      r18: match[1] ? 1 : 0,
      tag: [],
      proxy: global.config.setu.proxy.enable ? global.config.setu.proxy.url : 'i.pximg.net'
    }
    if (match[2]) {
      const groupOut = match[2].split('&amp;')
      groupOut.forEach(item => {
        const groupIn = item.split('|')
        data.tag.push(groupIn)
      })
    }

    let responseData

    try {
      responseData = (await fetch('https://api.lolicon.app/setu/v2', data, 'POST')).data
    } catch (error) {
      await replyMsg(context, '色图服务器爆炸惹')
      await reduce(context.user_id, global.config.setu.pigeon, '色图加载失败')
      return 0
    }

    if (responseData.length === 0) {
      return await replyMsg(context, '换个标签试试吧~')
    } else {
      responseData = responseData[0]
    }

    let shortUrlData

    try {
      shortUrlData = await fetch(
        `https://url.huankong.top/api/url?url=https://www.pixiv.net/artworks/${responseData.pid}`,
        {},
        'GET'
      )
    } catch (error) {
      await replyMsg(context, '短链服务器爆炸惹')
      await reduce(context.user_id, global.config.setu.pigeon, '色图加载失败')
      return 0
    }

    const info_data = [
      `标题:${responseData.title}`,
      `作品地址:${shortUrlData.url}`,
      '图片还在路上哦~坐和放宽~'
    ].join('\n')
    const info_message = await replyMsg(context, info_data, false)

    let image

    try {
      image = await req(responseData.urls.original, {
        headers: { Referer: 'https://www.pixiv.net/' }
      }).then(res => res.arrayBuffer())
    } catch (error) {
      await replyMsg(context, '图片获取失败惹')
      await reduce(context.user_id, global.config.setu.pigeon, '色图加载失败')
      return 0
    }

    let base64

    try {
      //反和谐
      const img = await Jimp.read(Buffer.from(image))
      base64 = await imgAntiShielding(img, global.config.setu.antiShieldingMode)
    } catch (error) {
      await replyMsg(context, '反和谐失败惹')
      await reduce(context.user_id, global.config.setu.pigeon, '色图加载失败')
      return 0
    }

    const message = await replyMsg(context, CQ.image(`base64://${base64}`), false)

    if (message.status === 'failed') {
      await replyMsg(context, '色图发送失败')
      await reduce(context.user_id, global.config.setu.pigeon, '色图加载失败')
    } else {
      //更新数据
      await database
        .update({
          count,
          update_time: Date.now()
        })
        .where('user_id', user_id)
        .into('setu')

      setTimeout(async () => {
        //撤回消息
        await bot('delete_msg', {
          message_id: message.data.message_id
        })
        await bot('delete_msg', {
          message_id: info_message.data.message_id
        })
      }, global.config.setu.withdraw * 1000)
    }
  }
}
