export default () => {
  return {
    formatTime
  }
}

/**
 * 时间格式化
 * @param {number} second
 * @returns {object}
 */
export const formatTime = second => {
  const days = Math.floor(second / 86400)
  const hours = Math.floor((second % 86400) / 3600)
  const minutes = Math.floor(((second % 86400) % 3600) / 60)
  const seconds = Math.floor(((second % 86400) % 3600) % 60)
  return { days, hours, minutes, seconds }
}
