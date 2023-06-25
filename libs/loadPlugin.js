import { logger } from './logger.js'
import { pathToFileURL } from 'url'

/**
 * 加载单个插件
 * @param {String} pluginName 插件名
 */
export async function loadPlugin(pluginName, pluginDir = 'plugins') {
  const { debug } = global

  let program

  try {
    program = await import(pathToFileURL(`${global.baseDir}/${pluginDir}/${pluginName}/index.js`))
  } catch (error) {
    logger.WARNING(`插件${pluginName}不存在`)
    if (debug) logger.DEBUG(error)
    return
  }

  if (program.enable === false) {
    logger.NOTICE(`插件${pluginName}未启用`)
    return
  }

  if (!global.pluginNames) {
    global.pluginNames = []
  }

  if (global.pluginNames.indexOf(pluginName) !== -1) {
    if (debug) logger.NOTICE(`插件${pluginName}已经加载过了`)
    return
  }

  global.pluginNames.push(pluginName)

  if (!program.default) {
    logger.WARNING(`加载插件${pluginName}失败，插件不存在默认导出函数`)
    return
  }

  try {
    global.nowLoadPluginName = pluginName
    await program.default()
    global.nowLoadPluginName = ''
    logger.SUCCESS(`加载插件${pluginName}成功`)
  } catch (error) {
    logger.WARNING(`加载插件${pluginName}失败，失败日志：`)
    if (debug) logger.DEBUG(error)
    return
  }
}

/**
 * 加载多个插件
 * @param {Array} plugins
 */
export async function loadPlugins(plugins, pluginDir = 'plugins') {
  for (const pluginName of plugins) {
    await loadPlugin(pluginName, pluginDir)
  }
}

import { readdirSync } from 'fs'
/**
 * 加载指定文件夹中的所有插件
 * @param {String} pluginDir
 */
export async function loadPluginDir(pluginDir) {
  //获取文件夹内文件
  let plugins
  try {
    plugins = readdirSync(pluginDir)
  } catch (error) {
    logger.WARNING('获取文件夹内容失败,文件夹可能不存在')
    return
  }

  await loadPlugins(plugins, pluginDir)
}
