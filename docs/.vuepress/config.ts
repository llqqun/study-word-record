import { defineUserConfig, defaultTheme } from 'vuepress'
import { viteBundler } from '@vuepress/bundler-vite'
import { getDirname, path } from '@vuepress/utils'
import navbar from './navbar'
import sidebar from './sidebar'
// @ts-ignore
const __dirname = getDirname(import.meta.url)

export default defineUserConfig({
  base: '/',
  lang: 'zh-CN',
  title: '好好学习, 天天向上',
  description: 'LQ的学习记录网站',
  head: [['link', { rel: 'icon', href: '/favicon-32x32.png' }]],
  theme: defaultTheme({
    logo: '/hero.png',
    sidebarDepth: 6,
    navbar,
    sidebar,
  }),
  bundler: viteBundler({
    viteOptions: {},
  }),
})
