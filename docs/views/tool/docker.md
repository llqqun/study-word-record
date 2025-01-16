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

### 1. 镜像管理

拉取镜像
```cmd
docker pull <image_name>[:<tag>]
```

删除镜像
```cmd
docker rmi [镜像名称或者id]
```

列出本地镜像列表
```cmd
docker images
```

构建镜像
```cmd
docker build -t [镜像名称] [dockerfile路径]
```

### 2. 容器管理

根据镜像创建容器
```cmd
docker run [参数] [镜像名称] [命令]

docker run -d -p 5000:80 nginx
// or
docker run --name nginx-docker-con  -d -p 5000:80 nginx
```

外部路径 `/usr/local/dockerWork`目录挂载到容器内
```cmd
docker run -d --name nginx-demo -p 5000:80  -v /usr/local/dockerWork:/usr/share/nginx/html:ro nginx
```

将文件复制到容器内
```cmd
docker cp 797c652d907e:/etc/nginx/nginx.conf /usr/local/nginx/conf/nginx.conf
// 容器id:内部路径 外部文件
```

进入容器
```cmd
  docker exec -it [容器ID或者容器名称] [命令]
  // 示例
  docker exec -it mynginx /bin/bash
```

启动容器/停止容器
```cmd
docker start [容器ID或者容器名称]
docker stop [容器ID或者容器名称]
```

删除容器
```cmd
docker rm [容器ID或者容器名称]
docker rm -f [容器ID或者容器名称]
```

查找容器
```cmd
// 先查找所有容器
// 然后通过linux命令grep 过滤
docker ps | grep [过滤参数]
// 列出所有容器
docker ps -a
```

查看容器日志
```cmd
// 查看所有日志
docker logs -f [容器ID或者容器名称]

// 添加过滤条件
docker logs -f[容器ID或者容器名称] --tail=10
```

### 3. Docker Compose

启动服务
```cmd
docker-compose up [options]
```

停止服务
```cmd
docker-compose down
```
