---
title: "第 8 章 CSS 基础与布局"
---

## 第 8 章 CSS 基础与布局

### Q1 说说标准盒模型和 IE 盒模型有什么区别？

**考察点**：是否真的知道 `width` 指的是哪一段宽度，能不能把两种模型算清楚。答到"content-box 与 border-box 的 width 包含范围不同"就算过关。

**参考答案**：

> **一句话结论**：标准盒模型（content-box）的 `width` 只算内容区，IE 盒模型（border-box）的 `width` 包含内容 + `padding` + `border`。

1. 标准盒模型（W3C Box Model）：元素占位宽 = `width` + 左右 `padding` + 左右 `border` + 左右 `margin`。写 `width:100px; padding:10px; border:1px`，内容区仍是 100px，实际占位 122px。
2. IE 盒模型（IE Box Model）：占位宽 = `width` + 左右 `margin`，`padding` 和 `border` 从 `width` 里向内挤。同样的声明实际占位 100px，内容区只剩 78px。
3. 高度方向规则完全一致。CSS3 的 `box-sizing` 用来切换：`content-box` 是默认值（标准），`border-box` 是 IE 模型。
4. 成因是历史遗留：IE6 及更早的怪异模式（quirks mode）默认用 border-box，现代浏览器统一以 content-box 为初始值。

**追问与易错点**：

- 追问：`border-box` 下 `width` 小于 `padding + border` 会怎样？答：内容区被压到 0，不会出现负宽度，元素至少保留 padding + border 的尺寸。
- 陷阱：只说"IE 盒模型是 IE 独有的"就结束，漏掉"怪异模式"这个前提，会被追问触发条件。
- 陷阱：把 `margin` 算进模型里。两种模型的 `margin` 都在 `width` 之外，不参与 width 计算。

### Q2 box-sizing 怎么用？项目里你会怎么设？

**考察点**：是否知道默认值、真实工程写法，以及 border-box 的好处与代价。

**参考答案**：

> **一句话结论**：`box-sizing` 决定 `width` 是否包含 padding 和 border，工程上统一设为 `border-box`，让"写多少就是多少"。

1. 取值只有两个：`content-box`（默认，标准盒模型）、`border-box`（`width` 含 padding + border）。还有一个 `inherit` 表示继承父级。
2. `border-box` 的最大价值是加 `padding`、加 `border` 不会撑破已定宽度的栅格，百分比布局、`width:100%` 配合内边距时不再需要 `calc()` 反算。
3. 推荐全局写法：`html` 设 `border-box`，其余元素用 `inherit` 继承，这样第三方组件里单独改 `box-sizing` 不会污染子树。

```css
html { box-sizing: border-box; }
*, *::before, *::after { box-sizing: inherit; }
```

4. 代价：`border-box` 下内容区会被 padding 挤小，做"输入框加图标"这类需要精确内容区尺寸的场景要重新核算，必要时局部改回 `content-box`。

**追问与易错点**：

- 追问：为什么用 `inherit` 而不是 `* { box-sizing: border-box }`？答：用 `inherit` 后，某个组件把自身改成 `content-box`，它的子元素会跟着变，语义上更可控，也方便局部覆盖。
- 陷阱：说 `box-sizing` 会影响 `margin`。它只作用于 `width` / `height` 与 padding、border 的关系。
- 陷阱：忘记伪元素。`*` 选择器匹配不到 `::before` / `::after`，所以要单独列出。

### Q3 外边距合并（margin collapse）有哪几种情况？怎么解决？

**考察点**：这是 CSS 布局的高频深挖题，考三种情形能否说全，以及解决手段是否落地。

**参考答案**：

> **一句话结论**：相邻的块级元素在垂直方向的 `margin` 会合并成一个（取较大值），分兄弟、父子、自身三种情形，破解办法是制造 BFC 或用 padding / border 隔断。

1. 相邻兄弟合并：上下两个块级元素的 `margin-bottom` 与下一个的 `margin-top` 合并，最终间距按"正正取大、负负取最负、正负相加"得出。
2. 父子合并：父元素没有上 `padding`、上 `border`，且没有 BFC / 没有 `overflow` 触发时，子元素的 `margin-top` 会"穿透"到父元素外面，表现为父元素整体下移。
3. 自身合并：一个空元素同时有 `margin-top` 和 `margin-bottom` 且没内容、没 padding / border / 高度时，两个 margin 合并成一个。
4. 破解手段：给父元素加 `padding` 或 `border`、`overflow: hidden`、`display: flow-root`、改成 flex / grid 容器（弹性与网格容器的子项不参与合并）。只有 `margin` 会合并，`padding` 不会；只有垂直方向会合并，水平方向不会；浮动元素和绝对定位元素不参与合并。

```css
.parent { display: flow-root; } /* 最干净的方案：创建 BFC，无副作用 */
```

**追问与易错点**：

- 追问：`overflow: hidden` 和 `display: flow-root` 哪个更好？答：`flow-root` 专为创建 BFC 而设计，没有裁剪内容、不能与 `position: sticky` 共存等副作用，现代项目优先用它。
- 陷阱：说"外边距合并就是取最大值"，遇到负值时会被问穿。规则是：正正取大、负负取最负、正负相加。
- 陷阱：把水平方向的 margin 也算进来。左右相邻元素（如两个 `inline-block`）的 margin 不合并。

### Q4 什么是 BFC？触发条件和实际用途分别是什么？

**考察点**：BFC 是布局题的核心概念，要求定义、触发方式、用途三段式答完整。

**参考答案**：

> **一句话结论**：块级格式化上下文（Block Formatting Context，BFC）是一块独立的块级渲染区域，内部布局与外部完全隔离，最常用的用途是清除浮动、阻止 margin 合并、实现两栏自适应不被浮动元素覆盖。

1. 定义：BFC 是一个独立的渲染上下文，内部元素的布局不会影响外部，外部也不会影响内部；计算 BFC 高度时会把内部的浮动元素算进去（这就是能清浮动的原因）。
2. 触发条件：根元素 `html`；`float` 不为 `none`；`position` 为 `absolute` 或 `fixed`；`display` 为 `inline-block` / `table-cell` / `table-caption` / `flow-root`；`overflow` 不为 `visible`；`contain` 为 `layout` / `paint` / `strict` / `content`；弹性/网格容器的子项（flex item 本身也是 BFC 容器）。
3. 用途一，清除浮动：父元素高度塌陷时，给父元素加 `overflow: hidden` 或 `display: flow-root` 让它包住浮动子元素。
4. 用途二，阻止外边距合并：父子 margin 穿透时给父元素创建 BFC，两个 margin 各自独立。
5. 用途三，阻止元素被浮动元素覆盖：右侧元素创建 BFC 后不会与左侧浮动元素重叠，实现自适应两栏。另外还可以阻止元素被浮动遮挡导致文字环绕错位。

**追问与易错点**：

- 追问：`display: flow-root` 和 `overflow: hidden` 建 BFC 有区别吗？答：都是 BFC，但 `overflow: hidden` 会裁剪溢出内容、影响 sticky 定位，`flow-root` 没有这些副作用，且是标准为这个目的引入的取值。
- 陷阱：把 BFC 说成"清除浮动的属性"。它不是属性，是一种布局上下文；`clear` 才是清浮动的声明。
- 陷阱：以为 `position: relative` 能触发 BFC。只有 `absolute` 和 `fixed` 可以。

### Q5 什么是 IFC 和行盒（line box）？高度由什么决定？

**考察点**：考对行内布局模型的理解，是"为什么 inline 元素撑不开父元素"的根因。

**参考答案**：

> **一句话结论**：行内格式化上下文（Inline Formatting Context，IFC）是块容器内部为行内内容创建的行式排版环境，每行形成一个行盒，行盒高度由行内元素的 `line-height`、`vertical-align` 和 replacement 元素的高度共同决定。

1. 形成条件：一个块容器里如果只有行内级内容（文字、`inline`、`inline-block`、`inline-table`），内部就形成 IFC；遇到浮动、绝对定位、块级盒子会被打断成多个 IFC。
2. 行盒（line box）是这一行内容的"包裹盒"，它的高度不等于子元素高度之和，而是由所有行内盒在垂直方向上的最高点到最低点决定。
3. 关键点：`line-height` 决定行内盒的高度贡献，`vertical-align` 决定它在行盒内的垂直位置，`font-size` 决定基线位置。所以父元素用了 `line-height` 后，即使子元素很小，行盒也不会缩到子元素那么小。
4. 每个 IFC 里都有一个隐含的"支柱（strut）"盒子，高度等于父元素 `font-size` 与 `line-height`，它保证了行盒最小高度——这就是"图片下面总有一条缝"的原因之一。

**追问与易错点**：

- 追问：为什么行内元素设了 `padding-top` 但父元素高度没变？答：行内元素垂直 `padding` 会绘制背景、参与视觉渲染，但不参与行盒高度计算，所以父元素高度不变。
- 陷阱：把行盒高度算成"最高的行内元素高度"。`vertical-align` 会让子元素上下错位，可能要按 `line-height` 的上下半边再外扩。
- 陷阱：认为 `inline-block` 与 `inline` 的行盒计算方式相同。`inline-block` 整体作为原子参与行盒，其高度计入，且基线取最后一行内容的基线。

### Q6 包含块（containing block）的确定规则是什么？

**考察点**：定位与百分比计算的根基，能把 static / relative / absolute / fixed 四种参照说清就是加分项。

**参考答案**：

> **一句话结论**：包含块是元素尺寸和位置计算的参照矩形，`static` / `relative` 参照最近的块容器祖先的**内容框**，`absolute` 参照最近的非 `static` 祖先的**内边距框**，`fixed` 参照视口（有 `transform` 等属性的祖先会打破）。

1. `static` 和 `relative`：包含块是最近的块级容器祖先的**内容框（content box）**，宽度的百分比就是按这个框算的。
2. `absolute`：包含块是最近的 `position` 不为 `static` 的祖先的**内边距框（padding box）**，也就是说 `left: 0` 停在 padding 内侧边界，`padding` 会算进偏移的起点。
3. `fixed`：正常情况下包含块是视口。但祖先一旦有 `transform`、`filter`、`perspective`、`will-change: transform`、`contain: paint` / `layout`、`backdrop-filter`，它会成为 fixed 元素的包含块，元素就跟着该祖先滚动了。
4. 如果找不到符合条件的祖先，`absolute` 的包含块是初始包含块（initial containing block），大小等于视口。百分比的宽高参照包含块，`margin` / `padding` 的百分比都按包含块的**宽度**计算（上下也不例外）。

**追问与易错点**：

- 追问：为什么给祖先加了 `transform: translateZ(0)` 之后 `position: fixed` 的弹窗不固定在屏幕上了？答：`transform` 使该祖先成为包含块，`fixed` 相对它定位，页面滚动时弹窗就跟着动了。
- 陷阱：说百分比 `padding-top` 按高度计算。上下 padding 的百分比同样按包含块宽度算，这是"padding-top 撑 16:9 占位"trick 的基础。
- 陷阱：忽略 `absolute` 元素如何确定包含块——自己若还有 `static` 子元素，这些子元素的包含块是绝对定位元素的 padding box。

### Q7 五种定位（position）分别怎么参照？各自的应用场景是什么？

**考察点**：定位是最常用的布局手段，考对照关系与实际选型。

**参考答案**：

> **一句话结论**：`static` 是默认文档流，`relative` 相对自身原位置偏移但占位不变，`absolute` 相对最近的非 static 祖先定位并脱离文档流，`fixed` 相对视口（或被 transform 的祖先），`sticky` 在滚动到阈值前是 relative、之后是 fixed。

| 取值 | 是否脱离文档流 | 偏移参照 | 典型用途 |
| --- | --- | --- | --- |
| `static` | 否 | 无偏移，`top` 等无效 | 默认排版 |
| `relative` | 否（原位置保留） | 自身原来的位置 | 做绝对定位的父级、微调、提升层级 |
| `absolute` | 是 | 最近非 static 祖先的 padding box | 角标、下拉菜单、遮罩、居中 |
| `fixed` | 是 | 视口（或 transform 祖先） | 固定头部、回到顶部、弹窗 |
| `sticky` | 否（保留占位） | 最近的滚动容器 + 阈值 | 吸顶导航、表头吸附、分组标题 |

1. `relative` 的 `z-index` 会生效（因为创建了层叠上下文）——这是它除了当定位父级的第二大用途。
2. `absolute` 的元素宽度会收缩为适应内容（shrink-to-fit），所以居中时通常要配合 `left/right` + `margin: auto` 或 `transform`。
3. `sticky` 必须设置至少一个阈值（`top` / `left` / `right` / `bottom`）才会生效，并受最近的滚动祖先影响。

**追问与易错点**：

- 追问：`relative` 元素偏移后原位置还在吗？答：在，布局空间按原位置保留，后续元素不会补位，只是视觉上移动。
- 陷阱：说 `absolute` 相对浏览器窗口定位。那是 `fixed`；`absolute` 只在找不到定位祖先时才退化为初始包含块。
- 陷阱：给父级写 `position: relative` 但忘了它会创建层叠上下文，导致子元素的 `z-index` 被"关"在父级层里出不来。

### Q8 position: sticky 不生效的常见原因有哪些？

**考察点**：典型的"用过但说不清"的题，能列出 3 条以上具体原因才算过关。

**参考答案**：

> **一句话结论**：`sticky` 失效基本都出自"没设阈值"和"滚动容器不是你以为的那个"，最常见的是祖先有 `overflow: hidden/auto`、祖先有 `transform`、或父元素高度不够。

1. 没写阈值：只写 `position: sticky` 而不写 `top` / `left` / `right` / `bottom` 中的任意一个，元素不会粘。
2. 滚动容器不对：任一祖先设置了 `overflow: hidden` / `auto` / `scroll`，吸附就相对这个祖先而不是视口；若这个祖先高度与内容相当、本身不滚动，元素看起来就"没生效"。
3. 祖先有 `transform` / `filter` / `perspective` / `will-change` / `contain: paint`：会改变包含块，吸附行为随之异常。
4. 父元素高度不足：sticky 只能在自己父元素的范围内活动，父元素高度等于元素自身高度时没有可粘空间；另外父级若是 flex / grid 容器且子项被 `align-items: stretch` 拉伸，元素高度会撑满，也没有粘的余地。
5. 兼容与表头：老版本 Safari 需要 `-webkit-sticky`；`<th>` 或 `<tr>` 的 sticky 在部分浏览器需要设到 `th` 上并配 `border-collapse: separate`。

```css
/* 前提检查清单：无 overflow 祖先、无 transform 祖先、父级足够高、有阈值 */
.header { position: sticky; top: 0; z-index: 10; }
.wrap { overflow: visible; } /* 祖先不要裁剪 */
```

**追问与易错点**：

- 追问：为什么给祖先加了 `overflow: hidden` 就吸不住了？答：粘性定位的滚动容器变成了该祖先，它若不产生滚动，元素就没有滚动距离可以吸附。
- 陷阱：只答"要注意兼容性"，漏掉 `overflow` 祖先和 `transform` 祖先这两个最常见的真实原因。
- 陷阱：以为 `sticky` 会脱离文档流。它保留原占位，只是视觉偏移，等同于"滚动到阈值前 relative、之后 fixed"。

### Q9 什么是层叠上下文？z-index 在什么条件下才生效？

**考察点**：z-index 失效是实际开发最常见的疑难问题，考的是"为什么我的 z-index 不管用"。

**参考答案**：

> **一句话结论**：层叠上下文（Stacking Context）是元素在 z 轴上独立排布的"层级组"，`z-index` 只对定位元素或自身已创建层叠上下文的元素生效，且子元素的层级永远出不了父级层叠上下文。

1. 创建层叠上下文的条件：根元素；`position` 为 `absolute` / `relative` / `fixed` / `sticky` 且 `z-index` 不为 `auto`；`position: fixed` / `sticky`（现代浏览器总是创建）；`z-index` 不为 auto 的弹性、网格子项；`opacity` 小于 1；`transform` / `filter` / `perspective` / `clip-path` / `mix-blend-mode` / `isolation: isolate` / `backdrop-filter`；`will-change` 指定了上述属性；`contain: layout` / `paint` / `strict` / `content`。
2. z-index 生效条件：元素是定位元素（`position` 不为 `static`），或者是 flex / grid 子项，或者通过了上述其他方式创建了层叠上下文。`z-index` 的取值是整数，可以为负。
3. 同一层叠上下文内的绘制顺序（从低到高）：背景和边框 → 负 `z-index` 的子级 → 块级盒子 → 浮动盒子 → 行内盒子与文字 → `z-index: 0` / `auto` 的定位元素 → 正 `z-index` 的子级。
4. 关键限制：子元素的 `z-index` 再大，也不能盖过父级层叠上下文之外的兄弟层级。父级被别的层压住，子级就一起被压住——这是"设了 9999 依然被遮住"的根本原因。

**追问与易错点**：

- 追问：为什么给元素设了 `z-index: 9999` 还是被弹窗遮住？答：它的某个祖先创建了层叠上下文，整个祖先层级的层级低于弹窗所在层，提升子元素无效，需要提升那个祖先的 `z-index` 或把元素挪出该祖先。
- 陷阱：认为 `z-index` 对所有元素都生效。非定位、非层叠上下文的普通块元素设 `z-index` 完全无效。
- 陷阱：忽略 `opacity: 0.99`、`transform: translate(0)`、`filter: blur(0)` 也会创建层叠上下文，这些"看起来无关"的样式常是层级错乱的元凶。

### Q10 浮动（float）是什么？为什么要清除浮动？clearfix 怎么写？

**考察点**：浮动的原理与副作用，`clearfix` 是必须能默写的基础代码。

**参考答案**：

> **一句话结论**：`float` 让元素脱离普通流、靠左或靠右排列并允许文字环绕，副作用是父元素高度塌陷，清除浮动最标准的做法是用伪元素 `clear: both`。

1. 浮动元素脱离普通流（但仍属于 BFC 内部），块级盒子会忽略它，行内内容（文字、图片）则会环绕它，这就是浮动最初的设计目的。
2. 副作用一：父元素高度塌陷，因为浮动子元素不参与父元素高度计算。副作用二：后续元素被浮动覆盖，需要 `clear` 或创建 BFC。
3. `clear: left / right / both` 的含义是"该元素的上外边沿不能与同侧的浮动元素相邻"，所以它会被推到浮动元素下方。
4. 标准 clearfix：给父元素加伪元素，在最后生成一个清除浮动的块级盒子。

```css
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}
```

5. 现代替代方案：直接给父元素 `display: flow-root`，一行搞定且无副作用；Bootstrap 等库保留 clearfix 主要是兼容老代码。

**追问与易错点**：

- 追问：`clear: both` 为什么要配合 `display: block`？答：伪元素默认是行内元素，行内元素不参与块级浮动清除的规则，必须转成块级盒子才有效。
- 陷阱：说"浮动完全脱离文档流"。它与绝对定位不同，仍占据 BFC 内的空间、会影响文字环绕，只是块级盒子视而不见。
- 陷阱：`clearfix` 写成 `overflow: hidden` 却忘了它会裁剪溢出内容（如下拉菜单、阴影），在组件里要慎用。

### Q11 display 的常用取值有什么区别？怎么选？

**考察点**：display 是布局语法的基础，考对照理解而不是背属性名。

**参考答案**：

> **一句话结论**：`display` 决定元素在文档流中的身份（块级 / 行内 / 弹性容器 / 网格容器 / 不渲染），选型上"容器用 flex 或 grid、文字流用 inline、需要整行占位用 block"。

| 取值 | 是否独占一行 | 宽高 | 垂直 margin/padding | 典型场景 |
| --- | --- | --- | --- | --- |
| `block` | 是 | `width` / `height` 生效 | 都生效 | 容器、段落、列表项 |
| `inline` | 否 | `width` / `height` 无效 | 垂直方向不影响行盒 | 文字、链接、强调 |
| `inline-block` | 否 | 都生效 | 都生效 | 图标按钮、需要并排又要设尺寸 |
| `flex` | 是（块级弹性容器） | 都生效 | 都生效 | 一维排列、居中、等分 |
| `grid` | 是（块级网格容器） | 都生效 | 都生效 | 二维布局、页面骨架 |
| `none` | 不渲染 | — | — | 隐藏且不占位 |
| `contents` | 自身盒子消失 | — | — | 只保留子元素参与父级布局 |

1. `inline-flex` / `inline-grid` 是行内级的弹性 / 网格容器，可以和其他行内元素并排。
2. `display: contents` 会"消掉"元素自身的盒子，让子元素直接参与上层的布局。注意它在部分浏览器上会让元素失去语义（无障碍树中消失），按钮、列表这类有语义的元素慎用。
3. `display: none` 的元素不产生盒子，不参与布局、不可访问、`transition` 无效；要保留占位用 `visibility: hidden`，要做动画用 `opacity` + `pointer-events`。

**追问与易错点**：

- 追问：`inline-block` 元素之间为什么有缝隙？答：行内级盒子之间会保留 HTML 里的空白字符，形成空白节点。解决：父元素 `font-size: 0`、给 HTML 去换行、或用 flex 布局。
- 陷阱：说 `visibility: hidden` 也会触发重排。它只是不绘制，占位与几何都不变，属于重绘；`display: none` 才会让元素退出渲染树并触发重排。
- 陷阱：忽略 `display: contents` 的无障碍副作用，面试官常顺着问"那它和 `display: none` 的区别"。

### Q12 行内元素（inline）的 padding 和 margin 表现如何？

**考察点**：经典细节题，考"为什么行内元素设了上下 padding 却撑不开父级"。

**参考答案**：

> **一句话结论**：行内元素左右方向的 `padding` / `margin` 正常撑开水平空间，上下方向的 `padding` 会绘制背景但不改变行盒高度、上下 `margin` 完全不生效。

1. 水平方向：`margin-left/right`、`padding-left/right` 都会推开相邻内容，参与行内布局计算。
2. 垂直方向：`padding-top/bottom` 会扩展元素的背景绘制区域和边框，但不会让行盒变高，也不会推开上下相邻行，视觉上会与上一行/下一行重叠。
3. 垂直方向：`margin-top/bottom` 对行内元素**完全无效**（不影响行盒高度，也不改变位置），设置后无任何视觉与布局效果。
4. 想要上下 padding / margin 生效，把 `display` 改成 `inline-block`、`block` 或 `flex`。`inline-block` 整体作为原子参与行盒，宽高与四向 padding / margin 都正常。

```css
.tag {
  display: inline-block; /* 关键：让上下 padding 生效 */
  padding: 2px 8px;
  margin: 4px 0;
}
```

**追问与易错点**：

- 追问：为什么行内元素的上下 padding 会和别的行重叠？答：它的行盒高度只由 `line-height` 和 `vertical-align` 决定，padding 不参与，因此背景可以溢出到行盒之外。
- 陷阱：说"行内元素不能设 padding"。左右能设、上下能设但只影响绘制不影响布局，是"生效一半"。
- 陷阱：把这条规则套到 `inline-block` 上。`inline-block` 四向 padding / margin 都正常，它是行内级但内部是块级格式化。

### Q13 vertical-align 什么时候生效？基线对齐有哪些坑？

**考察点**：图片底部缝隙、行内元素错位是后台系统里最常见的小 bug，考原理是否清楚。

**参考答案**：

> **一句话结论**：`vertical-align` 只对行内级元素和表格单元格生效，它控制的是元素相对"父元素基线"或行盒的对齐方式，图片底部那条缝隙就是行盒基线与图片底边对齐造成的。

1. 生效对象：`inline`、`inline-block`、`inline-table` 以及 `table-cell`。对块级元素无效；flex / grid 子项要用 `align-items` / `align-self` 控制。
2. 常用取值：`baseline`（默认）、`top` / `middle` / `bottom`（相对行盒）、`text-top` / `text-bottom`（相对父元素文字）、`sub` / `super`、`<length>`（相对基线偏移）、`<percentage>`（相对 `line-height` 偏移，正值向上）。
3. 基线的确定规则：行内元素取自己文字内容的基线；`inline-block` 若内部有行内内容，取最后一行内容的基线，若没有内容或 `overflow` 不为 `visible`，则取**下外边距边缘**作为基线。
4. 图片底部缝隙的本质：`<img>` 默认 `vertical-align: baseline`，行盒在基线以下还要留出下行空隙（descent），这段空隙就是那条缝。解决办法：`display: block`（推荐）、`vertical-align: bottom/top/middle`、父元素 `line-height: 0` 或 `font-size: 0`。

```css
img { display: block; } /* 一句话消除图片底部空隙，最省事 */
```

**追问与易错点**：

- 追问：为什么 `inline-block` 空元素会莫名奇妙跑到顶部？答：它没有行内内容，基线是下外边距边缘，与其他元素的文字基线对齐后视觉上就"抬高"了，加 `vertical-align: top` 或塞一个 `&nbsp;` 可解决。
- 陷阱：以为 `vertical-align: middle` 就是"垂直居中"。它是把元素的中线与父元素基线加上小写字母 x 高度的一半对齐，不是父元素盒子的中线。
- 陷阱：用 `line-height` 去垂直居中多行文本，结果行高失控。多行文本要用 flex 或 `display: table-cell` + `vertical-align: middle`。

### Q14 line-height 写百分比、数值、长度有什么区别？继承怎么算？

**考察点**：细腻的继承题，答案的差异只体现在子元素 `font-size` 不同的时候。

**参考答案**：

> **一句话结论**：无单位数值（如 `1.5`）被继承的是"这个比例"，子元素按自己的 `font-size` 重算；百分比和长度值被继承的是"计算后的固定像素值"，子元素字号变了行高也不变。

1. 无单位数值：`line-height: 1.5`，最终行高 = 1.5 × 元素自身 `font-size`，是推荐写法。
2. 百分比：`line-height: 150%`，先按父元素 `font-size` 算出像素值（父 16px → 24px），把 24px 这个计算值继承给子元素。
3. 长度值：`line-height: 24px`，直接是绝对像素，子元素继承 24px。`em` 与百分比同理，属于计算后继承。
4. 后果对比：父元素 16px / `150%` → 24px，子元素 `font-size: 32px` 时行高仍是 24px，文字会挤在一起；写成 `1.5` 则子元素行高自动变 48px。

```css
body { font-size: 16px; line-height: 1.5; }   /* 推荐：子元素自动重算 */
.bad  { font-size: 16px; line-height: 150%; } /* 子元素字号变化时行高不跟 */
```

**追问与易错点**：

- 追问：`line-height: 1` 和 `line-height: 0` 有什么区别？答：`1` 时行高等于字号，文字不重叠但很挤；`0` 时行高为 0，文字会严重重叠，只适合临时用 `font-size: 0` 消除空白节点。
- 陷阱：认为 `line-height: 150%` 和 `line-height: 1.5` 完全等价。只有在子元素字号与父级一致时才等价。
- 陷阱：用 `line-height` 等于父元素高度做垂直居中，遇到多行文本或字号不同的子元素就崩，现代项目直接用 flex 居中。

### Q15 Flex 容器（弹性盒）有哪些属性？各控制什么方向？

**考察点**：Flexbox 是当下布局主力，先考容器属性，再考项目属性，比重很高。

**参考答案**：

> **一句话结论**：弹性盒（Flexible Box，Flexbox）容器属性按"主轴方向、主轴对齐、交叉轴对齐、换行、间距"五组记忆：`flex-direction` / `justify-content` / `align-items` 与 `align-content` / `flex-wrap` / `gap`。

1. `flex-direction`：`row`（默认，主轴水平向右）、`row-reverse`、`column`、`column-reverse`。它决定主轴的起点和方向，其他所有属性都相对它解释。
2. `flex-wrap`：`nowrap`（默认，不换行且项目会被压缩）、`wrap`（换行）、`wrap-reverse`。简写 `flex-flow: row wrap`。
3. `justify-content`：主轴对齐。`flex-start`、`flex-end`、`center`、`space-between`、`space-around`、`space-evenly`。
4. `align-items`：单行情况下交叉轴对齐。`stretch`（默认，未设尺寸时拉满）、`flex-start`、`flex-end`、`center`、`baseline`。
5. `align-content`：**多行**时的交叉轴对齐（对单行无效，必须配合 `flex-wrap: wrap`）。取值同 `justify-content` 再加 `stretch`。
6. `gap` / `row-gap` / `column-gap`：项目间距，取代过去用 `margin` 拼间距的写法，不会在最外侧多出间距。

**追问与易错点**：

- 追问：`align-items` 和 `align-content` 有什么区别？答：`align-items` 管单行内每个项目在自己的行内怎么对齐；`align-content` 管多行之间整体怎么分布，不换行时它无效。
- 陷阱：把 `justify-content` 当成"水平居中"。它是主轴对齐，`flex-direction: column` 时它控制的是垂直方向。
- 陷阱：给容器设了 `align-items: stretch` 后子元素 `height` 不生效——`stretch` 只在子元素没有确定高度时才拉伸，想固定高度就写 `align-items: flex-start` 或给子元素设 `align-self: flex-start`。

### Q16 flex-grow、flex-shrink、flex-basis 分别是什么？

**考察点**：三个项目属性的语义与计算差异，是 Flex 的进阶核心。

**参考答案**：

> **一句话结论**：`flex-basis` 是项目在主轴上的初始尺寸，`flex-grow` 是分剩余空间的权重，`flex-shrink` 是空间不足时的收缩权重，三者分别管"起点、放大、缩小"。

1. `flex-basis`：主轴初始尺寸，默认 `auto` 表示取项目的 `width` / `height`（若没设则取内容尺寸），设为 `0` 则初始尺寸为 0，长度值 / 百分比都支持，`content` 表示按内容尺寸。
2. `flex-grow`：默认 `0`，即不放大。容器有剩余空间时，按各项目的 `grow` 值占比分配。两个项目 `grow` 为 1 和 2，剩余 300px 则分别得到 100px 和 200px。
3. `flex-shrink`：默认 `1`，即空间不足时允许收缩。收缩量按 `shrink × flex-basis` 的加权比例分摊，不是单纯按 `shrink` 比例，这点常被问。
4. 注意优先级：`flex-basis` 不为 `auto` 时，主轴尺寸优先按 `flex-basis`，`width` 会被忽略（交叉轴方向才看 `height`）。

```css
.item-a { flex-grow: 1; flex-shrink: 1; flex-basis: 0; }   /* 等分 */
.item-b { flex-grow: 0; flex-shrink: 0; flex-basis: 200px; } /* 固定不缩 */
```

**追问与易错点**：

- 追问：为什么设了 `flex-basis: 200px` 后 `width: 100px` 没用了？答：主轴方向上 `flex-basis` 优先级高于 `width`，`auto` 时才会回退到 `width`。
- 陷阱：认为 `flex-shrink` 是等比收缩。实际要乘以 `flex-basis`，`basis` 大的项目收缩得更多。
- 陷阱：以为 `flex-grow` 能处理"内容超出容器"的情况。空间为负时只有 `flex-shrink` 起作用，`grow` 完全不生效。

### Q17 flex: 1 的完整含义是什么？为什么常要配 flex-basis: 0？

**考察点**：`flex: 1` 是最高频的写法之一，考简写展开与 `basis` 的影响。

**参考答案**：

> **一句话结论**：`flex: 1` 等价于 `flex: 1 1 0%`（`grow: 1`、`shrink: 1`、`basis: 0%`），它让项目忽略自身内容宽度、从 0 开始等分剩余空间。

1. 简写规则：`flex: <grow> <shrink> <basis>`。省略规则是 `flex: 1` → `1 1 0%`；`flex: auto` → `1 1 auto`；`flex: none` → `0 0 auto`；`flex: 0` → `0 1 0%`（注意不是 `0 0 0%`）。
2. `flex-basis: 0%` 的作用：把主轴初始尺寸归零，所有项目站在同一起跑线，剩余空间严格按 `grow` 比例平分，从而实现"宽度完全相等"，不受内容多少影响。
3. `flex: auto`（`basis: auto`）的差异：先按内容宽度占位，再把剩余空间按 `grow` 平分，所以内容多的项目更宽，做等分布局时会出现"被文字撑歪"的现象。
4. 实践要点：`flex: 1` 配 `min-width: 0` 才能正确收缩到小于内容宽度，避免内部文字或代码块把容器撑破（见 Q18）。

```css
.row { display: flex; }
.row > * { flex: 1; min-width: 0; } /* 严格等宽 + 允许被压缩 */
```

**追问与易错点**：

- 追问：`flex: 1` 和 `flex: auto` 什么时候结果一样？答：当所有项目内容尺寸相同、且都不触发收缩时结果一致；内容长度不同时结果不同。
- 陷阱：答 `flex: 1` 是 `1 1 auto`。这是最常见的错误，区别就在于 `basis` 是 `0%` 还是 `auto`。
- 陷阱：以为 `flex: 1` 就等于 `width` 均分。它还受 `min-width: auto` 和 `gap` 影响，容器有 `gap` 时要先扣掉间距再分。

### Q18 Flex 布局里为什么内容会溢出？min-width: auto 是怎么回事？

**考察点**：真实业务里"省略号失效 / 表格被撑破"的根因，属于深挖题。

**参考答案**：

> **一句话结论**：弹性项目默认 `min-width: auto`，主轴方向上不允许缩小到自身内容的"最小尺寸"以下，所以里面的长文本会把容器撑开，必须显式写 `min-width: 0` 或 `overflow: hidden` 才能正常收缩。

1. 原因：CSS 规范为弹性项目的 `min-width` 设了初始值 `auto`，含义是"不小于内容的最小尺寸（min-content）"。`flex-shrink: 1` 想收缩，但被这个下限挡住了。
2. 表现：单行文本省略号不生效、右侧内容把左侧挤没、长英文单词或 `<pre>` 撑破弹窗宽度、表格列宽失控。
3. 解决：给需要收缩的项目加 `min-width: 0`（主轴为 `column` 时是 `min-height: 0`），或加 `overflow: hidden` / `overflow: auto` / `text-overflow: ellipsis` 配合 `white-space: nowrap`。
4. 让省略号真正生效的三件套：父级项目 `min-width: 0`，文本元素自身 `overflow: hidden; white-space: nowrap; text-overflow: ellipsis`。

```css
.flex-item { flex: 1; min-width: 0; }      /* 关键一行 */
.ellipsis { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
```

**追问与易错点**：

- 追问：为什么只给文本元素加 `overflow: hidden` 有时还不行？答：如果文本元素外面的弹性项目没解除 `min-width: auto`，撑宽的仍是外层项目，必须在外层解除。
- 陷阱：把 `min-width: auto` 说成"所有元素都这样"。普通块级元素 `min-width` 初始值是 `0`，只有弹性/网格项目才是 `auto`。
- 陷阱：用 `flex-shrink: 0` 去解决溢出。那反而会让项目完全不收缩，溢出更严重。

### Q19 Grid 的核心属性怎么用？auto-fit 和 auto-fill 有什么区别？

**考察点**：网格（Grid）是现代布局的另一半，考核心 API 与两个容易混的取值。

**参考答案**：

> **一句话结论**：`grid-template-columns` 用 `repeat()` + `minmax()` + `fr` 定义列轨道，`auto-fit` 会折叠空轨道让卡片拉伸铺满，`auto-fill` 会保留空轨道让卡片保持固定宽度。

1. `fr` 是网格容器剩余空间的分配单位，`1fr 2fr` 表示按 1:2 分配；注意 `fr` 的最小值是 `auto`，内容过长时同样会溢出，需要 `minmax(0, 1fr)` 兜底。
2. `minmax(min, max)` 定义轨道的尺寸范围，常与 `repeat()` 组合做响应式卡片墙，不用写媒体查询。
3. `auto-fit` 与 `auto-fill` 都用于"尽可能多地排列固定宽度轨道"。区别只在有空余空间时：`auto-fill` 保留空轨道（卡片维持 `minmax` 的最小宽度），`auto-fit` 把空轨道折叠为 0，剩下的轨道被拉伸铺满整行。
4. 另外两个常用函数：`repeat(3, 1fr)` 固定列数；`grid-auto-rows` / `grid-auto-flow` 控制隐式轨道与自动排列。

```css
.cards { display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
/* 需要卡片宽度固定、剩余空间留白时，把 auto-fit 换成 auto-fill */
```

**追问与易错点**：

- 追问：只有 3 张卡片时，`auto-fit` 和 `auto-fill` 显示有什么不同？答：容器够宽时 `auto-fit` 会把 3 张卡片拉伸到整行宽，`auto-fill` 则保持 `minmax` 的宽度并在右侧留白。
- 陷阱：说 `fr` 一定是等分。它分配的是扣掉内容与 `gap` 之后的剩余空间，且默认最小尺寸为 `auto`。
- 陷阱：忘了 `gap` 会占掉宽度，用 `repeat(3, 1fr)` 加 `gap` 时不需要再手动减宽度，Grid 会自动算。

### Q20 怎么用 grid-area 和命名区域做页面布局？

**考察点**：网格的真正优势在于区域命名，能写出可读的骨架代码是加分项。

**参考答案**：

> **一句话结论**：用 `grid-template-areas` 画出布局草图、给子元素用 `grid-area` 指名占位，是最可读的页面骨架写法；同时 `grid-area` 也是 `row-start / column-start / row-end / column-end` 的简写。

1. `grid-template-areas` 里同一名字必须构成矩形，否则声明整体失效；用 `.` 表示空单元格。
2. 子元素通过 `grid-area: 名字` 落到对应区域，不需要计算行列号，改布局只改草图文案，非常适合改版频繁的中后台。
3. `grid-area` 的另一种用法是四值简写：`grid-area: 1 / 2 / 3 / 4` 表示行起、列起、行止、列止，可用于跨行跨列。
4. 实际项目里常见组合是"外层 Grid 画大区块，内层 Flex 排组件内部"，既直观又灵活。

```css
.layout { display: grid; gap: 12px; height: 100vh;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 56px 1fr;
  grid-template-areas: "header header" "aside main"; }
.header { grid-area: header; }
.aside  { grid-area: aside; }
.main   { grid-area: main; }
```

**追问与易错点**：

- 追问：命名区域能用媒体查询改吗？答：可以，在媒体查询里重新声明 `grid-template-areas` 即可，子元素无需改动，这是它比 `float` 方案更好的地方。
- 陷阱：区域名写成非矩形（如 L 形），浏览器会丢弃整条 `grid-template-areas` 声明，布局退回默认，排查时优先怀疑这里。
- 陷阱：忘记给子元素设 `grid-area` 却以为会按顺序自动落入命名区域。自动排列只按源顺序填充，与命名区域无关。

### Q21 Flex 和 Grid 该怎么选？

**考察点**：考选型判断力，面试官想听的是取舍依据，不是"都能用"。

**参考答案**：

> **一句话结论**：一维排列、内容驱动、需要按内容分配空间用 Flex；二维布局、结构驱动、需要行列同时对齐用 Grid。二者不是替代关系，通常外层 Grid 搭骨架、内层 Flex 排内容。

1. 维度：Flex 一次只管一个方向（主轴），适合导航栏、按钮组、表单行、卡片内部；Grid 同时控制行和列，适合页面骨架、仪表盘、画廊、表格式布局。
2. 驱动方式：Flex 是"内容驱动"，空间按内容与 `grow` / `shrink` 分配，内容变化时布局跟着变；Grid 是"布局驱动"，先定义轨道再往里放内容，更适合稳定结构。
3. 能力差异：Grid 独有区域命名、轨道跨行跨列、`minmax` / `auto-fit` 响应式轨道；Flex 独有按内容比例伸缩、`order` 排序、单行基线对齐。
4. 兼容与心智成本：两者现在都可用，Grid 在部分老旧移动端浏览器上支持略晚，`gap` 在 Flex 中支持也较晚（见 Q41），若需兼容极老设备，Grid 用在骨架、Flex 兜底更稳。

**追问与易错点**：

- 追问：一个容器可以是 Grid 又是 Flex 吗？答：同一元素只能选一种 `display`，但可以在别的元素上切换，也可以 `display: grid` 的容器内放 `display: flex` 的子元素。
- 陷阱：答"Grid 完全可以替代 Flex"。Flex 的内容驱动与自动分配在组件内部排列上更自然，Grid 写起来反而更啰嗦。
- 陷阱：忽略 `gap` 与旧浏览器兼容的取舍，只谈语法不谈降级，会被追问落地细节。

### Q22 水平垂直居中你有哪些方案？（至少说出 6 种）

**考察点**：超高频题，考方案的广度与"什么场景用哪种"的判断。

**参考答案**：

> **一句话结论**：现代项目首选 Flex 或 Grid 的 `place-items: center`，需要不影响兄弟元素时用绝对定位 + `transform` 或 `margin: auto`，单行文本用 `line-height`。

1. Flex 方案：容器 `display: flex; justify-content: center; align-items: center`，最通用，无需知道子元素尺寸。
2. Grid 方案：容器 `display: grid; place-items: center`，两行搞定，子元素数量不限。
3. 绝对定位 + `transform`：`position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)`，不需要知道自身尺寸，缺点是 `transform` 会创建层叠上下文、影响子元素 fixed。
4. 绝对定位 + `margin: auto`：四边偏移为 0，`margin: auto` 自动均分剩余空间，要求元素有确定宽高（或 `max-width` 配合 `width: 0` 之类的技巧），不影响子元素定位参照。
5. `line-height` + `text-align: center`：只适合单行文本，`line-height` 等于容器高度。
6. `display: table-cell` + `vertical-align: middle`：兼容性极好，适合老项目，代价是要多套一层且 `margin` 不生效。

```css
.a { display: flex; justify-content: center; align-items: center; }
.b { display: grid; place-items: center; }
.c { position: absolute; inset: 0; margin: auto; width: 200px; height: 120px; }
.d { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.e { text-align: center; line-height: 60px; }
.f { display: table-cell; vertical-align: middle; text-align: center; }
```

**追问与易错点**：

- 追问：绝对定位 + `margin: auto` 为什么能居中？答：`top/right/bottom/left` 都为 0 时元素尺寸被约束，`margin: auto` 把水平与垂直方向的剩余空间平分（见 Q27）。
- 陷阱：`translate(-50%, -50%)` 中的百分比是相对元素**自身**尺寸，不是父容器，说反了会被立刻纠正。
- 陷阱：用 `line-height` 给多行文本居中，结果行距被撑大；多行必须换 flex、grid 或 `table-cell`。

### Q23 怎么实现两栏布局（左侧固定、右侧自适应）？

**考察点**：基础布局手写题，考多种实现与各自的坑。

**参考答案**：

> **一句话结论**：现代写法直接用 Flex（左固定宽、右 `flex: 1`）或 Grid（`grid-template-columns: 200px 1fr`），老方案用 `float` 或绝对定位。

1. Flex 方案：父容器 `display: flex`，左侧 `width: 200px; flex-shrink: 0`，右侧 `flex: 1; min-width: 0`。注意右侧内容宽时必须有 `min-width: 0`，否则溢出。
2. Grid 方案：`display: grid; grid-template-columns: 200px 1fr`，最简洁，右侧自动填满剩余空间。
3. 浮动方案：左侧 `float: left; width: 200px`，右侧 `margin-left: 200px`（不是 `float: right`，否则右侧内容宽度计算会出问题），父元素需清浮动。
4. 绝对定位方案：左侧 `position: absolute; width: 200px`，右侧 `margin-left: 200px`。适合侧栏需要脱离文档流做动画的场景，代价是父元素高度不撑开。

```css
.layout { display: grid; grid-template-columns: 200px 1fr; gap: 16px; }
/* Flex 等价写法 */
.layout-flex { display: flex; }
.layout-flex .aside { width: 200px; flex-shrink: 0; }
.layout-flex .main  { flex: 1; min-width: 0; }
```

**追问与易错点**：

- 追问：左侧固定宽用什么单位？答：侧栏常固定像素；如果需要跟随根字号做无障碍缩放，用 `rem`；`vw` 在移动端地址栏变化时会有抖动。
- 陷阱：右侧用 `float: right` 做成两栏，结果内容会环绕浮动元素、高度不一致，是新手典型错误。
- 陷阱：忘记 `flex-shrink: 0`，左侧在窄屏下被压扁，出现"侧栏越缩越窄"的问题。

### Q24 三栏布局、圣杯布局和双飞翼布局的区别是什么？

**考察点**：经典布局手写题，考"主内容优先渲染"的实现技巧，属于进阶。

**参考答案**：

> **一句话结论**：三栏布局是左右固定、中间自适应；圣杯与双飞翼都是为了"HTML 里中间主内容写在最前面（优先渲染 + SEO）"，用负 `margin` 把两侧栏拉到同一行，区别在于解决中间内容被遮挡的方式。

1. 相同点：都是左右固定宽、中间自适应；都把中间内容放在 DOM 最前，保证主内容优先加载与解析。
2. 圣杯布局：父元素设左右 `padding` 为两侧宽度，三个子元素全部 `float: left`，中间 `width: 100%`，左侧 `margin-left: -100%`，右侧 `margin-left: -自身宽度`，最后用 `position: relative` 把左右两栏移到 padding 区域。
3. 双飞翼布局：父元素不设 `padding`，中间是一个"外壳"盒子并设置左右 `margin` 给两侧让位，负 `margin` 逻辑相同，用 `margin` 代替了 `relative` 定位，少了一层定位计算。
4. 现代写法：Flex（中间 `flex: 1` 放在最前，用 `order` 控制左右顺序）或 Grid 命名区域，几行代码即可，且天然等高。

```css
/* 双飞翼核心：负 margin 把侧栏拉到主内容左侧 */
.main  { float: left; width: 100%; }          /* 外壳 */
.main-inner { margin: 0 200px; }              /* 给两侧让位 */
.left  { float: left; width: 200px; margin-left: -100%; }
.right { float: left; width: 200px; margin-left: -200px; }
```

**追问与易错点**：

- 追问：为什么两侧栏要用负 `margin`？答：三栏都是 `float: left` 且中间占满 100% 宽，侧栏会被挤到下一行，负 `margin` 把它们"拽"回上一行的空白位置。
- 陷阱：把双飞翼和圣杯的实现混着说。核心区别是"给中间让位的方式"：圣杯用父 `padding` + `relative`，双飞翼用中间内层 `margin`。
- 陷阱：忘记负 `margin` 的上限，写错数值导致侧栏压住主内容，排查时先看 `margin-left` 的百分比/像素是否等于对应宽度。

### Q25 等高布局怎么做？

**考察点**：真实业务里"两栏背景不等高"很常见，考方案的演进与取舍。

**参考答案**：

> **一句话结论**：现代直接用 Flex（默认 `align-items: stretch`）或 Grid（轨道内子项默认拉伸）就能等高，老项目用 `table-cell` 或"大 `padding` + 负 `margin`"技巧。

1. Flex 方案：容器 `display: flex`，子项不写 `align-items` 时默认 `stretch`，各列自动拉伸到最高列的高度，最适合两栏背景需要齐平的场景。
2. Grid 方案：同一行轨道内的子项默认撑满轨道高度，`align-items: stretch` 也是默认值，天然等高。
3. `display: table` / `table-cell` 方案：把父元素设为 `display: table`，子元素 `display: table-cell; vertical-align: top`，兼容性好，代价是无法使用 `margin`、结构受表格语义影响、响应式折叠要额外处理。
4. 经典 hack：给每列 `padding-bottom: 9999px; margin-bottom: -9999px`，再用父元素 `overflow: hidden` 裁掉多余部分。能实现等高背景，但容易影响内部定位与滚动，现代项目不建议再用。

**追问与易错点**：

- 追问：Flex 等高后子元素里的内容怎么不跟着拉伸？答：给子元素设置 `align-self: flex-start` 或显式高度，只让背景容器等高。
- 陷阱：用 `height: 100%` 做等高。百分比高度依赖父元素确定高度，父级 `height: auto` 时直接失效（见 Q44）。
- 陷阱：负 `margin` hack 会让父元素的滚动区域异常，出现"页面多出一大截空白无法滚动到底"的问题，用 `overflow: hidden` 才勉强可接受。

### Q26 等分布局和自适应布局分别怎么实现？

**考察点**：考场景判断与 `gap` 带来的写法变化，是日常最高频的布局需求。

**参考答案**：

> **一句话结论**：等分用 Flex 的 `flex: 1`（配 `min-width: 0`）或 Grid 的 `repeat(n, 1fr)`；自适应用 Grid 的 `auto-fit + minmax` 或 Flex 的 `flex-wrap` 配合百分比。

1. Flex 等分：子项 `flex: 1; min-width: 0`，数量不限都能等分。注意 `flex: 1` 是 `basis: 0%`，等价于忽略内容宽度。
2. Grid 等分：`grid-template-columns: repeat(4, 1fr)`，更适合固定列数的卡片网格，列宽与 `gap` 都由浏览器计算。
3. Grid 自适应：`repeat(auto-fit, minmax(240px, 1fr))` + `gap`，容器变窄自动减列，不用媒体查询。
4. Flex 自适应（老写法）：子项 `width: calc((100% - 3 * 16px) / 4)` 配合 `flex-wrap: wrap` 和 `margin` 间距，再用 `nth-child` 去掉末列多余间距；有了 `gap` 之后这类计算基本可以删掉。

```css
.grid { display: grid; gap: 16px; grid-template-columns: repeat(4, 1fr); }
.grid-auto { display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
```

**追问与易错点**：

- 追问：`repeat(4, 1fr)` 里放了 5 个子元素会怎样？答：第 5 个会进入隐式生成的第 2 行，需要 `grid-auto-rows` 控制高度或调整列数。
- 陷阱：用 `width: 25%` 加 `gap` 做四等分，结果总宽超过 100% 导致换行错位，必须改用 `calc()` 或 `1fr`。
- 陷阱：Flex 等分不写 `min-width: 0`，含长文本的那一列被撑宽，看起来"没有等分"。

### Q27 margin: auto 为什么能让绝对定位元素居中？

**考察点**：原理题，考对"过约束"和剩余空间分配的理解，能答出就是深挖得分点。

**参考答案**：

> **一句话结论**：绝对定位元素在四个偏移值（`top` / `right` / `bottom` / `left`）都为 0、且宽高确定时，包含块被元素和偏移"过约束"，`margin: auto` 会把水平与垂直方向的剩余空间平分，从而实现两个方向同时居中。

1. 普通块级元素的 `margin: auto` 只能水平居中，因为垂直方向的 `height: auto` 由内容决定，不存在"剩余空间"可分配（除非父级有确定高度且元素高度确定）。
2. 绝对定位元素一旦 `left: 0; right: 0` 并且设置了 `width`，水平方向的等式被固定，`margin-left/right: auto` 就参与求解，各自得到 `(包含块宽度 - 元素宽度) / 2`。
3. 同理 `top: 0; bottom: 0` 加上确定的 `height`，垂直方向也成立，于是 `margin: auto` 一行实现水平垂直居中。

```css
.center {
  position: absolute; inset: 0; /* 等价 top/right/bottom/left: 0 */
  margin: auto;
  width: 240px; height: 160px;
}
```

4. 与 `transform: translate(-50%, -50%)` 的区别：后者不需要确定尺寸，但 `transform` 会创建包含块与层叠上下文，可能影响子元素 `fixed` 定位；`margin: auto` 方案没有这个副作用，代价是必须有确定尺寸。

**追问与易错点**：

- 追问：不给宽高只用 `margin: auto` 能居中吗？答：不能。宽高由内容撑开时元素会贴着起点，没有剩余空间可分配。
- 陷阱：以为 `margin: auto` 在普通流里也能垂直居中。它需要"确定高度 + 过约束"这两个前提，普通块级元素做不到。
- 陷阱：把 `inset: 0` 当成"宽高铺满"。它只是把四个偏移设为 0，元素的尺寸仍由 `width/height` 或内容决定。

### Q28 width: 100% 和 width: auto 有什么区别？

**考察点**：看似基础，实为易混点，考是否理解块级元素的宽度计算规则。

**参考答案**：

> **一句话结论**：块级元素的 `width: auto` 是"自动填满包含块内容宽度并扣掉自身的 margin / border / padding"，`width: 100%` 是"严格等于包含块内容宽度的 100%，再额外加上 padding 和 border（content-box 下）"，因此更容易溢出。

1. `auto` 的解算是：`width = 包含块内容宽度 - margin - border - padding`，所以加了 padding 也不会溢出，是块级元素的默认行为。
2. `100%` 只规定内容框宽度等于包含块内容宽度，在 `content-box` 下再加上左右 padding、border 就会超出容器，出现横向滚动条；配 `box-sizing: border-box` 后两者表现接近。
3. `auto` 的额外能力：可以被弹性布局、表格布局、`margin: auto` 等规则"再分配"（剩余空间平分、按内容收缩），而 `100%` 是硬值，不参与这些计算。
4. 实践结论：普通流里边栏、卡片用 `auto` 或干脆不写；需要显式撑满且带 padding 时写 `width: 100%` 并配合 `box-sizing: border-box`。

**追问与易错点**：

- 追问：为什么输入框设 `width: 100%` 加 padding 后撑破了父级？答：`input` 默认是 content-box，padding 与 border 额外增加宽度；改 `box-sizing: border-box` 即可。
- 陷阱：认为 `width: auto` 一定小于 `100%`。在 `border-box` 且无 padding 时两者数值相同，差异在约束语义与可参与的计算上。
- 陷阱：把 `width: 100%` 用在绝对定位元素上，误以为会撑满视口。它参照的是包含块，不是视口。

### Q29 px、em、rem、%、vh/vw、ch/ex、rpx 各有什么区别？怎么选？

**考察点**：单位体系是 CSS 基础的"照妖镜"，考对照与选型判断。

**参考答案**：

> **一句话结论**：`px` 是绝对长度适合边框与固定间距，`rem` 相对根字号适合整体缩放与无障碍，`em` 相对自身/父级字号适合内联缩放但会层层叠加，`%` 参照包含块，`vh/vw` 参照视口，`ch` / `ex` 是字体相关单位，`rpx` 是小程序特有的响应式像素。

| 单位 | 参照 | 典型用途 | 注意点 |
| --- | --- | --- | --- |
| `px` | 绝对像素 | 边框、图标、小间距 | 不随用户字号缩放 |
| `em` | 元素自身（`font-size` 用父级） | 组件内等比缩放 | 嵌套会累乘，容易失控 |
| `rem` | 根元素 `html` 的 `font-size` | 整体适配、间距体系 | 根字号被改会全局放大 |
| `%` | 包含块（`padding` 也按宽度） | 流体宽度、栅格 | 高度百分比依赖父级确定高度 |
| `vh` / `vw` | 视口高度 / 宽度 | 全屏区块 | 移动端地址栏导致 100vh 偏大 |
| `ch` | 字符 "0" 的宽度 | 输入框宽度、文本行宽 | 受字体影响 |
| `ex` | 小写字母 x 的高度 | 少量微调 | 各字体差异大，少用 |
| `rpx` | 小程序 750 设计稿 | 小程序尺寸 | 仅小程序支持，换算 750rpx = 屏宽 |

1. 选型建议：用 `rem` 建立间距与字号体系，固定细节用 `px`，全屏区块用 `dvh` / `svh` 替代 `vh`，小程序用 `rpx`。
2. `em` 的陷阱：`padding: 1em` 相对的是该元素自己的 `font-size`，而 `font-size: 1.2em` 相对父元素，嵌套多层时会累乘。

**追问与易错点**：

- 追问：`rem` 适配有什么代价？答：修改根字号会整体缩放，第三方组件里写死的 `px` 不跟随，容易混用失控；现代更推荐搭配 `clamp()` 做有限度缩放。
- 陷阱：认为 `vw` 不受滚动条影响。桌面浏览器 `100vw` 通常包含滚动条宽度，会出现横向滚动条，可用 `100%` 或 `scrollbar-gutter` 规避。
- 陷阱：把 `%` 高度的失效归因于"浏览器 bug"。根因是父级 `height: auto`，百分比高度无法解析。

### Q30 calc、min、max、clamp 怎么用？有哪些注意事项？

**考察点**：CSS 数学函数是进阶必备，考语法细节与组合用法。

**参考答案**：

> **一句话结论**：`calc()` 做单位混合运算，`min()` / `max()` 取极值实现上限下限，`clamp(最小, 理想, 最大)` 是"响应式字号与容器宽度"的一行解法。

1. `calc()` 支持加减乘除与不同单位混算，注意 `+` `-` 两侧必须有空格（否则被解析成符号），乘除只能与数字运算。
2. `min()` / `max()` 接收多个值取最小 / 最大，常用于给 `width` 设上限：`width: min(100%, 1200px)`，比 `max-width` 更灵活（可直接用于 grid 的 `minmax`）。
3. `clamp(min, val, max)` 等价于 `max(min, min(val, max))`，当 `min` 大于 `max` 时以 `min` 为准；常用于 `font-size: clamp(14px, 2vw + 8px, 20px)` 这类流体字号。
4. 组合技巧：`width: clamp(280px, 60vw, 900px)`、`grid-template-columns: repeat(auto-fit, minmax(max(200px, 25%), 1fr))`。所有函数都可用于绝大多数长度属性，但一般不能用于媒体查询条件与 `@media` 的断点值。

```css
.card { width: min(100% - 32px, 1080px); padding: clamp(12px, 2vw, 24px); }
.title { font-size: clamp(16px, 1.5rem + 0.5vw, 24px); }
/* 注意：calc 的加减号两侧必须有空格 */
.offset { margin-top: calc(100% - 40px); }
```

**追问与易错点**：

- 追问：`min()` / `max()` 和 CSS 的 `min-width` / `max-width` 有什么区别？答：前者是取值函数，可以和其他值混算、可用于 `grid-template-columns` 等任意长度位置；后者是约束属性，只作用于尺寸属性。
- 陷阱：`calc(100%-40px)` 不生效，因为缺少空格导致解析失败，这是最常见的低级 bug。
- 陷阱：用 `clamp()` 却把最小值和最大值写反，浏览器会取最小值，看起来"没生效"。

### Q31 min-content、max-content、fit-content 分别是什么意思？

**考察点**：内在尺寸（intrinsic size）关键字，考对内容驱动布局的理解，属于深挖题。

**参考答案**：

> **一句话结论**：`min-content` 是最窄也不得不这么宽的尺寸（最宽的那个不可断行内容），`max-content` 是内容完全不断行的理想宽度，`fit-content` 是"在可用空间内尽量贴合内容，但不超出容器"。

1. `min-content`：取内容中"最宽的最小不可断单元"，例如文字取最长单词、图片取原宽。适合想让元素尽量窄、并且允许换行的场景。
2. `max-content`：内容不被压缩换行时的完整宽度，常见于让标题、标签不被折断：`width: max-content`。
3. `fit-content`：等价于 `min(max-content, max(min-content, 可用空间))`，即"内容小就跟内容一样宽，内容大就在可用空间内换行"，用在按钮、标签上非常自然。
4. 带参数的 `fit-content(300px)` 表示上限为 300px 的 fit-content，可用于 Grid 轨道与容器尺寸。

```css
.tag   { width: fit-content; padding: 0 8px; }   /* 宽度贴合文字，不撑满整行 */
.title { width: max-content; max-width: 100%; }  /* 不折行，但不超出父级 */
.col   { grid-template-columns: min-content 1fr; } /* 第一列尽量窄 */
```

**追问与易错点**：

- 追问：`fit-content` 和 `inline-block` 有什么区别？答：`inline-block` 也是收缩包裹，但它是行内级盒子、会受空白节点影响；`fit-content` 是块级元素上的宽度取值，语义更清晰。
- 陷阱：把 `max-content` 当成"最大宽度"。它是内容理想宽度，可能比容器还宽并造成溢出，通常要配 `max-width: 100%`。
- 陷阱：在 Grid 里忘了 `fr` 的最小值是 `auto`，直接写 `1fr` 时列会被 `max-content` 撑开，需要写成 `minmax(0, 1fr)`。

### Q32 aspect-ratio 怎么用？没有它之前是怎么做的？

**考察点**：现代 CSS 的实用属性，考写法与兼容思路，顺便看是否真的做过响应式。

**参考答案**：

> **一句话结论**：`aspect-ratio` 直接声明元素的宽高比（如 `16 / 9`），让元素按宽度自动算高度；它出现之前用 `padding-top` 百分比撑高的 hack。

1. 语法：`aspect-ratio: <宽度> / <高度>`，也支持单个数字（`1` 等价于 `1 / 1`）。元素的某一维由布局决定，另一维按比例推导。
2. 典型用法是媒体占位：卡片图片容器设 `aspect-ratio: 16 / 9; width: 100%`，再让 `img` 用 `width: 100%; height: 100%; object-fit: cover`，就不会出现加载前后布局跳动（避免 CLS）。
3. 失效情形：宽高**都**被显式指定时，`aspect-ratio` 被忽略；元素内容溢出也会撑破比例，通常要配 `overflow: hidden`。
4. 旧方案对比：外层 `position: relative; padding-top: 56.25%`（即 9/16），内层绝对定位铺满。原理是上下 `padding` 的百分比按包含块**宽度**计算，所以 padding 能被当成高度用。

```css
.thumb { aspect-ratio: 16 / 9; width: 100%; overflow: hidden; border-radius: 8px; }
.thumb > img { width: 100%; height: 100%; object-fit: cover; }
/* 旧方案：.thumb { position: relative; padding-top: 56.25%; } */
```

**追问与易错点**：

- 追问：图片本身有原始宽高比，为什么还要设 `aspect-ratio`？答：图片未加载完成时元素高度为 0，会让下方内容跳动；声明比例可以提前占位，也能统一不同尺寸图片的展示比例。
- 陷阱：给 `img` 同时设 `width: 100%; height: 300px; aspect-ratio: 16/9`，比例不生效因为宽高都确定了。
- 陷阱：忘记 `object-fit`，图片被拉伸变形，面试官常顺着问"怎么保证图片不变形"。

### Q33 object-fit 是做什么的？图片变形怎么彻底解决？

**考察点**：图片处理是业务高频，考 `object-fit` 与前后的替代方案。

**参考答案**：

> **一句话结论**：`object-fit` 决定替换元素（图片、视频）在其内容框内的填充方式，`cover` 保持比例裁剪填满、`contain` 保持比例完整显示，彻底解决图片被拉伸变形的问题。

1. 取值：`fill`（默认，强行拉伸，会变形）、`contain`（保持比例完整显示，可能留白）、`cover`（保持比例裁剪填满，可能切掉边缘）、`none`（保持原始尺寸，可能溢出或留白）、`scale-down`（在 `none` 与 `contain` 中取更小的那个）。
2. 使用前提：元素本身要有确定的宽高（或 `aspect-ratio`），否则 `object-fit` 无从计算。
3. 配 `object-position` 控制裁剪位置，默认 `50% 50%` 居中，头像常用 `object-position: center top` 保住脸部。
4. 替代方案：背景图 `background-size: cover / contain` 加 `background-position`；老浏览器可用"容器 `overflow: hidden` + 图片 `min-width/min-height: 100%` 加定位"或 `padding-top` 占位 + 绝对定位。

```css
.avatar { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
```

**追问与易错点**：

- 追问：`cover` 和 `contain` 怎么选？答：需要视觉统一、允许裁剪用 `cover`（缩略图、封面）；必须看到完整内容用 `contain`（证件照、图表、二维码）。
- 陷阱：把 `object-fit` 用在普通 `div` 上。它只对替换元素（`img` / `video` / `canvas`）生效，普通元素要用 `background-size`。
- 陷阱：只写了 `object-fit` 没给容器尺寸，图片按原始尺寸显示，比例看起来"没起作用"。

### Q34 CSS 选择器优先级怎么计算？:not、:is、:where 的权重是多少？

**考察点**：权重计算是必考题，`where` 与 `:is` 的差异是进阶加分点。

**参考答案**：

> **一句话结论**：优先级按 `(内联, ID, 类/属性/伪类, 元素/伪元素)` 四元组比较，从左到右逐级比大小；`:is()` / `:not()` 取参数中权重**最高**的那个，`:where()` 权重恒为 0。

1. 权重分级：内联样式 `style=""` 记为 (1,0,0,0)；ID 选择器 (0,1,0,0)；类、属性选择器、伪类 (0,0,1,0)；元素、伪元素 (0,0,0,1)；通配符 `*`、组合符 `>` `+` `~` 不贡献权重。
2. 比较规则：先比第一位，相同再比下一位；同权重时后出现的生效（层叠顺序：重要性 > 来源 > 权重 > 顺序）。`!important` 是独立性优先级，不参与四元组比较。
3. 函数伪类的差异：`:is(.a, #b)` 取最高权重 `#b`，整体按 ID 计算；`:not(.a, .b)` 同样取参数最高权重；`:where(.a, #b)` 无论写什么都按 0 计算。

```css
/* 计算示例 */
ul li.active       /* (0,0,1,2) */
#nav .item:hover   /* (0,1,1,1) */
:is(#a, .b) .c     /* (0,1,1,0) —— 取最高 #a */
:where(#a) .c      /* (0,0,1,0) —— where 归零 */
```

4. 工程建议：优先用 `:where()` 写基础样式（权重 0，任何业务样式都能覆盖），用 `:is()` 简化多选择器列举；不要靠堆 ID 和 `!important` 提升权重。

**追问与易错点**：

- 追问：`:where()` 的实际价值是什么？答：写组件基础样式时权重为 0，使用方用任何选择器都能覆盖，不需要 `!important`，是做主题与样式重置的利器。
- 陷阱：认为"类选择器写得多权重就高"。位与位之间不进位，写 11 个类也压不过 1 个 ID。
- 陷阱：把 `!important` 算成"权重加 1000"。它是独立维度，同源同权重下才比较，且用户样式的 `!important` 高于作者样式。

### Q35 伪类和伪元素有什么区别？常用的各有哪些？

**考察点**：概念辨析 + API 熟练度，单冒号/双冒号写错会当场露怯。

**参考答案**：

> **一句话结论**：伪类（pseudo-class）用单冒号表示元素的**状态或位置**，伪元素（pseudo-element）用双冒号表示"凭空生成的**虚拟元素**"。

1. 伪类：基于文档树之外的信息选中元素，如 `:hover`、`:focus`、`:active`、`:visited`、`:first-child`、`:last-child`、`:nth-child(2n+1)`、`:not()`、`:is()`、`:where()`、`:has()`、`:disabled`、`:checked`、`:focus-visible`。
2. 伪元素：`::before`、`::after`、`::first-line`、`::first-letter`、`::placeholder`、`::selection`、`::marker`、`::backdrop`。
3. 历史与规范：CSS2 里两者都用单冒号，CSS3 起为区分引入双冒号；`::before` / `::after` / `::first-line` / `::first-letter` 为了兼容仍支持单冒号写法，其余必须双冒号。
4. 关键区别：伪类不改变 DOM 结构、只是"选中"已有元素的状态；伪元素会产生一个渲染盒子，可以设 `content`、`display`、尺寸，但仍不在 DOM 里，JS 拿不到节点，只能通过 CSS 变量或类名控制。

**追问与易错点**：

- 追问：`:nth-child` 和 `:nth-of-type` 有什么区别？答：前者按父元素下所有子元素的序号计数，后者只按同类型标签计数，混排列表时会得到不同结果。
- 陷阱：说伪元素"会被爬虫和屏幕阅读器读到"。`::before` 生成的内容语义有限，重要信息不要只写在 `content` 里。
- 陷阱：用 `::before` 给 `<img>` / `<input>` 加装饰。替换元素不能生成伪元素，这是最常见的"为什么没效果"。

### Q36 ::before 和 ::after 的 content 有哪些写法？常用在哪些场景？

**考察点**：基础组件开发必备，考 `content` 取值与典型用法。

**参考答案**：

> **一句话结论**：`content` 是 `::before` / `::after` 生效的**必要条件**，即使内容为空也要写 `content: ""`；它们常用于清浮动、装饰图标、角标、提示三角等"纯视觉元素"。

1. `content` 常用取值：`""`（空，做纯装饰盒子）、`"文字"`、`attr(data-x)`（读属性值，做角标很方便）、`counter(名字)`（配合计数器）、`url(...)`（图片，支持度一般）、`open-quote` / `close-quote`。
2. 默认 `display: inline`，要设宽高必须改 `display: block` 或 `inline-block`；它们会作为父元素的第一个 / 最后一个子元素参与布局。
3. 常用场景：清浮动（`clearfix`）、图标字体或装饰线、tooltip 的三角形（`border` 技巧）、表单必填星号、评分星星、角标数字、占位蒙层。

```css
.item::after { content: attr(data-badge); display: inline-block;
  margin-left: 4px; padding: 0 6px; font-size: 12px;
  color: #fff; background: #f5222d; border-radius: 8px; }
/* 三角形：border 技巧 */
.arrow::before { content: ""; display: block; width: 0; height: 0;
  border: 6px solid transparent; border-bottom-color: #333; }
```

**追问与易错点**：

- 追问：为什么给 `::after` 设了 `width` 没生效？答：伪元素默认行内，宽高无效，需要 `display: block` / `inline-block`。
- 陷阱：以为伪元素能放在 `content` 之外的 DOM 位置。它只能出现在所属元素的内容首尾，且不参与 DOM 查询。
- 陷阱：用 `content` 承载业务文案。文案应写在 HTML 或由 JS 渲染，伪元素内容不可选中、不可访问、无法被测试查询。

### Q37 哪些 CSS 属性可以继承？哪些不能？

**考察点**：考记忆归类 + 是否理解"继承的设计逻辑"。

**参考答案**：

> **一句话结论**：与文字排版相关的属性（`color`、`font-*`、`line-height`、`text-align`、`visibility`、`cursor`、`list-style`）默认继承，与盒子模型和布局相关的属性（`width`、`margin`、`padding`、`border`、`background`、`display`、`position`、`overflow`、`z-index`）默认不继承。

1. 可继承：`color`、`font-family` / `font-size` / `font-weight` / `font-style`、`line-height`、`letter-spacing`、`word-spacing`、`text-align`、`text-indent`、`text-transform`、`white-space`、`visibility`、`cursor`、`list-style-*`、`direction`。
2. 不可继承：`width` / `height`、`margin` / `padding`、`border`、`background`、`display`、`position`、`float` / `clear`、`overflow`、`z-index`、`vertical-align`、`opacity`（注意：`opacity` 不继承，但父级透明会视觉上影响子元素）。
3. 设计逻辑：继承是为了让"文本样式"一处声明、全局生效；布局属性如果继承，会让每个子元素都带着父级的宽高和定位，无法使用。
4. 显式控制的关键字：`inherit`（强制继承父级计算值）、`initial`（回到规范初始值）、`unset`（可继承属性等同 `inherit`，否则等同 `initial`）、`revert`（回到浏览器或用户样式表的取值，常用于重置）。

**追问与易错点**：

- 追问：`line-height: 1.5` 为什么子元素会继承得很好，`150%` 不会？答：无单位数值继承的是比例，百分比继承的是计算后的绝对值（见 Q14）。
- 陷阱：说 `text-align` 不继承。它可继承，所以给父级设 `text-align: center`，内部所有行内内容都会居中，包括你不想居中的按钮文字。
- 陷阱：把 `visibility: hidden` 当成不可继承。它可继承，但子元素可以显式写 `visibility: visible` 重新显示，这是它与 `display: none` 的重要差别。

### Q38 !important 的层级有多高？什么时候该用？

**考察点**：进阶细节题，考的是层叠规则的完整顺序，而不是"加叹号就能盖住一切"。

**参考答案**：

> **一句话结论**：`!important` 高于同源的普通声明，但**不高于**用户样式表的 `!important`，也永远盖不过 `transition`；相同重要性的声明之间仍按常规权重和顺序比较。

1. 完整层叠顺序（优先级从高到低）：`transition` 声明 → 用户代理（浏览器）样式表的 `!important` → 用户样式表的 `!important` → 作者样式表的 `!important` → 动画（`@keyframes`）声明 → 作者普通样式 → 用户普通样式 → 用户代理普通样式。
2. 同源内的比较：同样是 `!important` 时，回退到常规规则——比较四元组权重，再比出现顺序，最后出现的胜出。
3. 内联样式与 `!important`：内联样式权重高于任何选择器，想要覆盖它必须使用 `!important`（内联带 `!important` 则更难覆盖，通常只能改 DOM 或样式表来源）。
4. 使用建议：只在覆盖第三方库、重置难以触及的样式、或提供"可被用户覆盖的降级样式"时使用；日常业务样式靠提高选择器特异性或调整引入顺序解决。

```css
/* 反面示例：层层加叹号后无法维护 */
.btn { color: red !important; }
```

**追问与易错点**：

- 追问：为什么有时候加了 `!important` 还是不变？答：可能被更靠后的 `!important` 同权重声明覆盖、被 `transition` 覆盖，或该属性本身不可动画/被 `@keyframes` 接管；也可能样式被 `revert`、被 `all: unset` 重置。
- 陷阱：认为 `!important` 能覆盖内联样式之外的一切。它不能覆盖用户样式的 `!important`，也不能改变层叠上下文的遮挡关系。
- 陷阱：在组件库里滥用 `!important`，导致使用方无法定制主题，这是面试官最想听到的"代价"。

### Q39 overflow 有哪些取值？它和滚动容器、BFC 的关系是什么？

**考察点**：滚动与裁剪是工程高频问题，考取值差异与副作用。

**参考答案**：

> **一句话结论**：`overflow` 决定内容超出盒子时是显示、裁剪还是滚动，取值 `visible`（默认）/ `hidden` / `clip` / `scroll` / `auto`；只要设为非 `visible`，该元素就创建 BFC，并可能成为新的滚动容器。

1. `visible`：不裁剪，内容溢出到盒子外显示，且可能影响外部布局。`hidden`：裁剪溢出部分，但仍**可以通过 JS 或键盘滚到**被裁掉的内容。`clip`：同样裁剪，且完全不可滚动（比 `hidden` 更彻底，也不会创建滚动容器）。
2. `scroll`：始终显示滚动条轨道（即使内容没溢出，移动端与 macOS 会隐藏轨道）。`auto`：内容溢出时才出现滚动条，是最常用的取值。
3. 与 BFC 的关系：非 `visible` 会创建 BFC，因此能清除浮动、阻止 margin 合并；代价是裁剪溢出内容，还会让内部 `position: sticky` 的参照变成该元素。
4. 单轴设置规则：当 `overflow-x` 与 `overflow-y` 一个是 `visible` 另一个不是时，`visible` 会被计算成 `auto`（这是"只想横向滚动却出现纵向滚动条"的原因）。另外可用 `overscroll-behavior: contain` 阻止滚动链传导到页面、`scrollbar-gutter: stable` 预留滚动条位置避免布局抖动。

```css
.scroll-x { overflow-x: auto; overflow-y: hidden; white-space: nowrap; }
/* 只写 overflow-x: auto 时，overflow-y 会变成 auto，可能多出纵向滚动条 */
```

**追问与易错点**：

- 追问：`overflow: auto` 的容器里元素 `position: sticky` 为什么不吸顶？答：该容器成了滚动容器，粘性定位相对它生效，若它自己不滚动就没有吸附距离（见 Q8）。
- 陷阱：用 `overflow: hidden` 清除浮动却裁掉了下拉菜单或 `box-shadow`，这是真实项目里最典型的副作用。
- 陷阱：认为 `overflow: hidden` 的内容不可滚动。用 `element.scrollTop` 或键盘 focus 仍可滚动，需要彻底不可滚用 `overflow: clip`。

### Q40 table 布局有哪些坑？border-collapse 有什么用？

**考察点**：考表格语义与现代替代方案，这类"老旧但常被问"的知识点很能体现基础厚度。

**参考答案**：

> **一句话结论**：`border-collapse: collapse` 让相邻单元格的边框合并为一条、`separate`（默认）则为每个单元格保留独立边框并用 `border-spacing` 控制间距；布局上有 `table-layout: fixed` 可让列宽由第一行或显式宽度决定、渲染更稳定。

1. `border-collapse`：表格默认是 `separate`，相邻单元格之间有间距（用 `border-spacing` 控制，默认 2px），且会出现双重边框。`collapse` 合并边框，视觉上是一条线，是后台表格的标准做法。
2. `table-layout`：`auto`（默认）按内容自动计算列宽，内容变化会导致列宽跳动；`fixed` 按表格宽度与首行 / `colgroup` 的宽度平均分配，渲染性能更好、列宽稳定，适合数据表格。
3. 常见坑：`collapse` 下 `border-radius` 与单元格阴影不生效（相邻边框合并后无法画圆角）；`position: sticky` 的表头需要 `separate` 或单独处理；单元格内 `margin` 完全不生效，只能用 `padding`；高度 `height` 只是"最小高度"。
4. 现代替代：布局用途不要用 `<table>`，用 Grid（`display: grid` / `grid-template-columns`）或 `display: table` 系列；数据表格仍应保留 `<table>` 语义以利无障碍。

```css
.table { width: 100%; table-layout: fixed; border-collapse: collapse; }
.table th, .table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
.table th { position: sticky; top: 0; background: #fff; } /* 表头吸顶 */
```

**追问与易错点**：

- 追问：为什么固定表头 + `border-collapse: collapse` 下边框会消失？答：collapse 模式下边框由表格统一绘制，滚动时定位表头的边框可能不跟随，常见做法是改用 `border-collapse: separate; border-spacing: 0` 或给 `th` 单独写 `box-shadow`。
- 陷阱：说 `table-layout: fixed` 下所有列都等宽。它按首行单元格宽度或整体宽度均分，显式设过宽度的列仍按设定值。
- 陷阱：忘了单元格内 `margin` 无效，用 `margin` 调间距怎么都不动，改用 `padding`。

### Q41 gap 只能在 Grid 用吗？Flex 和其他布局支持吗？

**考察点**：新特性的落地边界，考浏览器兼容意识。

**参考答案**：

> **一句话结论**：`gap` 最早是 Grid 专属，现在 Flex 容器和多列布局（`column-count`）也已支持；普通块级流式布局不支持，仍要用 `margin` 模拟。

1. Grid 从一开始就支持 `gap` / `row-gap` / `column-gap`。Flex 容器支持 `gap` 是后来加入的（Chrome 84、Safari 14.1、Firefox 63 起），写法相同。
2. Flex 里 `gap` 的优势：不需要用 `margin` 拼间距，也不用 `:last-child` 去掉末位多余边距；`gap` 只在项目**之间**生成间距，不参与 `justify-content` 的剩余空间分配，因此 `justify-content: space-between` 与 `gap` 可以同时使用。
3. 不支持的情况：多列布局外的普通块级排列、`float` 布局、老版本浏览器（如需支持 iOS 14 以下，得准备 `margin` 降级）。
4. 另有 `grid-gap`、`grid-row-gap` 等旧别名仍在维护中，新代码统一写 `gap`。

```css
.row { display: flex; gap: 12px; }        /* 现代写法 */
.row > * { margin-right: 12px; }          /* 降级方案，需处理末位多余间距 */
.row > *:last-child { margin-right: 0; }
```

**追问与易错点**：

- 追问：`gap` 与 `margin` 同时存在时怎么算？答：两者叠加，间距会变大，排查"间距莫名变大"时优先看是否两处都写了。
- 陷阱：说"Flex 不支持 gap"，这在 2020 年之后已经不成立，会被认为知识未更新；正确说法是"支持，但需注意旧浏览器"。
- 陷阱：把 `gap` 当作可以给任意元素加间距的通用属性。它不是 `margin` 的替代品，离开容器上下文没有效果。

### Q42 移动端 100vh 为什么会有问题？怎么解决？

**考察点**：移动端适配的高频真问题，考对动态视口单位的了解。

**参考答案**：

> **一句话结论**：移动浏览器的地址栏会收起/展开，但 `vh` 历史上按"最大视口"计算，导致 `100vh` 比可视区域高，底部内容被地址栏挡住；解法是改用 `dvh`（动态视口高度）或 `svh` / `lvh`，旧环境用 `window.innerHeight` 写 CSS 变量兜底。

1. 原因：`100vh` 取的是视口高度的最大值（大视口），当地址栏展开时实际可视高度更小，于是"满屏"元素会超出屏幕，出现页面能上下滚动一点、底部按钮被顶出视口的现象。
2. 现代解法：`100dvh`（dynamic viewport height，随地址栏变化）、`100svh`（small，按最小的可视高度，最保守）、`100lvh`（large，按最大）。移动端满屏布局首选 `dvh`，需要"绝不被挡住"用 `svh`。Chromium 108+、Safari 15.4+ 起支持。
3. 旧兼容解法：用 JS 监听 `resize` 与 `orientationchange`，把 `window.innerHeight` 写入 CSS 变量，样式里用 `height: var(--vh)`；注意加节流与 `visualViewport` 判断。
4. 其他替代：用 `height: 100%` 链式撑满（需 `html, body { height: 100% }`）、或用 `position: fixed; inset: 0` 让元素脱离文档流贴合视口。

```css
.screen { height: 100vh; height: 100dvh; } /* 不支持的浏览器忽略第二行 */
/* JS 兜底 */
/* document.documentElement.style.setProperty('--vh', window.innerHeight + 'px') */
```

**追问与易错点**：

- 追问：`svh` 和 `dvh` 该用哪个？答：希望高度随地址栏实时变化用 `dvh`；希望绝对不出现超出可视区、宁可略矮用 `svh`。
- 陷阱：只答"用 `100%` 代替"，但 `100%` 需要父级有确定高度，链式写错照样不生效。
- 陷阱：忽略键盘弹起时的视口变化，输入框被键盘遮住，这时要用 `visualViewport` 或 `scrollIntoView` 配合处理。

### Q43 display: none、visibility: hidden、opacity: 0 有什么区别？

**考察点**：隐藏元素的三种方式辨析，考占位、事件、动画与可访问性四个维度。

**参考答案**：

> **一句话结论**：`display: none` 彻底不渲染、不占位、不可交互、无法过渡；`visibility: hidden` 不渲染但**保留占位**、不可交互、可以过渡（可设延迟）；`opacity: 0` 正常渲染并占位、**仍可点击**、可平滑过渡。

| 方式 | 是否占位 | 是否可交互 | 子元素能否显示 | 过渡动画 | 触发回流 |
| --- | --- | --- | --- | --- | --- |
| `display: none` | 否 | 否 | 不能 | 不支持 | 是（重排） |
| `visibility: hidden` | 是 | 否 | 可以（子级设 `visible`） | 支持 | 否（重绘） |
| `opacity: 0` | 是 | 是（需配 `pointer-events: none`） | 不能（受父级影响） | 支持 | 否（重绘） |

1. `visibility` 可继承且子元素能独立覆盖，所以父级隐藏时可以让某个子元素仍然可见，这是它独一无二的能力；它还能做 `transition: visibility 0s .3s` 的延迟隐藏。
2. `opacity: 0` 常用于淡入淡出，但要记得加 `pointer-events: none`，否则透明元素会拦截点击；且它创建层叠上下文，可能影响 `z-index` 表现。
3. 可访问性差异：`display: none` 与 `visibility: hidden` 的内容不会被屏幕阅读器朗读，`opacity: 0` 的内容仍会被朗读，可能造成"看着空白但能听到内容"的错乱。

**追问与易错点**：

- 追问：只想让元素视觉上消失、布局不动、又要能过渡，用哪个？答：`opacity: 0` 加 `pointer-events: none`，或 `visibility: hidden` 配延迟过渡。
- 陷阱：把 `visibility: hidden` 说成会触发重排。它占位与几何都不变，只触发重绘；只有 `opacity`、`transform` 这类属性才可能连重绘都省掉、只做合成。
- 陷阱：用 `display: none` 做动画，`transition` 完全无效，因为元素不进渲染树，必须配合 `@keyframes` 或先显示再切类名。

### Q44 为什么 height: 100% 有时不生效？

**考察点**：百分比高度解析条件是基础硬知识，也是很多"撑不满屏幕"问题的根因。

**参考答案**：

> **一句话结论**：百分比高度必须能解析出参照值，也就是父元素要有**确定的**高度；父元素 `height: auto` 时百分比高度被当作 `auto` 处理，于是不生效。

1. 规则：`height` 的百分比相对包含块的高度计算（`padding` 百分比相对宽度）。包含块高度由内容决定（`auto`）时，就没有确定的参照值，声明失效。
2. 链式生效写法：从根一路给到目标元素，`html, body { height: 100% }`，再逐层 `height: 100%`。只要中间断一层，后面全部失效。
3. 更好的替代：全屏布局直接用视口单位 `100dvh` / `100vh`，或用 flex 让子元素拉伸（父级 `display: flex`、子项 `flex: 1`），或 Grid 的 `1fr` 行轨道。
4. 绝对定位元素的特例：父级是定位祖先时，绝对定位子元素的百分比高度参照其 padding box，所以只要有定位祖先且有确定高度就能生效。

```css
html, body { height: 100%; }              /* 链式方案，缺一不可 */
.app { display: flex; flex-direction: column; height: 100%; }
.app main { flex: 1; min-height: 0; }     /* 内容区自动填满剩余高度 */
```

**追问与易错点**：

- 追问：`min-height: 100%` 也失效怎么办？答：同样依赖父级确定高度；若只是想让内容不足时页面也撑满，用 `min-height: 100dvh` 或 `body { min-height: 100vh }` 更直接。
- 陷阱：只给目标元素写 `height: 100%` 而父级没有高度，然后怀疑是浏览器 bug。
- 陷阱：用 flex 时忘了 `min-height: 0`，内容区被内部长内容撑高而不出现内部滚动。

### Q45 margin 负值有什么用？会产生什么影响？

**考察点**：负 margin 是很多经典布局的实现基础，考理解是否到位。

**参考答案**：

> **一句话结论**：负 `margin` 让元素在布局计算中"占用更小的空间"，从而向外移动或与相邻元素重叠，是圣杯/双飞翼、抵消多余间距的常用手段，但它不改变元素自身尺寸，也不影响文档流顺序。

1. 四个方向的语义：`margin-left` 为负会让元素向左移动（或使右侧内容左移）；`margin-top` 为负让元素上移并与上方元素重叠；`margin-right` 为负会减少元素在行内占据的右侧空间。
2. 经典用法一：**负 margin 三栏布局**，把浮动侧栏从下一行拉回上一行（见 Q24）。
3. 经典用法二：**抵消列表末位或行末的多余间距**，例如卡片列表用 `margin-right: -16px` 包一层、子项 `margin-right: 16px`，让最右侧间距被吃掉；有了 `gap` 之后这类技巧基本可以退休。
4. 经典用法三：**视觉重叠与梯形/斜切装饰**，例如轮播图相邻项轻微重叠、卡片叠压效果。风险是负 `margin` 会导致父元素高度计算异常、滚动条与溢出问题，且负值过大时元素会被裁剪或覆盖到不该覆盖的位置。

```css
/* 抵消末尾间距的旧写法 */
.list { display: flex; flex-wrap: wrap; margin-right: -16px; }
.list > * { margin-right: 16px; }
/* 现代写法：.list { display: flex; flex-wrap: wrap; gap: 16px; } */
```

**追问与易错点**：

- 追问：负 `margin` 会影响元素自身宽度吗？答：不会。它只改变元素在布局中的位置与所占空间，元素盒子尺寸不变。
- 陷阱：用负 `margin` 做布局后，父元素出现高度塌陷或页面无法滚动到底，排查时看是否缺少 `overflow: hidden` 或应该改用 flex / grid。
- 陷阱：把负 `margin` 与 `position: relative` 混用做"位移"，两者都会创建层叠上下文或引发重叠，优先用 `transform: translate` 做纯视觉位移。

## 本章小结

- 盒模型用 `box-sizing: border-box` 统一，`width` 就包含了 padding 与 border，栅格不再被撑破。
- 外边距合并只发生在块级元素的垂直方向，三种情形都靠创建 BFC、加 padding/border 或改用 flex/grid 破解。
- BFC 的三条实用价值：清浮动、阻止 margin 合并、实现不被浮动覆盖的自适应两栏。
- 包含块决定百分比与偏移的参照：`absolute` 看最近的定位祖先 padding box，`fixed` 看视口，但 `transform` 会改写这两条规则。
- `z-index` 只对定位元素或已创建层叠上下文的元素生效，子元素的层级永远出不了父级层叠上下文。
- Flex 管一维、Grid 管二维；`flex: 1` 是 `1 1 0%`，配 `min-width: 0` 才能解决弹性项目溢出。
- 居中优先用 flex/grid，需要精确控制时用绝对定位 + `transform` 或 `margin: auto`，绝对定位 + `margin: auto` 依赖"过约束"才有剩余空间可分配。
- 长度单位按用途选：`rem` 做体系、`px` 做细节、`dvh` 替代 `100vh`，响应式尺寸优先 `clamp()` 与 `minmax()`。
- 能继承的是文字排版类属性，布局类属性不继承；优先用低权重选择器与 `:where()`，把 `!important` 留到最后手段。

<!-- COUNT: 45 -->

