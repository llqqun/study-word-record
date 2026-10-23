---
title: "第 2 章 作用域、闭包、this 与原型链"
---

## 第 2 章 作用域、闭包、this 与原型链

### Q1 说说你对作用域的理解，JS 里有哪几种作用域？

**考察点**：能不能一句话说清作用域的本质，并准确列出三种作用域及其边界，而不是背名词。

**参考答案**：

> **一句话结论**：作用域（Scope）就是变量和函数的可访问范围，JS 里有全局作用域、函数作用域和块级作用域三种。

1. 全局作用域：脚本最外层，页面关闭才销毁。顶层用 `var` 声明的变量会成为全局对象 `window` 的属性。
2. 函数作用域：函数内部声明的变量只在该函数内可见；每调用一次函数，就创建一份全新的作用域，互不干扰。
3. 块级作用域：`{}`、`if`、`for` 这种代码块，只有 `let`/`const` 声明才受它约束，`var` 不受约束。
4. 作用域是**静态**的：函数在哪里定义，它的作用域就定死了，跟它在哪里被调用没有关系。这一点是理解闭包的前提。

**追问与易错点**：

- 追问：作用域是运行时创建的吗？答：不是，词法环境在编译（解析）阶段就确定；运行时创建的是执行上下文（Execution Context）。
- 陷阱：说「`var` 没有作用域」。正确说法是「`var` 没有块级作用域，它是函数作用域的」。
- 陷阱：把作用域和 `this` 混在一起。作用域看定义位置，`this` 看调用方式，两者是两套机制。

### Q2 什么是作用域链？引擎找一个变量的时候具体是怎么走的？

**考察点**：能否把「变量查找」讲成一条可复述的路径，而不是含糊地说「往外层找」。

**参考答案**：

> **一句话结论**：作用域链是当前作用域到全局作用域串起来的一串词法环境，查找变量时从最内层逐级向外，找到就停，全都没有就报 `ReferenceError`。

1. 函数在**定义**时，内部属性 `[[Environment]]` 会记住自己所在的那层词法环境，形成静态的链条。
2. 查找顺序：当前环境 → 外层环境 → … → 全局环境。在某一层命中同名标识符就立即停止，这就是内层「遮蔽」外层同名变量的原因。
3. 读不到时报 `ReferenceError`；但**赋值**读不到时，非严格模式会悄悄创建一个全局变量，这是最常见的意外全局污染。
4. 作用域链决定闭包能记住哪些变量；属性查找走的是另一套机制——原型链。二者不要混为一谈。

**追问与易错点**：

- 追问：作用域链和原型链有什么区别？答：作用域链找变量，函数定义时就确定；原型链找对象属性，运行时通过 `[[Prototype]]` 逐级向上。
- 陷阱：把 `obj.name` 的查找说成「沿作用域链找 `name`」。`obj` 是变量走作用域链，`.name` 是属性走原型链。
- 追问：闭包为什么能访问外层变量？答：因为它的 `[[Environment]]` 指向外层词法环境，链条没有断。

### Q3 什么是词法作用域？它和动态作用域有什么区别？

**考察点**：考察是否真正理解 JS 作用域是「按写代码的位置」决定，而不是「按调用位置」决定。

**参考答案**：

> **一句话结论**：词法作用域（Lexical Scope）指作用域由代码书写位置决定，JS 用的就是词法作用域；动态作用域（Dynamic Scope）则由调用位置决定，JS 不用它，只有 `this` 带有这种动态色彩。

1. 词法作用域也叫静态作用域：函数定义在哪一层，就能访问那一层及更外层的变量，与谁调用它无关。
2. 动态作用域：函数里访问变量要看「谁调用了我」。Bash、早期的 Lisp 是这种模型，JS 不是。
3. JS 里最接近动态作用域的只有 `this`——`this` 的值由调用点决定，所以很多人误以为 JS 是动态作用域。
4. 实操意义：变量遮蔽（shadowing）和闭包都是词法作用域的直接结果，读懂代码时只看嵌套结构就够了。

```js
var a = 1;
function bar() { console.log(a); }  // 只看定义位置：外层是全局，a 是 1
function foo() { var a = 2; bar(); } // 谁调用都不影响
foo(); // 1，不是 2
```

**追问与易错点**：

- 追问：那 `this` 算不算动态作用域？答：`this` 是动态的，但它不是作用域机制，只是函数的一个隐式参数。
- 陷阱：答成「JS 既是词法作用域又是动态作用域」，会把面试官引向追问而答不实。

### Q4 什么是变量提升？函数声明和变量声明的提升有什么不一样？

**考察点**：考察 hoisting 的准确机制，以及函数声明优先于变量声明这个常考细节。

**参考答案**：

> **一句话结论**：变量提升（Hoisting）指声明在代码执行前就被处理：`var` 只提升声明、值是 `undefined`；函数声明连函数体一起提升，所以能在声明之前调用。

1. 引擎在进入作用域时会先做一轮「收集」：把 `var` 声明的标识符登记好（值为 `undefined`），把函数声明整个提前。
2. 因此 `console.log(a)` 在 `var a = 1` 之前执行输出 `undefined`，不报错；但函数声明可以提前调用。
3. 同名冲突时，**函数声明优先级高于 `var`**：`var foo` 不会覆盖已提升的函数 `foo`；但如果后面有 `foo = 1` 这样的赋值，运行时还是会被改写。
4. 块级作用域里的函数声明在 ES6 严格模式（含模块、`class` 内部）下按块提升，只在块内可见；非严格模式行为是历史遗留的兼容写法，不要依赖。

```js
console.log(a);      // undefined
foo();               // 'ok'，函数声明连函数体一起提升
console.log(foo);    // [Function: foo]
var a = 1;
function foo() { console.log('ok'); }
```

**追问与易错点**：

- 追问：提升是「把代码挪到顶部」吗？答：不是真的挪代码，是执行前的声明收集，理解成「声明提前、赋值留在原地」。
- 陷阱：说 `let` 也提升。`let`/`const` 同样被登记，但访问被禁止，这就是暂时性死区。
- 陷阱：以为 `var a = function () {}` 也能提前调用。函数表达式只提升变量名，此时值是 `undefined`。

### Q5 什么是暂时性死区（TDZ）？它有什么用？

**考察点**：TDZ 是 `let`/`const` 最容易被漏掉的细节，也是面试官判断基础扎不扎实的常用题。

**参考答案**：

> **一句话结论**：暂时性死区（Temporal Dead Zone）指从进入作用域到 `let`/`const` 声明真正执行之间，访问该变量会直接抛 `ReferenceError`——变量已登记但被禁止访问。

1. 表现：在声明之前读、写、甚至 `typeof` 都会抛错，这一点和「未声明的变量」不同（未声明变量的 `typeof` 返回 `'undefined'`）。
2. 用途一：把「用错顺序」从静默的 `undefined` 变成显式报错，逼出代码里的时序问题。
3. 用途二：让 `const` 的「必须初始化」有意义；也保证了块级作用域和 `for` 循环每轮独立绑定的正确性。
4. 注意 `var` 没有 TDZ；函数声明也没有（整个函数体都提升了）。

```js
console.log(typeof a); // ReferenceError（对比：typeof 未声明变量是 'undefined'）
let a = 1;
```

**追问与易错点**：

- 追问：TDZ 是「提升」的反面吗？答：不是。二者都做声明登记，区别是 TDZ 期间禁止访问，而 `var` 期间返回 `undefined`。
- 陷阱：认为「TDZ 只在块内生效，函数参数不算」。函数默认参数也有 TDZ 行为，先用的参数不能引用后声明的参数。

### Q6 `var`、`let`、`const` 在作用域上到底差在哪？

**考察点**：最高频的对照题，要求能脱口而出成表格，而不是零散地说。

**参考答案**：

> **一句话结论**：`var` 是函数作用域、可重复声明、会提升为 `undefined` 且能挂到 `window`；`let`/`const` 是块级作用域、不可重复声明、有 TDZ；其中 `const` 还要求声明即初始化且绑定不可改。

| 维度 | `var` | `let` | `const` |
| --- | --- | --- | --- |
| 作用域 | 函数作用域 | 块级作用域 | 块级作用域 |
| 变量提升 | 提升，值为 `undefined` | 提升但进 TDZ | 提升但进 TDZ |
| 重复声明 | 允许 | 报错 | 报错 |
| 初始值 | 可省略 | 可省略 | 必须给 |
| 顶层是否挂 `window` | 是（script 中） | 否 | 否 |
| 能否重新赋值 | 能 | 能 | 不能 |

1. 关键差异只有两条根：**作用域粒度**和**声明约束**，其余细节都是这两条的衍生。
2. 工程建议：默认用 `const`，需要重新赋值时用 `let`，`var` 只出现在维护老代码时。

**追问与易错点**：

- 追问：`const` 到底锁住了什么？答：锁的是绑定（引用），不是值本身，见下一题。
- 陷阱：说「`let` 不提升」。准确说法是有提升但进 TDZ，不能访问。
- 陷阱：在 `for` 里混用 `var` 与 `let` 导致闭包取值不同（见循环那一题）。

### Q7 `const` 声明的对象，为什么还能改属性？怎么让它真的不能改？

**考察点**：考察是否分得清「绑定不可变」和「值不可变」，以及是否知道冻结的深浅。

**参考答案**：

> **一句话结论**：`const` 保证的是**绑定不可重新赋值**，不是值不可变；对象是引用类型，修改属性并没有改绑定，所以允许。

1. `const obj = {}` 之后 `obj = {}` 报 TypeError；但 `obj.a = 1`、`obj.a++`、`delete obj.a` 都合法。
2. 想要真正不可变要用 `Object.freeze(obj)`，但它只是**浅冻结**：嵌套对象的属性仍然可改。
3. 深冻结要递归处理嵌套对象，或直接用不可变数据方案（如 Immer 这类库）来保证。
4. 冻结还会影响数组：长度不可改，`push`、`sort` 这类会静默失败（严格模式下抛错）。

```js
const o = { a: 1, inner: { b: 2 } };
Object.freeze(o);
o.a = 9;          // 静默失败（严格模式抛 TypeError）
o.inner.b = 9;    // 仍然成功：浅冻结不保护嵌套对象
```

**追问与易错点**：

- 追问：那原始类型呢？答：原始类型本来不可变，`const x = 1; x = 2` 报错是因为绑定不能改。
- 陷阱：把 `const` 当成「常量值」的保证，说出「`const` 对象的属性改不了」会被立刻用一行代码问穿。

### Q8 顶层用 `var` 和用 `let` 声明，差别在哪？

**考察点**：考察全局环境的两套记录：对象环境记录与声明式环境记录。

**参考答案**：

> **一句话结论**：在传统脚本（script）中，顶层的 `var` 和函数声明会变成 `window` 的属性，而 `let`/`const`/`class` 只存在于全局的声明式环境记录里，不会成为 `window` 的属性。

1. `var a = 1` 之后 `window.a === 1` 成立，`delete window.a` 也不生效（属性不可配置）。
2. `let b = 1` 之后 `window.b` 是 `undefined`，但直接写 `b` 能访问，它只对脚本可见。
3. 在 ES 模块里，顶层 `var` 同样**不会**挂到 `window`，模块有自己独立的作用域。
4. `function f(){}` 在脚本顶层也会挂到 `window`；`class C {}` 不会。

**追问与易错点**：

- 追问：为什么会有这个设计？答：`let` 就是为了修掉「全局变量污染 `window`、可能覆盖同名全局属性」这个老问题。
- 陷阱：在全局用 `let a` 后又写 `window.a = 1`，两者互不干扰，排查线上问题时最容易被这个坑绕晕。

### Q9 什么是闭包？闭包是怎么形成的？

**考察点**：最经典的必答题，要求定义准确、条件清楚，且能说出「闭包不是函数本身」这个层次。

**参考答案**：

> **一句话结论**：闭包（Closure）是**函数加上它定义时所在的词法环境**，所以函数在外层函数已经执行完之后，仍然能访问外层的变量。

1. 准确说法：闭包 = 函数 + 对它定义位置的词法环境的引用。每个函数都带 `[[Environment]]`，所以严格说 JS 里处处是闭包，面试关注的是「跨越了函数生命周期还被访问」的那种。
2. 形成条件（缺一不可）：① 存在函数嵌套；② 内层函数引用了外层函数的变量；③ 内层函数逃逸到外层函数之外（被返回、被挂到事件/定时器上）。
3. 关键点：闭包保存的是**变量本身**，不是变量的快照。外层变量后来怎么变，闭包读到就是什么，这也是循环里打印同一个值的根源。
4. 作用：延长变量生命周期、实现数据私有与状态保持（计数器、缓存、防抖节流都靠它）。

```js
function makeCounter() {
  let count = 0;
  return () => ++count;   // 内层函数引用了 count，且被返回 → 闭包
}
const c = makeCounter();
c(); // 1
c(); // 2，count 没有被回收，状态被保留
```

**追问与易错点**：

- 追问：闭包是什么时候创建的？答：函数创建时就跟着词法环境一起形成，不是在调用时。
- 陷阱：说「闭包就是一个函数」。漏掉词法环境，就等于没答到点上。
- 陷阱：说「只有返回函数才有闭包」。传给 `setTimeout`、注册成事件回调，同样是闭包。

### Q10 闭包为什么能让变量不被回收？引擎真的把整个作用域都留下了吗？

**考察点**：区分「背结论」和「懂引擎实现」，这是拉开差距的深挖题。

**参考答案**：

> **一句话结论**：闭包函数的内部属性 `[[Environment]]` 一直引用着创建它的词法环境，环境记录对象因此从根可达、不被回收；但现代引擎只会保留真正被闭包引用到的变量，不会留下整个作用域。

1. 垃圾回收判断的是「可达性」：闭包函数本身可达（被变量、事件、定时器引用），它引用的环境记录就可达，里面被引用的变量就不会被回收。
2. V8 的优化：只有被内层函数引用的变量才会被分配到堆上的上下文对象（Context）里，其余变量随栈帧一起销毁。所以「闭包会保留整个父级作用域」是过时说法。
3. 代价也来自这里：如果一个闭包只用了小变量，却顺手引用了外层的大数组/大 DOM 对象，那个大对象才会被真正拖住。
4. 想让闭包尽快释放状态，就把引用置空（如定时器 `clearTimeout`、事件 `removeEventListener`），或改用 `WeakMap`。

**追问与易错点**：

- 追问：`eval` 会不会影响这个优化？答：会，含 `eval` 或 `with` 的作用域无法做静态分析，引擎只能保守地保留整个作用域。
- 陷阱：说「闭包必然造成内存泄漏」。闭包本身是正常特性，只有「不再需要却被长期持有」才算泄漏。

### Q11 怎么用闭包实现私有变量？为什么不直接用下划线约定？

**考察点**：考察闭包最基本的工程用法，以及「约定」和「真正不可访问」的区别。

**参考答案**：

> **一句话结论**：把变量放在外层函数里、只返回操作它的方法，外部就只能通过方法读写，无法直接触碰变量，这是真正的数据私有；下划线只是团队约定，拦不住任何人。

1. 闭包方案：变量在函数作用域内，外部拿不到引用，只能走暴露出去的方法，读写行为完全可控（可做校验、可只读）。
2. 下划线方案（`this._count`）：仍在实例上，外部 `obj._count = 999` 就能改，只是「大家约定不要动」。
3. 现代替代：`class` 的私有字段 `#count`，语言层面拦截，`obj.#count` 直接语法错误；也可以用 `WeakMap` 把私有数据挂在实例之外。
4. 取舍：闭包方案每个实例都持有一份函数，实例多时内存开销略大；`#` 字段更省、也更直观。

```js
function createCounter() {
  let count = 0;                       // 外部无法直接访问
  return {
    inc: () => ++count,
    get value() { return count; },     // 只读暴露
  };
}
const c = createCounter();
c.inc();
c.count = 100;   // 无效，只是新增了一个普通属性
```

**追问与易错点**：

- 追问：那 `WeakMap` 方案怎么写？答：模块级 `const priv = new WeakMap()`，构造时 `priv.set(this, {count: 0})`，方法里 `priv.get(this)`。
- 陷阱：说 Symbols 能实现私有。`Object.getOwnPropertySymbols` 一样能拿到，只算「不显眼」，不算私有。

### Q12 手写一个防抖（debounce），并说明为什么它必须用闭包。

**考察点**：高频手写题，重点看 `this` 与参数是否透传、定时器是否正确清理。

**参考答案**：

> **一句话结论**：防抖是「事件停止触发 delay 毫秒后才执行一次」，必须用闭包保存那个共享的 timer 句柄，否则每次调用都会新建定时器，等于没防抖。

1. 核心机制：每次触发先清掉上一个定时器，再起一个新的；只有最后一次能活到执行。
2. 必须透传 `this` 和参数：回调里用 `fn.apply(this, args)`，否则在对象方法或事件里会丢 `this`。
3. 立即执行版（`immediate`）：第一次立刻执行，之后在等待期内不再执行，适合按钮防重复提交。
4. 常见加分项：返回的函数上挂 `cancel`/`flush`，方便在组件卸载时清理，避免定时器泄漏。

```js
function debounce(fn, delay = 300, immediate = false) {
  let timer = null;                       // 闭包保存，跨调用共享
  return function (...args) {
    if (immediate) {                      // 首次立即执行，冷却期内忽略
      if (timer) return;
      fn.apply(this, args);
      timer = setTimeout(() => { timer = null; }, delay);
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}
```

**追问与易错点**：

- 追问：输入框搜索用防抖还是节流？答：输入联想用防抖（要等用户停下），滚动加载用节流（要持续响应）。
- 陷阱：用普通函数而不是保留 `this`，在 `obj.method = debounce(obj.method, 300)` 之后 `this` 丢失。

### Q13 手写节流（throttle），它和防抖的区别是什么？

**考察点**：考察是否能同时把手写题和对比题答清，并说清首尾两次执行的处理。

**参考答案**：

> **一句话结论**：节流是「在 interval 时间内最多执行一次」，保证频率上限；防抖是「等安静下来再执行」，保证只执行最后一次。

| 维度 | 防抖 debounce | 节流 throttle |
| --- | --- | --- |
| 触发时机 | 停止触发后 | 固定时间间隔内最多一次 |
| 执行次数 | 通常只 1 次 | 持续触发期间会多次 |
| 典型场景 | 搜索联想、窗口 resize 结束 | 滚动加载、拖拽、按钮连点、埋点上报 |

1. 时间戳版：记录 `last`，每次比较 `now - last >= interval` 才执行。首次立即执行，但停止触发后**最后一次不执行**。
2. 定时器版：用 `timer` 控制，首次不立即执行，但停止后**会补执行最后一次**。
3. 生产写法通常两者结合，用 `leading`/`trailing` 两个开关控制首尾是否执行。
4. 两者都靠闭包保存 `last` 或 `timer`，都属于「状态保持」类应用。

```js
function throttle(fn, interval = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}
```

**追问与易错点**：

- 追问：滚动事件里用防抖会怎样？答：用户持续滚动期间一直不执行，松手才执行一次，页面看起来像卡住了。
- 陷阱：只答「防抖是节流的特例」这类含糊说法，面试官会要求你各写一个。

### Q14 手写柯里化（curry），它和偏函数有什么区别？

**考察点**：考察闭包 + 递归 + 函数 `length` 属性，同时区分两个易混概念。

**参考答案**：

> **一句话结论**：柯里化是把接收多个参数的函数改造成「一次收一部分参数、可连续调用」的函数，靠闭包累积已收到的参数，收齐后执行原函数。

1. 判断收齐的依据是 `fn.length`（形参个数）。注意它不包含剩余参数和默认值参数，这是最常见的边界坑。
2. 累积参数靠闭包：每次返回的新函数都记住之前传进来的 `args`。
3. 与偏函数（partial）的区别：柯里化是「每次一个参数、链式调用」的严格形式；偏函数是「预先固定一部分参数」，不要求一个一个传，如 `Function.prototype.bind`。
4. 实际收益：参数复用、延迟执行（如 `bind` 出的 `add(1)` 反复用）、与组合函数（compose）配合做数据处理管道。

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...rest) => curried.apply(this, [...args, ...rest]);
  };
}
const add = curry((a, b, c) => a + b + c);
add(1)(2)(3);   // 6
add(1, 2)(3);   // 6
```

**追问与易错点**：

- 追问：有默认值的参数能用 `fn.length` 判断吗？答：不能，`(a, b = 1) => {}` 的 `length` 是 1，会提前执行，需要自己约定判断方式。
- 陷阱：把柯里化说成「就是 `bind`」。`bind` 是偏函数，可以一次固定多个参数。

### Q15 什么是模块模式（IIFE）？它解决了什么问题？

**考察点**：考察闭包在工程上的原始用途——在没有模块系统的年代如何隔离作用域并暴露接口。

**参考答案**：

> **一句话结论**：模块模式就是用立即执行函数表达式（IIFE）造一个私有作用域，把状态藏在闭包里，只返回需要暴露的接口，从而避免全局污染并实现封装。

1. 解决的问题一：变量污染全局。IIFE 内部声明的变量不挂到 `window`，多个文件的同名变量不会互相覆盖。
2. 解决的问题二：没有封装概念。只返回 `{ inc, get }`，外部拿不到 `count` 本身。
3. 实际写法需要加分号或前置一元运算符（`;(function(){})()`、`!function(){}()`），否则前一行没写分号会被当成函数调用。
4. 现代对照：ES 模块的 `export` 本身就是模块作用域，顶层变量天然不外泄；模块只会被求值一次，等价于单例。

```js
const counter = (function () {
  let count = 0;                       // 私有
  return {
    inc: () => ++count,
    get: () => count,
  };
})();
counter.inc();
counter.count;   // undefined
```

**追问与易错点**：

- 追问：ES 模块和 IIFE 模块有什么本质区别？答：模块是语言规范的作用域与静态分析（可 tree-shaking），IIFE 只是普通函数调用。
- 陷阱：认为 IIFE 能解决循环中 `var` 的问题——能，但必须把循环变量作为参数传进去，见 Q19。

### Q16 手写一个 `once`，让函数只执行一次，说说它的考察点。

**考察点**：考察闭包做状态标记、返回值缓存、`this` 透传这三个细节是否都想到。

**参考答案**：

> **一句话结论**：用闭包保存一个 `called` 标志和首次执行的返回值，之后所有调用都直接返回缓存结果，不再真正执行原函数。

1. 只判断状态还不够：要**缓存首次的返回值**，否则第二次调用返回 `undefined`，调用方可能踩空。
2. 要保 `this` 和参数：用 `fn.apply(this, args)`，这样它可以直接挂到对象上或做事件回调。
3. 典型用途：`once(document, 'DOMContentLoaded')` 类的事件只处理一次、支付/提交按钮防重复、单例初始化（懒加载 SDK）。
4. 更严谨的并发场景（异步只执行一次）要缓存 Promise 而不是值，让后续调用复用同一个 Promise。

```js
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
```

**追问与易错点**：

- 追问：如果原函数抛错了，算执行过吗？答：常见实现里标志已置位，不会再执行；若要可重试，需把置位放在成功之后。
- 陷阱：用 `fn = null` 的方式判断，会覆盖原函数引用，也无法保留返回值，属于典型扣分写法。

### Q17 闭包真的会造成内存泄漏吗？

**考察点**：这是被传播最广的误解之一，考察能否区分「变量被有意保留」和「泄漏」。

**参考答案**：

> **一句话结论**：闭包本身不是内存泄漏，它只是延长了变量的生命周期；只有「已经不再需要、却被闭包意外长期持有」时才构成泄漏。

1. 泄漏的定义是：对象已经不再需要，但仍然可达、无法被回收，内存持续增长。闭包保留变量是**有意的设计**，属于特性而非缺陷。
2. 真正的泄漏场景：挂在 `window` 上的事件监听一直不摘、`setInterval` 从不 `clearInterval`、模块级 Map 缓存只增不删、组件已卸载但回调还引用着大对象/DOM。
3. 排查方式：Chrome DevTools 的 Memory 面板拍三次堆快照对比，看 `Detached HTMLElement` 与实例数是否只增不减。
4. 正确做法：组件卸载时清理监听和定时器；长期缓存用 `WeakMap`/`WeakSet`；只把真正需要的字段带进闭包，别顺手引用整个大对象。

```js
// 有意保留，不是泄漏
const c = (() => { let n = 0; return () => ++n; })();

// 泄漏：定时器不清理，函数和它引用的 data 永远不会被回收
setInterval(() => render(bigData), 1000);
```

**追问与易错点**：

- 追问：那 IE 时代的泄漏是怎么回事？答：那是旧 JScript 的循环引用问题（DOM 对象与 JS 对象互相引用，引用计数算法回收不了），不是闭包的锅。
- 陷阱：面试里说「闭包会导致内存泄漏」，会被追问「那你项目里怎么用闭包」，容易答崩。

### Q18 `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` 为什么打印三个 3？

**考察点**：把作用域、闭包、事件循环三块知识串起来，是最高频的「陷阱题」。

**参考答案**：

> **一句话结论**：`var` 是函数作用域，整个循环只有一个 `i`；三个回调都是闭包，捕获的是同一个变量，等它们执行时循环已经结束，`i` 已经是 3。

1. `var i` 提升到外层函数（或全局）作用域，循环体里没有任何新作用域，三次迭代共享同一个绑定。
2. `setTimeout` 是宏任务，回调要等同步代码全部执行完才排队执行；此时 `i` 已经循环到 3，所以三次都打印 3。
3. 关键在于「闭包捕获的是变量本身，不是值的快照」。如果捕获的是值，就不会出现这个问题。
4. 如果打印语句写在循环体内（不加 `setTimeout`），则是同步执行，会依次打印 0、1、2。

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);   // 3 3 3
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0);   // 0 1 2
}
```

**追问与易错点**：

- 追问：如果 `delay` 不是 0 呢？答：结论一样，仍会全部打印 3，延迟只影响何时打印。
- 陷阱：答成「因为 `setTimeout` 是异步的」就结束。异步只是让执行延后，根因是共享同一个变量。

### Q19 循环里 `var` 输出同一个值，你有哪些修法？

**考察点**：要求给出三种以上可运行的修法，并能说出各自的代价。

**参考答案**：

> **一句话结论**：三种主流修法——改用 `let` 拿每次迭代的独立绑定、用 IIFE 把当次的值作为参数捕获、把值通过 `setTimeout` 的第三个参数（或 `bind`）固化到调用参数上。

1. **改用 `let`**：规范规定 `for` 的 `let` 每轮迭代都会创建一个新的绑定，并把上一轮的值拷贝过去，闭包各自捕获，最简洁。
2. **IIFE 捕获**：把当次 `i` 作为实参传进立即执行函数，函数作用域里有了独立的形参 `j`，闭包捕获 `j`。
3. **传参/`bind`**：`setTimeout(fn, 0, i)` 把值作为参数传入，或用 `fn.bind(null, i)`，本质都是把值提前固化。
4. 选型：新代码一律用 `let`；老代码里需要兼容 ES5 或要处理异步串行时才用 IIFE。

```js
// 1. let：每轮迭代独立绑定
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);
// 2. IIFE：把当次的值作为参数捕获
for (var i = 0; i < 3; i++) {
  (function (j) { setTimeout(() => console.log(j), 0); })(i);
}
// 3. 传参：值固化进调用参数
for (var k = 0; k < 3; k++) setTimeout(console.log, 0, k);
```

**追问与易错点**：

- 追问：为什么 `let` 就能解决？答：不是「`let` 有块级作用域」一句带过，而是每轮迭代生成新绑定并拷贝上一轮的值。
- 陷阱：把 `var i` 改成 `let i` 就以为万事大吉，但循环里如果还用了 `await` 和外部共享变量，仍可能有别的时序问题。

### Q20 箭头函数和普通函数到底有哪些区别？

**考察点**：把 `this`、构造能力、`arguments`、原型这几条一起答清，是收束本章 `this` 部分的题。

**参考答案**：

> **一句话结论**：箭头函数没有自己的 `this`、`arguments`、`super` 和 `prototype`，不能当构造函数，`this` 在定义时就按外层词法作用域固定下来。

| 维度 | 普通函数 | 箭头函数 |
| --- | --- | --- |
| `this` | 调用时决定 | 定义时的外层 `this`，不可改 |
| `arguments` | 有 | 无（用剩余参数 `...args`） |
| `new` | 可以 | 报 TypeError |
| `prototype` | 有 | 没有 |
| `call/apply/bind` 改 `this` | 有效 | 无效（但能传参） |
| 能否用作生成器 | 可以 | 不可以 |

1. 适用场景：需要固定 `this` 的回调（`setTimeout`、数组方法、事件里想用外层 `this`）。
2. 不适用场景：对象方法、需要 `arguments`、需要动态 `this`、需要当构造函数的场合。
3. 不适用场景：`Vue2` 的 `methods` 里写箭头函数会导致 `this` 拿不到组件实例（`Vue3` 组合式 API 里反而推荐）。

**追问与易错点**：

- 追问：箭头函数能获取外层 `arguments` 吗？答：能，它沿作用域链找到最近的非箭头函数的 `arguments`，这也是它被用作包装函数的常见原因。
- 陷阱：在对象字面量里写方法用箭头函数，`this` 会指向外层而不是这个对象，是实际开发中最常见的错误。

### Q21 `this` 到底指向谁？一共几种绑定规则？

**考察点**：必答题，要求五种情况一次说全，并能现场判断一段代码。

**参考答案**：

> **一句话结论**：`this` 在函数被调用时确定，看「谁调用的」；一共有五种情况：默认绑定、隐式绑定、显式绑定、`new` 绑定、箭头函数（词法继承）。

1. **默认绑定**：独立调用 `fn()`。非严格模式下 `this` 是 `window`（Node 里是 `globalThis`），严格模式下是 `undefined`。
2. **隐式绑定**：`obj.fn()`，`this` 是调用它的那个对象 `obj`。只认最后一层，`a.b.fn()` 的 `this` 是 `b`。
3. **显式绑定**：`fn.call(obj)`、`fn.apply(obj)`、`fn.bind(obj)`，`this` 被强制指定为 `obj`。
4. **`new` 绑定**：`new Fn()`，`this` 是新创建的那个实例对象。
5. **箭头函数**：没有自己的 `this`，取定义时外层作用域的 `this`，且 `call`/`apply`/`bind` 都改不了。

**追问与易错点**：

- 追问：严格模式影响哪一种？答：只影响默认绑定（变 `undefined`），其余四种不受影响。
- 陷阱：用「函数在哪里定义」判断 `this`。`this` 只看调用点，这是和变量作用域最大的区别。
- 陷阱：忘了 ES 模块和 `class` 内部默认就是严格模式。

### Q22 这几种绑定规则的优先级是怎样的？

**考察点**：考察是否能用一条优先级链处理任意混合写法，而不是死记单个规则。

**参考答案**：

> **一句话结论**：优先级从高到低是 `new` 绑定 > 显式绑定（`bind`）> 隐式绑定 > 默认绑定；箭头函数不参与排序，直接取外层的 `this`。

1. `new` 与 `bind` 同时出现时，`new` 胜出：`bind` 预设的 `this` 被忽略，但预设的参数仍然生效。
2. `bind` 强于隐式绑定：`const f = obj.fn.bind(other)`，之后 `f()` 的 `this` 是 `other`，再写 `obj.f()` 也是 `other`。
3. `bind` 之后 `call`/`apply` 无法再改动 `this`，只能传参数，这是一道常见验证题。
4. 箭头函数优先级不适用：它没有自己的 `this`，外层是谁就是谁，任何绑定手段都无效。

```js
function Fn() { console.log(this.name); }
const bound = Fn.bind({ name: 'bound' });
bound();              // 'bound'
new bound();          // undefined，this 是新实例，bind 的 this 被忽略
bound.call({ name: 'call' }); // 'bound'，call 改不动
```

**追问与易错点**：

- 追问：`new` 一个箭头函数呢？答：直接抛 TypeError，箭头函数没有 `[[Construct]]`，谈不上优先级。
- 陷阱：只背「谁调用指向谁」，遇到 `bind` 与 `new` 的组合题就答错。

### Q23 箭头函数的 `this` 是怎么确定的？能用 `call` 改吗？

**考察点**：考察「词法 `this`」的准确表述，以及它与绑定规则的关系。

**参考答案**：

> **一句话结论**：箭头函数的 `this` 在**定义时**就取外层作用域的 `this`，之后永久固定，`call`/`apply`/`bind` 都改不了，因为它压根没有自己的 `this`。

1. 规范层面：箭头函数没有 `[[ThisMode]]` 为 lexical 之外的记录，函数体内出现 `this` 时直接沿作用域链找外层函数的 `this`。
2. 因此「固定 `this`」的经典写法是 `const self = this` 或 `.bind(this)`，改用箭头函数更简洁。
3. 陷阱点：如果外层也是箭头函数，就继续往外找，一直到最近的非箭头函数或全局；写嵌套箭头时容易算错到底指向谁。
4. 也正因为如此，箭头函数不能被 `new`、也没有 `prototype`，不能作为需要动态 `this` 的方法。

```js
const obj = {
  name: 'obj',
  greet() {
    setTimeout(() => console.log(this.name), 0); // 'obj'，继承 greet 的 this
    setTimeout(function () { console.log(this.name); }, 0); // undefined
  },
};
obj.greet();
```

**追问与易错点**：

- 追问：`obj.method = () => console.log(this)` 里的 `this` 是谁？答：定义位置的外层，通常是模块顶层或 `window`，不是 `obj`。
- 陷阱：说「箭头函数的 `this` 指向它所在的函数」不够准确，是「定义时外层作用域里的 `this` 值」。

### Q24 为什么箭头函数不能当构造函数？它和 `new` 的关系是什么？

**考察点**：考察对 `[[Construct]]`、`prototype` 这些内部机制的理解深度。

**参考答案**：

> **一句话结论**：因为箭头函数没有 `[[Construct]]` 内部方法，也没有 `prototype` 属性，`new` 一个箭头函数会直接抛 TypeError。

1. 只有普通函数、方法、`class` 带 `[[Construct]]`；箭头函数是「轻量函数」，规范里就没有给它这个方法。
2. `new Fn()` 的第二步需要读 `Fn.prototype` 来设置新对象的原型，而 `Fn.prototype` 是 `undefined`，机制上无法成立，所以引擎直接拒绝。
3. 同理箭头函数没有 `super` 和 `new.target` 的绑定，也不能用作生成器函数（`function*`）。
4. 面试延伸：这也解释了为什么用箭头函数做组件或工具函数时更省内存——每个箭头函数不额外带一个 `prototype` 对象。

**追问与易错点**：

- 追问：`class` 里的字段写成箭头函数，能不能 `new`？答：能，`new` 的是类本身，那个字段只是实例属性。
- 陷阱：答「因为箭头函数没有 `this`」。它有 `this`，只是没有自己的绑定，这两个说法差别很大。

### Q25 对象的方法里 `this` 为什么会丢？怎么解决？

**考察点**：实际开发中最高频的 bug 之一，考察是否理解「`this` 由调用点决定」。

**参考答案**：

> **一句话结论**：`this` 由调用方式决定，`obj.fn()` 时是 `obj`，一旦把方法取出来单独调用（`const f = obj.fn; f()`），调用点变成独立调用，`this` 退化为默认绑定（非严格模式 `window`）。

1. 赋值、作为参数传递、作为回调注册，都会让方法「脱离」原对象，从而丢失 `this`。
2. 修法一：`bind` 固定，`const f = obj.fn.bind(obj)`，最稳，适合注册事件。
3. 修法二：包一层箭头函数，`setTimeout(() => obj.fn(), 0)`，保留调用点。
4. 修法三：`class` 里用箭头函数字段（`fn = () => {}`），实例化时就绑到实例上，代价是每个实例各有一份函数。

```js
const obj = {
  name: 'obj',
  getName() { return this.name; },
};
const f = obj.getName;
f();                          // TypeError 或 undefined，this 丢了
obj.getName();                // 'obj'，正常
const g = obj.getName.bind(obj);
g();                          // 'obj'
```

**追问与易错点**：

- 追问：React 类组件里为什么要 `bind(this)`？答：事件回调被取出后调用，`this` 丢失，拿不到实例，所以构造器里 bind 或写成箭头函数字段。
- 陷阱：说「`this` 指向定义它的对象」。`this` 与定义位置无关，只与调用点有关。

### Q26 事件回调里的 `this` 指向谁？箭头函数有什么不同？

**考察点**：考察 DOM 事件模型与 `this` 的结合，常常追问事件委托。

**参考答案**：

> **一句话结论**：用普通函数注册的事件回调，`this` 指向绑定事件的元素（即 `currentTarget`）；用箭头函数则取外层作用域的 `this`，与元素无关。

1. 原因：`addEventListener` 内部以元素作为 `this` 调用回调（等价于 `handler.call(element, event)`），这是一次隐式绑定。
2. `this === e.currentTarget` 成立；注意不要把 `this` 当成 `e.target`——事件委托时 `target` 是真正触发的最内层元素，`currentTarget` 才是绑定的元素。
3. 箭头函数写法：`el.addEventListener('click', () => this.handle())`，`this` 来自外层，Vue/React 组件里常用来访问组件实例。
4. 移除监听的坑：`removeEventListener` 必须传**同一个函数引用**，所以用 `bind` 或箭头函数时要把引用存下来，否则移除不掉。

```js
const btn = document.querySelector('#btn');
btn.addEventListener('click', function (e) {
  console.log(this === e.currentTarget); // true
});
btn.addEventListener('click', (e) => {
  console.log(this);                     // 外层 this（模块里常是 undefined）
});
```

**追问与易错点**：

- 追问：事件委托里怎么定位到具体子项？答：用 `e.target.closest('.item')`，结合 `currentTarget` 判断范围。
- 陷阱：`el.onclick = fn` 与 `addEventListener` 的 `this` 一样都是元素，但前者会覆盖已有监听，且无法设置捕获与 `once`。

### Q27 `setTimeout` 里的 `this` 是什么？为什么和想象的不一样？

**考察点**：考察宿主环境调用回调的方式，是「`this` 丢失」的另一典型场景。

**参考答案**：

> **一句话结论**：浏览器里传给 `setTimeout` 的普通函数回调，`this` 默认是 `window`（Node 里是 `Timeout` 对象），因为宿主是「直接调用」回调，没有绑定任何调用者。

1. 这不是 `setTimeout` 做了什么特殊处理，而是标准的默认绑定：宿主调用时没提供调用者，非严格模式下 `this` 被包装成全局对象。
2. 所以 `setTimeout(obj.method, 100)` 里的 `this` 不是 `obj`，对象方法在定时器里必然丢 `this`——这是最经典的坑。
3. 三种修法：`setTimeout(obj.method.bind(obj), 100)`、`setTimeout(() => obj.method(), 100)`、把方法改成箭头函数字段。
4. 补充：`setTimeout` 的第三个及以后的参数会作为回调实参传入，`setTimeout(fn, 0, a, b)` 等价于调用 `fn(a, b)`，这是低成本的传参技巧。

**追问与易错点**：

- 追问：为什么定时器最少延迟是 4ms？答：嵌套超过 5 层的定时器会被规范强制最小 4ms，属于浏览器的节流策略。
- 陷阱：说「`setTimeout` 的 `this` 指向定时器对象」。那是 Node 的 `Timeout` 实例，浏览器里是全局对象。

### Q28 `call`、`apply`、`bind` 有什么区别？

**考察点**：基础必答，要求说清「是否立即执行」和「参数形式」两条差异，并能提到 `bind` 的偏函数能力。

**参考答案**：

> **一句话结论**：三者都用来指定 `this`；`call`/`apply` 立即执行（参数分别是列表和数组），`bind` 不执行、返回一个永久绑定了 `this` 的新函数。

| 方法 | 是否立即执行 | 参数形式 | 返回值 |
| --- | --- | --- | --- |
| `call` | 是 | `fn.call(thisArg, a, b)` | 原函数返回值 |
| `apply` | 是 | `fn.apply(thisArg, [a, b])` | 原函数返回值 |
| `bind` | 否 | `fn.bind(thisArg, a, b)` | 绑好 `this` 的新函数 |

1. 记忆点：`apply` 的 `a` 对应 array（数组），`call` 对应逗号分隔列表。
2. `bind` 的额外能力是偏函数：`add.bind(null, 1)(2)` 先把 `1` 固定住，后续调用只传剩下的参数。
3. 选择场景：`Math.max.apply(null, arr)` 现在可以用 `Math.max(...arr)` 替代；需要把函数和上下文一起传递时用 `bind`。
4. 注意：`bind` 的 `this` 无法被后续 `call`/`apply` 覆盖，但 `new` 调用时 `bind` 的 `this` 会被忽略。

**追问与易错点**：

- 追问：`bind` 是深绑定吗？答：不是，它只固定第一层函数的 `this`；返回的新函数再被当作方法调用也不会改。
- 陷阱：说「`bind` 也立即执行」。它只返回新函数，这是最常被追问的一点。

### Q29 手写 `call` 和 `apply`，说说关键细节。

**考察点**：手写题，考察临时属性挂载、`Symbol` 防冲突、`null` 与原始值处理。

**参考答案**：

> **一句话结论**：核心思路是「把函数临时挂到目标对象上，用对象方法调用的方式借它的 `this`，执行完立刻删除」。

1. 临时键必须用 `Symbol`，否则可能覆盖对象上的同名属性（比如对象本来就有 `fn` 字段）。
2. `ctx` 为 `null`/`undefined` 时要替换成 `globalThis`（严格模式下是原值，但手写版通常做非严格语义）；传原始值时要用 `Object()` 包装，否则挂属性会静默失败。
3. 执行后必须 `delete`，并且用 `try/finally` 兜底，避免函数抛错留下脏属性。
4. 这是「隐式绑定」的实际应用：`ctx[key]()` 时 `this` 就是 `ctx`。

```js
Function.prototype.myCall = function (ctx, ...args) {
  ctx = ctx == null ? globalThis : Object(ctx);   // 处理 null 与原始值
  const key = Symbol('fn');                       // Symbol 避免键名冲突
  ctx[key] = this;
  try {
    return ctx[key](...args);
  } finally {
    delete ctx[key];                              // 无论成功失败都清理
  }
};

Function.prototype.myApply = function (ctx, args = []) {
  return this.myCall(ctx, ...args);               // apply 只是参数形式不同
};
```

**追问与易错点**：

- 追问：为什么不能定义成箭头函数？答：箭头函数没有自己的 `this`，拿不到 `this`（即被调用的原函数）。
- 陷阱：用字符串 `'fn'` 当临时键；或者忘了 `delete`，会在对象上留下一个属性。

### Q30 手写 `bind`，为什么要考虑 `new` 的情况？

**考察点**：深挖题，考察 `new` 优先级高于 `bind` 这条规则的实现方式。

**参考答案**：

> **一句话结论**：`bind` 返回一个闭包，调用时用 `apply` 把预设的 `this` 和合并后的参数传给原函数；但被 `new` 调用时必须忽略预设的 `this`，让实例成为 `this`。

1. 参数合并：预设参数在前、调用时参数在后，这正是偏函数的实现。
2. 判断是否被 `new` 调用：用 `new.target` 最准确（`this instanceof bound` 在原型被改写后不可靠）。
3. 被 `new` 时还要让实例能沿着原函数的原型链查找，所以把 `bound.prototype` 指向 `Object.create(fn.prototype)`。
4. 返回值规则沿用构造函数那套：`new bound()` 时如果原函数返回对象就用那个对象，否则用新建的实例。

```js
Function.prototype.myBind = function (ctx, ...preset) {
  const fn = this;
  function bound(...args) {
    // new.target 有值说明是 new 调用，此时 this 就是新实例
    const self = new.target ? this : (ctx == null ? globalThis : Object(ctx));
    return fn.apply(self, [...preset, ...args]);
  }
  if (fn.prototype) bound.prototype = Object.create(fn.prototype);
  return bound;
};
```

**追问与易错点**：

- 追问：为什么 `bind` 之后再 `call` 改不了 `this`？答：`bound` 内部写死了 `ctx`，外层传入的 `thisArg` 被完全忽略。
- 陷阱：用 `this instanceof bound` 判断 `new`，一旦 `bound.prototype` 指向了 `fn.prototype`，判断就失真。

### Q31 `new` 一个对象的时候，引擎到底做了哪几件事？

**考察点**：原型链和构造函数的总入口，要求按四步准确复述。

**参考答案**：

> **一句话结论**：`new` 做四件事：创建新对象、把它的原型指向构造函数的 `prototype`、以它为 `this` 执行构造函数、按返回值规则决定最终返回谁。

1. 新建一个空的普通对象。
2. 把新对象的 `[[Prototype]]` 指向 `Fn.prototype`，这样实例才能访问原型上的方法。
3. 以新对象为 `this` 执行构造函数函数体，实例属性在这一步挂到对象上。
4. 如果构造函数返回的是对象（含数组、函数），就返回那个对象；否则返回第 1 步创建的新对象。

```js
function Person(name) { this.name = name; }
Person.prototype.say = function () { return this.name; };
const p = new Person('刘群');
Object.getPrototypeOf(p) === Person.prototype; // true
```

**追问与易错点**：

- 追问：`new` 出来的对象怎么找到构造函数的？答：沿原型链找到 `Person.prototype`，再读它的 `constructor`。
- 陷阱：说「`new` 就是把 `this` 指向函数本身」。指向的是新建的实例对象，不是函数。

### Q32 构造函数里 `return` 一个值，会发生什么？

**考察点**：考察 `new` 第四步的返回值规则，是容易漏的细节题。

**参考答案**：

> **一句话结论**：构造函数返回**原始值**（数字、字符串、布尔、`null`、`undefined`）时被忽略，仍然返回新实例；返回**对象或函数**时，该对象会替换掉新实例成为 `new` 的结果。

1. 原因：`[[Construct]]` 规定，只有返回值的类型是 Object 才采用它，否则一律返回内部创建的 `this`。
2. 常见影响：想通过 `return {}` 破坏单例或提前结束构造，结果 `instanceof` 判断失效，因为返回的已经不是这个类的实例。
3. 这条规则对 `class` 同样适用，但派生类（`extends`）构造函数更严格：只能返回对象或 `undefined`，返回原始值或 `null` 都会抛 TypeError；基类则与普通函数一致，返回原始值被忽略。
4. 与普通函数调用的区别：直接调用 `Person()` 时返回什么就是什么，没有这层「对象优先」的规则。

```js
function A() { this.x = 1; return 42; }        // 返回原始值 → 被忽略
new A();                                        // A { x: 1 }

function B() { this.x = 1; return { y: 2 }; }   // 返回对象 → 生效
new B();                                        // { y: 2 }，不是 B 的实例
```

**追问与易错点**：

- 追问：`return null` 呢？答：`null` 的 `typeof` 是 `'object'`，但它是原始值，规则里按「非对象」处理，返回新实例。
- 陷阱：以为 `return []` 也会被忽略——数组是对象，会生效。

### Q33 手写一个 `new`，并解释它和 `Object.create` 的关系。

**考察点**：手写题，同时考察对原型设置的两种写法的理解。

**参考答案**：

> **一句话结论**：用 `Object.create(Ctor.prototype)` 造出带正确原型的对象，`apply` 执行构造函数，再按返回值规则决定返回谁。

1. `Object.create(Ctor.prototype)` 等价于旧写法 `obj.__proto__ = Ctor.prototype`，但它是标准 API、性能可控、不触发 `setPrototypeOf` 的优化破坏。
2. 用 `apply` 而不是 `call`，因为参数是数组形式。
3. 返回值判断要覆盖函数：`typeof ret === 'function'` 时也属于对象分支。
4. 补一句 `Object.create` 的实质：创建一个空对象并指定它的 `[[Prototype]]`，第二个参数可定义属性描述符。

```js
function myNew(Ctor, ...args) {
  if (typeof Ctor !== 'function') throw new TypeError('Ctor is not a constructor');
  const obj = Object.create(Ctor.prototype);   // 1、2 步：创建对象并设置原型
  const ret = Ctor.apply(obj, args);           // 3 步：以 obj 为 this 执行
  const isObj = ret !== null && (typeof ret === 'object' || typeof ret === 'function');
  return isObj ? ret : obj;                    // 4 步：返回值规则
}
```

**追问与易错点**：

- 追问：`class` 能用这个 `myNew` 创建吗？答：不能，`class` 必须用 `new` 或 `Reflect.construct`，直接 `apply` 会抛 TypeError。
- 陷阱：忘了判断 `ret !== null`，`return null` 时会被错误地当成对象返回。

### Q34 `prototype`、`__proto__`、`constructor` 这三者的关系是什么？

**考察点**：原型部分的必答题，要求能画三角关系并说清每个属性挂在哪。

**参考答案**：

> **一句话结论**：函数有 `prototype` 属性（指向原型对象），对象有 `[[Prototype]]`（`__proto__` 是它的访问器）指向自己的原型；原型对象上的 `constructor` 又指回构造函数。

1. `Person.prototype` 是函数才有的属性，它是一个普通对象，会被实例共享。
2. `p.__proto__` 实际读的是 `Object.prototype` 上的访问器，最终得到 `[[Prototype]]`；规范推荐用 `Object.getPrototypeOf(p)`。
3. `Person.prototype.constructor === Person`，这是为了让实例能反查构造函数；但手动改写 `prototype` 会丢掉它，需要补回来。
4. 狐狸尾巴：`__proto__` 只是历史兼容的访问器，`Object.create(null)` 出来的对象没有它。

```js
function Person() {}
const p = new Person();
p.__proto__ === Person.prototype;              // true
Person.prototype.constructor === Person;       // true
Person.prototype.__proto__ === Object.prototype; // true
Object.getPrototypeOf(Person) === Function.prototype; // true，函数也是对象
```

**追问与易错点**：

- 追问：`p.constructor` 是从哪来的？答：`p` 自己没有，沿原型链在 `Person.prototype` 上找到。
- 陷阱：把 `__proto__` 当成标准属性写进代码。生产代码用 `Object.getPrototypeOf` / `Object.setPrototypeOf`。

### Q35 原型链是怎么查找属性的？终点在哪里？

**考察点**：考察查找过程和「终点是 `null`」，以及属性遮蔽。

**参考答案**：

> **一句话结论**：访问 `obj.x` 时先看自身属性，没有就沿 `[[Prototype]]` 逐级向上找，直到 `Object.prototype`，再往上 `[[Prototype]]` 是 `null`，此时返回 `undefined`。

1. 查找顺序：自身 → 原型 → 原型的原型 → … → `Object.prototype` → `null`。
2. 终点明确：`Object.prototype.__proto__ === null`，这是所有普通对象原型链的尽头。
3. 属性遮蔽（shadowing）：实例上写了同名属性，原型上的就访问不到，但原型上的值仍然存在。
4. 用途上，原型链实现了方法共享（方法只存一份）与继承；代价是查找是线性的，链太长会拖慢访问，也可能被原型污染攻击影响。

```js
const arr = [1, 2, 3];
// arr → Array.prototype → Object.prototype → null
arr.hasOwnProperty('length'); // true，自身属性
arr.push(4);                  // 来自 Array.prototype
arr.toString();               // 来自 Array.prototype（先于 Object.prototype 命中）
```

**追问与易错点**：

- 追问：怎么只判断自身属性？答：`Object.hasOwn(obj, 'x')`（ES2022），旧写法 `Object.prototype.hasOwnProperty.call(obj, 'x')`。
- 陷阱：说原型链终点是 `Object.prototype`，漏掉最后指向 `null` 这一步。

### Q36 `instanceof` 的原理是什么？它有哪些局限？

**考察点**：考察原理与失效场景，是「会用」和「用对」的分水岭。

**参考答案**：

> **一句话结论**：`a instanceof B` 就是沿 `a` 的原型链查找，看是否出现 `B.prototype`；它只看原型链、不做类型推断，所以在跨窗口、原始值、原型被改的场景下会失效。

1. 原理：取 `B.prototype`，从 `Object.getPrototypeOf(a)` 开始逐级向上比较，命中就 `true`，到 `null` 就 `false`。
2. 局限一：原始值永远为 `false`，`1 instanceof Number` 是 `false`，因为原始值没有原型链。
3. 局限二：跨 `realm`（iframe、Node 的 `vm`）失效，两边各有自己的 `Array.prototype`，判断不出来。
4. 局限三：原型可被改写，`Object.setPrototypeOf` 或改 `prototype` 之后结果不可信；`Object.create(null)` 的对象 `instanceof Object` 也是 `false`。
5. 补充：`Symbol.hasInstance` 可以自定义 `instanceof` 的行为，`Array.isArray` 这类内置方法比它更可靠。

**追问与易错点**：

- 追问：跨 iframe 怎么判断数组？答：用 `Array.isArray`，它按内部槽 `[[Class]]` 判断，不受 realm 影响。
- 陷阱：把 `instanceof` 当成「类型检测」。它检测的是原型链，不是类型。

### Q37 手写一个 `instanceof`。

**考察点**：手写题，考察边界处理（原始值、`null`）和原型链遍历。

**参考答案**：

> **一句话结论**：先排除非对象，再取构造函数的 `prototype`，从对象的原型开始循环比较，到 `null` 结束。

1. 边界一：`null` 和 `undefined` 直接返回 `false`，因为 `Object.getPrototypeOf(null)` 会抛错。
2. 边界二：原始值返回 `false`，只有对象和函数才有原型链。
3. 用 `Object.getPrototypeOf` 而不是 `__proto__`，避免依赖访问器。
4. 如果要和原生行为对齐，还要先判断 `Ctor[Symbol.hasInstance]`，原生 `instanceof` 会优先走这个钩子。

```js
function myInstanceof(obj, Ctor) {
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
  const target = Ctor.prototype;
  let cur = Object.getPrototypeOf(obj);
  while (cur !== null) {
    if (cur === target) return true;
    cur = Object.getPrototypeOf(cur);
  }
  return false;
}
myInstanceof([], Array);  // true
myInstanceof(1, Number);  // false，与原生一致
```

**追问与易错点**：

- 追问：`myInstanceof(Object.create(null), Object)` 返回什么？答：`false`，它的原型链是空的。
- 陷阱：循环写成 `while (cur)`，虽然 `null` 会退出，但漏掉「原始值先排除」这一步就会在 `Object.getPrototypeOf(1)` 上出错（会返回 `Number.prototype`，与原生语义不符）。

### Q38 `Object.create(null)` 有什么用？和 `{}` 有什么区别？

**考察点**：考察对「无原型对象」的实际价值的理解，常用于字典与缓存场景。

**参考答案**：

> **一句话结论**：`Object.create(null)` 创建一个没有原型的「纯对象」，没有任何继承来的方法，最适合当字典或缓存用，可以从根上避免原型污染和键名冲突。

1. 区别一：`{}` 的原型是 `Object.prototype`，所以 `obj.toString`、`obj.constructor` 都存在；无原型对象这些全是 `undefined`。
2. 区别二：安全性。普通对象上写 `obj['__proto__']` 会走访问器产生副作用；用无原型对象存外部输入的 key，不会被 `__proto__`、`constructor` 这类键污染原型。
3. 区别三：使用成本。它没有 `hasOwnProperty`，要写 `Object.prototype.hasOwnProperty.call(obj, k)` 或 `Object.hasOwn(obj, k)`。
4. 使用建议：纯粹当 Map 用且键是字符串时选它；需要键是任意类型、需要 `size`/顺序，就用 `Map`。

```js
const dict = Object.create(null);
dict.toString = 'value';       // 安全，不会踩到 Object.prototype
dict.__proto__;                // undefined，没有原型访问器

const plain = {};
plain['__proto__'] = { hacked: true }; // 走的是访问器，改写的是 plain 自己的原型，风险点
```

**追问与易错点**：

- 追问：它和 `Map` 怎么选？答：Map 键可以是对象且可迭代、有 `size`；无原型对象更轻，`JSON.parse` 后的对象可直接用。
- 陷阱：以为 `JSON.parse('{}')` 得到的是无原型对象——它的原型仍是 `Object.prototype`。

### Q39 原型链继承有什么问题？

**考察点**：继承演进的第一站，考察能否准确指出两个经典缺陷。

**参考答案**：

> **一句话结论**：原型链继承的两个致命问题：父类的引用类型属性会被所有子类实例共享；创建子类实例时无法向父类构造函数传参。

1. 共享问题：`Child.prototype = new Parent()` 时，父类构造函数只执行了一次，原型上的数组/对象属性被所有实例共用，一个实例 `push` 会影响其他实例。
2. 传参问题：实例属性本应在构造时按参数初始化，但原型上的属性在 `new Parent()` 那一刻就固定了，无法针对每个子类实例赋值。
3. 另一个小问题：直接赋值会丢掉 `Child.prototype.constructor` 的指向，需要手动补回。
4. 本质原因：原型是共享的，而实例属性应当是私有的——用原型承载数据就注定共享。

```js
function Parent() { this.list = [1, 2]; }
function Child() {}
Child.prototype = new Parent();          // 原型链继承
const a = new Child();
const b = new Child();
a.list.push(3);
b.list;   // [1, 2, 3]，被共享了
```

**追问与易错点**：

- 追问：如果父类的属性都是原始值呢？答：原始值在原型上被改写时会在实例上新建自己的属性，不像引用类型那样互相影响，所以问题主要出在引用类型。
- 陷阱：只答「不能传参」，漏掉引用共享，面试官会继续追问。

### Q40 说说继承的演进：组合继承、寄生组合继承分别解决了什么问题？

**考察点**：深挖题，考察能否把四种继承方式讲成一条因果链。

**参考答案**：

> **一句话结论**：构造函数继承解决引用共享与传参、但方法无法复用；组合继承两者都用、却调用了两次父类构造函数；寄生组合继承用 `Object.create` 替代 `new Parent()`，只调用一次且原型干净，是 ES5 的最佳实践。

| 方式 | 做法 | 解决的问题 | 遗留问题 |
| --- | --- | --- | --- |
| 原型链继承 | `Child.prototype = new Parent()` | 复用原型方法 | 引用共享、不能传参 |
| 构造函数继承 | 子类里 `Parent.call(this, ...)` | 属性私有、可传参 | 方法不能复用，拿不到父类原型方法 |
| 组合继承 | 上面两者都用 | 兼顾两者 | 父类构造函数执行两次，原型上多一份冗余属性 |
| 寄生组合继承 | `Object.create(Parent.prototype)` + `Parent.call(this)` | 只执行一次父类构造，原型干净 | 写法稍长，可以直接用 `class` |

1. 演进主线：先要方法共享 → 原型链继承，发现引用共享和不能传参 → 加构造函数继承补上实例属性 → 组合继承兼顾两者却调了两次父类 → 寄生组合继承用 `Object.create` 去掉那次多余的调用。
2. 三个判断标准：父类构造函数被执行了几次、子类原型上有没有多余的属性和方法、`constructor` 有没有指回子类自身。
3. 工程建议：现代项目直接用 `class extends`，它编译后的产物就是寄生组合继承；只有维护 ES5 老代码或需要手写继承时才纠结这几种写法。

```js
function Parent(name) { this.name = name; this.list = []; }
Parent.prototype.say = function () { return this.name; };

function Child(name, age) {
  Parent.call(this, name);                        // 1. 继承实例属性，可传参
  this.age = age;
}
Child.prototype = Object.create(Parent.prototype); // 2. 继承原型方法，不执行父类构造函数
Child.prototype.constructor = Child;               // 3. 修正 constructor 指向
```

**追问与易错点**：

- 追问：Babel 编译 `class extends` 产物长什么样？答：就是寄生组合继承加 `Object.setPrototypeOf(Child, Parent)` 与 `_inherits` 辅助函数。
- 陷阱：说组合继承是最终答案。它多执行了一次父类构造函数，是个已知的浪费。

### Q41 `class extends` 的本质是什么？

**考察点**：深挖题，考察是否知道 `class` 只是原型的语法糖，但比 ES5 继承多了一条构造器链。

**参考答案**：

> **一句话结论**：`class extends` 本质仍是原型继承，但多了一条关键的构造器链：子类构造函数的 `[[Prototype]]` 指向父类构造函数，所以静态属性和静态方法也能被继承。

1. 实例链：`Child.prototype.__proto__ === Parent.prototype`，来自 `extends` 自动建立的设置。
2. 构造器链：`Object.getPrototypeOf(Child) === Parent`，这是 ES5 寄生组合继承里容易漏掉的一条，也是静态成员继承的来源。
3. `class` 内部默认严格模式，且必须用 `new` 调用，不能像函数那样直接调用。
4. 子类构造函数里必须先 `super()` 才能使用 `this`，因为实例是由父类构造函数创建的，`super` 之前 `this` 还没绑定（TDZ 行为）。

```js
class Parent { static tag = 'P'; }
class Child extends Parent {}
Object.getPrototypeOf(Child) === Parent;        // true，构造器链
Child.tag;                                       // 'P'，静态成员可继承
Child.prototype.__proto__ === Parent.prototype;  // true，实例链
```

**追问与易错点**：

- 追问：`extends` 后面可以跟表达式吗？答：可以，`class A extends mixin(Base) {}`，返回值必须是构造函数或 `null`。
- 陷阱：说「`class` 是全新的继承机制，和原型链无关」。它完全建立在原型链之上。

### Q42 `class` 和函数构造函数有哪些区别？

**考察点**：对照题，考察提升、严格模式、可枚举性、`new.target` 这些细节。

**参考答案**：

> **一句话结论**：`class` 不能当普通函数调用、内部默认严格模式、声明有 TDZ 不提升、原型方法不可枚举，并且天然支持 `new.target`、静态成员与私有字段。

| 维度 | 函数构造函数 | `class` |
| --- | --- | --- |
| 调用方式 | `Fn()`、`new Fn()` 都行 | 只能 `new`，否则 TypeError |
| 提升 | 函数声明整体提升 | 有 TDZ，声明前不可用 |
| 严格模式 | 看外层 | 内部始终严格 |
| 原型方法可枚举性 | `enumerable: true` | `enumerable: false` |
| 重复声明 | 允许 | 报 SyntaxError |
| 私有字段 | 无 | `#field` |

1. 可枚举性差异的实操影响：`for...in` 或 `Object.keys` 不会遍历到 `class` 的方法，写通用工具函数时要记得这一点。
2. `class` 是「一等公民式的语法糖 + 更强的约束」，性能上并不比函数快，只是更不容易写错。
3. 混用注意：把 `class` 的方法取出来单独调用，`this` 一样会丢，和普通函数没有区别。

**追问与易错点**：

- 追问：`class` 声明会提升吗？答：会被登记但不初始化，声明前访问抛 `ReferenceError`，与 `let` 一致。
- 陷阱：说「`class` 就是函数，所以可以直接 `Person()` 调用」，会立刻被一行代码证伪。

### Q43 `super` 的本质是什么？

**考察点**：深挖题，考察 `super` 与 `this` 的区别，以及 `[[HomeObject]]` 这个内部槽。

**参考答案**：

> **一句话结论**：`super` 是静态解析的：`super()` 调用父类构造函数并把结果作为当前实例，`super.method()` 是在「方法定义时的原型」上找方法、但用当前的 `this` 执行。

1. `super` 的查找位置由 `[[HomeObject]]` 决定——即方法被定义在哪个对象/类的原型上，与调用点无关，所以把方法取出来单独调用也不影响 `super`。
2. `super.method()` 等价于 `Reflect.get(Object.getPrototypeOf(homeObject), 'method', this)`：**方法从父类取，`this` 仍是子类实例**，这是它和 `Parent.prototype.method.call(this)` 的等价之处。
3. `super()` 特殊：它执行父类构造函数，实例对象是在这一步行创建的，所以在 `super()` 之前访问 `this` 会抛错。
4. 注意 `super` 只能在类或对象方法（简写方法）内使用，箭头函数里可以「借用」外层的 `super` 绑定，但不能自己用。

```js
class Parent { say() { return `parent:${this.name}`; } }
class Child extends Parent {
  constructor() { super(); this.name = 'child'; }
  say() { return super.say(); }   // 方法来自 Parent.prototype，this 是 Child 实例
}
new Child().say(); // 'parent:child'
```

**追问与易错点**：

- 追问：`super` 和 `this` 谁先有？答：`super()` 先执行并创建实例，`this` 才能被访问；这也是子类构造器必须在用 `this` 前调用 `super()` 的原因。
- 陷阱：以为 `super` 像变量一样是在运行时沿作用域链找。它是编译期确定位置、绑定到 `[[HomeObject]]` 的。

### Q44 `Object.getPrototypeOf`、`setPrototypeOf` 和 `__proto__` 该怎么选？

**考察点**：考察标准 API 与历史遗留写法的取舍，以及性能意识。

**参考答案**：

> **一句话结论**：读原型用 `Object.getPrototypeOf`，设置原型优先用 `Object.create` 在创建时指定，`Object.setPrototypeOf` 有性能代价要少用，`__proto__` 只在调试或兼容老代码时出现。

1. `__proto__` 是定义在 `Object.prototype` 上的访问器，不是对象自身属性；`Object.create(null)` 的对象连它都没有，代码会直接报错。
2. `Object.setPrototypeOf` 会破坏引擎对对象形状（隐藏类）的优化，规范明确说它慢，禁止在热路径反复调用。
3. 需要「基于某个原型造对象」时用 `Object.create(proto)` 一步到位，等价于新建 + 设置，但引擎可以按最优路径处理。
4. `Reflect.getPrototypeOf` 与 `Object.getPrototypeOf` 行为相近，区别是对非对象参数：前者抛 TypeError，后者做类型转换。

```js
const proto = { hello() { return 'hi'; } };
const obj = Object.create(proto);   // 推荐：创建时指定原型
Object.getPrototypeOf(obj) === proto; // true
Object.setPrototypeOf(obj, null);      // 不推荐在热路径使用
```

**追问与易错点**：

- 追问：那 `Object.setPrototypeOf` 什么时候还能用？答：一次性初始化、极少数需要动态改变行为的库代码；能用 `class` / `Object.create` 就别用它。
- 陷阱：用 `obj.__proto__ = proto` 赋值。它在无原型对象上不生效（只是普通属性赋值），行为不一致。

### Q45 垃圾回收机制是怎么回事？标记清除和引用计数有什么区别？

**考察点**：考察 GC 的基本模型，重点在「循环引用」这一经典差异。

**参考答案**：

> **一句话结论**：现代 JS 引擎用标记清除（Mark-and-Sweep）：从根对象出发标记所有可达对象，剩下的不可达对象回收；引用计数则按引用数为 0 回收，遇到循环引用会永久泄漏，所以早被淘汰。

1. 根对象包括全局对象、当前调用栈上的局部变量、闭包引用等，只要能顺着引用链走到，就算可达。
2. 标记清除的优点：天然解决循环引用——两个对象互相引用但都不被根引用时，都不可达，一起回收。
3. 引用计数的缺点正是循环引用：`a.b = b; b.a = a` 且没有外部引用时，引用数都是 1，永远回收不掉，这是老 IE 泄漏的根源。
4. V8 的实现更细：分代回收（新生代用 Scavenge 复制算法、老生代用标记清除与标记整理），配合增量标记与并发回收减少停顿。

**追问与易错点**：

- 追问：怎么主动触发 GC？答：浏览器不给 API，DevTools 里可以点垃圾桶图标；Node 下用 `--expose-gc` 后在调试时调用。
- 陷阱：说「引用计数还在用」。它在 JS 引擎里已被标记清除替代，只有部分宿主对象或旧实现残留。

### Q46 日常开发里最常见的内存泄漏场景有哪些？

**考察点**：考察能否把 GC 知识落到真实排障上，是区分「背概念」和「有经验」的题。

**参考答案**：

> **一句话结论**：常见泄漏有五类：意外的全局变量、未清理的定时器与事件监听、闭包持有的无用大对象、脱离文档却仍被引用的 DOM 节点、只增不减的缓存。

1. 意外全局变量：忘记声明或用 `this` 在非严格模式下创建属性，数据永远挂在 `window` 上。
2. 未清理的定时器/监听：`setInterval` 不 `clearInterval`，`addEventListener` 不 `removeEventListener`，回调引用的整条作用域都无法回收（SPA 频繁切换路由时尤其明显）。
3. 游离 DOM：节点已从文档移除，但 JS 变量或闭包仍持有引用，DevTools 里表现为 `Detached HTMLElement`。
4. 缓存与集合：模块级 `Map`/数组当缓存只存不删、频繁增删的 `Map` 不如 `WeakMap` 合适、事件总线上注册的函数从不注销。
5. 排查思路：Memory 面板拍三次快照做对比，或录制 Allocation instrumentation 时间线，重点看对象数是否持续增长、有没有意外保留链（Retainers）。

**追问与易错点**：

- 追问：单页应用最典型的泄漏是什么？答：路由切换时旧页面的定时器、事件总线订阅、全局状态里的引用没有清理。
- 陷阱：把「内存占用高」等同于泄漏。泄漏的定义是「持续增长且不再释放」，缓存变大是正常现象。

### Q47 `WeakMap` 为什么能避免内存泄漏？

**考察点**：深挖题，考察弱引用的语义及其代价（不可枚举），以及实际使用场景。

**参考答案**：

> **一句话结论**：`WeakMap` 的键是弱引用，不会阻止键对象被垃圾回收；键对象一旦不可达，整条键值记录会被自动移除，所以不需要手动 `delete` 也不会拖住内存。

1. 对比 `Map`：`Map` 强引用键和值，只要 Map 本身可达，键对象就永远活着，用它缓存 DOM 节点或组件实例必然泄漏。
2. 弱引用的代价：不能遍历，没有 `keys`/`values`/`entries`，也没有 `size`，因为条目数量随时可能因 GC 变化——这是规范刻意的限制。
3. 约束：键必须是对象（或非注册的 Symbol），原始值不行。
4. 典型用法：给对象挂私有数据与元信息（`WeakMap<instance, {count:0}>`）、DOM 节点到数据的映射、对象缓存；Vue3 内部就用 `WeakMap` 维护原始对象与响应式代理的映射关系。

```js
const priv = new WeakMap();
class Counter {
  constructor() { priv.set(this, { count: 0 }); }
  inc() { return ++priv.get(this).count; }
}
// 实例被回收后，WeakMap 里的记录自动消失，无需手动清理
```

**追问与易错点**：

- 追问：`WeakSet` 呢？答：同理，元素是弱引用，常用来标记「已处理过的对象」而不产生泄漏。
- 陷阱：说「`WeakMap` 会自动清理所以一定能防泄漏」。如果值本身被外部强引用，或者键一直被别处持有，一样不会释放。

### Q48 线上怀疑内存泄漏，你具体怎么排查和处理？

**考察点**：综合题，考察是否有可执行的排障步骤，而不是只罗列名词。

**参考答案**：

> **一句话结论**：先用 Performance/Memory 面板确认「内存曲线是否持续上升且 GC 后不回落」，再用堆快照对比定位增长的对象与保留链，找到持有它的代码（监听、定时器、缓存、闭包）后清理。

1. 第一步确认现象：Performance 里录制包含反复操作的时间段，观察 JS Heap 是否呈锯齿上升、每次 GC 后基线是否抬高；也可用 Memory 的 Allocation instrumentation 看分配热点。
2. 第二步定位对象：做三次堆快照（操作前、操作后、再次操作后），在 Comparison 视图里按 `Delta` 排序找持续增长的构造函数；对疑似 DOM 用 `Detached` 过滤，直接搜 `Detached HTMLElement`。
3. 第三步找根因：在快照里看目标对象的 Retainers（保留链），一直追到最外层的持有者，通常就是忘了摘除的监听、定时器、全局缓存或事件总线。
4. 第四步修复与验证：组件卸载时统一清理（`clearInterval`、`removeEventListener`、`abortController.abort()`、订阅退订），缓存改用 `WeakMap`，再重复第 1 步确认曲线回落。
5. Node 侧思路一致，配合 `--inspect` 抓堆快照、`process.memoryUsage()` 观察 RSS 趋势，或用 `clinic`/`heapdump` 定位。

**追问与易错点**：

- 追问：为什么要拍三次快照？答：两次只能看到差异，三次能确认「持续增长」的趋势，排除一次性初始化的干扰。
- 陷阱：不做手动 GC 就对比快照，会把待回收的垃圾对象误判成泄漏。

## 本章小结

- 作用域是静态的，看代码书写位置；`this` 是动态的，看调用方式，两者是两套完全独立的机制。
- `var` 是函数作用域、会提升为 `undefined`；`let`/`const` 是块级作用域、有 TDZ——循环打印同一个值的根因就在这里。
- 闭包 = 函数 + 定义时的词法环境，捕获的是变量本身而不是值的快照；它是特性，不是内存泄漏。
- `this` 优先级：`new` > 显式绑定 > 隐式绑定 > 默认绑定；箭头函数不参与，直接取定义时的外层 `this`。
- `new` 四步：建对象、连原型、执行构造函数、按返回值规则返回；构造函数返回对象会覆盖默认实例。
- 原型查找从自身开始沿 `[[Prototype]]` 向上，终点是 `null`；`instanceof` 只是查原型链，不是类型检测。
- 继承的最佳实践是寄生组合继承，`class extends` 在此之上多加了一条子类构造函数指向父类构造函数的静态链。
- 内存泄漏的本质是「不再需要却仍然可达」，排查靠堆快照对比与保留链，修复靠及时清理监听、定时器与缓存（长期缓存优先 `WeakMap`）。

<!-- COUNT: 48 -->
