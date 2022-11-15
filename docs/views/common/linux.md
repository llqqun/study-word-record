# linux 配置

## firewall-cmd(防火墙)

### 安装

```
# 安装firewalld
yum install firewalld firewall-config

systemctl start  firewalld # 启动
systemctl stop firewalld  # 停止
systemctl enable firewalld # 启用自动启动
systemctl disable firewalld # 禁用自动启动
systemctl status firewalld # 或者 firewall-cmd --state 查看状态

# 关闭服务的方法
# 你也可以关闭目前还不熟悉的FirewallD防火墙，而使用iptables，命令如下：

systemctl stop firewalld
systemctl disable firewalld
yum install iptables-services
systemctl start iptables
systemctl enable iptables
```

### 配置

```
firewall-cmd --version  # 查看版本
firewall-cmd --help     # 查看帮助

# 查看设置：
firewall-cmd --state  # 显示状态
firewall-cmd --get-active-zones  # 查看区域信息
firewall-cmd --get-zone-of-interface=eth0  # 查看指定接口所属区域
firewall-cmd --panic-on  # 拒绝所有包
firewall-cmd --panic-off  # 取消拒绝状态
firewall-cmd --query-panic  # 查看是否拒绝

firewall-cmd --reload # 更新防火墙规则
firewall-cmd --complete-reload
# 两者的区别就是第一个无需断开连接，就是firewalld特性之一动态添加规则，第二个需要断开连接，类似重启服务


# 将接口添加到区域，默认接口都在public
firewall-cmd --zone=public --add-interface=eth0
# 永久生效再加上 --permanent 然后reload防火墙

# 设置默认接口区域，立即生效无需重启
firewall-cmd --set-default-zone=public

# 查看所有打开的端口：
firewall-cmd --zone=dmz --list-ports

# 加入一个端口到区域：
firewall-cmd --zone=dmz --add-port=8080/tcp
# 若要永久生效方法同上

# 打开一个服务，类似于将端口可视化，服务需要在配置文件中添加，/etc/firewalld 目录下有services文件夹，这个不详细说了，详情参考文档
firewall-cmd --zone=work --add-service=smtp

# 移除服务
firewall-cmd --zone=work --remove-service=smtp

# 显示支持的区域列表
firewall-cmd --get-zones

# 设置为家庭区域
firewall-cmd --set-default-zone=home

# 查看当前区域
firewall-cmd --get-active-zones

# 设置当前区域的接口
firewall-cmd --get-zone-of-interface=enp03s

# 显示所有公共区域（public）
firewall-cmd --zone=public --list-all

# 临时修改网络接口（enp0s3）为内部区域（internal）
firewall-cmd --zone=internal --change-interface=enp03s

# 永久修改网络接口enp03s为内部区域（internal）
firewall-cmd --permanent --zone=internal --change-interface=enp03s
```

### 使用

```
firewall-cmd [选项 ... ]
```

选项

```
-h, --help    # 显示帮助信息；
-V, --version # 显示版本信息. （这个选项不能与其他选项组合）；
-q, --quiet   # 不打印状态消息；

--state                # 显示firewalld的状态；
--reload               # 不中断服务的重新加载；
--complete-reload      # 中断所有连接的重新加载；
--runtime-to-permanent # 将当前防火墙的规则永久保存；
--check-config         # 检查配置正确性；

--get-log-denied         # 获取记录被拒绝的日志；
--set-log-denied=<value> # 设置记录被拒绝的日志，只能为 'all','unicast','broadcast','multicast','off' 其中的一个；

```

功能

```
firewall-cmd --add-service=mysql        # 开放mysql端口
firewall-cmd --remove-service=http      # 阻止http端口
firewall-cmd --list-services            # 查看开放的服务
firewall-cmd --add-port=3306/tcp        # 开放通过tcp访问3306
firewall-cmd --remove-port=80tcp        # 阻止通过tcp访问3306
firewall-cmd --add-port=233/udp         # 开放通过udp访问233
firewall-cmd --list-ports               # 查看开放的端口

firewall-cmd --add-forward-port=port=80:proto=tcp:toport=8080   # 将80端口的流量转发至8080
firewall-cmd --add-forward-port=port=80:proto=tcp:toaddr=192.168.0.1 # 将80端口的流量转发至192.168.0.1
firewall-cmd --add-forward-port=port=80:proto=tcp:toaddr=192.168.0.1:toport=8080 # 将80端口的流量转发至192.168.0.1的8080端口

firewall-cmd --query-masquerade # 检查是否允许伪装IP
firewall-cmd --add-masquerade   # 允许防火墙伪装IP
firewall-cmd --remove-masquerade# 禁止防火墙伪装IP

（末尾带有 [P only] 的话表示该选项除了与（--permanent）之外，不能与其他选项一同使用！）
--new-service=<服务名> 新建一个自定义服务 [P only]
--new-service-from-file=<文件名> [--name=<服务名>]
                      从文件中读取配置用以新建一个自定义服务 [P only]
--delete-service=<服务名>
                      删除一个已存在的服务 [P only]
--load-service-defaults=<服务名>
                      Load icmptype default settings [P only]
--info-service=<服务名>
                      显示该服务的相关信息
--path-service=<服务名>
                      显示该服务的文件的相关路径 [P only]
--service=<服务名> --set-description=<描述>
                      给该服务设置描述信息 [P only]
--service=<服务名> --get-description
                      显示该服务的描述信息 [P only]
--service=<服务名> --set-short=<描述>
                      给该服务设置一个简短的描述 [P only]
--service=<服务名> --get-short
                      显示该服务的简短描述 [P only]

--service=<服务名> --add-port=<端口号>[-<端口号>]/<protocol>
                      给该服务添加一个新的端口(端口段) [P only]

--service=<服务名> --remove-port=<端口号>[-<端口号>]/<protocol>
                      从该服务上移除一个端口(端口段) [P only]

--service=<服务名> --query-port=<端口号>[-<端口号>]/<protocol>
                      查询该服务是否添加了某个端口(端口段) [P only]

--service=<服务名> --get-ports
                      显示该服务添加的所有端口 [P only]

--service=<服务名> --add-protocol=<protocol>
                      为该服务添加一个协议 [P only]

--service=<服务名> --remove-protocol=<protocol>
                      从该服务上移除一个协议 [P only]

--service=<服务名> --query-protocol=<protocol>
                      查询该服务是否添加了某个协议 [P only]

--service=<服务名> --get-protocols
                      显示该服务添加的所有协议 [P only]

--service=<服务名> --add-source-port=<端口号>[-<端口号>]/<protocol>
                      添加新的源端口(端口段)到该服务 [P only]

--service=<服务名> --remove-source-port=<端口号>[-<端口号>]/<protocol>
                      从该服务中删除源端口(端口段) [P only]

--service=<服务名> --query-source-port=<端口号>[-<端口号>]/<protocol>
                      查询该服务是否添加了某个源端口(端口段) [P only]

--service=<服务名> --get-source-ports
                      显示该服务所有源端口 [P only]

--service=<服务名> --add-module=<module>
                      为该服务添加一个模块 [P only]
--service=<服务名> --remove-module=<module>
                      为该服务移除一个模块 [P only]
--service=<服务名> --query-module=<module>
                      查询该服务是否添加了某个模块 [P only]
--service=<服务名> --get-modules
                      显示该服务添加的所有模块 [P only]
--service=<服务名> --set-destination=<ipv>:<address>[/<mask>]
                      Set destination for ipv to address in service [P only]
--service=<服务名> --remove-destination=<ipv>
                      Disable destination for ipv i service [P only]
--service=<服务名> --query-destination=<ipv>:<address>[/<mask>]
                      Return whether destination ipv is set for service [P only]
--service=<服务名> --get-destinations
                      List destinations in service [P only]

```

### 端口管理

```
# 打开443/TCP端口
firewall-cmd --add-port=443/tcp

# 永久打开3690/TCP端口
firewall-cmd --permanent --add-port=3690/tcp

# 永久打开端口好像需要reload一下，临时打开好像不用，如果用了reload临时打开的端口就失效了
# 其它服务也可能是这样的，这个没有测试
firewall-cmd --reload

# 查看防火墙，添加的端口也可以看到
firewall-cmd --list-all
```

### 服务管理

```
# 显示服务列表
Amanda, FTP, Samba和TFTP等最重要的服务已经被FirewallD提供相应的服务，可以使用如下命令查看：

firewall-cmd --get-services

# 允许SSH服务通过
firewall-cmd --new-service=ssh

# 禁止SSH服务通过
firewall-cmd --delete-service=ssh

# 打开TCP的8080端口
firewall-cmd --enable ports=8080/tcp

# 临时允许Samba服务通过600秒
firewall-cmd --enable service=samba --timeout=600

# 显示当前服务
firewall-cmd --list-services

# 添加HTTP服务到内部区域（internal）
firewall-cmd --permanent --zone=internal --add-service=http
firewall-cmd --reload     # 在不改变状态的条件下重新加载防火墙
```
