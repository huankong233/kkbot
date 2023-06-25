import { loadConfig } from '../../libs/loadConfig.js'

export default () => {
  loadConfig('proxy')

  addProxy()
}

import proxy from 'node-global-proxy'
import { logger } from '../../libs/logger.js'

export const addProxy = () => {
  if (global.config.proxy.enable) {
    proxy.default.setConfig(global.config.proxy.proxy)
    proxy.default.start()
    logger.NOTICE('=====================================================')
    logger.NOTICE('代理已启动')
    logger.NOTICE('=====================================================')
  }
}
