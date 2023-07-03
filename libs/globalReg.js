/**
 * 将对象合并到global中
 * @param {Object} obj
 */
export function globalReg(obj) {
  Object.assign(global, obj)
}
