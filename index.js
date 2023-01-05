//加载库
import { loadLibs } from './src/load'

//执行src文件夹内容的default方法
await loadLibs()

//初始化机器人
newBot()

//确保需要预先加载的插件
await loadPlugins(['./plugins/knex'])
//加载其余插件
await loadPluginDir('./plugins')
