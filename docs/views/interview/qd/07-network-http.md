---
title: "第 7 章 网络与 HTTP/HTTPS"
---

## 第 7 章 网络与 HTTP/HTTPS

### Q1 在地址栏输入网址回车，到页面显示出来，网络层面发生了什么？

**考察点**：能否把 DNS、TCP、TLS、HTTP、缓存串成一条完整链路，这是网络题的「总纲」，答得顺后面所有细节题都好接。

**参考答案**：

> **一句话结论**：一次页面打开 = 缓存判断 → DNS 解析拿到 IP → TCP 三次握手（HTTPS 再加 TLS 握手）→ 发送 HTTP 请求 → 服务端经网关/后端返回响应 → 浏览器解析 HTML 并继续发起子资源请求 → 最后按需断开连接。

1. 缓存与解析：先查浏览器缓存（强缓存命中就根本不发请求），再查 DNS 缓存，未命中才走 DNS 递归解析拿到 IP。
2. 建立连接：TCP 三次握手；如果是 HTTPS，在 TCP 之上做 TLS 握手，协商出对称密钥并校验服务端证书。
3. 发送请求：浏览器组装请求行、请求头、请求体发出，通常先到 CDN 或 Nginx 反向代理，再到应用服务。
4. 响应与渲染：收到 HTML 后边下载边解析，随后对 CSS、JS、图片等发起大量请求（受同域并发限制约束），解析完再布局绘制。
5. 连接收尾：HTTP/1.1 默认 Keep-Alive 复用连接，不立刻四次挥手；页面关闭或超时才断开。

**追问与易错点**：

- 追问：强缓存命中时链路怎么变？答：请求根本不发出，DevTools 显示 `200 (from disk cache)`；协商缓存则发出请求但只拿回 304。
- 追问：复杂度在哪里？答：DNS、TCP、TLS、请求、响应、渲染六段里任何一段都可能成为瓶颈，排查要看 Timing 各阶段耗时。
- 陷阱：只讲 TCP 不讲 DNS、TLS 和缓存，面试官一追问就断片；把「浏览器渲染」当网络部分大讲特讲。

### Q2 TCP/IP 分层模型分几层？分别是干什么的？

**考察点**：是否掌握网络分层与「封装/解封装」的基本概念，能解释前端遇到的现象落在哪一层。

**参考答案**：

> **一句话结论**：TCP/IP 通常分四层——应用层、传输层、网络层、网络接口层，数据自上而下逐层加头（封装）、自下而上逐层去头（解封装）；跨域和 HTTP 在应用层，端口与可靠传输在传输层，IP 寻址与路由在网络层。

1. 应用层：HTTP/HTTPS、DNS、WebSocket、FTP 等，关注「数据长什么样、代表什么语义」。
2. 传输层：TCP（可靠、有序、面向连接）与 UDP（无连接、不可靠但快），用端口号区分同一台机器上的不同进程。
3. 网络层：IP 负责寻址与路由，ARP 在局域网内把 IP 地址解析成 MAC 地址，ICMP 负责差错与探测（ping）。
4. 网络接口层：网卡驱动、以太网/Wi-Fi 帧，负责相邻节点之间的实际传输。
5. 记忆点：OSI 七层是理论模型，TCP/IP 四层（有的教材拆成五层，把网络接口层再分成数据链路层与物理层）是工程模型，两者对应但不等同。

**追问与易错点**：

- 追问：HTTP 在哪一层？答：应用层；HTTP 本身不关心怎么传输，它把报文交给 TCP，可靠性由传输层保证。
- 陷阱：把同源策略、跨域说成传输层限制，它其实是浏览器在应用层实施的安全策略。
- 陷阱：四层名字说错（把网络层、网络接口层混着说），一层错整段都不可信。

### Q3 TCP 为什么需要三次握手？两次不行吗？

**考察点**：能否说出「三次是确认双方收发能力的最小次数」，而不是背流程。

**参考答案**：

> **一句话结论**：三次握手是让双方都确认「自己的发送能力和对方的接收能力、自己的接收能力和对方的发送能力都正常」的最小次数，两次无法让服务端确认客户端能收到自己的报文。

1. 第一次 SYN：客户端发同步报文并带自己的初始序列号，服务端由此确认客户端发送能力正常、自己接收能力正常。
2. 第二次 SYN + ACK：服务端回自己的序列号并确认客户端，客户端由此确认自己发送正常、服务端收发都正常；但服务端此时还无法确认客户端能否收到自己的包。
3. 第三次 ACK：客户端再回一个确认，服务端才确认自己的发送能力与客户端的接收能力，双方进入 ESTABLISHED。
4. 只有两次的后果：服务端发完 SYN + ACK 就认为连接已建立并分配资源，若客户端没收到或这是一个在网络里滞留的过期 SYN，服务端会长期维持一个无用连接，既浪费资源也容易被 SYN 洪泛攻击打爆半连接队列。

**追问与易错点**：

- 追问：SYN 洪泛怎么利用这一点？答：攻击者大量发 SYN 不回最后一个 ACK，服务端半连接队列被占满，正常用户无法建立连接，防护手段有 syncookies 与首包丢弃。
- 陷阱：只答「三次更可靠」太笼统，必须落到「确认双方收发能力 + 防止历史失效连接」。
- 陷阱：把序列号说成随机数就行（实际是带时间因子推导，且有 SYN 洪泛防护考量）。

### Q4 说说三次握手和四次挥手的完整过程，为什么挥手要四次？

**考察点**：TCP 连接生命周期与状态机，能否解释「全双工」导致的半关闭。

**参考答案**：

> **一句话结论**：建立连接三次（SYN → SYN + ACK → ACK），断开连接四次（FIN → ACK → FIN → ACK），因为 TCP 是全双工，一方关闭发送只表示「我不再发数据了」，另一方可能还有数据要发，所以 FIN 与 ACK 必须分开发。

1. 握手阶段：双方交换初始序列号，确认彼此的收发能力，进入 ESTABLISHED 后开始传数据。
2. 挥手阶段：主动方发 FIN 进入 FIN_WAIT_1；被动方回 ACK 进入 CLOSE_WAIT，此时是半关闭状态，被动方仍可继续发送数据。
3. 收尾：被动方数据发完再发 FIN，主动方回 ACK 并进入 TIME_WAIT，等 2MSL 后进入 CLOSED。
4. 为什么不能合并且三次：ACK 与 FIN 逻辑上属于两次不同的语义（先确认对方关闭，再声明自己关闭），只有当被动方恰好也没有数据要发时，ACK 与 FIN 才可能被合并发出，看起来像三次。
5. 常见状态：FIN_WAIT_1、FIN_WAIT_2、CLOSE_WAIT、LAST_ACK、TIME_WAIT、CLOSED，这些都是 `netstat` 里排障的关键词。

**追问与易错点**：

- 追问：CLOSE_WAIT 大量堆积说明什么？答：应用层收到 FIN 后没有调用 close()，属于连接泄漏，是后端代码问题而不是网络问题。
- 追问：服务端主动断开好不好？答：不好，服务端会积压 TIME_WAIT 并占用端口，一般让客户端主动关闭更合适。
- 陷阱：把第三、四次挥手说反，或者答「四次是为了可靠」，没有点出全双工与半关闭。

### Q5 什么是 TIME_WAIT？为什么必须等 2MSL？

**考察点**：是否理解 TIME_WAIT 的两个作用，以及它在高并发服务端的实际影响。

**参考答案**：

> **一句话结论**：主动关闭方在发出最后一个 ACK 后进入 TIME_WAIT 并等待 2MSL（报文最大生存时间的两倍，Linux 上约 60 秒），一是保证最后一个 ACK 丢失时还能重发，二是让本次连接的残余报文在网络中彻底消散，避免干扰同一四元组的新连接。

1. 为什么是主动关闭方：最后一个 ACK 由它发出，如果 ACK 丢了，对方会重发 FIN，它必须还在 TIME_WAIT 状态才能重新回应。
2. 为什么是 2MSL：一个来回的时间，足以让两个方向上的滞留报文都过期消失。
3. 实际影响：高并发短连接场景下端口与内存被占用，可能出现「Cannot assign requested address」；应对手段有连接池、`SO_REUSEADDR`、让客户端主动关闭、加大可用端口范围。
4. 定位手段：`ss -tan state time-wait | wc -l`、`netstat -nat` 统计状态分布，区分是客户端侧还是服务端侧堆积。

**追问与易错点**：

- 追问：TIME_WAIT 能彻底消除吗？答：不应该消除，它是保护机制，只能减少（复用连接、少用短连接），强行用 `SO_LINGER 0` 发 RST 会引入数据丢失风险。
- 陷阱：把 MSL 说成毫秒，或者把 TIME_WAIT 说成内存泄漏。
- 陷阱：看到 TIME_WAIT 就断言「服务器有 bug」，其实它是正常状态。

### Q6 TCP 和 UDP 有什么区别？各自用在哪？

**考察点**：传输层两大协议的特性对比与选型判断，是网络基础必问。

**参考答案**：

> **一句话结论**：TCP 面向连接、可靠有序、有流量与拥塞控制，代价是延迟与开销；UDP 无连接、不保证可靠与顺序，胜在低延迟、头部小、支持多播，把可靠性交给应用层自己处理。

1. 关键差异对照：

| 维度 | TCP | UDP |
| --- | --- | --- |
| 连接 | 需三次握手 | 无连接，直接发 |
| 可靠性 | 确认应答、超时重传 | 不保证，丢包由应用处理 |
| 有序性 | 序列号重组、去重 | 不保证顺序 |
| 传输形式 | 字节流（无边界） | 数据报（保留边界） |
| 头部开销 | 20 字节起 | 8 字节 |
| 速度与延迟 | 较慢（握手 + 拥塞控制） | 快，适合实时 |
| 典型场景 | HTTP/1.1、HTTP/2、文件传输 | DNS、DHCP、音视频、游戏、QUIC |

2. 选型判断：需要不丢不乱（文件、页面、支付）用 TCP；能容忍丢包但要求低延迟（直播、语音、游戏位置同步）用 UDP。
3. 前沿变化：HTTP/3 跑在基于 UDP 的 QUIC 上，在用户态实现重传与拥塞控制，避免 TCP 层的队头阻塞。

**追问与易错点**：

- 追问：为什么 HTTP/3 换成 UDP 反而更可靠？答：可靠性不是 UDP 给的，而是 QUIC 在应用层实现的，且能按流独立重传，只阻塞丢包的那条流。
- 陷阱：说「UDP 一定快、TCP 一定慢」，实际取决于场景，同机房内 TCP 也可能很快。
- 陷阱：说 UDP 没有拥塞控制就一定好，实际会挤占网络，QUIC 依然实现了拥塞控制。

### Q7 HTTP 报文的结构是怎样的？

**考察点**：是否清楚请求报文/响应报文的组成，以及空行、Content-Length、chunked 这些细节。

**参考答案**：

> **一句话结论**：HTTP 报文由起始行、头部字段、一个空行（CRLF）和消息体四部分组成，空行是头部与消息体的分隔符，绝对不能省。

1. 请求起始行：`方法 + 请求目标 + 版本`，例如 `GET /index.html HTTP/1.1`。
2. 响应起始行：`版本 + 状态码 + 原因短语`，例如 `HTTP/1.1 200 OK`。
3. 头部：`key: value` 形式，字段名大小写不敏感，同名字段可以重复（如 `Set-Cookie`）。
4. 消息体：GET 通常无体，POST/PUT 有体；体的长度由 `Content-Length` 指定，长度未知时用 `Transfer-Encoding: chunked` 分块传输。
5. HTTP/2 之后报文被拆成二进制帧（HEADERS 帧、DATA 帧），逻辑上仍是「头 + 体」，但不再是可读文本。

```http
POST /api/login HTTP/1.1
Host: example.com
Content-Type: application/json; charset=utf-8
Content-Length: 27

{"username":"liuqun"}
```

**追问与易错点**：

- 追问：什么时候用分块传输？答：响应长度事先未知（流式输出、服务端渲染边算边发）时先发头，再分块发体。
- 陷阱：认为 `Content-Length` 和 `Transfer-Encoding: chunked` 可以同时用，规范上以 TE 为准，同时出现还可能被利用做请求走私。
- 陷阱：忘了空行，或者把响应起始行写成 `200 OK HTTP/1.1`。

### Q8 常见请求方法有哪些？哪些是幂等的？

**考察点**：HTTP 方法与幂等性语义，能否给出工程上的使用建议。

**参考答案**：

> **一句话结论**：GET、HEAD、PUT、DELETE、OPTIONS 是幂等的（重复执行副作用一致），POST 与 PATCH 通常不幂等；幂等指的是「副作用可重复」，不是「返回值完全相同」。

1. GET 获取资源，HEAD 与 GET 相同但不返回消息体（常用于探测资源与缓存校验）。
2. PUT 全量替换目标资源，DELETE 删除资源，重复调用最终状态一致，因此幂等。
3. POST 新增/提交，重复提交会产生多份数据，不幂等；PATCH 局部更新，是否幂等取决于实现（如 `age+1` 就不幂等）。
4. OPTIONS 用于探测支持的方法和 CORS 预检；TRACE 因易被用于跨站追踪一般被服务端禁用。
5. 工程含义：幂等方法可以安全重试（弱网自动重试），非幂等请求重试时必须带幂等键（request id）由服务端去重。

**追问与易错点**：

- 追问：为什么 GET 不应该有副作用？答：浏览器预取、爬虫、CDN 回源、刷新重发都可能主动发起 GET，有副作用会造成误操作。
- 陷阱：把幂等理解成「返回结果一样」，或者认为 DELETE 不幂等（删两次结果都是「不存在」，仍是幂等）。
- 陷阱：说「POST 一定不幂等」太绝对，加幂等键后服务端可以把 POST 做成幂等。

### Q9 GET 和 POST 的本质区别是什么？

**考察点**：能否把「语义差异」与「实现/约定差异」分开说，这是最容易答得又长又乱的一题。

**参考答案**：

> **一句话结论**：本质区别是语义——GET 用于获取资源、可缓存可收藏可重复，POST 用于提交数据、可能产生副作用；所谓「长度限制」「参数放哪」都是浏览器与服务器的实现约定，不是 HTTP 规范规定。

1. 语义差异（最该先说）：GET 是安全且幂等的读取操作，POST 是可能改变服务端状态的提交操作。
2. 参数位置：GET 参数在 URL query，POST 参数在消息体；表单默认编码都是 `application/x-www-form-urlencoded`。
3. 缓存差异：GET 可被浏览器与 CDN 缓存、可被收藏与分享；POST 默认不缓存（除非显式声明），刷新时浏览器会提示重新提交。
4. 长度差异的真正来源：URL 长度限制来自浏览器、Nginx（`large_client_header_buffers`）与后端框架，不是 HTTP 规定；POST 体大小受服务端 `client_max_body_size` 一类配置限制。
5. 安全性：两者都是明文传输，POST 只是不把参数暴露在 URL、历史记录与日志里，防窃听防篡改必须靠 HTTPS。

**追问与易错点**：

- 追问：既然 POST 也不安全，为什么登录用 POST？答：避免密码进入 URL 被日志、Referer 与浏览器历史记录留存，同时语义上符合「提交」。
- 陷阱：背「GET 只能 2KB」这类数字，说不出限制的真实来源。
- 陷阱：说「GET 不能带 body」，规范未定义但也不禁止，实际各实现不一致，不要依赖。

### Q10 常见 HTTP 状态码有哪些？分别什么含义？

**考察点**：状态码分类记忆与排障能力，重点看 502/504、401/403 这类易混项。

**参考答案**：

> **一句话结论**：1xx 表示中间状态，2xx 成功，3xx 重定向与缓存，4xx 客户端错误，5xx 服务端错误；前端排查最常见的是 200、204、301、302、304、400、401、403、404、405、429、500、502、504。

1. 1xx：100 Continue（大请求体的预确认）、101 Switching Protocols（WebSocket 升级成功的标志）。
2. 2xx：200 OK、201 Created（创建成功）、204 No Content（成功但无响应体）、206 Partial Content（断点续传、视频分段）。
3. 3xx：301 永久重定向（会被缓存）、302 临时重定向、304 Not Modified（协商缓存命中，无消息体）。
4. 4xx：400 请求格式错误、401 未认证（缺或错凭据）、403 已认证但无权限、404 资源不存在、405 方法不允许、413 请求体过大、429 请求过于频繁。
5. 5xx：500 服务端异常、502 Bad Gateway（网关拿到非法响应）、503 服务不可用（限流/维护）、504 Gateway Timeout（后端超时未响应）。
6. 排查顺序：先看是不是自己的请求错了（4xx），再看是不是后端或网关的问题（5xx），502 与 504 都要结合后端日志，不能只看前端。

**追问与易错点**：

- 追问：502 和 504 怎么区分？答：502 是 Nginx 连上了后端但响应非法或连接被重置（后端进程崩了最常见）；504 是后端在超时时间内没返回（慢查询、死锁、下游拖死）。
- 陷阱：把 401 说成没权限、403 说成没登录；把 304 当成错误码。
- 陷阱：把 500 直接归因于前端，或把 429 当成服务端故障。

### Q11 301、302、303、307、308 有什么区别？

**考察点**：重定向码的语义细节，尤其是「是否允许改变请求方法」。

**参考答案**：

> **一句话结论**：301/308 是永久重定向，302/303/307 是临时重定向；关键差别在方法处理——303 强制把方法改成 GET，307/308 严格要求沿用原方法。

1. 301 Moved Permanently：永久跳转，会被浏览器与搜索引擎缓存，历史实现会把 POST 改成 GET，常用于 HTTP 跳 HTTPS 与域名迁移。
2. 302 Found：临时跳转，最常用也最常被误用；同样存在被实现改成 GET 的行为，HTTP 跳 HTTPS 建议用 301。
3. 303 See Other：明确要求客户端用 GET 访问新地址，适合 POST 提交后跳转到结果页，防止刷新重复提交（PRG 模式）。
4. 307 Temporary Redirect 与 308 Permanent Redirect：语义上不允许改变请求方法，适合需要保持 POST 的重定向场景。
5. 前端影响：`fetch` 默认自动跟随重定向，跨域场景下重定向可能导致 Origin 丢失或直接失败（预检请求被重定向会报错）。

**追问与易错点**：

- 追问：为什么 302 有时会把 POST 变成 GET？答：历史浏览器兼容行为所致，规范后来用 303/307 把语义明确化。
- 陷阱：以为 302 一定保持 POST，或者以为 301 不会进缓存（实际会被长期缓存，改错了很难回收）。
- 陷阱：把 304 也当成重定向，它只是「资源未修改」。

### Q12 常用的请求头字段有哪些？

**考察点**：请求头的用途归类能力，能否讲清 Origin 与 Referer 这类容易混的字段。

**参考答案**：

> **一句话结论**：请求头告诉服务端「我是谁、我要什么、我能接受什么」，前端高频的只有十几个：Host、User-Agent、Accept 系列、Content-Type、Cookie、Origin、Referer、Authorization 与缓存校验头。

1. 内容协商：`Accept`、`Accept-Encoding: gzip, deflate, br`、`Accept-Language`。
2. 主体描述：`Content-Type`（体的类型）、`Content-Length`（体的长度）。
3. 身份与状态：`Cookie`（会话）、`Authorization: Bearer <token>`（令牌）。
4. 来源信息：`Origin`（只有协议+域名+端口，跨域与预检用）、`Referer`（来源页完整地址，受 Referrer-Policy 控制）。
5. 缓存校验：`If-None-Match`（配合 ETag）、`If-Modified-Since`（配合 Last-Modified）。
6. 自定义头：`X-Request-Id`、`X-Token`；跨域时自定义头会触发 OPTIONS 预检，需服务端在 `Access-Control-Allow-Headers` 中放行。

**追问与易错点**：

- 追问：Origin 和 Referer 的区别？答：Origin 只有源、不包含路径，用于 CORS 与安全校验；Referer 包含完整路径，可被策略裁剪。
- 陷阱：把 `Content-Type` 当成响应头（它两边都有，含义方向不同）。
- 陷阱：以为可以在浏览器里随便加 `Referer` 或 `Origin`（这些属于禁止修改的头部，由浏览器控制）。

### Q13 常用的响应头字段有哪些？

**考察点**：响应头是缓存、跨域、安全三大主题的落点，能否按用途归类。

**参考答案**：

> **一句话结论**：响应头负责告诉浏览器「这是什么、能缓存多久、能不能跨域读、有什么安全限制」，最该记住的是 Cache-Control/ETag、Content-Type、Access-Control-*、Set-Cookie 与一组安全头。

1. 内容描述：`Content-Type`、`Content-Length`、`Content-Encoding: br`、`Content-Disposition`（附件下载文件名）。
2. 缓存控制：`Cache-Control`、`Expires`、`ETag`、`Last-Modified`、`Vary`、`Age`（在共享缓存中已存放的秒数）。
3. 跨域授权：`Access-Control-Allow-Origin`、`-Methods`、`-Headers`、`-Credentials`、`-Max-Age`、`-Expose-Headers`。
4. 状态与跳转：`Set-Cookie`、`Location`（配合 3xx）、`Server`、`Date`。
5. 安全加固：`Strict-Transport-Security`、`Content-Security-Policy`、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`。

**追问与易错点**：

- 追问：`Vary` 有什么用？答：告诉浏览器与 CDN 这份响应随哪些请求头变化，例如 `Vary: Accept-Encoding` 防止把 gzip 版本发给只接受 br 的客户端。
- 追问：`Age` 有什么意义？答：表示响应在共享缓存中已存在多久，实际新鲜度 = max-age - Age。
- 陷阱：把 ETag 当成请求头（请求端对应字段是 `If-None-Match`）。

### Q14 Content-Type 常见类型有哪些？用错会怎样？

**考察点**：媒体类型与编码的实际影响，尤其是表单、JSON、文件上传与 CORS 的关联。

**参考答案**：

> **一句话结论**：`Content-Type` 声明消息体的媒体类型与字符集，决定对方怎么解析；前端最常用的是 `application/json`、`application/x-www-form-urlencoded`、`multipart/form-data`，写错会直接导致服务端取不到参数或乱码。

1. 常见类型速查：

| 类型 | 使用场景 | 说明 |
| --- | --- | --- |
| application/json; charset=utf-8 | fetch/axios 发 JSON | 必须显式设置，否则可能被当文本 |
| application/x-www-form-urlencoded | HTML 表单默认、jQuery | 形如 `a=1&b=2`，键值需 URL 编码 |
| multipart/form-data | 文件上传、含文件表单 | 每部分用 boundary 分隔 |
| text/plain | 纯文本 | CORS 简单请求允许的三种之一 |
| text/html | 页面文档 | 浏览器直接渲染 |
| application/octet-stream | 二进制下载 | 通常配合 Content-Disposition 触发下载 |

2. 表单要点：`<form>` 的 enctype 默认是 urlencoded，上传文件必须改成 multipart/form-data。
3. CORS 关联：简单请求只允许 urlencoded、multipart/form-data、text/plain 三种，写 `application/json` 会触发 OPTIONS 预检。
4. 字符集：建议显式带 `charset=utf-8`，避免中文乱码；服务端也要统一按 UTF-8 解码。

**追问与易错点**：

- 追问：服务端说收不到 body 怎么查？答：先看请求头 Content-Type 与实际体的序列化方式是否一致，再看 Content-Length 与后端取参方式（`req.body` 还是 `req.query`）。
- 陷阱：以为改成 `text/plain` 就能既发 JSON 又不触发预检，服务端多半解析失败。
- 陷阱：GET 请求带 body 且设 Content-Type，规范未定义，不要依赖。

### Q15 Host 头有什么用？虚拟主机是怎么回事？

**考察点**：是否理解「一个 IP 承载多个站点」的机制，以及 Host 与 HTTPS/SNI 的配合。

**参考答案**：

> **一句话结论**：`Host` 是 HTTP/1.1 的必需请求头，指明请求目标的主机名与端口，服务端据此在一台机器上区分多个站点（虚拟主机）；HTTPS 场景还要靠 TLS 的 SNI 扩展在握手阶段告诉服务端访问的是哪个域名。

1. HTTP/1.1 起 Host 必填，缺失服务端应返回 400；HTTP/1.0 不带 Host，这也是 1.0 难以做虚拟主机的原因。
2. Nginx 用 `server_name` 匹配 Host 决定进入哪个 server 块、用哪份配置与证书。
3. HTTPS 的时序问题：TLS 握手发生在 HTTP 报文之前，此时还没有 Host 头，只能靠 ClientHello 里的 SNI 扩展传递域名，服务端才能选对证书。
4. 安全风险：Host 可被客户端伪造，若后端用它拼接 URL（如密码重置链接、静态资源地址），会造成 Host 头注入或缓存投毒，必须做白名单校验。
5. 代理链路：反向代理会把原始信息放进 `X-Forwarded-Host`、`X-Forwarded-For`、`X-Forwarded-Proto`，后端应只信任可信代理写入的这些头。

**追问与易错点**：

- 追问：为什么代理后拿到的客户端 IP 不对？答：服务端看到的是代理的 IP，真实 IP 由 `X-Forwarded-For` 携带，且该头可伪造，需要网关覆盖写入。
- 陷阱：以为一个 IP 只能部署一个网站，或认为 HTTPS 下 Host 头还能用于选证书。
- 陷阱：把 SNI 说成浏览器把域名放在 Host 头里提前发送（HTTP/2 的 `:authority` 是另一回事）。

### Q16 HTTP/1.0 和 HTTP/1.1 有哪些区别？

**考察点**：版本演进的关键改进，能否与缓存、连接复用串起来。

**参考答案**：

> **一句话结论**：HTTP/1.1 相比 1.0 的核心改进是默认长连接、Host 头成为必需、引入分块传输与更完整的缓存机制（Cache-Control、ETag、Vary），并支持范围请求。

1. 连接：1.0 默认短连接，需要显式 `Connection: keep-alive` 才能复用；1.1 默认长连接，需要 `Connection: close` 才关闭。
2. Host：1.1 起必填，使同一 IP 上的虚拟主机成为可能；1.0 无此概念。
3. 传输：1.1 支持 `Transfer-Encoding: chunked` 分块传输，响应长度可以事先未知；支持 `Range` 请求与 206 响应实现断点续传。
4. 缓存：1.1 引入 `Cache-Control`（相对时间、更丰富的指令）、`ETag`/`If-None-Match`、`Vary`，能力远强于 1.0 的 Expires + Last-Modified。
5. 其他：1.1 支持管道化（pipelining，实际很少用）、100-continue，并要求对不认识的方法返回 501、对资源不支持但已被识别的方法返回 405。

**追问与易错点**：

- 追问：1.1 遗留了哪些问题？答：应用层队头阻塞、头部冗余重复、同域并发连接数限制，这些由 HTTP/2 改进。
- 陷阱：说 HTTP/1.1 支持多路复用（那是 HTTP/2 的能力，1.1 的管道化不是多路复用）。
- 陷阱：说 1.1 取消了 Keep-Alive（只是从默认关闭变成默认开启）。

### Q17 什么是长连接？Keep-Alive 是怎么工作的？

**考察点**：连接复用机制及其对性能与前端并发策略的影响。

**参考答案**：

> **一句话结论**：长连接指在一个 TCP 连接上连续发送多个 HTTP 请求/响应，省去反复三次握手与 TLS 握手；HTTP/1.1 默认开启，通过 `Connection: keep-alive`（1.0 需显式声明）与 `Keep-Alive: timeout=5, max=100` 控制。

1. 性能收益：省去握手往返与 TCP 慢启动，尤其在 HTTPS 下能复用已协商好的 TLS 会话（会话复用、会话票据），收益明显。
2. 服务端控制：Nginx 用 `keepalive_timeout`（空闲多久关闭）与 `keepalive_requests`（一条连接最多处理多少请求）防止连接被长期占用。
3. 前端相关：浏览器对同一域名有并发连接上限（Chrome 约 6 个），长连接与这个限制配合工作，因此才有雪碧图、域名分片这类「减少请求数」的老优化。
4. 与 HTTP/2 的关系：h2 在一条连接上多路复用所有请求，连接数限制不再是瓶颈，域名分片反而有害。

**追问与易错点**：

- 追问：长连接会一直占着服务端资源吗？答：会，所以有超时与请求数上限；空闲长连接也会占内存与文件描述符，需要合理配置。
- 陷阱：把 WebSocket 当成「长连接 HTTP」，它先用 HTTP 升级（101）然后走独立的帧协议，不再是 HTTP。
- 陷阱：认为 `Connection: keep-alive` 在前端加个请求头就能提升性能（实际由浏览器与服务端协商决定）。

### Q18 什么是 HTTP/1.1 的队头阻塞？

**考察点**：能否分清 HTTP 层与 TCP 层的队头阻塞，这是理解 HTTP/2、HTTP/3 的关键。

**参考答案**：

> **一句话结论**：HTTP/1.1 中同一连接上的响应必须按请求顺序返回，前一个响应没回来，后面的响应就只能等，这就是应用层的队头阻塞（Head-of-Line Blocking）；浏览器靠同域多开几个连接与域名分片缓解，HTTP/2 才用多路复用真正解决。

1. 成因：请求虽然可以管道化发出，但响应无法交错返回，必须按序，于是一个慢响应会阻塞同连接上所有后续响应。
2. 影响：首屏关键资源如果排在慢接口后面，会被无谓拖慢；这也是老项目强调「关键 CSS 内联、脚本放底部、资源合并」的原因。
3. 缓解手段：同域并发 6 个连接、域名分片（把静态资源分散到多个子域）、雪碧图、资源内联与合并。
4. 另一层队头阻塞：TCP 自身丢包重传会阻塞该连接上的所有数据，这是 HTTP/2 也没解决的，HTTP/3 用 QUIC 的按流独立重传解决。

**追问与易错点**：

- 追问：HTTP/2 还有队头阻塞吗？答：HTTP 层没有了（帧可交错），TCP 层仍有，所以基于 TCP 的 h2 在弱网丢包时可能比 h1 更差。
- 陷阱：把两种队头阻塞混为一谈，答不出「HTTP/2 解决了应用层、HTTP/3 才解决传输层」。
- 陷阱：在 HTTP/2 下继续大量域名分片，反而增加连接与 TLS 开销。

### Q19 HTTP/2 的多路复用和二进制分帧是怎么回事？

**考察点**：HTTP/2 的核心机制与代价，能否说清「流、帧、消息」的关系。

**参考答案**：

> **一句话结论**：HTTP/2 把报文拆成带流 ID 的二进制帧，在一条 TCP 连接上并发交错传输多个流（多路复用），从而消除 HTTP 层的队头阻塞并去掉多连接开销。

1. 二进制分帧层：帧（Frame）是最小传输单位，流（Stream）是承载请求-响应的逻辑通道，消息（Message）由多个帧组成；不再有可读的纯文本报文。
2. 多路复用：不同流的帧可以交错发送，接收端按流 ID 重组，响应不再要求与请求同序，因此一个慢接口不会阻塞其他请求。
3. 其他特性：头部压缩（HPACK）、流优先级与依赖、服务端推送（已废弃）、流量控制按流与按连接两级。
4. 代价：一条 TCP 连接丢包会阻塞所有流（传输层队头阻塞）；服务端推送因无法感知浏览器缓存而浪费带宽，Chrome 106 起移除。
5. 前端实践：主流浏览器只支持基于 TLS 的 h2，接入需先上 HTTPS；h2 下域名分片、资源合并的收益下降，缓存粒度与按需加载更重要。

**追问与易错点**：

- 追问：h2 下还要不要合并资源？答：不必强求合并成一个大文件，按缓存与更新频率拆包更划算，HTTP/2 对多请求的开销已很低。
- 陷阱：把 HTTP/2 说成「加密的 HTTP/1.1」，忽略二进制分帧这个本质变化。
- 陷阱：认为 HTTP/2 完全没有队头阻塞。

### Q20 HPACK 头部压缩和服务端推送分别解决什么问题？

**考察点**：HTTP/2 的两个进阶特性，能否说出原理与现状。

**参考答案**：

> **一句话结论**：HPACK 用「静态表 + 动态表 + 哈夫曼编码」把重复的头部字段压缩成索引，解决 h1 头部冗余问题；服务端推送让服务端主动下发资源，但因无法感知客户端缓存已被废弃，取而代之的是 103 Early Hints + preload。

1. 头部冗余问题：HTTP/1.1 每个请求都要重复携带 Cookie、User-Agent 等，头部可能占报文的一半以上。
2. HPACK 原理：静态表收录 61 个常见字段；动态表在连接内共享，首次发送字段名与值，之后只发索引；字符串值用哈夫曼编码压缩。
3. 服务端推送：用 PUSH_PROMISE 帧主动推资源，客户端可拒绝；`Link: </style.css>; rel=preload; as=style` 是它的声明形式。
4. 被废弃原因：服务端不知道浏览器是否已缓存该资源，重复推送反而浪费带宽，效果不如 preload 精确。
5. 现代替代：`103 Early Hints` 让服务端在最终响应前先回一个带 Link 头的中间响应，浏览器据此提前预加载，Chrome 与部分 CDN 已支持。

**追问与易错点**：

- 追问：HPACK 和 gzip 有什么区别？答：HPACK 是专为头部设计的压缩方案，使用索引与哈夫曼编码，避免了 gzip 压缩头导致的 CRIME 类攻击问题。
- 陷阱：把 HPACK 和 HTTP 体的压缩（gzip/br）混为一谈，前者只压头部。
- 陷阱：在项目里还规划服务端推送，面试官会认为知识没更新。

### Q21 HTTP/3 和 QUIC 解决了什么问题？

**考察点**：是否知道 HTTP/3 的动机，以及 QUIC 与 TCP 的本质差别。

**参考答案**：

> **一句话结论**：HTTP/3 把传输层从 TCP 换成基于 UDP 的 QUIC，在用户态实现可靠传输、拥塞控制并集成 TLS 1.3，主要解决三件事——TCP 层队头阻塞、握手延迟高、连接迁移差。

1. 消除传输层队头阻塞：TCP 丢一个包会阻塞整条连接上所有 HTTP/2 流；QUIC 以流为独立重传单位，只阻塞真正丢包的那条流。
2. 握手更快：QUIC 把 TLS 1.3 集成进传输层，首次连接 1-RTT，复用会话可达 0-RTT，比 TCP + TLS 的两轮往返省时间。
3. 连接迁移：用 Connection ID 而不是「源 IP + 源端口 + 目的 IP + 目的端口」四元组标识连接，手机从 Wi-Fi 切到 4G 不会断连。
4. 部署方式：服务端返回 `Alt-Svc: h3=":443"; ma=86400` 告诉浏览器可走 HTTP/3，浏览器下次访问改用 UDP 443。
5. 代价：部分企业网络与中间设备对 UDP 不友好（限速、丢包、直接封禁），所以实践中要同时保留 h2 回退。

**追问与易错点**：

- 追问：QUIC 跑在 UDP 上还可靠吗？答：可靠，确认、重传、流量与拥塞控制都由 QUIC 在用户态实现，UDP 只是承载通道。
- 陷阱：说 HTTP/3 = UDP + HTTP，漏掉中间的 QUIC 层。
- 陷阱：认为 QUIC 因为用户态实现就一定比 TCP 快，内核态 TCP 在某些场景反而更高效。

### Q22 HTTPS 的握手过程是怎样的？

**考察点**：TLS 握手的完整链条，能否说清「验证身份 + 协商对称密钥」这个目标。

**参考答案**：

> **一句话结论**：HTTPS = HTTP + TLS，握手的目标是「验证服务端身份」并「协商出一个双方共享的对称密钥」，之后所有 HTTP 数据都用对称加密传输。

1. 客户端发 ClientHello：支持的 TLS 版本、密码套件列表、客户端随机数、SNI 域名。
2. 服务端回 ServerHello 与证书：选定版本与套件、服务端随机数，并下发证书链（叶证书 + 中间证书）。
3. 客户端校验证书：验证签名链、域名是否匹配、有效期、是否被吊销，同时生成或协商出预主密钥，用服务端公钥加密（RSA 密钥交换）或通过 ECDHE 各自算出共享密钥。
4. 双方用随机数与共享密钥推导出会话密钥，互发 Finished 校验握手报文完整性，之后切换到对称加密传输应用数据。
5. 版本差异：TLS 1.2 完整握手约 2-RTT（会话复用 1-RTT），TLS 1.3 压缩到 1-RTT（复用可 0-RTT）。

**追问与易错点**：

- 追问：为什么握手用非对称、传输用对称？答：非对称慢但能安全交换密钥并证明身份，对称快适合传大量数据，两者分工。
- 追问：CDN 场景证书是谁的？答：CDN 边缘节点持证书或由 CDN 代管（如 ACME 自动签发），客户端到边缘、边缘到源站是两段 TLS。
- 陷阱：说「HTTPS 就是用公钥加密网页内容」，把密钥交换和内容加密搞混。

### Q23 对称加密和非对称加密有什么区别？HTTPS 怎么用？

**考察点**：密码学基础与 TLS 中的实际分工，追问常打到数字签名与前向安全。

**参考答案**：

> **一句话结论**：对称加密用同一把密钥加解密、速度快，但密钥分发困难；非对称加密公私钥成对、速度慢约两个数量级，用来做身份认证与密钥交换；HTTPS 用非对称完成握手、用对称传输数据。

1. 特性对照：

| 维度 | 对称加密 | 非对称加密 |
| --- | --- | --- |
| 密钥 | 双方共享同一把 | 公钥加密、私钥解密（签名时反向） |
| 速度 | 快，适合大数据量 | 慢，只用于密钥交换与签名 |
| 典型算法 | AES-128-GCM、ChaCha20-Poly1305 | RSA、ECDHE、ECDSA |
| 解决的问题 | 机密性 | 身份认证、密钥分发与前向安全 |

2. 数字签名：私钥签名、公钥验签，用来证明消息确实来自证书持有者且未被篡改。
3. ECDHE 的价值：每次会话使用临时密钥对，实现前向安全（Forward Secrecy），服务端长期私钥泄露也无法解密已录制的历史流量。
4. AEAD 模式：现代套件用带关联数据的认证加密（如 AES-GCM），同时保证机密性与完整性，替代了旧的「加密 + MAC」组合。

**追问与易错点**：

- 追问：前向安全具体指什么？答：会话密钥不由长期私钥直接推导，历史会话密钥即使长期私钥泄露也无法还原。
- 陷阱：说「公钥解密、私钥加密」是通用规则，那只在签名场景成立。
- 陷阱：认为 RSA 现在只用来加密数据，实际现代 TLS 里 RSA 更多用于签名，密钥交换已转向 ECDHE。

### Q24 数字证书是什么？浏览器怎么校验证书链？

**考察点**：PKI 信任链的理解，能否解释常见的证书类报错。

**参考答案**：

> **一句话结论**：证书由 CA 用自己的私钥签名，把「域名 + 公钥 + 有效期 + 用途」绑定在一起；浏览器用内置根证书的公钥逐级验签（叶证书 → 中间 CA → 根 CA），同时校验域名、有效期与吊销状态。

1. 证书链结构：服务器下发叶证书与中间证书，根证书内置于浏览器/操作系统信任库，因此通常不需要下发根证书；漏配中间证书是老服务端最常见的 TLS 故障。
2. 校验项：签发者是否在信任库、签名是否正确、域名是否匹配（含通配符规则）、是否在有效期内、用途是否包含服务器认证、是否被吊销（CRL / OCSP / OCSP Stapling）。
3. 证书类型：DV 只验证域名所有权、OV 验证组织身份、EV 扩展验证；自签名证书不被信任，浏览器直接告警。
4. 补强机制：证书透明度（Certificate Transparency）把证书登记到公开日志，便于发现误签发；App 端常用证书固定（Pinning）防中间人。
5. 排障：`openssl s_client -connect host:443 -servername host` 可以打印完整证书链，快速判断是缺中间证书还是域名不匹配。

**追问与易错点**：

- 追问：为什么自签名证书报 `ERR_CERT_AUTHORITY_INVALID`？答：签发者不在信任库里，无法构建到可信根的路径，只能手动信任或把根证书导入系统。
- 陷阱：认为证书的作用是加密数据，它主要解决身份认证与公钥分发。
- 陷阱：在服务端只配了叶证书忘记中间证书，桌面浏览器因缓存侥幸正常，移动端却全部报错。

### Q25 TLS 1.2 和 TLS 1.3 有什么区别？

**考察点**：协议版本差异的准确记忆，属于进阶加分项。

**参考答案**：

> **一句话结论**：TLS 1.3 砍掉不安全算法、把握手从 2-RTT 降到 1-RTT（复用可 0-RTT）、强制前向安全，并加密了更多握手字段。

1. 差异对照：

| 维度 | TLS 1.2 | TLS 1.3 |
| --- | --- | --- |
| 握手延迟 | 完整握手约 2-RTT | 1-RTT，会话复用 0-RTT |
| 密钥交换 | RSA 或 (EC)DHE | 仅 (EC)DHE，强制前向安全 |
| 对称算法 | 允许 CBC、RC4 等 | 仅 AEAD（AES-GCM、ChaCha20-Poly1305） |
| 握手隐私 | ServerHello 之后多为明文 | 证书等字段加密 |
| 会话恢复 | Session ID / Session Ticket | PSK 票据 |

2. 简化套件：TLS 1.3 大幅精简密码套件（只有 5 个左右），减少了降级攻击面与配置出错的可能。
3. 性能：首次连接省一个往返，弱网下体感明显；配合 ECDHE 默认具备前向安全。
4. 现状：主流浏览器与 CDN 均支持，实践做法是同时开启 1.3/1.2，保留老客户端兼容。

**追问与易错点**：

- 追问：0-RTT 有什么风险？答：早期数据可以被重放，因此只应允许幂等的 GET 使用 0-RTT，服务端要做限制。
- 陷阱：认为换到 TLS 1.3 就一定更快，DNS、TCP 建连与后端耗时往往才是大头。
- 陷阱：说 TLS 1.3 不支持会话恢复（实际用 PSK 票据恢复）。

### Q26 HTTPS 就一定安全吗？

**考察点**：安全边界意识，能否说清 HTTPS 保护什么、不保护什么，以及中间人攻击成立的条件。

**参考答案**：

> **一句话结论**：HTTPS 保证传输过程中的机密性、完整性与服务端身份，但不保证客户端环境可信、不保证服务端自身安全，也无法阻止「客户端主动信任了攻击者证书」的中间人攻击。

1. 中间人（MITM）成立的条件：客户端信任了攻击者的根证书——企业上网代理、抓包软件、被装证书的终端都会导致证书校验通过，流量可被解密。
2. 覆盖不到的面：服务端存储与越权、XSS/CSRF 等应用层漏洞、DNS 劫持后指向的钓鱼站点（假证书会告警，但用户可能点继续访问）。
3. 补强手段：HSTS 防协议降级、证书固定防伪造证书、前向安全降低私钥泄露的影响、敏感数据不进 URL。
4. 前端实践：登录态用 HttpOnly + Secure + SameSite Cookie，避免把 token 长期放 localStorage，关键操作要有服务端二次校验。

**追问与易错点**：

- 追问：Charles/Fiddler 为什么能看 HTTPS？答：它在设备上装了根证书并充当服务端，属于用户自己授权的中间人，因此证书链校验通过。
- 追问：HSTS 怎么防止降级？答：首次访问后浏览器记住该域名只能走 HTTPS，后续即使用户输入 http:// 也会在本地改写成 https，不再发出明文请求。
- 陷阱：答「用了 HTTPS 就绝对安全」，忽略客户端信任链与应用层漏洞。

### Q27 DNS 解析的完整过程是怎样的？

**考察点**：递归查询与迭代查询的区别，以及各级缓存在链路中的位置。

**参考答案**：

> **一句话结论**：DNS 把域名解析成 IP，顺序是「浏览器缓存 → 系统缓存/hosts → 本地 DNS 服务器（LocalDNS）→ 根域名服务器 → 顶级域服务器 → 权威域名服务器」，结果按 TTL 逐级缓存。

1. 本地检查：浏览器自身 DNS 缓存、系统 DNS 缓存与 hosts 文件，命中就直接返回。
2. 递归查询：未命中时向操作系统配置的 LocalDNS（运营商或公司内网 DNS）发起请求，由它代为完成后续查询。
3. 迭代查询：LocalDNS 依次询问根服务器（返回 .com 的地址）、顶级域服务器（返回 example.com 的权威服务器地址）、权威服务器（返回最终 A/AAAA 记录）。
4. 记录类型：A（IPv4 地址）、AAAA（IPv6）、CNAME（别名，CDN 接入常用）、MX（邮件）、NS（权威服务器）、TXT（校验与验证）。
5. 缓存与 TTL：每一级都按记录 TTL 缓存，TTL 短便于故障切换但解析压力大，TTL 长则切换慢。

**追问与易错点**：

- 追问：DNS 用 UDP 还是 TCP？答：默认 UDP 53 端口（快），响应超过 512 字节或区域传送时改用 TCP，现在还有 DoH/DoT 走 443/853 加密解析。
- 陷阱：把递归与迭代说混——客户端找 LocalDNS 是递归，LocalDNS 逐级追问是迭代。
- 陷阱：说「DNS 就是查一次数据库」，忽略多级缓存与 TTL 的影响。

### Q28 DNS 有哪些优化手段？LocalDNS 劫持是怎么回事？

**考察点**：前端可操作的 DNS 优化，以及劫持现象与应对。

**参考答案**：

> **一句话结论**：前端最有效的 DNS 优化是用 `dns-prefetch` 提前解析、`preconnect` 进一步完成建连、减少域名数量并合理设置 TTL；LocalDNS 劫持是解析结果被篡改，靠 HTTPS 防内容篡改、靠 DoH/DoT 防解析篡改。

1. 资源提示：`dns-prefetch` 只做 DNS 解析；`preconnect` 完成 DNS + TCP + TLS（跨域要加 `crossorigin`）；`prefetch` 是预取资源，三者成本依次递增。
2. 使用建议：对马上要用的关键第三方域名用 preconnect，对可能用到的域名用 dns-prefetch，数量控制在 4-6 个以内，避免争抢连接与带宽。
3. 减少域名：同域复用能提高连接复用与缓存命中，HTTP/2 下更没必要做域名分片。
4. 劫持现象：域名被解析到广告页或错误 IP、HTTP 页面被插入广告；HTTPS 因证书校验会直接报错，所以更安全。
5. 缓解手段：全站 HTTPS + HSTS、使用可信公共 DNS 或 DoH/DoT、关键域名可配合 CDN 的解析调度与监控告警。

```html
<link rel="dns-prefetch" href="//img.example.com">
<link rel="preconnect" href="https://api.example.com" crossorigin>
```

**追问与易错点**：

- 追问：`dns-prefetch` 会下载资源吗？答：不会，只做域名解析；需要真正提前下载用 `prefetch`，需要提前建连用 `preconnect`。
- 追问：TTL 设多少合适？答：稳定期可设较长（如 600-3600 秒）减少解析压力，迁移或容灾前提前下调以便快速切换。
- 陷阱：对手写 `dns-prefetch` 的域名使用 `//` 相对协议写法时忽略 HTTPS 页面下的实际协议（`//` 会继承当前协议，是正确写法，但写成 `http://` 会触发混合内容告警）。

### Q29 CDN 的原理是什么？回源又是什么？

**考察点**：CDN 的调度、缓存、回源三段机制，以及与前端的协作方式。

**参考答案**：

> **一句话结论**：CDN 通过 DNS 智能解析把用户调度到最近的边缘节点，边缘节点缓存静态资源就近响应，缓存未命中时向源站拉取，这个过程叫回源。

1. 调度：站点把域名 CNAME 到 CDN 厂商域名，CDN 的权威 DNS 根据用户 IP 的运营商与地理位置返回最优边缘节点 IP。
2. 缓存：边缘节点按 `Cache-Control`/`Expires` 与厂商规则缓存，命中时直接返回 200 并常带 `X-Cache: HIT` 之类的标记头，未命中则回源。
3. 回源：节点向源站请求并缓存结果；源站可用 `s-maxage` 单独控制共享缓存时长，用 `Vary` 区分不同请求头对应的副本。
4. 刷新与预热：发布新版本常用「文件名带内容 hash」天然绕过旧缓存，必要时主动刷新（purge）与预热，减少首批用户回源。
5. 附加价值：抗 DDoS、边缘压缩与 TLS 卸载、动静分离、边缘计算（如 CDN 层面的重定向与 A/B 分流）。

**追问与易错点**：

- 追问：为什么发布后要把文件名改成带 hash？答：CDN 与浏览器缓存难以即时失效，内容 hash 让 URL 变化，等价于强制拉新。
- 追问：接口能不能放 CDN？答：可以但要谨慎，需明确缓存键（含 query、Vary、Cookie）与 `s-maxage`，否则会串用户数据。
- 陷阱：把 CDN 说成「加速服务器」，漏掉 DNS 调度与回源这两个关键环节。

### Q30 什么是同源策略？

**考察点**：是否理解同源策略限制的是「读取」而不是「发送」，这是跨域一切问题的根。

**参考答案**：

> **一句话结论**：同源策略（Same-Origin Policy）是浏览器最核心的安全机制，要求协议、域名、端口三者完全相同才算同源，它限制的是脚本读取跨源资源（响应、DOM、存储、Cookie），而不是限制请求发出。

1. 同源判定：`http://a.com` 与 `https://a.com`（协议不同）、`http://a.com:8080`（端口不同）、`http://b.a.com`（域名不同）都属于跨源。
2. 受限行为：XHR/fetch 读取跨源响应、跨源 iframe 的 DOM 访问、跨源页面的 Cookie 与存储访问。
3. 不受限的加载方式：`<script>`、`<img>`、`<link>`、`<video>`、表单提交等可以跨源加载（只写不读），这正是 JSONP 与 CSRF 得以成立的土壤。
4. 目的：防止恶意站点读取其他站点的敏感数据，并与 Cookie 自动携带机制共同构成会话安全边界。
5. 补充：`postMessage`、CORS、WebSocket 都是在这条边界上开出的受控通道。

**追问与易错点**：

- 追问：同源策略和跨域什么关系？答：跨域是「发起跨源请求后读取被拦截」的现象，解决方案本质是让服务端用 CORS 显式授权，或用同源服务端代理。
- 陷阱：说同源策略禁止跨域请求发出——请求通常已经发出去了，只是响应不给 JS 读。
- 陷阱：把同源与「同站」混为一谈，同站按可注册域（eTLD+1）判断，`a.example.com` 与 `b.example.com` 是同站但不同源。

### Q31 跨域有哪些解决方案？各自怎么选？

**考察点**：方案全景与取舍判断，能否按「能不能改服务端」快速给出选择。

**参考答案**：

> **一句话结论**：能改服务端首选 CORS；不能改后端就用 Nginx 或 Node 代理；只读数据的老系统可用 JSONP；窗口间通信用 postMessage；实时双向通信用 WebSocket。

1. 方案对照：

| 方案 | 原理 | 适用场景 | 代价 |
| --- | --- | --- | --- |
| CORS | 服务端返回 Access-Control-Allow-* | 生产首选，支持所有方法 | 需服务端配合，非简单请求多一次预检 |
| Nginx/Node 代理 | 由同源服务端转发请求 | 无法改后端、开发环境 | 多一跳，需维护代理配置 |
| JSONP | script 标签 + 回调函数 | 只读数据的老接口 | 仅 GET、无错误码、有 XSS 风险 |
| postMessage | 窗口间消息传递 | iframe、微前端、多窗口 | 必须校验 origin，不是请求方案 |
| WebSocket | 独立协议，不受同源策略约束 | 实时双向通信 | 鉴权与心跳要自己做 |
| document.domain | 同主域降级为同源 | 老系统 | 已废弃，Chrome 115 起默认移除 |

2. 选择顺序：优先 CORS（标准、可控）→ 无法改后端时用网关代理 → 特殊窗口场景用 postMessage → 实时场景用 WebSocket。
3. 生产注意：跨域放开要白名单化，不要用 `Access-Control-Allow-Origin: *` 配凭据，也不要反射任意 Origin。

**追问与易错点**：

- 追问：开发环境为什么常用 devServer proxy？答：浏览器在本地发起的是同源请求，转发发生在 Node 服务端，浏览器根本不参与跨域判断，生产必须由网关或后端 CORS 支持。
- 陷阱：以为代理是「绕过安全机制」的黑科技，其实只是换了个不受同源策略约束的执行者。
- 陷阱：把 postMessage 当接口调用手段，它没有请求-响应语义，需要自己实现消息协议与超时。

### Q32 CORS 的简单请求和预检请求有什么区别？

**考察点**：CORS 的核心分类规则，能否判断自己的请求会不会触发 OPTIONS。

**参考答案**：

> **一句话结论**：满足「方法属于 GET/HEAD/POST、头部只含安全字段、Content-Type 属于 urlencoded/multipart/form-data/text/plain」的是简单请求，直接发送并靠响应头授权；其余请求浏览器先发 OPTIONS 预检，通过后才发真实请求。

1. 简单请求条件（三者须同时满足）：方法是 GET、HEAD 或 POST；请求头只包含 Accept、Accept-Language、Content-Language、Content-Type 等安全字段；Content-Type 仅限 `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain`。
2. 预检报文：`OPTIONS` 携带 `Access-Control-Request-Method` 与 `Access-Control-Request-Headers`，服务端回 `Access-Control-Allow-Methods`、`-Headers`、`-Max-Age`。
3. 常见触发预检的写法：自定义头（如 `X-Token`）、`Content-Type: application/json`、PUT/DELETE/PATCH 方法。
4. 优化：用 `Access-Control-Max-Age` 缓存预检结果减少 OPTIONS 次数（Chrome 上限约 2 小时，600 秒是常见折中）。
5. 注意：预检失败时真实请求不会发出；`Access-Control-Allow-Headers` 要列全（含大小写不敏感的自定义头）。

**追问与易错点**：

- 追问：预检请求会带 Cookie 吗？答：不会，预检不携带凭据；真实请求在 `credentials: include` 时才会带。
- 追问：为什么 `application/json` 不放进简单请求？答：简单请求的 Content-Type 白名单只收录 HTML 表单能产生的类型（urlencoded、multipart）与 text/plain，JSON 是脚本构造的非表单类型，所以必须预检。
- 陷阱：以为把 Content-Type 改成 text/plain 就能免预检还照常传 JSON，服务端多半解析不出版本。

### Q33 withCredentials 和 Access-Control-Allow-Credentials 是什么关系？

**考察点**：跨域携带凭据的三要素，最常见的跨域登录态问题。

**参考答案**：

> **一句话结论**：跨源请求默认不带 Cookie，前端必须设置 `withCredentials = true` 或 `credentials: 'include'`，服务端必须同时返回 `Access-Control-Allow-Credentials: true`，且此时 `Access-Control-Allow-Origin` 不能是 `*`，必须是具体源。

1. 三个条件缺一不可：前端带凭据、服务端允许凭据、服务端回显具体 Origin；缺任何一项浏览器都会丢弃响应并报 CORS 错。
2. 为什么不能用 `*`：若允许通配来源又携带 Cookie，任意站点都能带着用户身份读取数据，同源策略等于失效。
3. 缓存风险：服务端回显 Origin 时建议同时加 `Vary: Origin`，否则 CDN/代理可能把 A 站的响应缓存后发给 B 站。
4. Cookie 自身还有门槛：要跨站携带，必须设置 `SameSite=None; Secure`，否则现代浏览器不会发送。

```js
fetch('https://api.example.com/user', { credentials: 'include' })
// 服务端需要：
// Access-Control-Allow-Origin: https://app.example.com
// Access-Control-Allow-Credentials: true
// Vary: Origin
```

**追问与易错点**：

- 追问：接口返回 200 但前端拿不到数据，为什么？答：Network 面板能看到响应说明请求成功，是 CORS 校验失败导致 JS 读不到，去 Console 看具体 CORS 提示并检查上面三个条件。
- 追问：`same-origin`、`include`、`omit` 怎么选？答：默认 same-origin（同源带、跨域不带）；需要跨域带 Cookie 用 include；完全不需要凭据用 omit。
- 陷阱：只在服务端加了 Allow-Credentials，忘了前端 withCredentials，或者反过来。

### Q34 JSONP 的原理是什么？现在还用吗？

**考察点**：老方案原理与局限，能否说清它与 CORS 的本质差别。

**参考答案**：

> **一句话结论**：JSONP 利用 `<script>` 标签不受同源策略限制这一点，把请求伪装成脚本加载，服务端返回 `callback({...})` 由浏览器执行回调拿到数据；现在只作为老系统兼容手段。

1. 原理：动态创建 script 标签，src 带上 `?callback=fnName`，服务端返回一段调用该函数的 JS 代码。
2. 局限：只支持 GET、拿不到状态码与错误信息、无法 abort、超时只能靠定时器兜底，服务端必须专门配合。
3. 安全风险：返回内容是可直接执行的脚本，等同把第三方代码注入页面，一旦服务端被污染就是 XSS。
4. 现代替代：优先 CORS；确实无法改后端时用服务端代理转发。

```js
function jsonp(url, cb) {
  const name = 'cb' + Date.now()
  const script = document.createElement('script')
  window[name] = (data) => { cb(data); delete window[name]; script.remove() }
  script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${name}`
  document.body.appendChild(script)
}
```

**追问与易错点**：

- 追问：JSONP 和 CORS 的本质区别？答：JSONP 是「借浏览器允许跨源的标签来读数据」的绕过手段，CORS 是服务端通过响应头显式授权读取的标准机制。
- 陷阱：说 JSONP 可以发 POST（script 只能 GET）。
- 陷阱：认为 JSONP 拿得到 HTTP 状态码与错误原因，实际失败只会触发 script 的 onerror。

### Q35 postMessage 怎么用？有什么坑？

**考察点**：窗口间跨源通信的正确用法与安全校验意识。

**参考答案**：

> **一句话结论**：`window.postMessage` 用于不同窗口/iframe 之间跨源通信，发送方调 `targetWindow.postMessage(data, targetOrigin)`，接收方监听 message 事件并必须校验 `event.origin`。

1. 典型场景：主页面与内嵌 iframe（支付、富文本、地图、微前端）通信，页面与 `window.open` 打开的子窗口通信。
2. 安全要点：接收端必须校验 origin 与消息结构，否则任意站点都能向你的页面注入指令；发送端 targetOrigin 不要写 `*`，否则会把消息泄露给任意来源的窗口。
3. 数据限制：消息体走结构化克隆，可传对象、数组、Map 等，但不能传函数与 DOM 节点；大数据会有拷贝开销，可用 Transferable 转移 ArrayBuffer。
4. 工程实践：定义统一的消息协议（type + payload + 请求 id），配合超时与 Promise 封装，避免散落的字符串魔法值。

```js
// 主页面接收 iframe 消息并校验来源
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://trusted.example.com') return
  if (e.data?.type === 'resize') doResize(e.data.height)
})
```

**追问与易错点**：

- 追问：为什么不校验 `e.source` 就危险？答：`e.source` 只是窗口引用，不能证明来源可信，鉴权必须靠 origin 与业务 token。
- 陷阱：接收端不校验 origin 就直接把消息内容插入 DOM 或执行，等于自造 XSS。
- 陷阱：把 postMessage 当成跨域请求方案，它没有请求-响应语义，也没有状态码。

### Q36 WebSocket 为什么不受同源策略限制？

**考察点**：能否解释「同源策略作用对象」与「WebSocket 的安全责任落在服务端」这一点。

**参考答案**：

> **一句话结论**：同源策略限制的是浏览器脚本读取 HTTP 响应与跨源 DOM/存储，而 WebSocket 是独立协议，握手后双方对等收发帧，不存在「读取他人响应」的模型，因此不受同源策略约束；但服务端必须自己校验 Origin 头做授权。

1. 握手过程：一个带 `Upgrade: websocket`、`Connection: Upgrade`、`Sec-WebSocket-Key`、`Origin` 的 HTTP GET，服务端回 101 与 `Sec-WebSocket-Accept` 完成升级。
2. 没有 CORS 机制：浏览器不会用 `Access-Control-Allow-*` 检查 WebSocket，所以任意站点都能连你的 WS 服务，这是跨站 WebSocket 劫持（CSWSH）的根源。
3. 服务端防护：校验 Origin 白名单、校验握手阶段的 Cookie/token、必要时要求连接后先发认证帧。
4. 前端限制：浏览器 WebSocket API 不能自定义请求头，因此 token 常放在 URL query（注意日志泄露）或连接后的首条消息里。

**追问与易错点**：

- 追问：WebSocket 和 CORS 的关系是什么？答：没关系，CORS 只管 fetch/XHR 一类 HTTP 请求；WS 的安全性完全由服务端自己把关。
- 陷阱：说 WebSocket 走 80/443 端口所以受同源限制，端口与同源策略是两回事。
- 陷阱：在 WS 服务端不做 Origin 校验，只靠「前端不会连错」这种假设。

### Q37 代理跨域是怎么回事？Nginx 反向代理怎么写？

**考察点**：代理方案的原理与常见配置错误，能否说出正反向代理的区别。

**参考答案**：

> **一句话结论**：跨域限制只存在于浏览器，让「同源的服务器」去转发请求就不存在跨域；开发环境用 devServer 代理，生产环境用 Nginx 反向代理或 Node 中间层（BFF）。

1. 正向代理与反向代理：正向代理替客户端出网（抓包、内网穿透），反向代理替服务端接收请求并转发（Nginx、API 网关），跨域方案用的是反向代理。
2. 关键指令：`location` 匹配前缀、`proxy_pass` 指定后端地址，可顺带补 CORS 头、改 Host、设置超时与重试。
3. 常见坑：`proxy_pass` 末尾带斜杠会替换掉 location 匹配的前缀，不带斜杠则拼接完整路径，配错就 404。
4. 生产注意：devServer 的 proxy 只在开发期有效，上线必须由网关代理或后端开启 CORS；代理会丢失客户端真实 IP，需要 `X-Forwarded-For` 传递。

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:8080/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_read_timeout 60s;
}
```

**追问与易错点**：

- 追问：代理方案和 CORS 怎么选？答：能改后端就用 CORS（无额外跳数与运维成本）；不能改后端或需要隐藏真实后端地址就用代理。
- 追问：代理后为什么登录态正常但 IP 拿不到？答：TCP 源 IP 是代理的 IP，需要网关把真实 IP 写入 `X-Forwarded-For` 且后端只信任可信代理。
- 陷阱：以为生产环境也能靠 devServer 代理解决跨域。

### Q38 CORS 报错该怎么排查？

**考察点**：把散落的 CORS 知识点落到排查流程上，是实操能力的直接体现。

**参考答案**：

> **一句话结论**：看到 CORS 报错不要先改前端代码，先看 Network 面板里请求到底发了没有、服务端返回了什么头，绝大多数是响应头缺失、Allow-Origin 与凭据冲突或被预检卡住。

1. 常见报错与原因：

| 报错信息 | 原因 |
| --- | --- |
| No 'Access-Control-Allow-Origin' header | 服务端没加，或被网关/中间件覆盖丢失 |
| header contains multiple values | Nginx 与后端都加了，重复设置 |
| ... cannot be wildcard '*' when credentials flag is true | 带凭据时不可用 `*`，必须回显具体 Origin |
| Request header field x-token is not allowed | 预检 Allow-Headers 未包含该自定义头 |
| Method PUT is not allowed by Access-Control-Allow-Methods | Allow-Methods 缺该方法 |
| Redirect is not allowed for a preflight request | 预检请求被 301/302 重定向（如 http 跳 https） |
| net::ERR_FAILED / blocked by CORS policy | 笼统提示，必须看 Console 详情与 Network 响应头 |

2. 排查步骤：确认请求是否发出 → 看 OPTIONS 预检的响应头 → 看真实请求的响应头 → 检查是否经过重定向、CDN 缓存或网关改写。
3. 快速定位：用 `curl -i -X OPTIONS` 带 Origin 与服务端复现，能通说明是浏览器侧凭据/缓存问题。
4. 修复原则：白名单化 Origin、统一在一处（网关或框架）加 CORS 头避免重复、预检结果用 Max-Age 缓存。

**追问与易错点**：

- 追问：为什么 Postman 能通、浏览器不通？答：Postman 不执行同源策略与 CORS 校验，只有浏览器会校验，所以服务端缺 CORS 头时只有浏览器报错。
- 陷阱：在前端请求头里手动加 `Access-Control-Allow-Origin`——那是响应头，前端加无效还会触发预检。
- 陷阱：Nginx 与后端各加一次头导致重复值，浏览器直接判定失败。

### Q39 Cache-Control 有哪些常用指令？

**考察点**：缓存控制的核心字段，能否区分 no-cache/no-store、max-age/s-maxage。

**参考答案**：

> **一句话结论**：`Cache-Control` 是 HTTP/1.1 的缓存控制核心，用指令组合表达「能否缓存、谁能缓存、缓存多久、使用前要不要回源校验」，优先级高于 `Expires`。

1. 时效指令：`max-age=N` 相对过期秒数（强缓存）；`s-maxage=N` 只对共享缓存（CDN、代理）生效并覆盖 max-age；`immutable` 表示内容不会变，刷新页面也不重新校验。
2. 范围指令：`public` 允许任何缓存存储（含 CDN）；`private` 只允许浏览器缓存（带用户数据的响应应如此）；`no-store` 完全不存储。
3. 校验指令：`no-cache` 可以缓存但每次使用前必须回源校验（走协商缓存）；`must-revalidate` 过期后禁止使用陈旧副本。
4. 容错指令：`stale-while-revalidate=N` 允许先返回过期副本再后台更新；`stale-if-error=N` 在回源出错时使用过期副本。
5. 实践组合：带 hash 的静态资源用 `public, max-age=31536000, immutable`；入口 HTML 用 `no-cache` 保证及时更新；含隐私的接口响应加 `private, no-store`。

```http
Cache-Control: public, max-age=31536000, immutable
Cache-Control: no-cache, private
```

**追问与易错点**：

- 追问：max-age 与 s-maxage 同时写谁生效？答：浏览器用 max-age，CDN 等共享缓存优先用 s-maxage。
- 追问：为什么 HTML 不用强缓存？答：入口更新必须及时，否则用户会长时间加载到旧页面引用旧资源，用 `no-cache` + ETag 最稳。
- 陷阱：把 `no-cache` 说成「不缓存」（那是 `no-store`），这是最高频的答错点。

### Q40 强缓存和协商缓存有什么区别？

**考察点**：两类缓存机制的分工、状态码表现与配置策略。

**参考答案**：

> **一句话结论**：强缓存靠 `Cache-Control`/`Expires` 在有效期内直接用本地副本、不发请求；协商缓存靠 `ETag`/`Last-Modified` 每次发请求带校验头，服务端判定未变时返回 304 让浏览器继续用本地副本。

1. 对照：

| 维度 | 强缓存 | 协商缓存 |
| --- | --- | --- |
| 控制字段 | Cache-Control: max-age、Expires | ETag/If-None-Match、Last-Modified/If-Modified-Since |
| 是否发请求 | 不发 | 发（带校验头） |
| 命中表现 | 200 (from disk/memory cache) | 304 Not Modified |
| 优先级 | Cache-Control 高于 Expires | ETag 高于 Last-Modified |
| 典型用途 | 带 hash 的静态资源 | 入口 HTML、变化不频繁的接口 |

2. 组合策略：静态资源「一年强缓存 + 内容 hash」；入口 HTML 用 `no-cache` + ETag，保证能拿到新版本引用。
3. 成本差异：协商缓存省的是响应体传输，往返时间与请求头开销省不掉，因此越靠前的资源越该用强缓存。
4. 注意：`Expires` 是绝对时间且依赖客户端时钟，`Cache-Control: max-age` 是相对时间，因此后者更可靠。

**追问与易错点**：

- 追问：强缓存过期后会怎样？答：进入协商缓存流程，若服务端返回 304 则刷新副本新鲜度并继续用本地文件。
- 追问：没有 ETag 也没有 Last-Modified 会怎样？答：无法协商，只能重新下载完整响应。
- 陷阱：以为 304 会带响应体（304 明确不带消息体）。

### Q41 ETag 和 Last-Modified 有什么区别？该用哪个？

**考察点**：两种校验器的可靠性与工程坑，能否说清 ETag 优先的原因。

**参考答案**：

> **一句话结论**：`Last-Modified` 用最后修改时间做校验，精度只到秒且容易失真；`ETag` 用内容标识（摘要或版本号）做校验，更精确可靠，两者同时存在时 ETag 优先。

1. 请求与响应配对：客户端把上次的 ETag 放进 `If-None-Match`，把 Last-Modified 放进 `If-Modified-Since`；服务端判定未变返回 304，变化则返回 200 与新值。
2. ETag 更可靠的原因：不受「同一秒内多次修改」影响，也能识别「内容相同但修改时间不同」的情况。
3. 强弱校验：强 ETag 要求逐字节相同；弱 ETag 形如 `W/"xxx"`，语义等价即可，常用于动态生成内容。
4. 集群坑：若 ETag 由 inode + mtime 之类生成，多台机器会得到不同值，导致 304 命中率骤降，应改用内容摘要或版本号。
5. 中间层影响：CDN 与压缩中间件可能改写或去除 ETag，排查时要看最终响应头而不是源站配置。

**追问与易错点**：

- 追问：为什么有时候 Last-Modified 会导致缓存失效？答：时间精度只到秒，一秒内多次改动或时间被回退都会判断错误。
- 陷阱：用 Last-Modified 时把时间设成未来或每次请求都变，导致缓存永远无法命中。
- 陷阱：认为 ETag 一定是内容哈希（可以是版本号、时间戳组合，只要同一资源下唯一且随内容变化即可）。

### Q42 什么情况下会返回 304？

**考察点**：协商缓存的触发条件，能否与强缓存、no-store 区分开。

**参考答案**：

> **一句话结论**：304 只在协商缓存校验通过时产生——请求带了 `If-None-Match` 或 `If-Modified-Since`，且服务端判定资源未发生变化，于是返回 304 且不带消息体。

1. 前置条件：这是对同一资源的再次请求，本地已有缓存副本与校验信息（ETag/Last-Modified）。
2. 服务端逻辑：比较 ETag 是否一致或时间是否更新，未变返回 304（可带新的 Cache-Control/ETag 刷新新鲜度），变了返回 200 与新内容。
3. 不会出现 304 的情况：强缓存直接命中的请求根本没发出；`no-store` 的响应不会被保存所以也没有校验基础；首次请求没有校验头。
4. 相关状态码区分：200 表示完整响应、200 (from cache) 表示强缓存命中、304 表示「用你的本地副本」，三者不要混。
5. 观察方式：DevTools 中 304 的 Size 列常显示极小值或 `304`，响应体为空，服务端日志里通常能查到这次请求。

**追问与易错点**：

- 追问：304 与 200 (from disk cache) 的区别？答：前者有网络往返但无响应体，后者压根没有请求。
- 追问：304 会带哪些头？答：可带 Cache-Control、ETag、Date、Vary 等无关于体的头，不带 Content-Length 对应的实体。
- 陷阱：以为 304 是重定向或错误码，它属于 3xx 但语义是「未修改」。

### Q43 no-cache、no-store、Vary、Pragma 分别怎么用？

**考察点**：最容易混淆的缓存字段，能否精确区分语义。

**参考答案**：

> **一句话结论**：`no-cache` 是「可以缓存但每次使用前必须校验」，`no-store` 是「完全不缓存」；`Vary` 告诉缓存按哪些请求头区分副本；`Pragma: no-cache` 是 HTTP/1.0 时代的兼容写法。

1. 三个近似字段的差别：

| 字段 | 是否写入本地缓存 | 是否发请求 | 典型场景 |
| --- | --- | --- | --- |
| no-cache | 是 | 是（带校验头） | 入口 HTML，兼顾及时与省流量 |
| no-store | 否 | 是（每次完整下载） | 账户、支付等敏感响应 |
| max-age=0 | 是 | 是（立即过期再校验） | 与 no-cache 效果接近 |

2. `Vary` 的作用：`Vary: Accept-Encoding` 防止缓存把 gzip 版本发给只接受 br 的客户端；`Vary: Origin` 防止 CORS 响应串源；`Vary: *` 或滥用多个字段会显著降低缓存命中率。
3. `Pragma: no-cache`：HTTP/1.0 遗留字段，现代浏览器仍识别，但优先级低于 Cache-Control，通常作为兼容兜底成对出现。
4. 决策建议：想「内容可能变但要省流量」用 no-cache；想「绝不能留痕」用 no-store；想让 CDN 区分副本用 Vary。

**追问与易错点**：

- 追问：为什么带用户数据的响应默认不该被 CDN 缓存？答：会串号泄露；应设 `private` 或 `no-store`，必要时通过缓存键与 Vary 区分。
- 陷阱：为「绝对不吃缓存」直接上 no-store，结果接口失去协商缓存与 CDN 加速收益。
- 陷阱：把 no-cache 当成不缓存，这是最常见的错误理解。

### Q44 为什么会出现 200 (from disk cache)？

**考察点**：DevTools 缓存标识的成因，能否解释「改了代码没生效」类问题。

**参考答案**：

> **一句话结论**：`200 (from disk cache)` 不是服务端返回的，而是 DevTools 告诉你这次请求被浏览器强缓存直接满足、没有产生网络往返；同理 `from memory cache` 是会话内的内存命中，`from ServiceWorker` 是 Service Worker 拦截命中。

1. 三种来源对照：

| 标识 | 存储位置 | 特点 |
| --- | --- | --- |
| from memory cache | 内存 | 当前标签页会话内最快，关闭标签页即失效 |
| from disk cache | 磁盘 | 跨会话可用，读取稍慢，受 Cache-Control 控制 |
| from ServiceWorker | Cache Storage | 由前端代码控制，可离线可用 |
| 无 from 标识 | 真实网络 | 未命中任何缓存 |

2. 为什么分内存和磁盘：浏览器按资源大小、使用频率与当前内存压力策略选择，小文件与刚用过的资源偏内存，大文件偏磁盘。
3. 排查「改了代码没生效」：勾选 Network 面板的 `Disable cache` 或强制刷新 Ctrl+Shift+R，确认响应头 Cache-Control 是否过长、静态资源是否忘了改 hash。
4. 重要判断：from disk cache 的请求根本没到服务器，所以服务端日志里查不到，不能用它证明后端行为正常。

**追问与易错点**：

- 追问：怎么确认不是浏览器在骗人？答：看 Size 列的 cache 标识与 Timing 极短，或对比服务端访问日志确实没有该请求。
- 追问：304 和 from cache 谁更快？答：from cache 更快，它没有网络往返；304 仍要走一次 RTT。
- 陷阱：把 disk cache 当成 Service Worker 缓存，或者一口咬定「后端返回错了」。

### Q45 Cookie 和 Set-Cookie 是怎么工作的？有哪些属性？

**考察点**：Cookie 的读写流程与关键属性，尤其 HttpOnly、Secure、SameSite 的配合。

**参考答案**：

> **一句话结论**：`Set-Cookie` 由服务端下发、浏览器保存，之后同源请求会自动通过 `Cookie` 头带回；关键属性有 HttpOnly、Secure、SameSite、Domain、Path 与 Max-Age/Expires。

1. 属性速查：

| 属性 | 作用 |
| --- | --- |
| HttpOnly | 禁止 JS 读取（`document.cookie` 拿不到），防 XSS 窃取 |
| Secure | 只在 HTTPS 下发送 |
| SameSite | 控制跨站是否携带：Strict/Lax/None |
| Domain | 指定生效域名，写顶级域可被所有子域共享 |
| Path | 生效路径，`/` 表示整站 |
| Max-Age / Expires | 过期时间，都不写就是会话 Cookie，关浏览器即失效 |

2. 容量限制：单条约 4KB，单域名约 50 条，且每次同源请求都会自动携带，容易造成请求头膨胀。
3. 前端可读写的只是非 HttpOnly 的 Cookie；跨域请求默认不带 Cookie，需要 `withCredentials`/`credentials: include` 且服务端允许凭据。
4. 安全建议：登录态用 `HttpOnly + Secure + SameSite=Lax/Strict`，敏感信息不要放 Cookie，重要操作加 CSRF token。

**追问与易错点**：

- 追问：为什么 `SameSite=None` 必须搭配 `Secure`？答：规范如此要求，否则浏览器会拒绝该 Cookie，这在本地 http 调试时常被踩到。
- 追问：Cookie 和 localStorage 怎么选？答：登录态优先 HttpOnly Cookie（JS 偷不到），纯前端偏好设置可用 localStorage（无自动携带，但有 XSS 风险）。
- 陷阱：用 JS 把 token 写进 Cookie 还觉得安全，只有服务端设置的 HttpOnly 才防 XSS 读取。

### Q46 SameSite 的三个值分别是什么场景？

**考察点**：跨站携带规则与 CSRF 防护、以及跨域登录态丢失类问题的归因。

**参考答案**：

> **一句话结论**：`Strict` 完全不带（最安全但外链进来是未登录态）、`Lax` 只对跨站顶层 GET 导航携带（现代浏览器默认值）、`None` 一律携带但必须配 `Secure`。

1. 取值对照：

| 值 | 同站请求 | 跨站子资源/表单/iframe | 跨站顶层 GET 跳转 | 典型场景 |
| --- | --- | --- | --- | --- |
| Strict | 带 | 不带 | 不带 | 银行等高安全站点 |
| Lax（默认） | 带 | 不带 | 带 | 大多数站点，兼顾体验与安全 |
| None | 带 | 带 | 带 | 第三方嵌入、跨站 SSO、支付回调（必须 Secure） |

2. CSRF 防护原理：攻击者构造的跨站表单 POST 在 Lax/Strict 下带不上会话 Cookie，请求自然无效。
3. 误伤排查：从外站链接进来显示未登录（Strict 导致）、iframe 嵌入的页面登录态丢失（需要 None + Secure）。
4. 概念区分：「同站」按可注册域（eTLD+1）判断，与「同源」（协议 + 域名 + 端口）不同，`a.example.com` 与 `b.example.com` 是同站但不同源。

**追问与易错点**：

- 追问：跨域接口要带 Cookie 怎么办？答：服务端设 `SameSite=None; Secure`，同时 CORS 要允许凭据并回显具体 Origin，前端加 credentials。
- 陷阱：以为 SameSite 按端口判断同站，或以为 Lax 能防住一切 CSRF（GET 型副作用接口仍有风险）。
- 陷阱：本地 http 环境配 `SameSite=None` 却不加 Secure，Cookie 直接失效。

### Q47 gzip 和 Brotli 怎么选？还有哪些传输优化手段？

**考察点**：压缩协商机制与整体传输优化的清单化表达能力。

**参考答案**：

> **一句话结论**：文本资源通过 `Accept-Encoding` 与 `Content-Encoding` 协商压缩，gzip 兼容性最好、Brotli（br）同级别下压缩率更高，但要配合缓存、CDN 与 HTTP/2 才能整体提速。

1. 协商流程：浏览器请求带 `Accept-Encoding: gzip, deflate, br`，服务端选一种压缩并在响应中带 `Content-Encoding`；未压缩时不要携带该头。
2. 选型判断：Brotli 对 HTML/CSS/JS 通常比 gzip 小 15%-25%，但压缩更耗 CPU，静态资源构建期预压缩最划算；gzip 作为兼容回退保留。
3. 不要重复压缩：图片、视频、woff2、zip 本身已是压缩格式，再压几乎无收益甚至变大。
4. 传输优化清单：启用 HTTP/2 或 HTTP/3、长连接复用、CDN 就近分发、静态资源强缓存 + 内容 hash、路由与组件级按需加载、图片用 WebP/AVIF 与响应式尺寸、开启 TLS 1.3、减少重定向与请求数。
5. 必配项：开启压缩时加 `Vary: Accept-Encoding`，否则缓存或 CDN 可能把 gzip 版本发给只接受 br 的客户端。

**追问与易错点**：

- 追问：为什么本地开发看着很快，线上还是慢？答：本地没有网络 RTT 与带宽限制，要用 DevTools 节流与真实网络指标（LCP、TTFB）判断。
- 陷阱：对已压缩的图片再开 gzip 并宣称做了优化。
- 陷阱：开了 br 就删掉 gzip，导致老客户端拿到未压缩或压缩失败的响应。

### Q48 fetch 和 XMLHttpRequest 有什么区别？

**考察点**：两代请求 API 的能力差异，能否说出各自不可替代之处。

**参考答案**：

> **一句话结论**：`fetch` 基于 Promise、API 现代，但默认不跨域带 Cookie、4xx/5xx 不 reject、无原生超时与上传进度；`XMLHttpRequest` 老但功能完整（上传进度、timeout、abort）。

1. 能力对照：

| 维度 | fetch | XMLHttpRequest |
| --- | --- | --- |
| 语法 | Promise / async-await | 事件回调 onreadystatechange、onload |
| 错误处理 | 仅网络错误 reject，HTTP 错误要自己判断 res.ok | 任意状态码都触发 load，需自判状态 |
| Cookie | 同源默认带，跨域需 `credentials: 'include'` | 跨域需 `withCredentials = true` |
| 超时 | 原生没有，需 AbortController + 定时器 | 原生 `timeout` 属性与 ontimeout |
| 上传进度 | 无稳定支持 | `upload.onprogress` 直接可用 |
| 取消 | AbortController | `xhr.abort()` |
| 流式读取 | 支持 `response.body` 流 | 不支持 |

2. `fetch` 的优势：标准化、与 Streams/Service Worker 配合好、可读流式响应，适合 SSE 之外的分块处理场景。
3. `XMLHttpRequest` 的价值：上传进度、老浏览器兼容、部分拦截器实现（axios 在浏览器端默认用 XHR）依赖它。
4. 选择建议：业务请求挑成熟封装（axios）；需要流式、SW 内部请求用 fetch；需要上传进度用 XHR 或封装库。

**追问与易错点**：

- 追问：为什么 axios 浏览器端还用 XHR？答：为了拿到上传/下载进度与更一致的错误处理，Node 端则使用 http 模块。
- 陷阱：认为 fetch 是 XHR 的完全超集，忽略进度与超时能力的缺口。
- 陷阱：`await fetch()` 后不检查 `res.ok`，把 500 的错误页当成正常数据解析。

### Q49 fetch 有哪些容易踩的坑？

**考察点**：把 fetch 的三个经典陷阱讲清并给出正确写法。

**参考答案**：

> **一句话结论**：`fetch` 默认不带跨域 Cookie（需 `credentials: 'include'`）、HTTP 4xx/5xx 不会 reject（必须自己判断 `res.ok`）、且没有原生超时（需要 AbortController）。

1. Cookie 坑：同源默认带（same-origin），跨域默认不带；服务端还要允许凭据，且 `Access-Control-Allow-Origin` 不能是 `*`。
2. 错误坑：只有网络失败（断网、DNS 失败、CORS 被拦、abort）才 reject，500 也走 resolve，业务错误必须查 `res.ok` 或 `res.status`。
3. 超时与取消：AbortController 配合 setTimeout 实现，取消后抛的是 `AbortError`，要单独识别避免上报成网络异常。
4. 其他细节：`res.json()` 读流只能读一次，读了 body 就不能再读；默认不带 Referrer 策略差异与重定向跟随（`redirect: 'follow'` 默认）也会影响结果。

```js
async function request(url, { timeout = 8000, ...opt } = {}) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeout)
  try {
    const res = await fetch(url, { ...opt, signal: ac.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`) // 4xx/5xx 不会自动抛错
    return await res.json()
  } finally { clearTimeout(timer) }
}
```

**追问与易错点**：

- 追问：`AbortError` 怎么处理？答：`err.name === 'AbortError'` 时静默返回或抛业务取消错误，不要计入错误监控。
- 陷阱：以为 `fetch` 带 Cookie 是默认行为，导致登录态接口 401。
- 陷阱：重复调用 `res.json()` 与 `res.text()`，第二次直接报 body already read。

### Q50 axios 的拦截器、取消请求和超时是怎么实现的？

**考察点**：常用库的核心能力与工程化用法，属于实战必问。

**参考答案**：

> **一句话结论**：axios 是基于 Promise 的请求库（浏览器端默认用 XHR，Node 端用 http），核心能力是请求/响应拦截器、`timeout` 超时、AbortController/CancelToken 取消与自动 JSON 转换。

1. 拦截器：请求拦截器统一加 token、埋点、loading；响应拦截器统一解包 `res.data`、处理 401 跳登录、集中错误提示。
2. 取消：旧 API 是 `CancelToken.source()`，新版本推荐传 `signal: controller.signal`；用 `axios.isCancel(err)` 或 `err.code === 'ERR_CANCELED'` 判断。
3. 超时：`timeout` 单位毫秒，超时抛 `ECONNABORTED`；它只覆盖响应等待，不细分 DNS/连接阶段，需要更细的观测可看浏览器 Timing。
4. 其他常用配置：`baseURL`、`withCredentials`、`validateStatus`、`transformRequest/Response`、`params` 自动序列化 query。
5. 工程化：封装 request 实例 + 业务错误码映射表，把「HTTP 层错误」与「业务层失败」分开处理。

```js
const api = axios.create({ baseURL: '/api', timeout: 10000, withCredentials: true })
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err)
    if (err.response?.status === 401) router.push('/login')
    return Promise.reject(err)
  }
)
```

**追问与易错点**：

- 追问：重复请求怎么取消？答：用一个 Map 按请求 key 存 AbortController，同一请求再次发出前先 abort 上一个（常用于搜索联想与快速切换 tab）。
- 陷阱：拦截器里 catch 掉错误却不 reject，调用方拿到 undefined 后报出莫名其妙的错误。
- 陷阱：认为 `timeout` 能覆盖整个链路（DNS 慢、连接慢时它并不精确）。

### Q51 RESTful 的设计要点是什么？和 GraphQL 怎么选？

**考察点**：接口设计规范与两种风格的取舍判断。

**参考答案**：

> **一句话结论**：RESTful 用「资源 + HTTP 方法 + 状态码」表达操作，简单、可缓存、契合浏览器与 CDN；GraphQL 由客户端声明所需字段，一次请求取全，但有缓存与治理成本。

1. 对照：

| 维度 | RESTful | GraphQL |
| --- | --- | --- |
| 入口 | 多端点，如 `/users/1` | 单端点 `POST /graphql` |
| 数据获取 | 服务端定结构，易 over/under-fetching | 客户端定字段，按需取 |
| 缓存 | 天然支持 HTTP 缓存与 CDN | 多为 POST，HTTP 缓存弱，需客户端缓存 |
| 错误表达 | 状态码语义化 | 200 + errors 数组，需业务解析 |
| 治理成本 | 低 | 高（schema、N+1、深度与复杂度限制） |

2. REST 设计要点：用名词复数表资源（`/articles`）、用方法表动作（GET/POST/PUT/DELETE）、用状态码表达结果、版本放路径或头、分页过滤排序用 query 参数、避免把动词写进 URL。
3. GraphQL 适用：多端字段需求差异大、聚合多个数据源、前端自主取数诉求强；REST 适用：对外公开 API、简单 CRUD、需要 CDN 与 HTTP 缓存的场景。
4. 折中方案：REST + BFF 聚合层，或 GraphQL 只在内网网关使用，对外仍暴露 REST。

**追问与易错点**：

- 追问：PUT 和 PATCH 有什么区别？答：PUT 是全量替换（未提供的字段会被重置），PATCH 是局部更新，后者语义更贴近「只改一部分」。
- 陷阱：把 REST 当成「URL 里不能出现动词」的教条，忽略一致性与可缓存性才是核心。
- 陷阱：认为 GraphQL 能解决所有性能问题，忽视 N+1 查询与限流防护。

### Q52 轮询、长轮询、SSE、WebSocket 该怎么选？

**考察点**：实时通信方案的横向对比，能否按业务特征给出选择。

**参考答案**：

> **一句话结论**：短轮询最省事但浪费请求；长轮询兼容性最好、延迟中等；SSE 适合服务端单向推送且自带重连；WebSocket 适合双向高频通信，但心跳、重连、鉴权都要自己治理。

1. 方案对照：

| 方案 | 方向 | 实时性 | 开销 | 适用场景 |
| --- | --- | --- | --- | --- |
| 短轮询 | 客户端拉 | 差（取决于间隔） | 大量空请求 | 数据变化慢、兼容优先 |
| 长轮询 | 客户端拉 | 中 | 连接挂起占资源 | 无 WS 支持的环境、消息通知 |
| SSE | 服务端单向推 | 好 | 一条 HTTP 长连接 | 行情、日志、进度、AI 流式输出 |
| WebSocket | 双向 | 最好 | 长连接需心跳治理 | 聊天、协同编辑、游戏 |

2. 选择依据：是否需要客户端高频上行（需要就 WebSocket）、是否只需服务端推送（用 SSE 更简单）、代理与网关是否支持长连接。
3. 成本排序：短轮询 < SSE < 长轮询 < WebSocket（重连、心跳、鉴权、广播、水平扩容都要自行设计）。
4. 兼容与降级：SSE 在 HTTP/1.1 下每域占用一个连接（HTTP/2 无此限制），老环境可用长轮询兜底。

**追问与易错点**：

- 追问：SSE 和 WebSocket 怎么快速取舍？答：只需服务端推、内容以文本为主就用 SSE（走标准 HTTP、自动重连、能复用 Cookie 与 CORS）；需要双向或二进制就用 WebSocket。
- 陷阱：在 HTTP/1.1 下开多条 SSE 连接，把同域 6 连接限制占满导致其他请求排队。
- 陷阱：用短轮询做 IM，既浪费请求又达不到体验要求。

### Q53 SSE 的事件格式是什么？断线重连怎么做？

**考察点**：SSE 协议细节与自动重连机制，是 AI 流式输出的高频考点。

**参考答案**：

> **一句话结论**：SSE 用 `text/event-stream` 长连接持续推送文本，报文是若干 `字段: 值` 行、事件之间用空行分隔，浏览器原生 EventSource 会自动重连并支持 `Last-Event-ID` 断点续传。

1. 关键字段：`data`（消息内容，可多行）、`event`（自定义事件名）、`id`（事件 ID，用于续传）、`retry`（重连间隔毫秒）；以 `:` 开头的是注释，常用来做心跳保活。
2. 报文示例（每个事件末尾需要一个空行）：

```text
event: message
id: 1024
retry: 3000
data: {"price": 12.5}

```

3. 客户端接收：`new EventSource(url)`；默认消息监听 `onmessage`，服务端指定了 `event` 字段时要用 `addEventListener('事件名', handler)`。
4. 自动重连：连接断开后浏览器按 retry 指定的间隔（默认约 3 秒）重连，并自动带上 `Last-Event-ID` 请求头，服务端应据此从断点继续推。
5. 限制：只能单向推送、数据按 UTF-8 文本处理、不支持自定义请求头（鉴权靠 Cookie 或 URL 参数）、需要显式 `es.close()` 才会停止重连。

**追问与易错点**：

- 追问：怎么判断 SSE 已经断了？答：监听 `onerror`，但要注意 EventSource 会自己重连，业务侧应结合心跳超时判断，必要时手动 close 后自行重连以获得更细的控制。
- 陷阱：用 POST 创建 EventSource（只支持 GET），或在服务端已停止时忘了 close 导致持续重连。
- 陷阱：把二进制数据塞进 SSE（协议只支持文本，需 base64）。

### Q54 WebSocket 的握手过程是怎样的？为什么要心跳和重连？

**考察点**：协议升级细节与生产可用性设计，能否结合代理超时解释心跳必要性。

**参考答案**：

> **一句话结论**：WebSocket 先用一个 HTTP GET 请求升级（返回 101 Switching Protocols），之后在同一 TCP 连接上收发文本/二进制帧；生产环境必须自己做心跳保活、断线重连与鉴权。

1. 握手细节：请求带 `Upgrade: websocket`、`Connection: Upgrade`、`Sec-WebSocket-Key`（随机 base64）；服务端把 Key 拼接固定 GUID 做 SHA-1 再 base64，放入 `Sec-WebSocket-Accept` 返回 101；校验失败则返回普通 HTTP 响应，握手不成立。
2. 鉴权方式：浏览器 API 不能自定义请求头，通常把 token 放连接 URL 的 query（注意日志与 Referer 泄露）或握手阶段的 Cookie，或者连接后先发一帧认证消息。
3. 心跳保活：定时发 ping（协议层 Ping 帧或应用层 `{"type":"ping"}`），超时未收到 pong 就主动关闭并重连；Nginx 等代理默认空闲 60 秒断连，没有心跳就会出现「看似连着其实已断」。
4. 重连策略：指数退避加随机抖动（1s、2s、4s……上限 30s），避免服务端故障时被重连风暴打死；重连成功后要按序补拉断线期间遗漏的数据。
5. 其他实践：区分「用户主动关闭」与「异常断开」以免误重连；多标签页可共享一个连接（BroadcastChannel/SharedWorker）减少服务端压力。

```js
ws.onclose = () => { retry++; setTimeout(connect, Math.min(1000 * 2 ** retry, 30000)) }
```

**追问与易错点**：

- 追问：为什么必须有心跳？答：代理与负载均衡会清理空闲连接，且网络中断时 TCP 不一定立刻感知，心跳是发现断线最快的手段。
- 追问：断线期间的消息怎么补？答：服务端维护消息序号，客户端重连时上报 lastSeq，服务端回放增量。
- 陷阱：重连不做退避与去抖，服务端一抖动就被重连风暴放大成雪崩。

### Q55 DevTools 的 Network 面板各列分别看什么？

**考察点**：日常排障的基本功，能否把列的语义和 Timing 各阶段讲清楚。

**参考答案**：

> **一句话结论**：Network 面板是前端排查网络问题的第一现场，重点看 Name、Status、Method、Type、Initiator、Size、Time 七列，以及单条请求的 Headers、Payload、Response 与 Timing 面板。

1. 列含义：Name 请求名与是否有重复请求；Status 状态码；Method 请求方法；Type 资源类型（document/script/xhr/fetch）；Initiator 发起者（能看到调用栈，定位是哪行代码或哪个 DOM 触发）；Size 传输大小（含 from cache 标识）；Time 总耗时。
2. 单条请求面板：Headers（General 概览 + 请求头/响应头，CORS 报错的原因也写在这里）、Payload（请求体）、Preview/Response（响应内容）、Timing（各阶段耗时）、Cookies、Initiator。
3. Timing 阶段顺序：Queueing（排队，常因同域并发上限）→ Stalled → DNS Lookup → Initial connection → SSL（TLS 握手）→ Request sent → Waiting for server response（TTFB）→ Content Download；哪一段最长就查哪一段。
4. 实用开关：`Disable cache`、`Preserve log`（跳转不丢记录）、Slow 3G 等节流、筛选栏支持 `status-code:500`、`larger-than:100k`、`domain:` 等条件。
5. 判断口径：TTFB 长多为服务端处理慢；Content Download 长多为响应体大或带宽不足；Queueing 长多为同域并发被占满。

**追问与易错点**：

- 追问：为什么会有 Queueing？答：同域连接数达上限、优先级调度或磁盘缓存读取排队，常见于页面刚加载时并发请求过多。
- 追问：如何确认某个请求是否被缓存命中？答：看 Size 列是否显示 `(disk cache)`/`(memory cache)`，并把鼠标悬停查看完整数值。
- 陷阱：只看总时长就断言「后端慢」，不打开 Timing 分段定位。

### Q56 curl 常用参数有哪些？怎么用它排查线上问题？

**考察点**：命令行排障能力，能否用 curl 区分浏览器侧与服务端侧问题。

**参考答案**：

> **一句话结论**：`curl` 是最可靠的命令行 HTTP 排查工具，不受同源策略与浏览器缓存影响；用 `-i/-v` 看头部与握手、`-X/-H/-d` 构造请求、`-w` 输出耗时指标。

1. 常用参数：`-i` 显示响应头、`-I` 只发 HEAD、`-v` 显示完整请求头与 TLS 握手信息、`-L` 跟随重定向、`-k` 跳过证书校验（仅调试）、`-H` 加请求头、`-d` 发请求体（自动切 POST）、`--data-binary @file` 发原始体、`-x` 走代理、`--resolve` 绕过 DNS 指定 IP 与 SNI。
2. 排查用法：curl 能通而浏览器不通，多半是 CORS、Cookie/SameSite 或缓存问题；curl 也不通，才是服务端、网络或证书问题。
3. 协议验证：`curl --http2 -I https://example.com` 与 `--http3` 可确认服务端实际支持的协议版本。

```bash
# 复现跨域预检请求，并输出各阶段耗时
curl -v -X OPTIONS 'https://api.example.com/user' \
  -H 'Origin: https://app.example.com' \
  -H 'Access-Control-Request-Method: PUT' \
  -w '\ncode=%{http_code} dns=%{time_namelookup} connect=%{time_connect} ttfb=%{time_starttransfer}\n'
```

**追问与易错点**：

- 追问：`-d` 和 `--data-binary` 有什么区别？答：`-d` 会去掉换行并按表单处理，发 JSON 或上传文件要用 `--data-binary` 并显式设 `Content-Type: application/json`。
- 追问：为什么 `--resolve` 有用？答：可以在不改 hosts 与 DNS 的情况下把域名指向指定 IP，用于验证某台机器或 CDN 节点的行为。
- 陷阱：只看 curl 返回 200 就认为服务端没问题，忽略浏览器侧的 CORS 与凭据差异。

### Q57 Wireshark 是干什么的？和 DevTools 怎么分工？

**考察点**：抓包工具的定位与能力边界，属于了解层面的加分题。

**参考答案**：

> **一句话结论**：Wireshark 抓的是网卡上的原始数据包，用来看 TCP 握手挥手、重传、TLS 握手与丢包这类浏览器面板看不到的问题；HTTPS 只能看到握手与包长，看不到明文内容。

1. 能看到：三次握手与四次挥手、RST 异常断开、丢包重传与乱序、DNS 查询与响应、TLS 版本与证书（握手部分多为明文）、HTTP 明文流量与 HTTP/2 帧。
2. 看不到：TLS 加密后的 HTTP 内容，除非配置 `SSLKEYLOGFILE` 导出会话密钥，或使用非前向安全的套件并有服务端私钥。
3. 与 DevTools 的分工：DevTools 回答「应用层发生了什么」（状态码、响应头、耗时分布），Wireshark 回答「链路上发生了什么」（丢包、重传、连接被谁重置）。
4. 抓包场景与限制：抓本机回环需要 Npcap loopback 支持；生产 Linux 服务器常用 `tcpdump` 先抓成 pcap 再拿回本地用 Wireshark 分析。

**追问与易错点**：

- 追问：怎么用 Wireshark 解释「偶发请求很慢」？答：过滤该连接看是否有重传、零窗口或 TLS 握手重试，重传比例高说明链路丢包严重。
- 追问：为什么前端日常排障不必首选 Wireshark？答：学习与使用成本高，先用 DevTools 与 curl 定位到网络层再上抓包工具。
- 陷阱：以为抓包就一定能看到 HTTPS 内容，或把 Wireshark 当成看接口返回的工具。

### Q58 常见的网络错误码都有哪些含义？

**考察点**：错误信息到根因的映射能力，能否给出正确的排查顺序。

**参考答案**：

> **一句话结论**：前端常见网络错误分三类——连接层（超时、被拒、DNS 失败）、安全层（证书错误）、应用与策略层（ERR_ABORTED、CORS 拦截），排查时先确认是主动取消还是被策略拦截，再怀疑网络。

1. 常见错误对照：

| 报错 | 含义 | 常见原因 |
| --- | --- | --- |
| net::ERR_CONNECTION_TIMED_OUT | 连接超时 | 防火墙丢包、服务未监听、代理不可达 |
| net::ERR_CONNECTION_REFUSED | 连接被拒 | 端口无服务、防火墙 REJECT |
| net::ERR_NAME_NOT_RESOLVED | DNS 解析失败 | 域名拼错、DNS 劫持、hosts 未配置 |
| net::ERR_CERT_DATE_INVALID | 证书过期或未生效 | 服务端时间不对、证书未续期 |
| net::ERR_CERT_COMMON_NAME_INVALID | 证书域名不匹配 | 访问域名与证书颁发域名不一致 |
| net::ERR_CERT_AUTHORITY_INVALID | 签发者不受信任 | 自签名证书、未安装根证书 |
| net::ERR_ABORTED | 请求被取消 | 页面跳转、主动 abort、下载被当作导航、拦截器取消 |
| net::ERR_INCOMPLETE_CHUNKED_ENCODING | 响应体被截断 | 服务端或网关提前断开、chunked 配置错误 |
| CORS 相关提示 | 跨域被拦截 | 缺少 Allow-Origin/Credentials 或预检失败 |

2. 判断顺序：先看 Network 里请求是否真的发出、Console 是否有 CORS 提示，再用 curl 验证服务端，最后才怀疑网络链路。
3. 快捷判断：证书类错误一定是 TLS 层问题（查证书链与域名）；ERR_ABORTED 优先怀疑代码或导航行为，不是网络故障。

**追问与易错点**：

- 追问：上传大文件出现 ERR_ABORTED 怎么查？答：多为页面跳转或代码 abort，也可能是服务端 413/超时后断开，结合 Initiator 与后端日志确认。
- 追问：`ERR_CERT_AUTHORITY_INVALID` 在抓包代理场景怎么处理？答：安装并信任代理的根证书，只在自己可控的开发环境这么做。
- 陷阱：把 CORS 报错当网络故障去查链路，浪费大量时间。

### Q59 Referer 是什么？Referrer-Policy 有什么用？

**考察点**：来源头的作用与隐私控制，容易与 Origin 混淆。

**参考答案**：

> **一句话结论**：`Referer`（HTTP 规范里的历史拼写错误）告诉服务端请求从哪个页面发起，常用于防盗链与来源统计；`Referrer-Policy` 决定它的详细程度与是否发送，现代浏览器默认已收紧为 `strict-origin-when-cross-origin`。

1. 常见策略取值：`no-referrer` 完全不发；`origin` 只发源；`same-origin` 仅同源发送完整地址；`strict-origin-when-cross-origin`（默认）同源发完整、跨源只发源、协议降级时不发；`unsafe-url` 一律发完整地址（不推荐）。
2. 设置方式：响应头 `Referrer-Policy: strict-origin-when-cross-origin`，或 `<meta name="referrer" content="...">`，或单个元素上的 `referrerpolicy` 属性。
3. 实际影响：图片防盗链判断、第三方统计的流量来源分析、避免把 URL 中的敏感参数（token、订单号）泄露给第三方站点。
4. 安全注意：跨源请求默认只带源，所以仅凭 Referer 做 CSRF 校验并不可靠，应该用 CSRF token 配合 SameSite Cookie。

**追问与易错点**：

- 追问：为什么 Referer 少了一个 r？答：早期规范拼写错误被保留至今，因此 HTTP 头叫 `Referer`，而 JS 里访问要用 `document.referrer`（正确拼写）。
- 追问：从 https 页面跳到 http 页面 Referer 会怎样？答：默认策略下不发送，避免把 HTTPS 地址泄露给明文站点。
- 陷阱：以为 Referer 一定会带完整路径，实际受策略与目标协议影响。

### Q60 常见的安全响应头有哪些？

**考察点**：安全加固的清单化表达，属于低成本高收益的加分项。

**参考答案**：

> **一句话结论**：安全响应头是「零成本加固」：CSP 防 XSS 与资源注入、HSTS 强制 HTTPS 防降级、X-Frame-Options/frame-ancestors 防点击劫持、X-Content-Type-Options: nosniff 防 MIME 嗅探。

1. 常用头与推荐值：

| 头 | 作用 | 推荐值 |
| --- | --- | --- |
| Content-Security-Policy | 限制脚本/样式/图片来源，防 XSS 与数据外泄 | `default-src 'self'; script-src 'self'; object-src 'none'` |
| Strict-Transport-Security | 强制浏览器后续只走 HTTPS | `max-age=31536000; includeSubDomains` |
| X-Frame-Options | 禁止或限制被 iframe 嵌入，防点击劫持 | `DENY` 或 `SAMEORIGIN` |
| X-Content-Type-Options | 禁止浏览器 MIME 嗅探 | `nosniff` |
| Referrer-Policy | 控制 Referer 泄露程度 | `strict-origin-when-cross-origin` |
| Permissions-Policy | 限制摄像头、定位等能力 | `geolocation=(), camera=()` |

2. 落地注意：HSTS 只在 HTTPS 响应中生效，写上 `includeSubDomains` 与 preload 后很难回退；CSP 会拦截内联脚本与 `eval`，上线前应先用 `Content-Security-Policy-Report-Only` 观察一段时间。
3. 前端配合：避免内联脚本与字符串拼接执行代码、外链资源用 SRI（`integrity` 属性）校验、iframe 加 `sandbox` 与服务端白名单。
4. 优先级建议：HSTS 与 nosniff 成本最低最该先上，CSP 收益最大但需要持续调优。

**追问与易错点**：

- 追问：上线 CSP 后页面白屏怎么办？答：看 Console 中 CSP 拦截日志（会指明被拦的指令与来源），先用 Report-Only 收集违规再逐步收紧。
- 追问：X-Frame-Options 与 CSP frame-ancestors 冲突时谁生效？答：现代浏览器中 `frame-ancestors` 优先，推荐直接用 CSP 表达更细的白名单。
- 陷阱：只加 X-Frame-Options 就认为防住了点击劫持，忽略 iframe 内嵌套与弹窗等其它形式。

## 本章小结

- 一次请求的完整链路是「缓存判断 → DNS → TCP 握手 → TLS 握手 → HTTP 请求响应 → 渲染 → 连接复用」，任何一段都可能成为瓶颈，排查先看 DevTools 的 Timing 分段。
- 三次握手的本质是确认双方收发能力，四次挥手源于全双工与半关闭；TIME_WAIT 是保护机制而非故障，2MSL 保证最后的 ACK 有机会重发。
- HTTP 演进的驱动力是「减少往返与消除队头阻塞」：1.1 靠长连接，2 靠二进制分帧与多路复用（HTTP 层解决、TCP 层仍在），3 用 QUIC 在 UDP 上按流重传彻底解决。
- HTTPS 的关键不是「加密」三个字，而是用非对称完成身份认证与密钥协商、用对称传输数据，证书链校验是不可绕过的一环，客户端被信任的中间人依然能解密。
- 跨域的本质是同源策略限制「读取」，能力范围决定方案：能改后端用 CORS（注意简单请求与预检、凭据三要素），不能改后端用代理，实时通信用 WebSocket 并自行做鉴权与心跳。
- 缓存的判断链条是「Cache-Control 强缓存 → ETag/Last-Modified 协商缓存（304）→ from disk/memory cache」，no-cache 是「必须校验」，no-store 才是「完全不存」。
- Cookie 的安全三件套是 HttpOnly、Secure、SameSite，跨站场景用 `SameSite=None; Secure`，并且必须同时满足 CORS 允许凭据与回显具体 Origin。
- 排障要形成固定顺序：DevTools Network 看现象 → curl 验证服务端 → 必要时才上抓包，Postman/curl 能通而浏览器不通时优先怀疑 CORS、凭据与缓存。

<!-- COUNT: 60 -->


