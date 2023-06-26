import { readFileSync } from 'fs'
import { jsonc } from 'jsonc'
import { globalReg } from './globalReg.js'

/**
 * 加载插件支持相关内容
 */
export function getVersion() {
  const packageInfo = jsonc.parse(
    readFileSync(`${global.baseDir}/plugin.json`, { encoding: 'utf-8' })
  )
  globalReg(packageInfo)
}
