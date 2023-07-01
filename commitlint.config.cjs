module.exports = {
  // 继承的规则
  extends: ['@commitlint/config-conventional'],
  // 定义规则类型
  rules: {
    // type 类型定义，表示 git 提交的 type 必须在以下类型范围内
    'type-enum': [
      2,
      'always',
      [
        'wip', // 开发中
        'feat', // 新功能 feature
        'fix', // 修复 bug
        'style', // 代码格式(不影响代码运行的变动)
        'refactor', // 重构(既不增加新功能，也不是修复bug)
        'ci', // ci
        'revert', // 回退
        'build', // 打包
        'chore', // 构建过程或辅助工具的变动
        'test', // 增加测试
        'docs', // 文档注释
        'init' // 初始化
      ]
    ],
    // subject 大小写不做校验
    'subject-case': [0]
  }
}
