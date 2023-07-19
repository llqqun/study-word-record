# nuxt2 开发  

## fetch hook  

官方介绍文档[https://nuxtjs.org/docs/features/data-fetching/#listening-to-query-string-changes]

服务端渲染和客户端路由跳转都会触发

属性配置

fetchOnServer: 服务端渲染是否触发

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
