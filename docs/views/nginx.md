# Nginx 使用汇总

常用命令

- nginx -h：查看帮助
- nginx -v：查看nginx的版本
- nginx -V：查看版本和nginx的配置选项
- nginx -t：测试配置文件的正确性
- Nginx -T: 测试配置文件，并显示配置文件（这个命令可以快速查看配置文件）
- nginx -q：测试配置文件，但是只显示错误信息
- nginx -s：发送信号，下面详细介绍
- nginx -p：设置前缀
- nginx -c：设置配置文件
- nginx -g：附加配置文件路径

```js
nginx -s stop // 立即停止
nginx -s reload // 重启服务
```

