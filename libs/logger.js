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
  print(clc.blue(`[INFO]`), message.join(' '))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function SUCCESS(...message) {
  print(clc.green(`[SUCCESS]`), message.join(' '))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function WARNING(...message) {
  print(clc.red(`[WARNING]`), clc.redBright(message.join(' ')))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function NOTICE(...message) {
  print(clc.yellow(`[NOTICE]`), message.join(' '))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function DEBUG(...message) {
  if (global.debug) {
    print(clc.magenta(`[DEBUG]`), ...message)
  } else {
    throw new Error('请检查,避免在非DEBUG模式使用DEBUG模式输出!')
  }
}

function print(...message) {
  console.log(
    clc.cyan(`[${getTime()}]`),
    clc.black(`[${`${global.nowPlugin ?? global.nowLoadPluginName ?? 'SYSTEM'}`.toUpperCase()}]`),
    ...message
  )
}

/**
 * 获取时间
 * @returns 2023/6/26 09:46:39
 */
export const getTime = () => new Date().toLocaleString()
