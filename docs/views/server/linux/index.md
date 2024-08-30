---
lang: zh-CN
title: Linux
description: Cent OS7
---

# Linux

## 常用命令

[菜鸟文档地址](https://www.runoob.com/linux/linux-command-manual.html)

### 终端命令的格式
command [options] [arguments]  
* command：命令名称  
* options：命令选项，如：-l，-h等  
* arguments：命令参数，如：文件名等  

### 特殊符号

| 符号 | 说明 | 举例 |
| :---:|:---:| :---:|
| \ | 转义字符，表示下一字符为特殊字符 |
| * | 通配符，表示任意多个字符 |
| ? | 通配符，表示任意一个字符 |
| [] | 表示可选字符，如：[abc]表示a、b、c任意一个字符 |
| {} | 表示可选字符，如：{a,b,c}表示a、b、c任意一个字符 |
| > | 将命令的输出重定向到一个文件，如果文件已存在则覆盖。 | ls > filelist.txt |
| < | 将文件的内容作为命令的输入 | sort < unsorted.txt |
| & | 后台执行，将命令放到后台运行 |
| \| | 分隔符又叫管道，用于将一个命令的输出作为另一个命令的输入 | ls \| grep "pattern" |
| ; | 命令分隔符，将命令分成多个命令，依次执行 |


### 目录命令

 ls 列出当前目录下的文件  
 tree 树形结构显示当前目录下的文件  
 如果没有该命令，安装tree命令：sudo yum install tree

切换目录

cd [-options]

### 创建删除文件命令

| 命令 | 说明 |
| :---:|:---:|
| touch filename | 创建一个名为 filename 的文件 |
| mkdir dirname | 创建一个名为 dirname 的目录 |
| rm [-options] filename | 删除一个名为 filename 的文件，-f表示强制删除，-r表示递归删除 |
| rmdir dirname | 删除一个名为 dirname 的目录 |

### 复制及移动文件命令  

| 命令 | 说明 |
| :---:|:---:|
| cp [-options] source destination | 复制文件，-r表示递归复制 |
| mv [-options] source destination | 移动文件，-f表示强制覆盖 |

演示：
```bash
mkdir test
touch test/a.txt
cp test/a.txt test/b.txt
mv test/b.txt test/c.txt
ls test
```

### 查看文件内容

| 命令 | 说明 |
| :---:|:---:|
| cat filename | 显示文件内容 |
| less filename | 显示文件内容，支持上下翻页 |
| more filename | 显示文件内容，支持上下翻页 |

### 创建软链接和创建硬链接

软链接和硬链接的区别：
1. 软链接和硬链接都是文件，软链接是硬链接的快捷方式
2. 硬链接就是原文件的一个副本，硬链接和原文件指向同一个文件数据

| 命令 | 说明 |
| :---:|:---:|
| ln -s sourcePath targetPath | 创建软链接，-s表示创建软链接，-f表示覆盖 |
| ln sourcePath targetPath | 创建硬链接，-f表示覆盖 |

创建软链接时使用的路径使用绝对路径

### 文本搜索命令

| 命令 | 说明 |
| :---:|:---:|
| grep [-options] pattern filename | 在文件中搜索指定字符串，-i表示忽略大小写，-n表示显示行号，-v表示反向搜索，-r表示递归搜索 |

示例：
```bash
cat test/a.txt
cat test/b.txt
grep -i "hello" test/a.txt
cat test/a.txt | grep -i "hello"
cat test/a.txt | grep -i "hello" > test/c.txt
```

### 文件搜索

| 命令 | 说明 |
| :---:|:---:|
| find [-options] dirname | 在指定目录下查找指定文件，-name表示按文件名查找，-type表示按文件类型查找，-size表示按文件大小查找，-mtime表示按文件修改时间查找，-atime表示按文件访问时间查找，-ctime表示按文件创建时间查找，-exec表示执行命令，-delete表示删除文件 |

### 文件压缩和解压命令

linux 默认支持的压缩文件
 * \*.gz
 * \*.bz2
 * \*.zip  

说明:
gz 和 bz2 需要使用tar 命令进行压缩和解压
zip 需要使用zip 命令进行压缩和解压

| 命令 | 说明 |
| :---:|:---:|
| tar [-options] filename | 压缩文件，-c表示创建压缩文件，-t表示列出压缩文件内容，-x表示解压压缩文件，-f表示指定压缩文件，-v表示显示进度，-z表示使用gzip压缩，-j表示使用bzip2压缩，-J表示使用xz压缩，-C表示指定解压目录 |
| zip [-options] filename | 压缩文件，-r表示递归压缩，-v表示显示进度，-q表示不显示进度，-d表示删除文件，-u表示更新文件，-f表示指定压缩文件，-o表示覆盖同名文件，-j表示使用bzip2压缩，-z表示使用gzip压缩，-J表示使用xz压缩，-C表示指定解压目录 |
| unzip [-options] filename | 解压文件，-v表示显示进度，-q表示不显示进度，-d表示指定解压目录 |

### 文件权限命令
| 命令 | 说明 |
| :---:|:---:|
| chmod [-options] filename | -u表示修改用户权限，-g表示修改组权限，-o表示修改其他用户权限，-n表示不显示进度，-c表示显示修改权限的命令，-t表示显示 |
| sudo [-options] | -s 切换管理员权限, 命令前加sudo 使用管理员权限命令 |

## 远程连接

### windows

通过CMD命令行SSH连接远程服务器

首先要安装OpenSSH，在Windows 10中，默认已经安装了OpenSSH，直接使用即可。

```bash
ssh -p 22 root@192.168.1.1
```

远程文件传输(将本地文件传输到服务器),同理亦可以反向传输
```bash
scp -P 22 a.txt root@192.168.1.1:/home/b.txt
```
