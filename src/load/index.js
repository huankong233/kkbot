export default () => {
  return {
    loadConfig,
    loadPlugin,
    loadConfigs,
    loadPlugins,
    loadPluginDir
  }
}

import fs from 'fs'
import path from 'path'
import { jsonc } from 'jsonc'
import { globalReg } from '../global/index.js'

export const loadLibs = async () => {
  const src_path = './src'
  //获取文件夹内文件
  const files = fs.readdirSync(src_path)
  //循环所有文件
  for (let i = 0; i < files.length; i++) {
    //文件位置
    const file_path = `../${files[i]}/index.js`
    //获取内容
    const data = await import(file_path)
    if (data.default) {
      //注入到全局变量中
      globalReg(await data.default())
    }
  }
  msgToConsole('支持库加载完成')
}

export const loadConfig = (file_path, setGlobal = false) => {
  //获取json内容
  const name = path.basename(file_path, path.extname(file_path))
  const config = jsonc.parse(fs.readFileSync(`./config/${file_path}`).toString())
  if (!global.config) global.config = {}
  if (setGlobal) global.config[name] = config
  return config
}

export const loadConfigs = async (configs, global = false) => {
  let config = {}
  for (let i = 0; i < configs.length; i++) {
    const name = path.basename(configs[i], path.extname(configs[i]))
    config[name] = loadConfig(configs[i], global)
  }
  return config
}

export const loadPlugin = async plugin => {
  let program = await import(`../../${plugin}/index.js`)
  try {
    if (program.enable === false) {
      msgToConsole(`插件${plugin}未启用`)
    } else {
      if (!global.plugin) {
        global.plugin = []
      }
      if (global.plugin.indexOf(plugin) === -1) {
        global.plugin.push(plugin)
        if (program.default) {
          await program.default()
        }
        msgToConsole(`加载插件${plugin}成功`)
      } else {
        if (global.config.bot.debug) {
          msgToConsole(`插件${plugin}已经加载过了`)
        }
      }
    }
  } catch (error) {
    msgToConsole(`加载插件${plugin}失败`)
    msgToConsole(`错误日志:`)
    console.error(error)
  }
}

export const loadPlugins = async plugins => {
  for (let i = 0; i < plugins.length; i++) {
    await loadPlugin(plugins[i])
  }
}

export const loadPluginDir = async path => {
  //获取文件夹内文件
  const files = fs.readdirSync(path)
  //循环所有文件
  for (let i = 0; i < files.length; i++) {
    loadPlugin(`${path}/${files[i]}`)
  }
}
