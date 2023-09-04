import fs from 'fs'
import { jsonc } from 'jsonc'

/**
 * 加载框架信息
 */
export function getVersion() {
  const frameworkInfo = jsonc.parse(
    fs.readFileSync(`${global.baseDir}/framework.jsonc`, {
      encoding: 'utf-8'
    })
  )

  return frameworkInfo
}
