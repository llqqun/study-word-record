---
title: "第 6 章 浏览器工作原理与渲染机制"
---

## 第 6 章 浏览器工作原理与渲染机制

### Q1 浏览器为什么要搞多进程架构？主进程、渲染进程、GPU 进程、网络进程各管什么？

**考察点**：是否理解 Chromium 的进程模型与各进程职责，能不能说出「多进程换来了什么、代价是什么」。

**参考答案**：

> **一句话结论**：多进程换来的是稳定、安全和流畅——一个页面崩溃不拖垮整个浏览器，站点之间被隔离，渲染与网络、GPU 各司其职。

1. 主进程（Browser Process）：负责地址栏、书签、前进后退、标签页管理、下载与权限弹窗，并统筹其他进程；它本身不解析页面。
2. 渲染进程（Renderer Process）：负责 HTML/CSS 解析、JS 执行、样式计算、布局、绘制；它是页面性能的主战场。
3. GPU 进程：全局只有一个，负责把合成后的图层绘制到屏幕；多个页面的绘制请求共用它，因为它独占图形硬件。
4. 网络进程（Network Service）：负责 DNS、TCP/TLS、HTTP 请求与缓存，页面通过进程间通信（IPC）向它要资源；Chrome 75 之后它从主进程里独立出来。
5. 代价：每个进程有独立内存与 V8 实例，内存占用高、IPC 有开销，所以浏览器会做进程复用与标签页休眠来省资源。

**追问与易错点**：

- 追问：为什么 GPU 进程只做一个？答：GPU 是独占资源，多进程无法同时持有，只能集中调度，避免图形上下文互相抢占。
- 陷阱：说「每个标签页一个渲染进程」就结束。跨站 iframe 也会被拆到独立进程，准确说法是「按站点实例分配」。

### Q2 渲染进程里有哪些线程？主线程、合成线程、光栅线程分别做什么？

**考察点**：能否分清「主线程忙」和「页面卡」的关系，这是理解后续所有渲染优化的地基。

**参考答案**：

> **一句话结论**：主线程负责一切会阻塞的工作（解析、JS、样式、布局、生成绘制指令），合成线程和光栅线程在后台把绘制结果变成屏幕像素，所以主线程被 JS 占住时，已分层的动画和滚动依然能动。

1. 主线程（Main Thread）：执行 HTML 解析、DOM/CSSOM 构建、JavaScript、样式计算、布局、生成绘制指令（Paint）。
2. 合成线程（Compositor Thread）：拿到绘制记录后做分层（Layerize）与分块（Tile），把每个块派给光栅线程；滚动与 transform/opacity 动画可以由它独立推进。
3. 光栅线程（Raster Threads）：把绘制指令用 Skia 之类的光栅化器转成位图，通常直接写入 GPU 显存中的纹理。
4. 合成与上屏：合成线程把各层纹理组成合成帧（Compositor Frame），通过 IPC 交给 GPU 进程画到屏幕上。
5. 除此之外还有 Web Worker / Service Worker 使用的 worker 线程，以及为 V8 服务的编译、GC 辅助线程。

**追问与易错点**：

- 追问：为什么 transform 动画不容易卡，而改 left 的动画容易卡？答：transform 只需合成线程重新合成，left 需要主线程重新布局并绘制，主线程被占用时就没机会做。
- 陷阱：以为「渲染进程就是一个线程」。它是多线程的，只是 JS 只跑在主线程上，所以 JS 阻塞才会拖住整个页面。

### Q3 为什么说 JavaScript 是单线程的？它和浏览器多线程是什么关系？

**考察点**：基础题，考的是对「单线程」这句话边界的理解，很多人答得含糊。

**参考答案**：

> **一句话结论**：单线程指的是每个渲染进程里只有一个执行 JS 的主线程，因为 JS 要操作 DOM，多线程并发改同一棵 DOM 会产生状态竞争，于是浏览器用事件循环（Event Loop）把任务排队执行。

1. 浏览器整体不是单线程：网络、GPU、光栅、定时器都由其他线程或进程承担，主线程只是下发指令和收结果。
2. JS 引擎（如 V8）内部也有多个线程做编译与垃圾回收，但执行用户代码的只有一个线程。
3. 单线程的代价是长任务（Long Task）会直接表现为掉帧或页面无响应，业内常以 50ms 作为长任务的参考线。
4. 解决办法是把纯计算搬到 Web Worker，主线程只保留 UI 与交互逻辑。

**追问与易错点**：

- 追问：Worker 里能操作 DOM 吗？答：不能，Worker 没有 DOM/BOM，这是保证 DOM 只被单线程访问所付出的代价。
- 陷阱：把「JS 单线程」和「浏览器单线程」混为一谈，进而错误推断 CSS 动画也会被 JS 阻塞——已分层的合成动画不会。

### Q4 一个标签页崩了为什么不影响别的页面？站点隔离（Site Isolation）解决了什么？

**考察点**：进阶到深挖，看是否了解进程隔离的安全动机与现代浏览器的默认行为。

**参考答案**：

> **一句话结论**：站点隔离（Site Isolation）从 Chrome 67 起默认开启，它把不同站点（eTLD+1）的页面放进不同渲染进程，既防住 Spectre 这类侧信道攻击读取跨站内存，也让某个站点的崩溃或漏洞不波及别的站点。

1. 触发条件：顶层页面与跨站 iframe 各自独立进程；同站点的多个页面可能被合并复用进程，跨站则一定不同进程。
2. 安全收益：进程之间不再共享地址空间，恶意页面无法通过推测执行去读取别的站点的数据。
3. 隔离与同源策略形成纵深防御：渲染进程只拿到自己站点相关的数据，即使渲染器被攻破也拿不到别的站点内容。
4. 代价：内存明显增加（每个进程一套渲染引擎与 V8），跨进程 iframe 的输入、滚动、焦点要由主进程协调，可能出现跨进程的渲染不同步。

**追问与易错点**：

- 追问：同源的两个标签页一定在同一进程吗？答：不一定，还要看进程复用策略与内存压力；但跨站一定隔离。
- 陷阱：把「崩溃隔离」当成多进程的唯一理由。安全隔离（防侧信道）才是 Site Isolation 的核心动机。

### Q5 从地址栏输入 URL 到页面展示，中间经历了哪些阶段？

**考察点**：最经典的流程题，考的是能不能分段讲清楚，而不是背名词。

**参考答案**：

> **一句话结论**：整条链路可以拆成「导航 + 渲染」两段：导航是浏览器进程判断输入、查缓存、建连接、发请求并提交文档；渲染是渲染进程解析 HTML/CSS、构建 DOM 与 CSSOM、布局、绘制、合成上屏。

1. 输入处理：地址栏把输入交给默认搜索引擎，或补全成一个合法 URL，并可能触发预连接。
2. 网络阶段：先看强缓存是否命中，再做 DNS 解析、TCP 握手、TLS 握手，然后发送 HTTP 请求；服务端返回响应。
3. 导航提交：浏览器进程检查响应（204、下载、重定向等特殊处理），把 HTML 数据交给渲染进程，旧文档被替换，此时地址栏更新、历史记录写入。
4. 渲染阶段：解析 HTML 建 DOM，解析 CSS 建 CSSOM，合成渲染树，布局算几何，绘制生成指令，分层后合成上屏。
5. 关键节点可用性能指标观察：首字节（TTFB）、首次绘制（FP）、首次内容绘制（FCP）、最大内容绘制（LCP）。

**追问与易错点**：

- 追问：输完 URL 到新页面出来之间的空白期，浏览器在干什么？答：在等服务端第一个字节，这段时间旧页面保持可交互，避免中间白屏。
- 陷阱：只背「DNS→TCP→HTTP→渲染」四步，漏掉缓存判断、导航提交和渲染流水线，深度不够。

### Q6 一次导航会经历哪些页面事件？为什么不能在 beforeunload 里发异步请求？

**考察点**：考对页面生命周期事件的理解，以及现代浏览器为什么劝退 unload。

**参考答案**：

> **一句话结论**：导航会经历 beforeunload、pagehide、unload 等事件，它们的共同点是同步执行、文档随时可能被销毁，异步请求不保证发出；现代做法是监听 pagehide 或 visibilitychange，并用 sendBeacon 上报。

1. beforeunload：可弹确认框，但只有用户与该页面有过交互才允许弹；用于「表单未保存」这类提示。
2. unload：文档即将销毁，在这里发 fetch 基本会被取消，而且注册了 unload 会让页面失去 bfcache（前进后退缓存）资格，所以不要用。
3. pagehide：文档从浏览会话中移除时触发，事件对象的 persisted 为 true 表示页面进入了 bfcache。
4. visibilitychange：切标签、锁屏、切到后台时最可靠的信号，适合暂停动画、暂停轮询、上报停留时长。
5. 上报要用 navigator.sendBeacon，它由浏览器保证尽力发出，不会阻塞卸载。

**追问与易错点**：

- 追问：为什么注册 unload 会拖累性能？答：因为它让页面无法进入 bfcache，用户返回时要整页重新加载和渲染。
- 陷阱：以为 beforeunload 里 promise、setTimeout 里的上报一定会发出。文档一旦销毁，这些任务就没了。

### Q7 HTML 是怎么被解析的？为什么 HTML 可以容错？

**考察点**：考解析器模型与「容错」的真实含义，属于基础但容易答空的一题。

**参考答案**：

> **一句话结论**：HTML 解析是「分词 + 建树」的流式过程：先把字节流切成标签、属性、文本等 token，再按插入模式把它们变成 DOM 节点；解析器内置了一套容错规则，所以残缺的 HTML 也能被猜出一棵树，这是它与 XML 最大的不同。

1. 分词（Tokenization）：按编码把字节解码成字符，再识别开始标签、结束标签、属性、注释、文本等 token。
2. 建树（Tree Construction）：按插入模式（insertion mode）处理 token，隐式补齐 html/head/body，把节点挂到正确的位置。
3. 常见容错：未闭合标签自动闭合、`<p>` 遇到块级元素自动结束、表格外的内容被 foster parenting 挪到表格之前、`<b>` 交叉嵌套按「重开标签」处理。
4. 解析是增量的：网络每来一段就解析一段，所以文档没下载完浏览器就能开始渲染。
5. 解析途中遇到同步 `<script>` 会暂停解析去执行脚本，这就是「解析阻塞」。

**追问与易错点**：

- 追问：把 `<div>` 写成 `<dvi>` 会怎样？答：当作未知元素保留在树里，不报错，默认按 inline 处理，DOM 结构与预期不符。
- 陷阱：把容错理解成「浏览器会帮我修好代码」。它只是按规范猜，兜不住逻辑错误。

### Q8 什么是预加载扫描器（Preload Scanner）？它怎么缓解 script 阻塞？

**考察点**：这是「script 阻塞为什么没把页面拖死」的关键答案，答出来是明显加分项。

**参考答案**：

> **一句话结论**：预加载扫描器（Preload Scanner，也叫预解析器）在主解析器被同步脚本阻塞时，用另一个轻量解析器继续往下扫 HTML，提前发现 img、link、script 等外链并发起请求，把阻塞的时间用来并行下载。

1. 它只找资源、不建 DOM、不执行 JS，所以扫描速度极快。
2. 它的价值主要体现在解析被阻塞期间：主线程执行脚本时，网络线程照常下载后续资源。
3. 它对 document.write 注入的标签不可见，这是 document.write 有害的原因之一。
4. 对 JS 动态插入的标签、CSS 里的 @import 与背景图也无能为力，需要 preload / preconnect 手动提示。
5. 配合 dns-prefetch、preconnect、preload 可以进一步缩短关键资源的往返时间。

**追问与易错点**：

- 追问：CSS 放 head 里反而好吗？答：CSS 是渲染阻塞但不是解析阻塞，提前下载能更早构建 CSSOM，总体上是对的，但要避免超大 CSS 与 @import 串行下载。
- 陷阱：以为预加载扫描器会执行脚本或构建 DOM。它只做资源发现。

### Q9 DOM 树是怎么构建出来的？DOM 和 HTML 源码是什么关系？

**考察点**：基础概念题，考的是「DOM 是接口而不是文件」这层认识。

**参考答案**：

> **一句话结论**：DOM 是 HTML 文档在内存中的对象化树结构，浏览器用分词加建树把它转成节点树；这棵树既是 JS 的操作接口，也是样式、布局、绘制的输入。

1. DOM 是语言无关的规范接口，HTML 解析只是产生它的一种方式，也可以用 createElement 手动构建。
2. 节点类型包括 Element、Text、Comment、Document 等；源码里的空白文本也是真实节点，会影响 inline 布局。
3. DOM 是「活的」：一旦改动，样式、布局、绘制的缓存就失效并需要重算，这就是操作 DOM 昂贵的根源。
4. DOM 对象由浏览器内核（C++）实现并暴露给 JS，跨语言访问有额外成本，所以大批量 DOM 操作比纯 JS 数组操作慢得多。
5. 解析是流式的，DOMContentLoaded 只表示解析完成，不代表所有资源就绪。

**追问与易错点**：

- 陷阱：以为 HTML 和 DOM 是一一对应的。标签会被补齐、表格内容会被搬移、注释与空白也在树里。
- 追问：为什么 `document.body` 在 body 之前的脚本里是 null？答：解析还没走到 body，节点尚未创建。

### Q10 CSSOM 是怎么构建的？为什么 CSS 会阻塞渲染？

**考察点**：CSS 阻塞机制是高频追问点，必须把「阻塞渲染」和「阻塞脚本」两件事都说清。

**参考答案**：

> **一句话结论**：CSSOM 是 CSS 规则在内存中的对象树，来自外部样式表、`<style>` 和行内样式；CSS 阻塞渲染（render blocking），因为渲染树需要完整样式才能算几何与颜色，否则会出现无样式闪烁。

1. 构建来源：`<link>` 引入的外部样式表、`<style>` 内联块、元素上的 style 属性、以及 JS 动态插入的样式，最终汇入同一份 CSSOM。
2. 阻塞渲染：CSSOM 未就绪时浏览器不绘制，避免先画出裸 DOM 再跳变，即 FOUC（无样式内容闪烁）。
3. 阻塞脚本：样式表之后的同步脚本必须等样式表下载解析完成才执行，因为脚本可能调用 getComputedStyle 或读取布局属性。
4. 计算最终值要经过层叠与继承：先比重要性（!important），用户样式的 !important 高于作者样式与浏览器默认样式的 !important；同重要性再比来源（作者 > 用户 > 浏览器默认）、选择器权重（specificity）与出现顺序。
5. 优化方向：首屏关键 CSS 内联进 head，非关键 CSS 异步加载，避免 @import 造成串行下载。

**追问与易错点**：

- 追问：不匹配当前媒体查询的样式表还阻塞渲染吗？答：仍会被下载，但通常不阻塞渲染；匹配的才阻塞。
- 陷阱：说「CSS 阻塞 DOM 构建」。CSS 不阻塞 HTML 解析，它阻塞的是渲染和后续脚本执行。

### Q11 为什么 CSSOM 不能「先来先应用」？为什么 CSS 还会阻塞 JS 执行？

**考察点**：深挖题，考的是对层叠（cascade）全局性的理解，能答出来说明真懂。

**参考答案**：

> **一句话结论**：CSS 的层叠（cascade）是全局的——后面出现的规则可能覆盖前面的，浏览器无法在规则没到齐时就部分应用样式；再加上脚本可能读取计算样式，于是干脆把外部 CSS 当作整体阻塞资源等待。

1. 层叠、继承、!important 与最终值（used value）都要在完整规则集上计算，局部确定不了。
2. 如果先应用一部分样式、之后再改，已经绘制的内容会跳变，用户看到闪烁，规范因此选择「等齐再画」。
3. 脚本依赖样式：同步脚本可能调用 getComputedStyle、读取 offsetWidth，样式未就绪会拿到错误值，所以脚本也要等样式表。
4. 优化手段：关键样式内联；其余改用 preload + onload 注入，或先用 media="print" 再切回 all 的经典异步技巧。

**追问与易错点**：

- 追问：把 CSS 放 body 末尾行不行？答：会造成 FOUC 或白屏时间变长，不推荐，样式表应尽早出现在 head 里。
- 陷阱：以为 CSS 解析可以像 HTML 一样流式增量应用，于是推断「先加载的规则先生效」——层叠顺序不是加载顺序。

### Q12 script 标签为什么会阻塞解析？放 head、body 中间、body 末尾有什么区别？

**考察点**：基础中的高频题，重点在「为什么必须阻塞」这个原因，而不只是现象。

**参考答案**：

> **一句话结论**：不带 defer/async 的 `<script>` 是解析阻塞的：浏览器必须立刻下载并执行它，期间 HTML 解析暂停，因为脚本可能用 document.write 改写文档结构，解析器无法安全地继续。

1. 下载和执行都阻塞解析，所以 head 里的同步脚本会推迟整页 DOM 就绪的时间。
2. 放 body 末尾：前面 DOM 已解析完，脚本能直接查询节点，白屏时间也最短，是最常见的做法。
3. 放 head：适合必须在渲染前改变文档的场景（埋点 SDK、主题初始化），但要严格控制体积，或改用 defer。
4. 阻塞会级联：head 里样式表未就绪 → 后面的同步脚本等待 → 解析继续被拖住。

```html
<!-- 不阻塞解析，按顺序执行，DOM 就绪后运行 -->
<script src="app.js" defer></script>
```

**追问与易错点**：

- 追问：脚本加了 async 还需要放 body 末尾吗？答：不需要，async 不阻塞解析，但执行时机不确定，有依赖顺序的脚本不能用。
- 陷阱：以为 body 末尾的脚本一定在 DOMContentLoaded 之前跑完——通常是，但要小心动态插入与 defer 脚本的相对顺序。

### Q13 defer、async、type="module" 到底有什么区别？

**考察点**：必考的对照题，能用表格把「阻塞、顺序、时机」三维说清即过关。

**参考答案**：

> **一句话结论**：defer 是「并行下载、解析完成后按文档顺序执行」，async 是「并行下载、下载完就执行且顺序不定」，`type="module"` 默认相当于 defer，并自带严格模式与模块作用域。

| 类型 | 阻塞解析 | 执行顺序 | 执行时机 |
| --- | --- | --- | --- |
| 普通 script | 阻塞 | 按文档顺序 | 立即执行 |
| script + defer | 不阻塞 | 按文档顺序 | 解析完成后、DOMContentLoaded 之前 |
| script + async | 不阻塞 | 不保证（谁先下载完谁先跑） | 下载完立即执行 |
| script type="module" | 不阻塞 | 按依赖图顺序 | 相当于 defer |
| module + async | 不阻塞 | 不保证 | 下载完立即执行 |

1. DOMContentLoaded 只等同步脚本和 defer 脚本，不等 async 脚本。
2. 模块脚本按依赖图只执行一次，跨域加载需要 CORS，脚本 MIME 类型必须正确。
3. 选择建议：业务主逻辑用 defer（或打包后的单文件），独立第三方脚本（统计、客服）用 async。

**追问与易错点**：

- 追问：async 脚本一定在 DOMContentLoaded 之前吗？答：不一定，它可能在 DCL 之前也可能之后，取决于下载速度。
- 陷阱：以为 defer 脚本能保证「DOM 一定完整」——它保证解析完成，但如果脚本是被 document.write 或动态插入的，行为会变。

### Q14 动态创建的 script 默认是 async 吗？async=false 有什么用？

**考察点**：深挖题，考的是对「有序执行队列」的了解，答出来很能体现日常踩坑经验。

**参考答案**：

> **一句话结论**：用 createElement 创建的脚本默认带 async 行为（async 属性为 true），执行时机不确定；把它显式设为 async = false，它会进入「顺序执行队列」，按插入顺序依次执行。

1. 默认 async 的原因：动态脚本多用于统计、懒加载，浏览器不假设它们之间有顺序依赖。
2. async = false 的脚本仍然不阻塞解析，但会在当前解析到达可执行点时按插入顺序执行。
3. 动态脚本执行时机取决于文档状态：解析中则插在解析点执行，文档已加载完则立即执行。
4. 需要严格控制顺序时，更推荐用 import() 动态导入，它返回 Promise，顺序由代码显式控制。

```js
const s = document.createElement('script');
s.src = '/a.js';
s.async = false; // 保持插入顺序，避免依赖错乱
document.head.appendChild(s);
```

**追问与易错点**：

- 追问：为什么按需加载的多个脚本会偶发报错？答：默认 async 导致执行顺序与插入顺序不一致，前一个脚本的全局变量还没定义。
- 陷阱：以为动态插入的脚本一定在 DOMContentLoaded 之后执行，它可能在解析过程中就跑了。

### Q15 渲染树（Render Tree）是怎么生成的？display:none 和 visibility:hidden 有什么区别？

**考察点**：基础对照题，考的是「谁进入渲染树」这个判断标准。

**参考答案**：

> **一句话结论**：渲染树是 DOM 与 CSSOM 结合的产物，只包含需要显示并参与布局的节点，布局阶段就在这棵树上计算几何；display:none 的元素不进渲染树，visibility:hidden 的元素进渲染树但不绘制。

1. 生成过程：从根开始遍历 DOM，对每个「需要显示」的元素结合其计算样式生成渲染对象（LayoutObject）。
2. display:none：不生成渲染对象，不占位、不参与布局，后代也一并消失；visibility:hidden：生成渲染对象、占位、参与布局，只是不画。
3. 伪元素 ::before/::after 会生成渲染对象；`<head>`、`<meta>`、`<script>` 等不生成。
4. 渲染树里还有 DOM 树中不存在的节点，例如匿名块盒（anonymous block box）与行盒（line box），它们由布局规则产生。
5. absolute/fixed、float 元素脱离普通流，但仍在渲染树内参与布局。

**追问与易错点**：

- 追问：opacity:0 的元素在渲染树里吗？答：在，它参与布局与合成，只是不可见，默认仍能响应点击。
- 陷阱：以为渲染树就是「DOM 去掉 display:none」。它还要合并样式、生成匿名盒，并且受伪元素影响。

### Q16 布局（Layout/Reflow）阶段做了什么？代价在哪？

**考察点**：基础题，重点是把「几何计算」讲清楚，并引出重排代价的判断。

**参考答案**：

> **一句话结论**：布局（Layout，也叫回流 Reflow）是根据渲染树计算每个盒子精确几何信息的阶段，代价与需要重算的节点数量成正比，所以改动越靠上层、波及的节点越多，代价越大。

1. 输入：渲染树、视口大小、盒子模型与定位规则（普通流、浮动、绝对定位、flex/grid）。
2. 输出：每个渲染对象的坐标与尺寸，以及溢出区域和滚动范围信息。
3. 坐标是相对的：布局输出相对包含块（containing block）的坐标，绘制阶段才转成绝对坐标。
4. 典型触发：增删可见节点、改尺寸或位置、字体变化、窗口 resize、读取某些布局属性（强制同步布局）。
5. 优化方向：缩小布局范围（contain、独立合成层）、复用节点、避免读写交替。

**追问与易错点**：

- 追问：为什么改容器宽度会让整页重排？答：子元素宽度可能依赖父级，重排会向下级联，这就是「范围」影响代价的例子。
- 陷阱：把布局和绘制混着答。布局只算几何，颜色类变化只重绘不重排。

### Q17 绘制（Paint）是怎么工作的？绘制指令和光栅化（Rasterization）什么关系？

**考察点**：进阶题，考的是「绘制产出指令而不是像素」这个关键区分。

**参考答案**：

> **一句话结论**：绘制是遍历渲染树、把元素按堆叠顺序翻译成绘制指令列表（display list）的阶段；光栅化由光栅线程把指令转成屏幕位图，两者是不同阶段。

1. 绘制顺序：背景色、背景图、边框、内容与文本、轮廓，遵循 CSS 绘制规则与 z-index 堆叠上下文。
2. 绘制产物是矢量指令，不是像素；同一份指令可以在不同分辨率或缩放下重新光栅化，这也是缩放时文字需要重新光栅的原因。
3. 分块（Tiling）：合成层会被切成约 256×256 的块，只光栅可视区域与预测会滚动到的区域，以节省显存。
4. 光栅线程把结果写入 GPU 纹理；浏览器常先以低分辨率光栅保证首屏速度，再补高分细节。
5. 只触发重绘的典型属性：color、background-color、visibility、outline、text-decoration。

**追问与易错点**：

- 追问：为什么改 background-color 只重绘不重排？答：元素尺寸与位置没变，无需重新布局，只要重新生成指令并光栅。
- 陷阱：以为绘制就是往屏幕上画像素。真正的上屏发生在合成之后，由 GPU 进程完成。

### Q18 分层与合成（Composite）是怎么回事？为什么合成比重排便宜？

**考察点**：进阶必考，考「分层是为了隔离变化范围」这个本质。

**参考答案**：

> **一句话结论**：合成是把页面按规则分成多个合成层（Compositing Layer），各层独立光栅化后由 GPU 拼成最终画面；层内变化只需重绘该层并重新合成，成本远低于整页重排，于是有了「合成优于重绘、重绘优于重排」。

1. 分层的动机：把可能独立变化的内容（动画、滚动、fixed 元素）隔离出来，减少每次变化要重做的像素面积。
2. 常见提升触发条件：3D 变换（translate3d、translateZ(0)）、will-change: transform/opacity、video/canvas、position: fixed、opacity 动画、filter 等（普通 2D transform 不会自动提升为合成层）。
3. 合成线程可以在主线程被 JS 占住时，靠已有纹理改变层的变换矩阵并合成新帧，动画因此不卡。
4. 代价：层越多，显存与合成开销越大，过度分层会让内存暴涨、滚动反而更慢。
5. 定位关系：重排 → 重绘 → 合成，越往后代价越小，能用 transform/opacity 表达的动画就别动几何属性。

**追问与易错点**：

- 追问：合成层的内容改了，为什么整层都要重绘？答：光栅化以块为单位，层内没分块隔离的部分会一起重做，所以动画不要同时改层内其他内容。
- 陷阱：以为「元素有 transform 就一定是合成层」。浏览器按需提升且可能复用已有层，不能据此判断性能。

### Q19 一帧的渲染流水线是怎么走的？浏览器怎么保证 60fps？

**考察点**：深挖题，把前面几题串成一条时间线，考查整体框架感。

**参考答案**：

> **一句话结论**：浏览器把一帧要做的事排成固定管线：输入事件 → requestAnimationFrame 回调 → 样式计算 → 布局 → 绘制 → 合成，理想情况下必须在一帧预算内完成，60Hz 屏约 16.6ms，120Hz 屏约 8.3ms。

1. 预算很紧：任何一环超时都会掉帧，JS 长任务是头号杀手。
2. rAF 回调在样式与布局之前执行，是这一帧里改样式最合适的时机，改完的样式仍会在本帧完成布局与绘制。
3. 不是每帧都走完所有阶段：只改 transform/opacity 且元素已分层时，可以跳过布局与绘制，只做合成。
4. 主线程被占满时，已分层动画与滚动仍由合成线程推进，用户感知是「页面还能滚，但点击没反应」。
5. 排查工具：Performance 面板看帧条与长任务，Layers 面板看分层，Rendering 面板开 Paint flashing 与 Layer borders。

**追问与易错点**：

- 追问：requestIdleCallback 在帧管线里的位置？答：本帧所有工作完成之后、下一帧开始之前的空闲时段执行，可被更紧急的工作打断，需要 timeout 兜底。
- 陷阱：以为「一帧 16.6ms」对所有屏幕成立。高刷屏是 8.3ms 甚至更短，预算更紧张。

### Q20 重排和重绘有什么区别？哪些操作会触发它们？

**考察点**：必考对照题，要能把「几何变化 vs 外观变化」讲清，并能给出典型属性清单。

**参考答案**：

> **一句话结论**：重排是几何信息变化导致的重新布局，重绘是外观变化导致的重新生成绘制指令；重排必然伴随重绘，重绘不一定有重排，代价上重排 > 重绘 > 合成。

| 变化类型 | 典型操作 |
| --- | --- |
| 触发重排 | width/height/padding/margin/border、font-size/font-family、display、position/top/left、float/clear、文本内容变化、增删可见节点、窗口 resize、读取 offsetTop 等布局属性 |
| 只触发重绘 | color、background-color/image、visibility、outline、border-color、box-shadow、text-decoration |
| 只触发合成 | transform（不改变布局的位移缩放旋转）、已分层元素的 opacity、部分 filter 场景 |

1. 几何属性一旦变化，浏览器要重新计算相关盒子的位置尺寸，影响范围可能向下级联。
2. 外观属性变化只影响该区域的像素，但仍需重新光栅化并合成。
3. 判断口诀：会改变「占多大地方、在哪里」的就是重排，只改变「长什么样」的是重绘。
4. 动画优先用 transform/opacity，就是为了把变化压到最便宜的合成层。

**追问与易错点**：

- 追问：为什么改 top 比改 transform 慢？答：top 参与布局，会影响自身与后续元素的位置计算；transform 是绘制后的合成变换，不影响布局。
- 陷阱：把 visibility:hidden 说成重排。它占位、几何不变，属于重绘；display:none 才是重排。

### Q21 日常开发中怎么避免重排？

**考察点**：进阶实践题，面试官想看的是可落地的清单，而不是「少操作 DOM」这种空话。

**参考答案**：

> **一句话结论**：核心思路四句话——少改、批量改、改在脱离文档流的副本上、读写分离。

1. 批量操作：用 DocumentFragment 在内存里组装后一次插入，或用 innerHTML 一次性替换。
2. 离线修改：先把元素 display:none 或脱离文档流，改完再显示，用两次重排换掉中间的多次重排。
3. 用 class 切换代替逐条改 style，或用一次 cssText / 一次 classList 操作合并多次样式写入。
4. 动画用 transform/opacity，位移动画不要用 top/left；频繁重排的区域考虑 contain: layout/paint 或独立合成层。
5. 读写分离：先集中读（offsetWidth、getBoundingClientRect），再集中写，避免写-读-写造成强制同步布局。
6. 精简结构：表格布局、超深嵌套、超大 DOM 本身的布局成本就高，能拆就拆、能虚拟列表就虚拟列表。

**追问与易错点**：

- 追问：contain: layout 做了什么？答：告诉浏览器该子树的布局不影响外部，可以把重排范围限制在子树内，是 CSS 层的隔离。
- 陷阱：把「避免重排」理解为「绝对不要重排」。重排不可避免，目标是减少次数与缩小范围。

### Q22 transform 和 opacity 为什么不触发重排？

**考察点**：进阶原理题，答案要能解释「布局阶段用的是变换前的盒子」。

**参考答案**：

> **一句话结论**：transform 和 opacity 只影响元素自身的绘制结果，不改变它在布局中的位置与尺寸，因此不触发重排；元素被提升为合成层后，它们的变化还能交给合成线程处理，不占用主线程。

1. transform 是绘制完成后的几何变换，布局用的是变换前的盒子，所以其他元素的位置不受影响。
2. opacity 是图层合成时的混合系数，不改变几何，通常只触发重绘或纯合成。
3. 动画期间浏览器一般会临时提升该元素为合成层，于是逐帧只改变层矩阵。
4. 副作用要注意：transform 会创建新的包含块，使后代 fixed/absolute 的定位基准改变，也会创建堆叠上下文。
5. 文字在大幅 transform 缩放下可能变糊，因为光栅分辨率与最终显示尺寸不匹配。

**追问与易错点**：

- 追问：transform 会影响 getBoundingClientRect 吗？答：会，它返回变换后的视口矩形；但 offsetTop/offsetWidth 仍是布局值。
- 陷阱：以为「用 transform 就一定 60fps」。同一帧里若还改了触发布局的属性，或者元素每帧被反复提升/降级，照样掉帧。

### Q23 合成层（Compositing Layer）是什么？will-change 和 translateZ(0) 有什么副作用？

**考察点**：深挖题，考的是「性能优化手段本身也有成本」这个判断力。

**参考答案**：

> **一句话结论**：合成层能让 transform/opacity 动画绕开主线程，但 will-change 与 translateZ(0) 强制提升会带来显存占用、层爆炸、文字变糊等问题；正确用法是动画前加、动画后删，只加在真正会动的元素上。

1. 提升代价：每个合成层都要独立的光栅纹理（显存），层数过多导致内存上涨、合成变慢，移动端尤其明显。
2. 层爆炸：will-change 元素的后代在特定条件下会被一起提升，可能出现成百上千个层。
3. translateZ(0) 的原理是强制 3D 变换触发提升，会让该层按独立分辨率光栅，文字可能模糊，低端机上反而更慢。
4. 正确用法：动画开始前设 will-change: transform，动画结束后在 transitionend/animationend 里移除；不要写 will-change: all，也不要长期挂在大量元素上。
5. 更省心的替代：直接用 CSS 的 transform/opacity 动画，让浏览器自行决定是否提升。

```css
.card { transition: transform .3s; }
.card:hover { transform: translateY(-4px); } /* 通常无需手动 will-change */
```

**追问与易错点**：

- 追问：动画结束后不移除 will-change 会怎样？答：浏览器会长期为该元素保留层与纹理，内存不释放，滚动合成成本上升。
- 陷阱：把 will-change 当成性能开关全局加上去。它更像「提前预告」，滥用直接伤内存。

### Q24 requestAnimationFrame 在什么时机执行？和 setTimeout 有什么差别？

**考察点**：进阶高频题，考的是 rAF 与刷新率同步这一本质。

**参考答案**：

> **一句话结论**：requestAnimationFrame 的回调在浏览器准备绘制下一帧之前执行（同一帧内、样式计算之前），天然与屏幕刷新率对齐；setTimeout 只保证「不早于」某个时间，落到哪一帧不确定，容易丢帧或一帧跑多次。

1. 时机：在帧管线开头批量执行本帧收集到的所有 rAF 回调，回调参数是当前帧的时间戳。
2. 对齐刷新率：60Hz 屏约 16.6ms 一次，120Hz 屏约 8.3ms 一次，高刷屏动画更顺滑。
3. 后台标签页里 rAF 会被暂停省电；setTimeout 在现代浏览器里也会被节流到最低约 1s。
4. 典型用法是递归调用自身形成动画循环，一次回调里集中读布局再集中写样式。
5. 需要停止时保存返回值并调用 cancelAnimationFrame。

```js
function loop(ts) {
  el.style.transform = `translateX(${ts % 500}px)`;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

**追问与易错点**：

- 追问：动画用 setInterval 有什么问题？答：间隔与刷新率不同步，可能一帧跑多次或多帧才跑一次，产生抖动与耗电，后台仍会执行。
- 陷阱：以为 rAF 回调执行时样式已经算完。它执行在样式计算之前，这正是「在这一帧改样式最划算」的原因。

### Q25 DOMContentLoaded、load、readystatechange 有什么区别？顺序如何？

**考察点**：基础必考，关键在于说清各自的等待条件。

**参考答案**：

> **一句话结论**：readystatechange 反映文档加载状态的变化（loading → interactive → complete），DOMContentLoaded 在 DOM 解析完成且 defer 脚本执行后触发，load 要等所有资源（图片、样式、iframe）加载完才触发，顺序是 DCL 先于 load。

1. readystatechange：document.readyState 每次变化都触发，interactive 时 DCL 即将触发，complete 时 load 即将触发。
2. DOMContentLoaded：DOM 就绪，不等图片、iframe 与 async 脚本，此时可以安全查询与操作 DOM。
3. load：页面及其所有依赖资源加载完毕，包括图片、iframe、字体、样式表。
4. DCL 会等在它之前的同步脚本与 defer 脚本；async 脚本不保证被等待；样式表会阻塞其后的脚本，从而间接推迟 DCL。
5. 实践：要给元素绑事件、初始化组件，用 defer 脚本或监听 DOMContentLoaded，不要等 load。

**追问与易错点**：

- 追问：脚本怎么保证一定拿得到 DOM？答：用 defer、放在 body 末尾，或监听 DOMContentLoaded；等 load 太晚，会拖慢首屏交互。
- 陷阱：以为 load 一定比 DCL 晚很多。页面资源都很小的时候，两者可能只差几毫秒。

### Q26 首屏白屏和 FOUC 是怎么产生的？怎么解决？

**考察点**：进阶实践题，考的是把渲染阻塞知识用回真实问题的能力。

**参考答案**：

> **一句话结论**：白屏是浏览器在拿到可用于首屏渲染的内容之前什么都画不出来，FOUC（无样式内容闪烁）是先画了无样式内容、样式随后才到导致跳变；前者多是阻塞与首屏资源慢，后者是 CSS 加载时机不当。

1. 白屏常见原因：HTML 首字节慢（服务端慢）、head 里有大体积同步脚本、CSS 巨大或串行 @import、SPA 的 JS bundle 太大导致空容器、路由懒加载没配骨架屏。
2. FOUC 常见原因：CSS 通过 JS 异步注入、样式表在 body 之后加载、使用 @import、媒体查询切换技巧、SSR 输出了 HTML 但样式未内联。
3. 解决白屏：SSR/SSG 输出首屏 HTML、关键 CSS 内联、脚本用 defer、骨架屏、服务端压缩与缓存、CDN 与 HTTP/2。
4. 解决 FOUC：样式表放 head、首屏关键样式内联、避免 @import、动态注入样式时先隐藏内容。
5. 通用手段：减少渲染阻塞资源数量与体积，字体用 font-display: swap 或 preload，避免字体长时间不显示。

**追问与易错点**：

- 追问：font-display: swap 解决什么？答：字体未就绪时先用后备字体显示（把 FOIT 变成 FOUT），避免文字长时间空白。
- 陷阱：把白屏一律归因于「网络慢」。很多白屏是主线程被大 JS 占住或首屏依赖链太长导致的。

### Q27 事件流的三个阶段是什么？捕获、目标、冒泡怎么走？

**考察点**：基础必考，要能画出传播方向并说清 target 与 currentTarget 的区别。

**参考答案**：

> **一句话结论**：DOM 事件流分三个阶段——捕获阶段（从 window 向下到目标的父节点）、目标阶段（到达事件目标）、冒泡阶段（从目标向上回到 window）；addEventListener 默认在冒泡阶段监听，传 capture: true 则在捕获阶段监听。

1. 传播路径由 DOM 树决定，事件对象上 target 是实际触发者（全程不变），currentTarget 是当前正在处理该事件的元素（随阶段变化）。
2. 捕获可用于提前拦截或统一记录，业务代码绝大多数用冒泡。
3. 不冒泡的事件：focus/blur、mouseenter/mouseleave、load、DOMContentLoaded 等；对应的可冒泡版本是 focusin/focusout、mouseover/mouseout。
4. 事件委托依赖冒泡，中途 stopPropagation 会让委托失效。

**追问与易错点**：

- 追问：同一元素上捕获监听与冒泡监听谁先执行？答：捕获阶段先执行捕获监听，冒泡阶段再执行冒泡监听（目标阶段按注册顺序，现代规范把目标阶段监听归入相应阶段）。
- 陷阱：以为「事件从目标开始传播」。捕获阶段在目标之前就已经经过所有祖先。

### Q28 addEventListener 的第三个参数只能传布尔值吗？capture、once、passive、signal 各是什么？

**考察点**：进阶题，考 API 细节，是「基础扎实」的直观体现。

**参考答案**：

> **一句话结论**：第三个参数可以是布尔值（表示是否捕获），也可以是选项对象 `{ capture, once, passive, signal }`；once 执行一次后自动移除，passive 承诺不调用 preventDefault 以换取滚动顺畅，signal 用 AbortSignal 批量移除监听。

1. capture：true 表示在捕获阶段触发，与冒泡监听互不影响，同一元素两个阶段会各触发一次。
2. once：自动移除，适合「只关心第一次」的场景，比如首个交互上报。
3. passive：true 时调用 preventDefault 无效并打印警告；Chrome 56 起根目标（window/document/body）上的 touchstart/touchmove 默认 passive，Chrome 73 起 wheel/mousewheel 也默认 passive。
4. signal：传入 AbortController 的 signal，abort() 时一次性移除所有相关监听，组件卸载时最省心。

```js
const ac = new AbortController();
el.addEventListener('click', onClick, { signal: ac.signal });
ac.abort(); // 卸载时统一清理，避免内存泄漏
```

**追问与易错点**：

- 追问：同一个函数用不同 capture 注册两次会怎样？答：视为两个监听器，各触发一次；移除时必须与注册时的 capture 值一致。
- 陷阱：以为 removeEventListener 只要函数引用相同就能移除，忽略了 capture 不匹配导致移除失败。

### Q29 stopPropagation、stopImmediatePropagation、preventDefault 有什么区别？

**考察点**：基础易错题，三者常被混用，答清边界就是过关。

**参考答案**：

> **一句话结论**：stopPropagation 阻止事件继续传播到其他节点（但不影响同一节点上的其他监听器），stopImmediatePropagation 连同一节点的后续监听器也一起阻止，preventDefault 与传播无关，只阻止浏览器默认行为。

1. stopPropagation：常用于阻止冒泡到父级，但会破坏事件委托，要谨慎。
2. stopImmediatePropagation：立刻停止，同一元素上排在后面的监听器也不会执行。
3. preventDefault：阻止默认行为，例如链接跳转、表单提交、右键菜单；对 passive 监听器无效。
4. 两者可以组合使用，但 preventDefault 本身不会阻止事件冒泡。

| 方法 | 阻止向上传播 | 阻止同节点后续监听 | 阻止默认行为 |
| --- | --- | --- | --- |
| stopPropagation | 是 | 否 | 否 |
| stopImmediatePropagation | 是 | 是 | 否 |
| preventDefault | 否 | 否 | 是 |

**追问与易错点**：

- 追问：为什么调了 preventDefault 父级的监听还在跑？答：默认行为与事件传播是两回事，父级仍会收到冒泡事件。
- 陷阱：在 `<a>` 上用 stopPropagation 想阻止跳转。它只会挡住父级监听，链接照旧跳走，必须用 preventDefault。

### Q30 passive: true 有什么用？为什么滚动监听里推荐加它？

**考察点**：进阶性能题，考的是「滚动为什么会被 JS 拖慢」这条因果链。

**参考答案**：

> **一句话结论**：passive: true 表示监听器承诺不会调用 preventDefault，浏览器因此可以立即开始滚动而不用等 JS 执行完，避免滚动卡顿；滚动、触摸、滚轮类监听是它的主要场景。

1. 背景：浏览器原本必须等监听器跑完才知道要不要 preventDefault，监听器耗时长就会让滚动出现延迟或跳变。
2. 默认值：Chrome 56 起 window、document、body 上的 touchstart、touchmove 默认 passive: true，Chrome 73 起 wheel、mousewheel 也默认 passive: true。
3. 后果：在这些监听里调用 preventDefault 无效并给出控制台警告，确实需要阻止滚动时必须显式写 `{ passive: false }`。
4. 更彻底的做法是用 CSS 的 touch-action 与 overscroll-behavior 声明手势归属，让浏览器不必等 JS 决策。

```js
window.addEventListener('wheel', onWheel, { passive: true });
```

**追问与易错点**：

- 追问：touch-action: none 和 passive 什么关系？答：touch-action 由 CSS 声明哪些手势交给页面，浏览器无需等 JS 就能决策，比 passive 更彻底。
- 陷阱：为了消除警告，把 passive 改成 false。这会把滚动决策重新绑回主线程，反而更卡。

### Q31 事件委托的原理是什么？优缺点和适用场景？

**考察点**：基础必考，重点在能说出限制条件和正确写法。

**参考答案**：

> **一句话结论**：事件委托利用冒泡，把子元素的事件统一挂到共同祖先上，通过 event.target 判断来源，从而减少监听器数量并自动支持动态新增的元素。

1. 优点：内存与注册开销小（长列表尤其明显）；新增或删除子元素无需增删监听；逻辑集中，便于维护。
2. 实现：监听祖先，用 event.target.closest(selector) 找到真正的目标，再校验它属于当前容器。
3. 限制：只有会冒泡的事件才能委托（focus/blur、mouseenter/leave 不行，改用 focusin/focusout、mouseover/mouseout）。
4. 子元素若 stopPropagation，委托会失效；target 可能是内部文本或图标节点，必须用 closest 向上找。

```js
list.addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  if (item && list.contains(item)) select(item.dataset.id);
});
```

**追问与易错点**：

- 追问：键盘事件也能委托吗？答：keydown/keyup 会冒泡，可以；但 focus/blur 不冒泡，无障碍场景要用 focusin/focusout。
- 陷阱：直接用 `e.target.dataset.id` 取数据。点到子元素时 target 不是列表项，会拿到 undefined。

### Q32 手写一个拖拽（鼠标和触摸都要支持）

**考察点**：手写题，考事件选型、定位方式与边界处理，是事件机制的综合运用。

**参考答案**：

> **一句话结论**：用 Pointer Events 最简洁：pointerdown 时记录起点并 setPointerCapture，pointermove 时用 transform 更新位置，pointerup 时释放；一套代码同时覆盖鼠标、触摸与触控笔。

```js
function makeDraggable(el, state = { x: 0, y: 0 }) {
  el.style.touchAction = 'none'; // 关键：不让浏览器抢走手势
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    state.sx = e.clientX; state.sy = e.clientY;
  });
  el.addEventListener('pointermove', (e) => {
    if (!el.hasPointerCapture(e.pointerId)) return;
    state.x += e.clientX - state.sx;
    state.y += e.clientY - state.sy;
    state.sx = e.clientX; state.sy = e.clientY;
    el.style.transform = `translate(${state.x}px, ${state.y}px)`;
  });
  el.addEventListener('pointerup', (e) => el.releasePointerCapture(e.pointerId));
}
```

1. 用 transform 而不是 left/top，避免每帧触发重排。
2. 必须设 touch-action: none（或在非 passive 监听里 preventDefault），否则移动端手势会被页面滚动抢走。
3. 边界处理：监听 pointercancel 清理状态；拖拽期间给 user-select: none 防止选中文字；元素销毁时移除监听。
4. 若必须兼容老浏览器，回退到 mousedown/mousemove/mouseup 加 touchstart/touchmove/touchend 两套监听。

**追问与易错点**：

- 追问：为什么用 setPointerCapture？答：它把后续指针事件都定向到该元素，指针移出元素甚至移出窗口也不丢事件，省去在 document 上挂监听的麻烦。
- 陷阱：在 pointermove 里改 left/top 并逐帧读取 offsetLeft 计算，既重排又布局抖动，手机会明显掉帧。

### Q33 localStorage、sessionStorage、Cookie、IndexedDB、Cache Storage 怎么选？

**考察点**：必考对照题，要能按容量、生命周期、是否随请求发送、同步异步四个维度做判断。

**参考答案**：

> **一句话结论**：Cookie 是为「随请求自动携带」设计的小容量键值对，localStorage/sessionStorage 是同步的字符串键值存储，IndexedDB 与 Cache Storage 是异步、大容量、面向复杂数据的存储；选择取决于容量、生命周期、是否需要随请求发送以及数据形态。

| 维度 | Cookie | localStorage | sessionStorage | IndexedDB | Cache Storage |
| --- | --- | --- | --- | --- | --- |
| 容量 | 约 4KB | 约 5MB | 约 5MB | 受配额管理，可达磁盘较大比例 | 同 IndexedDB |
| 生命周期 | 由过期时间决定 | 永久直到清除 | 标签页关闭即清 | 永久（受配额清理） | 永久（受配额清理） |
| 作用域 | 按域与路径 | 同源全部标签共享 | 仅当前标签页 | 同源 | 同源 |
| API | 同步，随请求发送 | 同步，阻塞主线程 | 同步 | 异步事务 | 异步 Promise |
| 数据形态 | 字符串 | 字符串 | 字符串 | 结构化克隆（对象、Blob、File） | Request/Response 对 |

1. 需要服务端读取（登录态、A/B 分组）用 Cookie，并配 HttpOnly、Secure、SameSite。
2. 前端临时状态用 sessionStorage；跨会话的小配置用 localStorage。
3. 大量结构化数据、离线数据、文件缓存用 IndexedDB；HTTP 响应缓存交给 Service Worker 的 Cache Storage。

**追问与易错点**：

- 追问：localStorage 和 sessionStorage 能互相看到吗？答：同源下 localStorage 共享，sessionStorage 每个标签页独立，复制标签页时新标签拿到的是复制那一刻的快照。
- 陷阱：把 token 放 localStorage 却声称「防 XSS」。localStorage 对 JS 完全开放，任何 XSS 都能读走；HttpOnly Cookie 至少挡住 JS 读取。

### Q34 Cookie 的 SameSite、HttpOnly、Secure、Domain、Path 分别是什么？

**考察点**：进阶安全题，SameSite 三个取值的作用范围是高频追问点。

**参考答案**：

> **一句话结论**：HttpOnly 禁止 JS 读取（防 XSS 窃取），Secure 只允许 HTTPS 传输，SameSite 控制跨站请求是否携带（防 CSRF 的主力），Domain 与 Path 决定作用范围，Max-Age/Expires 决定生命周期。

1. SameSite=Strict 完全不带；Lax（Chrome 80 起默认）只在顶级导航的 GET 请求带；None 跨站也带，但必须同时加 Secure。
2. HttpOnly：document.cookie 读不到也写不到，但请求仍会自动携带；防的是 XSS 读取，不防 CSRF。
3. Secure：只在 HTTPS 下发送（localhost 例外）；更严格的写法是 `__Host-`、`__Secure-` 前缀约束，以及 Partitioned（CHIPS）。
4. Domain：不设置时是 host-only，只有当前主机名可见；设为 .example.com 则子域共享。Path 默认是当前目录，通常显式设成 /。
5. Cookie 受大小（约 4KB）与同域数量限制，且每次请求都携带，所以要精简。

**追问与易错点**：

- 追问：iframe 里带 SameSite=None 的 Cookie 为什么会丢？答：现代浏览器要求第三方 Cookie 必须显式声明 SameSite=None; Secure，否则不发送；Chrome 还在持续收紧第三方 Cookie。
- 陷阱：以为 HttpOnly 能防 CSRF。CSRF 是利用浏览器自动携带 Cookie，与 JS 能否读取无关，要另配 SameSite 与 CSRF Token。

### Q35 IndexedDB 和 localStorage 的差别？为什么 localStorage 会卡主线程？

**考察点**：进阶题，考「同步 API + 主线程」这条性能因果链。

**参考答案**：

> **一句话结论**：localStorage 是同步 API，读写就在主线程上做序列化与 IO，且只能存字符串；IndexedDB 是异步事务型数据库，支持大容量、索引查询与结构化数据，适合缓存大量业务数据或离线数据。

1. 同步与异步：localStorage 存几 MB 的 JSON 时，字符串解析与写盘都占主线程，会明显卡顿甚至掉帧；IndexedDB 在独立线程完成，不阻塞渲染。
2. 容量：localStorage 一般 5MB 左右（部分浏览器 10MB）；IndexedDB 受配额管理，超限时按 LRU 清理，可用 navigator.storage.persist() 申请持久化。
3. 能力：IndexedDB 支持对象仓库、索引、游标、事务与版本迁移，能直接存 ArrayBuffer 与 Blob，无需手动 JSON 转换。
4. 复杂度：IndexedDB 事件式 API 繁琐，实践中用 idb、Dexie 等封装；简单键值仍用 localStorage 更划算。

**追问与易错点**：

- 追问：无痕模式下 localStorage 能用吗？答：能用但配额更小、会话结束即清；存储被禁用时访问会抛异常，需要 try/catch 降级。
- 陷阱：用 localStorage 缓存接口返回的大列表（几千条 JSON）。每次读都要反序列化，主线程直接卡住，应改用 IndexedDB。

### Q36 强缓存和协商缓存是怎么配合的？

**考察点**：必考基础题，要能说清「什么时候不发请求、什么时候发请求收 304」。

**参考答案**：

> **一句话结论**：强缓存直接命中本地副本、不发请求，由 Expires 或 Cache-Control 的 max-age 决定；协商缓存会带校验字段发一次请求，服务端返回 304 时只更新响应头、复用本地响应体，由 ETag/If-None-Match 与 Last-Modified/If-Modified-Since 决定。

1. 优先级：Cache-Control 优先于 Expires；max-age 是相对时间，不受客户端时钟不准的影响。
2. 常用指令：no-cache（可缓存但每次都协商）、no-store（完全不缓存）、immutable（有效期内不协商）、must-revalidate、s-maxage（CDN/代理专用）、stale-while-revalidate（先返回陈旧副本再后台更新）。
3. ETag 优先于 Last-Modified：Last-Modified 精度只到秒，「内容没变但文件时间变了」会误判；ETag 分强校验与弱校验（W/ 前缀）。
4. 完整流程：先判断强缓存是否过期，未过期直接用；过期则携带 If-None-Match/If-Modified-Since 请求，304 刷新有效期，200 返回新内容。
5. 实践：带 hash 的静态资源用 `max-age=31536000, immutable`，HTML 入口用 `no-cache` 保证最新。

**追问与易错点**：

- 追问：为什么打包工具给文件名加 hash？答：内容变则 URL 变，可以放心设超长强缓存，解决「改了代码用户还是旧版」的问题。
- 陷阱：把 no-cache 当成「不缓存」。no-cache 是缓存但每次校验；真正不缓存是 no-store。

### Q37 from disk cache 和 from memory cache 有什么区别？

**考察点**：深挖题，考的是对浏览器两级本地缓存的认识，很多人只答「一个内存一个硬盘」。

**参考答案**：

> **一句话结论**：from memory cache 是当前渲染进程内存里的资源副本，读取最快、随进程或文档结束而消亡；from disk cache 是磁盘上的 HTTP 缓存，跨会话存活，需要磁盘 IO 与解析，慢一些但更持久。

1. memory cache 主要服务「当前页面刚加载过或已预加载」的资源，避免同页重复请求再走网络或磁盘；其中还包含已解码的图片位图，所以重绘几乎零成本。
2. 生命周期短，受内存压力影响；普通刷新（F5）通常仍可使用内存副本，强制刷新（Ctrl+F5）会跳过缓存。
3. disk cache 完全由 HTTP 缓存头部驱动，遵循强缓存与协商缓存规则，可在关闭标签页甚至重启浏览器后继续生效。
4. 两者之间如何选择是浏览器内部策略（资源大小、类型、新鲜度、是否可缓存），前端只能通过响应头与 preload 间接影响。
5. 实践意义：看到 from memory cache 说明没走网络，不必担心；要验证缓存策略应开 Disable cache 或强刷后重新观察。

**追问与易错点**：

- 追问：DevTools 里 Size 显示 `200 (from disk cache)` 是服务器返回 200 吗？答：不是，那是本地命中，请求根本没到服务器。
- 陷阱：以为 memory cache 是「浏览器全局内存缓存」。它是渲染进程级的，跨标签页不共享。

### Q38 浏览器请求一个资源的缓存查找顺序是什么？Service Worker 在哪一层？

**考察点**：深挖题，把缓存机制与 Service Worker 串起来，是高级前端的常见追问。

**参考答案**：

> **一句话结论**：一次资源请求依次经过 Service Worker 的 fetch 事件（可拦截并返回 Cache Storage 中的响应）→ 内存缓存 → 磁盘 HTTP 缓存 → 网络；Service Worker 处在最外层，所以它有能力完全接管缓存策略。

1. Service Worker 默认只对同源且在其作用域内的请求生效；可以在 fetch 事件里实现 cache-first、network-first、stale-while-revalidate 等策略。
2. 内存缓存优先于磁盘缓存，因为速度最快；同一页面重复请求同一 URL 往往命中内存。
3. 磁盘缓存遵循 HTTP 语义：强缓存命中不发请求，协商缓存发请求收 304。
4. 之后才是真正的网络请求（HTTP/2 push cache 已被放弃，不必再答）。
5. 注意非 GET 请求、跨域 opaque 响应、预检请求都会影响可缓存性；Vary 头会让同一 URL 按请求头区分缓存键。

```js
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
```

**追问与易错点**：

- 追问：DevTools 里 Size 显示 `(ServiceWorker)` 说明什么？答：响应由 Service Worker 提供，没走网络，这正是离线可用的表现。
- 陷阱：以为 Service Worker 能拦截所有请求。跨域、非 http(s) 协议、未在作用域内的请求都拦不到。

### Q39 前端怎么做缓存失效与版本管理？

**考察点**：进阶实践题，考的是把缓存知识落成可执行的发布策略。

**参考答案**：

> **一句话结论**：入口 HTML 不缓存（或 no-cache 每次协商），静态资源带内容 hash 后设置超长强缓存，Service Worker 用带版本号的缓存名在 activate 时删旧缓存，就能做到「改了立即生效、没改永不重下」。

1. 文件名带 contenthash 比 query 参数可靠：query 变化在部分 CDN 与浏览器上缓存行为不一致，工具链支持也差。
2. HTML 入口用 `Cache-Control: no-cache`，保证用户永远拿到最新的资源引用列表。
3. Service Worker 的缓存名带上构建版本，install 时预缓存新资源，activate 时用 caches.delete 清理旧版本，必要时配合 skipWaiting。
4. 回滚与灰度：按构建号分批切换，避免出现「新 HTML + 旧 JS」的错配；前端检测到版本不一致时可提示用户刷新。
5. 接口数据另用 ETag、短 max-age 或业务版本号控制，不要和静态资源混为一谈。

**追问与易错点**：

- 追问：为什么部署后偶发「点击没反应」？答：HTML 已是新版但浏览器用旧 JS（或反之），chunk 加载失败；要保证 HTML 不缓存并做好 chunk 加载失败兜底。
- 陷阱：给 HTML 也设超长强缓存。用户会长期停留在旧版本，这是线上最常见的「改了不生效」原因。

### Q40 Service Worker 的生命周期是怎样的？skipWaiting 和 clients.claim 做了什么？

**考察点**：进阶题，考查对 install → waiting → activate 这条链路的准确理解。

**参考答案**：

> **一句话结论**：生命周期是 register → installing（install 里预缓存）→ installed/waiting（若已有旧 SW 控制页面则等待）→ activating（activate 里清理旧缓存）→ activated（接管 fetch 与 message）；skipWaiting 让等待中的新 SW 立刻激活，clients.claim 让它立刻接管已打开的页面。

1. register：必须在安全上下文（HTTPS 或 localhost）注册，作用域默认是脚本所在目录，可用 scope 参数扩大。
2. install：用 event.waitUntil 做预缓存，任一步失败则安装失败；成功后若已有旧 SW 控制页面，新 SW 进入 waiting。
3. activate：常用来删除旧版本缓存；调用 clients.claim() 后无需刷新即可接管当前已打开的页面。
4. 更新检查：浏览器在导航或功能事件时检查脚本内容是否字节级变化（最多 24 小时一次），importScripts 引入的文件也算。
5. 生命周期独立于页面：空闲时会被终止，所以不能用全局变量保存状态，要落到 IndexedDB 或 Cache。
6. 调试：DevTools 的 Application → Service Workers 可以 Update / Unregister / Bypass for network，强刷默认绕过 SW。

**追问与易错点**：

- 追问：为什么我的新 SW 一直停在 waiting？答：旧 SW 还在控制页面（可能有其他标签页开着），关掉所有页面或调用 skipWaiting 才会激活。
- 陷阱：在 install 里 await 一个可能失败的资源。addAll 是原子的，一个 404 会导致整个安装失败，SW 直接不可用。

### Q41 history API 有哪些？pushState 和 popstate、hashchange 是什么关系？

**考察点**：进阶题，SPA 路由的底层机制，pushState 不触发 popstate 是最常见的坑。

**参考答案**：

> **一句话结论**：history.pushState / replaceState 能在不刷新页面的前提下改 URL 并写入 state，但不会触发 popstate；只有用户点前进后退或调用 history.go/back/forward 才触发 popstate，页面必须监听它来重新渲染。

1. pushState 新增一条历史记录，replaceState 替换当前记录；两者都受同源限制，不能跨域改 URL。
2. popstate 的事件对象里有当时写入的 state；直接刷新页面 state 会丢，需要从 URL 或 sessionStorage 恢复。
3. hashchange 只在 URL 的 hash 部分变化时触发；改 hash 会同时新增历史记录并触发 popstate 与 hashchange。
4. history.scrollRestoration = 'manual' 可以自己管理滚动位置，避免浏览器的恢复行为与 SPA 渲染冲突。
5. 传统锚点跳转（`<a href="#id">`）也走历史栈，SPA 路由通常封装 pushState 加 popstate。

```js
window.addEventListener('popstate', (e) => render(location.pathname, e.state));
history.pushState({ page: 2 }, '', '/page2'); // 不会触发 popstate
```

**追问与易错点**：

- 追问：pushState 之后用户刷新怎么办？答：服务端必须把所有前端路由回退到 index.html，否则 404；state 也要能从 URL 重建。
- 陷阱：以为 pushState 会触发 popstate，于是在跳转时手动渲染一次；结果前进后退时渲染两次或状态错乱。

### Q42 四种 Observer API 各自解决什么问题？

**考察点**：进阶题，考的是「用观察者替代高频轮询/滚动回调」这条设计思路。

**参考答案**：

> **一句话结论**：IntersectionObserver 观察元素与视口的交叉状态（懒加载、曝光统计），MutationObserver 观察 DOM 变化，ResizeObserver 观察元素尺寸变化，PerformanceObserver 采集性能条目。

1. IntersectionObserver：异步回调避免在 scroll 里频繁调用 getBoundingClientRect 引发布局抖动；可配 root、rootMargin、threshold，用于图片懒加载、无限滚动、广告曝光。
2. MutationObserver：回调在微任务时机批量派发（一次带一批 records），取代已废弃的 Mutation Events；可配 childList、attributes、characterData、subtree，注意自身修改 DOM 可能形成循环。
3. ResizeObserver：观察元素内容盒尺寸变化（默认 content-box），比 window.resize 精确；回调里再改尺寸可能触发 "ResizeObserver loop" 警告，需要做上限保护或放到下一帧。
4. PerformanceObserver：订阅 largest-contentful-paint、longtask、resource、element 等条目，是前端性能监控的标准采集方式。

**追问与易错点**：

- 追问：懒加载为什么用 IntersectionObserver 而不是监听 scroll？答：scroll 回调在主线程高频触发，读布局属性会引发强制同步布局；IO 由浏览器在合适时机异步通知，成本低得多。
- 陷阱：以为 IntersectionObserver 的回调是同步的。它异步派发，不能在同一帧里立即拿到结果。

### Q43 Web Worker、SharedWorker、Service Worker 有什么区别？

**考察点**：进阶对照题，三者都叫 Worker，职责完全不同，必须能分开讲。

**参考答案**：

> **一句话结论**：Web Worker 是专属 worker，随页面创建与销毁；SharedWorker 可被同源的多个标签页共享，通过 MessagePort 通信；Service Worker 是事件驱动、可拦截网络请求、生命周期独立于页面的后台代理。

| 维度 | Web Worker | SharedWorker | Service Worker |
| --- | --- | --- | --- |
| 归属 | 单个页面 | 同源多页面共享 | 同源多页面共享 |
| 生命周期 | 随页面 | 最后一个连接关闭后结束 | 独立，空闲被终止、有事件被唤醒 |
| 能力 | 计算、IndexedDB、fetch，无 DOM | 同 Web Worker，加端口通信 | fetch 拦截、Cache Storage、推送、后台同步 |
| 通信 | postMessage | port.postMessage | postMessage 与 fetch 等事件 |
| 典型用途 | 大数据计算、图像处理、加解密 | 多标签共享连接与状态 | 离线缓存、PWA、消息推送 |

1. 三者都不能访问 DOM，计算密集任务搬到 Worker 是避免主线程长任务的标准手段。
2. Worker 内可用 fetch、IndexedDB、WebSocket（部分实现）、OffscreenCanvas 等。

**追问与易错点**：

- 追问：SharedWorker 能用在生产吗？答：Safari 长期不支持或行为不同，移动端支持有限，常用 BroadcastChannel 加 Service Worker 替代。
- 陷阱：以为 Service Worker 能操作 DOM。它没有 DOM，只能通过 postMessage 让页面改 UI，或返回响应。

### Q44 postMessage 是怎么传数据的？结构化克隆和 Transferable 是什么？

**考察点**：深挖题，考的是跨线程通信的数据语义与性能优化手段。

**参考答案**：

> **一句话结论**：postMessage 默认用结构化克隆（Structured Clone）复制数据，能传对象、数组、Map/Set、Date、RegExp、Blob、File、ArrayBuffer 等，但函数、DOM 节点与类原型上的方法不会被保留；对 ArrayBuffer 等 Transferable 对象可以转移所有权，实现零拷贝。

1. 克隆规则：普通对象与数组按值深拷贝，Date/RegExp/Map/Set/Blob/File/ImageData 可克隆；Symbol、函数、DOM 节点会抛 DataCloneError 或被丢弃。
2. 类实例会退化成普通对象，instanceof 与类方法失效，需要重建或只传纯数据。
3. Transferable 包括 ArrayBuffer、MessagePort、ImageBitmap、OffscreenCanvas、ReadableStream 等，转移后原线程上的对象被置空（如 byteLength 变 0），零拷贝、适合大数组。
4. 需要共享内存时用 SharedArrayBuffer（要求跨源隔离响应头 COOP/COEP），配合 Atomics 做同步。

```js
const buf = new ArrayBuffer(1024 * 1024);
worker.postMessage({ buf }, [buf]); // 转移所有权，零拷贝
console.log(buf.byteLength); // 0
```

**追问与易错点**：

- 追问：传一个 Vue 响应式对象给 Worker 会怎样？答：结构化克隆不保留 getter/setter 与原型，代理对象会丢失响应性，甚至直接抛错，应传纯数据（如 JSON 化后的值）。
- 陷阱：以为 postMessage 传的是共享引用，改一边另一边会变——它是拷贝；反过来以为传大对象一定慢，用转移列表即可解决。

### Q45 常见的内存泄漏有哪些？怎么排查？

**考察点**：进阶实践题，要给得出泄漏清单，也要说得清工具用法。

**参考答案**：

> **一句话结论**：前端内存泄漏大多是「该释放的引用没释放」——全局变量、未清理的定时器与监听器、闭包持有的大对象、Detached DOM、无界缓存；先用 Performance monitor 或 performance.memory 看趋势，再用 Memory 面板的堆快照与分配时间线定位。

1. 常见泄漏源：挂到 window 的变量、忘记 clearInterval/clearTimeout、未 removeEventListener（尤其挂在 window/document 上的）、闭包长期持有 DOM 或大数组、Map/数组缓存没有上限、被移除 iframe 的残留引用。
2. 快速观察：Chrome Performance monitor 勾选 JS heap size、DOM Nodes、JS event listeners，反复操作后看是否阶梯式上升且不回落。
3. performance.memory 是 Chrome 专有且非标准，提供 usedJSHeapSize / totalJSHeapSize / jsHeapSizeLimit，只适合看趋势；更标准的是 performance.measureUserAgentSpecificMemory()（需跨源隔离）。
4. 定位：Memory 面板做三次堆快照对比（操作前、操作后、强制 GC 后），看 Delta 中持续增长的对象及其 Retainers 引用链。
5. 分配时间线（Allocation instrumentation on timeline）能指出是哪段代码分配了没被释放的对象。

**追问与易错点**：

- 追问：怎么用最简单的方式验证是不是泄漏？答：反复进出同一个页面或反复开关同一个弹窗 10 次，每轮后强制 GC 比较堆大小，趋势不回落基本可以确认。
- 陷阱：把「内存不下降」直接当泄漏。GC 是惰性的，要先点 DevTools 的强制 GC；命中率高的缓存维持较高水位也不叫泄漏。

### Q46 什么是 Detached DOM？怎么用 Memory 面板定位？

**考察点**：深挖题，考的是能否把泄漏图形化对象和真实代码引用关联起来。

**参考答案**：

> **一句话结论**：Detached DOM 是指已从文档树移除、但仍被 JS 变量、闭包或监听器引用着的节点，它们不显示但继续占内存，整棵子树都会被保留；用堆快照搜索 "Detached" 并查看 Retainers 就能找到持引用的那处代码。

1. 产生原因：`const el = document.getElementById('x'); el.remove();` 之后 el 仍被引用；或者移除节点时忘了移除监听器与闭包里的引用。
2. 危害：不光节点本身，其关联的样式、事件监听与子树都可能被一起保留，长时间反复操作会持续增长。
3. 定位：Memory → Heap snapshot → 过滤 Detached，展开看 Retainers 引用链，通常会指向持有变量的函数作用域或某个全局数组。
4. 修复：置空引用、移除监听、把长生命周期数据与 DOM 解耦、避免在全局缓存里存 DOM 节点。

```js
function mount() {
  let el = document.createElement('div');
  document.body.appendChild(el);
  return () => { el.remove(); el = null; }; // 置空引用，断开保留链
}
```

**追问与易错点**：

- 追问：移除元素后内存为什么没有立刻下降？答：GC 是非确定的，DevTools 里要先强制 GC 再看快照，且样式与布局缓存也可能短暂持有。
- 陷阱：只在 removeChild 时以为万事大吉。只要还有变量或监听器引用该节点，它就仍然是 Detached 而非被回收。

### Q47 getBoundingClientRect 和 offsetTop、clientHeight、scrollHeight 有什么区别？

**考察点**：基础易混题，坐标系与盒子边界的差异必须分清。

**参考答案**：

> **一句话结论**：getBoundingClientRect 返回相对视口、带小数、算上 transform 的矩形；offsetTop/offsetLeft 是相对 offsetParent 的整数坐标；clientHeight 是内容加内边距（不含边框与滚动条）；scrollHeight 是内容总高度（含溢出部分）。

| API | 参照物 | 是否含 border | 是否含溢出内容 | 是否含 transform |
| --- | --- | --- | --- | --- |
| getBoundingClientRect | 视口 | 含 | 否 | 含 |
| offsetTop / offsetLeft | offsetParent（最近的定位祖先） | 相对坐标 | 否 | 不含 |
| offsetWidth / offsetHeight | — | 含 | 否 | 不含 |
| clientWidth / clientHeight | — | 不含，也不含滚动条 | 否 | 不含 |
| scrollWidth / scrollHeight | — | 不含 | 含 | 不含 |

1. 需要视口相对坐标、与鼠标坐标比较或做动画时用 getBoundingClientRect；需要相对父容器的位置用 offsetTop，常配合 offsetParent 逐级累加。
2. 判断是否出现滚动条：`el.scrollHeight > el.clientHeight`。
3. 这些属性都是布局信息，读取时若前面有未应用的样式改动会触发强制同步布局，批量读取不要夹着写操作。

**追问与易错点**：

- 追问：window.innerHeight 和 document.documentElement.clientHeight 有什么区别？答：innerHeight 包含水平滚动条占用的高度，clientHeight 不含；移动端地址栏收起时两者也会有差异。
- 陷阱：用 offsetTop 直接当页面绝对纵坐标。它是相对 offsetParent 的，嵌套定位容器下需要逐级累加。

### Q48 什么是强制同步布局（布局抖动）？读写分离怎么写？

**考察点**：深挖题，性能排查的核心概念之一，必须能写出正反例。

**参考答案**：

> **一句话结论**：强制同步布局（layout thrashing，布局抖动）是指在一次任务里先写样式、紧接着读布局属性，浏览器为了给出正确读值不得不立刻把未应用的样式改动同步重算布局；循环里读写交替会让一帧内发生多次布局，性能急剧下降。

1. 触发读取的常见属性与方法：offsetTop/offsetWidth、clientHeight、scrollTop、getBoundingClientRect、getComputedStyle、focus() 等。
2. 代价：一次强制布局可能是整页级别，循环一千次就是一千次重排，帧耗时直接爆掉。
3. 解决：读写分离，先集中读并缓存全部布局信息，再集中写；或者把读放到 rAF 里，因为下一帧开始时布局是干净的。
4. 大列表里逐个测量元素（虚拟滚动、瀑布流）最容易踩坑，应改成一次性测量，或用 ResizeObserver 异步拿尺寸。

```js
// 反例：每次循环都读又写，触发 N 次强制布局
for (const el of items) el.style.width = el.offsetWidth + 1 + 'px';
// 正例：先读完，再统一写
const widths = items.map((el) => el.offsetWidth);
items.forEach((el, i) => { el.style.width = widths[i] + 1 + 'px'; });
```

**追问与易错点**：

- 追问：为什么在 rAF 里读布局比较好？答：rAF 回调在样式计算之前运行，此时布局是干净的，读取不会因为新写入的样式而被迫同步重算。
- 陷阱：以为「只读不写」没有代价。大量读取本身也会触发不可见的布局刷新，只是没有交替读写那么严重。

### Q49 document.write 为什么危险？

**考察点**：进阶题，考的是它对解析流程与页面状态的破坏，而不只是「不推荐使用」。

**参考答案**：

> **一句话结论**：document.write 会阻塞 HTML 解析、让预加载扫描器失效，并且在文档解析完成后（例如 load 之后或在 defer/异步脚本里）调用会隐式执行 document.open，清空并重写整个页面。

1. 解析阻塞：写入的内容会插入当前位置并立即解析，后续解析必须等待，破坏流式解析。
2. 破坏预加载：扫描器看不到 write 产生的标签，无法提前发现资源，拖慢首屏。
3. 文档已关闭时调用：浏览器会先 open（清空文档）再 write，导致白屏、事件与状态丢失；在 defer/async 脚本里同样危险，模块脚本中直接不允许。
4. 现代替代：DOM API（createElement/appendChild）、innerHTML（注意 XSS）、insertAdjacentHTML，或交给服务端模板输出。
5. 勉强合理的场景是同步插入一段必须在解析位置就存在的脚本（例如广告位兜底），即便如此也应优先考虑 document.currentScript 加 DOM 操作。

**追问与易错点**：

- 追问：为什么一些第三方广告代码还在用 document.write？答：历史包袱与「必须在解析位置同步输出」的需求；现在普遍改用 iframe 或异步容器。
- 陷阱：以为 document.write 只是「慢一点」。在错误时机调用会直接清空页面，属于功能性事故。

### Q50 iframe 有什么代价？什么时候还不得不用？

**考察点**：进阶题，考取舍判断，而不是简单说「iframe 不好」。

**参考答案**：

> **一句话结论**：iframe 会创建独立的浏览上下文与文档，带来额外请求、内存与（跨站时）进程开销，还会阻塞父页面的 load 事件、影响 SEO 与可访问性、让 history 与滚动变复杂；但在需要强隔离或在页面里嵌第三方内容时仍不可替代。

1. 性能：每个 iframe 都要完整走一遍导航与渲染流水线；父页面 load 事件要等所有 iframe 加载完；iframe 内的资源不计入父页面指标但会争抢带宽。
2. 进程模型：站点隔离下跨站 iframe 通常是独立渲染进程，内存成倍增加。
3. 交互与历史：iframe 内的导航会进入浏览器历史，用户点后退可能「只退了 iframe」；滚动、键盘焦点、resize 都需要额外协调。
4. 安全与可访问性：跨域内容要靠 sandbox、allow、CSP 等约束；屏幕阅读器与搜索引擎对 iframe 内内容的处理都不理想。
5. 替代方案：能用组件、微前端运行时或 fetch 加 Shadow DOM 就别用 iframe；必须嵌第三方时加 loading="lazy" 延迟加载。

**追问与易错点**：

- 追问：loading="lazy" 对 iframe 有效吗？答：有效，视口外的 iframe 会推迟加载，显著减少初始请求与内存，但要注意懒加载后与父页面的高度同步问题。
- 陷阱：用 iframe 做「页面局部刷新」或微前端隔离，却忽略父页面 onload 被拖慢以及内存翻倍的成本。

### Q51 批量操作 DOM 有哪些手段？DocumentFragment 好在哪？

**考察点**：基础实践题，考的是「减少重排次数」这个共同目标下的具体手段。

**参考答案**：

> **一句话结论**：DocumentFragment 是一个不在文档树里的轻量容器，往它里面添加节点不触发样式计算与布局，最后一次性插入文档只引起一次重排，是批量创建 DOM 的标准手段。

1. 原理：fragment 不属于渲染树，操作它是纯内存操作；插入文档时把子节点整体移入，fragment 自身不出现在 DOM 里。
2. 对比：直接循环 appendChild 到文档中，每次插入都可能触发样式与布局计算；用 fragment 只有最后一次。

```js
const frag = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li');
  li.textContent = `item ${i}`;
  frag.appendChild(li);
}
list.appendChild(frag); // 只重排一次
```

3. 其他批量手段：innerHTML 一次性替换（注意 XSS 与事件丢失）、cloneNode 在副本上改完再替换、`<template>` 加 cloneNode 复用结构、先 display:none 离线修改再显示。
4. 注意：fragment 里的节点被移入文档后 fragment 就空了，不能复用；一次插入上千节点仍会有一次较大的重排，必要时配合虚拟列表或 content-visibility。

**追问与易错点**：

- 追问：innerHTML 和 DocumentFragment 怎么选？答：纯静态 HTML 字符串用 innerHTML 更快（浏览器内部有优化）；需要绑定事件、逐节点处理或数据来自用户输入时用 createElement 加 fragment。
- 陷阱：以为用了 fragment 就完全没有重排。插入动作本身仍会触发一次布局，只是把 N 次压成了 1 次。

## 本章小结

- 浏览器的效率来自进程与线程的分工：主进程管调度、渲染进程管页面、GPU 进程管上屏、网络进程管请求，主线程只做「会卡住用户」的那部分工作。
- 从 URL 到屏幕是「导航 + 渲染」两段，渲染流水线固定为 JS → 样式 → 布局 → 绘制 → 合成，一帧预算 16.6ms，先优化占用主线程的环节。
- 阻塞要分清楚：CSS 阻塞渲染与脚本，同步 script 阻塞解析，defer 保序、async 不保序、module 默认等同 defer。
- 性能口诀是「重排 > 重绘 > 合成」：几何变化比重绘贵，能用 transform/opacity 表达的动画不要动 top/left；will-change 与 translateZ(0) 有显存与层爆炸代价，动画后要移除。
- 强制同步布局是隐形的性能杀手，任何「写后立刻读」的循环都要改成读写分离，或在 rAF 里统一处理。
- 缓存策略决定首屏体验：HTML 不缓存、静态资源带 hash 长缓存、协商缓存兜底，Service Worker 在最外层可以完全接管缓存与离线能力。
- 事件机制记住三点：三阶段传播、addEventListener 的选项对象、preventDefault 与 stopPropagation 各管一件事；滚动类监听尽量 passive。
- 内存问题先看趋势再找引用链：定时器、监听器、闭包、Detached DOM 与无界缓存是最常见的四类泄漏源。

<!-- COUNT: 51 -->
