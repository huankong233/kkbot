export default async () => {
  await checkffmpeg()
}

export const checkffmpeg = async () => {
  global.config.bot.ffmpeg = (await bot('can_send_record')).data.yes
}
