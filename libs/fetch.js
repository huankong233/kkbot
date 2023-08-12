// 默认超时时间
const TIMEOUT = 60 * 1000

import fetch, { AbortError } from 'node-fetch'
import { logger } from './logger.js'
import { stringify } from 'qs'

import AbortController from 'abort-controller'

/**
 * 不带重试的Get请求
 * @param {Object} req
 * @returns {Promise}
 */
export async function fetchGet({ url, data = {}, timeOut = TIMEOUT, headers } = {}) {
  if (!url) {
    logger.WARNING(`url参数不存在`)
    return `url参数不存在`
  }

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
      if (debug) {
        logger.DEBUG(error)
      } else {
        logger.WARNING(error)
      }
    }
    throw error
  }
}

/**
 * 不带重试的Post请求
 * @param {Object} req
 * @returns {Promise}
 */
export async function fetchPost({ url, data = {}, timeOut = TIMEOUT, headers } = {}) {
  if (!url) {
    logger.WARNING(`url参数不存在`)
    return `url参数不存在`
  }

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
      if (debug) {
        logger.DEBUG(error)
      } else {
        logger.WARNING(error)
      }
    }
    throw error
  }
}

/**
 * 自动重试
 * @param {Function} func
 * @param {Number} times
 * @param {Number} sleepTime
 * @returns
 */
import { sleep } from './sleep.js'
export async function retryAsync(func, times = 3, sleepTime = 0) {
  while (times--) {
    try {
      return await func()
    } catch (error) {
      if (sleepTime !== 0) await sleep(sleepTime)
      if (debug) logger.DEBUG(`尝试还剩 ${times} 次`)
      if (times === 0) {
        throw error
      }
    }
  }
}

/**
 * 带重试的Get请求
 * @param {Object} req 请求参数
 * @param {Number} times 重试次数
 * @returns {Promise}
 */
export async function get({ url, data, timeOut, headers } = {}, times) {
  return await retryAsync(async () => {
    return await fetchGet({ url, data, timeOut, headers }, true)
  }, times)
}

/**
 * 带重试的Post请求
 * @param {Object} req 请求参数
 * @param {Number} times 重试次数
 * @returns {Promise}
 */
export async function post({ url, data, timeOut, headers } = {}, times) {
  return await retryAsync(async () => {
    return await fetchPost({ url, data, timeOut, headers }, true)
  }, times)
}
