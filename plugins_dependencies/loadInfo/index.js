import { canSendRecord, getLoginInfo } from '../../libs/Api.js'

export default async () => {
  const { botData } = global.data
  botData.ffmpeg = (await canSendRecord()).data.yes
  botData.info = (await getLoginInfo()).data
}
