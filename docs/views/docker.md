# DOKER

## 常用命令 

```cmd

  run         通过镜像创建一个容器
  exec        在正在运行的容器中执行命令
  ps           查看容器列表(-a 查看所有容器包括已停止的)
  build       从dockerFile构建镜像
  pull        远程下载镜像
  push        上传镜像文件
  images     镜像列表
  login       
  logout      Log out from a registry
  search      Search Docker Hub for images
  version     Show the Docker version information
  info        Display system-wide information

```

```cmd
// 查找镜像
docker search [镜像名称]

// 下载镜像
docker pull nginx

// 删除镜像
docker rmi [镜像名称或者id]

```

运行一个Nginx容器

```cmd
docker run -d -p 5000:80 nginx2
// or
docker run --name nginx-docker-con  -d -p 5000:80 nginx2
```

部署外部路径 `/usr/local/dockerWork`到容器内

```cmd
docker run -d --name nginx-demo -p 5000:80  -v /usr/local/dockerWork:/usr/share/nginx/html:ro nginx
```

将文件复制到容器内

```cmd
docker cp 797c652d907e:/etc/nginx/nginx.conf /usr/local/nginx/conf/nginx.conf
// 容器id:内部路径 外部文件
```

查看容器日志

```cmd
docker logs -f [容器ID或者容器名称]
```
