# 工具

## tree-cli 目录输出工具

安装 npm install -g tree-cli 或者 yarn add global tree-cli  

```cmd
--help, -h 输出用法信息
  --version 输出版本号
  --debug debug信息
  --ignore 忽略文件或者文件夹
  --base 指定根目录,支持相对路径或者绝对路径
  --fullpath 每个文件均打印全路径
  --noreport 不打印文件及文件夹的总数
  -a 默认是不打印以'.'或者'..'开头的文件或者文件夹，
     -a则打印所有包括'.'或者'..'开头的
  -d 只打印文件夹
  --directoryFirst 只打印顶级文件夹
  -f  为目录追加一个“/”，为套接字文件追加一个“=”和一个“|”表示FIFOs
  -i 不打印缩进线，一般与-f选项一起使用时生成平级目录
  -l 目录树的最大显示深度
  -o 打印内容导成文件
```
