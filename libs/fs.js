import fs from 'fs'
import path from 'path'

/**
 * 删除文件夹
 * @param {String} folder
 */
export const deleteFolder = folder => {
  if (fs.existsSync(folder)) {
    let files = fs.readdirSync(folder)
    files.forEach(file => {
      let dirPath = path.join(folder, file)
      if (fs.statSync(dirPath).isDirectory()) {
        deleteFolder(dirPath)
      } else {
        fs.unlinkSync(dirPath)
      }
    })
    fs.rmdirSync(folder)
  }
}

import { get } from './fetch.js'
/**
 * 内部方法!!!请勿调用
 * @param {String} url
 * @param {String} fullPath
 * @returns
 */
export async function _download(url, fullPath) {
  const res = await get({ url, headers: { 'Content-Type': 'application/octet-stream' } })
  const dest = fs.createWriteStream(fullPath)
  res.body.pipe(dest)
  return new Promise((resolve, reject) => {
    dest.on('finish', resolve)
    dest.on('error', reject)
  })
}

import { getRangeCode } from './random.js'
/**
 * 下载文件
 * @param {String} url
 * @param {String} ext 下载的文件后缀
 * @returns
 */
export async function downloadFile(url, ext = '.png') {
  const fileName = getRangeCode(10) + ext
  const outPath = path.join(baseDir, 'temp')
  const fullPath = path.join(outPath, fileName)
  await _download(url, fullPath)
  return fullPath
}

/**
 * 删除指定数量的老文件
 * @param {String} dirPath
 * @param {String} count
 */
export async function deleteOldestFiles(dirPath, count) {
  const files = await fs.promises.readdir(dirPath)
  const sortedFiles = await Promise.all(
    files.map(async file => {
      const filePath = path.join(dirPath, file)
      const { birthtime } = await fs.promises.stat(filePath)
      return { file, birthtime }
    })
  )
  sortedFiles.sort((a, b) => a.birthtime - b.birthtime)
  const oldestFiles = sortedFiles.slice(0, count).map(file => file.file)
  await Promise.all(
    oldestFiles.map(file => {
      const filePath = path.join(dirPath, file)
      return fs.promises.unlink(filePath)
    })
  )
}
