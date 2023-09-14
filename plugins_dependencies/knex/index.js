import knex from 'knex'
import { makeLogger } from '../../libs/logger.js'
import { globalReg } from '../../libs/globalReg.js'

const logger = makeLogger({ pluginName: 'knex' })
const debuglogger = makeLogger({ pluginName: 'knex', subModule: 'sql' })

export default async function () {
  const { knexConfig } = global.config
  try {
    const database = knex({
      ...knexConfig,
      log: {
        debug(message) {
          debuglogger.DEBUG('发起一条SQL查询\n', message)
        }
      }
    })

    //测试连通性:
    const result = await database.raw('select 10 * 10')
    if (result[0][0]['10 * 10'] === 100) {
      globalReg({ database })
      logger.SUCCESS('连接数据库成功')
    }
  } catch (error) {
    logger.WARNING('连接数据库失败,请检查数据库设置或数据库可能未运行')
    logger.INFO('数据库配置:\n', JSON.stringify(global.config.knex))
    debug ? logger.DEBUG(error) : logger.WARNING(error)
  }
}
