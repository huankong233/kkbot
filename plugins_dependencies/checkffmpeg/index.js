export default async () => {
  await checkffmpeg()
}

import { canSendRecord } from '../../libs/Api.js'

export const checkffmpeg = async () => {
  global.config.bot.ffmpeg = (await canSendRecord()).data.yes
}
