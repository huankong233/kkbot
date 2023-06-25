import url from 'url'
import path from 'path'

/**
 * 获取当前文件的路径
 * @param {String} importMetaUrl 获取方式:import.meta.url
 * @returns {String} 当前文件的路径
 */
export function getDirName(importMetaUrl) {
  return path.dirname(url.fileURLToPath(importMetaUrl))
}

/**
 * 获取初始路径
 */
export function getBaseDir() {
  return path.join(getDirName(import.meta.url), '..')
}
