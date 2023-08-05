import knex from 'knex'
import { logger } from '../../libs/logger.js'
import { globalReg } from '../../libs/globalReg.js'

export default async () => {
  try {
    const database = knex(global.config.knex)

    //测试连通性:
    await database.raw('select 100').then(result => {
      if (result[0][0]['100'] === 100) {
        globalReg({ database })
        logger.SUCCESS('连接数据库成功')
      }
    })
  } catch (error) {
    logger.WARNING('连接数据库失败,请检查数据库设置或数据库可能未运行')
    logger.INFO('数据库配置:\n', JSON.stringify(global.config.knex))

    if (debug) {
      logger.DEBUG(error)
    } else {
      logger.WARNING(error)
    }
  }
}
