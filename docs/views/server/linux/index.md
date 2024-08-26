---
lang: zh-CN
title: Linux
description: Cent OS7
---

# Linux

## 常用命令

终端命令的格式
command [options] [arguments]  
* command：命令名称  
* options：命令选项，如：-l，-h等  
* arguments：命令参数，如：文件名等  

目录命令

 ls 列出当前目录下的文件  
 tree 树形结构显示当前目录下的文件  
 如果没有该命令，安装tree命令：sudo yum install tree

切换目录

cd [-options]

创建删除文件命令

| 命令 | 说明 |
| :---:|:---:|
| touch filename | 创建一个名为 filename 的文件 |
| mkdir dirname | 创建一个名为 dirname 的目录 |
| rm [-options] filename | 删除一个名为 filename 的文件，-f表示强制删除，-r表示递归删除 |
| rmdir dirname | 删除一个名为 dirname 的目录 |

复制及移动文件命令  

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

