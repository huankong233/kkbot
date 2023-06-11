import nodeFetch, { AbortError } from 'node-fetch'

/**
 * 发送网络请求
 * @param {String} url
 * @param {Object} data
 * @param {String} type
 * @param {Number} timeOut
 * @returns
 */
export const fetch = async (url = '', data = {}, type = 'GET', timeOut = 60 * 1000) => {
  const AbortController = globalThis.AbortController || (await import('abort-controller'))
  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, timeOut)

  let requestConfig = {
    credentials: 'same-origin',
    method: type,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
    },
    mode: 'cors',
    cache: 'force-cache',
    signal: controller.signal
  }

  type = type.toUpperCase()
  if (type === 'GET' && Object.keys(data).length !== 0) {
    let queryParams = ''
    Object.keys(data).forEach(key => {
      queryParams += key + '=' + data[key] + '&'
    })

    if (queryParams !== '') {
      queryParams = queryParams.substring(0, queryParams.lastIndexOf('&'))
    }

    url += `?${queryParams}`
  } else if (type === 'POST') {
    requestConfig['body'] = {
      value: JSON.stringify(data)
    }
  }

  try {
    return await nodeFetch(url, requestConfig).then(res => res.json())
  } catch (error) {
    if (error instanceof AbortError) {
      throw new Error('Request timed out')
    } else {
      throw new Error(error)
    }
  }
}

export default () => {
  return {
    fetch
  }
}
