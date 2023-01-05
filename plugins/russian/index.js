export default () => {
  loadConfig('russian.jsonc', true)

  global.russian = {}

  event()
}

//注册事件
function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === '装弹') {
        createGame(context)
      } else if (context.command.name === '接受比赛') {
        acceptGame(context)
      } else if (context.command.name === '射击') {
        shot(context)
      } else if (context.command.name === '非酋榜') {
        feiqiu(context)
      } else if (context.command.name === '欧皇榜') {
        ouhuang(context)
      } else if (context.command.name === '我的战绩') {
        my(context)
      }
    }
  })
}

import { add, reduce } from '../pigeon'
import { isToday } from '../gugu'

async function createGame(context) {
  const params = context.command.params
  if (params.length < 2) {
    return replyMsg(context, '参数不足,请发送/帮助 装弹查看详细信息')
  }

  if (global.russian.from_id) {
    //正在有游戏进行中
    return replyMsg(context, '有一场比赛在进行中')
  }

  const user_id = context.user_id
  //判断有没有到上限了
  const count_data = await database.select().where('user_id', user_id).from('russian')
  if (count_data.length === 0) {
    //第一次参加比赛
    await database.insert({ user_id }).into('russian')
    await createGame(context)
  } else {
    let count = count_data[0].count
    if (count >= global.config.russian.limit) {
      //超出配额
      if (!isToday(count_data[0].update_time)) {
        //判断时间
        return replyMsg(context, `每次最多只能玩${global.config.russian.limit}次哦~`)
      } else {
        await database
          .update({
            count: 0,
            update_time: Date.now()
          })
          .where('user_id', user_id)
          .into('russian')
      }
    }

    const mag = parseInt(params[0])
    const pigeon = parseInt(params[1])

    if (pigeon > global.config.russian.max) {
      return replyMsg(context, `每次最多只能${global.config.russian.max}只鸽子哦~`)
    }

    //判断用户能否发起
    if (pigeon < 100) {
      return replyMsg(context, '至少需要100只鸽子哦~')
    }
    if (!(await reduce(user_id, pigeon, '参加比赛'))) {
      return replyMsg(context, '你的鸽子不足哦~')
    }

    //判断子弹数量
    if (mag > global.config.russian.mag - 2) {
      return replyMsg(context, `子弹数不能大于${global.config.russian.mag - 2}`)
    }
    if (mag <= 0) {
      return replyMsg(context, `子弹怎么样也要有一颗吧（`)
    }

    global.russian = {
      start: false,
      end: false,
      from_id: user_id,
      to_id: null,
      mag,
      addon: pigeon,
      shot_index: 0,
      last_user: 0,
      time: global.config.russian.time
    }

    global.russian.wait_id = setInterval(async () => {
      if (global.russian.time === 0) {
        replyMsg(context, '超时咯,鸽子已退回~')
        global.russian = {}
        await add(user_id, pigeon, '比赛超时')
        clearInterval(global.russian.wait_id)
      }
      global.russian.time--
    }, 1000)

    replyMsg(context, '回复接受比赛就可以加入比赛啦~')
  }
}

async function acceptGame(context) {
  const user_id = context.user_id
  //判断有没有到上限了
  const count_data = await database.select().where('user_id', user_id).from('russian')
  if (count_data.length === 0) {
    //第一次参加比赛
    await database.insert({ user_id }).into('russian')
    await acceptGame(context)
  } else {
    let count = count_data[0].count
    if (count >= global.config.russian.limit) {
      //超出配额
      if (!isToday(count_data[0].update_time)) {
        //判断时间
        return replyMsg(context, `每次最多只能玩${global.config.russian.limit}次哦~`)
      } else {
        await database
          .update({
            count: 0,
            update_time: Date.now()
          })
          .where('user_id', user_id)
          .into('russian')
      }
    }

    if (!global.russian.from_id) {
      //没有游戏进行中
      return replyMsg(context, '没有比赛在进行中~')
    }

    if (global.russian.to_id !== null) {
      //没有游戏进行中
      return replyMsg(context, '不要捣乱啦~', true)
    }

    if (global.russian.from_id === context.user_id) {
      return replyMsg(context, '不可以和自己比赛哦~')
    }

    //判断用户能否发起
    if (!(await reduce(user_id, global.russian.addon, '参加比赛'))) {
      return replyMsg(context, '你的鸽子不足哦~')
    }

    replyMsg(context, '加入比赛成功~')
    clearInterval(global.russian.wait_id)

    //加入
    global.russian.to_id = user_id

    const id = setTimeout(() => {
      startGame(context)
      clearInterval(id)
    }, 500)
  }
}

async function startGame(context) {
  //扣除双方机会
  const count_from =
    (await database.select().where('user_id', global.russian.from_id).from('russian'))[0]
      .count + 1
  //更新数据
  await database
    .update({
      count: count_from,
      update_time: Date.now()
    })
    .where('user_id', global.russian.from_id)
    .into('russian')
  //扣除双方机会
  const count_to =
    (await database.select().where('user_id', global.russian.to_id).from('russian'))[0]
      .count + 1
  //更新数据
  await database
    .update({
      count: count_to,
      update_time: Date.now()
    })
    .where('user_id', global.russian.to_id)
    .into('russian')

  //生成弹夹
  let temp = []
  for (let i = 0; i < global.config.russian.mag; i++) {
    temp.push('_')
  }
  let index = 0
  while (index < global.russian.mag) {
    let temp_index = parseInt(Math.random() * (temp.length - 1))
    if (temp[temp_index] !== '*') {
      temp[temp_index] = '*'
      index++
    }
  }
  await replyMsg(
    context,
    `子弹已经入膛了哦~\n子弹情况${global.russian.mag}/${global.config.russian.mag}\n发送射击来打响第一枪吧!`
  )

  global.russian.mag = temp

  //刷新一个计时器
  global.russian.time = global.config.russian.time
  global.russian.wait_id = setInterval(async () => {
    if (global.russian.time === 0) {
      replyMsg(
        context,
        '超时咯,上一回合射击者获胜~(如果没有人开枪就都返还了哦~需要扣除手续费)'
      )
      if (global.russian.last_user === 0) {
        let addon = Math.ceil(global.russian.addon * (1 - global.config.russian.clip))
        await add(global.russian.from_id, addon, '比赛超时')
        await add(global.russian.to_id, addon, '比赛超时')
      } else {
        let addon = Math.ceil(global.russian.addon * 2 * (1 - global.config.russian.clip))
        await add(global.russian.last_user, addon, '比赛超时')
      }
      clearInterval(global.russian.wait_id)
      global.russian = {}
    }
    global.russian.time--
  }, 1000)

  global.russian.start = true
}

import { getUserName } from '../query'

async function shot(context) {
  const user_id = context.user_id
  if (!global.russian.from_id) {
    //正在有游戏进行中
    return replyMsg(context, '没有比赛在进行中~')
  }

  //判断用户是否是游戏内用户
  if (user_id !== global.russian.from_id && user_id !== global.russian.to_id) {
    return replyMsg(context, '可以观看比赛，但是不要打乱比赛哦~')
  }

  //判断是否已经开始
  if (!global.russian.start) {
    return replyMsg(context, '比赛正在等待对手哦~')
  }

  //判断是否已经结束
  if (global.russian.end) {
    return replyMsg(context, '比赛已经结束~正在结算中~')
  }

  //先手
  if (global.russian.mag[global.russian.shot_index] === '*') {
    global.russian.end = true
    replyMsg(context, '中枪咯~')
    let addon = Math.ceil(global.russian.addon * 2 * (1 - global.config.russian.clip))
    if (global.russian.from_id === context.user_id) {
      await add(global.russian.to_id, addon, '比赛获胜')
      replyMsg(
        context,
        `${await getUserName(global.russian.to_id)}获胜啦~\n获得了${addon}只鸽子~`
      )
      await database
        .insert({
          from_id: global.russian.from_id,
          to_id: global.russian.to_id,
          win: true,
          addon,
          mag: global.russian.mag.join(' ')
        })
        .into('russian_history')
    } else {
      global.russian.end = true
      await add(global.russian.from_id, addon, '比赛获胜')
      replyMsg(
        context,
        `${await getUserName(global.russian.from_id)}获胜啦~\n获得了${addon}只鸽子~`
      )
      await database
        .insert({
          from_id: global.russian.from_id,
          to_id: global.russian.to_id,
          win: false,
          addon,
          mag: global.russian.mag.join(' ')
        })
        .into('russian_history')
    }
    replyMsg(context, `子弹排布(*为子弹):\n${global.russian.mag.join(' ')}`)
    clearInterval(global.russian.wait_id)
    global.russian = {}
  } else {
    replyMsg(context, '幸运女神站在了你这边!')
    global.russian.time = global.config.russian.time
    global.russian.shot_index++
    global.russian.last_user = context.user_id
  }
}

async function feiqiu(context) {
  let list = {}
  const data = await database.select().from('russian_history')
  data.forEach(datum => {
    if (datum.win) {
      if (!list[datum.from_id]) {
        list[datum.from_id] = {
          round: 0,
          pigeon: 0
        }
      }
      list[datum.from_id].round++
      list[datum.from_id].pigeon += datum.addon
    } else {
      if (!list[datum.to_id]) {
        list[datum.to_id] = {
          round: 0,
          pigeon: 0
        }
      }
      list[datum.to_id].round++
      list[datum.to_id].pigeon += datum.addon
    }
  })

  list = object2arr(list)
  list = compare(list, 'pigeon')

  let message = '非酋榜:\n'
  let length
  if (list.length >= 10) {
    length = 10
  } else {
    length = list.length
  }
  for (let index = 0; index < length; index++) {
    const item = list[index]
    message += `${index + 1}:${await getUserName(item.user_id)}在${item.round}次失败中输掉了${item.pigeon
      }只鸽子\n`
  }
  await replyMsg(context, message.slice(0, -1))
}

async function ouhuang(context) {
  let list = {}
  const data = await database.select().from('russian_history')
  data.forEach(datum => {
    if (datum.win) {
      if (!list[datum.to_id]) {
        list[datum.to_id] = {
          round: 0,
          pigeon: 0
        }
      }
      list[datum.to_id].round++
      list[datum.to_id].pigeon += datum.addon
    } else {
      if (!list[datum.from_id]) {
        list[datum.from_id] = {
          round: 0,
          pigeon: 0
        }
      }
      list[datum.from_id].round++
      list[datum.from_id].pigeon += datum.addon
    }
  })

  list = object2arr(list)
  list = compare(list, 'pigeon')

  let message = '欧皇榜:\n'
  let length
  if (list.length >= 10) {
    length = 10
  } else {
    length = list.length
  }
  for (let index = 0; index < length; index++) {
    const item = list[index]
    message += `${index + 1}:${await getUserName(item.user_id)}在${item.round}次胜利中获得了${item.pigeon
      }只鸽子\n`
  }
  await replyMsg(context, message.slice(0, -1))
}

async function my(context) {
  const user_id = context.user_id
  const data = await database
    .select()
    .where('from_id', user_id)
    .orWhere('to_id', user_id)
    .from('russian_history')
  let win = {
    round: 0,
    pigeon: 0
  }
  let loss = {
    round: 0,
    pigeon: 0
  }
  data.forEach(datum => {
    //from获胜
    if (datum.win) {
      if (datum.from_id === user_id) {
        win.round++
        win.pigeon += datum.addon
      } else {
        loss.round++
        loss.pigeon += datum.addon
      }
    } else {
      if (datum.from_id === user_id) {
        loss.round++
        loss.pigeon += datum.addon
      } else {
        win.round++
        win.pigeon += datum.addon
      }
    }
  })
  replyMsg(
    context,
    `你共获胜了${win.round}场，获得了${win.pigeon}只鸽子\n你共失败了${loss.round}场，失去了${loss.pigeon}只鸽子`
  )
}

function object2arr(object) {
  let temp = []
  for (const key in object) {
    if (Object.hasOwnProperty.call(object, key)) {
      const item = object[key]
      temp.push({
        user_id: key,
        ...item
      })
    }
  }
  return temp
}

function compare(list, property) {
  return Array.from(list).sort((a, b) =>
    a[property] < b[property] ? 1 : a[property] > b[property] ? -1 : 0
  )
}
