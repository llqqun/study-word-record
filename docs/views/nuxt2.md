# nuxt2 开发  

## fetch hook  

官方介绍文档[https://nuxtjs.org/docs/features/data-fetching/#listening-to-query-string-changes]

在页面组件使用和在子组件使用效果不一样  
在页面组件使用时,服务端渲染和客户端路由跳转都会触发  
在子组件使用时,只有在服务端渲染时才会触发  
