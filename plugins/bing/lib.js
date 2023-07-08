import WebSocket from 'ws'

async function connectWebSocket() {
  const { bing } = global.config
  return new Promise((resolve, reject) => {
    let websocket = new WebSocket(bing.websocket)

    websocket.onopen = () => {
      resolve(websocket)
    }

    websocket.onerror = error => {
      reject(error)
    }
  })
}

export async function get(userInput, userContext, password) {
  let websocket
  try {
    websocket = await connectWebSocket()
  } catch (error) {
    throw new Error(error)
  }

  websocket.send(
    JSON.stringify({
      message: userInput,
      context: userContext,
      password: password
    })
  )

  return new Promise((resolve, reject) => {
    websocket.onmessage = event => {
      const response = JSON.parse(event.data)
      if (response.type === 2) {
        if (response.item.messages[response.item.messages.length - 1].text) {
          resolve(response)
        } else {
          reject('Looks like the user message has triggered the Bing filter')
        }
      } else if (response.type === 'error') {
        reject(response.error)
      }
    }

    websocket.onerror = error => {
      reject(error)
    }
  })
}
