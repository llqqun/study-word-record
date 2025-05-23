# npm

[国内镜像配置](https://npmmirror.com/?spm=a2c6h.24755359.0.0.58f74dcc3VVCku)

原始镜像地址 https://registry.npmjs.org/

```
npm --registry=https://registry.npmmirror.com
```

获取当前镜像
```
npm config get registry
```

设置为淘宝镜像
```
npm config set registry https://registry.npmmirror.com
```

## 镜像管理工具nrm

```
npm install -g nrm
```

查看当前镜像
```
nrm ls
```

切换镜像
```
nrm use taobao
```

添加镜像
```
nrm add <registry> <url>
```

删除镜像
```
nrm del <registry>
```

## npm 常用命令

```
npm init -y // 初始化项目
npm install // 安装依赖
npm install <package_name> // 安装依赖
npm install <package_name>@<version> // 安装指定版本的依赖
npm install -g <package_name> // 全局安装依赖
npm install -D <package_name> // 开发环境安装依赖
npm install -S <package_name> // 生产环境安装依赖
npm uninstall <package_name> // 卸载依赖
npm uninstall -g <package_name> // 卸载全局依赖
npm update // 更新依赖
npm update <package_name> // 更新指定依赖
npm update -g <package_name> // 更新全局依赖
npm list // 列出所有依赖
npm list -g // 列出所有全局依赖
npm search <package_name> // 搜索依赖
npm info <package_name> // 查看依赖信息
npm help <command> // 查看命令帮助
npm cache clean // 清理缓存
npm config set <key> <value> // 设置配置
npm config get <key> // 获取配置
npm config delete <key> // 删除配置
npm config list // 列出所有配置
npm config edit // 编辑配置文件
npm config get prefix // 获取npm全局安装目录
npm config get cache // 获取npm缓存目录
npm config get userconfig // 获取npm配置文件路径
npm config get init-module // 获取npm初始化模块路径
npm publish // 发布包
```

## package.json

[官网文档](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#repository)

```json
{
  "name": "包名称",
  "description": "包描述",
  "version": "版本",
  "keywords": "关键字",
  "homepage": "项目主页地址",
  "bugs": {
    "url": "",
    "email": ""
  }, //"bugs用于项目问题的反馈issue地址或者一个邮箱"
  "license": "MIT", // 许可证标识代码
  "author": {}, // 项目作者
  "files": [], //内容是模块下文件名或者文件夹名，如果是文件夹名，则文件夹下所有的文件也会被包含进来
  "funding": "", // 赞助商
  "main": "", //定义npm包的入口文件
  "module": "", // npm包的ESM规范
  "browser": "", // 定义npm包在浏览器环境下的入口文件
  "repository": {
    "url": "",
    "type": ""
  }, //指定一个代码存放地址，对想要为你的项目贡献代码的人有帮助。url最好是一个公开的地址
  "script": {}, //scripts属性是一个对象，里边指定了项目的生命周期个各个环节需要执行的命令。key是生命周期中的事件，value是要执行的命令
  "config": {
    "port": 8080
  }, //用于添加命令行的环境变量
  "private": true, // npm拒绝发布此包
   "browserslist": [ // 浏览器兼容配置标准
      "> 1%",
      "last 2 versions"
   ],
  "os": ["darwin", "linux", "win32"] // 指定模块运行环境
}
```
### browserslist 浏览器兼容配置

package.json 或者 .browserslistrc配置文件
```json
{
  "browserslist": [
    "last 1 version",
    "> 1%",
    "maintained node versions",
    "not dead"
  ]
}
```
> 查询列表  
> 直接在工程目录下运行npx browserslist 来查看你配置的筛选条件筛选出的浏览器版本范围。  
* 5%: 基于全球使用率统计而选择的浏览器版本范围。>=,<,<=同样适用。
* 5% in US : 同上，只是使用地区变为美国。支持两个字母的国家码来指定地区。
* 5% in alt-AS : 同上，只是使用地区变为亚洲所有国家。这里列举了所有的地区码。
* 5% in my stats : 使用定制的浏览器统计数据。
* cover 99.5% : 使用率总和为99.5%的浏览器版本，前提是浏览器提供了使用覆盖率。
* cover 99.5% in US : 同上，只是限制了地域，支持两个字母的国家码。
* cover 99.5% in my stats :使用定制的浏览器统计数据。
* maintained node versions :所有还被 node 基金会维护的 node 版本。
* node 10  and node 10.4 : 最新的 node 10.x.x 或者10.4.x 版本。
* current node :当前被 browserslist 使用的 node 版本。
* extends browserslist-config-mycompany :来自browserslist-config-mycompany包的查询设置
* ie 6-8 : 选择一个浏览器的版本范围。
* Firefox > 20 : 版本高于20的所有火狐浏览器版本。>=,<,<=同样适用。
* ios 7 :ios 7自带的浏览器。
* Firefox ESR :最新的火狐 ESR（长期支持版） 版本的浏览器。
* unreleased versions or unreleased Chrome versions : alpha 和 beta 版本。
* last 2 major versions or last 2 ios major versions :最近的两个发行版，包括所有的次版本号和补丁版本号变更的浏览器版本。
* since 2015 or last 2 years :自某个时间以来更新的版本（也可以写的更具体since 2015-03或者since 2015-03-10）
* dead :通过last 2 versions筛选的浏览器版本中，全球使用率低于0.5%并且官方声明不在维护或者事实上已经两年没有再更新的版本。目前符合条件的有 IE10,IE_Mob 10,BlackBerry 10,BlackBerry 7,OperaMobile 12.1。
* last 2 versions :每个浏览器最近的两个版本。
* last 2 Chrome versions :chrome 浏览器最近的两个版本。
* defaults :默认配置> 0.5%, last 2 versions, Firefox ESR, not dead。
* not ie <= 8 : 浏览器范围的取反。  
可以添加not在任和查询条件前面，表示取反  


## .npmrc

npm 运行时配置文件

```
# 默认的依赖包安装源
registry=https://registry.npm.taobao.org/

# 配置私有库地址
@lq:registry=http://81.69.237.81:4873/

package-lock=false;     //在安装时忽略lock文件。
loglevel=timing；      // 安装依赖包的时候指定日志的类型
```

## jsconfig.json

配置js工程项目文件

```json
{
  "compilerOptions": {
       "baseUrl": "./",
       "allowJs": false,
       "alwaysStrict": false,
       "checkJs": false,
       "declaration": false,
       "declarationDir": "",
       "downlevelIteration": true,
       "emitDecoratorMetadata": false,
       "esModuleInterop": false,
       "experimentalDecorators": false,
       "forceConsistentCasingInFileNames": true,
       "importHelpers": false,
       "jsx": "preserve",
       "jsxFactory": "",
       "lib": ["es2015"],
       "module": "es6",
       "target": "es6",
       "paths": {
          "@/*": ["src/*"]
        }
   },
   "exclude": ["node_modules", "dist"]
}
```

## 私有仓库搭建

事前准备

- linux centos7 系统
- firewall-cmd 防火墙软件 (系统默认自带,没有开启)
- node 环境
- pm2
- verdaccio 工具

1. 安装 verdaccio

```js
npm install -g verdaccio
```

2. 启动 verdaccio

![Images](/images/jt1.png)

3. 打开上图生成的配置文件 config.yaml,在最后写入

```js
listen: 0.0.0.0:4873
```

4. 开发端口

```js
firewall-cmd --zone=public --add-port=4873/tcp --permanent
```

5. 重启防火墙

```js
firewall-cmd --reload
```

6.  检查是否配置成功

```js
firewall-cmd --zone=public --query-port=4873/tcp
```

7. 启动 verdaccio
   ![Images](/images/jt2.png)

8. 通过 pm2 守护进程,自动运行

```js
pm2 start verdaccio
```

9. 按照启动页面进行包的发布,使用
   ![Images](/images/jt3.png)
   > 配置失败注意  
   > 服务器的防火墙是否配置  
   > node 版本 16+

## 浏览器http跳转https

> chrome

打开chrome://net-internals/#hsts

左侧菜单Domain Security Policy

右侧菜单Delete domain security policies

输入要删除的域名,单击delete
