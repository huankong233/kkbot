// module.exports = {
//   types: [
//     { value: 'feat', name: '✨feat:     新功能' },
//     { value: 'fix', name: '🐛fix:      修复' },
//     { value: 'docs', name: '✏️docs:     文档变更' },
//     { value: 'style', name: '💄style:    代码格式(不影响代码运行的变动)' },
//     {
//       value: 'refactor',
//       name: '♻️refactor: 重构(既不是增加feature，也不是修复bug)'
//     },
//     { value: 'perf', name: '⚡️perf:     性能优化' },
//     { value: 'test', name: '✅test:     增加测试' },
//     { value: 'chore', name: '🚀chore:    构建过程或辅助工具的变动' },
//     { value: 'revert', name: '⏪️revert:   回退' },
//     { value: 'build', name: '📦️build:    打包' },
//     { value: 'ci', name: '👷CI:   related changes' }
//   ],
//   // override the messages, defaults are as follows
//   messages: {
//     type: '请选择提交类型(必选):',
//     scope: '请输入文件修改范围(可选):',
//     customScope: '请输入修改范围(可选):',
//     subject: '请简要描述提交(必填):',
//     // body: '请输入详细描述(可选，待优化去除，跳过即可):',
//     // breaking: 'List any BREAKING CHANGES (optional):\n',
//     footer: '请输入要关闭的issue(待优化去除，跳过即可):',
//     confirmCommit: '确认使用以上信息提交？(y/n/e/h)'
//   },
//   // used if allowCustomScopes is true
//   allowCustomScopes: true,
//   // allowBreakingChanges: ['feat', 'fix'],
//   skipQuestions: ['body'],
//   // limit subject length, commitlint默认是72
//   subjectLimit: 72
// }

module.exports = {
  types: [
    { value: 'wip', name: '💪  Work in Progress | 开发中' },
    { value: 'feat', name: '✨  Features | 新功能' },
    { value: 'fix', name: '🐛  Bug Fixes | 修复' },
    { value: 'style', name: '💄  Styles | 代码样式' },
    { value: 'refactor', name: '🔨  Code Refactoring | 代码重构' },
    { value: 'ci', name: '💚  Fixing CI Build | CI 配置' },
    { value: 'revert', name: '⏪  Revert | 回退' },
    { value: 'build', name: '📦  Build System | 打包构建' },
    { value: 'chore', name: '🗯   Chore | 构建/工程依赖/工具' },
    { value: 'test', name: '✅  Tests | 测试' },
    { value: 'docs', name: '📝  Documentation | 文档变更' },
    { value: 'init', name: '🚀  Init | 初始化' }
  ],

  // 步骤
  messages: {
    type: '请选择提交的类型；',
    customScope: '请输入修改的范围（可选）',
    subject: '请简要描述提交（必填）',
    body: '请输入详细描述（可选）',
    footer: '请选择要关闭的issue（可选）',
    confirmCommit: '确认要使用以上信息提交？（y/n）'
  },

  // 跳过步骤
  skipQuestions: ['customScope', 'body', 'footer'],

  // 模块名
  // scopes: [{ name: 'account' }]

  // 默认长度
  subjectLimit: 72
}
