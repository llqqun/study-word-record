---
title: Nuxt3
---

# Nuxt3

## Nuxt3 编译资源正确的引入css、less、sass

Nuxtjs 默认只是支持css，如需要支持less/sass等，需要自行安装对应loader。

加载css资源文件只需要在，nuxt.config.ts配置文件中添加上css配置即可：
```js
export default defineNuxtConfig({
    // css
    css: ['@/assets/css/index.css'],
})
```

需要使用less/sass的情况下，需要单独安装，在通过vite配置实现，实现全局引入的css实现。
```cmd
npm install --save less less-loader
```

vite配置，nuxt.config.ts配置vite。
```js
export default defineNuxtConfig({
    // css
    css: ['@/assets/css/index.css'],
    // vite
    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: '@use "@/assets/css/index.scss" as *;'
                }
            }
        }
    }
})
```

