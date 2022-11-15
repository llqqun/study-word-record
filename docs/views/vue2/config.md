# 项目开发配置

## eslint + prettier 配置

standard 标准配置(其它标准差别不大)

> 安装包

```json
{
  "@vue/cli-plugin-eslint": "~4.5.0",
  "@vue/eslint-config-prettier": "^6.0.0",
  "@vue/eslint-config-standard": "^6.0.0",
  "eslint": "^7.29.0",
  "eslint-plugin-import": "^2.23.4",
  "eslint-plugin-node": "^11.1.0",
  "eslint-plugin-prettier": "^3.3.1",
  "eslint-plugin-promise": "^5.1.0",
  "eslint-plugin-standard": "^5.0.0",
  "eslint-plugin-vue": "^6.2.2",
  "prettier": "^2.2.1"
}
```

.eslintrc.js 配置

```js
module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/essential', 'eslint:recommended', '@vue/standard', '@vue/prettier'],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
}
```

## svg-sprite-loader 精灵图使用配置

安装包

```
  "svg-sprite-loader": "4.1.3",
```

vue.config.js 设置

```js
config.module.rule('svg').exclude.add(resolve('src/icons')).end()
config.module
  .rule('icons')
  .test(/\.svg$/)
  .include.add(resolve('src/icons'))
  .end()
  .use('svg-sprite-loader')
  .loader('svg-sprite-loader')
  .options({
    symbolId: 'icon-[name]',
  })
  .end()
```

此时打包工具自动将.svg 文件打包成一个 sprite 文件,项目中可以直接使用 svg 标签引用

```json

```

## 浏览器兼容

环境： vue2 + vue CLI5  
问题： IE浏览器11及以下版本打开白屏，控制台报语法错误  
原因： 项目中使用的js语法中包含了es6以上版本的语法  
解决办法1：导入所有的polyfill，达到向下兼容。  
缺点是最终打包的体积会变大  
vue CLI5 官方提供了[解决方案](https://cli.vuejs.org/zh/guide/browser-compatibility.html#usebuiltins-usage)。  
 `babel.config.js` 文件
``` js
module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', { useBuiltIns: 'entry' }]
  ]
}
```
main.js，添加这两个包（前提项目中要安装core-js）
```js
import 'core-js/stable'
import 'regenerator-runtime/runtime'
```
最后检查browserslist 配置，有的是写在`package.json`,有的是单独一个配置文件。
我这里多了`not dead`这个导致前面配置好了，依然没用，这里要把这个删除
```json
"browserslist": [
    "> 1%",
    "last 2 versions",
//    "not dead"
  ]
```
最后打开IE8至IE11都能显示了  

引入的第三方包，构建工具默认是不会进行转换的  
将其添加到 vue.config.js 中的 transpileDependencies 选项。  
这会为该依赖同时开启语法转换和根据使用情况检测 polyfill。
```json
// vue.config.js
transpileDependencies: []
```
官方推荐的按需转换
```js
// babel.config.js
module.exports = {
  presets: [
    ['@vue/app', {
      polyfills: [
        'es.promise',
        'es.symbol'
      ]
    }]
  ]
}
```
