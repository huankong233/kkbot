export const logger = {
  INFO,
  SUCCESS,
  WARNING,
  NOTICE,
  DEBUG
}

export default logger

import clc from 'cli-color'

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function INFO(...message) {
  console.log(clc.cyan(`[${getTime()}]`), clc.blue(`[INFO]`), message.join(' '))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function SUCCESS(...message) {
  console.log(clc.cyan(`[${getTime()}]`), clc.green(`[SUCCESS]`), message.join(' '))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function WARNING(...message) {
  console.log(clc.cyan(`[${getTime()}]`), clc.red(`[WARNING]`), clc.redBright(message.join(' ')))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function NOTICE(...message) {
  console.log(clc.cyan(`[${getTime()}]`), clc.yellow(`[NOTICE]`), message.join(' '))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function DEBUG(...message) {
  console.log(clc.cyan(`[${getTime()}]`), clc.magenta(`[DEBUG]`), ...message)
}

/**
 * 获取时间
 * @returns 2023/6/26 09:46:39
 */
export function getTime() {
  return new Date().toLocaleString()
}
