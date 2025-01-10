export default [
  { text: "首页", link: "/" },
  {
    text: "前端",
    children: [
      { text: "WebPack", link: "/views/webpack/5" },
      { text: "TypeScript", link: "/views/ts-work" },
      { text: "js + html + css", link: "/views/javaScript/javaScript" },
      { text: "小程序", link: "/views/miniProject/wx" },
      { text: "vue2", link: "/views/vue2/baseIndex" },
      { text: "vue3", link: "/views/vue3/baseIndex" },
      { text: "style", link: "/views/css/cssFAQ" },
      { text: "tinymceAPI", link: "/views/tinymce/introduce" },
      { text: "乱七八糟", link: "/views/common/chore" },
    ],
  },
  {
    text: "服务端",
    children: [
      { text: "Python", link: "/views/server/python/" },
      { text: "Linux", link: "/views/server/linux/" },
      { text: "TooL", link: "/views/server/tool/" },
    ]
  },
  {
    text: "杂项",
    children: [
      { text: "win电脑", link: "/views/tool/window" },
      { text: "tool", link: "/views/tool/tool" },
    ]
  },
  { text: "面试", link: "/views/interview" },
  { text: "FAQ", children: [] },
];
