export default [
  { text: "首页", link: "/" },
  {
    text: "学习笔记",
    children: [
      { text: "TypeScript", link: "/views/ts-work" },
      { text: "javaScript", link: "/views/javaScript/baseIndex" },
      { text: "vue2", link: "/views/vue2/baseIndex" },
      { text: "vue3", link: "/views/vue3/baseIndex" },
      { text: "css", link: "/views/css/cssFAQ" },
      { text: "杂谈", link: "/views/common/chore" },
    ],
  },
  { text: "面试", link: "/views/interview" },
  { text: "FAQ", children: [] },
];
