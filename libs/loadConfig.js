import fs from 'fs'
import { jsonc } from 'jsonc'
import { logger } from './logger.js'

/**
 * 加载单个配置文件
 * @param {String} configName 配置文件名称
 * @param {Boolean} RegToGlobal 是否注册到全局变量
 * @returns {JSON} 配置文件
 */
export function loadConfig(configName, RegToGlobal = true) {
  //获取json内容
  let config
  try {
    config = jsonc.parse(fs.readFileSync(`./config/${configName}.jsonc`).toString())

    if (!global.config) {
      global.config = {}
    }

    if (RegToGlobal) {
      global.config[config.configName ?? configName] = config
    }

    return config
  } catch (error) {
    logger.WARNING(`配置文件${configName}加载失败,请检查`)
    if (global.debug) logger.DEBUG(error)
  }
}

/**
 * 加载多个配置文件
 * @param {Array} configNames 配置文件名称(数组)
 * @param {Boolean} RegToGlobal 是否注册到全局变量
 * @returns {Object} 配置文件(对象)
 */
export function loadConfigs(configNames, RegToGlobal) {
  let config = {}
  for (let i = 0; i < configNames.length; i++) {
    const configName = configNames[i]
    config[configName] = loadConfig(configName, RegToGlobal)
  }
  return config
}
