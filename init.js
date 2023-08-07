import { getBaseDir } from './libs/getDirname.js'
import { getVersion } from './libs/loadVersion.js'
import { rewriteConsoleLog } from './libs/log/index.js'
import logger from './libs/logger.js'

export default async function () {
  //修改时区
  process.env.TZ = 'Asia/Shanghai'

  // 是否启用DEBUG模式
  const isDebug = typeof process.argv.find(item => item === '--debug') !== 'undefined'
  const isDeV = typeof process.argv.find(item => item === '--dev') !== 'undefined'
  global.debug = isDebug || isDeV
  global.dev = isDeV

  if (global.debug) logger.DEBUG(`当前已打开DEBUG模式,可能会有更多的log被输出,非开发人员请关闭~`)

  // 定义起始地址
  global.baseDir = getBaseDir()

  // 初始化package.json内容
  getVersion()

  // 重写conosle.log
  rewriteConsoleLog()
}
