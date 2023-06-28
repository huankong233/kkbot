// 默认超时时间
const TIMEOUT = 60 * 1000

import fetch, { AbortError } from 'node-fetch'
import { logger } from './logger.js'
import { stringify } from 'qs'

import AbortController from 'abort-controller'

export async function fetchGet({ url, data = {}, timeOut = TIMEOUT } = {}) {
  if (!url) {
    logger.WARNING(`url参数不存在`)
    return
  }

  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, timeOut)

  let requestConfig = {
    credentials: 'same-origin',
    method: 'GET',
    headers: {
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
      if (global.debug) logger.DEBUG(error)
    }
    throw new Error(error)
  }
}

export async function fetchPost({ url, data = {}, timeOut = TIMEOUT } = {}) {
  if (!url) {
    logger.WARNING(`url参数不存在`)
    return
  }

  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, timeOut)

  let requestConfig = {
    credentials: 'same-origin',
    method: 'POST',
    headers: {
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
      if (global.debug) logger.DEBUG(error)
    }
    throw new Error(error)
  }
}

/**
 * 自动重试
 * @param {Function} func
 * @param {Number} times
 * @returns
 */
export async function retryAsync(func, times = 3) {
  while (times--) {
    try {
      return await func()
    } catch (error) {
      if (times === 0) {
        throw new Error(error)
      }
    }
  }
}

/**
 * 自动尝试Get请求
 * @param {Object} req 请求参数
 * @returns
 */
export async function get(req = {}, times) {
  return await retryAsync(async () => {
    return await fetchGet(req, true)
  }, times)
}

/**
 * 自动尝试Post请求
 * @param {Object} req 请求参数
 * @returns
 */
export async function post(req = {}, times) {
  return await retryAsync(async () => {
    return await fetchPost(req, true)
  }, times)
}
