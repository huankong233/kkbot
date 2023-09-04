import { getBaseDir } from './libs/getDirName.js'
import { globalReg } from './libs/globalReg.js'
import { getVersion } from './libs/loadVersion.js'
import { loadPlugin } from './libs/loadPlugin.js'

export default async function () {
  //修改时区
  process.env.TZ = 'Asia/Shanghai'

  // 是否启用DEBUG模式
  const isDebug = typeof process.argv.find(item => item === '--debug') !== 'undefined'
  const isDeV = typeof process.argv.find(item => item === '--dev') !== 'undefined'
  const isPref = typeof process.argv.find(item => item === '--pref') !== 'undefined'

  globalReg({
    plugins: {},
    config: {},
    data: {},
    debug: isDebug || isDeV,
    dev: isDeV,
    pref: isPref,
    // 定义起始地址
    baseDir: getBaseDir()
  })

  // 初始化framework.jsonc内容
  globalReg(getVersion())

  // 记录日志
  await loadPlugin('log', 'plugins_dependencies')

  // 初始化机器人
  if ((await loadPlugin('bot', 'plugins_dependencies')) !== 'success') {
    throw new Error('机器人加载失败,请检查上方提示!')
  }
}
