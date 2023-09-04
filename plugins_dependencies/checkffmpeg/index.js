import { canSendRecord } from '../../libs/Api.js'

export default async () => {
  global.data.botData.ffmpeg = (await canSendRecord()).data.yes
}
