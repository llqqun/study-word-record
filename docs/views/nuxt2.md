# nuxt2 开发  

## fetch hook  

官方介绍文档[https://nuxtjs.org/docs/features/data-fetching/#listening-to-query-string-changes]

作为页面生命周期时服务端渲染和客户端路由跳转都会触发  

属性配置

fetchOnServer: 服务端渲染是否触发

## servermiddleware 服务端中间件 实现重定向

服务中间件[官方文档](https://v2.nuxt.com/docs/configuration-glossary/configuration-servermiddleware#the-servermiddleware-property)里有说明默认导出的是一个方法
`function(req, res, next)`
参数req和res都是nodejs中的类型

```js
// nuxt.config.js
export default {
  serverMiddleware: [
    (req, res, next) => {
      if (req.url === '/old-url') {
        res.writeHead(301, {
          Location: '/new-url'
        })
        res.end()
      } else {
        next()
      }
    }
  ]
}
```

## svg 服务端渲染  

```js
// nuxt.config.js
//安装 svg-sprite-loader 处理svg文件, nuxt默认处理svg成base64图片
build: {
  extend (config, { isClient, isServer, isDev }) {
        const svgRule = config.module.rules.find(rule => rule.test.test('.svg'))
        svgRule.exclude = [path.join(__dirname, 'assets/svg-icon')]
        config.module.rules.push({
          test: /\.svg$/,
          include: [path.join(__dirname, 'assets/svg-icon')],
          use: [{ loader: 'svg-sprite-loader', options: { symbolId: 'icon-[name]' } }]
        })
      }
    }
```

```js
// plugins/svg-plugin.js 配置
import Vue from 'vue'
import SvgIcon from '@/components/common/svgicon'// Nuxt 默认@指向根目录

// 注册组件
Vue.component('SvgIcon', SvgIcon)
// 读取svg文件
const catchSvg = {}
const req = require.context('@/assets/svg-icon', false, /\.svg$/)
const requireAll = requireContext => requireContext.keys().map((key) => {
  return (catchSvg[key] = requireContext(key))
})
requireAll(req)
```

```vue
// svg封装组件
<template>
  <div class="box-svg">
    <div class="svg-icon" v-on="$listeners" v-html="svgContent"></div>
  </div>
</template>

<script>

export default {
  name: 'SvgIcon',
  props: {
    iconClass: {
      type: String,
      required: true
    }
  },
  computed: {
    svgContent () {
      if (this.catchSvg) {
        return this.catchSvg[`./${this.iconClass}.svg`]?.default.content.replace(/symbol/g, 'svg')
      } else {
        return ''
      }
    }
  }
}
</script>

<style scoped>
.box-svg {
  display: inline-block;
  line-height: normal;
}
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

.svg-external-icon {
  background-color: currentColor;
  mask-size: cover!important;
  display: inline-block;
}
</style>

```

## 引入第三方包es6语法未转换

## 全局变量

```js
process.server // 判断是否为服务端
process.client // 判断是否为客户端
```

## 部署(linux + pm2)

第一步 本地先build 项目生成dist文件

第二步 将 `.nuxt`, static, nuxt.config.js, package.json 打包压缩成.zip包 上传到服务器指定文件夹

第三步 解压.zip文件

```cmd
unzip nuxt.zip
```

第四步 安装包

```cmd
npm install
```

第五步 启动项目

```cmd
npm run start
```

至此项目在服务端就部署完成了

通过pm2 部署项目

```cmd
pm2 start npm -- start
```
