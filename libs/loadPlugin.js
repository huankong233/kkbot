import { logger } from './logger.js'
import { pathToFileURL } from 'url'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { jsonc } from 'jsonc'

/**
 * 加载单个插件
 * @param {String} pluginName 插件名
 */
export async function loadPlugin(pluginName, pluginDir = 'plugins') {
  const { debug, kkbot_plugin_version } = global
  pluginDir = `${global.baseDir}/${pluginDir}/${pluginName}/`

  let manifest

  // 检查插件兼容情况
  try {
    manifest = jsonc.parse(readFileSync(`${pluginDir}manifest.json`, { encoding: 'utf-8' }))
  } catch (error) {
    logger.WARNING(`插件${pluginName}manifest加载失败`)
    if (debug) logger.DEBUG(error)
    return
  }

  if (manifest.kkbot_plugin_version !== kkbot_plugin_version) {
    logger.NOTICE(`插件${pluginName}与当前框架兼容版本不一致，可能有兼容问题`)
  }

  const { dependencies, installed } = manifest

  // 如果还没安装就安装一次,如果不是debug就一直安装
  if (!installed || !debug) {
    // 如果还没安装
    let installCommand = 'pnpm install'
    for (const key in dependencies) {
      const value = dependencies[key]
      installCommand += ` ${key}@${value}`
    }

    if (installCommand !== 'pnpm install') {
      try {
        execSync(installCommand).toString()
      } catch (error) {
        logger.WARNING(`插件${pluginName}支持库安装失败`)
        if (debug) logger.DEBUG(error)
        return
      }
    }

    // 回写manifest文件
    manifest.installed = true
    writeFileSync(`${pluginDir}manifest.json`, JSON.stringify(manifest))
  }

  let program

  try {
    program = await import(pathToFileURL(`${pluginDir}index.js`))
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

  // 循环检查是否存在
  if (global.pluginNames.find(item => item.name === pluginName)) {
    if (debug) logger.NOTICE(`插件${pluginName}已经加载过了`)
    return
  }

  global.pluginNames.push(manifest)

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
