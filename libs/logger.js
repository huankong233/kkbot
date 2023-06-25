export const logger = {
  info: INFO,
  INFO,
  success: SUCCESS,
  SUCCESS,
  warning: WARNING,
  WARNING,
  notice: NOTICE,
  NOTICE,
  debug: DEBUG,
  DEBUG
}

import clc from 'cli-color'

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function INFO(...message) {
  console.log(clc.blue(`[INFO]`), message.join(' '))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function SUCCESS(...message) {
  console.log(clc.green(`[SUCCESS]`), message.join(' '))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function WARNING(...message) {
  console.log(clc.red(`[WARNING]`), clc.redBright(message.join(' ')))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function NOTICE(...message) {
  console.log(clc.yellow(`[NOTICE]`), message.join(' '))
}

/**
 * 统一格式输出到控制台
 * @param  {...String} message
 */
export function DEBUG(...message) {
  console.log(clc.magenta(`[DEBUG]`), ...message)
}
