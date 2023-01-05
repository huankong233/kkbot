import knex from 'knex'

export default async () => {
  loadConfig('knex.jsonc', true)
  try {
    const database = knex(global.config.knex)
    //测试连通性:
    await database
      .raw('select 100')
      .then(result => {
        if (result[0][0]['100'] !== 100) {
          msgToConsole('=====================================================')
          msgToConsole('连接数据库成功,但是好像在进行运算时似乎有问题???')
          msgToConsole('=====================================================')
        } else {
          msgToConsole('连接数据库成功')
        }
        globalReg({ database })
      })
      .catch(err => {
        msgToConsole('连接数据库失败,请检查数据库设置或数据库可能未运行')
        msgToConsole('数据库配置:')
        console.log(global.config.knex)
        msgToConsole('错误日志:')
        throw err
      })
  } catch (error) {
    console.log(error)
    throw Error('请检查数据库配置文件!!!')
  }
}
