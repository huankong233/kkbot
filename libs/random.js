/**
 * 随机x位字符串
 * @param {Number} len
 */
export function getRangeCode(len = 6) {
  const orgStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let returnStr = ''
  for (let i = 0; i < len; i++) {
    returnStr += orgStr.charAt(Math.floor(Math.random() * orgStr.length))
  }
  return returnStr
}

/**
 * 生成随机整数
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
export function randomInt(min = 0, max = 1) {
  // 确保min和max都是整数
  min = Math.ceil(min)
  max = Math.floor(max)
  // 使用Math.random()和Math.floor()计算随机整数
  return Math.floor(Math.random() * (max - min + 1)) + min
}
