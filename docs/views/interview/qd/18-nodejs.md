---
title: "第 18 章 Node.js"
---

## 第 18 章 Node.js

### Q1 前端岗位为什么老问 Node？它到底适合做什么、不适合做什么？

**考察点**：考你对 Node 定位的判断力，能不能说清"什么时候该用、什么时候不该用"，以及它在团队里的真实价值。

**参考答案**：

> **一句话结论**：Node 是"V8 + libuv"的 JS 运行时，强在 **IO 密集、高并发长连接**，弱在 **CPU 密集**；前端团队用它主要做 BFF、SSR、构建工具和实时通信服务。

1. 适合的场景：接口聚合与 BFF、服务端渲染（SSR）中间层、WebSocket/SSE 实时通信、网关与静态服务、CLI 与构建工具链。这些任务都是"等 IO 多、计算少"。
2. 不适合的场景：图像/视频编解码、大规模加解密、复杂科学计算。这类任务会占满唯一的主线程，要做到就用 Worker Threads 或子进程拆走，或干脆换语言。
3. 对前端团队的真实价值：BFF 层做**接口聚合**（把 3 个后端接口合成 1 个响应）、**鉴权下沉**（token 只在服务端流转）、**协议转换**（REST/gRPC/GraphQL 互转）、**按端裁剪字段**（小程序少给字段省流量），并让前端掌握 SSR 中间层。

**追问与易错点**：

- 追问：BFF 的代价是什么？答：多一跳网络与一个需要运维的服务，故障面变大；接口聚合逻辑要避免变成"业务逻辑第二现场"。
- 陷阱：说"Node 性能比 Java 高"。正确说法是并发模型在 IO 密集下开销小、开发效率高，不是单核算力更强。
- 陷阱：把 Node 当"后端全能替代"。CPU 密集与需要强事务的场景，Node 不是首选。

### Q2 Node 是单线程的吗？"非阻塞 I/O"到底什么意思？

**考察点**：考你能否把"JS 执行单线程"和"Node 进程并不只有一个线程"分开讲，这是最高频的追问点。

**参考答案**：

> **一句话结论**：指的是**执行 JS 的主线程只有一个**，IO 等待交给 libuv 的线程池和操作系统异步能力处理，所以等待不阻塞主线程。

1. 单线程的含义：你的 JS 代码（包括回调）永远在同一个主线程上跑，不存在两段 JS 同时执行，所以没有锁的问题，也没有并行计算能力。
2. 非阻塞 I/O 的含义：发起读文件/网络请求后立即返回，不原地等待；等结果就绪后，通过事件通知把回调排进队列，主线程空闲时执行。
3. 背后的支撑：网络 IO 用操作系统的 epoll（Linux）/kqueue（macOS）/IOCP（Windows）多路复用；文件、DNS、加密这类没有系统异步接口的操作交给 libuv 线程池，默认 4 个线程（可用 `UV_THREADPOOL_SIZE` 调整）。
4. 推论：阻塞事件循环的从来不是"IO 慢"，而是"你在主线程里做了同步等待或长时间计算"。

```js
const fs = require('fs');
console.time('read');
fs.readFile('a.txt', () => console.log('异步完成', console.timeEnd('read')));
console.log('这行会先打印'); // 说明读取期间主线程没有被占住
```

**追问与易错点**：

- 追问：那 libuv 线程池算多线程吗？答：算，但它只负责执行 IO 任务，不执行你的 JS 回调，回调依旧回到主线程。
- 陷阱：说"Node 单线程所以不能并发"。并发能力来自事件循环对 IO 的并行等待，不是 JS 并行执行。
- 陷阱：把 CPU 密集任务写成"异步"就以为不阻塞了，`for` 循环包在回调里照样阻塞主线程。

### Q3 讲一下 Node 事件循环的六个阶段和一轮的完整顺序？

**考察点**：考结构完整性。能按 timers 到 close callbacks 顺序说全，并知道阶段之间会清空 nextTick 与微任务，才算过关。

**参考答案**：

> **一句话结论**：事件循环按 **timers → pending callbacks → idle/prepare → poll → check → close callbacks** 六个阶段循环；每进入下一个阶段前，先清空 `process.nextTick` 队列和微任务队列。

1. **timers**：执行到期的 `setTimeout` / `setInterval` 回调，到期时间受 1ms 下限影响。
2. **pending callbacks**：处理上一轮推迟的系统回调，如 TCP 错误。
3. **idle, prepare**：Node 内部使用，业务代码一般不感知。
4. **poll（核心）**：计算需要等待多久，取回 IO 事件并执行 IO 回调（读文件、网络数据到达）。没有定时器也没有 IO 时会在这里长时间等待。
5. **check**：执行 `setImmediate` 回调。
6. **close callbacks**：处理 `socket.on('close')` 这类关闭回调。之后进入下一轮。

```js
setTimeout(() => console.log('timers'), 0);
setImmediate(() => console.log('check'));
// 主模块中两者顺序不确定；若写在 IO 回调里，setImmediate 一定先执行
```

**追问与易错点**：

- 追问：为什么主模块里 `setTimeout(fn, 0)` 和 `setImmediate` 顺序不确定？答：进入 timers 阶段时 1ms 是否已过取决于进程启动耗时；在 IO 回调内则必然走完 poll 再到 check，所以 setImmediate 恒先。
- 陷阱：说"每个阶段执行完所有任务才走下一个"。同一个阶段内确实是取完队列，但阶段之间会插入 nextTick 与微任务清空，且不允许无限执行。
- 陷阱：把 poll 说成"执行所有回调"。它只处理已就绪的 IO 事件，且要配合定时器算出阻塞时长。

### Q4 process.nextTick、Promise 微任务、setImmediate、setTimeout 的优先级怎么排？

**考察点**：考你对"下一轮之前执行"这件事的精确理解，这是笔试题与实战排错的直接来源。

**参考答案**：

> **一句话结论**：同一次执行栈清空后，优先级是 **`process.nextTick` > Promise.then（微任务）> `setImmediate`（check 阶段）/ `setTimeout(fn, 0)`（timers 阶段）**，后面两个在主模块中顺序不保证。

1. `process.nextTick` 队列优先级最高，且**递归调用会饿死事件循环**——它在进入任何阶段之前被反复清空，写不好会让 IO 永远没机会执行。
2. Promise 的 `then/catch/finally`、`queueMicrotask`、`await` 之后的代码属于微任务，紧随 nextTick 队列清空，Node 11 之后**每执行完一个宏任务回调就清空一次**，与浏览器行为对齐。
3. `setImmediate` 属于 check 阶段，在当前轮 poll 之后执行，语义上就是"本轮 IO 处理完再做"。
4. `setTimeout(fn, 0)` 会被转成至少 1ms，属于下一轮的 timers 阶段，因此通常晚于 setImmediate，但不绝对。

```js
console.log('1');
setTimeout(() => console.log('2'), 0);
setImmediate(() => console.log('3'));
process.nextTick(() => console.log('4'));
Promise.resolve().then(() => console.log('5'));
console.log('6');
// 1 6 4 5 然后 2/3 顺序不确定
```

**追问与易错点**：

- 追问：nextTick 和 Promise.then 该用哪个？答：业务里优先微任务，nextTick 只在需要"当前操作彻底结束后、任何 IO 之前"的库内部场景用，如事件发射后的清理。
- 陷阱：认为 `nextTick` 是"下一个宏任务"。它是本轮的"插队"，不是下一轮。
- 陷阱：`await` 后的代码写成"同步执行"。`await` 之后的部分等价于 `.then` 回调，是微任务。

### Q5 浏览器和 Node 的事件循环有哪些差异？

**考察点**：考你能否把两套模型对齐又区分开，常见于"你在浏览器学的能直接用在 Node 吗"这类问法。

**参考答案**：

> **一句话结论**：浏览器是"宏任务 + 微任务 + 渲染"，Node 是"六阶段 + nextTick 队列"，Node 没有渲染步骤，多了 `setImmediate` 和 `process.nextTick`。

1. 任务来源不同：浏览器有用户交互、渲染、脚本、网络等任务源（Task Source）；Node 是 IO、定时器、check 阶段等固定阶段。
2. 微任务处理时机：Node 11 之前是"一个阶段执行完再清微任务"，11 之后是"每个宏任务回调执行完就清一次"，与浏览器一致；但 Node 多一个优先级更高的 nextTick 队列。
3. `setImmediate` 是 Node 独有的，等价于"poll 阶段之后的 check"；浏览器没有，只能用 `requestAnimationFrame` / `MessageChannel` 替代。
4. 渲染相关 API（`requestAnimationFrame`、`MutationObserver`）在 Node 里不存在；`setTimeout` 在浏览器有嵌套 5 层后强制 4ms 的限制，Node 是最小 1ms。

| 对比项 | 浏览器 | Node |
| --- | --- | --- |
| 一轮结构 | 宏任务 → 微任务 → 渲染 | 六阶段循环 |
| 高优先级队列 | 无（微任务最高） | `process.nextTick` 更高 |
| 独有 API | rAF、MutationObserver | setImmediate、nextTick |
| 定时器下限 | 嵌套 4ms | 1ms |

**追问与易错点**：

- 追问：Node 里为什么不需要渲染步骤？答：没有 DOM 与屏幕刷新，写文件、发网络包就是它的"渲染"，所以模型简化为纯任务阶段。
- 陷阱：说"Node 事件循环和浏览器一模一样"。微任务时机相同不代表整体模型相同。

### Q6 require 一个模块的完整流程是怎样的？模块缓存怎么用？

**考察点**：考你是否知道"包装函数"与"缓存 key 是绝对路径"这两个关键细节。

**参考答案**：

> **一句话结论**：`require` 走"**路径解析 → 查缓存 → 读文件 → 包装成函数执行 → 返回 `module.exports`**"，结果按解析后的**绝对路径**缓存进 `require.cache`，所以同一文件只执行一次。

1. 路径解析顺序：核心模块（`fs`、`path`）优先 → 缓存命中直接返回 → 以 `./`、`/` 开头按路径找 → 否则逐级向上找 `node_modules`，按"文件扩展名 `.js/.json/.node` → 目录下的 package.json 的 main/exports → index.js"补齐。
2. 文件读取后，Node 把它包装进一个函数再执行，这是 `exports`、`require`、`__filename` 这些"看似全局"变量的来源。
3. 执行结果返回 `module.exports`，并把 module 对象按绝对路径存入 `require.cache`；再次 require 直接返回同一份引用。
4. 实战含义：单例就靠这个缓存（如数据库连接池）；改文件后热重载必须 `delete require.cache[require.resolve(p)]` 才会重新执行。

```js
// Node 内部包装形式，不是全局变量，而是函数参数
(function (exports, require, module, __filename, __dirname) {
  // 你的模块代码
});
```

**追问与易错点**：

- 追问：为什么循环依赖时拿到的可能是空对象？答：缓存写入发生在**执行之前**，另一个模块此时看到的是还没执行完的半成品 exports。
- 陷阱：说"缓存 key 是文件路径字符串"。是 `require.resolve` 之后的绝对路径，同一文件不同写法只加载一次。
- 陷阱：认为 `import` 也共享同一份模块实例。CJS 与 ESM 是两套不同的加载器与缓存，互操作时有额外包装。

### Q7 module.exports 和 exports 到底有什么区别？

**考察点**：送分题，但要答出"引用指向"的本质，而不是背"别写 exports = "。

**参考答案**：

> **一句话结论**：`exports` 只是 `module.exports` 的**初始引用副本**；给 `exports` 整体赋值会断开这条引用，模块最终导出的永远是 `module.exports`。

1. 模块执行前，Node 执行了 `exports = module.exports = {}`，两者指向同一个对象。此时 `exports.a = 1` 等价于 `module.exports.a = 1`。
2. 一旦写 `exports = { a: 1 }`，`exports` 指向新对象，模块导出仍是原来的空对象，调用方拿到 `{}`。
3. `module.exports = { a: 1 }` 是替换整个导出对象，合法且常见；替换后如果还要挂属性，只能继续写 `module.exports.x`。
4. 结论性记法：**挂属性用哪个都行，整体导出只认 `module.exports`**；同一模块里不要两种混用。

```js
// 正确
exports.a = 1;                 // { a: 1 }
module.exports = { a: 1 };     // { a: 1 }

// 错误：导出结果是空对象
exports = { a: 1 };
```

**追问与易错点**：

- 追问：ESM 里有这个问题吗？答：没有。ESM 的 export 是静态声明，不存在"导出对象被重新赋值"，且导出绑定是实时的（live binding）。
- 陷阱：说"exports 是 module.exports 的别名/指针常量所以不能改"。它是普通函数参数变量，可被重新赋值，只是不影响导出结果。

### Q8 CommonJS 里出现循环依赖会怎样？

**考察点**：考你是否理解缓存写入与执行顺序的关系，能否说清"拿到半成品"的原因。

**参考答案**：

> **一句话结论**：CJS 循环依赖不会死循环，但会拿到**未执行完的 partial exports**（常见是空对象），最终结果取决于谁先被加载。

1. 机制：`require('a')` 时先创建 module 对象并写入缓存，**再执行** `a` 的代码。所以 `a` 执行中途去 require `b`，`b` 反过来 require `a` 时命中缓存，拿到的是 `a` 此刻尚未完成的 exports。
2. 经典表现：`a.js` 顶部 `require('./b')`，`b.js` 顶部 `require('./a')` 并立即使用 `a.x`，此时若 `a` 还没执行到 `a.x = ...`，`b` 里就是 `undefined`。
3. 规避手段：把 require 移到真正使用的位置（延迟到函数体内执行）、用依赖注入把对象当参数传入、或调整模块职责拆掉环。
4. ESM 表现不同：ESM 是静态分析与实时绑定，循环依赖下函数声明可用、`const` 在初始化前访问会抛 ReferenceError（暂时性死区），不会静默变空。

**追问与易错点**：

- 追问：为什么缓存要在执行前写入？答：正是为了打断无限递归，代价就是拿到半成品。
- 陷阱：说"循环依赖会直接报错/栈溢出"。CJS 会静默给你 undefined，问题往往拖到运行时才炸。
- 陷阱：认为把 `require` 提到文件顶部总没坏处。循环依赖场景下，位置就是正确性。

### Q9 CJS 和 ESM 在 Node 里怎么互操作？type 和 exports 字段各管什么？

**考察点**：进阶高频。考你知不知道两套加载器的边界、`package.json` 两个字段的实际作用。

**参考答案**：

> **一句话结论**：ESM 可以 `import` CJS（默认导出是整个 `module.exports`）；CJS `require` ESM 在 Node 20.19 / 22.12 之后默认可用，但**含顶层 await 的 ESM 不能 require**；`type` 决定 `.js` 按哪种解析，`exports` 决定外部能访问哪些入口。

1. `type` 字段：`"module"` 让 `.js` 按 ESM 解析，`"commonjs"`（默认）按 CJS；`.mjs`、`.cjs` 始终按 ESM、CJS 解析，这是最稳的跨写法。
2. `exports` 字段：定义包的**公开入口映射**，支持条件导出（`import` / `require` / `node` / `default`），同时具备**封装作用**——未列出的子路径外部无法 `require`，比 `main` 更严格。
3. 互操作规则：ESM 导入 CJS 得到 `default` 为 `module.exports`，命名导出靠静态分析（cjs-module-lexer）尽力识别，不保证都有；CJS `require` 含顶层 await 的 ESM 会抛 `ERR_REQUIRE_ASYNC_MODULE`，必须改用 `await import()`。
4. ESM 里没有 `__dirname`、`__filename`、`require`，要用 `import.meta.url` 配合 `fileURLToPath` 转换。

```js
// ESM 中取 __dirname
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
```

```json
{
  "type": "module",
  "exports": { ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" } }
}
```

**追问与易错点**：

- 追问：为什么设计条件导出？答：同一个包能同时服务 `import` 与 `require` 两种消费者，并可通过 `browser`/`node` 条件差异化实现。
- 陷阱：说"CJS 永远不能 require ESM"。要说明版本：Node 22.12 / 20.19 起默认支持同步 ESM 的 require。
- 陷阱：加了 `exports` 后外部子路径突然报 `ERR_PACKAGE_PATH_NOT_EXPORTED`，这是封装在生效，不是安装出错。

### Q10 fs 常用 API 有哪些？为什么生产环境不能用同步 API？

**考察点**：考 API 覆盖面与"阻塞事件循环"的落地判断，同时看你会不会把常见坑串起来。

**参考答案**：

> **一句话结论**：常用的是 `readFile/writeFile/appendFile/readdir/stat/mkdir/rename/unlink/copyFile`（优先 `fs/promises` 版本）；同步 API 会**卡死整个事件循环**，只允许在启动阶段用。

1. 读：`fs.readFile`（整个读进内存，仅适合小文件）、`fs.createReadStream`（大文件）、`fs.readdir`、`fs.stat`。写：`writeFile`、`appendFile`、`createWriteStream`、`rename`（原子替换）、`unlink`。
2. 两种风格：回调式 `fs.readFile(p, cb)` 与 Promise 式 `require('node:fs/promises')`；Node 10 起还有 `fs.promises`。业务代码优先 Promise + `async/await`。
3. 同步 API（`readFileSync` 等）的危害：在单线程上原地等待磁盘，期间所有请求、定时器全部排队，一个 200MB 的 `readFileSync` 就能让服务整体卡住几百毫秒到几秒。
4. 该用同步 API 的三类场景：进程启动加载配置、CLI 脚本、模块初始化读取模板——此时还没有并发请求。
5. 常被一起问的坑：`JSON.parse` 大文件、`crypto` 同步哈希大文件、日志用 `appendFileSync` 全都在阻塞事件循环，这类问题只会在压测时暴露。

**追问与易错点**：

- 追问：如何证明同步 API 阻塞了？（看现象时）打时间戳对比 `readFileSync` 前后定时器延迟，或用 `perf_hooks.monitorEventLoopDelay` 看事件循环延迟飙升。
- 陷阱：认为"异步 API 就一定不阻塞"。异步读回大文件后同步 `JSON.parse` 照样阻塞。
- 陷阱：把 `exists` 当可靠检查。它已被废弃且有竞态，正确做法是直接操作并处理 `ENOENT`。

### Q11 Stream 有哪四种类型？分别用在什么场景？

**考察点**：考基本分类与串接方式，能不能说清 Duplex 和 Transform 的区别。

**参考答案**：

> **一句话结论**：**Readable（可读）、Writable（可写）、Duplex（双工）、Transform（转换）**；Duplex 两端各读各写互不相关，Transform 是"写进去立刻变成读出来"的 Duplex。

1. **Readable**：数据源，如 `fs.createReadStream`、HTTP 请求体、`process.stdin`。消费方式：`on('data')`、`on('readable')` + `read()`，或 `for await...of`。
2. **Writable**：数据目的地，如 `fs.createWriteStream`、HTTP 响应、`process.stdout`。核心方法是 `write()` 与 `end()`。
3. **Duplex**：双向独立通道，如 TCP socket、`net.Socket`；可以同时读和写，但两端没有转换关系。
4. **Transform**：读写的中间加工者，如 `zlib.createGzip()`、`crypto.createCipheriv()`；必须实现 `_transform(chunk, enc, cb)`。
5. 串联方式：`pipe()` 或用 `stream.pipeline(src, t1, t2, dest, cb)`。生产环境优先 `pipeline`，因为它在任意环节出错时会销毁并清理所有流，避免句柄泄漏。

```js
const { pipeline } = require('node:stream/promises');
const { createReadStream, createWriteStream } = require('node:fs');
const { createGzip } = require('node:zlib');

await pipeline(createReadStream('in.log'), createGzip(), createWriteStream('in.log.gz'));
```

**追问与易错点**：

- 追问：`pipe` 有什么问题？答：它不负责关闭目标流（默认只 end 不 destroy）、上游出错时不会自动销毁下游，容易泄漏，所以推荐 `pipeline`。
- 陷阱：把 Duplex 和 Transform 混为一谈。判断标准是"写入的数据是否决定读出的数据"。
- 陷阱：以为流一定是字节流。对象模式（`objectMode`）下流里传的是任意对象，如数据库结果集。

### Q12 什么是背压（Backpressure）？pipe 是怎么实现的？

**考察点**：深挖题。考你是否真读过 `write()` 的返回值和 `drain` 事件，这是"大文件/大数据导出"翻车的根因。

**参考答案**：

> **一句话结论**：背压是**消费者处理不过来时，让生产者慢下来**的机制；`pipe` 靠 `write()` 返回 `false` 时暂停上游、`drain` 事件恢复，从而把内存占用锁在 `highWaterMark` 附近。

1. 问题场景：读磁盘比写网络快得多，如果不加控制，内存里会堆积几万个 chunk，最终 OOM 或内存曲线锯齿飙升。
2. 底层信号：`writable.write(chunk)` 返回 `false` 表示内部缓冲超过 `highWaterMark`（默认 16KB，字节流），此时必须停止写入，等 `drain` 事件后再继续。
3. `pipe` 的做法：监听上游 `data` → 调 `dest.write()` → 返回 false 就 `src.pause()`；监听 `dest.on('drain')` → `src.resume()`。这就是完整的背压闭环。
4. 自己写转发逻辑必须手工实现上面两步，否则就是在做"无限制内存缓冲"。
5. 调优：`highWaterMark` 调大可减少系统调用次数提升吞吐，但会提高单连接内存占用，要按并发数评估。

```js
function copy(src, dest) {
  src.on('data', (chunk) => {
    if (dest.write(chunk) === false) src.pause(); // 反压：先别读了
  });
  dest.on('drain', () => src.resume());           // 缓冲排空：继续读
  src.on('end', () => dest.end());
}
```

**追问与易错点**：

- 追问：为什么有时 `write()` 返回 false 也不会立刻 OOM？答：缓冲会继续增长，`false` 是唯一信号，忽略它只是把问题推迟到高峰流量。
- 陷阱：认为流天生自带背压，所以随便 `on('data')` 里同步写就没问题。没有 pause/resume 就没有背压。
- 陷阱：把 `highWaterMark` 当硬上限。它只是"提醒阈值"，不是强制的缓冲区大小上限。

### Q13 Buffer 是什么？为什么说 Buffer.allocUnsafe 有风险？

**考察点**：考内存在 Node 里的表达方式，以及"未初始化内存"这个安全点的理解。

**参考答案**：

> **一句话结论**：`Buffer` 是 Node 里表示**二进制数据**的固定长度字节数组（`Uint8Array` 的子类）；`Buffer.allocUnsafe` 不擦除内存且可能来自共享池，**未写入前的内容是残留数据，直接返回会泄露敏感信息**。

1. 三种创建方式：`Buffer.from(str|array)`（从已有数据）、`Buffer.alloc(size)`（清零，安全）、`Buffer.allocUnsafe(size)`（不清零，快，但必须立即整体覆盖）。
2. 内存分配：小 Buffer 从预分配的 8KB 内存池（pool）里切片，这也是 V8 之外的堆外内存；`Buffer.allocUnsafe` 正是复用了池中已释放的旧区块。
3. 编码转换：`buf.toString('utf8')`、`Buffer.byteLength(str)`；文本默认 UTF-8，处理中文/emoji 时按字节切分会把字符截断，`toString` 会出现替换字符。
4. 实用 API：`concat` 合并、`slice`（共享内存，改一处影响两处）、`subarray`、`buf.equals`、`buf.readUInt32BE` 等读写方法。
5. 与前端的关系：`ArrayBuffer`/`TypedArray` 与 Buffer 可互相转换，处理文件分片上传、图片流时都要落到 Buffer。

**追问与易错点**：

- 追问：`slice` 和 `subarray` 有什么区别？答：都共享底层内存，`slice` 返回 Buffer，`subarray` 返回 Buffer（同为 Buffer 子类），要独立副本必须 `Buffer.from(buf)` 或 `Uint8Array.prototype.slice` 之外的拷贝方式。
- 陷阱：以为 `Buffer.from('中文').length` 等于字符数。它是字节数，中文 UTF-8 下通常 3 字节。
- 陷阱：用 `allocUnsafe` 后只写了一部分就把整个 Buffer 发出去，会泄露进程内其他数据。

### Q14 大文件怎么处理？上传和下载各要注意什么？

**考察点**：考你会不会真用流，能不能说出"不要一次读进内存"的原因，以及分片上传的完整设计。

**参考答案**：

> **一句话结论**：读写一律用**流 + `pipeline`**，避免整文件进内存；上传用 `diskStorage` 落盘而非 `memoryStorage`，超大文件走**分片上传 + 服务端合并**。

1. 下载：`createReadStream(file)` → `pipe(res)`，并设置 `Content-Length`、支持 `Range` 断点续传（解析 `Range: bytes=start-end` 返回 206 与 `Content-Range`，用 `start`/`end` 选项开流）。
2. 上传（常规）：`multer` 的 `diskStorage` 直接写盘，配合 `limits: { fileSize }` 限制大小；`memoryStorage` 只适合小图片处理，大文件会把整个文件塞进内存。
3. 上传（大文件）：前端 `file.slice()` 切片 → 每片带 `hash`、序号、总数单独上传 → 服务端按 `hash` 落临时目录 → 全部到齐后用读流依次 `write` 或 `appendFile` 合并 → 校验整体 hash 后移入正式目录。
4. 秒传与续传：先请求"该 hash 是否已存在/已上传分片列表"，已存在直接返回成功（秒传），否则只补缺失分片。
5. 注意点：临时分片要设过期清理任务；合并前必须校验 hash，否则可能拼出被污染的完整文件。

```js
// 断点续传的最小实现
const range = req.headers.range;
const { size } = await fs.promises.stat(file);
const [start, end] = range.replace('bytes=', '').split('-');
res.writeHead(206, {
  'Content-Range': `bytes ${start}-${end}/${size}`,
  'Accept-Ranges': 'bytes',
  'Content-Length': end - start + 1,
});
fs.createReadStream(file, { start: +start, end: +end }).pipe(res);
```

**追问与易错点**：

- 追问：为什么不用 `readFile` 读 1GB 再 `res.send`？答：它会把整个文件一次性读进内存（堆外 Buffer，不占 V8 堆），造成内存峰值甚至 OOM，超过 Buffer 上限时抛 `ERR_FS_FILE_TOO_LARGE`，读完后的处理也会长时间卡住事件循环。
- 陷阱：只做前端分片而服务端仍拼成一个大 Buffer 再写盘，流式的好处全丢了。
- 陷阱：忘记给上传接口设 `limits`。这是最典型的磁盘打满与 DoS 入口。

### Q15 path、url、process、os、events 这几个核心模块有哪些必知要点？

**考察点**：考日常 API 的熟练度，重点是跨平台路径与进程信息的常用字段。

**参考答案**：

> **一句话结论**：`path` 管跨平台路径拼接与解析、`url` 管 URL 与文件路径互转、`process` 管进程与运行环境、`os` 管系统信息、`events` 提供事件模型基类；这五个模块几乎每个 Node 项目都会用到。

1. `path`：`join`（拼接并规整）、`resolve`（以绝对路径为目标解析，常用于防路径穿越）、`parse/format`、`basename/extname/dirname`、`sep`（Windows 为 `\`）、`posix` 命名空间。**永远不要用字符串拼 `+ '/' +`**。
2. `url`：`new URL(str)` 解析、`URLSearchParams` 处理查询串、`fileURLToPath` / `pathToFileURL` 在 ESM 下找回真实路径。
3. `process`：`argv`（含参数）、`env`（环境变量，值都是字符串）、`cwd()`、`exitCode` / `exit()`、`nextTick`、`on('SIGTERM'|'uncaughtException')`、`memoryUsage()`、`uptime()`、`pid`。`process.env` 只读环境变量，不能跨进程共享。
4. `os`：`cpus()`（配合 cluster 决定 fork 数量）、`totalmem/freemem`、`loadavg`、`platform/arch`、`tmpdir()`。
5. `events`：`EventEmitter` 基类、`once(emitter, name)`、`events.once` 用于把事件转 Promise。

**追问与易错点**：

- 追问：`join` 和 `resolve` 差别？答：`join` 只是拼接规整，结果可能是相对路径；`resolve` 从右往左拼到绝对路径为止，通常与 `process.cwd()` 相关。
- 陷阱：用 `resolve(userInput)` 就直接读文件。用户传 `../../etc/passwd` 会逃逸出目录，必须校验结果是否仍在允许的根目录内。
- 陷阱：把 `os.cpus().length` 直接当 fork 数量。容器里它还可能是宿主机的核数，应按 cgroup 配额或环境变量定。

### Q16 EventEmitter 的事件模型有哪些坑？

**考察点**：考你是否知道 `emit` 是同步的、`error` 事件特殊、监听器泄漏告警这几条实战要点。

**参考答案**：

> **一句话结论**：`EventEmitter` 是 Node 事件模型的基类，`emit` **同步执行**所有监听器；未处理的 `error` 事件会直接抛异常导致进程崩溃，监听器不清理则触发泄漏告警。

1. 基本 API：`on`（持续监听）、`once`（只执行一次并自动移除）、`emit`（按注册顺序**同步**调用）、`off/removeListener`、`removeAllListeners`、`listeners`、`setMaxListeners`。
2. `error` 事件是特殊的：没有任何 `error` 监听器时，`emit('error')` 会把错误抛出，等同于未捕获异常；所以给自定义 emitter 加 `error` 兜底是硬要求。
3. `emit` 同步的后果：监听器里的耗时逻辑会阻塞发射方，一个监听器抛错会中断后续监听器；反过来，"先 emit 后注册"的回调会永远收不到。
4. 泄漏告警：同一事件超过 10 个监听器会打印 `MaxListenersExceededWarning`，常见于请求里反复 `on('data')` 或循环中注册定时器，本质是监听器没有随生命周期释放。
5. 与浏览器事件的区别：Node 没有冒泡/捕获、没有 DOM，事件名是任意字符串；`once(emitter, 'name')` 和 `stream.pipeline` 都是把事件转成 Promise/回调的官方工具。

```js
const { EventEmitter, once } = require('node:events');
const bus = new EventEmitter();
bus.on('error', (e) => console.error('兜底', e.message)); // 必须
queueMicrotask(async () => {
  await once(bus, 'ready');
  console.log('收到 ready');
});
bus.emit('ready');
```

**追问与易错点**：

- 追问：`events.once()` 有什么用？答：把"等某个事件"写成 `await`，同时它会自动监听 `error`，避免等待期间进程被 error 事件打崩。
- 陷阱：以为监听器是异步执行的。`emit` 是同步调用，写成"emit 后马上打印日志"的顺序时要注意。
- 陷阱：在请求处理里给同一个全局 emitter 不断 `on`，请求结束后不 `off`，内存与监听器数一起涨。

### Q17 为什么说 try/catch 覆盖不到异步错误？错误优先回调是什么？

**考察点**：考异步错误的捕获边界，这是新手最容易踩、面试官最爱追问的一题。

**参考答案**：

> **一句话结论**：`try/catch` 只能捕获**当前同步调用栈**里的异常；异步回调在新的一轮事件循环中执行，栈已经换了，异常无法被外层 catch 捕获，所以回调式 API 统一约定 `(err, data)` 的**错误优先回调（Error-First Callback）**。

1. 失败示例：`try { fs.readFile('x', () => { throw new Error('boom') }) } catch (e) {}` 抓不到，异常会冒到 `uncaughtException` 并可能让进程退出。
2. 错误优先回调：第一个参数永远是 `err`，成功时为 `null`；约定要求**必须判断 err 并 return**，否则会带着非法数据继续往下执行（`Cannot read properties of undefined`）。
3. Promise 化后的规则：`await` 表达式可以用 `try/catch` 捕获，因为 `await` 把后续代码变成了微任务并保持在同一逻辑链上；裸 Promise 必须 `.catch()` 或 `await` 包住。
4. 定时器、事件监听器的回调同理：`setTimeout(() => { throw e })`、`emitter.on('data', () => { throw e })` 都不在 try 范围内。
5. 工程解法：统一用 `async/await` + `try/catch`，或给异步函数包一层 `promisify`（`util.promisify`）把错误优先回调转成 Promise。

```js
const { promisify } = require('node:util');
const readFile = promisify(require('node:fs').readFile);

try {
  const data = await readFile('a.txt', 'utf8'); // 用 await 才能被 catch
} catch (err) {
  if (err.code === 'ENOENT') console.error('文件不存在');
}
```

**追问与易错点**：

- 追问：那 `await` 之后抛的错为什么能抓到？答：`await` 把函数体剩余部分注册为微任务，Promise 的 reject 会沿着同一条链路向上传递到 try 块。
- 陷阱：写完 `fs.readFile(p, (err, data) => { ... })` 不看 err 就直接 `JSON.parse(data)`，线上表现为随机崩溃。
- 陷阱：把 `throw` 写在回调里还指望 Express 的错误中间件接住。Express 4 同步抛错才接得住，回调里异步抛错必须 `next(err)`。

### Q18 uncaughtException 和 unhandledRejection 怎么处理？

**考察点**：考"兜底之后的正确动作"，答成"加个监听器就万事大吉"会立刻被追问穿。

**参考答案**：

> **一句话结论**：两者都表示**已经失控的错误**，正确动作是**记录现场与告警，然后优雅退出让进程管理器重启**，而不是继续对外服务。

1. `uncaughtException`：同步代码或异步回调里没人接的异常。触发时进程状态可能已被破坏（连接半开、内存池损坏），继续运行会给出错误结果，所以官方明确建议退出。
2. `unhandledRejection`：Promise 被 reject 且无 `.catch`。Node 15 起默认按未捕获异常处理，会直接让进程退出；显式用 `--unhandled-rejections=warn` 才能降级为警告（不建议在生产长期使用）。
3. 退出前的动作：写错误日志（含 stack、请求上下文、traceId）、上报监控、在超时内关闭 server 与数据库连接，然后 `process.exit(1)`。
4. 配套措施：用 PM2 / systemd / K8s 做进程守护自动拉起；加 `process.on('warning')`、`--trace-warnings` 排查 MaxListeners 等隐患；不要在 `uncaughtException` 里尝试恢复业务。
5. 真正减少崩溃的做法：全局兜底只当最后一道网，业务代码改用 `async/await` + 统一错误中间件，让每层都有明确的错误出口。

```js
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  server.close(() => process.exit(1));   // 排空后退出，交守护进程拉起
  setTimeout(() => process.exit(1), 5000).unref(); // 兜底强制退出
});
```

**追问与易错点**：

- 追问：为什么不在 `uncaughtException` 里继续服务？答：异常的来源位置未知，可能已破坏不变量，继续服务等于拿用户数据赌博。
- 陷阱：只 `console.error(err)` 就完事。没有退出、没有告警，进程会带着坏状态一直跑到更严重的事故。
- 陷阱：认为加了 `unhandledRejection` 监听器就不会退出了。Node 15+ 的默认行为已被接管，是被你的监听器捕获还是抛错，取决于版本与参数，必须显式确认。

### Q19 CPU 密集任务怎么办？child_process、fork、Worker Threads、队列怎么选？

**考察点**：深挖题。考"多进程 vs 多线程 vs 外部队列"的选型逻辑，而不是罗列 API。

**参考答案**：

> **一句话结论**：CPU 密集且要**返回值/共享内存**用 Worker Threads；要**跑独立程序、隔离性好**用 `child_process`，其中 `fork` 是 Node 子进程且自带 IPC；**要跨机器、要重试与持久化**则交给 BullMQ 这类队列，定时任务用 `node-cron`。

1. `child_process.spawn`：启动任意可执行文件、流式通信、参数以数组传入（天然防命令注入）；`exec` 走 shell、有命令拼接风险且缓冲输出，只适合短小命令；`execFile` 同 spawn 且不经 shell，更安全。
2. `child_process.fork`：本质是 spawn 一个 Node 进程，多了 `send()`/`message` 的 IPC 通道，适合把模块跑在独立内存里（如不受信任的脚本执行、独立的重任务）。
3. Worker Threads（`worker_threads`）：同一进程内的真线程，各线程有独立事件循环与堆，可用 `SharedArrayBuffer` + `Atomics` 共享内存，启动开销远小于进程，适合图像处理、加解密、大 JSON 解析。
4. 选型对比：进程隔离强、崩溃不互相影响但内存翻倍、IPC 需序列化；线程更省内存、通信更快但一个线程的错误仍可能拖垮进程（有 `resourceLimits` 可限制堆）。
5. 定时任务与队列：`node-cron` 在同一进程内触发，**多实例部署会重复执行**，需加 Redis 锁或只让一个实例跑；`BullMQ` 基于 Redis，提供持久化、延迟任务、重试退避、并发控制与横向扩展的 worker，适合发邮件、生成报表这类必须可靠完成的后台任务。

**追问与易错点**：

- 追问：为什么 `exec` 有注入风险？答：它把整串命令交给 shell 解析，用户输入里的 `;`、反引号会被执行，改用 `execFile`/`spawn` + 数组参数。
- 陷阱：用 `cluster` 解决 CPU 密集。cluster 是复制进程做并发，每个 worker 依然单线程；真正要算得用 Worker Threads。
- 陷阱：在请求链路里直接 `await` 一个耗时 3 秒的 CPU 任务，无论放主线程还是 worker，接口 P99 都不会好看，正确做法是"提交任务 → 返回任务号 → 轮询/推送结果"。

### Q20 cluster、PM2 与优雅退出怎么配合？

**考察点**：深挖题。考生产部署的完整闭环：多进程负载均衡、零停机重启、SIGTERM 连接排空。

**参考答案**：

> **一句话结论**：`cluster` 用主进程 fork 多个 worker 复用同一端口做负载均衡；PM2 cluster 模式在此之上提供进程守护与 `reload` 零停机重启；优雅退出的关键是**收到 SIGTERM 后停止接收新连接、排空在用连接、超时强退**。

1. cluster 原理：主进程 `cluster.fork()` 出多个 worker，worker 通过 `cluster` 模块共享服务器句柄，由主进程分发新连接；除 Windows 外默认轮询（round-robin）调度，可通过 `cluster.schedulingPolicy` 调整。worker 崩溃后主进程可监听 `exit` 重新 fork，实现自愈。
2. PM2 的价值：`pm2 start app.js -i max` 按 CPU 核数拉起 cluster，提供日志聚合、内存超限自动重启（`max_memory_restart`）、开机自启与监控；`pm2 reload` 是逐个替换 worker，达到零停机。
3. 优雅退出的标准写法：监听 `SIGTERM`/`SIGINT` → `server.close()` 停止接受新连接 → 等在途请求结束 → 关闭数据库/Redis 连接 → `process.exit(0)`；同时设一个超时（如 10s）强制退出，避免卡住部署。
4. 三个容易漏的点：`server.close()` 只停止新连接，不会断开 keep-alive 空闲连接（Node 18+ 可用 `server.closeIdleConnections()`）；长连接（WebSocket/SSE）要主动通知客户端重连；PM2 的 `kill_timeout` 必须大于你的排空超时，否则会被 SIGKILL。
5. 队列消费者同样要处理：退出前停止拉取新任务、把正在处理的任务做完或归还，否则会出现任务丢失或重复。

```js
process.on('SIGTERM', async () => {
  server.close();                       // 不再接受新连接
  server.closeIdleConnections?.();      // 断掉空闲 keep-alive
  const wait = () => new Promise((r) => {
    server.getConnections((err, n) => (n > 0 ? setTimeout(() => r(wait()), 100) : r()));
  });
  setTimeout(() => process.exit(1), 10000).unref(); // 超时兜底强退
  await wait();                         // 等在途请求结束
  await db.end();
  process.exit(0);
});
```

**追问与易错点**：

- 追问：多进程下 session 放内存为什么不行为？答：每个 worker 有独立内存，请求被分到别的 worker 就丢登录态，必须用 Redis 等外部存储或改无状态 JWT。
- 陷阱：以为 `pm2 restart` 也是零停机。`restart` 是杀进程再起，只有 `reload` 才是逐个替换。
- 陷阱：SIGKILL 无法被监听。部署脚本给的时间太短，Node 还没来得及排空就被杀掉，表现为用户看到 502。

### Q21 Node 的内存是怎么管的？线上内存泄漏怎么排查？

**考察点**：深挖题。考 V8 分代回收的基本认知，以及"用什么工具、看什么指标"的可操作排查路径。

**参考答案**：

> **一句话结论**：JS 对象分配在 V8 堆上，分**新生代（Scavenge，复制算法）与老生代（标记清除/标记整理）**；堆大小受 `--max-old-space-size` 限制；排查泄漏靠**堆快照对比 + 内存曲线 + 事件循环延迟**三条线。

1. 基本机制：新对象先进新生代，经过两次回收仍存活则晋升老生代；老生代用标记清除（Mark-Sweep）与标记整理（Mark-Compact），回收时会短暂停顿（STW）。64 位默认老生代上限约 2-4GB，容器里常需显式 `--max-old-space-size=1024` 并与容器内存上限对齐，否则会被 OOM Killer 杀掉。
2. 内存构成：`process.memoryUsage()` 给出 `rss`（总驻留）、`heapTotal`、`heapUsed`、`external`（Buffer/ArrayBuffer 等堆外）；**Buffer 不计入 heapUsed**，所以处理大文件时 "堆没涨但内存爆了" 是正常现象，要盯 rss 和 external。
3. 常见泄漏源：挂在全局对象上的缓存（Map 只增不减）、闭包持有大对象、事件监听器与定时器未清理、每个请求都新建连接池/emitter、`stream` 未销毁、Promise 链长期挂起。
4. 排查步骤：先看曲线是否"只涨不落"（GC 后仍持续上升）→ `node --inspect` 打开 Chrome DevTools 的 Memory → 隔一段时间抓两份 **Heap Snapshot** 做 Comparison，看哪些对象在 delta 里持续增加 → 用 `heapdump` 在线上按信号触发快照 → `clinic doctor` / `clinic heap` 一键给出结论与火焰图。
5. 辅助信号：`perf_hooks.monitorEventLoopDelay()` 显示事件循环延迟（P99）持续上升，往往对应的就是 GC 压力或同步阻塞，二者要一起看。

**追问与易错点**：

- 追问：为什么要把堆上限和容器内存对齐？答：Node 只看 V8 堆上限，默认值可能大于容器 limit，触发的是宿主的 OOM Kill（无堆栈、无日志），比堆溢出更难查。
- 陷阱：看到 heapUsed 高就断定泄漏。正常波动、GC 尚未触发都会让 heapUsed 偏高，判定标准是"多次 GC 后的最低点是否持续抬高"。
- 陷阱：把 Buffer 当成普通对象。它属于 `external`，调优要用流 + 限流，不是调 GC 参数。

### Q22 怎么给 Node 服务做压测和性能分析？

**考察点**：深挖题。考你有没有完整的"压测 → 定位 → 验证"闭环，而不只是"跑个 ab"。

**参考答案**：

> **一句话结论**：压测用 **`autocannon`（或 `ab`/`wrk`）** 看吞吐、延迟分位与错误率；定位用 **`node --prof` + `--prof-process`、`0x`、`clinic flame`** 生成火焰图找热点；同时盯 **事件循环延迟与内存**。

1. 压测工具：`autocannon -c 100 -d 30 -p 10 http://host/api` 可以指定连接数、时长、流水线数，输出 RPS、P50/P95/P99、非 2xx 数量；`ab` 简单但只支持 HTTP/1.0、能力有限；`wrk` 吞吐更强但脚本化成本高。压测要与生产同构（同 Node 版本、同机器规格、同依赖）。
2. 必须看的指标：**P95/P99 延迟**（平均值会掩盖长尾）、错误率、RPS 曲线是否在并发上升时掉头（说明到达瓶颈）、CPU 使用率、事件循环延迟（`perf_hooks` 或 clinic doctor）。
3. CPU 火焰图：`node --prof app.js` 压测后生成 `isolate-*.log`，再用 `node --prof-process isolate-*.log` 输出各函数占比；`0x` 可直接出 SVG 火焰图；`clinic flame` 更方便。热点常见于 JSON 序列化、正则、模板渲染、同步 IO。
4. 内存与异步分析：`clinic doctor` 给总体诊断（IO 阻塞、GC、事件循环），`clinic bubbleprof` 看异步调用耗时，`clinic heap` 看内存分配。
5. 定位后的典型优化：加缓存（Redis/本地 LRU）、把重 CPU 任务挪到 Worker Threads、减少同步 API 与深拷贝、开启 HTTP keep-alive、调大连接池、静态资源交给 Nginx、必要时加实例。

```bash
autocannon -c 200 -d 30 http://127.0.0.1:3000/api/users
node --prof server.js            # 压测期间采样
node --prof-process isolate-*.log > profile.txt
npx clinic flame -- node server.js
```

**追问与易错点**：

- 追问：为什么 P99 比平均值重要？答：1% 的慢请求对应的就是每秒几十个用户体感卡顿，平均值看不出，SLO 通常按 P95/P99 定。
- 陷阱：拿压测机同时跑压测客户端和服务端。CPU 被压测工具抢走，结果完全失真。
- 陷阱：只优化 RPS 数字，忽略错误率。很多"高吞吐"其实是快速返回 500 换来的。

### Q23 Express 和 Koa 的中间件模型有什么区别？

**考察点**：进阶高频。考"线性 next 链"与"洋葱模型"的本质差异，以及 async 支持带来的错误处理差别。

**参考答案**：

> **一句话结论**：Express 是**线性队列 + `next()` 传递**，中间件逻辑基本只向下走；Koa 是**洋葱模型**，`await next()` 之后的代码会在内层返回后执行，且原生基于 async/await。

1. Express 模型：中间件 `(req, res, next)` 依次执行，调用 `next()` 交出控制权；不调用 `next()` 也不结束响应就会挂起。因为自身基于回调，`next()` 之后的"回程逻辑"要靠 `res.on('finish')` 这类手段实现。
2. Koa 模型：中间件是 async 函数，`await next()` 之前是"向下走"，之后是"向上回"——请求进来依次进入所有中间件到最内层，再依次返回，这就是洋葱模型。典型用途是统一计时、统一响应包装、事务提交。
3. 错误处理：Koa 用最外层 `try { await next() } catch (err)` 就能捕获内层任意深度的 async 抛错；Express 4 的 async 中间件抛错不会被自动捕获，必须自己 catch 后 `next(err)`，或使用 Express 5（支持返回 Promise，reject 自动进入错误中间件）。
4. 错误中间件签名：Express 用四参数 `(err, req, res, next)` 且必须放在最后注册；Koa 直接在洋葱最外层 try/catch，更符合直觉。
5. 其他差异：Koa 无内置路由与 body 解析（需 `@koa/router`、`koa-bodyparser`），更轻、更贴近标准 HTTP；Express 生态最庞大、中间件最多。选型：小而新的服务、SSR 中间层倾向 Koa；需要海量现成中间件、团队熟悉度优先选 Express。

```js
// Koa 洋葱：出口顺序是 1 -> 2 -> 2 之后 -> 1 之后
app.use(async (ctx, next) => { console.log(1); await next(); console.log('1 之后'); });
app.use(async (ctx, next) => { console.log(2); await next(); console.log('2 之后'); });
```

**追问与易错点**：

- 追问：Express 能实现洋葱效果吗？答：可以，用 `next()` 之后继续写代码并在末尾注册兜底逻辑，但同一中间件里无法靠 `await` 等内层完成，实践上很少这么做。
- 陷阱：在 Koa 中间件里忘记 `await next()`，后面的中间件不会执行，接口直接 404/挂起。
- 陷阱：说"Koa 更快所以选 Koa"。两者框架开销都很小，瓶颈几乎总在数据库和业务代码上。

### Q24 手写一个 Koa 的 compose（中间件组合）实现

**考察点**：深挖手写题。考洋葱模型的数据结构、Promise 串联方式，以及"防止 next 被多次调用"这个 Koa 源码级别的细节。

**参考答案**：

> **一句话结论**：`compose` 用**闭包保存的游标 `index`** + 递归 `dispatch(i)` 把中间件串成 Promise 链，每个中间件拿到 `next = () => dispatch(i + 1)`，返回的 Promise 让外层能 `await` 到内层结束，从而实现洋葱模型。

1. 思路：把中间件数组按顺序串联。`dispatch(i)` 调用第 i 个中间件，并把 `() => dispatch(i + 1)` 作为它的 `next`。因为返回的是 Promise，中间件里 `await next()` 就能等内层全部完成。
2. 关键细节一：用 `index` 记录当前执行到哪一层，`if (i <= index) reject('next() called multiple times')`，防止同一个中间件多次调用 `next` 造成重复执行。
3. 关键细节二：用 `try/catch` 包住同步抛错并转成 `Promise.reject`，保证调用方能用 `.catch` 统一处理；`async` 函数本身抛错也会自动变成 reject。
4. 关键细节三：越界时若有外层 `next`（compose 嵌套时）要调用它，否则返回 `Promise.resolve()` 结束。
5. 考察点：递归与 Promise 串联的掌握、闭包状态管理、对 `await next()` 回程的理解；常见扣分是忘了游标校验或没把同步异常转成 reject。

```js
function compose(middlewares) {
  if (!Array.isArray(middlewares)) throw new TypeError('middlewares must be an array');
  return function (ctx, next) {
    let index = -1;
    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'));
      index = i;
      let fn = middlewares[i];
      if (i === middlewares.length) fn = next; // 兼容外层 next
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
}
```

**追问与易错点**：

- 追问：为什么 `dispatch` 要返回 Promise 而不是直接执行？答：只有返回 Promise，中间件才能 `await next()` 拿到内层结束的时机，这是洋葱模型"回程"的基础。
- 陷阱：用 `for` 循环 + `await` 顺序执行中间件。那样只能向下走，退化成了 Express 的线性模型，没有回程。
- 陷阱：忘记 `Promise.resolve()` 包装。当中间件是同步函数返回 undefined 时，外层 `await next()` 会拿到非 Promise 值，虽然在 `await` 下仍能工作，但错误处理路径不统一。

### Q25 Nest.js 的核心概念是什么？什么时候值得用？

**考察点**：进阶题。考你是否了解"带架构约束的 Node 框架"，重点在模块、依赖注入、装饰器与请求生命周期。

**参考答案**：

> **一句话结论**：Nest.js 是**基于装饰器与依赖注入（DI）的 Node 服务端框架**，用模块（Module）组织代码，默认跑在 Express 上（可换 Fastify），适合中大型团队与 TypeScript 项目。

1. 模块：`@Module({ imports, controllers, providers, exports })` 是组织单元，每个应用至少一个根模块；模块之间的依赖要显式 import，天然形成边界，避免"全局到处 require"。
2. 依赖注入：用 `@Injectable()` 标记可注入的类，在构造函数里声明依赖类型，由 IoC 容器实例化并注入；作用域有单例（默认）、请求级、瞬态，请求级会带来额外开销。
3. 装饰器与路由：`@Controller('users')` + `@Get(':id')` 声明式定义路由，参数用 `@Param`、`@Query`、`@Body` 取出，天然配合 `class-validator` + `ValidationPipe` 做参数校验。
4. 请求生命周期：中间件（Middleware）→ 守卫（Guard，鉴权）→ 拦截器（Interceptor，前置）→ 管道（Pipe，校验与转换）→ 控制器方法 → 拦截器（后置）→ 异常过滤器（ExceptionFilter）。这套分层让鉴权、日志、响应包装都有固定位置。
5. 什么时候用：团队大于几人、需要统一架构与长期维护、强类型与测试要求高时值得；小工具服务、只有几个接口时，Koa/Express 更轻，Nest 的样板代码与学习成本会显得重。

**追问与易错点**：

- 追问：Nest 的 DI 和前端框架有什么关系？答：思路与 Angular 一脉相承，Vue3 的 `provide/inject` 也是同一类思想，只是 Nest 由容器自动解析构造函数参数类型。
- 陷阱：说"Nest 只能配 Express"。它通过适配器抽象支持 Fastify 等，切换基本不影响业务代码。
- 陷阱：把请求级作用域随手用在服务上。每个请求都新建实例，性能和内存都会受影响。

### Q26 接口路由怎么设计？参数校验放在哪一层？

**考察点**：基础但必问。考路由规范与"校验是接口层职责"的意识，顺带看你有没有统一错误结构的概念。

**参考答案**：

> **一句话结论**：路由按**资源化名词 + HTTP 方法表意**设计，校验放在**路由层入口**（用 schema 库统一处理），业务层只接收已经合法的数据。

1. 命名规范：资源用复数名词（`/users`、`/orders`），层级用嵌套表达归属（`GET /users/:id/orders`），动作交给 method（`GET` 查、`POST` 增、`PUT` 全量改、`PATCH` 局部改、`DELETE` 删），避免 `/getUserList` 这类动词路径。需要非 CRUD 动作时用子资源（`POST /orders/:id/cancel`）。
2. 版本与兼容：统一前缀 `/api/v1`，破坏性变更升版本；分页、排序、过滤用 query（`?page=1&size=20&sort=-createdAt`），并在响应里返回 `total`。
3. 参数校验：用 `zod` / `joi` / `express-validator` / `class-validator` 在入口校验 `params`、`query`、`body`、`headers` 四类来源，注意 `query` 值全是字符串要做类型转换；校验失败统一返回 400。
4. 统一错误结构：`{ code, message, data }` 或 HTTP 状态码 + `{ error: { code, message, details } }`，前端只写一次错误处理；不要一个接口返回 `{success:true}`、另一个抛 HTML 错误页。
5. 越权意识：路径参数（如 `:id`）必须在业务层再校验归属，`/users/123/orders` 不能因为登录了就允许查任意用户订单。

```js
const schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().max(100).default(20),
});
router.get('/users', (req, res) => {
  const r = schema.safeParse(req.query);
  if (!r.success) return res.status(400).json({ code: 'INVALID_PARAM', details: r.error.issues });
  // 从这里开始拿到的就是可信数据
});
```

**追问与易错点**：

- 追问：为什么不用 `PUT` 做局部更新？答：`PUT` 语义是全量替换，漏传字段意味着置空；局部更新用 `PATCH`，避免误清数据。
- 陷阱：只在 service 里零散写 `if (!body.name) throw`。校验分散、错误格式不统一，前端要写 N 套兼容逻辑。
- 陷阱：认为"校验过了就不用再校验归属"。参数合法性不等于权限合法性。

### Q27 JWT 和 session 怎么选？刷新 token 怎么设计？

**考察点**：进阶高频。考无状态与有状态的取舍，以及 Cookie 安全属性和双 token 方案的实际设计。

**参考答案**：

> **一句话结论**：**JWT 无状态、适合横向扩展与跨服务但无法主动失效**；**session 有状态、可随时踢人但需要 Redis 之类的共享存储**；生产常用"短效 access token + 长效 refresh token（HttpOnly Cookie）"折中。

1. JWT 特点：三段式 `Header.Payload.Signature`，服务端只验签不存副本，所以水平扩展无压力、可跨服务传递；代价是签发后到期前一直有效，改密码/封号只能靠**黑名单或版本号**补偿（把 `jti` 或用户 token 版本存 Redis）。Payload 只是 Base64URL，**任何人都能解码，绝不能放密码、手机号等敏感信息**。
2. session 特点：服务端存会话（内存/Redis），客户端只拿一个不可猜的 `sid`；可以随时删除实现立即下线、能存任意大小数据；代价是需要共享存储，多一层依赖与序列化开销。
3. Cookie 安全属性：`HttpOnly`（JS 读不到，防 XSS 窃取）、`Secure`（只走 HTTPS）、`SameSite=Lax/Strict/None`（防 CSRF，`None` 必须配 `Secure`）、`Path`/`Domain`/`Max-Age`。把 token 放 `localStorage` 会被 XSS 直接读走，放 HttpOnly Cookie 则要处理 CSRF。
4. 刷新 token 设计：access token 有效期短（如 15 分钟）放内存/Cookie，refresh token 长（7-30 天）存 HttpOnly Cookie 且**服务端记录**；刷新接口校验后签发新的 access token，并**轮换 refresh token**；一旦发现旧 refresh token 被重复使用（复用检测），判定为泄露，直接吊销该用户全部会话。
5. 选型建议：多端登录、微服务、需要给第三方发凭证时用 JWT；后台管理系统、需要精确控制在线状态与强制下线时用 session。

| 对比项 | JWT | Session |
| --- | --- | --- |
| 存储位置 | 客户端持有 token | 服务端存储，客户端只存 sid |
| 主动失效 | 难（需黑名单/版本号） | 容易（删除即可） |
| 横向扩展 | 天然支持 | 依赖 Redis 等共享存储 |
| 泄露风险 | 一旦泄露在有效期内可用 | 可立即吊销 |

**追问与易错点**：

- 追问：JWT 能存用户权限吗？答：能存角色这类低敏感信息换性能，但权限变更不能即时生效；要求实时性时改为每次查缓存。
- 陷阱：把 access token 放 `localStorage` 还宣称"安全"。XSS 面前无法防御，这就是 HttpOnly Cookie 存在的意义。
- 陷阱：refresh token 永久有效且不轮换。等于给攻击者一张长期通行证，必须设过期、轮换并做复用检测。

### Q28 RESTful 和 GraphQL 各自的取舍是什么？

**考察点**：进阶题。考是否理解两者解决的问题不同，能说出 GraphQL 的新成本而不是只夸它。

**参考答案**：

> **一句话结论**：REST 以**资源 + HTTP 语义**为中心，缓存与调试友好；GraphQL 以**单一端点 + 客户端声明字段**为中心，解决过度获取与多次往返，但把复杂度转移到了缓存、权限与查询成本控制上。

1. REST 的优势：语义清晰、天然契合 HTTP 缓存（`ETag`、`Cache-Control`、CDN）、状态码与错误语义标准化、按 URL 限流与监控简单。劣势：接口粒度固定导致**过度获取（over-fetching）**或**获取不足（under-fetching）**，聚合页面要发多次请求。
2. GraphQL 的优势：一个端点、按需取字段、强类型 schema 自带文档与代码生成、前端迭代不需要后端改接口、天然适合 BFF 聚合多数据源。
3. GraphQL 的成本：多数走 `POST` 单一路径，**HTTP 缓存基本失效**（要靠持久化查询或客户端缓存）；嵌套查询产生 **N+1** 问题（用 DataLoader 批量解决）；深层嵌套查询可能拖垮服务，必须做**深度/复杂度限制与超时**；鉴权要落到字段级，比 REST 更细碎。
4. 取舍场景：对外公开、以读为主、有 CDN 需求的接口用 REST；前端多变、数据关系复杂、需要一次拿全内部数据时用 GraphQL；也可以混合——对外 REST，内部 BFF 用 GraphQL 聚合。
5. 常见误区：把 GraphQL 当"性能优化"。它优化的是请求次数与字段裁剪，并不自动解决后端查询效率问题。

**追问与易错点**：

- 追问：GraphQL 怎么做鉴权？答：在解析器（resolver）层按字段与上下文校验，或用指令 + 中间件统一拦截，不能只在入口校验一次。
- 陷阱：认为 GraphQL 只有 `POST`，其实查询也可以用 `GET`，但实践中为了省事都走 POST，因此丢了缓存。
- 陷阱：REST 里用 `POST /getUsers` 也自称 RESTful。动词进路径、方法不表意就已经不是 REST 风格。

### Q29 SSE 和 WebSocket 怎么选？Node 端分别怎么实现？

**考察点**：进阶题。考两种实时方案的方向性差异与适用场景，以及对连接保活、断线重连的工程认知。

**参考答案**：

> **一句话结论**：**SSE 是 HTTP 上的单向服务端推送**（简单、自动重连、适合通知/进度/大模型流式输出，Node 里直接写 `res.write` 即可）；**WebSocket 是全双工长连接**（适合聊天、协作、游戏，需要自己处理心跳、鉴权与重连）。

1. SSE 实现：路由里设置 `Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`，然后按 `data: xxx\n\n` 的格式 `res.write`；支持 `event:`、`id:`、`retry:` 字段。浏览器端用 `EventSource`，**自带断线重连与 `Last-Event-ID` 续传**。
2. SSE 的注意点：只能服务端到客户端（客户端要发数据得另开一个 POST 接口）；HTTP/1.1 下每个连接占一个 TCP，浏览器对同域并发连接有上限（HTTP/2 下没有这个问题）；必须加心跳（定时发注释行 `: ping\n\n`）防代理超时断开；Nginx 需要关掉 `proxy_buffering` 并放宽 `proxy_read_timeout`。
3. WebSocket 实现：原生 `ws` 库最轻量（`new WebSocketServer({ server })`），`socket.io` 提供房间、广播、自动重连、心跳与降级长轮询等开箱能力，代价是客户端体积与非标准协议（跨语言对接要注意）。
4. 必须自己做的三件事：**握手时鉴权**（在 `upgrade` 阶段校验 token，因为浏览器 WebSocket 带不上自定义头，常用 query 或首个消息传）、**心跳与死连接清理**（`ping/pong` 或应用层心跳，超时踢掉）、**重连与消息补偿**（客户端指数退避重连，服务端记录游标补发）。
5. 选型速记：只需要服务端推 → SSE；需要双向高频交互 → WebSocket；已有 socket.io 生态且不介意体积 → socket.io；对性能和跨语言有要求 → 原生 `ws`。

**追问与易错点**：

- 追问：SSE 和长轮询（long polling）区别？答：SSE 是一条连接持续推多条消息，长轮询是每次拿到数据就断、再重发请求，SSE 延迟与开销都更低。
- 陷阱：用 `setInterval` 无限往 SSE 连接写数据却不清理 `close` 事件，客户端断开后定时器继续跑，内存与句柄双泄漏。
- 陷阱：只在建立连接时鉴权，之后不管 token 过期。长连接必须在过期时主动断开或要求重新协商。

### Q30 Node 服务怎么做日志？traceId 怎么串起来？

**考察点**：进阶题。考日志库选型与可观测性的最小工程化，重点是结构化日志与请求追踪。

**参考答案**：

> **一句话结论**：用 **`pino`（JSON、低开销、异步）或 `winston`（transport 灵活、生态老）输出结构化日志**，用 **`AsyncLocalStorage` 传递 `traceId`** 把一次请求的所有日志串起来。

1. 选型对比：`pino` 默认写 JSON、序列化开销小、生产性能好，配合 `pino-pretty` 在开发环境美化；`winston` 的 `transport`（多目标、文件切割、自定义格式）更丰富但开销更大。追求性能选 pino，追求灵活与老生态选 winston。
2. 结构化原则：日志是 JSON 而不是拼接字符串，`logger.info({ userId, orderId, cost }, 'create order')`；错误用 `logger.error({ err }, 'msg')` 传 Error 对象而非只传 message，才能拿到 stack。
3. 分级与分流：`debug/info/warn/error/fatal`，生产只开 info 以上；访问日志（access log）与错误日志分开；容量上避免每请求打十几条 debug。
4. traceId 串联：入口中间件生成或复用请求头里的 `X-Request-Id`，用 `AsyncLocalStorage` 保存上下文，日志基类自动附加 `traceId`，并透传给下游服务与返回给前端（方便用户报错时提供单号）。
5. 落地要点：日志切割（`pino-roll`、`logrotate`、按天分文件）与保留策略；**不要用 `console.log` 打生产日志**（无结构、无法分级）；脱敏处理密码、token、手机号、身份证；把日志采集到 ELK/Loki 后按 traceId 聚合检索。

```js
const { AsyncLocalStorage } = require('node:async_hooks');
const als = new AsyncLocalStorage();

app.use((req, res, next) => {
  const traceId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', traceId);
  als.run({ traceId }, next); // 后续异步调用链都能读到
});

logger.info({ ...als.getStore(), userId: 1 }, 'query user'); // 自动带 traceId
```

**追问与易错点**：

- 追问：`AsyncLocalStorage` 和全局变量有什么区别？答：它按异步调用链隔离上下文，并发请求之间不会串号，全局变量在并发下必然互相覆盖。
- 陷阱：在日志里直接打整个 `req.body`。密码、token 全进日志系统，等于把敏感数据永久留存。
- 陷阱：认为日志越多越好。高并发下同步写日志本身就会拖慢服务，必须异步 + 采样。

### Q31 配置怎么管？Node 服务和 Nginx 怎么分工？

**考察点**：基础偏进阶。考环境变量实践与部署协作，答出"Node 只监听内网、Nginx 在前"就到位了。

**参考答案**：

> **一句话结论**：配置走**环境变量 + `dotenv` 本地加载**，`.env` 不入库、只提交 `.env.example`；生产部署是 **Nginx 在前做 TLS、静态资源、负载均衡与超时控制，Node 在后只监听内网端口**。

1. 配置分层：默认值写在代码里，环境差异用环境变量覆盖；用 `dotenv` 在入口最早处 `require('dotenv').config()` 加载 `.env`（`NODE_ENV` 决定加载 `.env.production` 等文件）。**`.env` 必须进 `.gitignore`**，密钥用 K8s Secret / 配置中心 / CI 变量注入。
2. 校验与类型：`process.env` 的值**全是字符串**（`PORT` 要 `Number()`），启动时用 `zod`/`envalid` 校验必填项并给出清晰报错，做到"配置错误启动即失败"，而不是运行到半夜才报 undefined。
3. Nginx 承担：TLS 终止（证书与 HTTPS）、gzip/brotli 压缩、静态资源与前端构建产物托管、反向代理与 `upstream` 负载均衡、限流（`limit_req`）、请求体大小限制（`client_max_body_size`）、超时控制（`proxy_read_timeout`）。
4. 让后端拿到真实信息：`proxy_set_header Host $host;`、`X-Real-IP`、`X-Forwarded-For`、`X-Forwarded-Proto`，并在 Node 侧 `app.set('trust proxy', true)` 才能取到真实 IP 与协议。
5. 长连接与流式：SSE / WebSocket 要 `proxy_http_version 1.1`、`Upgrade`/`Connection` 头透传、`proxy_buffering off`（SSE 必须关，否则消息被缓冲住）、放宽 `proxy_read_timeout`。安全上 Node 监听 `127.0.0.1` 或内网网段，不直接暴露公网。

```nginx
location /api/ {
  proxy_pass http://node_upstream;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_buffering off;         # SSE 必须
  proxy_read_timeout 3600s;    # 长连接
}
```

**追问与易错点**：

- 追问：为什么 SSE 要关 `proxy_buffering`？答：Nginx 默认会缓冲响应体直到攒够一块才下发，事件流会"卡住不动"，必须关闭或改为需要的缓冲策略。
- 陷阱：把 `.env` 提交进 Git。历史记录里永久留存密钥，只能轮换所有凭证。
- 陷阱：Node 直接监听 80 端口对外。证书管理、压缩、静态资源全部要自己实现，还少了一层缓冲保护。

### Q32 Node 服务常见的安全问题有哪些？怎么防？

**考察点**：深挖题。考"Node 特色"的安全面：注入、路径穿越、DoS、依赖风险与原型污染。

**参考答案**：

> **一句话结论**：Node 侧高频风险是**命令注入、路径穿越、NoSQL 注入、DoS（请求体/正则/查询复杂度）与依赖供应链**，防法是参数化、路径校验、限额限流、锁版本与审计。

1. 命令注入：`exec('ls ' + userInput)` 会把 `;`、`&&`、反引号交给 shell 执行。改用 `spawn`/`execFile` 并把参数作为数组传入，避免任何字符串拼接进 shell。
2. 路径穿越：直接用用户输入拼路径可以读出 `../../etc/passwd`。做法是 `path.resolve(root, input)` 后校验结果仍以 `root` 开头（注意 `path.normalize` 与大小写、符号链接），或只允许白名单文件名/ID 映射。
3. 注入类：SQL 必须用参数化查询或 ORM 的绑定参数，不拼字符串；MongoDB 要防对象注入（`{ username: { $ne: null } }`），做法是校验类型为字符串、拒绝非预期结构，并关闭不必要的 `$where`。
4. DoS 与资源耗尽：限制 `express.json({ limit: '1mb' })`、上传 `limits.fileSize`、Nginx `client_max_body_size`；接口限流（`express-rate-limit` + Redis）；警惕**正则回溯（ReDoS）**（避免 `(a+)+` 这类嵌套量词，用 `safe-regex` 审查）与 GraphQL 深层查询；启 `--max-old-space-size` 与内存上限防单点拖垮整机。
5. 依赖与供应链：`npm audit` / `pnpm audit` 进 CI、提交并锁定 `lockfile`、使用 `npm ci` 保证可复现安装、及时升级高危包、限制安装脚本（`--ignore-scripts` 或白名单）、私有源或镜像审计；定期清理不再使用的依赖以缩小攻击面。
6. 其他必查项：原型污染（`Object.create(null)` 或避免用 `merge` 处理用户输入、校验 `__proto__`/`constructor`）、SSRF（对用户提供的 URL 做协议与内网 IP 黑名单）、错误信息不回传堆栈与 SQL、Helmet 设置安全响应头、Cookie 的 `HttpOnly`/`Secure`/`SameSite`。

**追问与易错点**：

- 追问：`path.join` 能防穿越吗？答：不能。`path.join(root, '../../x')` 会规整出上层路径，必须用 `resolve` 后做前缀校验。
- 陷阱：认为"用了框架就不会被注入"。框架只处理路由，SQL 拼接与命令执行是你自己写的。
- 陷阱：觉得审计告警都是误报就不管。真正被利用的往往是那个"用不到但没删"的传递依赖。

## 本章小结

- Node 的强项是 IO 密集与高并发长连接，CPU 密集要靠 Worker Threads / 子进程或换语言，前端团队主要用它做 BFF、SSR 与实时通信。
- "单线程"指执行 JS 的主线程唯一，IO 由 libuv 线程池与操作系统异步能力承担，所以阻塞事件循环的永远是同步 API 与长时间计算。
- 事件循环按 timers → pending callbacks → idle/prepare → poll → check → close callbacks 六阶段循环，优先级是 nextTick > Promise 微任务 > setImmediate / setTimeout，且在 IO 回调里 setImmediate 恒先于 setTimeout。
- require 走"路径解析 → 查缓存 → 包装成函数执行 → 返回 module.exports"，缓存 key 是绝对路径；exports 只是 module.exports 的初始引用，整体导出只认 module.exports。
- Stream 的核心是背压：write 返回 false 就暂停上游、drain 再恢复；大文件与上传一律流式处理，绝不整文件进内存。
- 错误处理要认清边界：try/catch 抓不到异步回调里的异常，兜底之后应当记录并优雅退出，而不是继续服务。
- 生产部署靠 cluster / PM2 多进程加优雅退出（SIGTERM → 停止新连接 → 排空 → 退出），配合 Nginx 做 TLS、静态资源、限流与超时，Node 只监听内网。
- 安全与日志是上线底线：参数化与路径校验防注入穿越，限额限流防 DoS，锁版本与审计防供应链，结构化日志加 traceId 让故障可追。

<!-- COUNT: 32 -->
