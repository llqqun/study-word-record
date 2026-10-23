---
title: "第 9 章 CSS 进阶、响应式与浏览器样式兼容"
---

## 第 9 章 CSS 进阶、响应式与浏览器样式兼容

### Q1 transition 和 animation 有什么区别？各自适合什么场景？

**考察点**：能不能说清「触发方式」和「关键帧数量」这两个本质区别，以及什么时候该用哪个。答到「transition 必须有状态变化才触发、animation 可以自动播多关键帧」就算过关。

**参考答案**：

> **一句话结论**：`transition` 是状态 A 到状态 B 的补间，必须属性值发生变化才触发；`animation` 配合 `@keyframes` 可以多关键帧、自动播放、循环和暂停。

1. 触发条件不同：`transition` 必须有前后两个状态（`:hover`、类名切换、JS 改样式）才生效，不会自己播放；`animation` 在规则应用时就按 `@keyframes` 播放，可以 `infinite` 循环、可以 `animation-play-state: paused` 暂停、可以 `animation-delay` 延迟、可以 `animation-direction: alternate` 往返。
2. 关键帧数量不同：`transition` 只能在起点和终点之间插值；`animation` 可以有任意多个百分比关键帧，实现弹跳、抖动、闪烁这类多段动画。
3. 控制能力不同：`animation` 还有 `fill-mode`（结束后是否保留终态）、`iteration-count`；`transition` 只能靠 `transitionend` 事件感知结束，也没有「反向播放」这种概念。
4. 性能写法一致：两者都只应优先动画 `transform` 和 `opacity`。浏览器对这两个属性的过渡与动画可以交给合成线程（Compositor Thread）执行，主线程被长任务卡住时动画仍然流畅；而用 JS 定时器逐帧改 `left` 会跑在主线程上，既掉帧又触发重排。
5. 选型结论：状态变化类交互（hover、展开收起、开关）用 `transition`；入场、循环、多段效果用 `animation`；需要可中断、可反向、与手势实时联动的复杂动画用 Web Animations API（`element.animate()`）。

**追问与易错点**：

- 追问：为什么 CSS 动画比 JS 定时器动画流畅？答：`transform` / `opacity` 的 CSS 动画可在合成线程执行，不受主线程 JS 阻塞影响；而 `setInterval` 改 `left` 每帧都要走样式计算与布局。
- 陷阱：说 `transition` 也能循环播放，或者认为 `transition` 可以脱离状态变化自动执行。
- 陷阱：想让 `display: none` 到 `display: block` 做过渡。`display` 是离散属性、无法插值，要改用 `opacity` + `visibility` 过渡；Chrome 117 起也可用 `transition-behavior: allow-discrete` 配合 `@starting-style`。

### Q2 transform 有哪些常用函数？为什么改 transform 不影响布局？

**考察点**：考 transform 的坐标系与两个副作用——不移出文档流、不触发重排，但会创建包含块和层叠上下文。答到「变换发生在绘制/合成阶段、原占位仍保留」算过关。

**参考答案**：

> **一句话结论**：`transform` 是对元素绘制结果做几何变换，不参与布局计算，所以不改文档流、不触发重排重绘；但它会创建包含块与层叠上下文。

1. 常用二维函数：`translate(x, y)` / `translateX` / `translateY`、`scale(sx, sy)`、`rotate(deg)`、`skew(deg)`、矩阵写法 `matrix(a,b,c,d,e,f)`。三维函数：`translate3d`、`rotateX/Y/Z`、`scale3d`、`matrix3d`、`perspective()`；要让子元素的 3D 效果可见，父元素通常要设 `perspective`。
2. 百分比参照的是元素自身尺寸：`translateX(-50%)` 表示自身宽度的 -50%，这与 `left: 50%`（参照包含块宽度）完全不同，所以「绝对定位 + `translate(-50%, -50%)`」能稳定居中。
3. 不影响布局：变换发生在渲染流水线的绘制与合成阶段，其它元素的位置不会重算，元素原本占据的空间仍然保留（效果上像相对定位，但没有脱离文档流）。这正是动画首选 `transform` 的原因。
4. 两个必须记住的副作用：一是有非 `none` 的 `transform` 的元素会成为后代 `position: fixed` / `absolute` 的包含块，让 fixed 元素不再相对视口定位（第 24 题展开）；二是会创建层叠上下文，`z-index` 的比较范围随之改变。
5. 顺序敏感且绕点旋转要看 `transform-origin`：`translateX(50px) rotate(45deg)` 与 `rotate(45deg) translateX(50px)` 结果不同，函数按书写顺序依次做矩阵乘法；`transform-origin` 默认是 `50% 50%`（元素中心），想绕左上角旋转必须显式写 `0 0`。

**追问与易错点**：

- 追问：`scale()` 之后文字为什么发虚？答：缩放后元素常落在非整数像素上，合成层纹理需要插值渲染导致模糊；避免非整数倍缩放，或对文字层单独用像素对齐的方式处理。
- 陷阱：说 `transform` 会让元素脱离文档流。它不移除占位，只有 `float` 和绝对/固定定位那种才是真的脱离。
- 陷阱：把 `transform` 理解成「完全不触发重绘」。首次应用变换仍需要重新绘制一次，省下来的是后续每一帧的布局与绘制成本。

### Q3 为什么动画优先改 transform 和 opacity？哪些属性最贵？

**考察点**：能不能把属性按渲染流水线的代价分级，并给出可落地的优化手段（FLIP）。答到「transform/opacity 只走合成、几何属性会重排」算过关。

**参考答案**：

> **一句话结论**：动画改 `transform` / `opacity` 只走合成阶段，改 `width` / `top` / `margin` 会触发重排，改 `background` / `box-shadow` 会触发重绘，越靠后的阶段越便宜。

1. 渲染流水线是「样式计算 → 布局（Layout，即重排）→ 绘制（Paint，即重绘）→ 合成（Composite）」，改不同属性会从不同阶段开始重跑：几何属性（`width`、`height`、`top` / `left`、`margin`、`padding`、`font-size`）触发重排，最贵；绘制属性（`color`、`background`、`border-radius`、`box-shadow`、`text-shadow`）触发重绘，居中；`transform` 与 `opacity` 只触发合成，最便宜。
2. 预算很紧：60Hz 屏幕每帧只有 16.7ms（120Hz 是 8.3ms），这一帧里还要跑 JS、样式计算与绘制，所以一旦动画属性触发重排，几十个元素就会集体掉帧。
3. 常见改写手段：`left` / `top` 动画改成 `transform: translate()`；`width` / `height` 动画改成 `transform: scale()`（注意会连同子元素内容一起拉伸）；`box-shadow` 变化改成用伪元素叠一层只过渡 `opacity`。
4. 位置确实要变且必须重排时用 FLIP：先记录首末位置，再用 `transform` 反向偏移并动画归零，把布局成本压缩到一次。

```js
// FLIP：First - Last - Invert - Play
const first = el.getBoundingClientRect();
el.classList.add('moved');            // 触发一次布局
const last = el.getBoundingClientRect();
const dx = first.left - last.left, dy = first.top - last.top;
el.animate([{ transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'none' }], 300);
```

5. 补充：`filter: blur()`、`backdrop-filter` 虽然可能被提升到合成层，但每帧的模糊计算量很大，低端机上远贵于 `opacity`；`opacity` 小于 1 会创建层叠上下文，也算一种副作用。

**追问与易错点**：

- 追问：为什么 `transform` 动画在主线程卡顿时还能跑？答：这类动画可由合成线程独立推进，不依赖主线程每帧参与；但 `transition` 的首次触发仍需要主线程完成样式计算。
- 陷阱：认为加 `will-change: transform` 就万事大吉。它只是提前提升图层，滥用会造成层爆炸与显存飙升，见下一题。
- 陷阱：给列表每一项都写 `transition: all .3s`。`all` 会把未来的布局属性也纳入过渡、难以排查，应当显式列出要过渡的属性。

### Q4 合成层和 will-change 怎么正确使用？过度使用有什么副作用？

**考察点**：深挖题，考是否知道 `will-change` 是「一次性提示」而不是「性能开关」，以及层爆炸的代价。答到「用前加、用完撤，全局滥用会层爆炸」算过关。

**参考答案**：

> **一句话结论**：`will-change` 是给浏览器的一次性提示，让元素提前提升为合成层；正确用法是动画开始前加、结束就移除，全局滥用会造成层爆炸、显存暴涨和文字模糊。

1. 合成层（Compositing Layer）是浏览器为加速而把元素单独生成的纹理（texture），由 GPU 独立合成。常见的被动提升原因有：三维变换（`translate3d`、`translateZ(0)`）、`will-change: transform/opacity`、`<video>` / `<canvas>`、`position: fixed`、`filter`、`backdrop-filter` 等。
2. `will-change` 的取值：`auto`、`scroll-position`（提示即将滚动，浏览器可优化滚动区域内容）、`contents`（提示内容将变化）、以及具体属性名 `transform`、`opacity`。写 `will-change: transform` 的语义是「我马上要动 transform」。
3. 正确用法：只在真正要动的元素上、在动画开始之前声明，动画结束后用 `transitionend` / `animationend` 移除，让浏览器回收图层与显存。

```css
.card { transition: transform .2s; }
.card:hover { will-change: transform; transform: translateY(-4px); }
/* 更稳妥：由 JS 在动画真正开始前加类、结束后移除 */
```

4. 副作用清单：每个合成层都要独立占用显存与内存，层数一多就是「层爆炸（layer explosion）」，低端机会掉帧甚至崩溃；大尺寸元素提升后显存占用明显上升；文本落在非整数像素的层上会渲染模糊；`will-change` 还会创建包含块与层叠上下文，可能让后代 `position: fixed` 失效。
5. 结论：MDN 把 `will-change` 定义为「最后手段」。优先直接给 `transform` / `opacity` 做动画，让浏览器自行优化；不要写 `* { will-change: transform }`，也不要为了「看起来更快」给整个长列表每一项都加。

**追问与易错点**：

- 追问：`translateZ(0)` 和 `will-change: transform` 有什么区别？答：前者是「已经提升」，图层长期存在；后者是「即将变化」的提示，语义更准确，浏览器可以自行决定是否提升、何时回收。
- 陷阱：把 `will-change` 当开关加到全局或加到滚动容器上。它不会让普通元素变快，只会增加合成与内存开销。
- 陷阱：动画结束不移除。图层长期驻留，长列表滚动时显存与帧率都会恶化。

### Q5 CSS 自定义属性是什么？和 Sass 变量有什么区别？

**考察点**：考「运行时」与「编译期」这个本质区别，以及自定义属性的继承、层叠与 fallback 写法。

**参考答案**：

> **一句话结论**：CSS 自定义属性（CSS Custom Properties）是浏览器运行时解析、可继承、参与层叠的真实属性；Sass 变量在编译期就被文本替换掉，运行时并不存在。

1. 声明与使用：以 `--` 开头声明，用 `var()` 读取，第二个参数是回退值。

```css
:root { --main: #07c; }
.btn { color: var(--main, #333); }
```

2. 运行时可变：JS 可以用 `el.style.setProperty('--main', '#f00')` 改值，改一个变量就影响整棵子树；也可以在不同选择器、媒体查询里覆盖它。这是 Sass 变量做不到的。
3. Sass / Less 变量是编译期常量：`$main: #07c;` 编译时被直接替换成字面量，产物里没有变量，无法运行时切换，也无法跨媒体查询动态取值；作用域是按块划分的词法作用域，不具备 CSS 的继承语义。
4. 能力差异：Sass 变量能参与编译期运算（`$a + 4px`）、函数与 `@if` / `@each` 等控制指令；自定义属性本质是「值的占位符」，参与算术必须放进 `calc()`，而且不能用在媒体查询条件、选择器或属性名里。
5. 兼容与增强：自定义属性 IE11 完全不支持，做 IE 兼容的项目只能退回 Sass 变量加多套类名；要让自定义属性具备类型、初始值并可参与动画，可以用 `@property` 注册（属 Houdini 规范，Chrome 85+、Safari 16.4+、Firefox 128+ 起支持）。

**追问与易错点**：

- 追问：自定义属性能存非颜色值吗？答：几乎能存任意 token，包括长度、完整阴影、甚至整段 `1px solid red`；但要在 JS 里对它做字符串运算不行，算数只能交给 `calc()`。
- 陷阱：说「CSS 变量和 Sass 变量一样能做编译期运算」。`calc(var(--a) * 2)` 可以，直接写 `var(--a) * 2` 不行。
- 陷阱：忽略 fallback。变量未定义时整条声明在计算值阶段失效，`var(--x, 默认值)` 是必要的防御。

### Q6 怎么用 CSS 变量实现主题切换？

**考察点**：考运行时主题方案是否完整——变量分层、切换方式、防闪白、与系统深色模式的优先关系。

**参考答案**：

> **一句话结论**：把颜色抽成 `:root` 上的语义变量，组件只用 `var()`，切换主题时只改根元素的类名或属性，再用存储加内联脚本避免首屏闪白。

1. 变量要分层命名：定义 `--color-bg`、`--color-text`、`--color-primary` 这类语义变量，不要用 `--red-500` 这种原始色命名，否则换主题要改遍所有组件。

```css
:root { --color-bg: #fff; --color-text: #222; }
:root[data-theme='dark'] { --color-bg: #111; --color-text: #eee; }
body { background: var(--color-bg); color: var(--color-text); }
```

2. 切换方式：`document.documentElement.dataset.theme = 'dark'`，只动一个节点，比给每个组件加类名好维护；也可以把变量挂在某个局部容器上实现局部主题（例如侧边栏单独深色），因为自定义属性会继承。
3. 状态设计：推荐三态 `light / dark / auto`，只有 `auto` 时才交给 `@media (prefers-color-scheme: dark)`；用户手动选择必须优先于系统偏好，靠声明顺序与选择器权重保证 `:root[data-theme]` 覆盖媒体查询里的 `:root`。
4. 防闪白（FOUC）：主题要持久化到 `localStorage`，并在 `<head>` 里同步执行一段内联脚本，在首屏渲染前就把 `data-theme` 写到 `html` 上，否则会先渲染浅色再跳成深色。
5. 两个细节：给 `:root` 设 `color-scheme`（如 `light dark`），让滚动条、表单控件等浏览器原生 UI 跟随主题；如果给颜色加了 `transition`，首次加载也会跟着动画，可临时挂一个 `no-transition` 类在执行时禁用过渡。

**追问与易错点**：

- 追问：为什么不直接把主题色用 props 传给每个组件？答：改动面太大、样式与逻辑耦合；CSS 变量只改根节点一处，天然复用 CSS 侧的媒体查询与状态覆盖能力。
- 陷阱：只做 `@media (prefers-color-scheme: dark)` 而没有手动开关，用户选择无法覆盖系统偏好。
- 陷阱：不做防闪白。这是主题方案最常见的体验缺陷，尤其在 SPA 里首屏白闪很明显。

### Q7 prefers-color-scheme 深色模式怎么实现？要注意什么？

**考察点**：媒体特性本身很简单，真正考的是配套动作——`color-scheme`、图片适配、与手动开关的优先级。

**参考答案**：

> **一句话结论**：用 `@media (prefers-color-scheme: dark)` 覆盖变量即可实现跟随系统的深色模式，但必须同时声明 `color-scheme`（或对应 meta），否则滚动条与表单控件不会跟着变。

1. 基本用法：该媒体特性取值 `light`、`dark`、`no-preference`。把颜色写成变量，在深色分支只覆盖变量，组件样式完全不用动。

```css
@media (prefers-color-scheme: dark) {
  :root { --color-bg: #121212; --color-text: #e6e6e6; }
}
```

2. 必配 `color-scheme`：在 `:root` 写 `color-scheme: light dark`，或在 HTML 头部加 `<meta name="color-scheme" content="light dark">`。它告诉浏览器页面支持哪些配色方案，浏览器才会把滚动条、`input`、`select` 等原生控件与默认画布背景渲染成深色，否则会出现「页面黑了、输入框还是白的」。
3. 图片与媒体：深色下不合适的插图用 `<picture>` + `<source media="(prefers-color-scheme: dark)" srcset="dark.png">` 切换；纯色图标用 `currentColor` 跟随文字色即可。
4. 与手动开关的优先级：该特性只表达系统偏好。推荐「跟随系统 / 强制浅色 / 强制深色」三态，只有跟随系统时才走媒体查询，手动选择用 `:root[data-theme]` 覆盖，并把属性选择器写在媒体查询之后。
5. 注意：不支持该特性的浏览器按 `no-preference`（浅色）处理，所以浅色必须是默认值；不要用 JS 读一次 `matchMedia('(prefers-color-scheme: dark)').matches` 就不再管，系统主题变化会触发 `change` 事件，需要监听。

**追问与易错点**：

- 追问：`color-scheme` 会改变 `prefers-color-scheme` 的取值吗？答：不会。它只影响浏览器对页面配色能力的理解与原生 UI 的渲染，不改变媒体特性的查询结果。
- 陷阱：以为 `prefers-color-scheme` 能读到用户的手动选择。它读的是操作系统外观设置，用户可能设置的是「自动切换」。
- 陷阱：深色模式只反转背景色和文字色。图片、阴影、边框、图表配色都需要重新调整，不能机械反色。

### Q8 prefers-reduced-motion 是什么？怎么做无障碍动效降级？

**考察点**：是否知道这是无障碍需求，以及降级要用「极短时长」而不是 `animation: none`。

**参考答案**：

> **一句话结论**：`prefers-reduced-motion: reduce` 表示用户在系统里开启了「减少动态效果」，此时应减弱位移、缩放、视差类动画，但要用极短时长代替 `animation: none`，以免破坏依赖动画事件的逻辑。

1. 触发来源：iOS 的「减弱动态效果」、Android 的「移除动画」、macOS / Windows 的「减少动态效果」。开启者常见于前庭功能障碍、偏头痛、晕动症人群。
2. 标准降级写法：把时长压到接近 0，视觉上静止但事件照常派发。

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

3. 为什么不用 `animation: none`：这样 `animationend` / `transitionend` 不再触发，靠事件推进的轮播、手写的「动画结束后执行」逻辑会直接卡死；0.01ms 既视觉静止又保证事件正常派发。
4. 该保留什么：加载指示器、进度条、焦点样式这类表达状态的动效保留；该减弱的是大幅位移、视差滚动、自动轮播、缩放弹跳与闪烁。
5. JS 侧：用 `window.matchMedia('(prefers-reduced-motion: reduce)')` 的 `matches` 决定是否启用平滑滚动、是否调用第三方动画库，并监听 `change` 动态响应；该媒体特性另一个取值是 `no-preference`。

**追问与易错点**：

- 追问：这和整体无障碍是什么关系？答：动效偏好只是一个维度，不能替代对比度、焦点可见、语义化标签这些更基础的无障碍要求。
- 陷阱：把「减动效」做成「全站无动画」。全站静止会让状态变化难以察觉，正确做法是保留低幅度、无闪烁的反馈。
- 陷阱：只处理 CSS，忘了 JS 动画（`element.animate()`、平滑滚动、第三方动画库）也要读同一个媒体查询。

### Q9 Sass / Less 预处理器解决了什么问题？现在怎么选？

**考察点**：考预处理器真正的价值（可维护性）以及 Dart Sass / Less 的现状与选型判断。答到「新项目用 Dart Sass，存量 AntD 4 项目用 Less」算过关。

**参考答案**：

> **一句话结论**：预处理器解决的是原生 CSS 缺少变量、嵌套、复用与模块化带来的工程问题；新项目选 Dart Sass，维护 Ant Design 4 的存量项目继续用 Less。

1. 核心能力：变量、嵌套、`@mixin` / `@include` 复用、`@extend` 继承、函数与运算、`@if` / `@each` / `@for` 控制指令、文件拆分与合并。
2. Sass 现状：官方实现是 Dart Sass（`sass` 包）。`@import` 已废弃，改用 `@use` / `@forward`，避免重复输出与全局命名污染；`node-sass` 依赖 Node 原生绑定、版本升级容易编译失败，已经废弃，不要再选。`.scss` 语法兼容原生 CSS，`.sass` 缩进语法基本不用。
3. Less 现状：语法更贴近 CSS（用 `@main` 变量、`&` 嵌套），JavaScript 实现、安装即用，但函数与生态弱于 Sass，社区活跃度下降；Ant Design 4 及之前用 Less，Ant Design 5 已改为 CSS-in-JS。
4. 选型判断：新项目或组件库优先 Dart Sass；维护老的 AntD 4 项目、团队更熟 Less 就用 Less；两者能覆盖九成场景，但不要在同一个项目里混用两套预处理器（`@main` 与 Sass 的 `$main` 会让新人读错）。
5. 两条边界必须说明：一是预处理器变量是编译期常量，做运行时主题要用 CSS 自定义属性（见第 5 题）；二是嵌套不要超过三层，否则选择器权重虚高、体积膨胀、样式难以覆盖；原生 CSS 现在也支持嵌套（Chrome 112+、Safari 16.5+），只为了少写类名不值得引入预处理器。

**追问与易错点**：

- 追问：`@mixin` 和 `@extend` 怎么选？答：`@mixin` 复制声明、不合并选择器，灵活且无副作用；`@extend` 会合并选择器，跨文件时容易产生意料之外的选择器组合，除工具类外少用。
- 陷阱：说 Sass 是「CSS 框架」。它是预处理器 / 编译工具，产物仍然是 CSS。
- 陷阱：把 Vue 的 `:deep()`、`::v-deep` 当成 Sass 语法，它们是单文件组件的作用域选择器穿透写法。

### Q10 CSS Modules 是什么？它怎么解决样式污染？

**考察点**：考「编译期把类名替换成唯一哈希」这一原理，以及它与 Vue scoped 的区别。

**参考答案**：

> **一句话结论**：CSS Modules 在构建时把类名替换成唯一哈希名，并导出「原名到哈希」的映射对象，模板通过映射对象引用，从而在编译期彻底避免命名冲突，运行时零开销。

1. 写法：文件名用 `.module.css` 后缀（Vue / React 生态的约定），`import styles from './card.module.css'`，模板里写 `styles.title`。

```css
/* card.module.css：编译后 .title 会变成类似 card__title--a1b2c */
.title { font-weight: 600; }
```

2. 原理：由构建工具（Webpack 的 `css-loader` 开 `modules`、Vite 内置支持）解析 CSS 的 AST，把所有局部类名替换为带哈希的唯一名（默认形如 `[hash:base64]`，可用 `localIdentName` 配置成可读格式），同时生成一个 JS 对象供代码引用。
3. 局部与全局：默认所有类名都是局部的，`:global(.ant-btn)` 可以让某个类名保持原样（用于覆盖第三方组件库），`:local(...)` 显式声明局部；`:export` 还能把样式值导出给 JS 使用。
4. 与 Vue scoped 的区别：`<style scoped>` 是另一套机制——编译时给元素加 `data-v-xxxxxx` 属性，把选择器改写成 `.title[data-v-xxxxxx]`，类名本身不变；CSS Modules 改的是类名。因此 scoped 编译出的权重更高，且对子组件根节点有特殊处理。
5. 局限：类名被哈希后在浏览器里不好定位，开发环境建议把 `localIdentName` 配成 `[path][name]__[local]` 保留可读性；动态拼接类名要靠 `clsx` / `classnames`；样式值无法直接被 JS 读取来做逻辑判断，需要 `:export` 或 CSS 变量。

**追问与易错点**：

- 追问：CSS Modules 和 CSS-in-JS 的核心差别？答：前者在编译期生成静态 CSS 文件、运行时零成本；后者常在运行时生成并插入样式，见第 11 题。
- 陷阱：以为 CSS Modules 能挡住第三方组件或全局样式对自己组件的污染。它只管自己文件里的类名，reset 与 `body` 这类全局规则照样生效。
- 陷阱：把 `scoped` 和 `module` 当同义词。在 Vue 里它们是 `<style scoped>` 与 `<style module>` 两种不同机制。

### Q11 CSS-in-JS 的优缺点是什么？和 CSS Modules 怎么选？

**考察点**：考 CSS-in-JS 的运行时成本这一核心代价，以及运行时方案与零运行时方案的分野。

**参考答案**：

> **一句话结论**：CSS-in-JS 用运行时开销换取「样式与组件同文件、可用 JS 动态生成样式」的开发体验；新项目优先零运行时方案，性能敏感场景避免运行时方案。

1. 优点：真正的局部作用域（不需要命名规范）、样式与组件写在一起、可用 props / 主题 / JS 变量动态生成样式、TypeScript 有类型提示、组件删除时样式一并删除不会留死代码。
2. 缺点：运行时方案（styled-components、emotion）在渲染时序列化样式并插入 `<style>`，带来渲染与内存开销，在 React 并发渲染下更明显；还有包体积增大、SSR 需要额外收集样式（`ServerStyleSheet`）、生成类名不便调试、样式插入时序需要处理（React 18 起用 `useInsertionEffect`）。
3. 方案分野：运行时方案（styled-components、emotion）与零运行时 / 编译时方案（vanilla-extract、linaria、StyleX、Panda CSS）。后者把样式在构建期抽出成静态 CSS 文件，保留了「样式与组件同文件」的写法，同时没有运行时插入成本。
4. 与 CSS Modules 的取舍：只做静态样式、团队以 CSS 为主、要极致性能，选 CSS Modules；需要按主题 / props 大量动态出样式、做组件库与设计系统，选 CSS-in-JS，并优先挑零运行时实现。

| 维度 | CSS Modules | 运行时 CSS-in-JS | 零运行时 CSS-in-JS |
| --- | --- | --- | --- |
| 生成时机 | 构建期 | 运行期 | 构建期 |
| 运行时开销 | 无 | 有 | 无 |
| 动态样式 | 需 CSS 变量配合 | 最灵活 | 支持但受编译约束 |
| 调试体验 | 可配可读类名 | 生成类名 | 生成类名 |

5. 生态事实：Ant Design 5 从 Less 改为 CSS-in-JS（`@ant-design/cssinjs`），正是为了支持运行时动态主题与按需加载——这属于组件库场景，普通业务项目不必照搬。

**追问与易错点**：

- 追问：零运行时方案为什么能做到「零运行时」？答：它在构建期扫描源码，把样式引用编译成静态类名与 CSS 文件，运行时只负责把类名拼到元素上。
- 陷阱：在长列表或高频重渲染组件里使用运行时 CSS-in-JS，每次渲染都可能重新序列化样式，造成明显卡顿。
- 陷阱：认为 CSS-in-JS 一定没有样式冲突。全局选择器（如 `body`、`*`）在 CSS-in-JS 里同样会污染全局。

### Q12 原子化 CSS（Tailwind）有什么优缺点？项目里怎么取舍？

**考察点**：考是否理解原子化 CSS 真正的收益（样式体积与设计约束）与真实代价（可读性、动态类名的坑）。

**参考答案**：

> **一句话结论**：原子化 CSS 用「类名冗长」换「不用起名、设计系统受约束、样式体积不随项目增长」；它适合快速迭代的业务页面，复杂组件库更适合 CSS Modules 或 CSS-in-JS。

1. 优点：不用为类名发愁（BEM 最大的成本在这里）；间距、颜色、字号都由配置约束，天然统一设计系统；生产构建只输出用到的类，样式体积不会随业务代码线性膨胀；写样式不用切换文件，改样式是就地改类名；公共样式可用 `@apply` 抽出来。
2. 缺点：类名冗长、HTML 明显膨胀；任意值写法（如 `w-[123px]`）会破坏设计约束，需要团队规范约束；动态拼接类名（如 `` `text-${color}-500` ``）在静态扫描方案下识别不到，必须用 safelist 或改成内联 `style`；抽象只能靠抽 JS 组件，缺少「一个类名改全局」的集中式入口。
3. 版本差异要讲清：Tailwind v4 改为 CSS-first 配置，用 `@import "tailwindcss"` 与 `@theme` 定义设计变量，并内置 Vite 插件；v3 及之前是 `tailwind.config.js` + `content` 扫描。
4. 取舍判断：营销页、活动页、快速迭代的小团队、需要严格控制 CSS 体积的项目适合原子化；设计系统复杂、样式需要被多个项目复用的组件库，用 CSS Modules 或零运行时 CSS-in-JS 更稳。
5. 最常见的反模式是「全站只堆原子类、不抽组件」——改一个按钮的样式要在几十个文件里全局搜索替换，这时原子化的收益已经被抵消掉了。

**追问与易错点**：

- 追问：为什么原子化 CSS 的体积不随项目增长？答：类的集合来自固定的工具类库，业务只决定「用到哪些」，所以样式体积趋近于常量，增长的是 HTML。
- 陷阱：用字符串拼接生成类名并指望它生效（`` `bg-${color}-100` ``）。静态扫描看不到完整类名，样式会被当作未使用而删掉。
- 陷阱：把原子化 CSS 等同于「不需要 CSS 架构」。层级、复用与设计 token 仍然要设计，只是换了表达方式。

### Q13 PostCSS 是什么？Autoprefixer 的原理是什么？browserslist 怎么配？

**考察点**：考「PostCSS 是转换框架而不是预处理器」这个定位，以及 Autoprefixer 与 browserslist 的因果链。

**参考答案**：

> **一句话结论**：PostCSS 是把 CSS 解析成 AST 再由插件改写的转换框架，本身几乎什么都不做；Autoprefixer 读 browserslist 得到目标浏览器，再查 caniuse 数据只补必要的前缀。

1. PostCSS 的定位：不是预处理器，而是 CSS 的「编译器平台」。它把 CSS 解析成 AST（`Root`、`Rule`、`Declaration` 等节点），插件遍历并修改节点后重新生成 CSS。常见插件有 autoprefixer、postcss-preset-env、cssnano、postcss-px-to-viewport，Tailwind 本身也是一个 PostCSS 插件。
2. Autoprefixer 的原理分三步：读取 `browserslist` 配置得到目标浏览器集合，对照内置的 `caniuse-lite` 数据判断每条声明在哪些目标浏览器需要前缀，然后只添加必要的前缀。它不管 JS 层面的 polyfill。
3. 前缀不是万能的：现在 flex、grid、transform 基本不再需要厂商前缀，但 `-webkit-line-clamp`、`-webkit-overflow-scrolling`、`-webkit-tap-highlight-color`、`-webkit-background-clip: text` 这类厂商私有属性必须手写。要区分「标准属性由工具自动加前缀」和「非标准私有属性手写」，这是这题最容易被追问的点。
4. browserslist 的配置位置：`package.json` 的 `browserslist` 字段或 `.browserslistrc` 文件。常用写法有 `["defaults", "not IE 11"]`、`["> 0.5%", "last 2 versions", "not dead"]`，也可以写成对象按 `BROWSERSLIST_ENV` / `NODE_ENV` 区分开发与生产目标。
5. 它是一份共享配置：`@babel/preset-env`、`core-js`、autoprefixer、postcss-preset-env、eslint-plugin-compat 都读同一份，所以不要在 Babel 和 PostCSS 里各配一套目标浏览器；依赖的 `caniuse-lite` 数据要定期更新（`npx update-browserslist-db@latest`），否则新浏览器会被漏掉。

**追问与易错点**：

- 追问：Autoprefixer 能自动去掉没用的 CSS 吗？答：不能，去重与压缩是 cssnano、PurgeCSS 之类插件的职责，Autoprefixer 只加前缀。
- 陷阱：以为项目里出现 `-webkit-` 就说明配了 Autoprefixer，或者以为配了它就不需要手写私有属性前缀。
- 陷阱：browserslist 写得过于宽泛（如 `last 5 versions` 覆盖到早已退役的浏览器），会让产物无谓膨胀。

### Q14 @supports 怎么用？和条件注释、星号 hack 这些老办法比好在哪？

**考察点**：考特性检测的写法与思路，以及为什么它比「针对浏览器的 hack」正确。

**参考答案**：

> **一句话结论**：`@supports` 做的是特性检测而不是浏览器嗅探，写法是 `@supports (display: grid) { ... }`；它比条件注释、星号 hack 这类钻解析空子的手段语义正确、可维护、可清理。

1. 基本写法：`@supports (display: grid) { }`，支持 `and` / `or` / `not` 与括号嵌套；还能用 `@supports selector(:has(a))` 检测选择器支持、用 `font-format()` / `font-tech()` 检测字体格式能力；可以与 `@media` 组合使用。JS 侧的等价物是 `CSS.supports('display', 'grid')`。

```css
.tip { float: left; }                      /* 基础样式，人人可用 */
@supports (display: grid) { .tip { float: none; } }  /* 增强 */
```

2. 老办法的清单与代价：IE 条件注释（`<!--[if IE]>`，IE10 起不再支持）、星号 hack `*width`（IE7）、下划线 hack `_width`（IE6）、`\9`（IE8/9/10）、用 `!important` 硬覆盖。它们的共性是语法不合规范、容易被压缩器或 CSS 解析器破坏、不可维护，而且只能描述「老浏览器」，无法描述想要的新特性。
3. 核心优势：特性检测（feature detection）取代 UA 嗅探（UA sniffing），语义正确、向前兼容——未来浏览器只要支持该特性就自动生效，不需要维护一份浏览器黑名单。
4. 致命坑：IE 全系不支持 `@supports`，整块规则会被直接忽略。所以基础样式必须写在 `@supports` 之外，`@supports` 只用来做增强，降级逻辑用 `@supports not (...)`。
5. 判断标准：当你要写 `@supports not (...)` 时，先问「这个属性是不是必须有」，如果基础布局依赖它，说明方案本身需要重新设计，而不是靠检测兜底。

**追问与易错点**：

- 追问：`@supports (position: sticky)` 为什么在旧版 Safari 上会误判？答：`@supports` 只判断「能不能解析并识别」，早期实现存在识别但行为不完整的边缘情况，涉及行为差异时还要配合运行时实测。
- 陷阱：把增强样式写在 `@supports` 里却把基础样式也写进去，导致不支持的浏览器整块丢失、元素完全没样式。
- 陷阱：用 `@supports (-webkit-appearance: none)` 之类的私有属性推断浏览器，某个浏览器可能两种情况都成立，判断结果不可靠；判 iOS 更可靠的写法见第 26 题。

### Q15 @layer 是什么？怎么用它管理样式优先级？

**考察点**：考对级联层规则的理解，尤其是「层顺序决定优先级」和「未分层声明优先于分层」这两个反直觉点。

**参考答案**：

> **一句话结论**：`@layer` 让优先级由层的声明顺序决定而不是选择器权重，先声明的层更低；未分层的普通声明优先级高于所有分层声明，而 `!important` 会把层顺序反转。

1. 基本用法：先用一条语句声明层的顺序（可以是空的），再往里写规则。

```css
@layer reset, base, components, utilities;
@layer base { h1 { font-size: 2rem; } }
@layer utilities { .text-sm { font-size: .875rem; } }
```

2. 优先级规则：层与层之间只比声明顺序，后声明的层赢；层内部仍然按选择器权重比较；没有写进任何层的普通声明优先级高于所有分层声明。`!important` 会反转层顺序——分层中的 important 声明优先于未分层的 important 声明，这一点和普通声明正好相反。
3. 典型价值：把 reset / normalize 放最底层、第三方组件库放中间、业务样式放高层，从此不必靠 `!important` 或堆选择器权重去覆盖组件库，覆盖关系写在层的顺序里，一眼可见。
4. 其它写法：`@import url('./reset.css') layer(reset);` 可以在引入时就指定层；层名支持嵌套（如 `@layer a.b { }`）。
5. 兼容与坑：Chrome 99+、Safari 15.4+、Firefox 97+ 支持；不支持的浏览器会丢弃整块样式，所以业务的基础样式不能只写在 `@layer` 里——这一点和 `@supports` 的坑完全一样。

**追问与易错点**：

- 追问：`@layer` 能提高某个选择器的权重吗？答：不能，它只调整层与层之间的先后，层内比较规则不变，所以不要指望用它解决「单个类名压不过 ID」的问题。
- 陷阱：忘记未分层的普通声明优先级最高。把 reset 写进 `@layer` 却把业务样式留在层外时，业务样式反而更难被覆盖。
- 陷阱：只在 `@layer` 里写全部样式，遇到旧浏览器整站样式丢失。

### Q16 :is、:where、:has 分别解决什么问题？

**考察点**：考三个现代选择器各自的能力边界与权重差异，尤其是 `:has()` 的用途与性能提醒。

**参考答案**：

> **一句话结论**：`:is()` 合并选择器列表且权重取参数中最高者，`:where()` 能力相同但权重恒为 0，`:has()` 是关系选择器，可以按后代或兄弟关系反向匹配（俗称父级选择器）。

1. `:is()` 用来简写重复的选择器列表，例如 `:is(h1, h2, h3) + p` 取代三条规则；它的权重取参数中最高（最具体）的那个，写 `:is(.a, #b)` 就按 `#b` 计算，这一点很容易踩坑。
2. `:where()` 与 `:is()` 能力完全一致，但权重恒为 0，特别适合写「基础样式 / 重置样式」——后续任何普通类名都能轻松覆盖它，不需要靠 `!important` 或堆选择器。
3. 两者都是宽容选择器列表（forgiving selector list）：列表里某个选择器无效或不被支持时只会被忽略，不会让整条规则失效（传统逗号列表里一个无效选择器会让整条规则作废）。
4. `:has()` 是关系选择器，可以纯 CSS 实现过去必须用 JS 的逻辑：`.card:has(> img)` 选中有直接子图标的卡片、`form:has(:invalid)` 选中含非法字段的表单、`label:has(+ input:focus)` 选中聚焦输入框前面的标签、`body:has(dialog[open])` 在弹窗打开时锁住页面样式。支持情况为 Chrome 105+、Safari 15.4+、Firefox 121+，2023 年底三大引擎齐备。
5. 性能提醒：`:has()` 需要在 DOM 变化时重新求值，代价高于普通选择器。避免在大型列表上写宽泛的 `:has()` 条件，带 `>`、`+`、`~` 的受限条件比泛化的后代匹配更容易被优化。

**追问与易错点**：

- 追问：`:where()` 权重为 0 会带来什么问题？答：太容易被覆盖，不适合承载「必须生效」的样式；它最适合隔离基础层，业务层再显式覆盖。
- 陷阱：用 `:is()` 时以为权重按第一个参数算，或者以为它像 `:where()` 一样权重为 0。
- 陷阱：把 `:has()` 当成万能的动态样式方案，在长列表里对每个 item 做 `:has()` 匹配，滚动时会看到明显的样式重算开销。

### Q17 响应式断点怎么设计？媒体查询和容器查询该怎么选？

**考察点**：考断点设计的方法论（内容驱动而非设备驱动），以及媒体查询与容器查询的适用边界与坑。

**参考答案**：

> **一句话结论**：断点要在「布局开始难看」的位置打断点，用 `min-width` 递增、用 `em` 表达、控制在 3-5 个；页面骨架用媒体查询，可复用组件内部用容器查询 `@container`。

1. 断点设计原则：内容驱动而不是设备驱动，不要照抄某框架的固定档位；移动优先用 `min-width` 递增，桌面优先用 `max-width` 递减，两种方向不要在同一项目混用；断点用 `em` 写更尊重用户字体缩放；数量控制在 3-5 个，并用 SCSS map 或自定义属性集中管理，避免散落在各处。
2. 用媒体特性判断能力而不是猜设备：`(hover: hover)`、`(pointer: coarse)` 判断是否支持悬停与触屏精度，`(orientation)` 判断横竖屏，这比解析 UA 可靠得多。
3. 媒体查询（Media Query）依据视口 / 设备 / 用户偏好，属于页面级；容器查询（Container Query）依据最近的查询容器尺寸，属于组件级。

```css
.card-wrap { container-type: inline-size; }
@container (min-width: 400px) { .card { display: flex; } }
```

4. 容器查询的价值：同一个组件放在窄侧栏和宽主区域时能各自适配，不需要为每个使用位置预设全局断点；配合 `container-name` 可指定容器，查询单位有 `cqw`、`cqh`、`cqi`、`cqb`、`cqmin`、`cqmax`。
5. 关键坑与兼容：`container-type: size` 会让元素尺寸不再由内容决定（高度塌陷，必须显式设定尺寸），只做宽度适配用 `inline-size`；`container-type` 会创建 containment 与新的包含块，可能影响后代绝对 / 固定定位。支持情况为 Chrome 105+、Safari 16+、Firefox 110+。

**追问与易错点**：

- 追问：什么时候必须用媒体查询而不能用容器查询？答：涉及页面级决策时——整页栏数、字号体系、是否显示侧边导航、是否加载某些资源，这些没有「容器」可言。
- 陷阱：给 `container-type: size` 的元素没设高度，结果内容塌陷成一团。
- 陷阱：为了做响应式去判断 UA 或屏幕宽度 JS 分支，既不可靠又拿不到窗口尺寸变化之外的信息（如触屏能力、系统动效偏好）。

### Q18 渐进增强和优雅降级有什么区别？项目里怎么做？

**考察点**：考两个概念的出发点差异，以及是否落到具体手段上，而不是背定义。

**参考答案**：

> **一句话结论**：渐进增强从「最低环境也完整可用」出发逐层叠加增强，优雅降级先做完整效果再给旧环境回退；前者对未知环境更鲁棒，是绝大多数前端项目的默认策略。

1. 渐进增强（Progressive Enhancement）：先写语义化 HTML 与基础样式，保证内容与核心功能在任何环境都能用，再针对支持新能力的浏览器叠加 CSS 与 JS 增强。
2. 优雅降级（Graceful Degradation）：先按现代浏览器实现完整体验，再为旧环境准备回退方案，如 polyfill、备用图片、兜底样式。
3. 差别在于出发点与关注点：渐进增强从底层向上建，关注「可用性底线」；优雅降级从上层向下退，关注「体验完整」。成本上渐进增强更低——新特性只用一次特性检测，不需要维护浏览器清单。

| 对比项 | 渐进增强 | 优雅降级 |
| --- | --- | --- |
| 建设方向 | 基础到增强 | 完整到回退 |
| 判断依据 | 特性检测 | 浏览器 / 环境清单 |
| 关注点 | 可用性底线 | 体验完整 |
| 维护成本 | 低，向前兼容 | 高，需要维护黑名单 |

4. CSS 侧的天然降级：写两条声明让后者覆盖前者，例如先 `background: #ccc;` 再 `background: linear-gradient(...)`；再配合 `@supports` 做增强。图片用 `srcset` / `<picture>`，JS 用特性检测（`if ('fetch' in window)`）而不是 UA 判断。
5. 什么时候降级更合理：内部系统、固定运行环境（Electron、企业内网、指定浏览器版本）可以只做目标环境；面向公众的 C 端页面应坚持渐进增强。最常见的错误是把优雅降级等同于「兼容 IE」，把渐进增强等同于「移动优先」。

**追问与易错点**：

- 追问：`@supports` 在哪个策略里更关键？答：渐进增强，它用来判断「该不该叠加增强」；优雅降级里更常用的是 polyfill 与兜底样式。
- 陷阱：只做一条声明链就宣称实现了降级，例如给 `display: grid` 的容器不写任何兜底布局，老浏览器会直接变成纵向堆叠。
- 陷阱：把渐进增强理解成「先不做现代特性」，它只是保证底线，不限制上限。

### Q19 移动端适配有哪些方案？rem + flexible、vw、postcss-px-to-viewport、rpx 怎么选？

**考察点**：考四种主流方案的实现原理与代价，以及是否会为纯 CSS 方案做兜底。

**参考答案**：

> **一句话结论**：优先纯 CSS 方案——`vw`（配合 postcss-px-to-viewport）或现代 `clamp()` 流式字号，用 `max-width` 与上下限兜底；不要再在 JS 里改 viewport 的 `initial-scale`。

1. `rem` + flexible：JS 按 `document.documentElement.clientWidth / 10` 设置 `html` 的 font-size，样式用 `rem`，配合 postcss-pxtorem 自动换算。lib-flexible 还会用 `initial-scale = 1/dpr` 改 viewport 来「伪造」视口宽度，已停止维护，而且改 viewport 会伤害可访问性、影响 `vh` 与 fixed 定位。该方案的固有缺点是依赖 JS（首屏可能跳动）、字号被一起缩放导致用户字体设置失效。
2. `vw` + postcss-px-to-viewport：`1vw` 恒等于视口宽度的 1%，插件在构建期把设计稿的 px 换算成 vw，纯 CSS、无 JS、无首屏跳动。缺点是大屏（平板、折叠屏、桌面窗口拉宽）会等比放大，必须配合 `max-width` 容器、断点或 `clamp()` 限制范围；Android 4.4 以下的 WebView 不支持 `vw`。
3. 媒体查询 + `clamp()` / `min()`：给字号写 `font-size: clamp(14px, 3.7vw, 18px)`，天生有上下限，是现在最推荐的流式做法，可与前两种方案混用。插件也支持用 `/* px-to-viewport-ignore */` 注释或大写 `PX` 跳过单条换算。
4. `rpx`：小程序特有的响应式单位，约定屏幕宽度恒为 750rpx；uni-app、Taro 这类跨端框架编译到 H5 时会做换算，具体基准以框架的 designWidth 配置为准——原生 H5 没有 `rpx`，写它不生效。
5. 选型结论：以设计稿等比还原为主的项目用 `vw` 方案 + `clamp()` 上下限；只在需要整页等比的旧项目里用 `rem` 方案；大屏后台管理系统用媒体查询 + 弹性布局；任何方案都要为安全区预留 `env(safe-area-inset-*)`（见第 21 题）。

**追问与易错点**：

- 追问：为什么现在不推荐用 JS 改 viewport？答：`user-scalable` 之类的缩放设置伤害可访问性，新版本移动浏览器还会忽略部分设置；改 `initial-scale` 也会让 `100vh`、fixed 定位与安全区的行为更难预测。
- 陷阱：只把 `px` 换成 `vw` 却不设上限，平板上会看到硕大的文字。
- 陷阱：把 `rpx` 当成通用单位写进 H5 项目，编译后既没有换算也不报错，只是样式不生效。

### Q20 移动端 1px 边框问题的原因是什么？有哪些解法？

**考察点**：考是否真的理解逻辑像素与设备像素的关系，以及能否给出兼顾 dpr 与圆角的可落地方案。

**参考答案**：

> **一句话结论**：CSS 的 1px 是逻辑像素，物理像素等于 1px 乘以 dpr，所以在 2 倍屏上看起来是 2 个物理像素；通用解法是用伪元素画线再 `transform: scaleY(0.5)` 压缩。

1. 现象与原因：设计稿上那条「最细的线」指的是 1 个物理像素，而 CSS 里写 `border: 1px` 在 dpr 为 2 或 3 的屏幕上会渲染成 2 或 3 个物理像素，视觉上明显偏粗。这不是 bug，而是逻辑像素（CSS pixel）与设备像素（device pixel）的定义差异。
2. 方案一（推荐，兼容圆角）：用伪元素画一条 1px 线，再按 dpr 缩放。

```css
.hairline { position: relative; }
.hairline::after {
  content: ''; position: absolute; left: 0; bottom: 0;
  width: 100%; height: 1px; background: #ddd;
  transform: scaleY(0.5); transform-origin: 0 100%;
}
@media (-webkit-min-device-pixel-ratio: 3) {
  .hairline::after { transform: scaleY(0.3333); }
}
```

3. 方案二至五：`box-shadow: 0 0 0 .5px #ddd`（Android 部分机型会把 0.5px 四舍五入成 1px 或直接不渲染）；`border-image` 配合渐变或 data URI 图片（只能直角，无法跟随圆角）；直接写 `border: 0.5px`（iOS 与现代 Chrome 支持小数 px，部分 Android 会忽略）；`outline: .5px solid #ddd; outline-offset: -0.5px`（不占盒模型，早期版本不跟随圆角）。
4. 方案六与七：用 `linear-gradient` 背景配 `background-size` 画分隔线，适合列表分割；改 viewport 的 `initial-scale` 整体缩放虽能让 1px 等于 1 物理像素，但破坏可访问性、影响 vh 与 fixed，已经淘汰。
5. 选型结论：需要圆角或通用场景用方案一并按 dpr 适配；纯分隔线用渐变更省事；注意高 dpr 时代「太细看不见」也是设计问题，1px 线在 3 倍屏上物理宽度只有 1 像素，必须在设计阶段确认。

**追问与易错点**：

- 追问：为什么不用 JS 读 `window.devicePixelRatio` 来设变量？答：可以，但 CSS 媒体查询 `-webkit-min-device-pixel-ratio` 或 `resolution` 已能表达同一信息，无需额外 JS 与首屏时序问题。
- 陷阱：以为 `transform: scaleY(0.5)` 会改变元素占位高度。伪元素是绝对定位的，压缩的是绘制结果，不参与布局。
- 陷阱：给所有元素都加一套 hairline 类。伪元素方案会让元素多一个合成层开销，长列表里应改用渐变背景或 `border-image`。

### Q21 全面屏安全区怎么适配？env(safe-area-inset-*) 和 viewport-fit=cover 是什么关系？

**考察点**：考安全区方案的两个前提（`viewport-fit=cover` 与 meta viewport）与 `constant()` / `env()` 的兼容写法。

**参考答案**：

> **一句话结论**：`viewport-fit=cover` 让视口铺满整块异形屏，此时必须用 `env(safe-area-inset-*)` 自己把内容从刘海与 Home Indicator 区域里挪出来；两者缺一不可。

1. 现象：iPhone X 起的刘海、挖孔、圆角屏幕与底部 Home Indicator 会遮挡全屏页面，横屏时左右两侧也可能被遮住；`position: fixed` 的底部栏最容易被盖。
2. 原因：默认 `viewport-fit=auto` 时浏览器会把可视区域向内缩，内容不会被遮挡，但页面也无法铺满屏幕（出现黑边或白边）；设为 `cover` 后视口铺满整屏，安全区就交给页面自己处理。`env()` 读到的值只有在 `cover` 模式且设备确实存在安全区时才非 0。
3. 用法：先改 meta，再用环境变量留边距。

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
.tabbar { padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }
/* 也可以用 max() 取较大值：padding-bottom: max(12px, env(safe-area-inset-bottom)); */
```

4. 兼容写法：iOS 11.0 / 11.1 只支持旧语法 `constant(safe-area-inset-bottom)`，iOS 11.2 起改用 `env()`，两条一起写且 `constant()` 在前，让旧系统读到旧语法、新系统读到新值。
5. 必须写 fallback：不支持 `env()` 的浏览器遇到无法解析的值会丢弃整条声明，所以 `env(safe-area-inset-bottom, 0px)` 里的 `0px` 不能省；桌面浏览器中 `env()` 解析为 0。小程序同样支持 `env()`，但需要真机验证。

**追问与易错点**：

- 追问：能不能用固定 padding 代替安全区变量？答：不能，不同机型安全区高度不同（有无 Home Indicator、横竖屏都不同），写死会在一部分机型上留白、在另一部分机型上被遮。
- 陷阱：只加 `env()` 却忘了 `viewport-fit=cover`，此时环境变量恒为 0，看起来「代码没生效」。
- 陷阱：给全屏弹窗的底部按钮不加安全区，按钮正好压在 Home Indicator 上，用户很难点到。

### Q22 移动端点击 300ms 延迟是怎么来的？现在还需要 fastclick 吗？

**考察点**：考延迟的成因（双击缩放）与现在的正确解法，以及是否还知道 fastclick 的原理。

**参考答案**：

> **一句话结论**：300ms 延迟是浏览器为区分单击与双击缩放而产生的等待；现代浏览器在响应式 viewport 下已取消它，现在只需一行 `touch-action: manipulation`，不需要 fastclick。

1. 现象与原因：早期移动端点击按钮后回调要等约 300ms 才触发。原因是浏览器无法区分「单击」和「双击缩放的第一次点击」，必须先等约 300~350ms 看有没有第二次点击，否则用户想双击放大时会被误判成一次 click。这是为兼容「桌面网页默认可缩放」而付出的代价。
2. 消除手段一：现代移动浏览器在页面设置了响应式 viewport（`width=device-width, initial-scale=1`）后已经取消该延迟，只有极老的 WebView 仍需要处理。
3. 消除手段二（推荐）：给可点元素加 `touch-action: manipulation`，表示「这个元素只允许平移与双指缩放，不允许双击缩放」，浏览器就不用再等待，一行 CSS 且不伤害可访问性。不要用 `user-scalable=no` 换性能，既伤害可访问性，新版本系统也会忽略它。
4. fastclick 的原理：在 `touchend` 时立刻用 `document.createEvent('MouseEvents')` 合成并派发一个 click，同时 `preventDefault()` 抑制浏览器稍后补发的原生 click，把响应提前到 touchend。它还要处理很多边界——300ms 内发生过滚动就不算点击、长按、表单控件聚焦、以及点击穿透（ghost click）。现代项目已不需要它，且它早已停止维护。
5. 配套细节：用 `-webkit-tap-highlight-color: transparent` 去掉 iOS 的半透明灰块与 Android 的蓝绿高亮，但去掉后必须自己用 `:active` 或 `touchstart` 补点击反馈，否则用户会觉得「点不动」；`-webkit-touch-callout: none` 禁止长按弹出系统菜单；点击穿透的解法是延迟隐藏遮罩，或给下层元素临时加 `pointer-events: none`。

**追问与易错点**：

- 追问：`touch-action: manipulation` 和 `touch-action: none` 有什么区别？答：前者仍允许平移与双指缩放，只是禁掉双击缩放；后者彻底禁止该元素上的触摸手势（浏览器不再滚动或缩放），用在遮罩层上锁滚动更合适。
- 陷阱：认为 300ms 延迟无处不在。它在设置了响应式 viewport 的现代浏览器里早就没有了，真正的问题往往是自己写的 `click` 依赖了 300ms 后的补发事件。
- 陷阱：为了去掉点击高亮顺手把 `:active` 也删了，交互失去按压反馈，用户体感更差。

### Q23 iOS 的橡皮筋滚动和弹窗锁滚动有哪些坑？-webkit-overflow-scrolling 还能用吗？

**考察点**：深挖题，考 iOS 滚动模型与 CSS 锁滚动的实际差异，以及是否知道现代标准做法 `overscroll-behavior`。

**参考答案**：

> **一句话结论**：iOS 的滚动由原生惯性物理接管，`overflow: hidden` 常常锁不住；现代做法是 `overscroll-behavior: contain` 或 `touch-action: none`，老 iOS 才需要 `position: fixed` 锁 body 兜底。

1. 现象：页面与内层滚动容器能「拉过头再回弹」（橡皮筋 / overscroll）；弹窗打开后背后页面仍在滚；给 `body` 加 `overflow: hidden` 在 iOS 上经常无效，在 Android 上有效。
2. 原因：iOS 使用原生惯性滚动物理，滚动并不完全由 CSS 的 overflow 裁剪控制；历史上对 `html` / `body` 的 `overflow: hidden` 不阻止滚动，而且触摸滚动会沿容器链向上传递（滚动链，scroll chaining）。
3. 解法一（现代标准）：`overscroll-behavior: contain` 阻止滚动链与下拉刷新，`none` 更进一步。Android Chrome 63+ 支持，iOS Safari 16+ 才支持，所以面向老 iOS 仍需兜底；遮罩层用 `touch-action: none` 禁止触摸滚动，语义最干净。
4. 解法二（兼容老 iOS 的锁 body）：记录当前 `scrollTop`，给 body 设 `position: fixed; top: -y; width: 100%; overflow: hidden`，关闭时还原并 `window.scrollTo(0, y)`。这是移动端弹窗组件的通行做法，缺点是会引起页面跳动，必须严格保存与恢复滚动位置。
5. 解法三与澄清：用 `touchmove` + `preventDefault()` 兜底时必须加 `{ passive: false }`，否则 `preventDefault` 无效，还要排除弹窗内部可滚动区域。`-webkit-overflow-scrolling: touch` 历史上用于给 `overflow: auto` 的元素开启 iOS 原生惯性滚动，副作用是元素被提升为合成层、内存占用高、滚动中内容可能不渲染、内部 fixed / absolute 子元素错位、`z-index` 表现异常；iOS 13 起已默认启用惯性滚动，现代不建议再主动添加。

**追问与易错点**：

- 追问：`overscroll-behavior: contain` 和 `none` 的区别？答：`contain` 阻止滚动继续传递到祖先容器，但元素自身仍可回弹；`none` 连自身的回弹与刷新也一并禁止。
- 陷阱：只在弹窗上写 `overflow: hidden` 就想锁住背景页面滚动，iOS 上完全失效。
- 陷阱：给每个滚动容器都加 `-webkit-overflow-scrolling: touch`，结果长列表内存暴涨、滚动中白屏。

### Q24 position: fixed 在 iOS 软键盘下为什么会错位？为什么父元素有 transform 时 fixed 会失效？

**考察点**：深挖题，考包含块（containing block）这一根因，以及移动端键盘场景的落地解法。

**参考答案**：

> **一句话结论**：软键盘只改变视觉视口、不改变布局视口，而 fixed 相对布局视口定位所以视觉错位；祖先元素只要有非 `none` 的 `transform`、`filter`、`perspective`，就会成为 fixed 后代的包含块，fixed 立刻「失效」。

1. 现象一：iOS 上输入框聚焦弹出软键盘后，`position: fixed` 的底部按钮被顶起、藏进键盘下方或整体错位。
2. 原因一：软键盘只改变视觉视口（visual viewport），不改变布局视口（layout viewport）；Safari 会把页面上滚以露出输入框，而 fixed 元素相对布局视口定位，于是视觉上错位。旧版 iOS 键盘弹出时 `window.innerHeight` 也不变，所以监听 resize 并不可靠。
3. 解法一：避免用 fixed 做底部操作栏，改用 `height: 100%` 的 flex 容器 + 内部滚动，视口高度用 `dvh` 这类动态视口单位（避免移动端 `100vh` 不等于可视高度的问题）；需要动态计算时用 visualViewport API，监听 `window.visualViewport` 的 `resize` 与 `scroll`，按 `height` / `offsetTop` 调整容器；最省事的做法是键盘弹起时把底部栏收起（`transform: translateY(100%)` 或 `display: none`），失去焦点再恢复。
4. 现象二：祖先元素带 `transform`（非 `none`）、`will-change: transform`、`filter`、`perspective`、`backdrop-filter`、`contain: paint` 时，内部的 fixed 元素不再相对视口定位，而是相对该祖先定位并随其变换或滚动。原因二：CSS 规范规定这些属性非 `none` 的元素会成为后代的包含块，fixed 被「锚」在了这个祖先上——常见于给父级加 transform 做动画之后留下的坑。
5. 解法二：把 fixed 元素移到 `body` 的直接子级（React 用 `createPortal`、Vue 用 `Teleport`），或改用 `position: sticky`，或清理祖先上多余的 `transform`。排查技巧是在开发者工具里逐级检查祖先的 `transform` / `filter` / `perspective` 是否为 `none`。

**追问与易错点**：

- 追问：`position: sticky` 会不会也受祖先 transform 影响？答：会，sticky 的吸附参照的是最近的滚动容器与包含块链，祖先的 transform 同样会改变它的表现。
- 陷阱：给弹窗容器加 `transform` 做入场动画，动画结束后不移除，导致弹窗里所有 fixed 元素全部错位。
- 陷阱：只用 `window.innerHeight` 判断键盘是否弹出。iOS 上它常常不变，应该用 visualViewport 的尺寸变化。

### Q25 iOS 上输入框聚焦后页面自动放大是怎么回事？怎么解决？

**考察点**：考这条 iOS 特例的触发条件与正确解法，以及为什么会与 `user-scalable` 混为一谈。

**参考答案**：

> **一句话结论**：iOS 为了保证输入文字可读，遇到 `font-size` 小于 16px 的表单控件被聚焦时会放大页面；正解是把控件字号设到 16px 及以上，而不是禁用缩放。

1. 现象：iOS Safari 上点击字号小于 16px 的 `input` / `textarea` / `select`，页面被放大并保持放大状态，可以左右拖动，布局被破坏。
2. 原因：这是 iOS 为可访问性做的自动缩放——聚焦的表单控件字号小于 16px 时页面会被放大，属于设计行为而不是 bug。微信、钉钉等 WKWebView 内核行为与 Safari 一致，Android 没有这个现象。
3. 解法一（推荐）：把表单控件的 `font-size` 设为不小于 16px，无副作用且顺带提升可读性。视觉上必须用小字号时，用 `transform: scale()` 缩放外观或改设计稿，不要直接把 `font-size` 压到 16px 以下。
4. 解法二（兜底）：`focus` 时临时把字号改成 16px，`blur` 时还原。能解决问题，但输入文字会跳动，只作兼容手段。
5. 不要这样做：用 `maximum-scale=1` 或 `user-scalable=no` 禁用缩放来规避。这会伤害可访问性（用户无法放大页面），而且 iOS 10 起已忽略禁用缩放的设置。相关但不同的问题是 `-webkit-text-size-adjust: 100%`（标准属性 `text-size-adjust`），它用来阻止 iOS 横屏时自动放大正文字号，两者不要混为一谈。

**追问与易错点**：

- 追问：为什么 Android 不会自动放大？答：各家实现的兜底策略不同，Android 浏览器普遍不做这种聚焦缩放，所以不能靠 Android 的表现推断 iOS。
- 陷阱：在移动端全局写 `input { font-size: 12px }`。这是触发自动放大最常见的原因，改成 16px 即可，视觉确实偏大时应由设计侧调整。
- 陷阱：以为加 `-webkit-text-size-adjust: 100%` 能解决聚焦放大，它管的是横屏文字缩放。

### Q26 iOS 和 Android 有哪些常见的样式差异？怎么统一？

**考察点**：考移动端跨平台样式的经验盘点，重点在字体度量、滚动条、日期解析这几个高频坑。

**参考答案**：

> **一句话结论**：两大平台的差异主要集中在默认字体与字体度量、滚动条策略、表单控件原生外观和日期解析宽容度上；统一手段是显式声明字体栈、统一无单位行高、避免依赖原生 UI、时间解析走工具库。

1. 默认字体与字体栈：iOS 中文是 PingFang SC、英文是 `-apple-system` / SF；Android 中文是思源黑体 / Noto Sans CJK，不同 ROM 还可能回退到 Droid Sans Fallback 或 Roboto。统一写法是显式声明完整字体栈。

```css
body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
  Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif; }
```

2. 单行文字垂直不居中：两个平台字体的 ascent / descent 度量不同，用 flex 的 `align-items: center` 时文字会看起来偏上或偏下。稳妥做法是让文本的 `line-height` 等于容器高度做居中，或统一使用无单位 `line-height` 并微调 padding，不要依赖字体默认行高。
3. 滚动条：iOS 默认不显示滚动条（滚动时才出现悬浮细条），Android 与桌面 Chrome 常驻显示。隐藏用 `::-webkit-scrollbar { display: none; }`（WebKit / Blink）与 `scrollbar-width: none`（Firefox，Chrome 121+ 也支持）；美化用 `::-webkit-scrollbar`、`::-webkit-scrollbar-thumb`、`::-webkit-scrollbar-track` 设置宽度、圆角与颜色，注意在 iOS 上基本无效，Firefox 走 `scrollbar-color` 与 `scrollbar-width`。
4. 日期解析：`new Date('2023-01-01 10:00:00')` 这种空格分隔的写法在 iOS Safari 上返回 `Invalid Date`，因为 Safari 严格按 ECMAScript 规定的 ISO 8601 格式解析，而 Android Chrome 更宽容。兼容写法是把空格换成 `T`、用 `new Date(y, m - 1, d, h, mi)`，或统一用 dayjs / date-fns 并显式指定格式——工程上最省心。
5. 其它差异与识别技巧：`-webkit-tap-highlight-color` 高亮色不同（Android 蓝或绿、iOS 半透明灰）；表单控件原生外观不同（iOS 有内阴影与圆角、Android 有底部线）；`select`、`input[type=date]` 在 iOS 是底部滚轮选择器、在 Android 是下拉框与日历弹窗。不要靠 UA 判断平台，必须判断时 `@supports (-webkit-touch-callout: none)` 只在 iOS Safari 成立，可作为兜底手段，但优先使用特性检测。

**追问与易错点**：

- 追问：为什么文字居中在 iOS 看起来更靠下？答：字体度量里 ascent 与 descent 的比例不同，加上行高默认值由字体决定，导致基线位置偏移；用数值 `line-height` 加 padding 微调比反复换字体更有效。
- 陷阱：用 `font-family: PingFang SC` 直接写死，Android 上会回退到默认字体，行高与字宽全变。
- 陷阱：用 `new Date(str)` 解析后端返回的 `2023-01-01 10:00:00`，在 iOS 上直接得到 `Invalid Date`，排查起来很费时间。

### Q27 表单控件的默认样式怎么重置？appearance 有什么用？

**考察点**：考 UA 样式表的边界、`appearance` 的作用与表单重置的常见遗漏（placeholder、焦点、按压态）。

**参考答案**：

> **一句话结论**：表单控件的外观来自浏览器 UA 样式表与操作系统，不是继承来的；用 `font: inherit` 加 `appearance: none` 抹平原生外观，再自己补上箭头、占位符与焦点样式。

1. 现象与原因：同一段 `input` / `button` / `select` 在 Chrome、Safari、iOS、Android 上外观差别很大（边框、圆角、内阴影、底部线、字体大小）。原因是表单控件属于原生控件，默认样式来自浏览器的 UA 样式表与操作系统主题，并且 `input` 默认不继承父级的 `font-family` / `font-size` / `color`。
2. 基础重置：统一继承与盒模型，让控件不再「我行我素」。

```css
input, button, textarea, select {
  font: inherit; color: inherit; margin: 0; box-sizing: border-box;
}
```

3. `appearance` 的作用：`appearance: none`（旧写法 `-webkit-appearance: none`）用来去掉系统原生外观，标准属性在 Chrome 84+ 支持。注意 `select` 加了它之后原生下拉箭头会一起消失，必须自己用背景图或伪元素补上箭头，否则用户不知道这是下拉框。
4. 其它必做的细节：用 `input[type=search]::-webkit-search-cancel-button` 与 `input[type=number]::-webkit-inner-spin-button` 处理控件私有伪元素；`::placeholder` 的颜色要显式设置（各平台默认不同），不要再用已废弃的 `::-webkit-input-placeholder` 前缀写法；焦点态不要简单写 `outline: none`，那会造成键盘可访问性事故，应该用 `:focus-visible` 配合自定义焦点环。
5. 重置方案的选择：normalize.css 或 modern-normalize 只统一差异、保留合理默认值，副作用小；reset.css 把样式全部清零，需要再补回大量默认样式，适合从零设计视觉体系的项目。另外 iOS 上 `:active` 默认不触发，要让元素绑定 `touchstart` 或设置 `cursor: pointer` 才有按压态，并配合 `-webkit-tap-highlight-color`。

**追问与易错点**：

- 追问：为什么 `input` 的字号不跟随父级？答：控件默认不继承字体相关属性，这是 UA 样式表的设定，所以必须显式写 `font: inherit` 或指定字号。
- 陷阱：用 `appearance: none` 重置 `select` 后忘记补箭头，测评时被认为是可用性缺陷。
- 陷阱：全局 `outline: none` 顺手把焦点样式全干掉，键盘用户完全看不到焦点在哪；应改成只针对鼠标点击去除，用 `:focus-visible` 保留键盘焦点环。

### Q28 font-display 是做什么的？字体加载怎么优化？

**考察点**：考 `font-display` 五种取值的行为差异，以及是否知道 preload、子集化、度量校正等真实优化手段。

**参考答案**：

> **一句话结论**：`font-display` 决定字体加载期间「阻塞期与交换期」的策略，用来在文字不可见（FOIT）与字体切换跳动（FOUT）之间取舍；正文用 `swap`，关键品牌字用 `block` 或 `optional`。

1. 现象与原因：自定义字体加载慢时，要么文字长时间空白（FOIT），要么先用系统字体渲染再突然切换（FOUT），后者还会引起布局偏移。原因是浏览器把字体视为使用它的文本的阻塞资源，需要一套策略决定何时改用后备字体。
2. 五种取值的行为：`auto` 等同浏览器默认（Chrome / Firefox 行为接近 `block`）；`block` 有约 3 秒阻塞期，期间文字不可见，之后永久交换；`swap` 几乎不阻塞，立刻用后备字体、字体到达后交换，适合正文与图标字体；`fallback` 约 100ms 阻塞期加约 3 秒交换期，超时就不再交换；`optional` 由浏览器自行决定是否下载，可能一直使用后备字体，完全不产生布局偏移。

| 取值 | 阻塞期 | 交换期 | 典型用途 |
| --- | --- | --- | --- |
| `swap` | 极短 | 无限 | 正文、图标 |
| `block` | 约 3s | 无限 | 品牌标题 |
| `fallback` | 约 100ms | 约 3s | 次要文本 |
| `optional` | 极短 | 无 | 非关键字体 |

3. 加载优化：在 `@font-face` 里写 `font-display`；用 `<link rel="preload" as="font" type="font/woff2" crossorigin>` 提前下载，`crossorigin` 必须写否则会重复下载；用 `<link rel="preconnect">` 提前连接字体域名。
4. 减少布局偏移：用 `size-adjust`、`ascent-override`、`descent-override` 把后备字体的度量校正到与自定义字体接近，字体交换时的 CLS（累积布局偏移）会明显下降；也可以用字体加载 API（`document.fonts.ready`、`document.fonts.load`）在字体就绪后再切换类名。
5. 中文场景的硬约束：中文字体动辄几 MB，必须用 `unicode-range` 做子集化按需分包，或干脆使用系统字体。加载整包中文字体的页面，首屏指标一定会被拖垮。

**追问与易错点**：

- 追问：`font-display` 写在 `@font-face` 里还是写在元素上？答：写在 `@font-face` 描述符里，它描述的是该字体资源的加载策略。
- 陷阱：给正文用 `block`，弱网下首屏文字直接空白几秒，用户体验比字体切换更差。
- 陷阱：只做 `preload` 却不做子集化，提前下载的仍是一个几 MB 的中文字体包。

### Q29 图标方案从雪碧图到 iconfont 到 SVG symbol，怎么演进和选型？

**考察点**：考三代图标方案的优缺点与适用边界，重点在颜色能力、加载失败表现与工程集成。

**参考答案**：

> **一句话结论**：图标方案从「雪碧图省请求」演进到「iconfont 省事但只能单色」，再到今天的「SVG symbol / 图标组件」；新项目首选 SVG symbol 或图标组件。

1. 雪碧图（CSS Sprite）：把多个图标拼成一张位图，用 `background-position` 定位。优点是 HTTP/1.1 时代能减少请求数并利于缓存；缺点是维护成本高（改一个图标要重新生成整图）、放大会失真、无法单独换色（只能靠 `filter` 硬套）、定位依赖精确像素，在 rem / vw 等比缩放的布局里容易错位。
2. iconfont（字体图标）：把图标做成字形，用 `color` 与 `font-size` 直接控制颜色和大小。优点是矢量无损缩放、单文件、兼容性好；缺点是只能单色、无法多色与渐变、字体加载失败时显示成方块乱码或空白、存在 FOIT、字形基线差异导致需要 `vertical-align` 微调、语义弱需配合 `aria-hidden` 与可见文本。
3. SVG symbol：用 `<symbol id="icon-x">` 定义再以 `<use href="#icon-x">` 引用。优点是矢量、支持多色与渐变、可用 `currentColor` 与 CSS 变量控制填充、能做描边动画；工程上用 svg-sprite-loader 或 vite-plugin-svg-icons 打包成内联 sprite。限制是 `<use>` 引用外部 SVG 文件时样式穿透受限（影子树封闭，只有可继承的 CSS 变量与 `currentColor` 能传入）且有跨域限制，IE 也不支持引用外部文件。

| 方案 | 多色 | 缩放 | 请求 | 失败表现 | 维护成本 |
| --- | --- | --- | --- | --- | --- |
| 雪碧图 | 支持 | 失真 | 1 次 | 空白 | 高 |
| iconfont | 不支持 | 无损 | 1 次 | 方块乱码 | 中 |
| SVG symbol | 支持 | 无损 | 内联 | 不显示 | 低 |

4. 现代做法：图标组件化，用 Iconify、unplugin-icons 或按需引入的 SVG 组件。可 tree-shaking、支持多色、无字体依赖，工程体验最好。
5. 选型结论：新项目用 SVG symbol 或图标组件；需要向下兼容或图标量大且单色时用 iconfont；雪碧图只保留在位图素材或老系统里。

**追问与易错点**：

- 追问：为什么 SVG 图标能用 `currentColor` 而外部 `<use>` 引用时改不了内部填充？答：影子树是封闭的，不能从外部选择器命中内部节点，只有可继承的属性（如 `color`、CSS 变量）能传进去。
- 陷阱：用 `filter` 给雪碧图图标换色，结果是色相错位或边缘发灰，多主题项目里无法维护。
- 陷阱：iconfont 不做子集化引入整个图标库，字体文件体积远超实际用到的图标数量。

### Q30 BEM 命名规范是什么？它解决了什么问题？

**考察点**：考 BEM 的三个组成部分与它真正解决的问题（权重扁平、语义明确、便于删除），以及常见误用。

**参考答案**：

> **一句话结论**：BEM 用 `block__element--modifier` 的扁平命名把选择器权重固定在一个类上，同时让类名自带归属信息，既避免命名冲突也让样式可定位、可删除。

1. 三个组成部分：Block 是独立可复用的组件（`.card`）；Element 是块的组成部分、不能独立存在（`.card__title`）；Modifier 是状态与变体（`.card--featured`、`.btn--large`）。类名必须扁平化，不允许 `.card__title__icon` 这种层层嵌套的写法——图标应写成 `.card__icon`。
2. 解决的问题一：权重扁平。全部使用单个类选择器，权重恒为 `0,1,0`，没有嵌套提权，覆盖样式时只需比较声明顺序，不需要 `!important` 与堆选择器。
3. 解决的问题二：语义与可维护性。看类名就知道它属于哪个块、是不是状态变体，改样式时能安全定位，删除块时相关样式也能一起删干净，不会留下无人敢动的死代码。
4. 常见反模式：写了 BEM 又用嵌套 `.card .card__title`，权重又变高、失去扁平优势；块名过长；`--` 修饰符与 `.is-active` 状态类混用不统一；用元素选择器或 ID 命名；把某个块的 Element 类跨块复用。
5. 与其它方法论的关系：OOCSS 强调结构与皮肤分离，SMACSS 按角色分类，ITCSS 按层级与权重组织，BEM 只管命名与权重，可以和它们叠加。分隔符可以自定义（`__` 与 `--` 是社区默认，也有团队用单连字符），关键是团队统一、不能混用。CSS Modules 用哈希类名解决「冲突」，BEM 解决「可读与权重」，两者可以一起用，例如把 `localIdentName` 配成 `[name]__[local]--[hash]`。

**追问与易错点**：

- 追问：BEM 和原子化 CSS 冲突吗？答：思路相反但不冲突——BEM 是「为语义命名」，原子化是「不起名」，大型项目里常见做法是用原子类写页面、用 BEM 或组件类写复杂组件。
- 陷阱：只学形式不学约束，一边写 BEM 一边写嵌套选择器，权重照样失控。
- 陷阱：把 Element 类当工具类跨块复用（`.card__title` 用在别的组件里），块与元素的归属关系立刻失效，改动会互相牵连。

## 本章小结

- 动画优先动 `transform` 与 `opacity`，它们只走合成阶段；动 `width` / `top` 触发重排、动 `box-shadow` 触发重绘，代价依次升高。
- `will-change` 是「用前加、用完撤」的一次性提示，全局滥用会造成层爆炸、显存暴涨与文字模糊。
- 主题切换的正解是「语义化 CSS 变量 + 根节点属性切换 + 内联脚本防闪白」，`color-scheme` 决定滚动条与表单控件是否跟随。
- 样式方案看场景选：CSS Modules 编译期零运行时，CSS-in-JS 用运行时成本换动态能力，原子化 CSS 用类名冗长换样式体积与设计约束。
- `@supports` 做特性检测、`@layer` 管优先级、`:where()` 把权重归零，都是不靠 `!important` 就能覆盖样式的现代手段；但基础样式不能只写在 `@supports` 或 `@layer` 里，否则不支持的浏览器整块丢失。
- 移动端适配优先纯 CSS：`vw` 换算是主力、`clamp()` 限制上下限、`env(safe-area-inset-*)` 留出安全区，不要在 JS 里改 viewport 的 `initial-scale`。
- 移动端兼容问题一律按「现象 → 原因 → 解法」记忆：1px 是 dpr 造成的、300ms 是双击缩放等的、锁滚动失效是 iOS 滚动模型决定的、fixed 错位是包含块与视觉视口造成的。
- BEM 解决「权重扁平 + 可读可删」，CSS Modules 的哈希类名解决「冲突」，两者在生产项目里各管一段、可以叠加。

<!-- COUNT: 30 -->


