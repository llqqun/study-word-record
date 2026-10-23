---
title: "第 3 章 异步编程与事件循环"
---

## 第 3 章 异步编程与事件循环

### Q1 为什么 JavaScript 需要异步？全部同步执行不行吗？

**考察点**：考你是否理解单线程语言阻塞的代价，以及异步真正要解决的问题。能说出"阻塞渲染和响应"就算过关。

**参考答案**：

> **一句话结论**：因为 JS 主线程既跑代码又负责渲染，同步等待会把页面卡死；异步的本质是把"等待"交出去、把"结果处理"留下来当回调。

1. 主线程职责重：脚本执行、样式计算、布局、绘制、事件响应都在主线程。一次同步耗时操作（同步 XHR、几百万次循环、大数组排序）期间，页面既不渲染也不响应点击。
2. 等待型任务占多数：网络请求、定时器、文件读取、用户输入，耗时都在"等"而不在"算"。同步等待等于让 CPU 空转，异步则让主线程先去干别的。
3. 异步的落地机制是"回调 + 事件循环（Event Loop）"：任务交给浏览器背后的机制（网络栈、定时器调度）执行，完成后把回调排进队列，主线程空下来再取出来运行。

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
console.log('3'); // 输出：1 3 2
```

**追问与易错点**：

- 追问：那 Web Worker 算不算异步？答：不算同一层面的东西。Worker 是真的开了后台线程跑 JS，解决的是"计算密集"，异步解决的是"等待"。
- 陷阱：说"JS 单线程所以不能并发"。能并发的从来不是 JS 代码本身，而是浏览器替我们并行等待的 IO。

### Q2 都说 JS 是单线程，那浏览器的多进程多线程怎么解释？

**考察点**：考你能不能把"单线程"和"浏览器架构"分开讲。这是最容易被追问穿的一题。

**参考答案**：

> **一句话结论**："单线程"指的是**渲染进程主线程执行 JS 这件事**，浏览器整体是多进程 + 多线程架构，IO 并行由浏览器完成，与 JS 代码并发无关。

1. 多进程（以 Chromium 为例）：浏览器主进程（Browser，管窗口、地址栏、网络服务）、渲染进程（Renderer，跑 HTML/CSS/JS）、GPU 进程（合成与绘制）、插件/工具进程。出于安全与稳定，一般每个标签页一个渲染进程，开启站点隔离后还会按站点再拆。
2. 渲染进程内多线程：主线程（JS 引擎 + DOM + 样式布局）、合成线程（Compositor，独立滚动与合成）、光栅线程（Raster）、以及工作线程（Worker）。主线程被 JS 占住时，合成线程仍能让"已有图层"的滚动和 transform 动画继续跑。
3. 事件循环属于渲染进程的主线程。定时器到点、网络返回、用户点击，都会变成任务被投递回主线程的任务队列（Task Queue），排队等主线程空闲。

**追问与易错点**：

- 追问：为什么 `transform` 动画比 `left` 动画流畅？答：`transform` 由合成线程处理，不占主线程；改 `left` 要走主线程的布局与绘制，主线程一忙就掉帧。
- 陷阱：把"主线程"当成"整个浏览器只有一个线程"。也别说"JS 引擎是单线程，所以浏览器也是单线程"。
- 陷阱：说 setTimeout 由"另一个线程"执行。准确说法是：计时由浏览器托管，到点后把回调交回主线程执行。

### Q3 完整讲一下事件循环（Event Loop）的模型？

**考察点**：考结构是否完整。能按"调用栈 → 微任务清空 → 渲染 → 下一个宏任务"讲清楚，并把调用栈和两类队列都说到，才算过关。

**参考答案**：

> **一句话结论**：事件循环就是主线程反复执行"取出一个宏任务执行到调用栈（Call Stack）清空 → 清空整个微任务（Microtask）队列 → 视情况执行渲染步骤 → 再取下一个宏任务"。

1. **调用栈**：当前正在执行的同步代码。栈不空，任何队列里的东西都不能执行。这是"JS 单线程"的直接体现。
2. **宏任务队列（Task Queue）**：存放一个个宏任务。每轮循环只取**一个**宏任务执行。
3. **微任务队列（Microtask Queue）**：当前宏任务结束后、渲染之前，必须把微任务队列**彻底清空**，包括清空过程中新产生的微任务。
4. **渲染步骤（Update the Rendering）**：不是每轮循环都渲染，浏览器按屏幕刷新率（常见 60Hz，约 16.7ms）决定是否渲染。要渲染时依次执行 `requestAnimationFrame` 回调、样式计算、布局、绘制、合成。

```js
// 一轮 tick 的顺序示意
// 1. 取出一个宏任务执行 -> 2. 栈空 -> 3. 清空微任务 -> 4. 需要渲染则渲染 -> 5. 下一个宏任务
console.log('同步');
Promise.resolve().then(() => console.log('微任务'));
requestAnimationFrame(() => console.log('渲染前'));
setTimeout(() => console.log('下一个宏任务'), 0);
// 同步 -> 微任务 -> (渲染帧) 渲染前 -> 下一个宏任务
```

**追问与易错点**：

- 追问：渲染一定每轮都发生吗？答：不一定。主线程被连续同步任务占满时，浏览器可能跳过若干帧，这就是掉帧。
- 陷阱：说"每执行一个宏任务就渲染一次"。渲染是低频的、由刷新率驱动的，不是每轮都来。
- 陷阱：把 `requestAnimationFrame` 简单归成宏任务。它属于渲染步骤，比普通宏任务更早，见 Q10。

### Q4 宏任务和微任务分别有哪些？执行顺序是什么？

**考察点**：分类要背准，顺序要能一句话说清。这是纯记忆题，答错说明基础不牢。

**参考答案**：

> **一句话结论**：宏任务之间必须清空微任务队列才能轮下一个；同步代码永远最先，微任务永远早于下一个宏任务。

1. 常见宏任务：整段 `script`、`setTimeout`、`setInterval`、`setImmediate`（Node）、`MessageChannel`、IO 回调、UI 事件回调。
2. 常见微任务：`Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、`await` 之后的续体代码、Node 的 `process.nextTick`（优先级高于 Promise 微任务）。
3. 顺序口诀：**同步代码 → 清空微任务 → 取下一个宏任务 → 清空微任务 → ……**。微任务插队的能力来自"每个宏任务结束后立即清空"，所以它总是比排在后面的宏任务先跑。
4. `requestAnimationFrame` 单独记：它不在宏任务队列里，属于渲染前的回调。

| 类别 | 典型成员 | 执行时机 |
| --- | --- | --- |
| 同步代码 | 当前 script | 立即 |
| 微任务 | `Promise.then`、`queueMicrotask`、`await` 续体 | 每个宏任务后清空 |
| 渲染回调 | `requestAnimationFrame` | 渲染步骤开始时 |
| 宏任务 | `setTimeout`、事件回调、IO | 每轮取一个 |

**追问与易错点**：

- 追问：微任务里再产生微任务怎么办？答：继续入队，本轮内一并清空，直到队列为空。
- 陷阱：把 `requestAnimationFrame` 说成微任务或普通宏任务。也别说 `setTimeout` 比 `Promise.then` 快——即使延迟写 0，它也得等下一轮。

### Q5 一个完整的 tick 里，同步代码、微任务、渲染、下一个宏任务是怎么排的？

**考察点**：考你把 Q3 的模型落到具体时序上，能讲出"渲染插在微任务之后、下一个宏任务之前"。

**参考答案**：

> **一句话结论**：同步代码跑完 → 微任务全部清空 → 需要的话做一次渲染（含 rAF）→ 再取下一个宏任务，如此循环。

1. 第一轮循环的宏任务其实就是整段 `script`，所以"同步代码最先"是必然的。
2. 栈空之后进入微任务检查点（Microtask Checkpoint），把队列清空。此时页面还没更新，DOM 修改虽然已经写进内存，但用户看不到。
3. 清空后才进入渲染判断：如果距上一帧够久或者有脏标记，就执行渲染步骤。因此"微任务里改 DOM"在同一帧内就完成了，不会先渲染一版旧数据。
4. 渲染完成后才取下一个宏任务，所以 `setTimeout(fn, 16)` 实际感知到的延迟通常 ≥ 16ms 而不是恰好 16ms。

```js
document.body.textContent = 'A';
Promise.resolve().then(() => { document.body.textContent = 'B'; });
// 用户只会看到 B，A 永远不会被画出来
```

**追问与易错点**：

- 追问：那 `nextTick` 为什么能拿到最新 DOM？答：Vue 的 `nextTick` 把回调放进微任务，微任务在渲染前执行，此时 DOM 已更新但未绘制，读到的是最新结构。
- 陷阱：说"DOM 改一次就重绘一次"。同一轮内的多次修改会被合并，只在渲染步骤统一处理。

### Q6 setTimeout(fn, 0) 是立即执行吗？4ms 又是怎么回事？

**考察点**：考定时器语义与嵌套钳制。答出"不早于"和"嵌套超过 5 层按 4ms"就过关。

**参考答案**：

> **一句话结论**：`setTimeout(fn, 0)` 的语义是"至少 0ms 后尽快"，但要等当前宏任务和全部微任务结束、且轮到它；嵌套层级大于 5 层时，规范强制按 4ms 处理。

1. 延迟是下界不是上界：定时器只承诺"不早于"，不承诺"恰好"。前面有长任务或微任务队列很长时，实际延迟会被无限拉长。
2. 4ms 钳制：HTML 规范规定，当定时器的嵌套层级（nesting level）大于 5、且设定延迟小于 4ms 时，按 4ms 处理。也就是说连续用 `setTimeout` 自我嵌套到第 6 层开始，最快只能 4ms 一次。
3. 实际下限还受浏览器与系统时钟精度影响，通常不会真正小于 1ms；页面进入后台还会被进一步节流（见 Q44）。

```js
let n = 0;
const start = Date.now();
(function loop() {
  n++;
  if (n === 8) return console.log('8 层嵌套耗时约', Date.now() - start, 'ms'); // 明显大于 8ms
  setTimeout(loop, 0);
})();
```

**追问与易错点**：

- 追问：那要精确 0ms 延迟怎么办？答：用微任务，`queueMicrotask` 或 `Promise.resolve().then`，它们在同一轮就执行完，不经过定时器队列。
- 陷阱：答"0ms 表示马上执行"。规范里除嵌套钳制外没有固定最小值，但"排队等待"这件事本身就意味着不可能是立即。
- 陷阱：以为 `setTimeout(fn, 0)` 和 `setTimeout(fn)` 有语义差异。省略延迟等价于 0，都走同一套钳制规则。

### Q7 setTimeout 和 setInterval 会漂移吗？漂移从哪来？

**考察点**：考你是否知道定时器不精确的根本原因，而不是背"会漂移"三个字。

**参考答案**：

> **一句话结论**：会漂移。定时器只保证不早于设定时间，回调自身耗时、事件循环被占用、浏览器节流，都会让实际触发点越来越晚。

1. 漂移的三个来源：回调自身的执行耗时；回调前面排着的其他任务（长任务、长微任务队列）；浏览器对后台页面与嵌套定时器的节流。
2. `setInterval` 的问题更明显：它每隔 interval 触发，但每次触发都要重新排队等主线程空闲。回调耗时超过间隔时，实际间隔等于"回调耗时 + 排队时间"，时间点相对墙钟越走越偏。
3. 关键定时不要依赖 `setInterval` 的累计次数，改用"绝对时间点 + 递归 setTimeout"来自我校正。

```js
let count = 0;
const start = Date.now();
(function tick() {
  count++;
  const deadline = start + count * 1000;      // 目标绝对时间点
  setTimeout(tick, Math.max(0, deadline - Date.now())); // 每次重新算剩余时间
})();
```

**追问与易错点**：

- 追问：`setInterval` 会不会补跑漏掉的次数？答：不会累积补跑。错过就错过了，表现是间隔被拉长，而不是后面连续触发一长串。
- 陷阱：用 `setInterval` 做倒计时并用计数器递减。主线程一卡就少跳一秒，正确做法是每帧拿 `Date.now()` 和截止时间相减。

### Q8 为什么推荐用递归 setTimeout 代替 setInterval？

**考察点**：考取舍能力。要说出两者在执行模型上的差别，而不是"网上都这么说"。

**参考答案**：

> **一句话结论**：递归 `setTimeout` 保证上一次回调执行完才排下一次，天然消除堆积与漂移，还能动态调间隔、方便取消与异常处理。

1. 不会堆积：`setInterval` 的下一拍与上一拍回调是否结束无关；如果回调里有 `await` 网络请求，可能出现多次回调重叠执行。递归 `setTimeout` 天然串行。
2. 可自我校正：每次用绝对时间点算剩余延迟，长时间运行也不会累计漂移（见 Q7 代码）。
3. 可动态调整与安全退出：根据业务状态改变下一次间隔（轮询退避），或在出错时不再续排，避免"停不下来的定时器"。

| 维度 | setInterval | 递归 setTimeout |
| --- | --- | --- |
| 回调重叠 | 可能 | 不会 |
| 漂移 | 会累积 | 可用绝对时间校正 |
| 动态间隔 | 需先 clear 再重设 | 每轮自由决定 |
| 出错停止 | 需手动 clear | 直接不续排 |

**追问与易错点**：

- 追问：那 `setInterval` 还有使用场景吗？答：有，纯装饰性、无依赖、允许重叠的轻量任务，或者用 `setInterval` 只做"检查时间是否到点"的哨兵。
- 陷阱：递归写法里忘了在异常时停止，导致定时器永久续排。要在 `catch` 里决定是否继续。
- 陷阱：递归 `setTimeout` 的间隔是"回调结束后再等 N 毫秒"，所以实际周期 = 回调耗时 + N。若要求固定周期，必须用绝对时间点算差值。

### Q9 做动画为什么用 requestAnimationFrame 而不是定时器？

**考察点**：考你是否理解帧同步。答出"与刷新率对齐、后台自动暂停、不丢帧"即可。

**参考答案**：

> **一句话结论**：`requestAnimationFrame` 由浏览器按屏幕刷新节奏统一调度，回调在渲染前执行，天然不丢帧、不空转，后台还会自动暂停。

1. 帧同步：rAF 回调在当前帧的渲染步骤中执行，刷新率 60Hz 就约 16.7ms 一次，120Hz 就约 8.3ms 一次。它不需要你猜屏幕多久刷一次。
2. 不空转：屏幕不刷新（后台标签页、页面不可见）时 rAF 不执行，省电。`setInterval(fn, 16)` 在后台仍会跑，然后被浏览器节流得七零八落。
3. 不撕裂：因为回调紧挨着渲染，写入的样式会在同一帧生效，视觉上更连续；定时器则可能在两帧之间插入或错过。
4. 定时器做动画的典型症状是忽快忽慢、跳帧——因为它和屏幕刷新节奏无关，还会和渲染抢主线程。

**追问与易错点**：

- 追问：rAF 能保证一定 60fps 吗？答：不能。它只保证"要渲染时叫我"，主线程被长任务占住照样掉帧，需要用 `performance.now()` 自己算时间差做插值。
- 陷阱：说 rAF 精度比定时器高所以更快。rAF 的上限就是刷新率，它比 `setTimeout(fn, 0)` 慢得多，只是"更对"。
- 陷阱：以为 rAF 会自动取消。必须用 `cancelAnimationFrame(id)` 手动停，否则递归调用会一直排。

### Q10 requestAnimationFrame 在事件循环里到底什么时候执行？

**考察点**：考你对渲染步骤的精确位置认知。这是区分"背过资料"和"真理解"的一题。

**参考答案**：

> **一句话结论**：rAF 回调位于"微任务清空之后、样式计算与布局之前"的渲染步骤开头，不属于宏任务队列。

1. 精确顺序：当前宏任务执行完 → 清空微任务 → 浏览器判断该渲染了 → **执行 rAF 回调** → 样式计算（Recalc Style）→ 布局（Layout）→ 绘制（Paint）→ 合成（Composite）。
2. 因此 rAF 里读布局信息（`offsetHeight`、`getBoundingClientRect`）拿到的是"上一帧已算好的值"；在这里写样式也不会立刻触发布局，会和后续的样式计算合并。
3. 一帧内 rAF 回调按注册顺序执行；在 rAF 里再调用 rAF 会排到**下一帧**，不会在本帧重复执行。
4. 常见误区是把它归入宏任务队列。它和 `setTimeout` 不在一个队列，所以"先 rAF 还是先 setTimeout(fn, 0)"取决于定时器是否已到期，不能一概而论。

```js
setTimeout(() => console.log('timeout'), 0);
requestAnimationFrame(() => console.log('raf'));
// 一段耗时很长的同步代码后：通常是 raf 先，因为定时器要等下一个宏任务，rAF 在本帧渲染前
```

**追问与易错点**：

- 追问：rAF 里能不能改 DOM？答：能，而且是最佳位置。改完紧接样式计算和布局，同一帧生效，避免强制同步布局。
- 陷阱：在 rAF 里先写样式再读 `offsetHeight`，这会强制浏览器立刻做一次同步布局（强制重排），是性能大坑。读写要分开。

### Q11 requestIdleCallback 是干什么的？什么时候用？

**考察点**：考你是否知道浏览器提供的"低优先级任务"接口及其限制。知道它不稳、兼容性差就是加分项。

**参考答案**：

> **一句话结论**：`requestIdleCallback` 让你在浏览器每帧的空闲时段执行低优先级任务，是"能拖就拖"的任务调度方案。

1. 回调收到一个 `deadline` 对象：`timeRemaining()` 返回本帧剩余空闲毫秒数（上限通常 50ms），`didTimeout` 表示是否因为超时被强制执行。
2. 没有空闲时段就一直不执行。用 `{ timeout: 2000 }` 可以保证最晚 2 秒内被执行一次，此时 `didTimeout` 为 `true`。
3. 适合：日志上报批量发送、预计算、预渲染不重要内容、大数据分片处理。不适合：动画、必须及时响应的交互。

```js
requestIdleCallback(function work(deadline) {
  while (deadline.timeRemaining() > 1 && queue.length) {
    process(queue.shift());            // 只干到快没时间
  }
  if (queue.length) requestIdleCallback(work); // 剩下的下一帧继续
}, { timeout: 2000 });
```

**追问与易错点**：

- 追问：为什么实际业务里用得少？答：Chromium 与 Firefox 支持，Safari 长期未实现，需要落到 `setTimeout` 或 `MessageChannel` 做降级；而且空闲时段不可预期，任务可能被饿很久。
- 陷阱：把它当"低延迟"接口用。它的定位恰恰是"可以被推迟"，React 早期调度器用过它，后来因触发不稳定与 50ms 限制改用了 MessageChannel。

### Q12 输出顺序题（基础）：这四行打印顺序是什么？

**考察点**：最基础的宏微任务顺序题。答错说明事件循环还没入门。

```js
console.log('script start');
setTimeout(() => console.log('setTimeout'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('script end');
```

**参考答案**：

> **一句话结论**：`script start → script end → promise → setTimeout`，同步代码最先，微任务早于下一个宏任务。

1. `console.log('script start')` 是同步代码，立刻打印。
2. `setTimeout` 把回调交给定时器，到期后作为**宏任务**进入任务队列，本轮不执行。
3. `Promise.resolve().then` 把回调作为**微任务**入队，本轮不立即执行。
4. `console.log('script end')` 同步打印。至此整个 `script` 这个宏任务结束，进入微任务检查点，打印 `promise`；微任务清空后才取下一个宏任务，打印 `setTimeout`。

逐行分析：

```text
同步阶段   : script start, script end
微任务队列 : [promise 回调]   <- 栈空后清空
宏任务队列 : [setTimeout 回调] <- 微任务清空后才取
结果       : script start, script end, promise, setTimeout
```

**追问与易错点**：

- 追问：把 `setTimeout` 的 0 改成 1 会变吗？答：不变。只要定时器还没到期，它就得等下一个宏任务，而微任务在本轮清空。
- 陷阱：答成 `script start → promise → script end → setTimeout`。`then` 的回调不会插到同步代码中间。

### Q13 输出顺序题（进阶）：async/await 和 Promise.then 混在一起怎么排？

**考察点**：考 `await` 之后的代码到底排在哪。核心是"`await` 会让出主线程，后续代码进微任务队列"。

```js
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}
async function async2() { console.log('async2'); }

console.log('script start');
setTimeout(() => console.log('setTimeout'), 0);
async1();
new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => console.log('promise2'));
console.log('script end');
```

**参考答案**：

> **一句话结论**：`script start → async1 start → async2 → promise1 → script end → async1 end → promise2 → setTimeout`。

1. `async1()` 同步执行到 `await` 之前：先打印 `async1 start`。`async2()` 是普通调用，同步打印 `async2` 并返回一个已完成的 Promise。
2. `await` 会把 `async1` 后续代码包装成续体排进**微任务队列**，主线程继续往下走，所以 `promise1` 和 `script end` 先打印。
3. 两个微任务按入队顺序执行：`async1` 的续体先于 `then` 回调，所以是 `async1 end` 再 `promise2`。
4. `setTimeout` 是宏任务，排在所有微任务之后。

逐行时序：

```text
同步   : script start → async1 start → async2 → promise1 → script end
微任务 : [async1 续体, promise2 回调] -> async1 end, promise2
宏任务 : setTimeout
```

**追问与易错点**：

- 追问：为什么 `async1 end` 在 `promise2` 前面？答：`await` 在同步阶段就完成了入队，而 `promise2` 的 `then` 是在 `resolve()` 之后才注册入队，入队晚。
- 陷阱：老版本引擎（Chrome 73 / Node 12 之前）的 `await` 需要 3 个微任务 tick，输出会变成 `promise2` 在前。现在只需 1 个 tick，面试按新规范答，并主动说明这个历史差异会很加分。
- 陷阱：说 `await async2()` 会等一整轮事件循环。它只等微任务，远快于 `setTimeout`。

### Q14 输出顺序题（深挖）：await、queueMicrotask、嵌套微任务全混在一起

**考察点**：考微任务队列的"边清空边入队"特性，以及 `await` 的精确 tick 数。这是本章最难的一题。

```js
console.log('A');
setTimeout(() => {
  console.log('B');
  Promise.resolve().then(() => console.log('C'));
}, 0);

(async () => {
  console.log('D');
  await null;
  console.log('E');
  await null;
  console.log('F');
})();

queueMicrotask(() => console.log('G'));
Promise.resolve().then(() => {
  console.log('H');
  queueMicrotask(() => console.log('I'));
});
console.log('J');
```

**参考答案**：

> **一句话结论**：`A D J E G H F I B C`。第一轮微任务依次是 E、G、H，其中 E 又造出下一个续体、H 又造出 I，新微任务排在队尾。

1. 同步阶段：打印 `A`；`setTimeout` 与 IIFE 内的 `D`；IIFE 遇到 `await null` 把续体入队（记 m1）；`queueMicrotask` 入队（m2）；`then` 回调入队（m3）；最后打印 `J`。队列为 `[m1, m2, m3]`。
2. 清空微任务：m1 打印 `E` 并让第二个 `await` 的续体入队（m4，排在队尾）；m2 打印 `G`；m3 打印 `H` 并入队 `queueMicrotask` 的回调（m5）；接着 m4 打印 `F`；m5 打印 `I`。可见"队列清了又满"，但始终是先进先出。
3. 微任务彻底清空后才轮到宏任务：打印 `B`，其内部再入队一个微任务，本轮宏任务结束后打印 `C`。

```text
同步   : A D J
微任务 : [m1,m2,m3] -> E(入队m4) G H(入队m5) F I
宏任务 : B -> 微任务 C
结果   : A D J E G H F I B C
```

**追问与易错点**：

- 追问：`await null` 要几个微任务 tick？答：现代引擎（Chrome 73+ / Node 12+）是 1 个——`await v` 内部做 `PromiseResolve(v)` 再 `PerformPromiseThen`，`v` 已是完成态，续体立即入队。
- 陷阱：答成 `A D J G H E F I B C`。m1 是最先入队的，一定要先执行。
- 陷阱：以为 `H` 里的 `queueMicrotask` 会插到 `F` 前面。新微任务永远排在队尾，不能插队。

### Q15 输出顺序题（深挖）：resolve 一个 Promise 会多花几个 tick？

**考察点**：考 Promise 解析过程（Promise Resolution Procedure）里"thenable 接管"的额外微任务。能说出比普通 resolve 多 tick 就是高手。

```js
console.log('start');
new Promise((resolve) => {
  console.log('executor');
  resolve(Promise.resolve('inner'));   // 注意：resolve 的是一个 Promise
}).then((v) => console.log('then1', v));
Promise.resolve().then(() => console.log('then2'));
console.log('end');
```

**参考答案**：

> **一句话结论**：`start executor end then2 then1 inner`。用 thenable 去 resolve 会走"接管"流程，多出至少两个微任务 tick，所以 `then2` 反而先打印。

1. 同步阶段：打印 `start`、`executor`、`end`。`resolve(inner)` 发现是 thenable，不会立刻敲定状态，而是入队一个"解析 thenable 任务"（Resolve Thenable Job）。
2. 队列依次是：`[解析任务, then2]`。解析任务执行时调用 `inner.then(解决外层)`，`inner` 已完成，于是再入队一个任务来真正把外层敲定为 `inner`。
3. `then2` 先打印；随后外层 Promise 完成，触发它注册的反应任务，才打印 `then1 inner`。整条链比普通 `resolve(1)` 多了两个 tick。

```text
同步   : start, executor, end        （此时外层仍 pending）
微任务 : 解析 thenable -> then2 -> 敲定外层 -> then1 inner
结果   : start executor end then2 then1 inner
```

**追问与易错点**：

- 追问：`resolve(1)` 呢？答：不是 thenable，直接敲定为 fulfilled，只需 1 个 tick 触发 `then` 回调，输出会变成 `then1 1` 在 `then2` 前。
- 陷阱：以为 `resolve` 传 Promise 等价于透传。状态敲定被推迟，这正是 `async` 函数里 `return somePromise` 会多绕一圈的原因，也是 `return await` 曾被认为更慢的由来。
- 陷阱：把 `Promise.resolve(p)` 和 `resolve(p)` 混为一谈。前者在 `p` 构造器相同时直接返回 `p` 本身，不会多 tick。

### Q16 Promise 有哪三种状态？状态能改回去吗？

**考察点**：基础必答。核心是"状态不可逆"和"敲定后不再改变"。

**参考答案**：

> **一句话结论**：`pending`（待定）、`fulfilled`（已兑现）、`rejected`（已拒绝）三种状态，一旦从 `pending` 敲定就永久不可逆，后续 `resolve/reject` 全部忽略。

1. 状态迁移只有两条：`pending → fulfilled`、`pending → rejected`。没有回退，也没有 `fulfilled → rejected`。
2. 状态敲定后，再调用 `resolve` 或 `reject` 不会产生任何效果（静默忽略），这是很多人写错"超时后又被正常结果覆盖"类 bug 的根源。
3. 同一个 Promise 可以注册多个 `then`，状态敲定时所有回调按注册顺序进入微任务队列。
4. 状态只能被内部 `resolve/reject` 改变，外部拿不到改写能力，这是 Promise 相比纯回调的核心优势。

```js
const p = new Promise((resolve, reject) => {
  resolve('first');
  reject('second');            // 无效
  resolve('third');            // 无效
});
p.then((v) => console.log(v));  // first
```

**追问与易错点**：

- 追问：`pending` 能一直挂着吗？答：能。没有任何机制会强制敲定它，这就是"永不 resolve 的 Promise"导致内存与逻辑泄漏的原因。
- 陷阱：认为 `reject` 后还能被 `then` 的第一个参数接住。rejected 只走第二个参数或 `catch`。
- 陷阱：把"状态不可逆"和"值不可变"混为一谈。fulfilled 的值是对象时，对象内容仍可被修改。

### Q17 then 的链式调用和值穿透是怎么回事？

**考察点**：考 `then` 的返回值规则。这是 Promise 用得对不对的分水岭。

**参考答案**：

> **一句话结论**：每个 `then` 都返回一个**全新**的 Promise，回调的返回值决定这个新 Promise 的状态；不传回调就原值穿透。

1. 返回值规则：返回普通值 → 新 Promise 变为 fulfilled 并携带该值；返回 Promise 或 thenable → 新 Promise 跟随它的状态（会等待）；抛出异常 → 新 Promise 变为 rejected。
2. 值穿透：`then` 的参数不是函数时（`null`、`undefined`、非函数）会被替换成恒等函数，值原样往后传，所以链中间可以"跳过"处理。`catch` 之后继续 `then` 可以恢复链条，这是错误恢复的常用姿势。
3. 忘记 `return` 是最常见的坑：回调里 `return` 丢了，下一个 `then` 拿到的是 `undefined`，而不是内层 Promise 的结果。

```js
Promise.resolve(1)
  .then(null)                 // 值穿透
  .then((v) => v + 1)
  .catch(() => 0)
  .finally(() => console.log('finally'))  // 不改变值，只做收尾
  .then((v) => console.log(v));           // 先 finally，再 2
```

**追问与易错点**：

- 追问：`finally` 会改变值吗？答：不会。它不接收值也不返回值，回调的返回值被忽略，原值继续往下传，唯一例外是 `finally` 里抛出异常或返回 rejected Promise。
- 陷阱：在 `then` 里写 `arr.forEach(async ...)` 然后以为链会等它。只有 `return` 出去的 Promise 才会被等待。
- 陷阱：以为 `.catch` 能捕获它**前面**所有错误却不影响后面。`catch` 之后链条默认恢复为 fulfilled，除非它自己又抛。

### Q18 then 的回调为什么设计成微任务，而不是宏任务？

**考察点**：考原理与设计动机。能从"规范实现 + 为什么要这样设计"两个角度答就很好。

**参考答案**：

> **一句话结论**：规范上 `then` 注册的反应任务通过"入队一个 Promise 作业"（HostEnqueuePromiseJob）进微任务队列；设计上是为了让本轮状态变更在渲染之前全部收敛。

1. 规范实现路径：`then` 调用 `PerformPromiseThen`，状态已敲定时创建一个 Promise 反应任务（PromiseReactionJob），通过宿主钩子入队微任务，因此永远在当前宏任务结束前执行完。
2. 保证一致性：如果 `then` 是宏任务，中间会被渲染和其他宏任务插队，用户可能先看到"半更新"的界面。微任务让一整条 `then` 链在同一次渲染前收敛完毕。
3. 延迟最低：微任务不需要等下一帧或下一个任务，是"当前这一轮里能拿到的最快时机"，比 `setTimeout(fn, 0)` 快一个量级。
4. 时序确定：微任务先进先出、队列清空才退出，因此 Promise 回调的相对顺序稳定可预测，这也是 Vue 的 `nextTick`、各类状态库选择微任务做批处理的原因。

**追问与易错点**：

- 追问：那 `queueMicrotask` 和 `Promise.then` 谁先？答：看入队顺序，同一队列先进先出；`queueMicrotask` 少一次 Promise 包装，开销更小（见 Q42）。
- 陷阱：说"微任务优先级比宏任务高"。它们不是同一队列的优先级比较，而是"每轮宏任务结束后必然清空微任务"的调度规则。
- 陷阱：以为微任务能中断同步代码。微任务再急也得等调用栈清空。

### Q19 Promise.resolve 和 Promise.reject 有哪些容易踩的细节？

**考察点**：考静态方法的边界行为，尤其是"已 resolve 的 Promise 不一定是新对象"和 `reject` 不展开。

**参考答案**：

> **一句话结论**：`Promise.resolve` 会做 thenable 展开，且参数本身是同类 Promise 时直接原样返回；`Promise.reject` 从不展开，传什么就把什么当作拒绝原因。

1. `Promise.resolve(p)`：若 `p` 是 Promise 且其 `constructor` 就是 `Promise`，直接返回 `p` 本身（引用相等），不会多包一层；否则新建一个 fulfilled Promise，若是 thenable 还要走接管流程。
2. `Promise.resolve(值)` 是"把任何值变成 Promise"的标准手段，`await 值` 内部也依赖它，Promise 的几处关键特性都依赖这里的展开逻辑。
3. `Promise.reject(p)`：即使 `p` 是个 Promise，也不会展开，整个 `p` 直接作为 rejected 的原因。所以 `catch` 拿到的可能是个 Promise 对象（见下面的坑）。

```js
const p = Promise.resolve(1);
console.log(Promise.resolve(p) === p);       // true
Promise.reject(new Error('e')).catch((e) => console.log(e.message)); // e
new Promise((r) => r(Promise.reject('x'))).catch((e) => console.log(e)); // 展开后是 'x'
```

**追问与易错点**：

- 追问：`new Promise(r => r(thenable))` 和 `Promise.resolve(thenable)` 一样吗？答：语义一样，都会异步展开；区别只在前者一定创建新 Promise。
- 陷阱：executor 里同步 `throw` 会让 Promise 变 rejected；但在 executor 里 `setTimeout(() => { throw e })` 抛出的错误**不会**让 Promise rejected，而是变成全局错误（见 Q28）。
- 陷阱：`Promise.reject(p)` 后写 `catch(e => console.log(e))` 期望看到值。实际拿到的是 Promise 对象，需要 `await e` 才能拿到内部值。

### Q20 Promise.all 的行为边界你了解哪些？

**考察点**：考细节而不是概念。空数组、顺序、短路、非 Promise 元素都是常见追问点。

**参考答案**：

> **一句话结论**：全部 fulfilled 才 fulfilled 并返回**按输入顺序**排列的结果数组，任一个 rejected 就立即 rejected。

1. 并发发起、统一收口：`all` 只是把多个 Promise 汇总，不会替你限制并发数。传入的 Promise 在传入前就已经开始执行了（见 Q24）。
2. 结果顺序与完成顺序无关：内部按输入下标写入结果数组，最慢的排最后也不会打乱顺序。
3. 失败短路：任一 rejected 立即让 `all` 变 rejected，其余 Promise 的结果被丢弃——但它们**不会停止执行**，该发的请求还是发完了。
4. 边界：传空数组立即 fulfilled 为 `[]`；传非 Promise 值会被 `Promise.resolve` 包一层，所以可以混用普通值。

```js
Promise.all([1, Promise.resolve(2)]).then((r) => console.log(r)); // [1, 2]
Promise.all([]).then((r) => console.log(r));                      // []
```

**追问与易错点**：

- 追问：怎么拿到"部分成功"的结果？答：用 `allSettled`，或者把每个任务包一层 `.catch(e => ({ error: e }))` 让 `all` 永远不会 rejected。
- 陷阱：以为 `all` 会限制并发。`ids.map(id => fetch(id))` 在 `map` 结束时就全部发出去了，一次几百个并发会打满浏览器同域连接数（HTTP/1.1 下通常 6 个），后面全在排队。
- 陷阱：以为失败后其余请求会被取消。Promise 没有取消能力，要真正取消得用 `AbortController`（见 Q34）。

### Q21 all、race、allSettled、any 有什么区别，分别什么时候用？

**考察点**：考四个静态方法的语义差异与选型判断。必须能说清"什么时候用哪个"。

**参考答案**：

> **一句话结论**：`all` 要全成功、`allSettled` 要全部有结果（不管成败）、`race` 要第一个敲定（成败都算）、`any` 要第一个成功。

1. `Promise.all`：全 fulfilled 才成功，返回结果数组；任一 rejected 就短路失败。用于"缺一不可"的组合请求。
2. `Promise.allSettled`：等所有 Promise 敲定，返回 `[{status, value|reason}]`，永不 rejected。用于"能拿到多少算多少"，比如批量上报、批量删除。
3. `Promise.race`：第一个敲定的（无论 fulfilled 还是 rejected）决定结果。用于超时控制（和超时 Promise 赛跑）。
4. `Promise.any`：第一个 **fulfilled** 的胜出；全部 rejected 才失败并抛出 `AggregateError`（内含所有原因）。用于多镜像、多 CDN 取最快可用源。

| 方法 | 成功条件 | 失败条件 | 返回 | 典型场景 |
| --- | --- | --- | --- | --- |
| `all` | 全部成功 | 任一失败 | 结果数组 | 组合详情页数据 |
| `allSettled` | 全部敲定 | 永不失败 | 状态对象数组 | 批量操作统计 |
| `race` | 首个敲定 | 首个敲定即失败 | 首个结果 | 超时控制 |
| `any` | 首个成功 | 全部失败 | 首个成功值 | 多源容灾 |

**追问与易错点**：

- 追问：`allSettled` 是哪个版本有的？答：ES2020，Node 12.9 起、现代浏览器均已支持；老环境需要 `all` + `catch` 兜底手写。
- 陷阱：把 `race` 和 `any` 记反。一句话记法：`race` 比"谁先结束"，`any` 比"谁先成功"。
- 陷阱：`any` 在全部失败时不会抛第一个错误，而是抛 `AggregateError`，其 `errors` 属性才是原因数组。

### Q22 Promise.all 和 allSettled 在错误处理上到底差在哪？

**考察点**：考错误处理的取舍，这是实战中最常被问到的一层。

**参考答案**：

> **一句话结论**：`all` 是快速失败，一个 reject 就丢掉全部结果；`allSettled` 是全部兜住，每个失败都变成一个带 `reason` 的对象，永不 reject。

1. `all` 的失败是"短路"：第一个 rejected 立刻把结果抛出去，其他任务的结果即使后来成功了也拿不到。适合"一个失败整个流程就没意义"的场景。
2. `allSettled` 的结果结构固定：每项要么 `{ status: 'fulfilled', value }`，要么 `{ status: 'rejected', reason }`，之后自己过滤统计。
3. 用 `all` 也能模拟 `allSettled`：给每个任务加 `.catch(e => ({ error: e }))`，但这就等于人工丢弃了"抛出的语义"，需要自己约定返回结构。
4. 选择判断：任务之间有强依赖、失败要立刻提示用户 → `all`；任务是并列的、要汇总成功率和失败明细 → `allSettled`。

```js
const tasks = ids.map((id) => fetch(`/api/item/${id}`).then((r) => r.json()));
const settled = await Promise.allSettled(tasks);
const ok = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value);
const failed = settled.filter((s) => s.status === 'rejected').map((s) => s.reason);
```

**追问与易错点**：

- 追问：`all` 短路后其他请求还会继续跑，会不会造成副作用？答：会。已经发出的写请求不会被撤回，所以批量写操作前要考虑幂等或用 `AbortController` 主动取消。
- 陷阱：`allSettled` 永不 rejected，所以后面写 `try/catch` 是无效的，真正的错误在返回值里。
- 陷阱：用 `all` 时忘了给每个任务单独兜底，导致"只有一个失败，但整个列表都渲染不出来"。

### Q23 手写实现 Promise.all（面试高频手写题）

**考察点**：考对 Promise 构造、闭包计数、顺序保证与边界处理的综合掌握。写不写得出空数组分支和下标写入是分水岭。

**参考答案**：

> **一句话结论**：用一个计数器记录完成数、用输入下标写入结果以保证顺序，任一项 reject 就整体 reject，计数器到齐就 resolve。

1. 必须用 `Promise.resolve(item)` 包一层，才能兼容数组里混入的非 Promise 值（包括同步值）。
2. 结果必须按下标 `results[i] = v` 写入，不能 `push`，否则返回顺序会变成完成顺序。
3. 边界：空数组要立即 resolve 为 `[]`，否则计数器永远到不了 0 个元素对应的终值。
4. 错误处理用 `then` 的第二个参数直接 `reject`，天然短路；不要用 `catch`，否则会把后续逻辑也吞掉。

```js
function myAll(iterable) {
  const items = Array.from(iterable);
  return new Promise((resolve, reject) => {
    if (items.length === 0) return resolve([]);       // 边界：空数组
    const results = new Array(items.length);
    let done = 0;
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {         // 包一层，兼容同步值
        results[i] = value;                           // 按下标写入，保证顺序
        if (++done === items.length) resolve(results); // 全部到齐才 resolve
      }, reject);                                     // 任一失败立即短路
    });
  });
}
```

**追问与易错点**：

- 陷阱：用 `results.push(value)` 代替下标写入。这样返回的是完成顺序，面试官会立刻用一个"先慢后快"的用例问穿。
- 陷阱：忘了 `Promise.resolve` 包装，导致传入 `[1, 2]` 时 `item.then` 直接报错。
- 追问：要不要支持 `Symbol.iterator`？答：加分项。用 `Array.from(iterable)` 就够了；原生实现接受任意可迭代对象，用 `for...of` 遍历更严谨。

### Q24 手写一个并发控制器，限制最多 N 个请求同时进行

**考察点**：本章最实战的手写题。考闭包状态管理、任务领取与槽位补充。能写出"同步领号"是加分项。

**参考答案**：

> **一句话结论**：开 N 个槽位，每个槽位完成一个任务就立刻领下一个，直到取完；用一个游标保证领取不重复，用一个计数器判断全部完成。

1. 任务要传函数而不是 Promise：如果传的是已经 `new` 出来的 Promise，请求在调用 `limit` 前就全部发出去了，限流无从谈起。
2. 槽位模型：先启动 `min(n, 任务数)` 个执行器，每个执行器完成后调用 `run()` 再领一个，天然把并发数稳定在 N。
3. 领号必须同步执行（`cursor++` 在调用任务函数之前），否则同一轮里多个执行器会领到同一个下标。
4. 结果按下标写回，返回顺序与输入一致；任一失败直接 `reject`，因为此时后续 `run()` 不再被调用，队列自然停止。

```js
function limit(tasks, n) {                    // tasks: (() => Promise)[]
  const results = new Array(tasks.length);
  let cursor = 0, done = 0;
  return new Promise((resolve, reject) => {
    const run = () => {
      if (cursor >= tasks.length) return;     // 没有待领任务
      const i = cursor++;                     // 先领号，防止并发重复领取
      tasks[i]().then((v) => {
        results[i] = v;
        if (++done === tasks.length) resolve(results);
        else run();                           // 空出槽位立刻补位
      }, reject);                             // 任一失败即整体失败
    };
    if (tasks.length === 0) return resolve(results);           // 空数组立即完成
    for (let k = 0; k < Math.min(n, tasks.length); k++) run(); // 开 N 个槽
  });
}
```

**追问与易错点**：

- 追问：要"失败继续跑完"怎么办？答：把 `reject` 换成记录错误并同样 `run()` 补位，最后统一 resolve，语义等同 `allSettled`。
- 追问：真实项目会手写吗？答：能手写说明理解，实际多用 `p-limit`、`bottleneck` 这类库，它们额外支持动态改并发、优先级队列和速率限制。
- 陷阱：把 `tasks` 写成 Promise 数组，此时 `Promise.all` 已经是全并发，限流器形同虚设。
- 陷阱：以为浏览器端限流只影响服务端压力。同域并发连接数（HTTP/1.1 约 6 个）不控制，后续请求全在排队，反而拖慢整体响应。

### Q25 async 函数的本质是什么？

**考察点**：考你是否理解 `async` 不是语法糖那么简单。能从"返回 Promise / 生成器 + 自动执行器 / 引擎状态机"三个层次答就是满分。

**参考答案**：

> **一句话结论**：`async` 函数本质是"一定返回 Promise 的函数"，语义上等价于生成器（Generator）+ 自动执行器，引擎内部则用挂起/恢复的执行上下文实现，比生成器少一层调度开销。

1. 返回 Promise：调用 `async` 函数不阻塞，立刻拿到一个 Promise。内部 `return v` 等价于 `resolve(v)`，`throw e` 等价于 `reject(e)`；没有 `return` 时兑现为 `undefined`。
2. 语义等价生成器 + 执行器：`await` 相当于 `yield`，执行器把 yield 出来的值 `then` 一下再把结果 `next` 回去。Babel 降级 `async/await` 走的就是这个思路。
3. 引擎实现不是生成器：规范用 `AsyncFunctionStart` + `Await`，靠挂起（suspend）和恢复（resume）执行上下文来工作，是内建状态机，因此比 `Generator` 手写执行器更快。
4. 关键副作用：`async` 函数内部抛错永远不会同步抛出，一定变成 rejected Promise。所以外面直接 `try { f() } catch` 是抓不到的，必须 `await`。

```js
async function f() { throw new Error('x'); }
try { f(); } catch (e) { console.log('抓不到'); }        // 不会执行
f().catch((e) => console.log('这样才抓得到', e.message));
```

**追问与易错点**：

- 追问：`async` 函数里 `return Promise` 和 `return await Promise` 一样吗？答：不一样，见 Q30。
- 陷阱：以为 `async` 函数会开线程。它还是跑在主线程上，只是把等待变成了挂起。
- 陷阱：写成 `async function f() {}` 就以为返回 undefined。它返回的是 fulfilled 为 `undefined` 的 Promise。

### Q26 await 的暂停与恢复机制是怎么实现的？

**考察点**：本章原理题的天花板。能讲清"右侧先求值 → 挂起上下文 → 注册续体到微任务 → 恢复"这条链就是深挖级答案。

**参考答案**：

> **一句话结论**：`await v` 先同步求出 `v`，然后把当前 async 函数的执行上下文挂起、把后续代码作为续体注册成 `v` 的回调；`v` 敲定后续体作为**微任务**执行，函数上下文被恢复。

1. 右侧同步求值：`await expr` 的 `expr` 是同步计算的，所以 `await fn()` 里 `fn()` 会立刻执行到返回 Promise 为止。
2. 挂起：函数执行上下文从调用栈上摘下并保存现场，主线程不会被阻塞，继续跑同步代码和其他任务。这也是为什么 `await` 之后同一函数里的代码"看起来没执行"。
3. 订阅：内部走 `PromiseResolve(v)` 再 `PerformPromiseThen`，把续体注册为完成回调。如果 `v` 已经是 fulfilled，这个反应任务立即入微任务队列，只需 1 个 tick。
4. 恢复：微任务执行时把执行上下文重新压栈，从 `await` 处继续；函数最终的 Promise 由第一次 `return` 或未被捕获的 `throw` 敲定。

**追问与易错点**：

- 追问：挂起会丢变量吗？答：不会。整个词法环境与局部变量都随执行上下文保存，恢复后完全一致。
- 陷阱：说 `await` 会开新线程或定时器。它纯粹是微任务调度，`await 1` 和 `setTimeout` 完全不是一个量级。
- 陷阱：`await` 只挂起**当前这个** async 函数。它的调用者如果不 await，就继续往下跑了。

### Q27 async/await 和 then 的等价改写怎么互转？

**考察点**：考你是否真的理解两者是同一机制的两种写法。能用 try/catch 与 catch 的位置对应关系说清楚就是过关。

**参考答案**：

> **一句话结论**：`await p` 相当于把后续代码放进 `p.then(...)`；`try/catch` 相当于把 `catch` 挂在链尾，位置决定错误从哪一层被恢复。

1. 逐句对应：`const v = await p` → `p.then(v => ...)`；`return await p` → `return p.then(...)` 或直接 `return p`；`throw e` → `Promise.reject(e)`。
2. 顺序对应：多个 `await` 串起来就是 `then` 链，每一步都是同一套微任务调度，所以两者的输出顺序一一对应。
3. `try/catch/finally` 对应 `catch` 与 `finally`，但要注意 `catch` 挂在哪一段：挂在链中间只能捕获它前面那一段的失败。
4. 不能直接互转的情况：循环里的 `await`、带 `break/continue` 的控制流，用 `then` 改写会非常别扭，这正是 `async/await` 的价值所在。

```js
async function load(url) {
  try { const r = await fetch(url); return await r.json(); }
  catch (e) { return null; }
}
// 等价写法
function load(url) {
  return fetch(url).then((r) => r.json()).catch(() => null);
}
```

**追问与易错点**：

- 追问：改写成 `then` 后错误位置一致吗？答：基本一致，但 `return await` 与 `return` 在 `try` 里的行为不同（见 Q30），改写时要特别留意。
- 陷阱：把 `.catch(() => null)` 写到链中间，导致后面的 `then` 依然会执行。等价改写时必须核对恢复点。

### Q28 try/catch 捕获不到哪些异步错误？

**考察点**：实战排错题。能列出三类以上具体场景并给出正确做法，就是加分项。

**参考答案**：

> **一句话结论**：`try/catch` 只能捕获同步执行栈里的错误；一切在"新的调用栈"里抛出的错误都抓不到，包括定时器回调、事件回调、以及没被 `await` 的 Promise 拒绝。

1. 定时器与事件回调：`setTimeout`、`setInterval`、`addEventListener` 的回调都在新的宏任务里执行，此时 `try` 早已退出，抛出的错误成为全局错误。
2. 未被 `await` 或 `return` 的 Promise：`Promise.reject(e)` 只是产出一个 rejected Promise，同步的 `try` 对它无效；这正是最常见的"接口报错了但没进 catch"。
3. executor 里异步抛错：`new Promise(() => { setTimeout(() => { throw e }) })` 不会让 Promise 变 rejected，错误变成全局错误。
4. 正确做法：回调内部自己 `try/catch`；Promise 统一用 `await` + `try/catch` 或 `.catch()`；事件回调交给全局 `window.onerror`；Promise 交给 `unhandledrejection` 兜底（见 Q29）。

```js
try {
  setTimeout(() => { throw new Error('timer'); }, 0); // 抓不到
  Promise.reject(new Error('promise'));               // 抓不到
} catch (e) { console.log('永远不会执行'); }
```

**追问与易错点**：

- 追问：`try { await p } catch` 为什么能抓到？答：因为 `await` 把拒绝转换成了当前函数内的 `throw`，执行栈是连续的，`catch` 有效。
- 陷阱：只在最外层包一个大 `try/catch` 就以为万事大吉。异步错误的边界必须逐个处理。
- 陷阱：用 `.then(onFulfilled).then(onFulfilled)` 却把 `catch` 写在最后，误以为能定位到具体是哪个请求失败。要按层加 `catch` 并带上上下文。

### Q29 未处理的 rejected Promise 会导致什么后果？

**考察点**：考线上稳定性意识。要知道浏览器和 Node 的行为差异，以及兜底手段。

**参考答案**：

> **一句话结论**：浏览器只报"未处理的拒绝"并派发 `unhandledrejection` 事件、控制台打 `Uncaught (in promise)`，不中断脚本；Node 15 起默认按未捕获异常处理并**退出进程**。

1. 判定时机：一个 rejected Promise 在微任务清空结束时仍没有任何 handler，就触发 `unhandledrejection`；如果之后又补了 `catch`，会再触发 `rejectionhandled`。所以日志里看到它不代表最终没处理，但通常说明代码有问题。
2. 浏览器影响：页面不会崩，但错误被静默吞掉，接口失败后界面无任何反馈，是最难排查的一类线上问题；如果这个 Promise 是队列的尾巴，整条队列会停摆。
3. Node 影响：`unhandledRejection` 事件；Node 15 起默认等价于未捕获异常，进程直接退出（可用 `--unhandled-rejections=warn` 降级），这会让服务进程被一个漏写的 `catch` 干掉。
4. 兜底：请求层统一 `catch` 并上报；全局监听 `unhandledrejection`（浏览器）/ `unhandledRejection`（Node）做最后一道防线与监控埋点。

```js
window.addEventListener('unhandledrejection', (e) => {
  report(e.reason);          // 上报监控
  e.preventDefault();        // 阻止控制台默认的未捕获提示（可选）
});
```

**追问与易错点**：

- 追问：`Promise.reject(e).catch(...)` 会不会触发？答：不会，链上有 handler 就不算未处理。
- 陷阱：以为浏览器会因此崩溃。是 Node 才会退出进程，浏览器只是报错。
- 陷阱：用 `e.preventDefault()` 把错误吞干净，结果线上永远发现不了问题。兜底监听必须配上报。

### Q30 async 函数里 return await 和 return 有什么区别？

**考察点**：经典细节题。能说清"是否在本函数内等待"以及"错误能否被本层捕获"就是过关。

**参考答案**：

> **一句话结论**：`return await p` 会在本函数内等待 `p` 敲定，因此 `p` 的拒绝能被本层的 `try/catch` 捕获；`return p` 只是把 Promise 原样对外透传，本层 `catch` 捕获不到，`finally` 会立刻执行。

1. 行为差异：`return await p` 相当于先 `const v = await p` 再 `return v`；`return p` 是把 `p` 交给外层 Promise 的解析过程接管，函数自身的 Promise 最终状态与 `p` 一致——但拒绝是在**调用方**那里体现。
2. 错误捕获：只有在 `try` 块里用 `return await p`，`p` 的失败才会走进本函数的 `catch`。这是最实际的选型依据。
3. 性能：`return await` 多一次微任务 tick 和一次可能的 Promise 包装；`return p` 在纯透传场景更省。但差异是微秒级，不要为它牺牲错误处理正确性。
4. 选型建议：需要在当前函数内处理错误或做清理 → 写 `return await`；纯粹转发、错误交给上层 → 写 `return`。（ESLint 的 `no-return-await` 也默认豁免 `try` 块。）

```js
async function a() { try { return await Promise.reject('x'); } catch (e) { return 'caught:' + e; } }
async function b() { try { return Promise.reject('x'); } catch (e) { return 'caught:' + e; } }
a().then(console.log);   // caught:x
b().catch(console.log);  // x
```

**追问与易错点**：

- 追问：`b()` 的 `finally` 什么时候执行？答：立即执行，不等 `Promise.reject('x')` 敲定，因为 `return p` 相当于同步把 `p` 交给外层。
- 陷阱：机械套用"`return await` 有性能问题所以一律用 `return`"，结果 `catch` 静默失效，是最典型的线上事故来源。
- 陷阱：以为 `return p` 会额外包一层 Promise。外层解析 thenable 会多 tick，但不会真的嵌套成一个新对象。

### Q31 for 循环里 await 是串行的，怎么改并发？

**考察点**：实战性能题。能判断"该不该并发"比会写 `Promise.all` 更重要。

**参考答案**：

> **一句话结论**：`for...of` 里 `await` 是逐次串行，总耗时等于各次之和；没有顺序依赖时改用 `Promise.all(ids.map(...))`，有并发上限要求时加限流控制器。

1. 串行代价：循环体内的 `await` 必须等上一次结束才进入下一轮，10 个 300ms 的请求就是 3 秒。
2. 改并发：先 `map` 出 Promise 数组，再交给 `Promise.all`，总耗时约为最慢的那一个。注意 `map` 结束时就全部发出了，并发是无限的。
3. 加限流：任务量大时套 Q24 的 `limit(tasks, n)`，把并发压在 N，兼顾速度与服务端压力。
4. 不能并发的情况：下一次请求的参数来自上一次的响应，或存在写入顺序要求（比如递增的乐观锁版本号），这时串行是正确选择，只能优化单次耗时。

```js
// 串行：约 3s
const results = [];
for (const id of ids) results.push(await get(id));

// 并发：约 0.3s（最慢那个）
const results = await Promise.all(ids.map((id) => get(id)));
```

**追问与易错点**：

- 追问：并发数全开有什么风险？答：浏览器同域连接数有限（HTTP/1.1 约 6），多余请求排队；服务端可能触发限流；内存与取消链路变复杂。
- 陷阱：在 `for...of` 里用 `await` 却以为已经并发了。可以看 Network 面板的瀑布图确认——并发是同时开始的竖条，串行是阶梯。
- 陷阱：`forEach` 里写 `await`。`forEach` 不等待回调返回的 Promise，等于既没串行也没拿到结果。

### Q32 await 后面的代码到底什么时候执行？

**考察点**：基础但极易被追问。核心是"微任务，不是下一帧也不是下一个宏任务"。

**参考答案**：

> **一句话结论**：`await` 之后的代码在当前宏任务的微任务清空阶段执行，比 `setTimeout(fn, 0)` 早，和 `Promise.then` 在同一队列里按入队顺序排。

1. 时序定位：`await` 之前的同步代码立即执行；`await` 之后的代码作为续体进微任务队列，在当前宏任务结束、栈空之后被清空执行。
2. 与 `setTimeout` 的关系：`setTimeout(fn, 0)` 要等下一个宏任务，所以 `await 0` 后面的代码一定先于它执行。
3. 与 `then` 的关系：同一个队列，谁先入队谁先执行。所以 `await` 之后打一行日志和 `Promise.resolve().then(打日志)` 的先后，取决于两者在同步代码里的先后。
4. 重要推论：`await` 不会让出到一个新帧，也不会让渲染插进来。所以"`await` 一下就能让页面先刷新"是错的，要让浏览器渲染必须用 `requestAnimationFrame` 或 `setTimeout` 让出宏任务。

```js
(async () => {
  console.log('a');    // 同步
  await 0;
  console.log('b');    // 微任务
})();
console.log('c');      // 同步：a c b
```

**追问与易错点**：

- 追问：连续多个 `await` 会不会被 `setTimeout` 插队？答：会。每个宏任务结束时都会检查微任务，如果这中间有已到期的定时器并轮到了它，续体要等下一轮。但同一轮里多个 `await` 会连续跑完。
- 陷阱：用 `await sleep(0)` 想触发一次重绘。要重绘请让出宏任务，例如 `await new Promise(r => setTimeout(r, 0))` 或 `requestAnimationFrame`。
- 陷阱：以为 `await` 之后的代码在"新的一帧"里执行。它仍然属于当前这一轮。

### Q33 for await...of 和异步迭代器是什么？

**考察点**：考 ES2018 的异步迭代能力。知道它能读流、知道它仍是串行，就够用。

**参考答案**：

> **一句话结论**：`for await...of` 用来遍历实现了 `Symbol.asyncIterator` 的对象，迭代器每次 `next()` 返回 Promise；它天然串行、惰性拉取，适合流式数据源。

1. 协议：对象提供 `[Symbol.asyncIterator]()`，返回一个带 `next()` 的迭代器，`next()` 返回 `Promise<{ value, done }>`。它也兼容同步可迭代对象，此时会逐个 `await` 每个值。
2. 关键特性：下一轮 `next()` 在上一轮循环体执行完才被调用，所以是串行等待，不会一次性把所有数据拉进来——这正是处理流与分页游标的价值。
3. 典型用途：Node 可读流 `for await (const chunk of stream)`、分页接口的游标遍历、SSE 事件流。
4. 中断与清理：`break`、`return` 或抛出异常都会调用迭代器的 `return()` 方法，可用于关闭连接、释放句柄。

```js
const pager = {
  page: 0,
  [Symbol.asyncIterator]() { return this; },
  async next() {
    if (this.page >= 2) return { done: true, value: undefined };
    const value = await fetchPage(this.page++);
    return { value, done: false };
  },
};
for await (const page of pager) console.log(page.length);
```

**追问与易错点**：

- 追问：和 `for...of` + `await` 有区别吗？答：语义相近，主要差别在数据源可以是异步的、且支持惰性求值与 `return()` 清理；普通数组两者等价。
- 陷阱：以为 `for await` 会自动并发。它和 Q31 的串行循环一样慢，要并发得手动 `map` + `Promise.all`。
- 陷阱：在不需要清理的场景里忘了写迭代器的 `return()`，用 `break` 退出时资源不会自动释放。

### Q34 怎么用 AbortController 取消请求？

**考察点**：实战 API 题。能区分"用户取消"和"真错误"，并知道取消不等于中止服务端处理，才算过关。

**参考答案**：

> **一句话结论**：`AbortController` 提供一个 `signal` 给 `fetch`，调用 `controller.abort(reason)` 后请求的 Promise 以 `AbortError` 拒绝，从而实现客户端取消。

1. 基本用法：`const c = new AbortController()`，把 `c.signal` 传给 `fetch`；需要取消时调用 `c.abort()`，Promise 会以 `DOMException`（name 为 `AbortError`）拒绝。
2. 区分错误类型：取消是正常业务流，`catch` 里要判断 `e.name === 'AbortError'` 并直接返回，不要弹错误提示、不要上报监控，否则监控里全是假告警。
3. 自定义原因：`abort(reason)` 可传任意值（Chrome 93+ 起支持），此时拒绝原因就是该 `reason`，`signal.reason` 也能读到，便于区分"用户切换页面取消"和"超时取消"。
4. 适用与边界：`fetch`、`addEventListener`、`AbortSignal.timeout()` / `AbortSignal.any()` 都支持；XHR 用 `xhr.abort()`，axios v0.22 起支持 `signal`（旧的 `CancelToken` 已废弃）。取消只让客户端不再等待，服务端通常仍会处理完。

```js
let controller;
async function search(kw) {
  controller?.abort('新搜索覆盖');            // 取消上一次
  controller = new AbortController();
  const res = await fetch(`/api/s?q=${kw}`, { signal: controller.signal });
  return res.json();
}
```

**追问与易错点**：

- 追问：搜索框场景怎么用？答：每次新请求先 `abort` 上一个，确保只有最后一次请求的结果被渲染，这是防竞态最干净的做法。
- 陷阱：取消后仍走 `catch` 里的错误提示逻辑，用户切个页面就弹"网络错误"。
- 陷阱：以为 abort 能撤回已经到达服务端的写请求。写操作要幂等或加上服务端取消机制。

### Q35 怎么封装一个带超时的请求？

**考察点**：实战封装题。要看你是不是只写 `Promise.race` 而忘了真正取消请求。

**参考答案**：

> **一句话结论**：给 `fetch` 配一个 `AbortController`，用 `setTimeout` 到点调用 `abort`，请求结束时清掉定时器——一个定时器同时完成"超时判定"和"真正取消"。

1. 只做 `Promise.race` 的缺陷：外层虽然提前 reject 了，原始请求还在跑、还会占连接、还可能触发后续逻辑。所以超时必须配取消。
2. 现成方案：现代浏览器与 Node 17.3+ 可用 `AbortSignal.timeout(ms)`，等价于"带超时的 signal"，代码最简；需要组合多个信号时用 `AbortSignal.any([...])`。
3. 错误要可区分：超时与业务失败应该是不同错误类型（自定义 `TimeoutError` 或带 `code`），否则调用方无法决定要不要重试。
4. 兜底细节：`finally` 里必须 `clearTimeout`，否则定时器残留；超时要走重试策略时，注意区分"可重试的超时"和"用户主动取消"。

```js
function fetchWithTimeout(url, ms, options = {}) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(new Error('timeout')), ms);
  return fetch(url, { ...options, signal: c.signal })
    .finally(() => clearTimeout(timer));   // 成功或失败都要清
}

// 现成写法（推荐）
fetch(url, { signal: AbortSignal.timeout(3000) });
```

**追问与易错点**：

- 追问：`Promise.race` 版本还有用吗？答：接口层拿不到 signal（如某些 SDK 只返回 Promise）时是唯一选择，但要接受"请求仍在跑"的事实。
- 陷阱：忘了 `clearTimeout`，短时间内大量请求会堆积定时器。
- 陷阱：把超时时间设得比服务端的幂等窗口还短，导致请求成功但客户端以为失败并重试，产生重复数据。

### Q36 封装一个带重试和退避的异步函数

**考察点**：考工程化能力。要点是"只重试该重试的""退避加抖动""有上限且可取消"。

**参考答案**：

> **一句话结论**：用 `for` 循环包 `await`，捕获错误后按指数退避等待再试，重试次数用尽才抛出最后一次错误。

1. 只重试可恢复错误：网络中断、超时、5xx、限流（429）值得重试；400/401/403/404 这类业务错误重试毫无意义，只会放大问题。
2. 指数退避 + 抖动：等待时间为 `base * 2 ** i` 并叠加随机抖动，避免大批客户端在同一时刻重试形成惊群（thundering herd）。
3. 三重上限：最大次数、单次超时（可复用 Q35）、总耗时上限，缺一个都可能让请求永远挂着。
4. 可取消：把 `AbortSignal` 一路传下去，用户离开页面时立刻中止重试循环；同时把"重试耗尽"包装成可识别的错误类型。

```js
async function retry(fn, { times = 3, base = 300 } = {}) {
  let lastErr;
  for (let i = 0; i < times; i++) {
    try { return await fn(i); }
    catch (e) {
      lastErr = e;
      if (i === times - 1) break;
      const wait = base * 2 ** i * (0.5 + Math.random()); // 指数退避 + 抖动
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}
```

**追问与易错点**：

- 追问：写请求能重试吗？答：只有幂等的才能无脑重试，非幂等写操作需要服务端提供幂等键（idempotency key），否则会产生重复下单。
- 陷阱：在 `catch` 里无条件重试，把 401 也重试三次，既没用又拖慢失败反馈。
- 陷阱：重试函数里没有 `await` 等待间隔，变成快速连打，等效于对服务端做压测。

### Q37 怎么封装一个串行任务队列？

**考察点**：考 Promise 组合能力。核心是"维护一个尾巴"，并且能说清为什么 `tail` 要接 `catch`。

**参考答案**：

> **一句话结论**：维护一个"尾巴 Promise"，每个新任务都挂在尾巴上执行并成为新尾巴，天然串行且不需要数组和索引。

1. 惰性入队：任务必须用函数包起来（`() => doSomething()`），如果直接传 Promise，任务在入队前就已经并发执行了。
2. 尾巴必须吞掉错误再往后传：写成 `tail = run.catch(() => {})`。如果直接 `tail = run`，一旦某个任务失败，后续所有任务都会因为"rejected 穿透"而自动跳过，队列静默停摆。
3. 返回 `run` 而不是 `tail`：调用方需要拿到**本次任务**的真实结果和错误，而不是被吞掉之后的尾巴。
4. 适用场景：上传队列、顺序写日志/写库、需要严格保序的埋点上报。比"数组 + 游标 + 递归"的写法短得多。

```js
function createQueue() {
  let tail = Promise.resolve();            // 队列尾巴
  return function enqueue(task) {
    const run = tail.then(() => task());   // 排在当前尾巴之后
    tail = run.catch(() => {});            // 关键：失败不阻塞后续任务
    return run;                            // 调用方仍能拿到本次结果/错误
  };
}
const enqueue = createQueue();
enqueue(() => save(1));
enqueue(() => save(2));   // 一定在 save(1) 之后执行
```

**追问与易错点**：

- 追问：和 Q24 的并发控制器什么关系？答：并发控制器是"最多 N 个同时跑"，串行队列是 N=1 的特例；两者都用"槽位/尾巴 + 补位"的思路。
- 陷阱：写成 `tail = run`，然后线上出现"一次上传失败后整个队列再也不动了"。
- 陷阱：队列无限增长没有上限。批量任务要加上背压或丢弃策略，否则内存会持续上涨。

### Q38 generator 和异步是什么关系？

**考察点**：考历史脉络。能说清"async/await 就是 generator + 自动执行器内建化"就是过关。

**参考答案**：

> **一句话结论**：生成器（Generator）本身是同步的暂停/恢复机制，配一个自动执行器就能写同步风格的异步代码，`async/await` 正是把这一模式内建进语言。

1. 生成器不是异步：`function*` 调用返回迭代器，`yield` 只是把执行权交回给调用方，需要外部反复 `next()` 推进，本身不涉及任何调度。
2. 执行器模式：`yield` 出一个 Promise，执行器 `then` 到结果后调用 `next(结果)` 把值送回去，遇到拒绝就 `iterator.throw(err)`。`co` 库、`redux-saga` 都是这个模式。
3. 内建化：ES2017 的 `async/await` 把"生成器 + 执行器"合并成语言特性，不需要第三方 runner，也不用 `function*`，同时错误传播更自然（`throw` 能同步映射到 `reject`）。
4. 今天的生成器主要用途不再是异步，而是惰性序列、无限序列、复杂状态机，以及 `redux-saga` 这类需要"可中断、可测试"副作用的场景。

```js
// 执行器：异步版的"自动 next"
function run(genFn) {
  const it = genFn();
  return new Promise((resolve, reject) => {
    const step = (fn) => (v) => {
      let r; try { r = fn(v); } catch (e) { return reject(e); }
      r.done ? resolve(r.value) : Promise.resolve(r.value).then(step(it.next), step(it.throw));
    };
    step(it.next)();
  });
}
```

**追问与易错点**：

- 追问：`async/await` 是 `Promise` 的语法糖吗？答：不严谨。它是"Promise + 挂起/恢复"的语言级能力，规范里用 `AsyncFunctionStart` 实现，不等同于生成器。
- 陷阱：说"`yield` 会阻塞线程"。它只是暂停函数自身，主线程照常运行。
- 陷阱：把生成器与迭代器混为一谈。生成器函数返回的对象同时是迭代器也是可迭代对象。

### Q39 从回调地狱到 Promise 再到 async/await，演进解决了什么？

**考察点**：考你有没有理解"为什么要有 Promise"，而不只是会用。说出控制反转（Inversion of Control）是加分项。

**参考答案**：

> **一句话结论**：回调地狱的问题不只是嵌套丑，而是错误处理分散、无法返回值、无法并行、以及控制权交给了第三方；Promise 用"状态对象"把控制权收回来，`async/await` 再把写法拉直。

1. 回调地狱的四个真实痛点：嵌套深导致可读性差；错误处理要在每一层重复写；无法 `return` 结果给上层；多个异步要串并行时只能靠计数器和标志位。
2. 控制反转问题：回调模式下把函数交给第三方库调用，你无法保证它只调用一次、一定会调用、或以正确时机调用。Promise 的"状态只能敲定一次且不可逆"直接消灭了这类不确定性。
3. Promise 带来的能力：链式扁平、错误沿链传播（一个 `catch` 兜住整条链）、可组合（`all`/`race`/`allSettled`）、值可返回可传递。
4. `async/await` 的增益：把 `then` 链改成同步书写风格，`if`/`for`/`try` 等控制流可以正常使用，调试栈也恢复正常。
5. 仍然没解决的：取消（要靠 `AbortController`）、背压与并发上限（要靠限流器）、超时。

```js
// 回调地狱
getUser(id, (u) => {
  getOrders(u.id, (o) => {
    getDetail(o[0].id, (d) => console.log(d), onErr);
  }, onErr);
}, onErr);

// Promise / async
const u = await getUser(id);
const [first] = await getOrders(u.id);
console.log(await getDetail(first.id));
```

**追问与易错点**：

- 追问：`async/await` 会不会重新变成另一种"地狱"？答：不会变成嵌套，但会写出"串行的 await 循环"，性能退化（见 Q31）。
- 陷阱：认为 Promise 让代码变成多线程。它只是把回调的注册时机提前了，执行仍然是主线程的微任务。
- 陷阱：在回调里同时用回调和 Promise 两套错误处理，导致错误被吞或重复上报。

### Q40 浏览器和 Node 的事件循环有什么区别？

**考察点**：考差异要点，不要求 Node 细节。能说出"阶段 vs 任务队列"和 "nextTick 优先"就够了。

**参考答案**：

> **一句话结论**：浏览器是"每轮取一个宏任务"的队列模型，Node 是"一轮走六个阶段"的循环模型；Node 额外有 `process.nextTick` 和 `setImmediate`，且 `nextTick` 优先于 Promise 微任务。

1. 结构差异：浏览器用任务队列（Task Queue）承载宏任务，每轮只取一个；Node 的事件循环分为 timers、pending callbacks、idle/prepare、poll、check、close callbacks 六个阶段，一轮依次走过。
2. 微任务差异：Node 有两级微任务队列——`process.nextTick` 队列优先于 Promise 微任务队列，两者在每个阶段切换时以及每个回调执行后都会被清空。浏览器只有一层微任务队列。
3. 特有 API：`setImmediate`（check 阶段执行）只有 Node 有；`requestAnimationFrame`、`MutationObserver` 只有浏览器有（Node 没有渲染概念）。
4. 定时器顺序的确定性不同：主模块顶层中 `setTimeout(fn, 0)` 与 `setImmediate(fn)` 的先后取决于进程启动耗时（1ms 边界），顺序不确定；但在 IO 回调内部，`setImmediate` 一定先执行。
5. 共同点：调用栈 + 微任务清空 + 下一轮任务的骨架是完全一致的，所以 `await`/`then` 的相对顺序规则可以迁移。

**追问与易错点**：

- 追问：面试时要不要背 Node 六个阶段？答：本章只要求记住差异要点，深入阶段行为建议专门准备 Node 运行时部分再背细节。
- 陷阱：把浏览器的"宏任务"概念直接套到 Node 上。Node 里更准确的说法是"阶段"，同一阶段会产生多个任务。
- 陷阱：认为 `setTimeout(fn, 0)` 在 Node 里一定比 `setImmediate` 早。这正是最容易被反问的一点，只有写在 IO 回调里才有确定答案。

### Q41 process.nextTick 和 setImmediate 分别是什么定位？

**考察点**：Node 侧高频追问。核心是"优先级最高的微任务"与"check 阶段的宏任务"。

**参考答案**：

> **一句话结论**：`process.nextTick` 不是定时器，而是优先级高于 Promise 的微任务，在当前操作结束后立即执行；`setImmediate` 是 check 阶段的宏任务，让出给 IO 之后执行。

1. `process.nextTick`：在当前操作完成后、事件循环继续推进之前执行。它比 Promise 微任务还早，属于"当前这一轮最紧急的收尾"。
2. `setImmediate`：在 check 阶段执行，通常排在 poll 阶段（处理 IO）之后，所以它天然让出给 IO。
3. 典型顺序：在 IO 回调内部，`setImmediate` 一定先于 `setTimeout(fn, 0)`；在主模块顶层则不确定（见 Q40）。
4. 风险：`process.nextTick` 递归会让事件循环永远进入不了下一阶段，Node 官方文档明确警告会"饿死"IO；Promise 微任务递归同理。`setImmediate` 递归则不会饿死，因为它至少要过一整轮。
5. 选择建议：需要"当前操作后立刻执行"用 `nextTick`；需要"让出 IO 后再执行"用 `setImmediate`；顺序无所谓时优先 `setImmediate`，更安全。

```js
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
setImmediate(() => console.log('immediate'));
// 输出：nextTick -> promise -> immediate
```

**追问与易错点**：

- 追问：浏览器里有 `nextTick` 吗？答：没有。Vue 2 的 `Vue.nextTick` 是自己实现的（优先微任务，降级到宏任务），只是名字借用了这个概念。
- 陷阱：把 `process.nextTick` 说成宏任务或定时器。它既不进定时器队列，也不经过阶段。
- 陷阱：用 `nextTick` 递归做轮询，进程 CPU 打满且 IO 无响应。

### Q42 queueMicrotask 和 Promise.then 有什么区别？

**考察点**：考对微任务队列的细粒度理解。能说出错误处理差异就是高分。

**参考答案**：

> **一句话结论**：两者都是往微任务队列丢回调、按入队顺序执行，区别在于 `queueMicrotask` 不创建 Promise、抛出的错误走全局未捕获异常，而 `then` 抛出的错误变成 rejected Promise。

1. 语义更纯：`queueMicrotask(fn)` 只做一件事——把 `fn` 排进微任务队列，不产生 Promise 对象、没有 `then` 的包装与值穿透规则。
2. 错误处理不同：`queueMicrotask` 回调抛错会被报为未捕获异常（走 `window.onerror` 一类全局错误处理）；`Promise.then` 回调抛错会产出一个 rejected Promise，没有 handler 时触发 `unhandledrejection`。
3. 性能：`queueMicrotask` 少一次 Promise 分配，理论上更轻；但在现代引擎里 `then` 已被高度优化，实际差异很小，不必为此改代码。
4. 选型：只是"想在当前同步代码后、渲染前执行一段逻辑"且不需要 Promise 语义（比如自定义调度器、状态库批处理）时用 `queueMicrotask`；需要串联、错误捕获、组合时用 Promise。

```js
queueMicrotask(() => { throw new Error('boom'); });   // 全局未捕获异常
Promise.resolve().then(() => { throw new Error('boom'); }); // unhandledrejection
```

**追问与易错点**：

- 追问：Vue 3 的 `nextTick` 用什么实现？答：优先 `Promise.then`，降级到 `MutationObserver` 或 `setTimeout`，本质是"把回调塞进微任务"。
- 陷阱：说 `queueMicrotask` 比 `Promise.then` 优先。它们同一个队列，严格按入队顺序。
- 陷阱：在 `queueMicrotask` 里抛出错误却只在全局监听 `unhandledrejection`，导致漏报。

### Q43 微任务死循环会发生什么？长任务怎么拆分？

**考察点**：考对调度机制的破坏性认知与性能治理手段。能对比"微任务递归 vs 宏任务递归"就很出彩。

**参考答案**：

> **一句话结论**：微任务递归会让事件循环永远进不了下一轮，渲染被彻底饿死、页面假死；长任务则要拆成多个宏任务分片让出主线程。

1. 微任务死循环的后果：队列永远清不空，浏览器没有机会进入渲染步骤，页面完全不响应（动画、点击全死）。相比之下宏任务递归（`setTimeout` 自我调用）每一轮之间还能渲染，只是慢。
2. 同类风险：Node 里 `process.nextTick` 递归会饿死 IO；`Promise.resolve().then` 递归同理。
3. 长任务判定：单次执行超过 50ms 即被视为长任务（Long Task），会造成明显掉帧；可以用 `PerformanceObserver` 监听 `longtask` 定位罪魁祸首。
4. 拆分手段：把大循环按批处理，每批之间用 `setTimeout`/`requestIdleCallback`/`scheduler.postTask`（Chrome 115+ 起）让出一轮；纯计算放到 Web Worker。
5. 让出的目的是给浏览器一个完整的"渲染 + 响应交互"机会，所以必须跨到**下一个宏任务**，用 `await Promise.resolve()` 让出是无效的（微任务还在同一轮）。

```js
async function chunkedRun(items, work, chunk = 500) {
  for (let i = 0; i < items.length; i += chunk) {
    items.slice(i, i + chunk).forEach(work);
    await new Promise((r) => setTimeout(r, 0));  // 让出一个宏任务，给渲染与交互机会
  }
}
```

**追问与易错点**：

- 追问：`await Promise.resolve()` 能让出渲染吗？答：不能。它只是排到微任务队尾，本轮内还会立刻执行，渲染依然被推迟。
- 陷阱：用递归 `setTimeout(fn, 0)` 做大数据渲染，结果反而更慢。分片大小要按 16ms 预算实测调整，不是越小越好。
- 陷阱：以为 Web Worker 能解决一切。DOM 操作不能进 Worker，结果还要 `postMessage` 序列化回主线程，通信本身也有成本。

### Q44 页面切到后台后，定时器会被节流吗？

**考察点**：考实际项目的坑。倒计时失准、轮询空转都要靠这个知识点解释。

**参考答案**：

> **一句话结论**：会。页面不可见时定时器最快被限制到约 1 秒一次，Chromium 在后台超过 5 分钟后还会进入约 1 分钟一次的密集节流；`requestAnimationFrame` 则完全暂停。

1. 基础节流：页面进入后台（不可见）时，浏览器把 `setTimeout`/`setInterval` 的最小间隔放宽到约 1 秒，避免后台页面空耗 CPU 与电量。
2. 密集节流：Chromium 从 88 版起，后台页面超过 5 分钟后，嵌套层级大于 5 的定时器链最快约 1 分钟一次（Intensive Throttling）。所以后台轮询可能几分钟才跑一次。
3. rAF 完全暂停：没有渲染帧就没有 rAF 回调。用 rAF 驱动的动画和计时在后台会直接停住。
4. 应对方式：监听 `visibilitychange` / `document.visibilityState`，回到前台时重新拉取数据并用绝对时间戳重新对齐倒计时，而不是用计数器累加。
5. 注意 Worker 里的定时器同样会被节流；WebSocket 的消息推送不受影响（但要处理断连重连）。

```js
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refresh();  // 回前台立刻补一次
  else stopPolling();                                     // 后台停止轮询
});
```

**追问与易错点**：

- 追问：后台的 `setInterval` 会补跑漏掉的次数吗？答：不会。节流是"跳过"，不是"排进队列",回到前台也不会集中触发。
- 陷阱：用 `setInterval` 每秒减一实现 60 秒倒计时。切后台再回来，倒计时明显慢了，正确做法是用截止时间戳相减。
- 陷阱：用 rAF 计算耗时。后台时它不执行，累计时间会明显偏少。

### Q45 为什么有些调度器用 MessageChannel 而不是 setTimeout？

**考察点**：考你是否知道"让出主线程"的正确姿势。能提到 React Scheduler 的取舍就是识别度很高的加分项。

**参考答案**：

> **一句话结论**：`MessageChannel` 产生的是没有 4ms 嵌套钳制、也没有后台节流的宏任务，调度粒度比 `setTimeout(fn, 0)` 细得多，适合做时间切片。

1. 需求：把一个长任务拆成多个宏任务执行，每个分片之间让浏览器渲染与响应交互。
2. `setTimeout(fn, 0)` 的问题：嵌套超过 5 层就被钳制到 4ms，一帧（16.7ms）内最多只能跑几次，分片粒度太粗；页面进后台还会被节流到 1 秒以上（见 Q44）。
3. `MessageChannel` 的优势：`port.postMessage` 投递的是一个普通宏任务，不受 4ms 嵌套钳制，也不受后台定时器节流，因此能在一帧内更密集地穿插执行分片。
4. 实践印证：React 18 的 Scheduler 就用 `MessageChannel` 实现时间切片；早期版本曾用 `requestIdleCallback`，因触发不稳定、只有 50ms 空闲上限且 Safari 不支持而放弃。
5. 新方向：`scheduler.postTask()`（Chrome 115+ 起）提供带优先级的原生任务调度，是更标准的方案，但兼容性有限，仍要降级到 `MessageChannel`。
6. 使用细节：`MessageChannel` 的 port 要复用一个实例并调用 `port.start()`，每次调度都新建 channel 会造成额外开销。

```js
const channel = new MessageChannel();
function yieldToMain(cb) {
  channel.port1.onmessage = () => cb();
  channel.port2.postMessage(null);   // 投递一个宏任务，让出主线程
}
```

**追问与易错点**：

- 追问：那为什么不用 `requestIdleCallback`？答：它在没有空闲时段时会被无限推迟，时机不可预期；时间切片需要"每帧都能拿到一小段时间"，而不是"有空才给"。
- 陷阱：认为 `MessageChannel` 是微任务。它是标准的宏任务，只不过没有定时器的那些限制。
- 陷阱：在 `yieldToMain` 里反复 `new MessageChannel()`，高频调度下会持续产生垃圾回收压力。

## 本章小结

- 每轮事件循环固定是：取一个宏任务执行到调用栈清空 → 彻底清空微任务队列 → 需要则执行渲染（含 `requestAnimationFrame`）→ 再取下一个宏任务。
- 同步代码永远最先，微任务永远早于下一个宏任务；`await` 之后的代码就是微任务，和 `Promise.then` 同队列、按入队顺序执行。
- `setTimeout` 的延迟是下界不是上界，嵌套超过 5 层按 4ms 钳制；关键定时与倒计时要用绝对时间戳校正，不要依赖 `setInterval` 的累计次数。
- `Promise` 状态一敲定即不可逆，`then` 返回新 Promise，回调返回值决定新状态，不传回调则值穿透；`then` 的回调必须是微任务，才能保证一轮内状态收敛完再渲染。
- `all` 全成功、`allSettled` 全兜住、`race` 比谁先结束、`any` 比谁先成功；限流控制器的关键是把任务写成惰性函数并同步领号。
- `async` 函数一定返回 Promise 且内部抛错只会变成 reject；`try/catch` 抓不到定时器回调、事件回调和未 `await` 的 Promise 拒绝。
- 需要在函数内捕获错误就用 `return await`，纯透传才用 `return`；循环里的 `await` 是串行，无依赖时应改成 `Promise.all` 或加限流。
- 取消用 `AbortController`、超时用 `AbortSignal.timeout` 并清定时器；长任务要拆成分片跨宏任务让出，微任务递归会让页面直接假死。

<!-- COUNT: 45 -->
