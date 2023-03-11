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
  title: '这是什么?',
  description: 'WEB笔记本',
  head: [['link', { rel: 'icon', href: '/favicon-32x32.png' }]],
  theme: defaultTheme({
    logo: '/hero.png',
    sidebarDepth: 5,
    navbar,
    sidebar,
  }),
  bundler: viteBundler({
    viteOptions: {},
  }),
})
