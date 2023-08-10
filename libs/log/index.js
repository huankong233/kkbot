const levelNumericalCode = {
  SUCCESS: 1,
  WARNING: 2,
  NOTICE: 3,
  INFO: 4,
  DEBUG: 5
}

import { loadConfig } from '../loadConfig.js'
import logger from '../logger.js'

/**
 * 重写conosle
 */
export function rewriteConsoleLog() {
  const config = loadConfig('config', false, 'libs/log')

  if (!config.enable) {
    logger.WARNING(`未开启日志功能,推荐开启`)
    return
  }

  if (!config.force && global.dev) {
    logger.DEBUG(`处于DEV模式中,禁用日志保存功能`)
    return
  } else if (config.force) {
    logger.DEBUG(`处于DEV模式中,强制启用日志保存功能`)
  }

  if (global.debug) {
    logger.DEBUG(`处于DEBUG模式中,记录所有输出`)
  }

  const nowLevel = levelNumericalCode[config.level]
  const regex = /\[(\w+)\]/

  console.originLog = console.log

  console.log = function (...msg) {
    if (global.debug) {
      save2File(...msg)
    } else {
      if (msg[2]) {
        let type = msg[2].match(regex)

        if (type) {
          let level = levelNumericalCode[type[1]]
          if (level && level <= nowLevel) {
            // 存储到日志中
            save2File(...msg)
          }
        }
      }
    }

    console.originLog(...msg)
  }
}

import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'
import clc from 'cli-color'
import { deleteOldestFiles } from '../fs.js'

/**
 * 写入日志文件内
 * @param  {...any} msg
 */
function save2File(...msg) {
  const config = loadConfig('config', false, 'libs/log')
  const fileDir = path.join(baseDir, 'logs')
  const filePath = path.join(fileDir, `${dayjs().format('YYYY-MM-DD')}.log`)
  const fileData = clc.strip(msg.join(' ')) + '\n'

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir)
  }

  if (!fs.existsSync(filePath)) {
    // 如果不存在则当前文件夹文件数量+1是否超过max
    const files = fs.readdirSync(fileDir)
    if (files.length + 1 >= config.max) {
      deleteOldestFiles(path.join(baseDir, 'logs'), files.length + 1 - config.max)
    }
  }

  fs.appendFileSync(filePath, fileData)
}
