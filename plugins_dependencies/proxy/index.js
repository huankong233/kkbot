import proxy from 'node-global-proxy'
import { makeLogger } from '../../libs/logger.js'

const logger = makeLogger({ pluginName: 'proxy' })

export default function () {
  const { proxyConfig } = global.config
  if (proxyConfig.enable) {
    proxy.default.setConfig(proxyConfig.proxy)
    proxy.default.start()
    logger.NOTICE('=====================================================')
    logger.NOTICE('代理已启动')
    logger.NOTICE('=====================================================')
  }
}
