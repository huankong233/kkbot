import { makeLogger } from '../../libs/logger.js'

const levelNumericalCode = {
  SUCCESS: 1,
  WARNING: 2,
  NOTICE: 3,
  INFO: 4,
  DEBUG: 5
}

const logger = makeLogger({ pluginName: 'log' })

/**
 * 重写conosle
 */
export default function rewriteConsoleLog() {
  const { logConfig } = global.config

  if (!logConfig.enable) {
    logger.WARNING(`未开启日志功能,推荐开启`)
    return
  }

  if (!logConfig.force && global.dev) {
    logger.DEBUG(`处于DEV模式中,禁用日志保存功能`)
    return
  } else if (logConfig.force) {
    logger.DEBUG(`处于DEV模式中,强制开启日志保存功能`)
  }

  if (global.debug) {
    logger.DEBUG(`处于DEBUG模式中,记录所有输出`)
  }

  const nowLevel = levelNumericalCode[logConfig.level]
  const regex = /\[(\w+)\]/

  console.log = (
    oriLogFunc =>
    (...args) => {
      if (global.debug) {
        save2File(logConfig.max, ...args)
      } else if (args[2]) {
        let type = args[2].match(regex)
        if (type) {
          let level = levelNumericalCode[type[1]]
          if (level && level <= nowLevel) {
            // 存储到日志中
            save2File(logConfig.max, ...args)
          }
        }
      }
      oriLogFunc(...args)
    }
  )(console.log)
}

import fs from 'fs'
import path from 'path'
import dayjs from 'dayjs'
import clc from 'cli-color'
import { deleteOldestFiles } from '../../libs/fs.js'

/**
 * 写入日志文件内
 * @param {Number} max
 * @param {...any} msg
 */
function save2File(max, ...msg) {
  const fileDir = path.join(baseDir, 'logs')
  const filePath = path.join(fileDir, `${dayjs().format('YYYY-MM-DD')}.log`)
  msg = msg.map(function (item) {
    if (typeof item === 'object') {
      return JSON.stringify(item)
    }
    return item
  })

  const fileData = clc.strip(msg.join(' ')) + '\n'

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir)
  }

  if (!fs.existsSync(filePath)) {
    // 如果不存在则当前文件夹文件数量+1是否超过max
    const files = fs.readdirSync(fileDir)
    if (files.length + 1 >= max) {
      deleteOldestFiles(path.join(baseDir, 'logs'), files.length + 1 - max)
    }
  }

  fs.appendFileSync(filePath, fileData)
}
