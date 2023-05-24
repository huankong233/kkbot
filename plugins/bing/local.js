import fs from 'fs'
import { jsonc } from 'jsonc'

export async function local(userInput, userContext) {
  const contextName = getRangeCode()
  fs.writeFileSync(`./temp/${contextName}.info`, userContext)
  const { execSync } = await import('child_process')
  const path = getDirName(import.meta.url)
  const outputName = execSync(
    `python3 ${path}/chat.py ${
      global.config.bing.cookiePath
    } ${`./temp/${contextName}.info`} ${userInput}`,
    { encoding: 'utf-8' }
  )
  const response = fs.readFileSync(`./temp/${outputName.trim()}.info`, 'utf8')
  // 清除缓存文件
  fs.rmSync(`./temp/${contextName}.info`)
  fs.rmSync(`./temp/${outputName.trim()}.info`)
  return jsonc.parse(response)
}
