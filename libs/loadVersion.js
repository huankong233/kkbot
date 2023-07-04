import fs from 'fs'
import { jsonc } from 'jsonc'
import { globalReg } from './globalReg.js'

/**
 * 加载框架信息
 */
export function getVersion() {
  const frameworkInfo = jsonc.parse(
    fs.readFileSync(`${global.baseDir}/framework.json`, {
      encoding: 'utf-8'
    })
  )

  globalReg(frameworkInfo)
}
