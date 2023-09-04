import { getTime } from './time.js'
import clc from 'cli-color'

export class Logger {
  /**
   * 创建日志记录对象
   * @param {{pluginName:String,subModule:String,type:String}} params
   */
  constructor(params) {
    const { pluginName, subModule, type = 'PLUGIN' } = params
    this.pluginName = pluginName
    this.subModule = subModule
    this.type = type.toUpperCase()
  }

  /**
   * 统一格式输出到控制台
   * @param  {...any} messages
   */
  INFO(...messages) {
    this.print(clc.blue(`[INFO]`), messages.join(' '))
  }

  /**
   * 统一格式输出到控制台
   * @param  {...any} messages
   */
  SUCCESS(...messages) {
    this.print(clc.green(`[SUCCESS]`), messages.join(' '))
  }

  /**
   * 统一格式输出到控制台
   * @param  {...any} messages
   */
  WARNING(...messages) {
    this.print(clc.red(`[WARNING]`), clc.redBright(messages.join(' ')))
  }

  /**
   * 统一格式输出到控制台
   * @param  {...any} messages
   */
  NOTICE(...messages) {
    this.print(clc.yellow(`[NOTICE]`), messages.join(' '))
  }

  /**
   * 统一格式输出到控制台
   * @param  {...any} messages
   */
  DEBUG(...messages) {
    this.print(clc.magenta(`[DEBUG]`), ...messages)
  }

  /**
   * 用于在正确的模式输出报错
   * @param {...any} messages
   */
  ERROR(...messages) {
    global.debug ? this.DEBUG('\n', ...messages) : this.WARNING(...messages)
  }

  print(...params) {
    let messages

    if (Array.isArray(params)) {
      messages = params
    } else if (typeof messages === 'string') {
      messages = [messages]
    }

    let type = this.type
    type += this.pluginName ? `:${this.pluginName}` : ''
    type += this.subModule ? `=>${this.subModule}` : ''

    console.log(clc.cyan(`[${getTime()}]`), clc.blackBright(`[${type}]`), ...messages)
  }
}

/**
 * 构造一个logger输出
 * @param {{pluginName:String,subModule:String,type:String}} params
 */
export function makeLogger(params) {
  return new Logger(params)
}

/**
 * 构造一个系统logger输出
 * @param {{pluginName:String,subModule:String,type:String}} params
 */
export function makeSystemLogger(params) {
  return new Logger({ ...params, type: 'SYSTEM' })
}

export const logger = makeSystemLogger({ pluginName: 'UNKNOW' })

export default logger
