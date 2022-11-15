# GIT
## 本地合并远程设置远程为主分支

```
git remote add origin [你的git远程地址]  // 关联远程仓库
git push -u origin master	// 推送本地分支到远程仓库
git push --set-upstream origin master
git add .
git commit -m ''
git push
```

## Git 常用命令

| **命令**           | **功能**                                             | **格式**                                                     | **参数说明**                   | **使用实例**                                                 |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------ |
| ssh –keygen –t rsa | 生成密钥                                             | ssh –keygen –t rsa –C [email]                                | email：邮箱地址                | 在C盘.ssh文件夹下获取密钥文件“id_rsa.pub”ssh –keygen –t rsa –C "devcloud_key01@huawei.com" |
| git branch         | 新建分支。                                           | git branch [new branchname]                                  | new branchname：新的分支名     | 新建分支：git branch newbranch                               |
| git branch –D      | 删除分支                                             | git branch –D [new branchname]                               | new branchname：新的分支名     | 删除本地分支：git branch –D newbranch删除服务器仓库分支git branch –rd origin/newbranch同步远端已删除的分支git remote prune origin |
| git add            | 添加文件到暂存区。                                   | git add [filename]                                           | filename：文件名               | 添加一个文件到暂缓区：git add filename添加所有修改的和新增的文件到暂缓区：git add . |
| git rm             | 删除本地目录或文件。                                 | git rm [filename]                                            | filename：文件名或目录名       | 删除文件：git rm filename                                    |
| git clone          | 克隆远程仓库。                                       | git clone [VersionAddress]                                   | VersionAddress：版本库的网址。 | 克隆**jQuery**的版本库：git clone https://github.com/jquery/jquery.git该命令会在本地主机生成一个目录，与远程主机的版本库同名。 |
| git pull           | 把远程仓库的分支pull到本地，再与本地的指定分支合并。 | git pull [RemoteHostname] [RemoteBranchname]:[LocalBranchname] | -                              | 取回**“origin”**主机的**“next”**分支，与本地的**“master”**分支合并：git pull origin next:master |
| git diff           | 文件、分支、目录或版本的比较。                       | git diff                                                     | -                              | 当前与**“master”**分支的比较：git diff master                |
| git commit         | 文件提交。                                           | git commit                                                   | -                              | 添加提交信息：git commit –m "commit message"                 |
| git push           | 推送文件到远程仓库。                                 | git push [RemoteHostname] [LocalBranchname] [RemoteBranchname] | -                              | 如果省略远程分支名，则表示将本地分支推送与之存在“追踪关系”的远程分支（通常两者同名），如果该远程分支不存在，则会被新建：git push origin master上面命令表示，将本地的master分支推送到origin主机的master分支。如果后者不存在，则会被新建。 |
| git merge          | 合并分支。                                           | git merge [branch]                                           | branch：分支名                 | 假设当前分支为“develop”，将master主分支之后的最新提交merge到当前的develop分支上：git merge master |
| git checkout       | 切换分支。                                           | git checkout [branchname]                                    | branchname：分支名             | 切换到master分支：git checkout master                        |
| git log            | 列出日志信息。                                       | git log                                                      | -                              | 列出所有的log：git log –-all                                 |
| git status         | 查看状态输出。                                       | git status                                                   | -                              | git status                                                   |
| git grep           | 查找字符串。                                         | git grep                                                     | -                              | 查找是否有**“hello”**字符串：git grep "hello"                |
| git show           | 显示内容或修改的内容。                               | git show                                                     | -                              | git show v1显示**“tag v1”**的修改内容git show HEAD显示当前版本的修改文件git show HEAD^显示前一版本所有的修改文件git show HEAD~4显示前4版本的修改文件 |
| git stash          | 暂存区。                                             | git stash                                                    | -                              | git stash用于保存和恢复工作进度git stash list列出暂存区的文件git stash pop取出最新的一笔，并移除git stash apply取出但不移除git stash clear清除暂存区 |
| git ls-files       | 查看文件。                                           | git ls-files                                                 | -                              | git ls-files –d查看已经删除的文件git ls-files –d \|xargs git checkout将已删除的文件还原 |
| git remote         | 操作远程。                                           | git remote                                                   | -                              | git push origin master:newbranch增加远程仓库的分支git remote add newbranch增加远程仓库的分支git remote show列出现在远程有多少版本库git remote rm newbranch删除远程仓库的新分支git remote update更新远程所有版本的分支 |