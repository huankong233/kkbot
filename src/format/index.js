export default () => {
  return {
    format
  }
}

/**
 * 格式化信息，提取参数和命令名
 * @param {String} message
 */
export const format = message => {
  const prefix = global.config.bot.prefix
  //去头去尾空格
  message = message.trim()
  if (prefix === '' || message[0] === prefix) {
    //空格分割
    let data = message.split(' ').filter(value => {
      return value === '' ? false : value
    })
    return {
      name: data[0].replace(prefix, ''),
      params: data.slice(1, data.length)
    }
  } else {
    return false
  }
}
