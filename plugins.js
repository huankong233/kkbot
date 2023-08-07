import { loadPlugin, loadPlugins, loadPluginDir } from './libs/loadPlugin.js'

export default async function () {
  // 初始化机器人
  if ((await loadPlugin('bot', 'plugins_dependencies')) !== 'success') {
    throw new Error('机器人加载失败')
  }

  // 加载插件(存在依赖关系在里面)
  await loadPluginDir('plugins_dependencies')
  await loadPlugins(['pigeon', 'query'])
  await loadPluginDir('plugins')
  await loadPlugins(['searchImage', 'help'])
}
