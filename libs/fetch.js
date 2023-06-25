// 默认超时时间
const TIMEOUT = 60000

import nodeFetch, { AbortError } from 'node-fetch'
import { logger } from './logger.js'

import AbortController from 'abort-controller'

export async function get(url, data = {}, timeOut = TIMEOUT) {
  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, timeOut)

  let requestConfig = {
    credentials: 'same-origin',
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    cache: 'force-cache',
    signal: controller.signal
  }

  if (Object.keys(data).length !== 0) {
    let queryParams = ''

    Object.keys(data).forEach(key => {
      queryParams += key + '=' + data[key] + '&'
    })

    queryParams = queryParams.substring(0, queryParams.length - 1)

    url += `?${queryParams}`
  }

  try {
    return await nodeFetch(url, requestConfig)
  } catch (error) {
    if (error instanceof AbortError) {
      logger.WARNING(`请求${url}时超时`)
    } else {
      logger.WARNING(`请求${url}时失败`)
      if (global.debug) logger.DEBUG(error)
    }
  }
}

export async function post(url, data, timeOut = TIMEOUT) {
  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, timeOut)

  let requestConfig = {
    credentials: 'same-origin',
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    cache: 'force-cache',
    signal: controller.signal,
    body: JSON.stringify(data)
  }

  try {
    return await nodeFetch(url, requestConfig)
  } catch (error) {
    if (error instanceof AbortError) {
      logger.WARNING(`请求${url}时超时`)
    } else {
      logger.WARNING(`请求${url}时失败`)
      if (global.debug) logger.DEBUG(error)
    }
  }
}
