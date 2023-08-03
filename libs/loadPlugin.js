import { pathToFileURL } from 'url'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { jsonc } from 'jsonc'
import { logger } from './logger.js'
import clc from 'cli-color'
import path from 'path'
import fs from 'fs'
import { compare } from 'compare-versions'
import { loadConfig } from './loadConfig.js'

/**
 * 加载单个插件
 * @param {String} pluginName 插件名
 * @param {String} pluginDir 插件路径
 * @param {Boolean} loadFromDir 是否是使用文件夹加载的
 */
export async function loadPlugin(pluginName, pluginDir = 'plugins', loadFromDir = false) {
  if (!global.plugins) {
    global.plugins = {}
  }

  const { debug, kkbot_plugin_version, plugins } = global

  pluginDir = path.join(global.baseDir, pluginDir, pluginName)

  let manifest

  // 检查插件兼容情况
  try {
    manifest = jsonc.parse(
      readFileSync(path.join(pluginDir, `manifest.json`), { encoding: 'utf-8' })
    )
  } catch (error) {
    logger.WARNING(`插件${pluginName}manifest加载失败`)
    if (debug) logger.DEBUG(error)
    return
  }

  if (compare(manifest.kkbot_plugin_version, kkbot_plugin_version, '<')) {
    logger.NOTICE(`插件${pluginName}与当前框架的插件系统兼容版本不一致，可能有兼容问题`)
  }

  const {
    dependPackages,
    dependPlugins,
    installed,
    disableAutoLoadConfig = false,
    disableLoadInDir = false,
    configName = 'config'
  } = manifest

  if (disableLoadInDir && loadFromDir) {
    if (debug) logger.DEBUG(`插件${pluginName}禁止在文件夹中自动加载`)
    return
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
  if (dependPlugins) {
    for (const key in dependPlugins) {
      if (Object.hasOwnProperty.call(dependPlugins, key)) {
        const requireVersion = dependPlugins[key]
        const depend = plugins[key]

        if (!depend) {
          logger.WARNING(
            `插件${pluginName}缺少依赖,所需的依赖有: ${clc.bold(
              Object.keys(dependPlugins).toString()
            )}`
          )
          return
        }

        const dependVersion = depend.version

        if (compare(dependVersion, requireVersion, '<')) {
          logger.NOTICE(`插件${pluginName}所依赖的 ${clc.bold(key)} 偏旧,可能存在兼容性问题`)
        }
      }
    }
  }

  // 自动加载配置文件
  if (!disableAutoLoadConfig) {
    // 检查配置文件是否存在
    if (fs.existsSync(path.join(pluginDir, `${configName}.jsonc`))) {
      loadConfig(configName, true, pluginDir, pluginName)
    } else {
      if (debug) logger.DEBUG(`插件${pluginName}不存在自动加载的配置文件`)
      // 判断是否存在 default 文件夹
      if (fs.existsSync(path.join(pluginDir, `${configName}.default.jsonc`))) {
        logger.WARNING(`插件${pluginName}需要手动配置信息`)
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

  // 循环检查是否存在
  if (plugins[pluginName]) {
    if (debug) logger.DEBUG(`插件${pluginName}已经加载过了`)
    return
  }

  plugins[pluginName] = { ...manifest, dir: pluginDir }

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
    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
    return
  }

  return 'success'
}

/**
 * 加载多个插件
 * @param {Array} plugins 插件名[]
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
  try {
    plugins = readdirSync(pluginDir)
  } catch (error) {
    logger.WARNING('获取文件夹内容失败,文件夹可能不存在')
    return
  }

  await loadPlugins(plugins, pluginDir, true)
  if (global.debug) logger.DEBUG(`文件夹: ${clc.underline(pluginDir)} 中的插件已全部加载!`)
}
