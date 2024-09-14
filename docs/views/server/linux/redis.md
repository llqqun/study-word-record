---
title: redis
category: redis
---


## 安装配置redis
yum install redis  

打开配置文件
vi /etc/redis.conf

配置连接密码(配置文件中)
requirepass [password]

启动redis
systemctl start redis  

停止redis
systemctl stop redis   

查看redis运行状态
systemctl status redis

查看redis进程
systemctl status redis

重启redis进程
systemctl restart redis

本机连接redis
redis-cli

如果有密码连接本机还需要输入密码(否则不管输入什么命令都不会执行)
auth [password]

## 使用命令

* set key value #设置键值对
* append key value #追加值
* get key #获取key对应的值
* del key #删除key
* keys * #获取所有key
* setex key seconds value #设置键值对，并设置过期时间
* ttl key #查看key的剩余生存时间
* mset key1 value1 key2 value2 ... #设置多个键值对
* mget key1 key2 ... #获取多个键对应的值
* expire key seconds #设置key的过期时间
* exists key #查看key是否存在
* type key #查看key的类型