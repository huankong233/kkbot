import { msgToConsole } from '../msgToConsole/index.js'
import { pathToFileURL } from 'url'

/**
 * 加载单个插件
 * @param {String} pluginName 插件名
 */
export async function loadPlugin(pluginName) {
  let program

  try {
    program = await import(pathToFileURL(`${global.baseDir}/plugins/${pluginName}/index.ts`))
  } catch (error) {
    msgToConsole(`插件${pluginName}不存在`)
    console.log(error)
    return
  }

  if (program.enable === false) {
    msgToConsole(`插件${pluginName}未启用`)
    return
  }

  if (!global.pluginNames) {
    global.pluginNames = []
  }

  if (global.pluginNames.indexOf(pluginName) !== -1) {
    msgToConsole(`插件${pluginName}已经加载过了`)
    return
  }

  global.pluginNames.push(pluginName)

  if (!program.default) {
    msgToConsole(`加载插件${pluginName}失败，插件不存在默认导出函数`)
    return
  }

  try {
    await program.default()
    msgToConsole(`加载插件${pluginName}成功`)
  } catch (error) {
    msgToConsole(`加载插件${pluginName}失败，失败日志：`)
    console.error(error)
    return
  }
}

/**
 * 加载多个插件
 * @param {Array} plugins
 */
export async function loadPlugins(plugins) {
  for (const pluginName of plugins) {
    await loadPlugin(pluginName)
  }
}

import { readdirSync } from 'fs'
/**
 * 加载指定文件夹中的所有插件
 * @param {String} pluginDir
 */
export async function loadPluginDir(pluginDir) {
  //获取文件夹内文件
  const plugins = readdirSync(pluginDir)
  await loadPlugins(plugins)
}
