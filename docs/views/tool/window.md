---
title: "Window电脑"
---

# Window电脑操作

## MCD命令系列

### 端口命令

查找所有运行的端口
```CMD
netstat -ano
```

通过指定端口查找进程PID
```CMD
netstat -aon|findstr "8081"
```

通过pid查找进程
```cmd
tasklist|findstr "9088"
```

强制关闭PID进程
```cmd
taskkill /T /F /PID 9088 
```

## BAT 批处理命令

### 重命名文件夹内文件

```bat

@echo off
setlocal EnableDelayedExpansion

rem
set /a count=0

for /f "delims=" %%f in ('dir /b/od *.*') do (
  if not "%%f"=="%~nx0" (
           set /a b+=1 
           ren "%%f" "!b!%%~xf"
           echo. !b!%%~xf
)
)

pause

```