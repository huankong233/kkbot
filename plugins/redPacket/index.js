export default async () => {
  event()

  //刷新红包列表
  await freshRedPacketList()
}

//注册事件
function event() {
  RegEvent(
    'message',
    async (event, context, tags) => {
      //开启红包
      get(context)
      if (context.command) {
        if (context.command.name === '鸽子红包') {
          give(context)
        } else if (context.command.name === '剩余红包') {
          getAll(context)
        }
      }
    },
    //最后一个匹配
    -1
  )
}

import { add, reduce } from '../pigeon/index.js'

//我的鸽子
export const give = async context => {
  const params = context.command.params
  if (params.length < 2) {
    return await replyMsg(
      context,
      `红包发送失败,所需参数至少需要两个,发送"${global.config.bot.prefix}帮助 鸽子红包"查看细节`
    )
  }
  const user_id = context.user_id
  //发送的红包数
  const redPacket_num = parseInt(params[0])
  //鸽子数
  const pigeon_num = parseInt(params[1])
  //口令
  const code = params[2] ? params[2] : getRangeCode()
  if (redPacket_num <= 0 || pigeon_num <= 0) {
    return await replyMsg(context, '红包发送失败,红包数量和鸽子数都不能<=0', true)
  }
  //校验合理性
  const pre = pigeon_num / redPacket_num
  if (pre < 1) {
    return await replyMsg(context, '红包发送失败,每个包需要至少一只鸽子', true)
  }
  if (parseInt(pre) !== pre) {
    return await replyMsg(context, '红包发送失败,每个包里的鸽子数需要为整数', true)
  }
  if (!(await reduce(user_id, pigeon_num, `发送鸽子红包_${code}`))) {
    return await replyMsg(context, '红包发送失败,账户鸽子不足', true)
  }

  //插入红包
  await database
    .insert({
      send_user_id: user_id,
      redPacket_num,
      pigeon_num,
      code,
      picked_user: JSON.stringify([])
    })
    .into('red_packet')
  //更新红包列表
  await freshRedPacketList()
  await replyMsg(context, `富哥发红包了!口令:${code}`)
}

export const get = async context => {
  const message = context.message
  const user_id = context.user_id
  for (let i = 0; i < global.redPacketList.length; i++) {
    const item = global.redPacketList[i]
    const pigeon_num = item.pigeon_num
    const redPacket_num = item.redPacket_num
    const picked_user = JSON.parse(item.picked_user)
    //口令不正确
    if (message !== item.code) {
      break
    }
    //领取过
    if (picked_user.indexOf(user_id) !== -1) {
      return await replyMsg(context, '红包领取过了哦,不要贪心啦~')
    }
    //判断剩余红包数(如果剩余1个,全部拿走)
    const get_pigeon_num =
      redPacket_num === 1 ? pigeon_num : randomMaxToMin(pigeon_num * Math.random())
    picked_user.push(user_id)
    await add(user_id, get_pigeon_num, `领取鸽子红包_${item.code}`)
    await database
      .update({
        redPacket_num: redPacket_num - 1,
        pigeon_num: pigeon_num - get_pigeon_num,
        picked_user: JSON.stringify(picked_user)
      })
      .where('id', item.id)
      .from('red_packet')
    await replyMsg(context, `红包${item.code}领取成功,获得${get_pigeon_num}只鸽子~`, true)
    //更新红包列表
    await freshRedPacketList()
  }
}

export const freshRedPacketList = async () => {
  global.redPacketList = await database.select().where('pigeon_num', '!=', 0).from('red_packet')
}

import { getUserName } from '../query/index.js'
export const getAll = async context => {
  if (global.redPacketList.length !== 0) {
    let msg = '剩余红包:'
    global.redPacketList.forEach(item => {
      msg += `\n由${getUserName(item.send_user_id)}发送的口令为:"${item.code}"，剩余${
        item.pigeon_num
      }只鸽子的红包`
    })
    await replyMsg(context, msg.slice(0, -1))
  } else {
    await replyMsg(context, '暂时还没有红包哦~要不你发一个?')
  }
}
