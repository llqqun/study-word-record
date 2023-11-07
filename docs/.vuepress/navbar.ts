export default [
  { text: "首页", link: "/" },
  {
    text: "前端",
    children: [
      { text: "WebPack", link: "/views/webpack/5" },
      { text: "TypeScript", link: "/views/ts-work" },
      { text: "js + html + css", link: "/views/javaScript/javaScript" },
      { text: "vue2", link: "/views/vue2/baseIndex" },
      { text: "vue3", link: "/views/vue3/baseIndex" },
      { text: "css", link: "/views/css/cssFAQ" },
      { text: "tinymceAPI", link: "/views/tinymce/introduce" },
      { text: "tool", link: "/views/tool/tool" },
      { text: "乱七八糟", link: "/views/common/chore" },
    ],
  },
  {
    text: "服务端",
    children: [
      { text: "Python", link: "/views/server/python/" }
    ]
  },
  { text: "面试", link: "/views/interview" },
  { text: "FAQ", children: [] },
];
