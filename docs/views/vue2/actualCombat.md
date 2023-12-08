---
title: vue2 项目实战
---
## 项目内添加全局less变量(这样就不用手动的到每个文件里去@import)

环境 @vue/cli 5.0.0

安装插件

```cmd
npm i style-resources-loader -D
npm i vue-cli-plugin-style-resources-loader -D
```

配置vue.config.js

```js
module.exports = defineConfig({
    pluginOptions: {
    'style-resources-loader': {
      preProcessor:'less',
      patterns: [
        path.resolve(__dirname, './src/assets/css/variables.less'),
      ]
    }
  },
    // chainWebpack: config => {
    //     config.module
    //         .rule('less')
    //         .oneOf('vue')
    //         .use('style-resources-loader')
    //         .loader('style-resources-loader')
    //         .options({
    //             patterns: [path.resolve(__dirname, 'src/assets/less/variables.less')]
    //         }
    // }
})
```

## 添加svg图标

