import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { jsonc } from 'jsonc'
import { logger } from './libs/logger.js'
import path from 'path'

const pluginDirs = ['plugins_dependencies', 'plugins']

// 定义起始地址
import { getBaseDir } from './libs/getDirname.js'
global.baseDir = getBaseDir()

console.log(global.baseDir)

pluginDirs.forEach(pluginDir => {
  const plugins = readdirSync(pluginDir)
  plugins.forEach(pluginName => {
    const dir = path.join(global.baseDir, pluginDir, pluginName)
    let manifest
    try {
      manifest = jsonc.parse(readFileSync(`${dir}/manifest.json`, { encoding: 'utf-8' }))
    } catch (error) {
      logger.DEBUG(error)
      return
    }

    delete manifest.installed
    // 回写manifest文件
    writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest))
    logger.SUCCESS(`插件:${pluginName}已删除installed字段`)
  })
})
