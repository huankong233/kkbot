import WebSocket from 'ws'

let websocket

async function connectWebSocket() {
  return new Promise((resolve, reject) => {
    websocket = new WebSocket(global.config.bing.websocket)

    websocket.onopen = () => {
      resolve()
    }

    websocket.onerror = error => {
      reject(error)
    }
  })
}

export async function get(userInput, userContext, password) {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    try {
      await connectWebSocket()
    } catch (error) {
      alert(`WebSocket error: ${error}`)
      return
    }
  }

  websocket.send(
    JSON.stringify({
      message: userInput,
      context: userContext,
      password: password
    })
  )

  return new Promise((resolve, reject) => {
    function finished(response) {
      resolve(response)
      websocket.onmessage = () => {}
    }

    websocket.onmessage = event => {
      const response = JSON.parse(event.data)
      if (response.type === 2) {
        if (response.item.messages[response.item.messages.length - 1].text) {
          finished(response)
        } else {
          reject('Looks like the user message has triggered the Bing filter')
        }
      } else if (response.type === 'error') {
        reject(response.error)
      }
    }
    websocket.onerror = error => {
      alert(`WebSocket error: ${error}`)
      reject(error)
    }
  })
}
