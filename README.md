Github:https://github.com/huankong233/kkbot

Docker:https://hub.docker.com/r/huankong233/kkbot

# 🤖空空bot
这只是一个简单的QQ框架和简单的实现
插件有高耦合性，如果需要删除需要谨慎

# 🎉使用方法

- 建议使用[docker](https://hub.docker.com/r/huankong233/kkbot)

### 1.克隆项目
~~~sh
git clone https://github.com/huankong233/kkbot.git
~~~

### 2.安装必要环境
[nodejs](https://nodejs.org/)

[mysql](https://www.mysql.com/)

[python](https://www.python.org/downloads/)
安装完成后运行`pip3 install --no-cache-dir -r requirements.txt`

Tip:为了防止linux服务器存在python=python2,python3=python3的问题，默认直接调用python3，windows端的小盆友注意哦~

### 3.导入数据库(kkbot.sql)

### 4.安装支持库
~~~sh
npm install -g yarn
yarn install
~~~

### 5.修改配置文件

通常只需要修改bot.jsonc和knex.jsonc

### 6.运行框架
需要保持运行
~~~sh
yarn test
~~~

### 7.如果运行正常
后台运行
~~~sh
yarn start
~~~

### 8.小提示
~~~sh
# 后台运行
yarn start
# 退出运行
yarn stop
# 查询运行情况
yarn list
# 测试运行(node index.js)
yarn test
# 进入开发模式(自动重启，一般用户不建议使用)
yarn dev
~~~

# ⭐星星！

[![Stargazers over time](https://starchart.cc/huankong233/kkbot.svg)](https://starchart.cc/huankong233/kkbot)
