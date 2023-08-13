import fs from 'fs'
import path from 'path'
import logger from './logger.js'
import { jsonc } from 'jsonc'

/**
 * 加载单个配置文件
 * @param {String} configName 配置文件名称
 * @param {Boolean} RegToGlobal 是否注册到全局变量
 * @param {String} configPath 配置文件所在的位置
 * @param {String} forceOverride 是否强制覆盖原有配置文件
 * @returns {JSON} 配置文件
 */
export function loadConfig(
  configName,
  RegToGlobal = true,
  configPath = `./config`,
  forceOverride = false
) {
  // 判断config
  if (!global.config) {
    global.config = {}
  }

  const { config } = global

  //获取json内容
  let configData

  try {
    configPath = path.join(configPath, `${configName}.jsonc`)
    configData = jsonc.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }))

    if (RegToGlobal) {
      // 优先配置文件中配置的配置文件名 然后是传入的插件名 如果插件名也不存在就直接使用配置文件的名称
      const indexName = configData.configName ?? global.nowLoadPluginName ?? configName
      const oldConfig = config[indexName]
      global.nowLoadPluginName = null

      // 如果存在配置文件
      if (oldConfig) {
        const canOverride = forceOverride ? true : oldConfig['override'] ?? false

        if (!canOverride) {
          if (debug) logger.DEBUG(`配置文件 ${configPath} 禁止被重写`)
          return 'reject override'
        }
      }

      config[indexName] = { ...configData, configPath }
    }

    return configData
  } catch (error) {
    logger.WARNING(`配置文件 ${configName} 加载失败,请检查`)
    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
  }
}

/**
 * 加载多个配置文件
 * @param {Array} configNames 配置文件名称(数组)
 * @param {Boolean} RegToGlobal 是否注册到全局变量
 * @param {String} configPath 配置文件所在的位置
 * @returns {Object} 配置文件(对象)
 */
export function loadConfigs(configNames, RegToGlobal, configPath, forceOverride = false) {
  let config = {}
  for (let i = 0; i < configNames.length; i++) {
    const configName = configNames[i]
    config[configName] = loadConfig(configName, RegToGlobal, configPath, forceOverride)
  }
  return config
}
