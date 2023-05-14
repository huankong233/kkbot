export const enable = false

export default () => {
  loadConfig('bing.jsonc', true)

  event()
}

async function event() {
  RegEvent('message', async (event, context, tags) => {
    if (context.command) {
      if (context.command.name === 'bing') {
        await handler(context)
      }
    }
  })
}

async function handler(context) {
  const params = context.command.params
  const { execSync } = await import('child_process')
  try {
    const path = getDirName(import.meta.url)
    console.log(path)
    const data = execSync(
      `python3 ${path}/chat.py ${global.config.bing.cookiePath} ${global.config.bing.tempContextFile} ${params[0]}`
    )
    console.log(data)
  } catch (e) {}
}
