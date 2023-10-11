import { readdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { jsonc } from 'jsonc'
import { makeSystemLogger } from './libs/logger.js'
const logger = makeSystemLogger({ pluginName: 'publish' })
global.debug = true
import { getBaseDir } from './libs/getDirName.js'
global.baseDir = getBaseDir()

const pluginDirs = ['plugins_dependencies', 'plugins']
const originPackages = {
  dayjs: '^1.11.10',
  'node-fetch': '^3.3.2',
  qs: '^6.11.2',
  'abort-controller': '^3.0.0',
  'cli-color': '^2.0.3',
  jsonc: '^2.0.0',
  'compare-versions': '^6.1.0',
  'mime-types': '^2.1.35',
  'node-emoji': '^2.1.0',
  '@tsuk1ko/cq-websocket': '^2.4.2',
  'go-cqwebsocket': '^6.2.2'
}

pluginDirs.forEach(pluginDir => {
  const plugins = readdirSync(pluginDir)
  plugins.forEach(pluginName => {
    const filePath = path.join(baseDir, pluginDir, pluginName, 'manifest.jsonc')
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
    logger.SUCCESS(`已删除插件 ${pluginName} 的 installed 字段`)
  })
})

const packagePath = path.join(baseDir, 'package.json')
let packageJSON = jsonc.parse(readFileSync(packagePath, { encoding: 'utf-8' }))

packageJSON.dependencies = originPackages
writeFileSync(packagePath, JSON.stringify(packageJSON))
logger.SUCCESS(`package.json 回写完成`)
