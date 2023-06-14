import url from 'url'
import path from 'path'

global.getDirName = importMetaUrl => {
  return path.dirname(url.fileURLToPath(importMetaUrl))
}
