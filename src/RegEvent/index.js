export default () => {
  return {
    RegEvent
  }
}

/**
 * 事件快捷注册
 * @param {String} type 事件类型
 * @param {Function} callback 回调函数
 * @param {Number} priority 优先级
 */
function RegEvent(type, callback, priority = 1) {
  switch (type) {
    case 'message':
      global.events.message.push({
        callback,
        priority
      })
      break
    case 'notice':
      global.events.notice.push({
        callback,
        priority
      })
      break
    case 'request':
      global.events.request.push({
        callback,
        priority
      })
      break
    default:
      throw new Error(`"${type}"事件类型不存在`)
  }
}
