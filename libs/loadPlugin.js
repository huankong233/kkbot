import { pathToFileURL } from 'url'
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { jsonc } from 'jsonc'
import { compare } from 'compare-versions'
import { loadConfig } from './loadConfig.js'
import { makeSystemLogger } from './logger.js'
import path from 'path'

const logger = makeSystemLogger({ pluginName: 'loadPlugin' })

/**
 * 加载单个插件
 * @param {String} pluginName 插件名
 * @param {String} pluginDir 插件路径
 * @param {Boolean} loadFromDir 是否是使用文件夹加载的
 */
export async function loadPlugin(pluginName, pluginDir = 'plugins', loadFromDir = false) {
  const { plugins, data, baseDir } = global

  // 插件绝对路径
  const pluginAbsoluteDir = path.join(baseDir, pluginDir, pluginName)

  if (!existsSync(pluginAbsoluteDir)) {
    logger.WARNING(`插件 ${pluginName} 文件夹不存在`)
    return
  }

  // 插件manifest路径
  let manifestPath = path.join(pluginAbsoluteDir, `manifest.jsonc`)

  if (!existsSync(manifestPath)) {
    logger.WARNING(`插件 ${pluginName} 的 manifest.jsonc 文件不存在`)
    return
  }

  let manifest

  // 检查插件兼容情况
  try {
    manifest = jsonc.parse(readFileSync(manifestPath, { encoding: 'utf-8' }))
  } catch (error) {
    logger.WARNING(`插件 ${pluginName} manifest.jsonc 加载失败`)
    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
    return
  }

  const {
    dependPackages = {},
    dependPlugins = {},
    installed = false,
    disableAutoLoadConfig = false,
    disableLoadInDir = false,
    configName = 'config'
  } = manifest

  if (disableLoadInDir && loadFromDir) {
    if (debug) logger.DEBUG(`插件 ${pluginName} 禁止在文件夹中自动加载`)
    return
  }

  if (compare(manifest.kkbot_plugin_version, global.kkbot_plugin_version, '<')) {
    logger.NOTICE(`插件 ${pluginName} 兼容的插件系统版本低于当前插件系统版本，可能有兼容问题`)
  }

  // 如果还没安装就安装一次
  if (!installed) {
    // 如果还没安装
    let installCommand = 'pnpm install'

    for (const key in dependPackages) {
      const value = dependPackages[key]
      installCommand += ` ${key}@${value}`
    }

    if (installCommand !== 'pnpm install') {
      try {
        execSync(installCommand)
      } catch (error) {
        logger.WARNING(`插件 ${pluginName} 依赖的包安装失败`)
        logger.ERROR(error)
        return
      }
    }

    // 回写manifest文件
    manifest.installed = true
    writeFileSync(manifestPath, JSON.stringify(manifest))
  }

  // 检查是否存在依赖
  const dependPluginsKeys = Object.keys(dependPlugins)
  if (dependPluginsKeys.length !== 0) {
    for (const key in dependPlugins) {
      const requireVersion = dependPlugins[key]
      const depend = plugins[key]

      if (!depend) {
        logger.WARNING(`插件 ${pluginName} 缺少依赖,所依赖的插件有:`, dependPluginsKeys.toString())
        return
      }

      const dependVersion = depend.version

      if (compare(dependVersion, requireVersion, '!=')) {
        logger.NOTICE(`插件 ${pluginName} 所依赖的插件 ${key} 版本不一致,可能存在兼容性问题`)
      }
    }
  }

  const jsPath = path.join(pluginAbsoluteDir, 'index.js')
  if (!existsSync(jsPath)) {
    logger.WARNING(`插件 ${pluginName} 的 index.js 文件不存在`)
    return
  }

  let program

  try {
    program = await import(pathToFileURL(jsPath))
  } catch (error) {
    logger.WARNING(`插件 ${pluginName} 代码有误,导入失败`)
    logger.ERROR(error)
    return
  }

  if (program.enable === false) {
    logger.NOTICE(`插件 ${pluginName} 未启用`)
    return
  }

  // 自动加载配置文件
  if (!disableAutoLoadConfig) {
    // 加载配置文件
    if (loadConfig(configName, true, pluginAbsoluteDir, false, pluginName) === 'unloaded') {
      return
    }
  }

  plugins[pluginName] = { ...manifest, dir: pluginAbsoluteDir, loaded: false }
  data[`${pluginName}Data`] = {}

  // 循环检查是否存在
  if (plugins[pluginName]?.loaded) {
    if (debug) logger.DEBUG(`插件 ${pluginName} 已经加载过了`)
    return
  }

  if (!program.default) {
    logger.WARNING(`加载插件 ${pluginName} 失败，插件不存在默认导出函数`)
    return
  }

  try {
    global.nowLoadPluginName = pluginName
    await program.default()
    global.nowLoadPluginName = null
    logger.SUCCESS(`加载插件 ${pluginName} 成功`)
  } catch (error) {
    logger.WARNING(`加载插件 ${pluginName} 失败,失败日志:`)
    logger.ERROR(error)
    return
  }

  plugins[pluginName].loaded = true

  return 'success'
}

/**
 * 加载多个插件
 * @param {String[]} plugins 插件名
 * @param {String} pluginDir 插件路径
 * @param {Boolean} loadFromDir 是否是使用文件夹加载的
 */
export async function loadPlugins(plugins, pluginDir = 'plugins', loadFromDir = false) {
  for (const pluginName of plugins) {
    await loadPlugin(pluginName, pluginDir, loadFromDir)
  }
}

/**
 * 加载指定文件夹中的所有插件
 * @param {String} pluginDir
 */
export async function loadPluginDir(pluginDir) {
  //获取文件夹内文件
  let plugins

  if (!existsSync(pluginDir)) {
    logger.WARNING(`文件夹 ${pluginDir} 不存在`)
    return
  }

  try {
    plugins = readdirSync(pluginDir)
  } catch (error) {
    logger.WARNING('获取文件夹内容失败')
    logger.ERROR(error)
    return
  }

  await loadPlugins(plugins, pluginDir, true)
  if (debug) logger.DEBUG(`文件夹: ${pluginDir} 中的插件已全部加载!`)
}
