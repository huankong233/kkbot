export default () => {
  return {
    randomMaxToMin,
    getRangeCode
  }
}

/**
 * 随机数
 * @param {Number} max
 * @param {Number} min
 */
export const randomMaxToMin = (max, min = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 随机x位字符串
 * @param {Number} len
 */
export const getRangeCode = (len = 6) => {
  var orgStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let returnStr = ''
  for (var i = 0; i < len; i++) {
    returnStr += orgStr.charAt(Math.floor(Math.random() * orgStr.length))
  }
  return returnStr
}
