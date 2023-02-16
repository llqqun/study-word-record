# nuxt2 开发  

## fetch hook  

官方介绍文档[https://nuxtjs.org/docs/features/data-fetching/#listening-to-query-string-changes]

在页面组件使用和在子组件使用效果不一样  
在页面组件使用时,服务端渲染和客户端路由跳转都会触发  
在子组件使用时,只有在服务端渲染时才会触发  (除非$fetch手动触发)

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

