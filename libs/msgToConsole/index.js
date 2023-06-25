/**
 * 统一格式输出到控制台
 * @param {String} message 信息
 */
import clc from 'cli-color'
export function msgToConsole(message, type = 'INFO') {
  switch (type) {
    case 'INFO':
      type = clc.blue(`[${type}]`)
      break
    case 'SUCCESS':
      type = clc.green(`[${type}]`)
      break
    case 'WARNING':
    case 'FAIL':
      type = clc.red(`[${type}]`)
      break
    case 'DEBUG':
      type = clc.magenta(`[${type}]`)
      break
    case 'NOTICE':
      type = clc.yellow(`[${type}]`)
      break
    default:
      type = clc.black(`[${type}]`)
      break
  }
  console.log(type, message)
}
