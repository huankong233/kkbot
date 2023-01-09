export default () => {
  return {
    msgToConsole
  }
}

/**
 * 统一格式输出到控制台
 * @param {String} message
 */
export const msgToConsole = message => {
  console.log(`${new Date().toLocaleString()}  ${message}`)
}
