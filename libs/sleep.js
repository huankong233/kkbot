/**
 * 暂停
 * @param {Number} ms
 * @returns
 */
export const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
