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

import { reduce } from '../pigeon'
import { isToday } from '../gugu'
import { imgAntiShielding } from './AntiShielding'
import Jimp from 'jimp'
import fetch from 'node-fetch'

async function setu(context, match) {
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
        return replyMsg(
          context,
          CQ.image('https://api.lolicon.app/assets/img/lx.jpg')
        )
      } else {
        //如果不是今天
        count = 1
      }
    } else {
      count++
    }

    if (!(await reduce(context.user_id, global.config.setu.pigeon, '看色图'))) {
      return replyMsg(context, '你的鸽子不够哦~')
    }

    const data = {
      r18: match[1] ? 1 : 0,
      tag: []
    }
    if (match[2]) {
      const groupOut = match[2].split('&amp;')
      groupOut.forEach(item => {
        const groupIn = item.split('|')
        data.tag.push(groupIn)
      })
    }
    try {
      let responseData = (await fetch('https://api.lolicon.app/setu/v2', data, 'POST')).data
      if (responseData.length === 0) {
        return replyMsg(context, '换个标签试试吧~')
      } else {
        responseData = responseData[0]
      }
      const shortUrlData = (
        await fetch(
          `https://url.huankong.top/api/url?url=https://www.pixiv.net/artworks/${responseData.pid}`, {}, 'POST'
        )
      )
      //反和谐
      const img = await Jimp.read(
        Buffer.from(
          await fetch(responseData.urls.original).then(res => res.arrayBuffer())
        )
      )
      const base64 = await imgAntiShielding(img, global.config.setu.antiShieldingMode)
      const message_data = `${CQ.image(`base64://${base64}`)}\n标题:${responseData.title
        }\n作品地址:${shortUrlData.url}`
      const message = await replyMsg(context, message_data, false)
      if (message.status === 'ok') {
        setTimeout(() => {
          //撤回消息
          bot('delete_msg', {
            message_id: message.data.message_id
          })
        }, global.config.setu.withdraw * 1000)
      }
      if (message.status === 'failed') {
        replyMsg(context, '色图发送失败(')
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
      }
    } catch (error) {
      replyMsg(context, '色图发送失败(')
      await reduce(context.user_id, global.config.setu.pigeon, '色图加载失败')
      if (global.config.bot.debug) {
        console.log(error)
      }
    }
  }
}
