import { pathToFileURL } from 'url'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { jsonc } from 'jsonc'
import { logger } from './logger.js'
import clc from 'cli-color'
import path from 'path'
import { compare } from 'compare-versions'

/**
 * 加载单个插件
 * @param {String} pluginName 插件名
 */
export async function loadPlugin(pluginName, pluginDir = 'plugins') {
  const { debug, kkbot_plugin_version } = global

  pluginDir = path.join(global.baseDir, pluginDir, pluginName)

  let manifest

  // 检查插件兼容情况
  try {
    manifest = jsonc.parse(readFileSync(`${pluginDir}/manifest.json`, { encoding: 'utf-8' }))
  } catch (error) {
    logger.WARNING(`插件${pluginName}manifest加载失败`)
    if (debug) logger.DEBUG(error)
    return
  }

  if (compare(manifest.kkbot_plugin_version.toString(), kkbot_plugin_version, '<')) {
    logger.NOTICE(`插件${pluginName}与当前框架的插件系统兼容版本不一致，可能有兼容问题`)
  }

  const { dependencies, installed, depends } = manifest

  // 如果还没安装就安装一次
  if (!installed) {
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
    writeFileSync(`${pluginDir}/manifest.json`, JSON.stringify(manifest))
  }

  // 检查是否存在依赖
  if (depends) {
    for (let index = 0; index < depends.length; index++) {
      const element = depends[index]
      if (!global.pluginNames.find(item => item.name === element)) {
        logger.WARNING(`插件${pluginName}缺少依赖${clc.bold(element)}`)
        return
      }
    }
  }

  let program

  try {
    program = await import(pathToFileURL(`${pluginDir}/index.js`))
  } catch (error) {
    logger.WARNING(`插件${pluginName}不存在或插件损坏`)
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
    if (debug) logger.DEBUG(`插件${pluginName}已经加载过了`)
    return
  }

  global.pluginNames.push({ ...manifest, dir: pluginDir })

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
 * @param {String} pluginDir
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
  if (global.debug) logger.DEBUG(`文件夹: ${clc.underline(pluginDir)} 中的插件已全部加载!`)
}
