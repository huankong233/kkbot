import { CronJob } from 'cron'
export function cron(cronTime, func, ...args) {
  const pluginName = global.nowLoadPluginName
  new CronJob(
    cronTime,
    async function () {
      global.nowPlugin = pluginName
      await func()
      global.nowPlugin = null
    },
    ...args
  )
}
