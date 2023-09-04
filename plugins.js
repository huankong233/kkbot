import { loadPlugins, loadPluginDir } from './libs/loadPlugin.js'

export default async function () {
  // 加载插件(存在依赖关系在里面)
  await loadPluginDir('plugins_dependencies')
  await loadPlugins(['pigeon', 'query'])
  await loadPluginDir('plugins')
  await loadPlugins(['searchImage', 'help'])
}
