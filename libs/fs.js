import fs from 'fs'
import path from 'path'

//删除文件夹
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
