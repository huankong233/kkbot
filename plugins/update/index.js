export default async () => {
  await loadConfig('update.jsonc', true)
  event()
}

//注册事件
async function event() {
  if (global.config.update.enable) {
    await checkUpdate()
    global.config.update.id = setInterval(async () => {
      await checkUpdate()
    }, global.config.update.hz)
  }
}

//检查更新
import fs from 'fs'
async function checkUpdate() {
  const { proxy, url } = global.config.update
  const remote_version = (await fetch(proxy + url)).version
  const local_version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version
  if (compairVersion(remote_version, local_version)) {
    //需要更新，通知admin
    await sendMsg(
      global.config.bot.admin,
      ['kkbot有更新哟~', `最新版本${remote_version} | 当前版本${local_version}`].join('\n')
    )
    clearInterval(global.config.update.id)
  }
}

/**
 * 对比字符串版本号的大小，返回1则v1大于v2，返回-1则v1小于v2，返回0则v1等于v2
 * @param {string} v1 要进行比较的版本号1
 * @param {string} v2 要进行比较的版本号2
 * @returns
 */
function compairVersion(v1, v2) {
  //补位0，或者使用其它字符
  const ZERO_STR = '000000000000000000000000000000000000000000'
  if (v1 === v2) {
    return 0
  }
  let len1 = v1 ? v1.length : 0
  let len2 = v2 ? v2.length : 0
  if (len1 === 0 && len2 === 0) {
    return 0
  }
  if (len1 === 0) {
    return 1
  }
  if (len2 === 0) {
    return -1
  }
  const arr1 = v1.split('.')
  const arr2 = v2.split('.')
  const length = Math.min(arr1.length, arr2.length)
  for (let i = 0; i < length; i++) {
    let a = arr1[i]
    let b = arr2[i]
    if (a.length < b.length) {
      a = ZERO_STR.substr(0, b.length - a.length) + a
    } else if (a.length > b.length) {
      b = ZERO_STR.substr(0, a.length - b.length) + b
    }
    if (a < b) {
      return 1
    } else if (a > b) {
      return -1
    }
  }
  if (arr1.length < arr2.length) {
    return 1
  } else if (arr1.length > arr2.length) {
    return -1
  }
  return 0
}
