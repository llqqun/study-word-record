---
title: "第 22 章 前端安全"
---

## 第 22 章 前端安全

### Q1 XSS 是什么？存储型、反射型和 DOM 型怎么区分？

**考察点**：能否说清 XSS 的本质是"数据被当成代码执行"，并准确指出三种类型的注入点与触发链路。

**参考答案**：

> **一句话结论**：XSS（跨站脚本攻击，Cross-Site Scripting）的本质是"用户可控的数据被浏览器当成 HTML 或 JS 执行了"，按注入位置分成存储型、反射型、DOM 型三种。

1. 存储型（Stored XSS）：恶意内容先落库（评论、昵称、富文本、工单），所有访问该页面的用户都会中招，不需要诱导点链接，影响面最大。
2. 反射型（Reflected XSS）：恶意脚本藏在请求参数里，服务端把它原样拼进响应 HTML，必须诱导用户点击构造好的链接才触发，不落库、一次性。
3. DOM 型（DOM-based XSS）：数据从头到尾没经过服务端，前端 JS 自己把不可信来源（`location.hash`、`location.search`、`document.referrer`、`postMessage` 数据）写进了危险位置（sink），如 `innerHTML`、`eval`、`document.write`。
4. 三者的共同点是"不可信数据流入了执行位置"，区别只在链路：经过服务端并落库的是存储型，经过服务端不落库的是反射型，纯前端自产自销的是 DOM 型。

| 类型 | 数据是否落库 | 触发方式 | 危害面 |
| --- | --- | --- | --- |
| 存储型 | 是 | 访问页面即触发 | 全体访客 |
| 反射型 | 否 | 点击恶意链接 | 单个受害者 |
| DOM 型 | 否 | 链接或前端逻辑 | 单个受害者 |

**追问与易错点**：

- 追问：DOM 型 XSS 服务端做转义能防住吗？答：防不住，因为数据没经过服务端，必须在 JS 的写入点做处理，或改用 `textContent`。
- 追问：现在哪种最多？答：现代 SPA 里 DOM 型占比明显上升，因为大量数据由前端路由参数和接口拼接进 DOM。
- 陷阱：把反射型等同于 DOM 型。反射型一定有服务端参与拼接，DOM 型一定没有。
- 陷阱：认为"触发 XSS 必须出现 `<script>`"。`<img src=x onerror=alert(1)>`、`<svg onload=...>` 都不含 `<script>`。

### Q2 说说你在项目里落地的 XSS 完整防御链，不能只答"转义"。

**考察点**：有没有分层防御意识，能不能说出每一层解决什么问题、哪一层是根本手段。

**参考答案**：

> **一句话结论**：XSS 必须按"输入约束 → 输出编码 → 危险 API 收敛 → 富文本净化 → CSP 兜底 → 凭证保护"分层防御，任何单点都不可靠。

1. 输入侧：对类型、长度、格式做白名单校验，只做"收窄"，不承担安全保证，因为过滤永远可能被编码、变形绕过。
2. 输出侧：按上下文编码（HTML 文本、属性、URL、JS、CSS 各一套规则），这是根本手段，做到位能消掉绝大多数 XSS。
3. 危险 API 收敛：统一改用 `textContent`、`createElement` + `setAttribute`，禁止用字符串拼 `innerHTML`，用 ESLint 规则卡住新增调用。
4. 富文本场景：不用整体转义，改用白名单净化（DOMPurify），并且前端和服务端各净化一次，因为前端可被绕过。
5. CSP 兜底：限制 `script-src`，即使注入成功也让脚本执行不了；它的定位是降低最坏情况的危害，不是替代编码。
6. 凭证保护：会话 Cookie 加 `HttpOnly` + `SameSite` + `Secure`，让 XSS 读不到 Cookie 本身（但仍能以用户身份发请求，所以它是压缩危害面的纵深防御，不能替代输出编码）。

```js
// 输出侧的根本手段：按上下文写入，而不是拼 HTML
el.textContent = userInput;                 // HTML 文本上下文
el.setAttribute('title', userInput);        // 属性上下文
el.href = safeUrl(userInput);               // URL 上下文要先校验协议
```

**追问与易错点**：

- 追问：这几层里哪层最重要？答：输出编码，因为它是唯一能保证"数据永远不被当代码"的层；CSP 和 HttpOnly 是降低后果的纵深防御。
- 陷阱：只答"输入过滤"。攻击载荷可以在别处被二次解码，只在入口过滤等于把安全押在"想到所有 payload"上。
- 陷阱：把 CSP 当成 XSS 的根治方案。配置不当（比如保留 `unsafe-inline`）时 CSP 基本失效。

### Q3 输出转义到底要转哪些字符？为什么必须按上下文转义？

**考察点**：是否知道转义的最小字符集与"上下文不同规则不同"这个核心判断，以及黑名单过滤为什么不可靠。

**参考答案**：

> **一句话结论**：HTML 实体编码至少要处理 `& < > " '` 五个字符，而且必须按数据最终落到的位置（HTML 文本、属性、URL、JS、CSS）选择对应规则；输入过滤优先白名单，黑名单永远穷举不完。

1. HTML 文本上下文：把 `& → &amp;`、`< → &lt;`、`> → &gt;`，属性值还要处理 `"` 与 `'`，否则可用 `"` 逃出属性再注入事件。
2. 上下文决定规则：URL 参数要 `encodeURIComponent`，JS 字符串要转义引号与 `</script>`，CSS 里要避免 `expression`；在 HTML 上下文做了 URL 编码等于没防。
3. 输入过滤优先白名单：如用户名只允许"中文、字母、数字、下划线"，不在集合内的一律拒绝，规则封闭、可验证。
4. 黑名单不可靠：`<script>` 被过滤了还有 `<img onerror>`、`<svg onload>`、大小写混写、`&#x6a;avascript:`、畸形标签（`<scr<script>ipt>`）等大量变形。
5. 落地建议：不要手写正则替换，直接用框架默认转义 + DOMPurify；手写要保证"一次编码、不重复解码"。

```js
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}
```

**追问与易错点**：

- 追问：已经转义了为什么还要做输入校验？答：转义保护展示环节，输入校验保护存储与业务逻辑（超长、非法字符导致的下游问题），两者解决不同问题。
- 陷阱：用 `replace(/<script>/gi, '')` 这种递归替换冒充过滤，`<scr<script>ipt>` 去掉一次后又会拼出 `<script>`。
- 陷阱：转义结果被二次 `innerHTML` 使用后又反转义，等于白做。

### Q4 innerHTML、document.write、eval 为什么危险？分别怎么替代？

**考察点**：能不能把危险 API 归到同一类本质，并给出可落地的替代写法。

**参考答案**：

> **一句话结论**：这些 API 的共同本质是"把字符串当作代码或 HTML 解释执行"，XSS 的触发点几乎都落在它们身上，替代思路是"用 DOM API 处理数据、用解析器处理数据"。

1. `innerHTML` / `outerHTML` / `insertAdjacentHTML`：浏览器把字符串解析成真实 DOM，`<img onerror>`、`<svg onload>` 会立刻执行；替代是 `textContent` 与 `createElement` + `appendChild`。
2. `document.write`：会在解析阶段重写文档，注入的 `<script>` 会同步执行；替代是用 DOM 操作或模板渲染插入节点。
3. `eval` / `new Function` / `setTimeout('code')`：直接把字符串当 JS 执行，是最彻底的代码注入；替代是 `JSON.parse` 处理数据、用函数引用而不是字符串。
4. `location` 相关：`location.href = 'javascript:...'`、`<a href="javascript:...">` 同样是执行入口；替代是白名单校验协议，只允许 `http/https/mailto`。
5. 第三方库也有等价点：jQuery 的 `.html()`、`.append(htmlString)`、`$('<div>' + input + '</div>')`，以及 Vue 的 `v-html`、React 的 `dangerouslySetInnerHTML`。

```js
// 危险
list.innerHTML = '<li>' + name + '</li>';
// 安全：用 DOM API 表达结构，用 textContent 表达数据
const li = document.createElement('li');
li.textContent = name;
list.appendChild(li);
```

**追问与易错点**：

- 追问：`textContent` 就绝对安全吗？答：作为写入点是安全的，但如果之后又把它读出来拼进 HTML，风险只是被推迟了。
- 追问：必须渲染 HTML 时怎么办？答：先用 DOMPurify 白名单净化，再交给 `innerHTML`，并且尽量收敛到统一组件里。
- 陷阱：只知道 `innerHTML` 危险，漏掉 `setTimeout(字符串)`、`insertAdjacentHTML`、jQuery 的 `.html()`。

### Q5 富文本编辑器的 XSS 该怎么防？它和普通文本场景有什么不同？

**考察点**：能不能识别"允许部分 HTML"这个特殊场景，并给出白名单净化 + 服务端二次净化 + 渲染隔离的完整方案。

**参考答案**：

> **一句话结论**：富文本是"允许一部分 HTML 存在"的场景，不能用整体转义，必须用白名单净化 + 服务端二次净化 + 渲染隔离来控制风险。

1. 数据定位：编辑器产出的 HTML 是"半可信"数据，前端净化只是第一道，服务端存储前必须再净化一次，因为用户可以绕过前端直接调接口。
2. 白名单策略：只保留必要标签（`p`、`br`、`strong`、`em`、`ul`、`ol`、`li`、`a`、`img`）和必要属性（`href`、`src`、`alt`），剥掉所有 `on*` 事件属性、`style`、`class`、`iframe`、`script`。
3. 协议校验：`href` 与 `src` 只允许 `http/https/mailto`，明确禁止 `javascript:`，`data:` 也要谨慎，因为 `data:text/html` 可以直接执行。
4. 用成熟库而不是自研正则：DOMPurify 持续跟进浏览器解析差异，配置 `ALLOWED_TAGS` / `ALLOWED_ATTR`；粘贴进来的内容统一走一次净化。
5. 渲染隔离：展示侧用 `iframe sandbox` 或独立域名承载富文本，配合 CSP，万一有漏网 payload 也拿不到主站权限。

```js
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(draftHtml, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img'],
  ALLOWED_ATTR: ['href', 'src', 'alt'],
  ALLOW_DATA_ATTR: false,
});
```

**追问与易错点**：

- 追问：为什么服务端还要再净化一遍？答：前端代码在用户浏览器里，改 JS、改请求都能跳过前端过滤，服务端才是可信边界。
- 追问：图片外链要不要处理？答：建议下载转存或走图片代理，既能防盗链也能避免 `src` 指向攻击者可控内容。
- 陷阱：只在前端过滤就上线，攻击者构造裸请求直接把 `<img src=x onerror=...>` 存进库，形成存储型 XSS。
- 陷阱：用整体 HTML 转义处理富文本，结果所有排版标签都被转成文本，功能直接坏掉。

### Q6 Vue 和 React 为什么默认能防 XSS？它们的默认保护到底做了什么？

**考察点**：是否理解框架的默认转义只是"输出编码的默认值"，并知道它的边界在哪。

**参考答案**：

> **一句话结论**：Vue 和 React 的默认行为都是"把数据当文本节点写入，而不是当 HTML 解析"，所以只要走标准插值就不会触发 XSS，风险全部来自显式的逃生舱口。

1. Vue：模板里的 `{{ msg }}` 编译后用 `textContent` 写入，`v-bind` 用 `setAttribute`，都不会解析 HTML。
2. React：JSX 里的 `{value}` 会被渲染成字符串子节点，属性值同样做转义，不会当作标签解析。
3. 这层保护的本质是"输出编码"，它只保证内容不被解释成标签，不保证内容语义安全：用户可控的 `href`、`src` 仍可能是 `javascript:` 协议。
4. 真正的入口是显式 API：`v-html` 与 `dangerouslySetInnerHTML`，它们的语义就等于手写 `innerHTML`，框架不会帮你净化。
5. SSR 场景要注意边界：服务端模板拼接出来的 HTML 不经过框架转义，凡是自己拼字符串的地方都要手动处理。
6. 版本差异：React 对 `javascript:` 协议的 URL 在开发环境给出警告，并在较新版本直接阻止；但这个行为不适合当作安全依赖，业务层仍要自己校验协议。

**追问与易错点**：

- 追问：那用了框架还会不会有 XSS？答：会。DOM 型注入、`v-html`、第三方组件、SSR 拼接、上传的 HTML/SVG 预览都是常见来源。
- 陷阱：认为"框架自带防 XSS"就可以不做任何校验，忽略 `href` 协议、`v-html`、富文本三类高危点。
- 陷阱：把框架的转义理解成"过滤"，以为框架会删掉危险内容；它只是编码，`innerHTML` 里再解析一次照样执行。

### Q7 v-html 和 dangerouslySetInnerHTML 的风险是什么？怎么收敛使用？

**考察点**：能不能承认这两个 API 的必要性，同时给出可执行的收敛方案与卡口机制。

**参考答案**：

> **一句话结论**：这两个 API 的语义就是 `innerHTML`，只有"内容确实可信"或"已经过白名单净化"时才允许使用，并且必须收敛到统一组件里、用 lint 规则卡住散落调用。

1. 风险：内容里的 `<img src=x onerror=...>`、`<svg onload=...>`、`<a href="javascript:...">` 都会直接执行，等于把 XSS 入口开放给数据源。
2. 收敛一：封装统一的 `SafeHtml` 组件，内部强制 `DOMPurify.sanitize`，业务代码禁止直接调用原始 API。
3. 收敛二：配置 ESLint 卡口——React 用 `react/no-danger`，Vue 用 `vue/no-v-html`，把例外集中到白名单文件里并注明理由。
4. 收敛三：能用结构化数据就别用 HTML。富文本更适合存成 JSON 节点数组（块、文本、链接各一个节点），渲染时映射成组件，从根上不需要 `innerHTML`。
5. 收敛四：配合 CSP 与独立域名渲染，让净化万一漏过也拿不到主站 Cookie 与接口权限。

```js
// SafeHtml：唯一的出口，业务侧只允许用它
import DOMPurify from 'dompurify';
export default {
  props: { html: { type: String, required: true } },
  computed: { safe() { return DOMPurify.sanitize(this.html); } },
  template: '<div v-html="safe"></div>',
};
```

**追问与易错点**：

- 追问：为什么不用正则自己过滤一遍？答：HTML 解析规则极其宽松，畸形标签、编码变形、注释绕过都能打穿正则，交给专门的净化库。
- 追问：净化放在前端够吗？答：不够，服务端写入前必须再净化一次，前端只是减少展示时的风险。
- 陷阱：把 `dangerouslySetInnerHTML` 的 `dangerously` 当成"只是个命名风格"，忽略它是明确的危险信号。
- 陷阱：以为净化一次就永久安全，之后数据被二次拼接（例如再拼上用户头像 HTML）时又引入新风险。

### Q8 CSP 怎么配？nonce 和 hash 有什么区别，该怎么选？

**考察点**：是否理解 CSP（内容安全策略，Content Security Policy）的配置思路，以及 nonce/hash 解决的是"内联脚本"这个具体问题。

**参考答案**：

> **一句话结论**：CSP 是通过响应头告诉浏览器"哪些来源的资源可以加载执行"的白名单机制，配置思路是从 `default-src 'self'` 起步逐项放开；内联脚本用 nonce 或 hash 放行，动态注入多选 nonce + `strict-dynamic`，固定脚本选 hash。

1. 基本思路：先收紧 `default-src 'self'`，再按需放开 `script-src`、`style-src`、`img-src`、`connect-src`，同时显式设置 `object-src 'none'`、`base-uri 'self'`、`frame-ancestors 'none'`、`form-action 'self'`。
2. 内联脚本是 XSS 的主要载体，所以目标是去掉 `'unsafe-inline'`；但很多项目必须保留一段内联初始化脚本，就用 nonce 或 hash 精确放行。
3. nonce：服务端每次响应生成不可预测的随机串，注入到合法的内联 `<script nonce="...">` 上，同时写进响应头；特点是每次请求都不同，适合 SSR 动态注入。
4. hash：对固定内联脚本内容计算 `sha256/384/512` 写进策略，内容不变就一直有效；适合静态 HTML 里写死的脚本，缺点是改一个字符就要重新计算。
5. 现代组合：`nonce + 'strict-dynamic'`，受信任脚本动态创建的脚本自动继承信任，可以避免维护一长串 CDN 白名单。
6. 上线节奏：先用 `Content-Security-Policy-Report-Only` 观察一段时间，收敛完违规来源再切正式头，并配 `report-to` 持续收集拦截日志。

```html
<!-- 响应头 -->
Content-Security-Policy: default-src 'self'; script-src 'nonce-r4nd0m' 'strict-dynamic' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; report-to csp-endpoint

<!-- 页面内的合法内联脚本带上同一个 nonce -->
<script nonce="r4nd0m">window.__BOOT__ = {/* ... */}</script>
```

**追问与易错点**：

- 追问：nonce 和 hash 怎么选？答：SSR、内联脚本内容随请求变化选 nonce；纯静态、内容固定选 hash；两者都能用时优先 nonce，配合 `strict-dynamic` 更好维护。
- 追问：nonce 能写死在 HTML 里吗？答：不能，写死等于攻击者也知道，nonce 的全部价值在于每次响应都不同且不可预测。
- 陷阱：以为加了 CSP 还能靠 `'unsafe-inline'` 兜底。从 CSP Level 2 起，只要 nonce 或 hash 存在，`'unsafe-inline'` 就会被忽略，行为与预期不一致。
- 陷阱：只配 `default-src` 不配 `base-uri`，攻击者可用 `<base>` 标签改写相对路径脚本的解析地址。

### Q9 CSP 有哪些局限？常见的绕过方式是什么？

**考察点**：能不能跳出"配了 CSP 就安全"的直觉，说清 CSP 与输出编码的分工以及真实绕过面。

**参考答案**：

> **一句话结论**：CSP 是兜底而不是替代，配置不当或存在 DOM 型 XSS 时它基本失效；它的实际价值取决于是否真的禁掉了内联脚本与"可控的脚本来源"。

1. 不配置或形同虚设：只写 `default-src *`、或为了兼容内联事件保留 `'unsafe-inline'`，CSP 就失去了意义。
2. 白名单来源被滥用：策略里允许的 CDN 或 `'self'` 下，如果存在 JSONP 回调、可上传 JS 的目录、用户可控的静态文件，攻击者可以借这些合法来源加载自己的脚本。
3. `base-uri` 缺失：注入一个 `<base href="https://evil.com/">`，页面后续相对路径的脚本就会从攻击者域名加载。
4. `strict-dynamic` 的信任传递：它把信任交给已受信任脚本动态插入的子脚本，如果这个链路里存在可控输入，等于把口子重新打开。
5. DOM 型 XSS 的注入内容不经过服务端，nonce/hash 匹配不上；但只要脚本策略里没有 `'unsafe-inline'` / `'unsafe-eval'`，`innerHTML` 注入的内联事件处理器与 `eval` 仍会被拦截，CSP 真正管不到的是合法来源内的可控脚本与 sink 本身，后者要靠 Trusted Types（`require-trusted-types-for 'script'`）约束。
6. 只能限制执行，不能阻止外带：注入成功后仍可能用悬挂标记、表单提交、图片请求把页面数据发出去，所以输出编码始终是根本手段。

**追问与易错点**：

- 追问：CSP 能防 CSRF 吗？答：不能。CSP 管的是资源加载与脚本执行，CSRF 要靠 SameSite、Token 与来源校验。
- 追问：CSP 和 X-Frame-Options 什么关系？答：`frame-ancestors` 是 CSP 的指令，功能覆盖并优于 `X-Frame-Options`，同时下发时以 `frame-ancestors` 为准。
- 陷阱：以为配了 CSP 就可以放心用 `innerHTML`，把兜底当成了防线。
- 陷阱：只记得 `script-src`，忘了 `connect-src`（数据外带）、`form-action`（表单外发）、`base-uri`（路径劫持）。

### Q10 CSRF 的攻击原理是什么？它和 XSS 有什么区别？

**考察点**：是否理解"浏览器自动携带凭证"这个前提，并能清晰对比 CSRF 与 XSS 的能力差异。

**参考答案**：

> **一句话结论**：CSRF（跨站请求伪造，Cross-Site Request Forgery）是攻击者借用用户浏览器里"自动携带的登录凭证"，让用户在不知情的情况下发出一个状态变更请求。

1. 前提条件：用户已登录目标站点，浏览器在发往该域的请求里会自动带上 Cookie，攻击者不需要知道 Cookie 的内容。
2. 典型形态：图片标签即可发起 GET，隐藏表单加自动提交脚本可发起 POST，用户看到的只是一个普通页面。
3. 攻击能力：只能"以用户身份发请求"，通常读不到响应（受同源策略限制），但足以完成转账、改密、加管理员这类不可逆操作。
4. 与 XSS 的区别：XSS 是"在目标站执行攻击者的代码"，能读页面、能操作用户、能直接偷凭证；CSRF 是"冒用身份发一个请求"，只能做副作用。
5. 两者关系：有 XSS 就不需要 CSRF（XSS 能直接读 token 并发请求）；有 CSRF 不代表有 XSS，所以两种防御都要做。

```html
<!-- 攻击者页面：用户一打开就向银行发请求，Cookie 自动带上 -->
<img src="https://bank.com/transfer?to=evil&amount=10000" width="0" height="0" />
<form id="f" action="https://bank.com/transfer" method="POST">
  <input name="to" value="evil" /><input name="amount" value="10000" />
</form>
<script>document.getElementById('f').submit();</script>
```

**追问与易错点**：

- 追问：为什么用 GET 做状态变更最危险？答：GET 可以被 `img`、`link`、`script` 等各种标签静默触发，防护面比 POST 大得多；状态变更应一律用 POST/PUT/DELETE。
- 追问：接口里带了 Token 是不是就安全了？答：要看 Token 放在哪。放在 Cookie 里会被自动携带，一样能被 CSRF 利用；放在自定义头里才构成额外防线。
- 陷阱：认为"前后端分离、接口是 JSON 就不会有 CSRF"。简单请求和表单仍可跨站发出，只是读不到响应而已。

### Q11 CSRF 有哪些防御手段？SameSite、Token、来源校验怎么选？

**考察点**：能不能给出分层、可组合的防御方案，并说清每种的适用场景与代价。

**参考答案**：

> **一句话结论**：CSRF 防御的核心是"让攻击者构造的请求无法通过校验"，实践中是 SameSite + CSRF Token + 来源校验三层组合，关键操作再叠加二次验证与幂等设计。

1. SameSite：Cookie 设置 `SameSite=Lax` 能挡住绝大多数跨站 POST，成本最低；注意"不显式声明就按 Lax 处理"只在 Chrome 80+、Edge 86+ 等部分浏览器成立，Firefox 与 Safari 并不默认 Lax，所以必须显式声明；`Strict` 更严但会影响从外部链接跳回后的登录态；确实需要跨站的场景要用 `None`，此时必须同时带 `Secure`。
2. CSRF Token（同步器令牌）：服务端在页面或 Cookie 中下发随机 token，请求时放在表单隐藏域或自定义请求头，服务端校验；用自定义头（如 `X-CSRF-Token`）时还多一层保护，因为跨站表单无法自定义请求头。
3. 来源校验：优先校验 `Origin`（跨站的非 GET 请求与 CORS 请求由浏览器强制携带、页面脚本无法篡改；跨站 GET 导航、`img` 与表单 GET 通常不带，所以状态变更必须禁用 GET），`Referer` 作为补充（可能被 `Referrer-Policy` 裁掉或为空时要有策略）。
4. 二次验证：改密码、转账、删除账号等高危操作要求重新输入密码或短信验证码，即使请求被伪造也无法完成。
5. 关键操作幂等：一次性 token、请求去重、状态机校验（如"订单只有待支付状态才能支付"），把重放和重复提交一并挡掉。
6. 补齐细节：状态变更不用 GET，敏感响应加 `Cache-Control: no-store`；同时记住 XSS 能读走 token，所以 XSS 防御优先级更高。

```js
// 前端统一在请求头带上 CSRF Token（token 由服务端下发，存在可读 Cookie 或页面里）
axios.defaults.headers.common['X-CSRF-Token'] = getCookie('csrf_token');
// 服务端侧
// Set-Cookie: session=xxx; HttpOnly; Secure; SameSite=Lax; Path=/
```

**追问与易错点**：

- 追问：SameSite 能完全替代 CSRF Token 吗？答：不能。它依赖浏览器支持与默认值，且老浏览器可能忽略；Token 是服务端能自己控制的强校验。
- 追问：为什么校验 Origin 比 Referer 优先？答：Origin 由浏览器设置、无法被页面 JS 修改，且不会像 Referer 那样被隐私策略裁剪。
- 陷阱：把 CSRF Token 放在 Cookie 里自动发送、服务端再读 Cookie 比对，这等于没校验（攻击者请求里同样会带上）。
- 陷阱：认为"加了验证码就没有 CSRF"，验证码只覆盖个别接口，其它接口依然暴露。

### Q12 CORS 配错会带来什么风险？通配符、凭证和 null origin 该怎么处理？

**考察点**：能否区分 CORS 与 CSRF 的作用范围，并识别几种最危险的错误配置。

**参考答案**：

> **一句话结论**：CORS（跨域资源共享，Cross-Origin Resource Sharing）配错的典型后果是"任意网站都能带着用户凭证读取你的接口数据"，比 CSRF 更严重，因为它泄露的是数据本身。

1. `Access-Control-Allow-Origin: *` 只适合完全公开的接口；只要接口返回用户数据，通配符就意味着任何站点都能读到。
2. 通配符与 `Access-Control-Allow-Credentials: true` 不能共存，浏览器会直接拒绝；有人为了"要带 Cookie"改成回显请求里的 `Origin`，这就等于对所有站点开放。
3. 反射 Origin（不校验白名单、原样回显）配合 `credentials: 'include'`，攻击者页面可以直接读走响应正文。
4. `null` origin 来自 `file://` 打开的页面、`sandbox` iframe、`data:` URL 或某些跨域重定向；一旦服务端放行 `null`，本机任意 HTML 文件都能读你的接口。
5. 作用范围要记清：CORS 只限制"读取响应"，不阻止请求发出，所以简单请求依然能造成 CSRF 副作用，两者要分开防。
6. 正确姿势：白名单精确匹配（含协议、域名、端口）、响应加 `Vary: Origin` 防止 CDN 缓存串味、最小化 `allow-methods` 与 `allow-headers`，敏感接口额外校验业务凭证。

```js
// 危险：回显任意 Origin 且允许凭证
res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
res.setHeader('Access-Control-Allow-Credentials', 'true');

// 安全：严格白名单
const allow = ['https://app.example.com'];
const origin = req.headers.origin;
if (allow.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
}
```

**追问与易错点**：

- 追问：CORS 是服务端安全机制吗？答：不是，它是浏览器的"读取策略"，服务端只是通过头部声明授权；真正的鉴权必须靠服务端自己的身份校验。
- 追问：为什么不能用后缀匹配做白名单？答：`https://evil-example.com` 能通过 `endsWith('example.com')` 之类的判断，必须解析后比 origin。
- 陷阱：以为"没配 CORS 就安全"。不返回 CORS 头只是禁止浏览器读取，请求照样发出，接口若没有鉴权一样被改数据。

### Q13 点击劫持怎么防？X-Frame-Options 和 iframe sandbox 各解决什么问题？

**考察点**：能否分清"我被别人嵌"（点击劫持）和"我嵌别人"（sandbox 隔离）这两个方向的安全问题。

**参考答案**：

> **一句话结论**：点击劫持（Clickjacking）是用透明 iframe 盖住真实按钮骗取点击，防御靠 CSP `frame-ancestors`（首选）与 `X-Frame-Options`；而 `iframe sandbox` 解决的是"嵌入第三方内容时不被它反噬"。

1. 攻击原理：攻击页面用 `position: absolute` + 高 `z-index` + `opacity: 0` 的 iframe 覆盖在诱饵按钮上，用户以为在点"领取奖励"，实际点在目标站的"确认转账"。
2. `X-Frame-Options: DENY | SAMEORIGIN` 能直接禁止被嵌，兼容性广，但 `ALLOW-FROM` 兼容性差、不支持配置多个域名。
3. CSP `frame-ancestors 'none' | 'self' https://a.com` 是标准替代方案，支持多来源，且优先级高于 `X-Frame-Options`，新项目应优先用它。
4. JS 的 frame busting（`if (top !== self) top.location = ...`）不可靠，可被 `sandbox` 或响应头反制，只能作为历史兼容的补充手段。
5. `iframe sandbox` 默认禁止脚本、表单提交、弹窗和顶层导航；要执行脚本必须显式加 `allow-scripts`。
6. 关键规则：`allow-scripts` 与 `allow-same-origin` 同时给、且被嵌页面与父页同源时，被嵌页面能自己移除 `sandbox` 属性，等于没隔离；嵌第三方内容时也不要给 `allow-top-navigation`。

```html
<!-- 服务端响应头：我自己不被别人嵌 -->
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY

<!-- 前端：我嵌第三方内容，给它最小权限 -->
<iframe src="https://third.party/widget" sandbox="allow-scripts allow-forms"
        referrerpolicy="no-referrer" loading="lazy"></iframe>
```

**追问与易错点**：

- 追问：`X-Frame-Options` 和 `frame-ancestors` 同时下发听谁的？答：现代浏览器以 `frame-ancestors` 为准，所以想在某个域名放开时不要只改 `X-Frame-Options`。
- 陷阱：以为 iframe 里的内容天然隔离。不设 `sandbox` 时，同源 iframe 能操作父页面 DOM，它自身出问题会直接连累主站。
- 陷阱：只防了主站首页，忘了支付页、后台页等关键页面也要下发同样的头。

### Q14 开放重定向是什么？防御里的白名单应该怎么写？

**考察点**：能否理解开放重定向作为钓鱼与 OAuth 跳板的危害，并写出能扛住常见绕过的校验逻辑。

**参考答案**：

> **一句话结论**：开放重定向（Open Redirect）本身不算高危漏洞，但它是钓鱼和 OAuth 凭证窃取的跳板，防御方式只有一种可靠做法——只允许站内相对路径，跨域跳转走精确白名单。

1. 原理：`/login?redirect=https://evil.com`，用户登录成功后跳到攻击者站点；因为起点是可信域名，钓鱼页面的可信度极高。
2. 危害升级：在 OAuth 授权流程里，如果 `redirect_uri` 校验宽松，攻击者能让授权码或 token 直接发送到自己的域名，等于账号接管。
3. 首选方案：只接受站内路径，例如 `/user/profile`；拼接前校验必须以单个 `/` 开头，禁止 `//` 与 `/\`（浏览器会把它们当成协议相对地址）。
4. 次选方案：确实要跳到外部域名时，用白名单对解析后的 `origin` 做精确匹配，绝不用 `includes('trusted.com')` 这类字符串包含判断。
5. 常见绕过手法：`//evil.com`、`https://trusted.com.evil.com`、`https://evil.com#@trusted.com`、`https://evil.com\@trusted.com`、URL 编码与控制字符、大小写与末尾点号。
6. 稳妥写法：用 `new URL(input, location.origin)` 解析，再比较 `url.origin` 是否在白名单里、`url.protocol` 是否为 `https:`。

```js
const ALLOW = new Set(['https://app.example.com']);
function safeRedirect(input) {
  if (typeof input !== 'string') return '/';
  if (/^\/(?![/\\])/.test(input)) return input;   // 站内单斜杠路径，排除 // 与 /\（浏览器把反斜杠当斜杠）
  try {
    const url = new URL(input, location.origin);
    if (url.protocol !== 'https:') return '/';
    return ALLOW.has(url.origin) ? url.href : '/';  // 精确比对 origin
  } catch { return '/'; }
}
```

**追问与易错点**：

- 追问：为什么字符串包含判断不安全？答：`https://trusted.com.evil.com` 里包含 `trusted.com`，但它属于攻击者域名。
- 陷阱：只对 `redirect` 参数做了校验，忘了 `returnUrl`、`callback`、`next`、`continue` 这些同义参数，任意一个都能绕过。
- 陷阱：以为"跳转是前端做的所以不用管"，服务端 302 同样能被利用，前后端都要校验。

### Q15 postMessage 怎么用才安全？targetOrigin 和 origin 校验分别该注意什么？

**考察点**：是否知道 `postMessage` 是一个默认不校验的 API，并能写出正确的双向校验。

**参考答案**：

> **一句话结论**：`postMessage` 是跨域通信的标准方式，但它默认不校验来源——发送时必须指定精确的 `targetOrigin`，接收时必须校验 `event.origin` 与 `event.source`。

1. 发送侧：`otherWindow.postMessage(data, 'https://a.example.com')`。第二个参数写 `'*'` 表示不校验目标窗口当前的源，一旦该窗口被导航到攻击者页面，数据就会直接送到对方手里，敏感数据绝不能这样发。
2. 接收侧：必须校验 `event.origin === 'https://a.example.com'`，不能用 `indexOf`、`startsWith`、正则模糊匹配，因为 `https://a.example.com.evil.com` 能通过这类判断。
3. 需要更强保证时再校验 `event.source === expectedIframe.contentWindow`，防止同源或其它 iframe 冒充发送方。
4. `event.data` 必须当作不可信输入：不能直接 `innerHTML`、不能 `eval`、不能拼 SQL，要走与普通用户输入完全一致的校验与编码；结构化数据用 JSON 并逐字段校验类型。
5. 一对一的请求-响应场景优先用 `MessageChannel` 的 port 通信，减少广播面，也天然限定了通信双方。
6. 如果协议是自己设计的，建议带一个随机 token 或版本号，并做消息数量与频率限制，避免被当作放大攻击的通道。

```js
// 发送方
iframe.contentWindow.postMessage({ type: 'resize', height: 320 }, 'https://a.example.com');

// 接收方
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://a.example.com') return;   // 精确匹配，不用 indexOf
  const { type, height } = event.data || {};
  if (type !== 'resize' || typeof height !== 'number') return;
  document.getElementById('box').style.height = Math.min(height, 800) + 'px';
});
```

**追问与易错点**：

- 追问：为什么不能用 `'*'`？答：`'*'` 不校验目标窗口当前的源，窗口一旦被导航到任意站点，消息就会送到那个站点手里。
- 陷阱：只校验了 origin，忘了校验消息结构，攻击者用合法来源发一个畸形 `data` 就能引发前端异常甚至注入。
- 陷阱：把 `event.origin` 写成 `event.origin.indexOf('example.com') > -1`，一眼就能被 `example.com.evil.com` 打穿。

### Q16 target="_blank" 有什么安全隐患？noopener 和 noreferrer 的区别是什么？

**考察点**：是否知道反向标签劫持，以及现代浏览器的默认行为与显式声明的必要性。

**参考答案**：

> **一句话结论**：`target="_blank"` 打开的新页面能通过 `window.opener` 反向操作原页面（反向标签劫持），现代浏览器已默认加 `noopener`，但显式写 `rel="noopener noreferrer"` 才稳。

1. 攻击原理：新页面持有 `window.opener` 引用后，可以把 `opener.location` 改成钓鱼页；用户回到原标签时看到的已经是攻击者页面，而地址栏域名可能已经被替换。
2. 浏览器现状：Chrome 88+、Firefox 79+、Safari 12.1+ 对 `target="_blank"` 隐式加上了 `noopener`，但老浏览器和部分 App 内置 WebView 不一定，不能依赖默认值。
3. `noopener`：新窗口的 `window.opener` 为 `null`，断掉反向引用；这是安全属性。
4. `noreferrer`：同时不发送 `Referer` 请求头，且隐含 `noopener` 的效果；对隐私更友好，但会让目标站拿不到来源，影响它做来源校验或统计。
5. JS 打开窗口同理：`window.open(url, '_blank', 'noopener')`，或打开后设置 `w.opener = null`。
6. 如果业务确实需要从新窗口回跳（如第三方支付），不要依赖 `opener`，改用 `postMessage` 显式通信并校验来源。

```html
<a href="https://third.party/page" target="_blank" rel="noopener noreferrer">外部链接</a>
```

**追问与易错点**：

- 追问：`rel="nofollow"` 能替代吗？答：不能，`nofollow` 是给搜索引擎看的（不传递权重），与 `window.opener` 安全无关。
- 陷阱：只在外链组件里加了 `rel`，漏掉富文本渲染出来的 `a` 标签、公告内容、用户签名等动态生成的链接。
- 陷阱：以为设了 `noreferrer` 就万事大吉，忽略它会让目标站收不到 Referer，可能影响对端的防盗链或白名单策略。

### Q17 中间人攻击和混合内容怎么防？前端加密能替代 HTTPS 吗？

**考察点**：能否建立"HTTPS 是一切前端安全前提"的判断，并说清前端加密的真实边界。

**参考答案**：

> **一句话结论**：HTTPS 是前端所有安全机制的前提；前端加密不能替代 HTTPS，因为要保护的脚本和密钥本身都是由服务器下发的。

1. 中间人攻击（Man-in-the-Middle，MITM）：明文 HTTP 下，链路中任意一跳（公共 Wi-Fi、代理、运营商）都能查看和篡改响应，插入一段脚本就等价于一次全站 XSS。
2. 混合内容（Mixed Content）：HTTPS 页面里加载 HTTP 资源会破坏整体安全性；现代浏览器直接阻止主动型混合内容（脚本、iframe、XHR），被动型（图片、音视频）会警告或自动升级为 HTTPS。
3. 基础加固：全站 HTTPS，HTTP 请求 301 跳转到 HTTPS，并下发 HSTS（`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`）让浏览器强制走 HTTPS。
4. 前端加密为什么无效：JS 是服务器下发的，中间人能改这段 JS 把加密逻辑换成明文上报；密钥写死在前端代码里等于把密钥公开，任何人 F12 就能拿到。
5. 前端真正能做且有意义的事：密码预哈希（服务端仍需再哈希）、基于用户输入口令的端到端加密、给用户展示明确的安全提示；这些都属于纵深防御。
6. 结论：机密性与完整性的责任在 TLS 与服务端存储加密，前端加密最多算一层补充，威胁模型说不清就不做。

**追问与易错点**：

- 追问：HSTS 为什么还需要 preload？答：首次访问仍可能走 HTTP 被劫持，preload 让浏览器内置该域名的强制 HTTPS 列表，消除首次访问窗口。
- 追问：接口参数用 RSA 加密算前端加密吗？答：如果公钥写死在前端、私钥在服务端，只能防"抓包看明文"，不能防篡改，也不能防中间人替换公钥，价值有限。
- 陷阱：在 HTTP 站点上做前端加密并认为"数据安全了"，实际上攻击者直接改脚本就能拿到明文和密钥。
- 陷阱：只给登录页上了 HTTPS，其它页面仍是 HTTP，Cookie 一旦在 HTTP 请求里发送就可能被截获。

### Q18 Token 存 localStorage 还是 Cookie？各自的取舍是什么？

**考察点**：能不能从 XSS 与 CSRF 两个威胁方向做取舍，而不是背一句"Cookie 更安全"。

**参考答案**：

> **一句话结论**：没有绝对安全的存储位置，核心取舍是"XSS 能不能读到"和"CSRF 能不能被利用"；常见折中是 access token 放内存、refresh token 放 HttpOnly Cookie。

1. `localStorage` / `sessionStorage`：任意同源 JS 都能读，一旦发生 XSS 直接失守；但它不随请求自动发送，天然免疫 CSRF，且刷新页面不丢。
2. Cookie：`HttpOnly` 挡住 JS 读取，能显著降低 XSS 窃取凭证的概率；但它会随请求自动发送，必须配 `SameSite` 与 `Secure`，否则要防 CSRF。
3. 内存变量（Pinia/Redux/闭包）：XSS 下同样能被读取，但不会被持久化到磁盘，刷新即失，风险窗口更短，也更不容易被第三方脚本顺手带走。
4. 推荐组合：短期 access token 放内存 + refresh token 放 `HttpOnly; Secure; SameSite=Lax/Strict; Path=/api/refresh` 的 Cookie；接口用 Authorization 头带 access token，刷新接口只认 Cookie。
5. 无论放哪里，都要配合其它防线：短过期时间、异常登录检测、CSP 与 XSS 防护；存储位置只是把风险从一类攻击挪到另一类，不会消灭风险。

| 存储位置 | XSS 可读 | 自动携带（CSRF 风险） | 刷新是否保留 |
| --- | --- | --- | --- |
| localStorage | 是 | 否 | 是 |
| 内存变量 | 是 | 否 | 否 |
| Cookie（HttpOnly） | 否 | 是 | 是 |

**追问与易错点**：

- 追问：那 `localStorage` 是不是绝对不能用？答：如果业务必须长登录且没有 HttpOnly Cookie 条件，用它可以接受，但必须把 XSS 防护做到位，并缩短 token 有效期。
- 陷阱：把 refresh token 放在 `localStorage` 里长期不过期，等于给 XSS 一把永久钥匙。
- 陷阱：以为加了 `HttpOnly` 就不用管 CSRF，实际上自动携带 Cookie 正是 CSRF 成立的前提。

### Q19 JWT 在前端要注意什么？为什么服务端不能主动失效它？

**考察点**：是否理解 JWT 的无状态特性带来的撤销难题，以及 `alg` 混淆的责任边界。

**参考答案**：

> **一句话结论**：JWT 在前端的核心认知是"它只是可被解析的凭证，不是加密数据，且服务端默认无法主动失效"；验签是服务端的职责，前端不该承担。

1. payload 只是 Base64URL 编码，任何人复制到解码工具就能看到，所以不能放手机号、身份证、内部权限清单等敏感信息。
2. 无状态带来的撤销难题：签发后到 `exp` 之前一直有效，用户改密码、登出、被踢下线都无法让它立刻失效。
3. 缓解方式：短过期时间 + refresh token 轮换（每次刷新换新的并作废旧的）；或服务端维护黑名单、`jti` 白名单、用户级 `tokenVersion`，用一点状态换可控性。
4. 过期与刷新体验：前端要处理 401 自动刷新、刷新失败跳登录，并做并发刷新去重（多个请求同时 401 只能触发一次刷新，其余请求排队等待）。
5. `alg` 混淆（把 RS256 改成 HS256、或使用 `alg: none`）本质是服务端验签实现缺陷；前端能做的是不要把公钥/密钥下发到浏览器、不要擅自"校验"token。
6. 传输与暴露面：不要放在 URL 查询参数里（会进访问日志、Referer 和历史记录），优先放 `Authorization: Bearer` 头；前端可以用 `exp` 做提前刷新的体验优化，但不能把"前端校验通过"当作已认证。

```js
// 并发刷新去重：多个请求同时 401，只发起一次 refresh
let refreshing = null;
function ensureToken() {
  if (!refreshing) {
    refreshing = fetch('/api/refresh', { method: 'POST', credentials: 'include' })
      .then((r) => r.json()).then((d) => { store.accessToken = d.token; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}
```

**追问与易错点**：

- 追问：前端需要对 JWT 验签吗？答：不需要也没意义。前端代码可被篡改，验签结果不可信，真正的校验必须在服务端。
- 陷阱：以为 JWT 是加密的，把敏感信息塞进 payload；也以为"token 有效期内登出就是失效了"。
- 陷阱：把 `alg` 混淆当成前端要处理的问题。这是服务端必须固定算法、拒绝 `none` 才能解决的。

### Q20 前端有哪些敏感信息泄露渠道？怎么防？

**考察点**：能不能建立"前端代码就是公开的"这个基本判断，并列出真实的泄露渠道与整改动作。

**参考答案**：

> **一句话结论**：前端代码和打包产物都应视为已公开，任何写进里面的东西都算泄露；防御思路是把敏感数据与敏感操作全部推到服务端。

1. 打包产物：接口内网地址、第三方 AK/SK、测试账号常被打进 bundle；构建期环境变量只应注入公开配置（CDN 域名、公开 appId），私密配置留在服务端。
2. sourcemap：`.map` 会把源码结构、注释、接口路径完整暴露；生产环境要么不生成，要么只上传到内部错误监控平台，绝不随静态资源发布。
3. `console` 与注释残留：调试日志会打印 token、手机号、完整响应体；TODO 注释经常写着内部域名和账号密码。
4. Git 泄露：`.env`、密钥一旦提交，即使立刻删除，历史记录里仍然存在，还可能被公开仓库或 `.git/` 目录暴露；正确做法是轮换密钥 + 全历史扫描（gitleaks 等），而不是只 `revert`。
5. 其它常见渠道：把后端错误堆栈直接展示给用户、静态目录可列目录、备份文件（`.zip`、`db.sql`）和 `.git/` 可访问、接口返回前端不需要的超量字段（越权信息）。
6. 整改清单：最小化打包信息、生产关闭 sourcemap、错误上报与日志脱敏、CI 加密钥扫描与产物扫描、上线前用 `.git`、`.env`、备份文件探测做一次自检。

**追问与易错点**：

- 追问：`process.env.XXX` 用在前端安全吗？答：构建时会被字符串替换进产物，只有 `VITE_`、`PUBLIC_` 这类显式公开前缀的变量才应该放进去。
- 追问：接口地址被看到要紧吗？答：如果接口自己有鉴权就不算漏洞，但如果它同时暴露了内网地址、未授权接口或调试参数，就是实打实的风险。
- 陷阱：以为"做了 JS 混淆就等于加密"，混淆只提高阅读成本，字符串常量照样能被搜出来。
- 陷阱：删了提交但没换密钥，攻击者早已拉取了历史版本，等于没处理。

### Q21 依赖安全怎么防？npm audit 之外还要做什么？

**考察点**：是否了解前端供应链的几种攻击形态，以及 lockfile、私有源、安装期脚本这些具体抓手。

**参考答案**：

> **一句话结论**：前端供应链的本质是"你信任了成百上千个陌生人的代码"，防御重点是锁定版本、审计来源、限制安装期执行。

1. 漏洞扫描：`npm audit` / `pnpm audit` 查已知漏洞，配合 Dependabot 或 Renovate 自动提升级 PR；注意它有误报和情报滞后，不能只看分数。
2. 投毒形态：typosquatting（仿冒包名，如 `crossenv` 冒充 `cross-env`）、维护者账号被盗后发布带毒新版本、依赖混淆（dependency confusion，私有包名被公共源抢注）、恶意 `postinstall` 脚本。
3. lockfile：必须提交 `package-lock.json` / `pnpm-lock.yaml`，CI 用 `npm ci` 或 `--frozen-lockfile` 安装，保证"装到的"和"测过的"字节一致，否则会出现本地正常、线上被换版本的情况。
4. 私有源与 scope：把 `@company:registry` 指向私有源，避免同名包从公共源解析；小范围配置写在项目 `.npmrc` 里，谨慎全局改 registry。
5. 安装期执行：`postinstall` / `preinstall` 能在开发者机器和 CI 上执行任意命令，是投毒最爱的载体；可用 `--ignore-scripts` 收紧（注意部分包依赖它做编译，需要逐个验证）。
6. 流程控制：新增依赖必须评审（下载量、维护活跃度、仓库质量、体积、许可），核心依赖考虑锁死版本或自研替代，定期清理无人维护的依赖并生成 SBOM。

```ini
# .npmrc：私有 scope 走私有源，同时保持公共包可装
@company:registry=https://npm.company.com/
registry=https://registry.npmmirror.com/
audit=true
```

**追问与易错点**：

- 追问：`npm audit` 报 0 就安全了吗？答：不代表。它只能匹配已知漏洞库，新的投毒包和未公开漏洞都不在其覆盖范围内。
- 追问：为什么不干脆不用第三方依赖？答：成本不现实。合理做法是控制数量、锁定版本、审计来源，把风险压到可接受水平。
- 陷阱：以为 `package.json` 写了 `^1.2.3` 就锁定了版本，实际上 `^` 允许次版本升级，必须靠 lockfile 才算真正锁定。
- 陷阱：在 CI 里执行 `npm install` 而不是 `npm ci`，等于每次构建都可能装到不同代码。

### Q22 SRI 是什么？它防的是什么，不防什么？

**考察点**：是否理解子资源完整性解决的是"外部资源被篡改"这一具体威胁，并知道它的使用前提与边界。

**参考答案**：

> **一句话结论**：SRI（子资源完整性，Subresource Integrity）用哈希校验外部脚本或样式的字节内容，防止 CDN 被篡改或投毒后在你页面执行恶意代码。

1. 用法：在 `script` 或 `link` 标签上写 `integrity="sha384-xxxx"`，浏览器下载后计算哈希，与声明值不一致就拒绝执行或应用。
2. 支持的算法：`sha256`、`sha384`、`sha512`，实践中推荐 `sha384` 及以上；哈希可以用构建脚本或 `openssl dgst` 生成。
3. 跨域前提：引用 CDN 资源时必须带 `crossorigin="anonymous"`，且 CDN 要返回允许跨域的响应头，否则浏览器拿不到资源内容、无法校验，会直接报错。
4. 它防的是：静态资源内容被中间人、被入侵的 CDN、被投毒的开源包发布流程替换。
5. 它不防的是：攻击者能直接改你的 HTML（能改 HTML 就能一起改 `integrity`）、CDN 宕机或 404、你自己构建流程里引入的恶意代码。
6. 维护成本：升级第三方库版本必须同步更新哈希，否则线上直接失效；所以更适合版本稳定的库，生产上常与 CSP `script-src` 白名单一起用。

```html
<script src="https://cdn.example.com/vue@3.4.21/dist/vue.global.prod.js"
        integrity="sha384-REPLACE_WITH_REAL_HASH"
        crossorigin="anonymous"></script>
```

**追问与易错点**：

- 追问：自己打包出来的同源 JS 需要 SRI 吗？答：意义有限。同源资源被篡改通常意味着服务器已失守，此时改 `integrity` 也一样容易，优先解决服务器安全。
- 陷阱：只在首页加了 `integrity`，其它页面引用同一 CDN 资源时没加，等于留了缺口。
- 陷阱：以为加了 SRI 就可以随便用不可信 CDN，忽略 CDN 仍然能看到你的用户 IP、Referer 等元数据。

### Q23 文件上传的前端校验边界在哪里？为什么说前端校验不算安全措施？

**考察点**：能否明确区分体验层校验与安全层校验，并指出上传功能自带的 XSS 风险。

**参考答案**：

> **一句话结论**：前端上传校验只是体验优化，任何前端校验都能被绕过（改 JS 或直接发请求），安全必须由服务端的类型嗅探、重命名和隔离存储保证。

1. 前端能做的：文件大小、数量、扩展名与 MIME 的即时提示，避免用户白等一次上传失败；这是体验，不是安全。
2. 前端不能信的：`file.type` 与扩展名都由客户端提供，可以随意伪造；用 Postman 或改页面 JS 就能把 `.html`、`.svg` 当图片传上去。
3. 服务端才是边界：读取魔数（magic number）判断真实类型、重命名为随机名、限制目录不可执行、存储到对象存储或独立域名。
4. 上传自带的 XSS 风险：直接把用户上传的 HTML/SVG 在同源下展示，会形成存储型 XSS；SVG 是 XML，可以内嵌 `<script>` 与事件属性，必须当不可信内容处理。
5. 防御细节：下载走 `Content-Disposition: attachment`、上传目录加 `Content-Security-Policy: sandbox`、图片做二次渲染（重编码）去掉元数据与脚本、`X-Content-Type-Options: nosniff` 防止浏览器猜类型。
6. 前端侧真正有价值的动作：图片预览用 `URL.createObjectURL` 放进 `<img>`（`blob:` 地址继承主站源，不要拿它承载 HTML/SVG 再用 `iframe` 或新窗口打开）；HTML/SVG 预览一律放独立域名。

**追问与易错点**：

- 追问：只允许 `.jpg/.png` 就够了吗？答：不够。攻击者可以改扩展名，也可以构造"图片+PHP/HTML 代码"的混合文件，必须服务端嗅探真实内容。
- 追问：为什么图片二次渲染能提高安全性？答：重编码会丢弃文件里附带的脚本、元数据和畸形结构，只剩像素数据。
- 陷阱：用 `<input accept="image/*">` 当作安全校验，`accept` 只是选择器过滤，用户完全可以选择"所有文件"。
- 陷阱：上传成功后直接返回同源直链，并允许浏览器内联打开，等于给攻击者一个托管在自己域名下的 XSS 页面。

### Q24 Web 安全响应头该配哪些？上线自查怎么做？

**考察点**：能不能给出一份可直接落地的响应头清单，并说清每个头解决什么问题。

**参考答案**：

> **一句话结论**：把一批安全响应头作为上线标配，能用极低成本消掉一大类攻击面；重点是 CSP、HSTS、nosniff、frame-ancestors、Referrer-Policy 与 Cookie 属性。

1. `Content-Security-Policy`：限制脚本、样式、连接来源，作为 XSS 的兜底（配置方式见本章 CSP 两题）。
2. `Strict-Transport-Security`：强制浏览器只用 HTTPS 访问，防止降级攻击与 Cookie 在明文链路被截获。
3. `X-Content-Type-Options: nosniff`：禁止浏览器按内容猜测类型，避免把上传的文本文件当脚本或 HTML 执行。
4. `X-Frame-Options` 与 CSP `frame-ancestors`：防止本站页面被第三方 iframe 嵌套，堵住点击劫持。
5. `Referrer-Policy`：控制 Referer 暴露程度，推荐 `strict-origin-when-cross-origin`（跨站只带 origin），既保护隐私又保留来源校验能力。
6. `Permissions-Policy` 与 `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy`：收敛摄像头、定位等浏览器能力，并切断跨源窗口引用与跨源资源读取。

| 响应头 | 推荐值 | 解决什么 |
| --- | --- | --- |
| Content-Security-Policy | `default-src 'self'; object-src 'none'; base-uri 'self'` | XSS 兜底 |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | 降级与劫持 |
| X-Content-Type-Options | `nosniff` | MIME 嗅探 |
| X-Frame-Options | `DENY` / `SAMEORIGIN` | 点击劫持 |
| Referrer-Policy | `strict-origin-when-cross-origin` | 来源泄露 |
| Set-Cookie | `HttpOnly; Secure; SameSite=Lax` | 凭证窃取与 CSRF |

**追问与易错点**：

- 追问：这些头应该配在哪里？答：反向代理（Nginx）或应用层统一中间件下发，只配一个入口容易漏掉静态资源域和子域。
- 追问：自查怎么做？答：上线后用 `curl -I` 或安全响应头扫描工具对比清单，并把它写进发布 checklist，防止回归。
- 陷阱：只配了首页，接口响应和静态资源域没配，检查工具一跑就是一片缺失。
- 陷阱：HSTS 的 `max-age` 一上来设太大又不确定是否全站 HTTPS，回退困难，建议先小值验证再拉长。

### Q25 安全开发生命周期怎么做？ESLint 安全插件和 SAST 怎么用起来？

**考察点**：能否把安全从"出事再修"变成流程动作，并给出前端可执行的具体环节。

**参考答案**：

> **一句话结论**：安全要进流程（SDL，安全开发生命周期，Security Development Lifecycle）：需求做威胁建模、编码有规则、提交与 CI 自动扫描、上线有监控，而不是等出事再补。

1. 需求与设计阶段：明确数据流与信任边界，梳理"用户输入从哪来、流向哪里"，对上传、富文本、跳转、跨域这几类高风险功能单独评审。
2. 编码阶段：用 lint 把规则前置——`eslint-plugin-security`、`eslint-plugin-no-unsanitized`，React 项目加 `react/no-danger`，Vue 项目加 `vue/no-v-html`，让危险 API 一写出来就报错。
3. 提交阶段：husky + lint-staged 只对改动文件跑检查和扫描，门槛低、容易长期坚持。
4. CI 阶段：跑 SAST（静态应用安全测试，Static Application Security Testing），Semgrep 适合自定义规则、CodeQL 数据流分析更强；同时跑依赖扫描（audit）与密钥扫描（gitleaks）。
5. 上线阶段：用 CSP 的 `report-to` 收集真实拦截日志、错误监控做脱敏、定期做渗透测试与 DAST 扫描，把线上发现的问题回灌成 lint 规则。
6. 测试与人的部分：把安全用例写成断言（例如对 `v-html` 输入 `<img src=x onerror=alert(1)>` 断言不执行），并把高危检查项写进 code review 清单。

```json
// .eslintrc 片段：把危险 API 变成构建期错误
{
  "plugins": ["security", "no-unsanitized", "react"],
  "rules": {
    "react/no-danger": "error",
    "no-unsanitized/property": "error",
    "no-unsanitized/method": "error",
    "security/detect-eval-with-expression": "error"
  }
}
```

**追问与易错点**：

- 追问：SAST 扫不出问题就等于安全吗？答：不等于。SAST 擅长发现危险 API 与已知模式，业务逻辑越权、配置错误、供应链投毒它基本覆盖不到，仍需人工评审与渗透测试。
- 追问：规则太严影响开发效率怎么办？答：把高危规则设为 error、提示类设为 warn，例外集中在白名单文件并注明理由，而不是整体关掉插件。
- 陷阱：只在文档里写"注意 XSS"，没有任何自动化卡口，事后一定回归。
- 陷阱：只扫源码不扫构建产物，打包后硬编码的密钥和 sourcemap 泄露永远不会被发现。

### Q26 场景题：线上一个页面被举报存在 XSS，你怎么排查和修复？

**考察点**：能否给出有顺序、可执行的应急与根治流程，体现"先止血、再定位、后复盘"的工程判断。

**参考答案**：

> **一句话结论**：按"止血 → 定位注入点 → 判定类型 → 修复 → 验证回归 → 复盘"走，先用 CSP 或下线入口控住影响面，再做输出编码与净化的根治。

1. 止血与复现：拿到举报的 URL 与参数，用浏览器和抓包工具复现；确认仍可被利用时，先下发临时 CSP 或关掉对应功能入口，别边查边被打。
2. 定位注入点：看参数是否原样出现在响应 HTML 里（反射型）；在页面上搜索可疑的 `on*` 属性与内联脚本；对 DOM 型要在 `innerHTML`、`document.write`、`eval` 处打断点，追 `location.hash/search`、`document.referrer`、`postMessage` 数据有没有流进去。
3. 判定类型与影响面：内容落库后所有人都能看到是存储型，必须同时清理历史数据；只在特定链接出现是反射型；源码里没有拼接痕迹却仍然执行是 DOM 型。
4. 修复：输出侧按上下文编码，或直接改用 `textContent`；富文本用 DOMPurify 白名单净化并在服务端再净化一次；收敛散落的 `innerHTML` 调用点；下发 CSP 兜底；会话 Cookie 补上 `HttpOnly` 防止凭证被带走。
5. 验证与回归：用 `<img src=x onerror=alert(1)>`、`"><svg onload=alert(1)>`、`<a href="javascript:alert(1)">` 等 payload 覆盖所有入口，检查历史数据与新写入数据，并确认编码后功能正常。
6. 复盘：补 ESLint 规则与安全测试用例、把该点加进 code review 清单、配置 CSP 上报持续监控，同时确认同一套模板或组件是否还有同类位置。

**追问与易错点**：

- 追问：为什么第一步是止血而不是先查代码？答：存储型 XSS 每个访客都会中招，先降低影响面再慢慢定位，是应急响应的基本顺序。
- 追问：只删掉恶意数据行不行？答：不行。漏洞入口还在，攻击者可以立刻再打一次，必须同时修复注入点。
- 陷阱：只修了举报的那一个页面，没排查共用的展示组件、公告位、用户昵称等同类入口。
- 陷阱：改完不做 payload 回归验证，或用"页面看着正常"当验收标准，很容易留下半小时就能再次打通的绕过。

## 本章小结

- XSS 的本质是"不可信数据被当成代码执行"，按链路分存储型、反射型、DOM 型，DOM 型不经过服务端，服务端转义防不住。
- 根治手段是输出编码，必须按上下文（HTML 文本/属性/URL/JS/CSS）选择规则，黑名单过滤永远穷举不完变形 payload。
- `innerHTML`、`document.write`、`eval`、`v-html`、`dangerouslySetInnerHTML` 都属于同一类危险 API，收敛到统一净化组件并用 lint 卡口。
- 富文本必须白名单净化 + 服务端二次净化 + 渲染隔离，前端过滤只是体验层的减害，不是可信边界。
- CSP 是 XSS 的兜底而非替代，配置关键是去掉 `unsafe-inline` 并用 nonce 或 hash 放行，同时别忘 `base-uri`、`object-src`、`connect-src`。
- CSRF 靠 SameSite + CSRF Token + Origin/Referer 校验组合防御，高危操作再加二次验证与幂等设计；CORS 配错泄露的是数据，比 CSRF 更严重。
- 存储取舍的核心是 XSS 能否读到与 CSRF 能否被利用：access token 放内存、refresh token 放 `HttpOnly; Secure; SameSite` 的 Cookie。
- 前端代码即公开：安全靠服务端校验、HTTPS、安全响应头与流程化扫描，任何"写在前端的密钥或加密"都不算安全措施。

<!-- COUNT: 26 -->
