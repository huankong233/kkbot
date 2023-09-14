/**
 * 格式化时间,将秒转换为HH:MM:SS的格式
 * @param {Number} ms
 * @returns {Object}
 */
export function formatTime(ms) {
  // 使用padStart方法补零
  let _seconds = Math.floor(ms / 1000) // 毫秒转秒
  let hours = Math.floor(_seconds / 3600)
    .toString()
    .padStart(2, '0')
  let minutes = Math.floor((_seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  let seconds = (_seconds % 60).toString().padStart(2, '0')
  // 返回HH:MM:SS的字符串
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 判断时间戳是否是今天的
 * @param {Number} timestamp
 * @returns {Boolean} `true`  是今天
 * @returns {Boolean} `false` 不是今天
 */
export function isToday(timestamp) {
  // 获取当前的时间戳
  let now = Date.now()
  // 创建一个 Date 对象，用来获取今天的日期
  let today = new Date(now)
  // 将今天的日期设置为 0 时 0 分 0 秒 0 毫秒，即今天的起始时间
  today.setHours(0, 0, 0, 0)
  // 获取今天的起始时间戳
  let start = today.getTime()
  // 如果参数的时间戳大于等于今天的起始时间戳，并且小于明天的起始时间戳，说明是今天
  if (timestamp >= start && timestamp < start + 24 * 60 * 60 * 1000) {
    return true
  } else {
    return false
  }
}

/**
 * 获取时间
 * @returns {String} 2023/6/26 09:46:39
 */
export const getTime = () => new Date().toLocaleString()

/**
 * 计算运行指定函数耗时
 * @param {Function} func
 * @returns {{response:any,time:Number}}
 */
export const countRunTime = async func => {
  const start = performance.now()
  response = await func()
  const end = performance.now()
  return {
    response,
    time: parseInt(end - start)
  }
}
