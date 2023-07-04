import fs from 'fs'
import path from 'path'
import { jsonc } from 'jsonc'
import { logger } from './logger.js'

/**
 * 加载单个配置文件
 * @param {String} configName 配置文件名称
 * @param {Boolean} RegToGlobal 是否注册到全局变量
 * @param {String} configPath 配置文件所在的位置
 * @param {String} _pluginName 用于在插件加载时自动加载配置文件(手动加载请勿使用此参数!!!)
 * @returns {JSON} 配置文件
 */
export function loadConfig(
  configName,
  RegToGlobal = true,
  configPath = `./config`,
  _pluginName = null
) {
  //获取json内容
  let config

  try {
    config = jsonc.parse(
      fs.readFileSync(path.join(configPath, `${configName}.jsonc`), { encoding: 'utf-8' })
    )

    if (!global.config) {
      global.config = {}
    }

    if (RegToGlobal) {
      const index = config.configName ?? _pluginName ?? configName
      if (global.config[index]) {
        if (debug) logger.DEBUG(`配置${index}已经存在了,不允许重复加载!`)
        return
      }
      // 优先配置文件中配置的配置文件名 然后是传入的插件名 如果插件名也不存在就直接使用配置文件的名称
      global.config[index] = config
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
 * @param {String} configPath 配置文件所在的位置
 * @returns {Object} 配置文件(对象)
 */
export function loadConfigs(configNames, RegToGlobal, configPath) {
  let config = {}
  for (let i = 0; i < configNames.length; i++) {
    const configName = configNames[i]
    config[configName] = loadConfig(configName, RegToGlobal, configPath)
  }
  return config
}
