import fs from 'node:fs'
import nodePath from 'node:path'
import { getDirname } from '@vuepress/utils'

const __dirname = getDirname(import.meta.url)

// 面试题手册所在目录：docs/views/interview/qd
const INTERVIEW_DIR = nodePath.resolve(__dirname, '../views/interview/qd')

/**
 * 读取章节标题：
 * 1. 优先取 frontmatter 里的 title
 * 2. 其次取第一个一级/二级标题
 * 3. 最后退化为文件名
 */
const readChapterTitle = (file: string): string => {
  const raw = fs.readFileSync(nodePath.join(INTERVIEW_DIR, file), 'utf8')
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  const frontmatterTitle = frontmatter?.[1].match(/^title:\s*(.+)$/m)?.[1]
  if (frontmatterTitle) {
    return frontmatterTitle.trim().replace(/^['"]|['"]$/g, '')
  }
  const heading = raw.split(/\r?\n/).find((line) => /^#{1,2}\s+/.test(line))
  return heading
    ? heading.replace(/^#{1,2}\s+/, '').trim()
    : file.replace(/\.md$/, '')
}

/**
 * 扫描目录自动生成章节菜单：
 * 以后往 qd 目录里加 md，左侧菜单会自动出现，不用再手改配置
 */
const interviewChapters = fs.existsSync(INTERVIEW_DIR)
  ? fs
      .readdirSync(INTERVIEW_DIR)
      .filter((file) => file.endsWith('.md'))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
      .map((file) => ({
        text: readChapterTitle(file),
        link: `/views/interview/qd/${file.replace(/\.md$/, '.html')}`,
      }))
  : []

export default {
  "/views/vue3/": [
    {
      text: "vue3源码解读",
      children: ["/views/vue3/baseIndex.md", "/views/vue3/runtime-dom.md"],
    },
  ],
  "/views/vue2/": [
    {
      text: "vue2",
      children: [
        "/views/vue2/baseIndex.md",
        "/views/vue2/Source Code Interpretation.md",
        "/views/vue2/observation.md",
        "/views/vue2/vnode.md",
        "/views/vue2/template.md",
        "/views/vue2/config.md",
        "/views/vue2/asyncComponents.md",
      ],
    },
  ],
  "/views/miniProject": [
    { text: "小程序", children: ["/views/miniProject/wx.md"] }
  ],
  "/views/server/python/": [
    {
      text: 'Python',
      children: [
          "/views/server/python/index.md",
          "/views/server/python/var.md",
          "/views/server/python/issue.md",
          "/views/server/python/tool.md"
      ]
    }
  ],
  "/views/server/linux/": [
    {
      text: 'Linux',
      children: [
          "/views/server/linux/index.md",
          "/views/server/linux/redis.md"
      ]
    }
  ],
  "/views/server/tool": [
    {
      text: '工具',
      children: [
          "/views/server/tool/index.md"
      ]
    }
  ],
  "/views/javaScript/": [
    {
      text: "javaScript",
      children: [
        "/views/javaScript/eventLoop.md",
        "/views/javaScript/browserRender.md",
        "/views/javaScript/svg.md",
        "/views/javaScript/Promise.md",
        "/views/javaScript/javaScript.md",
        "/views/javaScript/utils.md",
        "/views/javaScript/function.md",
        "/views/javaScript/dom.md",
        "/views/javaScript/FAQ.md",
        "/views/javaScript/class.md",
      ],
    },
  ],
  "/views/common/": [
    {
      text: "工具",
      children: [
        "/views/common/chore.md",
        "/views/common/linux.md",
        "/views/common/canvas.md",
        "/views/common/mammoth.md",
      ],
    },
  ],
  "/views/css/": [
    {
      text: "css记录",
      children: ["/views/css/cssFAQ.md"],
    },
    {
      text: "SASS",
      children: ["/views/css/sass.md"],
    },
  ],
  "/views/tinymce/": [
    {
      text: "tinymce",
      children: ["/views/tinymce/introduce.md"],
    },
  ],
  "/views/webpack/": [
    {
      text: "webpack",
      children: ["/views/webpack/5.md", "/views/webpack/4.md"]
    },
  ],
  // 面试题手册：统一挂在 /views/interview/ 下，章节菜单由上面的目录扫描生成
  "/views/interview/": [
    {
      text: "前端面试题手册",
      collapsible: true,
      children: [
        { text: "手册总览", link: "/views/interview/" },
        ...interviewChapters,
      ],
    },
  ],
  "/views/tool/": [
    {
      text: "TOOL",
      children: [
        "/views/tool/index.md",
        "/views/tool/webstorm.md",
        "/views/tool/videojs.md",
        "/views/tool/uniapp.md",
        "/views/tool/tool.md",
        "/views/tool/package.md",
        "/views/tool/nginx.md",
        "/views/tool/git.md",
        "/views/tool/docker.md",
        "/views/tool/NavicatPremium.md",
        "/views/tool/window.md",
        "/views/tool/markdown.md",
        "/views/tool/ps.md",
    ]
    },
  ],
};
