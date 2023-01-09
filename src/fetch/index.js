import nodeFetch from 'node-fetch'

/**
 * 发送网络请求
 * @param {String} url
 * @param {Object} data
 * @param {String} type
 * @returns
 */
export const fetch = async (url = '', data = {}, type = 'GET') => {
  type = type.toUpperCase()

  if (type == 'GET') {
    let dataStr = ''
    Object.keys(data).forEach(key => {
      dataStr += key + '=' + data[key] + '&'
    })
    if (dataStr !== '') {
      dataStr = dataStr.substr(0, dataStr.lastIndexOf('&'))
      url = url + '?' + dataStr
    }
  }
  let requestConfig = {
    credentials: 'same-origin',
    method: type,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    mode: 'cors',
    cache: 'force-cache'
  }

  if (type == 'POST') {
    Object.defineProperty(requestConfig, 'body', {
      value: JSON.stringify(data)
    })
  }

  try {
    const response = await nodeFetch(url, requestConfig)
    const responseJson = await response.json()
    return responseJson
  } catch (error) {
    throw new Error(error)
  }
}

export default () => {
  return {
    fetch
  }
}
