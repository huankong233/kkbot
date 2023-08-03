import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { jsonc } from 'jsonc'
import { logger } from './libs/logger.js'
import path from 'path'
import fs from 'fs'

const pluginDirs = ['plugins_dependencies', 'plugins']
const originPackages = {
  'node-fetch': '^3.3.1',
  qs: '^6.11.2',
  'abort-controller': '^3.0.0',
  'cli-color': '^2.0.3',
  jsonc: '^2.0.0',
  'compare-versions': '6.0.0-rc.2'
}

// 定义起始地址
import { getBaseDir } from './libs/getDirname.js'
global.baseDir = getBaseDir()

pluginDirs.forEach(pluginDir => {
  const plugins = readdirSync(pluginDir)
  plugins.forEach(pluginName => {
    const filePath = path.join(baseDir, pluginDir, pluginName, 'manifest.json')
    let manifest
    try {
      manifest = jsonc.parse(readFileSync(filePath, { encoding: 'utf-8' }))
    } catch (error) {
      logger.DEBUG(error)
      return
    }

    delete manifest.installed
    // 回写manifest文件
    writeFileSync(filePath, JSON.stringify(manifest))
    logger.SUCCESS(`插件:${pluginName}已删除installed字段`)
  })
})

const packagePath = path.join(baseDir, 'package.json')
let packageJSON = jsonc.parse(readFileSync(packagePath, { encoding: 'utf-8' }))

packageJSON.dependencies = originPackages
writeFileSync(packagePath, JSON.stringify(packageJSON))
logger.SUCCESS(`package.json 回写完成`)

// 删除pnpm-lock.yaml
const pnpmLockPath = path.join(baseDir, 'pnpm-lock.yaml')
if (fs.existsSync(pnpmLockPath)) fs.unlinkSync(pnpmLockPath)
