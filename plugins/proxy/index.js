export default () => {
  loadConfig('proxy.jsonc', true)

  addProxy()
}

import proxy from 'node-global-proxy'

export const addProxy = () => {
  if (global.config.proxy.enable) {
    proxy.default.setConfig(global.config.proxy.proxy)
    proxy.default.start()
    msgToConsole('=====================================================')
    msgToConsole('代理已启动')
    msgToConsole('=====================================================')
  }
}
