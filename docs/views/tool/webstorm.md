# debugger 调试html 失败

单击右键小甲虫Debugger HTML 页面时chrome打开空白页

弹出提示信息

```md
正在等待连接到 localhost:port。
请确保在打开远程调试端口的情况下成功启动浏览器。
如果已启动具有相同用户数据目录的 Chrome，将无法打开端口
```

> 解决办法

打开 tool -> Web Browsers and Preview

编辑打开的浏览器,添加命令行选项`--remote-allow-origins=*`, 应用保存,重新debug
