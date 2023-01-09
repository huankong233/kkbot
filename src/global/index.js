export default () => {
  return {
    globalReg
  }
}

/**
 * 注册全局对象
 * @param {Object} obj
 * @returns
 */
export const globalReg = obj => Object.assign(global, obj)
