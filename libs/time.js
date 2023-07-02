/**
 * 格式化时间,将秒转换为HH:MM:SS的格式
 * @param {Number} seconds
 * @returns {Object}
 */
export function formatTime(seconds) {
  // 使用padStart方法补零
  let hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  let minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  let seconds = (seconds % 60).toString().padStart(2, '0')
  // 返回HH:MM:SS的字符串
  return `${hours}:${minutes}:${seconds}`
}
