import url from 'node:url'
import path from 'node:path'
Object.defineProperty(global, 'getDirName', {
  get() {
    return importMetaUrl => {
      return path.dirname(url.fileURLToPath(importMetaUrl))
    }
  },
  enumerable: true,
  configurable: false
})
