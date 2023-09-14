import fs from 'fs'
import path from 'path'
import logger from './logger.js'
import { jsonc } from 'jsonc'

/**
 * 加载单个配置文件
 * @param {String} configName 配置文件名称
 * @param {Boolean} RegToGlobal 是否注册到全局变量
 * @param {String} configPath 配置文件所在的位置
 * @param {Boolean} forceOverride 是否强制覆盖原有配置文件
 * @param {String} _pluginName 内部实现使用,请勿传入
 */
export function loadConfig(
  configName,
  RegToGlobal = true,
  configPath = `./config`,
  forceOverride = false,
  _pluginName
) {
  const configFullPath = path.join(configPath, `${configName}.jsonc`)

  //获取json内容
  let configData

  try {
    // 检查配置文件是否存在
    if (!fs.existsSync(configFullPath)) {
      // 判断是否存在 default 文件
      if (fs.existsSync(path.join(configPath, `${configName}.default.jsonc`))) {
        logger.WARNING(`插件 ${configPath} 需要手动配置信息`)
      } else if (debug) {
        logger.DEBUG(`插件 ${configPath} 配置的自动加载的配置文件不存在`)
      }
      return 'unloaded'
    }

    configData = jsonc.parse(fs.readFileSync(configFullPath, { encoding: 'utf-8' }))

    if (RegToGlobal) {
      const { config } = global

      // 优先配置文件中配置的配置文件名 然后是传入的插件名 如果插件名也不存在就直接使用配置文件的名称
      const indexName = configData.configName ?? _pluginName ?? configName
      const oldConfig = config[indexName]

      // 如果存在配置文件
      if (oldConfig) {
        const canOverride = forceOverride ? true : oldConfig['override'] ?? false

        if (!canOverride) {
          if (debug) logger.DEBUG(`配置文件 ${configFullPath} 禁止被重写`)
          return 'reject override'
        }
      }

      config[`${indexName}Config`] = configData
      plugins[indexName] = { configPath: configFullPath, ...plugins[indexName] }
    }

    return configData
  } catch (error) {
    logger.WARNING(`配置文件 ${configFullPath} 加载失败,请检查`)
    logger.ERROR(error)
  }
}

/**
 * 加载多个配置文件
 * @param {String[]} configNames 配置文件名称(数组)
 * @param {Boolean} RegToGlobal 是否注册到全局变量
 * @param {String} configPath 配置文件所在的位置
 * @param {Boolean} forceOverride 是否强制覆盖原有配置文件
 */
export function loadConfigs(configNames, RegToGlobal, configPath, forceOverride = false) {
  let config = {}
  for (let i = 0; i < configNames.length; i++) {
    const configName = configNames[i]
    config[configName] = loadConfig(configName, RegToGlobal, configPath, forceOverride)
  }
  return config
}
