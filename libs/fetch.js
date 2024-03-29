import fetch, { AbortError } from 'node-fetch'
import AbortController from 'abort-controller'
import { makeLogger } from './logger.js'
import { stringify } from 'qs'

// 默认超时时间
const TIMEOUT = 120 * 1000
const logger = makeLogger('FETCH')

/**
 * 不带重试的Get请求
 * @param {{ url:String, data:Object, timeOut:Number, headers:Object }}
 */
export async function fetchGet({ url, data = {}, timeOut = TIMEOUT, headers } = {}) {
  if (!url) throw new Error(`url参数不存在`)

  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, timeOut)

  let requestConfig = {
    credentials: 'same-origin',
    method: 'GET',
    headers: headers ?? {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    },
    mode: 'cors',
    cache: 'force-cache',
    signal: controller.signal
  }

  if (Object.keys(data).length !== 0) {
    url += `?${stringify(data)}`
  }

  try {
    return await fetch(url, requestConfig)
  } catch (error) {
    if (error instanceof AbortError) {
      logger.WARNING(`请求${url}时超时`)
    } else {
      logger.WARNING(`请求${url}时失败`)
      logger.ERROR(error)
    }
    throw error
  }
}

/**
 * 不带重试的Post请求
 * @param {{ url:String, data:Object, timeOut:Number, headers:Object }}
 */
export async function fetchPost({ url, data = {}, timeOut = TIMEOUT, headers } = {}) {
  if (!url) throw new Error(`url参数不存在`)

  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, timeOut)

  let requestConfig = {
    credentials: 'same-origin',
    method: 'POST',
    headers: headers ?? {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    },
    mode: 'cors',
    cache: 'force-cache',
    signal: controller.signal,
    body: JSON.stringify(data)
  }

  try {
    return await fetch(url, requestConfig)
  } catch (error) {
    if (error instanceof AbortError) {
      logger.WARNING(`请求${url}时超时`)
    } else {
      logger.WARNING(`请求${url}时失败`)
      logger.ERROR(error)
    }
    throw error
  }
}

/**
 * 自动重试
 * @param {Function} func 执行的函数
 * @param {Number} times 执行的次数
 * @param {Number} sleepTime 失败后休眠时间(毫秒)
 */
import { sleep } from './sleep.js'
export async function retryAsync(func, times = 3, sleepTime = 0) {
  while (times--) {
    try {
      const res = await func(times)
      if (res) {
        let res_string = res.toString()
        if (res_string.includes('quit')) {
          times = -1
          sleepTime = 0
          if (debug) logger.DEBUG('重试被手动停止')
          throw res_string.replaceAll('quit', '')
        }
      }
      return res
    } catch (error) {
      if (debug) {
        logger.DEBUG(error)
        if (times !== -1) logger.DEBUG(`重试还剩 ${times} 次`)
      }
      if (sleepTime !== 0 && times > 0) await sleep(sleepTime)
      if (times <= 0) {
        throw error
      }
    }
  }
}

/**
 * 带重试的Get请求
 * @param {{ url:String, data:Object, timeOut:Number, headers:Object }}
 * @param {Number} times 重试次数
 * @param {Number} sleepTime 失败后休眠时间(毫秒)
 */
export async function get({ url, data, timeOut, headers } = {}, times, sleepTime) {
  return await retryAsync(
    async () => {
      return await fetchGet({ url, data, timeOut, headers })
    },
    times,
    sleepTime
  )
}

/**
 * 带重试的Post请求
 * @param {{ url:String, data:Object, timeOut:Number, headers:Object }}
 * @param {Number} times 重试次数
 * @param {Number} sleepTime 失败后休眠时间(毫秒)
 */
export async function post({ url, data, timeOut, headers } = {}, times, sleepTime) {
  return await retryAsync(
    async () => {
      return await fetchPost({ url, data, timeOut, headers })
    },
    times,
    sleepTime
  )
}
