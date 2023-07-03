module.exports = {
  // 继承的规则
  extends: ['git-commit-emoji', 'cz'],
  // 定义规则类型
  rules: {
    'type-enum': [2, 'never'],
    // subject 大小写不做校验
    'subject-case': [0]
  }
}
