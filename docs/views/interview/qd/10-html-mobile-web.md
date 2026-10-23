---
title: "第 10 章 HTML 语义化与移动端 Web"
---

## 第 10 章 HTML 语义化与移动端 Web

### Q1 每个页面开头都要写 `<!DOCTYPE html>`，不写会怎样？怪异模式到底怪在哪？

**考察点**：是否知道 DOCTYPE 不是标签而是一个"解析模式开关"，以及怪异模式（Quirks Mode）具体改变了什么。

**参考答案**：

> **一句话结论**：`<!DOCTYPE html>` 的唯一实际作用是让浏览器进入标准模式（Standards Mode）解析；漏写或写错会掉进怪异模式，盒模型、行盒与表格字体的计算规则都变了，`document.compatMode` 会返回 `BackCompat`。

1. 三种模式：标准模式、准标准模式（Almost Standards，过渡型 DTD 带 URI 时触发，主要差异是图片行内间隙）、怪异模式；判定依据是 DOCTYPE 之前出现的内容，注释可以容忍，元素和文本不行。
2. 怪异模式的典型差异：`width/height` 包含 `padding` 与 `border`（表现接近 `box-sizing: border-box`）；`line-height`、`vertical-align` 对行盒的计算不同；`font-size` 在表格中的继承方式不同；百分比高度在自动高度父元素上更容易生效。
3. 实践要求：DOCTYPE 必须是文档第一行，前面不要放注释；`<meta charset="utf-8">` 要落在 HTML 的前 1024 字节内，否则会被重新解析。
4. 排查手段：控制台执行 `document.compatMode`，标准模式返回 `CSS1Compat`，怪异模式返回 `BackCompat`。

**追问与易错点**：

- 追问：为什么有些老页面在标准模式下会错位？答：它们当年是按怪异模式的盒模型写的，加上 DOCTYPE 后宽度不再包含 padding 和 border，布局自然撑破。
- 陷阱：把 DOCTYPE 当成 HTML 标签去讨论闭合。它是一条声明，没有结束标签，也不属于 DOM 树。

### Q2 现在都组件化了，为什么还问语义化标签？`div` 一把梭有什么问题？

**考察点**：能不能说出语义化的真实收益方是谁（爬虫、读屏软件、协作者），而不是背标签名。

**参考答案**：

> **一句话结论**：语义化的收益是给机器和其他开发者读的结构信息，不是样式；`div` 一把梭丢掉的是内容大纲、地标导航和原生交互能力。

1. 对搜索引擎：`header/nav/main/article/aside/footer` 帮助爬虫识别主体内容与导航区，`h1`~`h6` 的层级形成内容大纲，比一整片 `div` 更容易判断权重。
2. 对无障碍：这些标签自带地标角色（landmark role），读屏软件可以按区域跳转；`button` 天生可聚焦、可用回车与空格触发、有禁用态，`div onclick` 必须手工补齐这一整套。
3. 选型原则：能表达含义就用原生标签——折叠用 `details/summary`、时间用 `time datetime`、进度用 `progress`、图表配 `figure/figcaption`；一块独立可分发的内容用 `article`，有标题的主题分组用 `section`，纯样式容器才用 `div`。
4. 注意别过度语义化：`section` 必须有可识别的标题，没有标题就用 `div`；一个页面只应有一个可见的 `main`，导航项用 `nav` 包一组链接而不是给每个 `a` 套 `nav`。

**追问与易错点**：

- 追问：`article` 和 `section` 怎么分？答：判断标准是"这坨内容能不能独立拿出去分发/被订阅"，能就用 `article`，只是章节划分就用 `section`。
- 陷阱：用 `h1` 当字号工具，一页塞好几个 `h1`；或者给 `div` 加 `role="button"` 就以为等于 `button`，键盘和读屏行为其实都没跟上。

### Q3 移动端 `meta` 标签你一般写哪些？`viewport` 那几个参数分别管什么？

**考察点**：移动端适配的起点，考的是每个参数的作用与"哪些不该写"。

**参考答案**：

> **一句话结论**：标准起点是 `width=device-width, initial-scale=1`，再按需加 `viewport-fit=cover`、`theme-color`、`format-detection` 与 `apple-mobile-web-app-*`。

1. `width=device-width` 让布局视口等于设备逻辑宽度，`initial-scale=1` 保证 1 CSS px 对应 1 逻辑 px；`maximum-scale` 与 `user-scalable=no` 属于反模式，违反无障碍规范（WCAG 1.4.4），iOS 10 起 Safari 也直接忽略。
2. `viewport-fit=cover` 让页面铺满刘海屏，配合 `padding: env(safe-area-inset-bottom)` 之类避开刘海与 Home 指示条。
3. `theme-color` 控制 Android Chrome 等浏览器地址栏着色，可以写多个并配 `media="(prefers-color-scheme: dark)"` 适配深色模式。
4. `format-detection` 关闭数字自动识别，`telephone=no` 防止订单号被当作电话弹出拨号盘；`email`、`address` 同理。
5. `apple-mobile-web-app-capable` / `-status-bar-style` / `-title` 控制"添加到主屏"后的全屏与状态栏表现；现代写法用 manifest 的 `display`，但 Safari 仍认这组前缀。

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#ffffff">
<meta name="format-detection" content="telephone=no">
<meta name="apple-mobile-web-app-capable" content="yes">
```

**追问与易错点**：

- 追问：为什么不能靠 CSS 媒体查询代替 viewport？答：媒体查询读的是布局视口宽度，视口没设对，`@media` 判断的前提本身就是错的。
- 陷阱：为了"设计稿 750px"去写 `initial-scale=0.5` 之类的固定缩放，导致 DPR 与字号异常；正确做法是布局用 `rem`/`vw` 换算。

### Q4 写出 `<p><div>a</div></p>`，浏览器会怎么处理？HTML 解析为什么不会报错？

**考察点**：对 HTML 解析器容错机制的认识，很多人的理解停留在"浏览器会帮我修好"。

**参考答案**：

> **一句话结论**：HTML 解析器按 WHATWG 规范里写死的纠错规则建树，永不因标签错误报错，所以"能显示"不等于"结构正确"。

1. `p` 只能包含短语内容（phrasing content），遇到 `div` 会自动闭合 `p`，最终写成两个兄弟节点，而不是嵌套。
2. 同类纠错还有：`<table>` 自动补 `tbody`、`li` 未闭合时按下一个 `li` 或列表结束闭合、表单嵌套时内层 `form` 被忽略、`a` 嵌套 `a` 由"收养机构算法"拆成兄弟。
3. 解析流程：先分词（tokenize）再建树；途中遇到同步 `<script>` 立即执行并阻塞解析，`<link rel="stylesheet">` 会阻塞渲染并阻塞其后脚本执行，所以标签顺序直接影响首屏。
4. 危害：结构被静默改写后，CSS 选择器与 JS 取到的节点会和预期不一致；用 `innerHTML` 写入时纠错是静默的，而 Vue/React 的模板编译期通常直接报错，这反而更安全。

**追问与易错点**：

- 追问：那还有必要检验 HTML 吗？答：有必要，用 W3C 校验器或编辑器提示，因为纠错结果依赖规范细节，跨浏览器组合场景（尤其 `table`、`form`）容易出现差异。
- 陷阱：把浏览器纠错当成"随机行为"或"浏览器之间不一样"。对绝大多数场景，纠错规则是规范统一规定的，差异主要在老 IE。

### Q5 表单的原生校验能用到什么程度？`input` 类型和移动端键盘什么关系？

**考察点**：能否用原生能力覆盖第一层校验，以及 `type`、`inputmode`、`pattern` 在键盘唤起上的分工。

**参考答案**：

> **一句话结论**：`required`/`pattern`/`min`/`max`/`step`/`type` 能提供零 JS 的提交校验与无障碍提示，做第一层最划算，但服务端校验不可省。

1. 校验 API：`form.checkValidity()` 整体校验，`input.validity` 给出 `valueMissing`、`typeMismatch`、`patternMismatch`、`rangeUnderflow`、`tooLong` 等具体原因，`setCustomValidity()` 自定义提示，样式可用 `:valid`/`:invalid`/`:user-invalid`。
2. `novalidate` 关闭原生提示后可自绘气泡；注意 `form.requestSubmit()` 会走校验流程，而 `form.submit()` 完全绕过校验直接提交。
3. 键盘唤起：`type="email"`、`tel`、`url`、`number`、`search` 会影响键盘布局，`inputmode` 提供更细的控制（`numeric`/`decimal`/`tel`/`email`）；在 iOS 上要让数字键盘可靠出现，常写成 `type="text" inputmode="numeric" pattern="[0-9]*"`。
4. 金额与手机号不要用 `type="number"`：它允许 `e`、会受 `step` 限制、滚轮容易误改，且会丢掉前导零，用 `type="text"` 加 `inputmode` 更稳。
5. 体验项：`autocomplete`（如 `one-time-code`、`new-password`、`tel`）能触发短信验证码自动填充与密码管理器，是移动端转化率的重点。

```html
<form>
  <input name="phone" type="tel" inputmode="numeric" pattern="[0-9]*"
         autocomplete="tel" required maxlength="11">
  <input name="code" type="text" inputmode="numeric"
         autocomplete="one-time-code" required>
  <button type="submit">提交</button>
</form>
```

**追问与易错点**：

- 追问：怎么统一替换成自定义提示样式？答：监听 `invalid` 事件，`preventDefault()` 阻止默认气泡，再配合 `setCustomValidity()` 或自绘提示层。
- 陷阱：以为 `type="number"` 会限制输入内容。它只影响校验与键盘，用户依然能敲进非数字字符。

### Q6 画图表、画图标、做可视化，`canvas` 和 `svg` 怎么选？

**考察点**：两种图形方案的本质差异（立即模式 vs 保留模式）与取舍判断。

**参考答案**：

> **一句话结论**：像素级操作、海量图元、游戏与图像处理用 `canvas`；需要矢量缩放、DOM 事件、可访问性与 SEO 用 `svg`。

1. 渲染模型：`canvas` 是立即模式（immediate mode），画完只剩像素，没有"图形对象"，改动要重绘或局部 `clearRect`；`svg` 是保留模式（retained mode），每个图形都是 DOM 节点，可以绑事件、用 CSS 动画、被读屏软件读取。
2. 性能特征：`svg` 在节点数上千后受 DOM 与样式计算拖累；`canvas` 性能上限高，但重绘面积大时压主线程，可用 `OffscreenCanvas` 配合 Worker 转移渲染。
3. 适配：`canvas` 必须自己处理高清屏——按 `devicePixelRatio` 放大位图尺寸再缩放上下文，否则发虚；`svg` 天然矢量，无需额外处理。

```js
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
```

| 维度 | canvas | svg |
| --- | --- | --- |
| 图形模型 | 立即模式，无对象 | 保留模式，均为 DOM |
| 缩放质量 | 放大发虚，需处理 DPR | 矢量无损 |
| 事件与无障碍 | 只能整块监听坐标 | 每个图形可绑事件、可读屏 |
| 适用量级 | 几千以上图元、逐帧渲染 | 百级图元、图表与图标 |
| 典型场景 | 游戏、图像滤镜、大数据可视化 | logo、图表、地图、交互组件 |

**追问与易错点**：

- 追问：什么时候上 WebGL？答：图元到几万、需要着色器或 3D 时；`canvas` 2D 与 DOM 都已到瓶颈才考虑，成本是开发复杂度陡增。
- 陷阱：断言 "`svg` 一定比 `canvas` 慢"。节点少时 `svg` 反而更快，交互与可访问性还是白送的。

### Q7 `preload`、`prefetch`、`preconnect`、`dns-prefetch`、`modulepreload` 有什么区别？优先级怎么排？

**考察点**：资源提示（resource hints）的语义分辨，这是首屏优化的高频追问点。

**参考答案**：

> **一句话结论**：按"对当前导航的紧急程度"排：`preload`（当前页面马上要用）> `modulepreload`（当前页面的 ESM 依赖图）> `preconnect`（提前完成 DNS+TCP+TLS）> `dns-prefetch`（只解析 DNS）> `prefetch`（下一个页面可能用，最低优先级、空闲下载）。

1. `preload` 必须带 `as`（`script`/`style`/`font`/`image`/`fetch`），否则浏览器会当成两次不同请求；字体还要加 `crossorigin`，因为字体请求本身是 CORS 模式。
2. `modulepreload` 不只提前下载，还会提前解析模块图，Vite 产物默认会给入口 chunk 加这个提示，为动态 `import()` 的准备阶段省时间。
3. `preconnect` 一次性完成 DNS + TCP + TLS，收益最大但成本也最高（占连接数），关键域建议控制在 3~4 个以内；`dns-prefetch` 只做域名解析，兼容性最好，常作为老浏览器的兜底。
4. `prefetch` 用浏览器空闲时间低优先级下载，命中后放进 HTTP 缓存供下一次导航使用，绝不能用来救当前页面的首屏。
5. 另一种调优先级的手段是 `fetchpriority="high|low|auto"`（Chrome 101+、Safari 17+），作用于当前元素的网络优先级，和上面的提示是互补关系。

| 指令 | 做了什么 | 生效时机 | 典型用途 |
| --- | --- | --- | --- |
| preload | 提前下载当前页资源 | 立即，高优先级 | 首屏字体、入口 JS、LCP 图 |
| modulepreload | 下载并解析模块图 | 立即，高优先级 | 入口与关键 chunk |
| preconnect | DNS + TCP + TLS | 立即，少量成本 | 字体域、CDN 域、接口域 |
| dns-prefetch | 仅 DNS 解析 | 立即，成本极低 | 已知会用到的第三方域 |
| prefetch | 低优先级下载 | 空闲时 | 下一步/下一页资源 |

**追问与易错点**：

- 追问：给所有图片都加 `preload` 有什么后果？答：抢占带宽与连接，真正的关键 CSS/JS 反而被推迟，控制台还会报未使用预加载的警告。
- 陷阱：把 `prefetch` 当成"提前加载当前页资源"。它服务的是下一次导航，用错场景等于白下。

### Q8 响应式图片怎么做？`srcset`、`sizes`、`picture` 分别在解决什么问题？

**考察点**：能否让浏览器自己挑最优图，而不是靠 JS 判断设备；`sizes` 写错是最高频的错误。

**参考答案**：

> **一句话结论**：`srcset` + `sizes` 解决"同一张图适配不同宽度与 DPR"，`<picture>` 解决"不同浏览器用不同格式（AVIF/WebP）以及艺术方向裁剪"，`<img>` 永远是必需的兜底。

1. 描述符分两类：`w` 描述符描述图片资源真实宽度，浏览器结合 `sizes` 给出的渲染宽度和当前 DPR 选择；`x` 描述符用于固定显示尺寸的场景（如 logo、头像）。
2. `sizes` 描述的是"这张图在页面上占多宽"，写法如 `(max-width: 600px) 100vw, 800px`，必须与真实 CSS 一致，否则选择结果会明显偏大或偏小。
3. `<picture>` 里用 `type` 做格式协商（`image/avif`、`image/webp`），用 `media` 做艺术方向（竖屏窄裁、宽屏全景）；顺序从上到下取第一个支持的 `source`，`img` 放在最后兜底。
4. 格式取舍：AVIF 压缩率最好但编码慢、解码耗电，老设备上解析成本高；WebP 支持面更广（Safari 14+ 起），通常按 AVIF → WebP → JPEG 的顺序降级。
5. 别忘了写 `width` 与 `height` 属性：浏览器能用它们算出宽高比、提前占位，CSS 里再写 `width: 100%; height: auto`，这是防布局抖动（CLS）的最有效手段。

```html
<picture>
  <source type="image/avif" srcset="hero-800.avif 800w, hero-1600.avif 1600w" sizes="100vw">
  <source type="image/webp" srcset="hero-800.webp 800w, hero-1600.webp 1600w" sizes="100vw">
  <img src="hero-800.jpg" width="800" height="450" alt="首屏主视觉"
       srcset="hero-800.jpg 800w, hero-1600.jpg 1600w" sizes="100vw">
</picture>
```

**追问与易错点**：

- 追问：`sizes="(max-width: 600px) 100vw, 800px"` 怎么理解？答：窄屏时图片占满视口宽度，宽屏时固定 800 CSS px，浏览器据此乘 DPR 换算后去 `srcset` 里挑最合适的一张。
- 陷阱：只写 `srcset` 不写 `sizes`。默认按 `100vw` 计算，桌面端经常选到过大的图，白流量还拖慢首屏。

### Q9 SEO 和前端渲染方式什么关系？`SSR`、`SSG`、预渲染分别解决什么？

**考察点**：SEO 基础项是否清楚，以及能否讲清"爬虫看到的是 HTML"这条主线。

**参考答案**：

> **一句话结论**：搜索引擎爬到的是 HTML，纯客户端渲染（CSR）的首屏 HTML 里没有内容就得靠 SSR/SSG/预渲染补，语义标签、`meta` 与结构化数据是第二层"让爬虫读懂"的工作。

1. 基础项：`title` 与 `description` 唯一且描述准确、`link rel="canonical"` 防重复收录、`h1`~`h6` 层级清晰、图片有 `alt`、语义标签划分区域、`robots.txt` 与 `<meta name="robots">` 谨慎使用 `noindex`。
2. 渲染方式对照：CSR 输出空壳 HTML，Google 能执行 JS 但有排队与抓取预算，社交分享抓取和多数非 Google 引擎基本不执行 JS；SSR 由服务端直出首屏 HTML；SSG/预渲染在构建期生成静态 HTML，适合内容相对稳定的页面；实际项目常按路由混合使用。
3. 结构化数据：JSON-LD 按 schema.org 标注内容，可以拿到搜索结果富摘要；分享卡片靠 Open Graph 与 Twitter Card 的 `og:title`、`og:image`，微信抓的也是 `title` 加首图与描述。
4. 关键补充：SSR 只是把首屏 HTML 提前生成，客户端还要做注水（hydration）接管交互，服务端与客户端首次渲染结果不一致会出现 hydration mismatch。

| 渲染方式 | 首屏 HTML 有内容 | 收录友好度 | 适用 |
| --- | --- | --- | --- |
| CSR | 否 | 依赖爬虫执行 JS | 后台系统、登录后页面 |
| SSR | 是 | 好 | 内容型站点、需要实时数据 |
| SSG/预渲染 | 是 | 最好且可 CDN 化 | 文档、博客、营销页 |

**追问与易错点**：

- 追问：怎么确认内容真的能被收录？答：`curl` 拿原始 HTML 或用搜索后台的抓取测试，看首屏关键内容是否在 HTML 里，而不是靠肉眼看浏览器。
- 陷阱：明明上了 SSR，却用 `v-if` 让核心内容依赖客户端状态或 `onMounted` 后的接口数据，服务端 HTML 里依然什么都没有。

### Q10 `loading="lazy"`、`decoding`、`fetchpriority` 怎么配合才不会拖慢 LCP、也不会抖布局？

**考察点**：图片加载优先级与 CLS 的综合把握，是否知道"懒加载不能乱加"。

**参考答案**：

> **一句话结论**：首屏 LCP 图不懒加载并标 `fetchpriority="high"`，屏外图加 `loading="lazy"`，所有图都写 `width`/`height` 或 `aspect-ratio` 占位，才能既省带宽又不抖布局。

1. `loading="lazy"` 由浏览器按可视距离与网络状况决定加载时机（Chrome 大致是快速网络 1250px、慢速网络 2500px 的阈值），首屏关键图禁用，否则会推迟 LCP。
2. `decoding="async"` 让图片解码不阻塞主线程渲染，`sync` 反而会卡住渲染，`auto` 交给浏览器；`fetchpriority="high|low|auto"` 直接覆盖元素的网络优先级（Chrome 101+、Safari 17+），常用于 LCP 图提升、装饰图降低。
3. CLS 的根因是"元素加载后尺寸变化"：图片不写尺寸时初始高度为 0，加载完把下方内容整体推开；写 `width`/`height` 属性后浏览器会按宽高比预留空间。
4. 占位方案：主色块（背景色/`background-image` 模糊小图）、LQIP 低质量占位、骨架屏；配合 `object-fit: cover` 保证裁切一致。
5. 长列表还可以用 `content-visibility: auto` 配合 `contain-intrinsic-size` 跳过屏外渲染，但必须给出尺寸预估值，否则滚动条会跳。

```html
<img src="hero.avif" width="1200" height="630" fetchpriority="high"
     decoding="async" alt="首屏主视觉">
<img src="card.avif" width="400" height="300" loading="lazy"
     decoding="async" alt="列表配图">
```

**追问与易错点**：

- 追问：懒加载图片在锚点跳转或打印时怎么办？答：锚点跳转时浏览器会先加载目标附近图片；打印场景可在 `beforeprint` 里把 `loading` 改回 `eager` 再恢复。
- 陷阱：把 LCP 大图也加上 `loading="lazy"`，指标不但没优化反而变差，这是最常见的"优化反向操作"。

### Q11 `aria-*` 是干什么的？什么时候用、什么时候别用？

**考察点**：无障碍基础，重点是"ARIA 不能补行为"这条底线。

**参考答案**：

> **一句话结论**：`aria-*` 只修改无障碍树（accessibility tree）里的语义，不改变 DOM 行为，所以第一原则是"能用原生元素就不要用 ARIA"。

1. 常用属性：`aria-label`/`aria-labelledby` 补可访问名，`aria-describedby` 补说明，`aria-hidden="true"` 把装饰元素移出无障碍树（有焦点的元素绝不能加），`aria-expanded`/`aria-controls` 做折叠，`aria-current="page"` 标当前导航项，`aria-live="polite|assertive"` 让读屏播报动态内容。
2. 别用 ARIA 造控件：`div role="button"` 之后必须自己补 `tabindex="0"`、回车与空格处理、禁用态与焦点样式，成本高还容易漏；直接用 `button` 自带全部行为。
3. 键盘可达性：焦点顺序应与 DOM 顺序一致，不要写正的 `tabindex`；模态框要做焦点陷阱并支持 Esc 关闭；页面顶部给一个"跳到主内容"的跳转链接。
4. 可访问名优先级：`aria-labelledby` > `aria-label` > 原生 `label`/元素内容 > `title`，`title` 只作兜底且移动端不可靠。
5. 图片替代文本：内容图写清描述，纯装饰图写 `alt=""`（同时移出无障碍树），图标按钮用 `aria-label`；颜色对比度按 WCAG AA 要求正文 4.5:1、大字 3:1。

**追问与易错点**：

- 追问：怎么验证加对没加对？答：用 Chrome DevTools 的 Accessibility 面板看无障碍树与可访问名，跑一次 Lighthouse，再开 VoiceOver/TalkBack 实际听一遍。
- 陷阱：给原生元素乱加 `role` 覆盖语义，比如给 `button` 加 `role="link"`，结果键盘行为与播报互相矛盾，比不加还糟。

### Q12 `iframe` 有哪些真实使用场景？它最大的安全隐患是什么？

**考察点**：能不能把 `iframe` 当成"独立浏览上下文"来看，并说清 `sandbox` 与跨源限制。

**参考答案**：

> **一句话结论**：`iframe` 适合嵌入第三方内容与做隔离（微前端、富文本、样式沙箱），但它默认不受控，必须用 `sandbox`、`allow`、`referrerpolicy` 收敛权限，跨源只能靠 `postMessage` 通信。

1. 场景：嵌入地图、播放器、支付页、广告等第三方内容；微前端里用 `iframe` 做 JS/CSS 彻底隔离；富文本编辑区用来隔离用户样式；同源 `iframe` 做样式命名空间隔离。
2. 沙箱规则：`sandbox` 是"关掉一切再逐个开"，按需给 `allow-scripts`、`allow-forms`、`allow-popups`、`allow-downloads`；`allow-scripts` 与 `allow-same-origin` 同时开等于没沙箱——同源加脚本意味着可以直接操作父页面 DOM。
3. 权限与引用：`allow="camera; geolocation"` 通过权限策略（Permissions Policy）控制子页面能用哪些能力；`referrerpolicy` 控制 Referer 泄漏；`loading="lazy"` 支持延迟加载非首屏 `iframe`。
4. 通信：同源可直接访问 `contentWindow.document`；跨源只能用 `postMessage`，发送方用 `"*"` 很危险，接收方必须校验 `event.origin` 与 `event.source`，且不能把消息当可信输入直接拼 HTML。

```js
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://trusted.example.com') return; // 必须校验来源
  if (e.source !== iframe.contentWindow) return;          // 校验发送方
  const data = JSON.parse(e.data);
  if (data.type === 'resize') iframe.style.height = data.height + 'px';
});
```

5. 其他代价：每个 `iframe` 是独立文档，有自己的解析、渲染与内存开销，还会与父页共享主线程；高度自适应要靠 `ResizeObserver` 或消息通知；受第三方 Cookie 限制影响，`iframe` 内的登录态可能拿不到；跨源时无法读取真实 URL 与内容。

**追问与易错点**：

- 追问：怎么防止自己的页面被别人嵌套钓鱼？答：响应头 `X-Frame-Options: DENY|SAMEORIGIN` 或 CSP 的 `frame-ancestors 'self'`，JS 里判断 `top !== self` 只能算补充手段（可被绕过）。
- 陷阱：以为 `sandbox` 是白名单机制。它是黑名单思维的反面——所有能力默认关闭，再加 `allow-*` 逐项打开。

### Q13 SRI 是什么？`integrity` 属性解决了什么、代价是什么？

**考察点**：子资源完整性（Subresource Integrity）的原理与工程落地成本。

**参考答案**：

> **一句话结论**：SRI 用 `integrity="sha384-..."` 让浏览器校验下载到的脚本/样式哈希，不一致就拒绝执行，用来防 CDN 被篡改或第三方投毒。

1. 用法：`<script src="https://cdn.x.com/lib.js" integrity="sha384-xxxx" crossorigin="anonymous"></script>`，跨源资源必须带 `crossorigin`，否则浏览器拿不到响应体做校验会直接拒载，而缺少 CORS 响应头同样会被拒。
2. 支持 `sha256`/`sha384`/`sha512`（推荐 384），可以写多个哈希空格分隔，便于平滑轮换或同时兼容新旧版本。
3. 生效范围：`script` 与 `link rel="stylesheet"` 是主战场；动态插入的 `script` 设置 `integrity` 也生效；ES 模块的 SRI 支持较晚且各家不一致，接入前必须实测目标浏览器。
4. 代价与配套：内容一变哈希就变，必须与构建、发布流程绑定，常用 webpack 的 `webpack-subresource-integrity` 插件生成哈希清单；CDN 若对文件做压缩、注入统计脚本等任何重写，都会导致校验失败。
5. 定位：它是纵深防御的一环，和 CSP 的 `script-src`、nonce/hash 配合使用，且不能替代 HTTPS。

**追问与易错点**：

- 追问：加了 `integrity` 脚本却完全不加载，怎么排查？答：先看有没有 `crossorigin="anonymous"`，再看服务端是否返回 `Access-Control-Allow-Origin`，最后核对哈希是否与最终产物一致（注意压缩与换行差异）。
- 陷阱：把 SRI 当成防 XSS 的手段。它只保证"资源没被改过"，不保证资源本身安全，恶意脚本自己发自己的哈希一样能通过校验。

### Q14 Web Components 说说是哪几块？`shadow DOM` 到底隔离了什么？

**考察点**：原生组件化能力的整体认知，以及封装边界的准确描述。

**参考答案**：

> **一句话结论**：三大件是自定义元素（Custom Elements）定义行为、Shadow DOM 做样式与 DOM 封装、`<template>` 与 `<slot>` 做可复用结构，能在任意框架里用原生方式写组件。

1. 自定义元素：`class X extends HTMLElement` 后 `customElements.define('x-btn', X)`，标签名必须包含短横线；生命周期有 `connectedCallback`、`disconnectedCallback`、`attributeChangedCallback`（依赖静态 `observedAttributes`）、`adoptedCallback`。
2. Shadow DOM：`attachShadow({ mode: 'open' })` 后内部样式不外泄、外部选择器进不去；继承型属性与 CSS 自定义属性（`--x`）仍能穿透，这是皮肤定制的入口。`mode: 'closed'` 之后外部拿不到 `shadowRoot`，但不利于调试与测试，实践中多用 `open`。
3. `template` 与 `slot`：`template` 内容不渲染也不加载资源（图片、脚本要等克隆插入后才请求），适合重复结构；`slot` 与 `slot name` 做内容分发，`::slotted()` 选中被分发的内容。

```js
class XBadge extends HTMLElement {
  static get observedAttributes() { return ['text']; }
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>.b{color:#c00}</style><span class="b"></span>`;
  }
  attributeChangedCallback(name, oldV, newV) {
    if (name === 'text') this.shadowRoot.querySelector('.b').textContent = newV;
  }
}
customElements.define('x-badge', XBadge);
```

4. 现状与坑：Chrome/Safari/Firefox 主流版本均已支持，IE 需 polyfill；Shadow DOM 内的表单控件默认不参与外层 `form` 提交，需要 `ElementInternals`（`formAssociated`）打通；服务端渲染依赖声明式 Shadow DOM（`<template shadowrootmode="open">`）。

**追问与易错点**：

- 追问：在 Vue/React 里直接用会不会有问题？答：属性传对象时框架可能把它字符串化，需要显式设置 DOM 属性或用 `ref` 赋值；事件要用 `addEventListener` 监听 `CustomEvent`。
- 陷阱：把 Shadow DOM 当成安全沙箱。它只是样式与结构的封装，脚本仍与页面同源同上下文，拿它做不可信代码隔离是不成立的。

### Q15 移动端一次"点击"到底触发了哪些事件？顺序是什么？

**考察点**：触摸事件体系的完整顺序与坐标来源，滚动穿透与 300ms 延迟的成因。

**参考答案**：

> **一句话结论**：一次手指点击依次触发 `touchstart` → `touchmove`（可能多次）→ `touchend`（若被系统打断则代之以 `touchcancel`，此时不会再补发鼠标事件与 click）→ `mousedown/mouseup/click`，在响应式视口下 300ms 延迟已基本不存在。

1. 坐标与触点：`touchstart` 时用 `e.touches`（屏幕上所有触点）、`e.changedTouches`（本次变化）、`e.targetTouches`（起点在本元素内的触点）；多指操作要按 `identifier` 追踪，`clientX/Y` 是相对视口的坐标。
2. 300ms 延迟的来源是"双击缩放等待判定"：页面设置了 `width=device-width` 的响应式视口后，Chrome 与 Safari 默认不再延迟；`touch-action: manipulation` 也能显式去掉双击缩放带来的等待。
3. `passive` 的意义：告诉浏览器监听器不会调用 `preventDefault`，从而不必等监听器返回就能开始滚动。Chrome 56 起把 `document`/`window` 上的 `touchstart`、`touchmove` 默认设为 `passive: true`，所以要在这些层级阻止滚动必须显式写 `{ passive: false }`。
4. 滚动穿透：弹窗打开时背景仍跟着滚动，根因是滚动发生在外层可滚动容器上。锁滚动的可靠做法是给滚动容器加 `overflow: hidden` 并记录、恢复 `scrollTop`（iOS 上直接对 `body` 加 `overflow: hidden` 常常无效），或加 `overscroll-behavior: contain` 阻止滚动链（Safari 16+ 支持），或 `touchmove` 里 `preventDefault`（需判断目标是否在弹窗内可滚区域）。
5. 点击透传：`touchstart` 里把遮罩隐藏后，稍后的 `click` 会落到下层元素上，需要在 `touchend` 里 `preventDefault()` 或临时用 `pointer-events: none` 规避。

**追问与易错点**：

- 追问：为什么写了 `{ passive: false }` 还是拦不住滚动？答：滚动一旦已经开始，`preventDefault` 就无效了，浏览器是在滚动前等监听器返回，所以必须在 `touchstart`/首个 `touchmove` 阶段就拦住。
- 陷阱：用 `click` 做按钮按下反馈，用户看到的高亮要等到手指抬起之后；应该监听 `touchstart` 立即给反馈样式，同时保留 `click` 做业务动作。

### Q16 软键盘弹出把底部输入框挡住了，怎么解决？`visualViewport` 是干什么的？

**考察点**：视口模型与键盘行为的差异，这是移动端 H5 最典型的"两个平台都不同"的问题。

**参考答案**：

> **一句话结论**：iOS 键盘弹出时不改变布局视口、只缩小视觉视口，Android 默认压缩布局视口，所以 `position: fixed` 的底部元素在 iOS 会被盖住、在 Android 会被顶起；可靠方案是用 visualViewport API 计算键盘高度再把元素顶上去。

1. 三个视口：布局视口（layout viewport，CSS 百分比与媒体查询的基准）、视觉视口（visual viewport，用户实际能看到的区域）、理想视口；键盘主要影响视觉视口（iOS）或同时压缩布局视口（Android）。
2. `visualViewport`（Chrome 61+、iOS Safari 13+）提供 `height`、`offsetTop`、`scale` 和 `resize`/`scroll` 事件；键盘高度约等于 `window.innerHeight - visualViewport.height`，用它把 fixed 元素位移到键盘上方。
3. 传统做法要么监听 `window.resize`（只在 Android 有效），要么 `focusin` 后靠定时器读高度（脆弱），已经被 `visualViewport` 取代。
4. 单位陷阱：`100vh` 在移动端按"地址栏收起时"的最大视口计算，所以比可见区域高，键盘弹出时也不变；应改用 `dvh`/`svh`（Chrome 108+、Safari 15.4+）或动态计算赋值。
5. iOS 的额外坑：聚焦时页面整体上移也不会在失焦后自动回滚，需要手动 `scrollIntoView({ block: 'center' })` 或 `window.scrollTo(0, 0)` 复位。

```js
const vv = window.visualViewport;
vv.addEventListener('resize', () => {
  const kb = window.innerHeight - vv.height - vv.offsetTop;
  bar.style.transform = kb > 80 ? `translateY(-${kb}px)` : '';
});
```

**追问与易错点**：

- 追问：为什么 `100vh` 在手机上比屏幕高？答：`vh` 基于最大视口，地址栏隐藏后才是完整高度，所以初始状态必然偏大；用 `dvh` 或 `svh` 可绕开。
- 陷阱：只在 iOS 上验证完就交付。Android 走的是 `resize` 路径，行为相反，必须两端真机都测。

### Q17 移动端线上问题怎么排查？vConsole、真机调试、抓包分别解决什么？

**考察点**：移动端调试工具箱的完整度，重点是能不能在无 Mac、无开发者工具的条件下定位问题。

**参考答案**：

> **一句话结论**：逻辑错误用 vConsole/eruda 看控制台，交互与渲染问题用真机远程调试，接口与性能问题用代理抓包，线上问题靠日志上报兜底。

1. 真机远程调试：Android 打开 USB 调试后用桌面 Chrome 的 `chrome://inspect` 调试页面甚至 App 内 WebView（需应用开启 WebView 调试）；iOS 用 Mac 上 Safari 的"开发"菜单调试，手机需在设置里开启 Web 检查器，Windows 环境没有这条路径。
2. 页面内控制台：vConsole、eruda 通过 CDN 或 npm 引入，能看到 Console、Network、元素、Storage；必须做开关（按 UA、按 URL 参数或仅测试域生效），不要全量下发，否则既是体积负担也是被劫持后的入口。
3. 抓包：手机 Wi-Fi 设代理指向 Charles/Fiddler/Whistle，安装并信任根证书；iOS 的 HTTPS 抓包还要在"证书信任设置"里手动开启信任；遇到证书固定（SSL Pinning）的应用会抓不到，App 内 WebView 的请求同样走代理，是排查 H5 接口问题的主力手段。
4. 其他手段：QQ 浏览器/微信 X5 内核可访问 `debugx5.qq.com` 做页面与网络调试；`alert` 与 `document.title` 刷屏是极端环境下的土办法；线上问题用 Sentry 或自建上报收集错误栈、设备与网络信息。
5. 局限：桌面 DevTools 的设备模拟能看 DPR 与触摸事件，但模拟不出真实键盘、滚动惯性、性能上限与热更新 WebView 的怪问题，关键路径必须真机回归。

**追问与易错点**：

- 追问：代理配好了却看不到 HTTPS 请求，可能是什么原因？答：根证书没被信任（iOS 需在证书信任设置里额外打开），或者应用做了证书校验/证书固定。
- 陷阱：把调试工具当成"上线也留着没事"。vConsole 这类工具暴露了页面内部信息与网络详情，生产环境必须白名单开启。

### Q18 微信内置浏览器有哪些坑？JSSDK 签名为什么老失败？

**考察点**：国内 H5 的必答题，考的是真实踩坑经验而不是背 API。

**参考答案**：

> **一句话结论**：微信内置浏览器（iOS 用 WKWebView，Android 历史上是 X5 内核）不能当标准浏览器用，坑集中在分享签名、页面缓存、路由切换后的重新配置和授权登录策略收紧。

1. 签名规则：`wx.config` 的 `nonceStr`、`timestamp`、`signature` 必须由服务端按**当前页面 URL**（去掉 `#` 及其后内容）计算，`jsApiList` 要写全，否则该接口一直提示无权限；所有调用要放在 `wx.ready` 回调里执行。
2. 最经典的坑：iOS 上单页应用（SPA）用 history 路由切换页面后，`wx.config` 仍按首次进入的 URL 取签名，导致签名校验失败。解法是每次路由变化后重新 `wx.config`（必要时重新拉签名），并考虑用 URL 参数规避。
3. 分享接口：现在用 `wx.updateAppMessageShareData` 与 `wx.updateTimelineShareData`，旧的 `onMenuShareAppMessage` 系列已废弃；分享出去没标题没图，先查签名 URL 与是否在 `ready` 之后调用。
4. 缓存与媒体：微信会强缓存页面尤其返回时不刷新，前端要给 HTML 加 `Cache-Control: no-cache` 或用版本参数兜底；iOS 微信音频/视频不允许自动播放，必须在用户手势之后调 `play()`。
5. 授权登录：`snsapi_base` 静默拿 openid，`snsapi_userinfo` 弹窗授权拿资料，`redirect_uri` 必须在公众号后台配置且是 https；2021 年后用户信息接口收紧，`getUserInfo` 返回匿名数据，之后官方进一步回收了 `getUserProfile`，获取头像昵称要走页面内让用户主动填写的能力。

**追问与易错点**：

- 追问：签名该用哪个 URL？答：用 `location.href.split('#')[0]`，且必须是完整的、与后台配置同域的地址；用它作为服务端签名串的参数。
- 陷阱：拿带 `#` 的完整 `location.href` 去签名，或把签名放在前端计算（AppSecret 绝不能出现在前端）。

### Q19 PWA 的安装条件是什么？Service Worker 的缓存策略怎么选？

**考察点**：PWA 三要素与 Service Worker 生命周期的准确理解，属于加分深挖题。

**参考答案**：

> **一句话结论**：PWA 等于 manifest 提供安装元数据、Service Worker 提供离线与拦截能力、且必须走 HTTPS；安装提示由浏览器在满足条件且用户有交互后才弹出。

1. manifest：`<link rel="manifest" href="/manifest.webmanifest">`，关键字段有 `name`/`short_name`、`icons`（含 192 与 512，建议再给一个 `purpose: "maskable"`）、`start_url`、`scope`、`display`（`standalone`/`fullscreen`/`minimal-ui`）、`theme_color`、`background_color`；`display_override` 与 `screenshots` 影响安装界面表现。
2. Chrome 的可安装性判定：manifest 字段齐备、注册了带 `fetch` 事件处理的 Service Worker、HTTPS（localhost 例外）、用户有一定交互，满足后浏览器才认为可安装；可用 `beforeinstallprompt` 事件延后自定义安装入口，用 `appinstalled` 监听安装完成。
3. Service Worker 生命周期：独立线程、无 DOM，流程是 install → waiting → activate → fetch；作用域受脚本路径限制，只在 HTTPS 或 localhost 下可用；常规做法是 install 阶段预缓存（precache）核心静态资源，activate 阶段清理旧版本缓存。
4. 缓存策略选择：Cache First 适合带哈希的静态资源；Network First 适合时效性强的接口；Stale-While-Revalidate 适合可容忍陈旧一屏的列表；Network Only 用于支付等绝不能缓存的请求。更新要配合 `self.skipWaiting()` 与 `clients.claim()`，同时处理"用户不刷新还是旧版本"的提示。

```js
const CACHE = 'app-v3';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/main.js', '/main.css'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) =>
    Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.destination === 'image') {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
```

5. 平台差异：iOS Safari 从 11.3 起支持 Service Worker 与"添加到主屏"，但 manifest 支持有限；iOS 对脚本可写存储有 7 天不使用即清理的策略（添加到主屏的 Web App 后来被豁免），做离线方案时要考虑这一层。

**追问与易错点**：

- 追问：发布新版本后用户还是旧页面，怎么排查？答：`sw.js` 自身可能被 HTTP 缓存且有更新检查周期，需要配合 `skipWaiting` + 页面刷新提示，并保证 `CACHE_NAME` 随版本变化。
- 陷阱：图省事把接口数据也设为 Cache First，用户永远看不到新数据；缓存策略必须按资源类型分别设计。

### Q20 移动端 H5 首屏优化，从标签和资源层面能做什么？

**考察点**：能否把首屏优化落到具体标签与加载顺序上，而不是空谈"压缩合并"。

**参考答案**：

> **一句话结论**：标签层的核心是"让关键资源最早被发现、让非关键资源别来抢"，剩下的收益靠减少首屏 JS 体积与执行时间。

1. 关键 CSS 内联进 `head`，其余样式异步化（`preload as="style"` 加 `onload` 切换 `rel`，或 `media` 技巧）；不要用 `@import`，它会造成串行请求、拖长关键路径。
2. 脚本用 `defer` 保序且不阻塞解析、放 `head` 里反而更早被发现；`async` 只用于完全独立的脚本；入口 chunk 用 `modulepreload` 提前获取。
3. 首屏图 `preload` 加 `fetchpriority="high"` 且禁止 `loading="lazy"`；字体 `preload` 加 `crossorigin` 并配 `font-display: swap` 或 `optional`，避免文字长时间不可见。
4. 缩短关键路径：首屏外的模块做动态 `import()` 分包、对字体域与接口域做 `preconnect`、开启 Brotli 压缩、上 HTTP/2 或 HTTP/3、控制 HTML 体积（别内联大段 base64）。
5. 度量与兜底：用 `web-vitals` 上报 LCP/CLS/INP，用 SSR 或骨架屏降低感知等待；移动端首屏 JS 的执行时间往往比下载时间更贵，减包比压缩更有效。

**追问与易错点**：

- 追问：`defer` 与 `async` 的区别？答：`defer` 在文档解析完成后按书写顺序、在 `DOMContentLoaded` 之前执行；`async` 下载完立刻执行、顺序不确定，适合统计脚本一类无依赖代码。
- 陷阱：给首屏图加懒加载、把关键 CSS 也异步化，结果 FOUC 与 CLS 一起变差；优化前先确认"哪个资源是关键"。

### Q21 iOS Safari 与 Android Chrome 的行为差异，你在项目里遇到过哪些？

**考察点**：有没有真正的双端经验，能不能把差异整理成可复用的清单。

**参考答案**：

> **一句话结论**：差异集中在视口与键盘、滚动行为、输入控件和特性支持上，做 H5 必须把 iOS 与 Android 当成两套目标环境，并且优先用特性检测而不是 UA 判断。

1. 视口与键盘：iOS 键盘弹出不改变布局视口、失焦不回滚；Android 默认 `resize` 布局视口（可用 viewport 的 `interactive-widget` 调整）；`100vh` 两端都失真，要用 `dvh` 配合 `visualViewport` 兜底。
2. 滚动行为：iOS 有惯性滚动与橡皮筋回弹，`overscroll-behavior` 到 Safari 16 才支持，对 `body` 直接 `overflow: hidden` 常锁不住滚动；Android 侧老 WebView 容易出现 `touchcancel` 频繁触发导致手势中断。
3. 交互细节：iOS 的 `click` 在 `touchend` 之后触发并伴随时序差异，长按会弹系统菜单（可用 `-webkit-touch-callout` 关闭），`:active` 生效需要额外处理；Android 有物理/虚拟返回键，需要配合 history 处理返回拦截。
4. 输入控件：`input type="date"` 在 iOS 是滚轮选择、Android 是日历弹窗；文件选择 `accept` 的实际行为不同，Android 更容易调起相机与文件管理器；`inputmode` 在部分老 iOS 上不生效，需叠加 `pattern`。
5. 权限与能力：音频自动播放、剪贴板、全屏 API、`navigator.vibrate`、Web Push（Safari 16.4 才支持且需添加到主屏）在两端限制差别很大，功能上线前必须特性检测加降级。

| 能力项 | iOS Safari | Android Chrome |
| --- | --- | --- |
| 键盘对布局视口 | 不改变，仅缩放视觉视口 | 默认压缩布局视口 |
| 滚动回弹 | 有 | 无 |
| 震动 API | 不支持 | 支持 |
| Web Push | 16.4+，需添加到主屏 | 原生支持 |
| 日期控件样式 | 滚轮 | 日历弹窗 |

**追问与易错点**：

- 追问：怎么优雅统一差异？答：功能判断用特性检测（如 `'visualViewport' in window`、`CSS.supports`），UA 只用于无法检测的兜底场景，绝不拿它决定业务逻辑。
- 陷阱：只在一种机型上测完就上线，Android 上才发现锁滚动失效、键盘把按钮顶飞，返工成本远高于早期双端联调。

### Q22 Hybrid 里 H5 怎么和原生通信？JSBridge 的原理是什么？

**考察点**：跨端通信的机制层理解，能否讲清"为什么需要回调 ID"这个关键设计。

**参考答案**：

> **一句话结论**：JSBridge 是 H5 与原生双向通信的约定——H5 调原生主要靠拦截自定义协议（URL Scheme）或注入对象，原生调 H5 靠执行 JS 或派发消息，返回值靠回调 ID 的映射表找回。

1. H5 调原生方式一，URL Scheme 拦截：`location.href = 'jsbridge://method?params=...'`，原生在 Android 的 `shouldOverrideUrlLoading` 或 iOS 的导航代理里识别并执行。优点是通用，缺点是参数长度受限、需要编码、拿不到同步返回值，iOS 上连续跳转还可能被节流，所以常改用创建并立即移除隐藏 `iframe` 的方式。
2. H5 调原生方式二，注入对象：Android 用 `addJavascriptInterface` 注入 `window.NativeBridge`（Android 4.2 以下存在反射执行任意方法的漏洞，现在必须只暴露白名单最小接口）；iOS 用 `window.webkit.messageHandlers.xxx.postMessage(...)`。两端在 JS 层统一封装成 `bridge.call(method, params)`。
3. 原生调 H5：Android 用 `evaluateJavascript("window.__bridge.invoke(id, data)")`，iOS 用 `evaluateJavaScript`，或者由原生派发一个约定好的事件/消息让 H5 监听。
4. 回调机制是关键：由于 Scheme 无法同步返回，每次调用生成唯一 `callbackId`，把成功与失败回调存进 map，原生执行完再把结果带回来匹配，封装成 Promise 后业务侧就能 `await bridge.call('scan')`。
5. 时序与安全：Bridge 注入可能晚于 H5 首次调用，需要"原生 ready 后再 flush 调用队列"（常见做法是原生主动通知或短轮询）；参数统一走 JSON 字符串并 `encodeURIComponent`；任何页面都能构造 Scheme，敏感能力必须校验来源并带一次性 token。

```js
function call(method, params) {
  return new Promise((resolve, reject) => {
    const id = `cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    callbacks[id] = { resolve, reject };
    const url = `jsbridge://${method}?callbackId=${id}&params=${encodeURIComponent(JSON.stringify(params))}`;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => iframe.remove(), 100);
  });
}
window.__bridge = {
  invoke(id, data) { callbacks[id] && callbacks[id].resolve(data); delete callbacks[id]; },
};
```

**追问与易错点**：

- 追问：为什么 iOS 上更推荐 `postMessage` 而不是 Scheme？答：WKWebView 对 `location.href` 的跳转有节流，且无用户手势时可能被忽略；`messageHandlers` 由 WebKit 原生支持，时序与参数传递都更可靠。
- 陷阱：把 JSBridge 当成同步调用设计接口。它天然异步，必须回调或 Promise 化，同步等待会直接把页面卡死。

## 本章小结

- `<!DOCTYPE html>` 是解析模式开关，漏写会进怪异模式，盒模型与行盒规则都会变。
- 语义化的收益方是爬虫、读屏软件与协作者，`div` 一把梭丢掉的是内容大纲、地标导航和原生交互能力。
- 移动端 `meta` 的标准起点是 `width=device-width, initial-scale=1`，加上 `viewport-fit=cover`，永远不要写 `user-scalable=no`。
- HTML 解析器按规范静默纠错（`p` 遇 `div` 自动闭合、`table` 自动补 `tbody`），能显示不代表结构正确。
- 表单优先用 `required`/`pattern`/`inputmode`/`autocomplete` 拿到零 JS 校验与正确的移动端键盘，服务端校验不可省。
- 图片要按"格式协商用 `picture`、宽度适配用 `srcset`+`sizes`、首屏不懒加载、屏外才 lazy、永远写宽高防 CLS"这套组合拳来做。
- 资源提示按紧急度排：`preload` > `modulepreload` > `preconnect` > `dns-prefetch` > `prefetch`，`preload` 必须写 `as`，字体要带 `crossorigin`。
- 移动端的两个高频雷区是点击事件与滚动（`passive`、300ms、滚动穿透）和软键盘（`visualViewport`、`dvh`、iOS 与 Android 行为相反），必须真机双端验证。

<!-- COUNT: 22 -->
