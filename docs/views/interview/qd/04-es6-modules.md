---
title: "第 4 章 ES6+ 新特性与模块化"
---

## 第 4 章 ES6+ 新特性与模块化

### Q1 var、let、const 到底有什么区别？

**考察点**：能否从作用域、变量提升、重复声明、常量语义四个维度系统对比，而不是只背一句"let 没有变量提升"。

**参考答案**：

> **一句话结论**：var 是函数作用域且声明会提升并初始化为 undefined，let/const 是块级作用域且存在暂时性死区，const 只禁止重新赋值、不禁止修改对象内容。

1. 作用域：var 以函数为边界，let/const 以最近的 `{}` 为边界（if、for、try 块都算），所以块内声明的 let 出了块就访问不到。
2. 变量提升（Hoisting）：var 的声明被提升并初始化为 undefined，声明前访问得到 undefined；let/const 也提升但不初始化，声明前访问抛 `ReferenceError`，这段区间叫暂时性死区（Temporal Dead Zone）。
3. 重复声明：同一作用域内 var 可重复声明；let/const 重复声明是语法错误，能提前暴露问题。
4. 全局声明的差异：浏览器顶层 `var a = 1` 会成为 window 的属性，`let a = 1` 不会，避免污染全局对象。
5. const：声明时必须初始化，之后不能重新赋值；但对象内部属性照样能改，要真正不可变得用 Object.freeze 逐层冻结。

```js
console.log(a); // undefined
var a = 1;
console.log(b); // ReferenceError: Cannot access 'b' before initialization
let b = 2;
const o = { n: 1 };
o.n = 2;   // 可以，改的是对象内容
// o = {}; // TypeError: Assignment to constant variable
```

**追问与易错点**：

- 陷阱：回答"let 没有变量提升"会被当场纠正。准确的表述是"提升但不初始化，存在暂时性死区"。
- 追问：那为什么 let 还要提升？答：为了在静态分析时确定它是本块内的绑定，避免出现"声明前访问外层同名变量"的混乱，所以用 TDZ 直接报错。
- 追问：循环里 `for (var i...)` 和 `for (let i...)` 有什么区别？答：let 每轮迭代创建新的绑定，所以闭包里能拿到每一轮的值；var 只有一个变量。下一题展开。

### Q2 为什么 for 循环里用 var 配合 setTimeout 会全部输出同一个值？

**考察点**：考闭包与块级作用域的结合，是 var/let 差异最经典的实战题。

**参考答案**：

> **一句话结论**：var 只创建一个变量、所有闭包共享它；let 在每一轮迭代都创建一个新的绑定，闭包各自捕获自己的那一份。

1. 现象对比：`for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` 输出 3、3、3；换成 `let` 输出 0、1、2。
2. 原理：var 声明在函数作用域（这里是全局），三次循环注册的回调捕获的是同一个 i，等定时器执行时循环早已结束，i 已是 3。
3. let 的实现语义：规范会在每轮迭代开始时创建一个新的词法环境并把当前值复制进去（Per-Iteration Binding），所以每个回调的 i 是独立绑定。
4. 老写法等价方案：用 IIFE 把 i 当参数传进去，本质就是手工制造每轮独立作用域；此外 `forEach` 的回调参数天然是每轮独立值。

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j)); // 0 1 2
for (var k = 0; k < 3; k++) ((n) => setTimeout(() => console.log(n)))(k);
```

**追问与易错点**：

- 陷阱：说"let 把定时器变成了同步"是理解错误，实际只是绑定的数量与归属变了。
- 追问：`for...of` 和 `forEach` 里会不会有这个问题？答：不会，`for...of` 每轮新绑定，`forEach` 每次调用传入新的参数值。
- 追问：把 `setTimeout` 换成同步打印还会输出 3、3、3 吗？答：不会，同步执行时 i 就是当时的值，所以问题只在异步回调里暴露。

### Q3 const 声明的对象为什么还能改属性？怎么做到真正的不可变？

**考察点**：考 const 约束的是"绑定"还是"值"，以及浅冻结与深冻结的区别。

**参考答案**：

> **一句话结论**：const 保证的是变量的绑定不可重新赋值，不保证值内部不可变；真正的不可变要用 Object.freeze，而且它只是浅冻结。

1. const 的语义：禁止对这个标识符再次赋值（`o = {}` 抛 TypeError），但不阻止通过 `o.n = 1`、`o.n++`、`o.arr.push()` 修改内容。
2. 真正的不可变：`Object.freeze(o)` 会把对象变成不可扩展且所有自有属性不可写、不可配置；此后对属性的修改在严格模式下抛 TypeError，非严格模式下静默失败。
3. 浅冻结：freeze 不递归，嵌套对象仍可修改，所以需要写递归深冻结函数，注意用 WeakSet 记录已处理对象防止循环引用死循环。
4. 适用场景：常量对象、配置表、枚举、Redux/Vuex 状态防止误改；代价是失去响应式更新的可能，不要把需要修改的状态冻结。
5. 补充：`Object.seal` 只禁止增删属性但允许改值，与 freeze 不同。

```js
function deepFreeze(obj) {
  Object.values(obj).forEach(v => v && typeof v === 'object' && deepFreeze(v));
  return Object.freeze(obj);
}
```

**追问与易错点**：

- 陷阱：说"const 声明的对象完全不能改"会被要求现场写代码验证，一写就穿。
- 追问：箭头函数 `const f = () => {}` 和普通函数声明有什么区别？答：const 声明的函数不会被提升（TDZ），只能在声明之后调用。
- 追问：循环里能用 const 吗？答：`for (const x of arr)` 可以，因为每轮是新绑定；`for (const i = 0; i < 3; i++)` 会直接报错。

### Q4 数组解构怎么用？嵌套、默认值和剩余怎么写？

**考察点**：考解构的完整语法掌握度，尤其是默认值触发条件与剩余元素的位置限制。

**参考答案**：

> **一句话结论**：数组解构按位置取值，可以用逗号跳过、用 `=` 写默认值、用 `...` 收剩余，但剩余元素必须写在最后。

1. 基本与跳过：`const [a, , b] = [1, 2, 3]` 得到 a=1、b=3，逗号就是"占位不取"。
2. 默认值：`const [x = 1] = []` 得到 1；只有取到的值是 undefined 才用默认值，null 不算，会原样拿到 null。
3. 嵌套与剩余：`const [[p], [q]] = [[1], [2]]`，`const [head, ...tail] = [1, 2, 3]` 得 head=1、tail=[2,3]，剩余必须放最后。
4. 交换变量与函数返回多值：`[x, y] = [y, x]` 免去临时变量；`const [err, data] = await to(promise)` 是常见多返回值写法。
5. 解构右边只要是可迭代对象都行：数组、字符串、Set、Map（得 [k,v]）、生成器返回的迭代器，不限于数组。

```js
const [a, , b = 3, ...rest] = [1, 2, undefined, 4, 5];
// a=1  b=3  rest=[4,5]
let x = 1, y = 2;
[x, y] = [y, x]; // 交换：需要分号或换行保护，避免与前一行连成一句
```

**追问与易错点**：

- 陷阱：`[x, y] = [y, x]` 前面如果紧跟一个不以分号结尾的语句，会被解析成连续表达式而报错，行首要加分号。
- 追问：默认值写 `[a = b, b = 2]` 行不行？答：会报 TDZ 错误，因为解构是左到右求值，默认值只能引用前面已赋值的变量，对象解构同理。
- 追问：解构 `null` 会怎样？答：`const [a] = null` 抛 TypeError，因为 null 不可迭代，函数参数解构要写默认值兜底。

### Q5 对象解构的重命名、默认值和嵌套怎么写？

**考察点**：考对象解构的完整语法，面试常直接给一段配置代码让你改写。

**参考答案**：

> **一句话结论**：对象解构按属性名取值，用 `原属性名: 新变量名` 重命名，用 `=` 给默认值，嵌套就是继续往深层写花括号。

1. 重命名：`const { name: userName } = user`，注意冒号左边是属性名、右边才是变量名，写反是最常见的手误。
2. 默认值：`const { page = 1, size = 10 } = query`，同样只在属性值为 undefined 时生效；重命名与默认值可叠加写 `{ a: aa = 1 }`。
3. 嵌套：`const { data: { list = [] } } = res`，要求中间层级存在，否则抛 TypeError；配合默认值可写成 `{ data: { list = [] } = {} }`。
4. 函数参数解构：`function request({ url, method = 'GET', headers = {} } = {})` 既解构又允许无参调用，是封装请求方法的常用写法。
5. 剩余属性：`const { password, ...safe } = user` 一行剔除敏感字段（浅拷贝），剩余运算符收集的是自有可枚举属性。

```js
const user = { name: 'liu', age: 34, address: { city: '长沙' } };
const { name: userName, age = 18, address: { city } } = user;
console.log(userName, age, city); // liu 34 长沙
```

**追问与易错点**：

- 陷阱：解构出来的方法再直接调用会丢 this，`const { log } = console; log('x')` 在部分实现下报 Illegal invocation，要写 `console.log.call(console, 'x')` 或先绑定。
- 追问：只想取部分字段又不想写很长的解构怎么办？答：可以按需解构，或用剩余属性反选；深层嵌套过深说明接口结构该调整。
- 追问：解构会拷贝对象吗？答：不拷贝对象本身，只是把属性值取出来放到新变量里，是取引用。

### Q6 解构赋值有哪些容易踩的坑？

**考察点**：考边界意识，能不能主动说出报错条件与语法限制。

**参考答案**：

> **一句话结论**：解构最常见的三个坑是解构 null/undefined 直接抛错、对象解构赋值表达式必须加括号、默认值只在 undefined 时生效。

1. 解构空值抛错：`const { a } = null`、`const [a] = undefined` 都是 TypeError，因为要读属性或调迭代器；接口数据可能为空时串上 `?? {}` 或参数默认值。
2. 语法限制：声明语句之外的解构赋值如果整行以 `{` 开头会被当成块语句，必须用括号包起来 `({ a } = obj)`；数组解构无此问题。
3. 默认值触发条件：只有 undefined 触发默认值，null、0、''、false 都会原样保留，接口返回 null 时默认值救不了你。
4. TDZ 与左到右求值：默认值表达式只能引用左边已经解构出的变量，引用后面的变量报 ReferenceError。
5. 赋值目标是成员表达式：`[obj.a, obj.b] = [1, 2]`、`({ a: obj.x } = data)` 合法，但要注意 obj 本身必须是已声明对象。

```js
// const { a } = null;       // TypeError
let a;
({ a } = { a: 1 });          // 必须加括号
const { b = 2 } = { b: null }; // b 是 null，不是 2
```

**追问与易错点**：

- 陷阱：以为 `const { a = 1 } = { a: null }` 能得到 1，这是默认值最常被考的错误理解。
- 追问：解构能不能用于交换两个对象的属性？答：可以，但属性必须有 setter 或本身可写，只读属性会静默失败或报错。
- 追问：解构和展开的性能有差异吗？答：正常业务量级可忽略；超高频热路径上解构可能略慢，但远不如算法选择重要。

### Q7 展开运算符有哪些用法？它是深拷贝吗？

**考察点**：考展开的适用对象、拷贝层次以及对象展开与数组展开的规则差异。

**参考答案**：

> **一句话结论**：展开运算符把可迭代对象或对象自有可枚举属性"摊开"，用于拷贝、合并、传参；它永远是浅拷贝。

1. 数组展开：`[...arr]` 拷贝数组、`[...a, ...b]` 合并、`Math.max(...nums)` 传参，要求右侧是可迭代对象。
2. 对象展开：`{ ...obj }` 是浅拷贝，只复制自有可枚举属性（包括 Symbol 键），不复制原型链上的属性，也不会把 getter 原样搬过去，而是求值后变普通属性。
3. 覆盖顺序：`{ ...defaults, ...options }` 后者覆盖前者，这是配置合并的标准写法，要小心把 undefined 也覆盖上去。
4. 浅拷贝的代价：嵌套对象仍是同一个引用，改 `copy.inner.x` 会影响原对象；需要深拷贝用 structuredClone 或明确的递归实现。
5. 典型用途：不可变更新 `{ ...state, list: [...state.list, item] }`、把类数组/字符串/Set 转数组 `[...'abc']`、`[...new Set(arr)]` 去重。

```js
const base = { a: 1, nested: { n: 1 } };
const copy = { ...base };
copy.nested.n = 99;
console.log(base.nested.n); // 99，嵌套是共享引用
```

**追问与易错点**：

- 陷阱：把展开当深拷贝用，Redux/Vue 里修改嵌套状态没触发更新或误改原数据，都是这个原因。
- 追问：`{ ...undefined }` 会报错吗？答：对象展开对 null/undefined 是安全的，会被忽略；但 `[...undefined]` 会抛 TypeError，因为不可迭代。
- 追问：`{ length: 2 }` 这种类数组能用 `[...obj]` 展开吗？答：不能，它没有 `Symbol.iterator`，要用 Array.from。

### Q8 剩余参数和 arguments 有什么区别？

**考察点**：考"真数组 vs 类数组"这一核心差异，以及箭头函数没有 arguments 的连带影响。

**参考答案**：

> **一句话结论**：剩余参数（rest）是真正的数组、只能收集剩余形参、且箭头函数里也能用；arguments 是类数组对象、包含全部实参、且只有普通函数才有。

1. 类型差异：rest 是 Array 实例，可直接 `map/filter/reduce`；arguments 是类数组对象，要先 `Array.from(arguments)` 或展开转换才能用数组方法。
2. 范围差异：`function f(a, ...rest)` 只收集 a 之后的实参；arguments 包含本次调用的全部实参，还带 `callee/length`。
3. 可用位置：rest 是形参，只能放参数列表最后（后面不能再有形参）；arguments 是函数内部隐式对象，位置不受限。
4. 箭头函数：箭头函数没有自己的 arguments（会取外层函数的），所以在箭头函数里想拿全部参数必须用 rest。
5. 与形参联动：非严格模式下修改 arguments[i] 会影响同名形参，严格模式与 ES6 默认参数下这个联动被切断，这也是不建议再用 arguments 的原因。

```js
function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }
sum(1, 2, 3); // 6

const fn = (...args) => args.length; // 箭头函数只能用 rest
```

**追问与易错点**：

- 陷阱：在箭头函数里写 `arguments[0]` 拿到的是外层普通函数的参数，不是自己的，非常隐蔽。
- 追问：rest 可以用默认值吗？答：`...rest = []` 是语法错误，rest 无默认值，没传时就是空数组。
- 追问：怎么判断实参个数？答：rest 用 `args.length`，普通函数可以用 `arguments.length` 或形参默认值配合；更推荐 rest。

### Q9 函数默认参数有哪些细节容易错？

**考察点**：考默认值的触发条件、求值时机与作用域，属于基础但极易翻车的点。

**参考答案**：

> **一句话结论**：默认参数只在实参为 undefined（或未传）时生效，每次调用都会重新求值，并且参数区域是一个独立作用域，不能引用函数体内的变量。

1. 触发条件：传 undefined 或省略时用默认值；传 null、0、''、false 都不会触发，这是和 `||` 混淆最常踩的坑。
2. 惰性求值：默认值表达式在调用时才计算，所以 `function f(obj = {})` 每次调用得到新对象，可以安全地往里写；反过来，写成模块级常量作默认值就会共享引用。
3. 求值顺序与作用域：参数从左到右求值，默认值可以引用左边已赋值的参数；参数有独立作用域，引用函数体内的 let/const 会报 TDZ。
4. 影响 fn.length：`fn.length` 只统计"第一个带默认值之前"的形参个数，所以 `function f(a, b = 1){}` 的 length 是 1，写依赖参数个数的逻辑时要留意。
5. 语法限制：使用了非简单参数列表（默认值、解构、rest）的函数体内不能再出现 `'use strict'` 指令，否则是语法错误。

```js
function f(a = 1, b = a + 1) { return [a, b]; }
f();          // [1, 2]
f(10);        // [10, 11]
function g(x = {}) { x.n = 1; return x; }
console.log(g() === g()); // false，每次都是新对象
```

**追问与易错点**：

- 陷阱：以为默认参数能拦住 undefined 之外的"空值"，实际 `f(null)` 拿到的是 null，后面访问属性就报错。
- 追问：默认参数和 `a = a || 1` 有什么区别？答：后者会把 0、''、false 也替换掉，且每次都要重新写判断，语义不如 `??` 精确。
- 追问：为什么加了默认参数后 arguments 不再联动形参？答：规范规定非简单参数列表会创建独立的参数环境，arguments 与形参解除绑定。

### Q10 箭头函数和普通函数有哪些区别？

**考察点**：这是必考题，要求一次性说全 this、构造、arguments、prototype、语法限制几个维度。

**参考答案**：

> **一句话结论**：箭头函数没有自己的 this、arguments、super 和 new.target，不能被 new 调用，也没有 prototype；它的 this 在定义时按词法作用域确定，之后无法改变。

1. this 绑定：箭头函数不产生自己的 this，取定义位置外层作用域的 this；普通函数的 this 在调用时决定（谁调用指向谁，独立调用在严格模式下是 undefined），并且能被 call/apply/bind 修改。
2. 不能当构造函数：箭头函数没有 `[[Construct]]` 和 prototype，`new (() => {})` 抛 TypeError，也因此不能用于需要实例化的场景。
3. 没有 arguments 与 super/new.target：需要参数列表时用 rest；因为不能 new，new.target 也无意义。
4. 不能作为生成器：`function*` 与箭头函数不能组合，箭头函数体内不能出现 yield。
5. 语法差异：单表达式可以省略 return（隐式返回），返回对象字面量要用 `() => ({ a: 1 })`；不能有同名参数；不能被提升到可用状态（若用 const 声明）。

| 对比项 | 箭头函数 | 普通函数 |
| --- | --- | --- |
| this | 定义时词法确定，不可改 | 调用时确定，可用 bind 改 |
| new | 报 TypeError | 可作构造函数 |
| arguments | 无（用 rest） | 有 |
| prototype | 无 | 有 |
| 适合场景 | 回调、保留外层 this | 对象方法、需要动态 this |

**追问与易错点**：

- 陷阱：在对象字面量里用箭头函数当方法，`this` 指向外层（模块/全局）而不是对象，是最常见的手写翻车点。
- 追问：Vue3 的 setup 里为什么推荐用箭头函数？答：setup 里本来就不依赖 this，箭头函数能稳定捕获外层作用域，避免 this 歧义；而 Vue2 的 options 里 methods 用箭头函数反而拿不到组件实例。
- 追问：箭头函数能替代 bind 吗？答：类组件里 `onClick = () => {}` 这类属性写法等价于把 this 绑死，是 bind 的替代方案；但会带来每个实例一个函数的开销。

### Q11 哪些场景不适合用箭头函数？

**考察点**：考"知道区别"之外还要"知道何时不用"，属于实战判断题。

**参考答案**：

> **一句话结论**：凡是需要"运行时的 this"或需要自身 arguments/prototype 的地方都不能用箭头函数，典型是对象方法、需要动态 this 的事件回调、构造函数与原型方法。

1. 对象字面量方法：`const obj = { n: 1, get() { return this.n } }` 必须用方法简写或普通函数；写成 `get: () => this.n` 拿到的是外层 this。
2. 需要 this 指向调用者的回调：`el.addEventListener('click', function () { this.classList })` 中的 this 是元素，换箭头函数就指向外层，需要改用 event.currentTarget。
3. Vue2 选项式 API：methods/computed 里用箭头函数会导致 this 不是组件实例，取不到 data 与 methods；Vue3 组合式 API 中反而可以用箭头函数。
4. 需要 arguments 或需要被 new 的场景：构造函数、原型方法、需要动态上下文的对象（如 canvas 绘图上下文、jQuery 回调）。
5. 需要函数名做递归/调试的场景：匿名箭头函数的报错堆栈里名字是变量名或 anonymous，可读性差一些。

```js
const counter = {
  n: 0,
  inc: () => { this.n++; },   // 错误：this 不是 counter
  inc2() { this.n++; }        // 正确
};
```

**追问与易错点**：

- 陷阱：React 类组件里 `handleClick() {}` 不绑 this 会 undefined，需要 `onClick={this.handleClick.bind(this)}` 或箭头函数属性；函数组件 + Hooks 下无此问题。
- 追问：定时器里用箭头函数是不是总对？答：多数情况对，因为想保留外层 this；但如果外层是模块顶层的普通函数，this 本来就不是你以为的对象。
- 追问：箭头函数能提升吗？答：用 `const f = () => {}` 声明的有 TDZ，不能提前调用；`var f = () => {}` 会提升为 undefined。

### Q12 模板字符串比字符串拼接强在哪？

**考察点**：考基础语法与常见误用，重点看是否知道它是运行时的、不负责转义。

**参考答案**：

> **一句话结论**：模板字符串用反引号与 `${}` 支持多行、插值和嵌套，可读性远优于加号拼接，但它只是在运行时求值拼串，不做任何转义或安全处理。

1. 多行文本：反引号内的换行会原样保留，写 HTML 片段或多行 SQL 不用再写 `\n` 或加号续行。
2. 插值表达式：`${}` 内可以是任意表达式（三元、函数调用、Math 运算），不是只能放变量；表达式结果会被转成字符串。
3. 嵌套：模板里可以再写模板，常用于生成列表项；但层数一多可读性会崩，超过两层建议抽函数或改用组件。
4. 安全性：拼进 innerHTML 的用户输入会直接造成 XSS，模板字符串不会自动转义，必须自己 escape 或用框架的文本插值。
5. 性能：现代引擎对模板字符串与加号拼接的优化都很好，常规场景不必因为性能刻意选择，可读性优先。

```js
const user = { name: 'liu', age: 34 };
const html = `<div class="card">
  <p>${user.name}</p>
  <p>${user.age >= 18 ? '成年' : '未成年'}</p>
</div>`;
```

**追问与易错点**：

- 陷阱：以为 `${}` 输出 undefined 会报错，实际会拼出字符串 "undefined"，这类脏数据要靠默认值或 `??` 拦截。
- 追问：模板字符串能当函数调用吗？答：能，`fn\`...\`` 是标签模板（Tagged Template），下一题展开。
- 追问：多行模板的缩进会带进字符串吗？答：会，反引号内每行前面的空格都是内容，生成 HTML 时要注意缩进带来的空白。

### Q13 标签模板是什么？有什么实际用途？

**考察点**：考对模板字符串进阶形式的理解，能说出 String.raw 与 styled-components 原理即可。

**参考答案**：

> **一句话结论**：标签模板就是把模板字符串当参数传给一个函数，函数收到"字符串片段数组 + 各插值"两组参数，可以在拼接前做加工，styled-components、i18n、SQL 参数化都用它。

1. 参数结构：标签函数第一个参数是字符串片段数组（带 raw 属性保存未转义的原始文本），后面的参数依次是各 `${}` 的值，片段数永远比插值数多 1。
2. String.raw：内置标签，直接输出原始字符串，专门处理 Windows 路径与正则字面量，`String.raw\`C:\new\`` 不会把 `\n` 当换行。
3. styled-components 原理：`styled.div\`color: ${p => p.color}\`` 接收 CSS 片段与插值，生成带哈希类名的样式并注入，插值可以是函数以实现按 props 动态取值。
4. 转义与安全：可以在标签函数里对插值做 HTML 转义或参数化（如 SQL 占位符），把危险内容与结构分离，这也是标签模板被认为"能防注入"的原因。
5. 其他用途：i18n 提取静态文案（构建工具能扫描片段原文）、GraphQL 的 gql 标签把查询字符串编译成 AST。

```js
function raw(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (values[i] ?? ''), '');
}
const name = 'liu';
raw`hello ${name}`; // 'hello liu'
```

**追问与易错点**：

- 陷阱：以为标签模板能自动防 XSS，实际上只有你写的标签函数做了转义才有防护效果。
- 追问：`strings.raw` 和 `strings` 有什么区别？答：raw 里保存的是未处理转义序列的原始文本，普通片段索引里 `\n` 已经是真实换行。
- 追问：标签函数的返回值一定是字符串吗？答：不必，styled-components 返回的是组件或样式对象，返回类型由标签函数自己决定。

### Q14 for...of 和迭代器协议是什么关系？

**考察点**：考"可迭代协议 + 迭代器协议"这套统一的数据消费机制，能说清 Symbol.iterator 的作用。

**参考答案**：

> **一句话结论**：for...of 遍历的是可迭代对象，本质是调用它的 `Symbol.iterator` 方法拿到迭代器，再不断调用 next() 取 `{ value, done }` 直到 done 为 true。

1. 两个协议：可迭代协议要求对象有 `[Symbol.iterator]()` 方法并返回迭代器；迭代器协议要求该对象有 next()，返回 `{ value, done }`。
2. 统一的消费端：for...of、展开运算符、数组解构、Array.from、yield*、Promise.all、new Map() 都走同一套协议，所以给自定义对象实现 `Symbol.iterator` 就能被这些语法通用地消费。
3. for...of 与 for...in 的区别：for...of 取"值"且要求可迭代；for...in 取"键名"且会遍历原型链上的可枚举属性，遍历数组时还会把自定义属性带出来，不推荐用于数组。
4. 提前退出与清理：for...of 里 break/return/throw 会调用迭代器的 return() 方法做资源清理，所以生成器里的 finally 能被执行，forEach 做不到中途退出。
5. 普通对象不可直接 for...of：要用 Object.keys/values/entries，或自己实现 `Symbol.iterator`。

```js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let cur = this.from, last = this.to;
    return { next: () => (cur <= last ? { value: cur++, done: false } : { value: undefined, done: true }) };
  }
};
console.log([...range]); // [1, 2, 3]
```

**追问与易错点**：

- 陷阱：用 for...in 遍历数组并直接当索引值用，遇到数组被挂过自定义属性或原型被污染就会出错。
- 追问：为什么 for...of 能遍历 Map 和 Set？答：它们的原型上实现了 `Symbol.iterator`，Map 默认产出 `[key, value]` 数组，所以常写 `for (const [k, v] of map)`。
- 追问：for...of 里能用 await 吗？答：可以，会按顺序串行等待；要并发就用 `await Promise.all()` 或 `for await...of` 处理异步迭代器。

### Q15 可迭代对象和类数组有什么区别？

**考察点**：考两个常被混为一谈的概念，以及转换手段的适用范围。

**参考答案**：

> **一句话结论**：可迭代对象实现了 `Symbol.iterator`，类数组对象只有 length 和数字索引；有的对象两者兼具（如 arguments、NodeList），纯类数组必须用 Array.from 转换。

1. 判断标准：可迭代看有没有 `Symbol.iterator`；类数组看有没有 length 与数字下标。二者是独立特征，不存在包含关系。
2. 兼容情况：数组、字符串、Set、Map、arguments、现代浏览器的 NodeList 都同时是可迭代且类数组；`{ 0: 'a', length: 1 }` 只是类数组，不能 for...of 也不能展开。
3. 转换手段：Array.from 两者都能处理（有迭代器优先走迭代器）；展开运算符与解构只接受可迭代对象；`Array.prototype.slice.call(obj)` 依赖 length，只能处理类数组。
4. 判断技巧：`typeof obj[Symbol.iterator] === 'function'` 判可迭代；`obj.length !== undefined && typeof obj.length === 'number'` 判类数组；也可用 `Array.isArray` 先排除数组。
5. 实战价值：处理 DOM 集合、arguments、自定义容器时，先转成真数组再统一用数组方法，是最省心的做法。

```js
const like = { 0: 'a', 1: 'b', length: 2 };
Array.from(like);     // ['a','b']
// [...like];         // TypeError: like is not iterable
Array.from('abc');    // ['a','b','c']，字符串两者都算
```

**追问与易错点**：

- 陷阱：以为"有 length 就能展开"，`[...document.querySelectorAll('div')]` 在现代浏览器可行是因为 NodeList 可迭代，不是因为有 length。
- 追问：Array.from 和展开转换有性能差异吗？答：同量级，Array.from 还支持映射函数与 thisArg，一步完成转换与映射。
- 追问：为什么说遍历 DOM 集合最好先转数组？答：NodeList 是动态/静态视图且缺少数组方法，转成数组后可自由用 filter/map 并且行为稳定。

### Q16 生成器函数是怎么执行的？yield 到底暂停了什么？

**考察点**：考生成器的执行模型与 next 传值机制，是 ES6 里最需要"讲清流程"的知识点。

**参考答案**：

> **一句话结论**：调用生成器函数不会执行函数体，只返回一个生成器对象；它既是迭代器也是可迭代对象，遇到 yield 暂停并交出值，next(v) 把 v 作为上一个 yield 表达式的值继续往下执行。

1. 启动时机：`function* g(){}` 调用后函数体一行都不执行，返回生成器对象；第一次 next() 才真正开始执行到第一个 yield，返回 `{ value, done: false }`。
2. 传值：第一次 next 的参数会被丢弃（此时没有等待中的 yield 接收它），第二次 next(v) 的值成为第一个 yield 表达式的求值结果，这是"yield 既能出也能进"的关键。
3. 结束与清理：函数执行完（或 return）后返回 `{ value: 返回值, done: true }`；调用 `gen.return(v)` 会立即结束并触发函数内的 finally；`gen.throw(e)` 在暂停处抛出异常，可被内部 try/catch 捕获。
4. yield* 委托：把另一个可迭代对象的产出全部转发出去，常用于递归展开树结构。
5. 语法位置：yield 只能在生成器函数内，箭头函数不能是生成器，所以回调里想 yield 必须先写成 function* 再包一层。

```js
function* g() {
  const x = yield 1;
  console.log('收到', x);
  yield 2;
}
const it = g();
it.next();          // { value: 1, done: false }
it.next('hello');   // 打印 收到 hello，返回 { value: 2, done: false }
```

**追问与易错点**：

- 陷阱：以为第一次 next('a') 能把 a 传给第一个 yield，实际会被忽略，这是高频错误。
- 追问：生成器能重复遍历吗？答：不能，生成器对象是一次性的，走完就 done；需要重复遍历要么重新调用生成器函数，要么实现普通可迭代对象。
- 追问：for...of 遍历生成器时能拿到 return 值吗？答：拿不到，for...of 只看 value 直到 done 为 true，return 的值不在其中。

### Q17 生成器在实际项目里有什么用？

**考察点**：考"知道语法"之外的落地判断，能说出 async/await 与生成器的关系即算过关。

**参考答案**：

> **一句话结论**：生成器的核心价值是"把一段计算拆成可暂停的步骤"，用于惰性求值、无限序列、自定义迭代、异步流程编排；async/await 在语义上就是生成器加 Promise 自动执行器的语法糖。

1. 惰性求值与无限序列：ID 生成器、分页数据拉取、无限滚动，只在需要时才计算下一个值，避免一次性构造大数组。
2. 异步流程的早期方案：co 库、redux-saga 的 effect 模型都用生成器把异步写成同步的样子（yield 一个 Promise，执行器把结果 next 回去），async/await 出现后业务代码基本被替代，但 saga 这类需要"可测试的副作用描述"的场景仍在用。
3. 自定义迭代协议：给对象/类加 `[Symbol.iterator]` 时用生成器写法最省事，比手写 next 状态机清晰。
4. 状态机与流程编排：把多步流程、审批步骤、动画序列写成 yield 步骤，配合外部驱动执行。
5. 递归遍历：树的深度优先遍历用 `yield*` 递归委托，代码比手写栈短很多。

```js
function* idGen() { let id = 1; while (true) yield id++; }
const gen = idGen();
gen.next().value; // 1
gen.next().value; // 2
```

**追问与易错点**：

- 陷阱：说"async/await 就是生成器"，两者输出行为相似但 V8 内部实现不同，准确说法是"可以用生成器 + Promise 执行器模拟"。
- 追问：生成器能提升性能吗？答：多数场景不会，甚至因为状态切换有开销；它的收益是可读性与惰性，不是速度。
- 追问：redux-saga 里 yield 的是什么？答：是普通的 effect 描述对象（不是 Promise），由 saga 中间件解释执行，因此可以直接对流程做单元测试。

### Q18 什么时候用 Map，什么时候用 Object？

**考察点**：考选型能力，重点看能不能给出"键类型、顺序、性能、序列化"四个判断依据。

**参考答案**：

> **一句话结论**：键的类型不确定、需要频繁增删或需要有序遍历时用 Map；结构固定、键是字符串、需要 JSON 序列化或当纯数据对象用时用 Object。

1. 键类型：Map 的键可以是任意类型（对象、函数、NaN 都行），按引用判等；Object 的键只能是字符串或 Symbol，其他类型会被转成字符串（对象键会变 "[object Object]"）。
2. 顺序：Map 严格保持插入顺序；Object 的整数风格键会被引擎提前并按升序排列，所以"依赖对象键顺序"是有坑的。
3. 大小与迭代：Map 有 `size`，默认可迭代（for...of 直接拿 `[k, v]`）；Object 要 `Object.keys().length`，遍历要 entries。
4. 性能：频繁增删键值对 Map 通常更优；键固定且数量少的对象，引擎有隐藏类优化，访问更快、内存更省。
5. 序列化与生态：Object 能直接 `JSON.stringify`、能当配置字面量、能被解构与展开；Map 序列化要手动转数组，这是选型最容易决定结果的一条。

| 对比项 | Map | Object |
| --- | --- | --- |
| 键类型 | 任意类型 | string / Symbol |
| 顺序 | 严格插入序 | 整数键会被提前 |
| 大小 | size | Object.keys().length |
| JSON | 需手动转换 | 原生支持 |
| 适用 | 字典、缓存、频繁增删 | 配置、数据模型、需序列化 |

**追问与易错点**：

- 陷阱：把接口返回的对象随便塞进 Map，再用对象当键去查，引用不同永远查不到，要用基本类型或做 id 映射。
- 追问：Map 和 WeakMap 怎么选？答：需要遍历、需要 size、键是基本类型就用 Map；键是对象且希望对象被回收时自动释放就用 WeakMap。
- 追问：`new Map(Object.entries(obj))` 有什么代价？答：多一次数组构造，数据量大时比直接构建 Map 慢，但可读性好。

### Q19 WeakMap 有什么用？它和 Map 有什么区别？

**考察点**：考弱引用的实际价值，能说出"对象被回收时数据自动释放"这一条就到位。

**参考答案**：

> **一句话结论**：WeakMap 的键必须是对象且是弱引用，对象被回收时对应条目自动消失，因此它专门用于给对象附加私有数据或做缓存，代价是不能遍历、没有 size。

1. 与 Map 的差异：键只能是对象（ES2023 起也允许非注册 Symbol）、弱引用、不可枚举、无 size/clear/keys，不能遍历；这些限制本质是因为弱引用下内容随时可能变化。
2. 私有数据：把不想暴露的字段放进模块级 WeakMap，以实例为键存取，外部拿不到也改不了；ES2022 起有 `#private` 语法后，新代码优先用私有字段。
3. 以对象为键的缓存：计算结果挂在源对象上，源对象被回收时缓存自动失效，不会造成内存泄漏；典型的"记忆化（memoize）"实现。
4. DOM 关联数据：给 DOM 节点挂业务数据，节点移除后数据随之释放；用普通属性或 Map 都要手动清理。
5. 与 WeakSet 的区别：WeakMap 是键值对，WeakSet 只存对象集合，用于打标记。

```js
const cache = new WeakMap();
function memo(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const v = heavy(obj);
  cache.set(obj, v);
  return v;
}
```

**追问与易错点**：

- 陷阱：以为 WeakMap 能遍历或者能用字符串当键，两者都会直接报错或拿不到预期结果。
- 追问：WeakMap 的键为什么不能是原始值？答：原始值没有"被回收"的概念，无法定义弱引用的生命周期。
- 追问：Vue3 的响应式为什么用 WeakMap 存代理？答：以原始对象为键缓存它的 Proxy，原始对象释放后缓存自然失效，避免长期持有导致内存增长。

### Q20 Set 怎么去重？集合运算怎么做？

**考察点**：考 SameValueZero 的判等规则与集合运算的手写能力，同时知道新版有原生方法。

**参考答案**：

> **一句话结论**：Set 用 SameValueZero 判等（NaN 等于 NaN，+0 等于 -0），所以 `[...new Set(arr)]` 能去重基本类型；对象按引用判等，去重对象必须按业务键处理。

1. 基本去重：`[...new Set(arr)]` 或 `Array.from(new Set(arr))`；Set 不是数组，要转换才能用数组方法。
2. 对象去重：`new Set([{a:1},{a:1}])` 会有两个元素，因为引用不同；要按 id 或序列化后的字符串判重，注意 JSON 序列化有键顺序与类型丢失的坑。
3. 判等细节：SameValueZero 让 NaN 能正确去重（indexOf 做不到），+0 与 -0 视为相同；判断存在用 `set.has(v)`，是 O(1)。
4. 集合运算：ES2025 起有原生 `union/intersection/difference/symmetricDifference/isSubsetOf/isSupersetOf/isDisjointFrom`（Node 22+/较新浏览器），旧环境手写用 filter + has。
5. 常见用途：数组去重、标签集合、访问标记、`Set` 与数组互转、用 Set 做 O(1) 的成员判断替代 includes。

```js
const a = new Set([1, 2, 3]), b = new Set([2, 3, 4]);
const inter = new Set([...a].filter(x => b.has(x)));      // {2,3}
const diff  = new Set([...a].filter(x => !b.has(x)));     // {1}
```

**追问与易错点**：

- 陷阱：用 Set 给对象数组去重后以为成功了，实际长度没变；另一个坑是 Set 转数组时忘了展开，拿到的是 Set 对象。
- 追问：`[...new Set('aabbc')]` 得到什么？答：`['a','b','c']`，字符串是可迭代对象，Set 去重后转数组即可。
- 追问：Set 和数组谁查得快？答：成员判断 Set 是平均 O(1)，数组 includes 是 O(n)，数据量大时把数组换成 Set 收益明显。

### Q21 WeakSet 的使用场景是什么？

**考察点**：考对 WeakSet 的认知是否只停留在"和 Set 差不多的弱引用版"。

**参考答案**：

> **一句话结论**：WeakSet 只能存对象、弱引用、不可遍历也没有 size，最典型的用途是给对象打"已处理/已访问"标记，标记本身不影响对象的回收。

1. 与 Set 的差异：元素只能是对象（基本类型报 TypeError）、弱引用、无 size/不可遍历/无 clear；因此无法列举内容，只能问"有没有"。
2. 图与树的遍历去重：递归遍历对象图、DOM 树、依赖关系时用 WeakSet 记录访问过的节点，防止循环引用死循环，且不阻止节点回收。
3. 标记已初始化/已代理的对象：框架里记录"这个对象已经处理过"，避免重复包装；对象销毁后标记自动消失。
4. 不能做的事：不能存字符串数字、不能遍历、不能统计数量；需要这些能力就改用 Set 并自己管理清理。

```js
const seen = new WeakSet();
function walk(node) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  Object.values(node).forEach(walk);
}
```

**追问与易错点**：

- 陷阱：想遍历 WeakSet 做清理或统计，发现 API 根本不存在，说明没抓住"弱引用必然不可枚举"这个设计前提。
- 追问：WeakSet 能防内存泄漏吗？答：它自己不持有强引用，所以不会因为标记而阻止回收，这正是它的核心价值。
- 追问：`weakSet.add('str')` 会怎样？答：立刻抛 TypeError，WeakSet 只接受对象。

### Q22 Proxy 是什么？怎么用？

**考察点**：考 Proxy 的基本模型，能不能说清 target、handler、trap 三个概念。

**参考答案**：

> **一句话结论**：Proxy 在目标对象前面加一层拦截器，对代理对象的操作先经过 handler 中对应的 trap 函数，没定义 trap 的操作走默认行为、直接转发给 target。

1. 基本结构：`new Proxy(target, handler)`，target 是被代理的对象或函数，handler 里按操作类型定义 trap（如 get、set、has）。
2. 能拦截的操作：共有 13 类 trap，包括属性读写、in、delete、ownKeys、属性描述符、原型操作、可扩展性，以及针对函数的 apply（调用）与 construct（new）。
3. 只能代理对象：Proxy 不能代理原始值；如果要代理一个数字，必须包在对象里。
4. 可撤销代理：`Proxy.revocable(target, handler)` 返回 `{ proxy, revoke }`，调用 revoke() 后任何对 proxy 的操作都抛 TypeError，适合把对象安全地交给外部库使用。
5. 与直接改属性描述符的区别：Proxy 拦截的是"整个对象的操作层"，因此能感知新增属性、删除属性，这是 Vue3 换用它做响应式的根本原因。

```js
const p = new Proxy({}, {
  get: (target, key, receiver) => (key in target ? Reflect.get(target, key, receiver) : `no-${String(key)}`)
});
console.log(p.foo); // no-foo
```

**追问与易错点**：

- 陷阱：以为 Proxy 会复制或替换目标对象，其实它只是包一层，改代理会改到 target（除非你在 trap 里另做处理）。
- 追问：proxy === target 吗？答：不相等，严格比较会失败，框架里常需要 toRaw 拿到原始对象，避免重复代理与相等性误判。
- 追问：代理能嵌套吗？答：可以套多层 Proxy，但每层都增加调用开销，实践中很少超过一层。

### Q23 Proxy 有哪些常用拦截器？

**考察点**：考对 trap 清单的熟悉度，至少要能说出 get/set/has/deleteProperty/ownKeys/apply/construct 七个。

**参考答案**：

> **一句话结论**：日常用得最多的是 get、set、has、deleteProperty、ownKeys 和针对函数的 apply、construct；每个 trap 在返回前通常调用对应的 Reflect 方法执行默认行为。

1. get/set：最常用的两个，实现响应式依赖收集与触发更新、默认值、类型校验、只读保护、日志埋点。
2. has/deleteProperty/ownKeys：用于拦截 `in`、`delete`、`Object.keys` 等；注意 ownKeys 的返回值必须与目标的不可配置属性保持一致，否则抛 TypeError。
3. apply/construct：只对函数型 target 生效，可拦截调用与 new，用于实现函数柯里化外壳、Mock 库、按需构造。
4. 描述符与原型相关：getOwnPropertyDescriptor、defineProperty、getPrototypeOf、setPrototypeOf、isExtensible、preventExtensions，主要用于不可变数据与沙箱。
5. 不变量（invariant）约束：所有 trap 的返回值必须自洽，例如不可写不可配置的属性不能被报告成可写，违背会直接抛 TypeError。

```js
const arr = new Proxy([], {
  get(target, key) {
    if (typeof key === 'string' && /^-\d+$/.test(key)) return target[target.length + Number(key)];
    return Reflect.get(target, key);
  }
});
arr.push(1, 2, 3);
console.log(arr[-1]); // 3，负数索引
```

**追问与易错点**：

- 陷阱：在 get trap 里写 `target[key]` 而不是 `Reflect.get(target, key, receiver)`，会导致 getter 里的 this 指向原始对象，Vue3 的依赖收集就会漏。
- 追问：可以只定义 set 不定义 get 吗？答：可以，未定义的 trap 走默认转发；但只定义 set 时读取仍然直接读 target。
- 追问：Proxy 能拦截数组的 push 吗？答：push 内部会读 length、写索引、写 length，这些都会命中 get/set trap，所以能拦截，但一次 push 会触发多次 trap。

### Q24 Vue3 为什么用 Proxy 替代 Object.defineProperty？

**考察点**：高频框架原理题，要求把 Vue2 响应式的三个痛点与 Proxy 的优势对应起来。

**参考答案**：

> **一句话结论**：Vue2 用 defineProperty 递归改写属性，无法感知新增/删除属性和数组下标变化，所以需要 $set 并重写数组方法；Vue3 用 Proxy 拦截整个对象，天然覆盖这些操作，还能惰性递归、支持 Map/Set。

1. 新增与删除属性：defineProperty 只能劫持已存在的属性，所以 Vue2 必须提供 `Vue.set/Vue.delete` 并强制重渲染；Proxy 的 set/deleteProperty 直接拦截，无需特殊 API。
2. 数组：defineProperty 无法监听下标赋值与 length 变化（性能考虑也没全量劫持），Vue2 只能重写 push/pop/shift/unshift/splice/sort/reverse 七个方法；Proxy 可以直接拦截索引与 length 写入。
3. 初始化性能与内存：Vue2 在实例化时深度递归遍历所有属性并逐个生成 getter/setter，对象大时启动慢、内存高；Vue3 惰性代理，只在真正访问到嵌套对象时才创建它的 Proxy。
4. 数据类型的支持面：Proxy 能拦截 Map、Set、WeakMap、WeakSet 的读写（配合包装方法），Vue2 完全无法监听这些集合。
5. 代价与取舍：Proxy 无法 polyfill，IE11 彻底不支持（Vue3 因此放弃 IE）；高频访问的对象上代理有额外开销，所以提供 markRaw/shallowRef 等逃生通道。

**追问与易错点**：

- 陷阱：把"Proxy 性能一定比 defineProperty 好"当结论，准确说法是初始化/内存更优，单次属性访问略慢，Vue3 用惰性代理换总体收益。
- 追问：Vue3 里改对象属性还要 $set 吗？答：不需要，直接赋值即可触发更新；方法已移除。
- 追问：Vue3.4 之后响应式有什么变化？答：重写了依赖收集结构（双向链表替代数组 Set 的遍历开销），并优化了数组的触发粒度，能减少不必要的组件重渲染。

### Q25 Proxy 有哪些局限和坑？

**考察点**：考"能落地"的程度，重点是内部槽、私有字段、性能与不变量这几个真会踩的点。

**参考答案**：

> **一句话结论**：Proxy 不能 polyfill（IE 全不支持）、无法代替对象内部槽的行为、访问私有字段会失败、有稳定的性能开销，并且受不变量约束；它还是浅层代理，嵌套要自己递归。

1. 兼容性：Proxy 是引擎级能力，无法用 ES5 模拟，所以选它就意味着放弃 IE11。
2. 内部槽（internal slot）问题：Date、Map、Set、RegExp 等方法需要 this 是真正的内部实例，直接 `proxy.map.get()` 会报 "incompatible receiver"，必须在 get trap 里把方法绑定回 target。
3. 私有字段不可达：`#x` 只能被声明它的类实例访问，Proxy 不是该类的实例，访问会抛 TypeError，这是响应式系统无法透明处理 class 私有字段的根因。
4. 性能开销：每次属性访问/写入都要走一层函数调用与判断，热点循环里代理对象比普通对象明显慢；另外 `proxy !== target` 会破坏依赖相等性判断的逻辑。
5. 不变量与浅层性：trap 返回值必须与目标状态自洽（否则 TypeError）；代理只作用于当层对象，深层对象要访问时再递归代理或提前包装。

**追问与易错点**：

- 陷阱：以为代理数组后 `proxy.push()` 一定正常，某些实现细节下会因内部方法读写的 receiver 不对而出错，需要用 Reflect 传 receiver。
- 追问：Vue3 怎么解决 Map/Set 的代理问题？答：对集合类型用专门的 handler 包装读写方法，并在 get 时把方法重新绑定到响应式对象上。
- 追问：什么时候不该用 Proxy？答：只需要给少量已知属性加 getter/setter、或需要支持 IE、或超高频热路径时，用 defineProperty 更合适。

### Q26 Object.defineProperty 和 Proxy 有哪些区别？

**考察点**：经典对比题，要求给出可对照的维度而不是各讲一遍。

**参考答案**：

> **一句话结论**：defineProperty 是逐个属性改写描述符，只能拦读写、拦不到新增删除；Proxy 是给整个对象加一层操作拦截，能覆盖 13 类操作，但无法兼容 IE。

1. 拦截粒度：defineProperty 针对"某个属性"生成 getter/setter，必须知道属性名；Proxy 针对"整个对象"，属性名在 trap 里动态拿到。
2. 新增/删除：defineProperty 无法感知（新属性没有描述符），Proxy 的 set/deleteProperty 天然覆盖，这是 Vue2/Vue3 差异的核心。
3. 递归方式：defineProperty 必须初始化时深度遍历，Proxy 可以访问到才代理（惰性），大对象启动成本差别很大。
4. 兼容性与性能：defineProperty 兼容到 IE9，单属性访问接近原生速度；Proxy 不支持 IE，单次访问有 trap 开销，但支持更多拦截能力。
5. 能力补充：defineProperty 还能定义不可枚举、只读、不可配置属性，是纯粹的属性元信息工具；Proxy 侧重行为拦截，属性描述符要通过 trap 转发。

| 对比项 | Object.defineProperty | Proxy |
| --- | --- | --- |
| 拦截对象 | 单个属性 | 整个对象 |
| 新增/删除属性 | 不支持 | 支持 |
| 数组下标/length | 不支持 | 支持 |
| 递归时机 | 初始化深度遍历 | 按需惰性 |
| 兼容性 | IE9+ | 不支持 IE |
| 典型用途 | 属性元信息、兼容环境 | 响应式、校验、AOP、Mock |

**追问与易错点**：

- 陷阱：认为 defineProperty 已经过时，实际在定义只读/不可枚举属性、简单 getter/setter 场景它更轻、更快、兼容更好。
- 追问：Proxy 能完全替代 defineProperty 吗？答：不能，`Object.defineProperty` 定义属性特性的能力在 Proxy 里只能通过 trap 转发实现，二者是不同层次。
- 追问：Vue2 重写数组七个方法是必须的吗？答：在 defineProperty 方案下是必须的，因为下标赋值和 length 改动都监听不到。

### Q27 Reflect 是什么？为什么总是和 Proxy 一起出现？

**考察点**：考对 Reflect 设计意图的理解，能说出 receiver 与返回值语义就算过关。

**参考答案**：

> **一句话结论**：Reflect 是一套与 Proxy trap 一一对应的静态方法集合，用来在 trap 里执行"默认行为"；它提供正确的 receiver 和更合理的返回值语义，所以 Proxy 负责拦截、Reflect 负责转发，二者配套设计。

1. 方法对应：Reflect.get/set/has/deleteProperty/ownKeys/apply/construct/defineProperty... 与 13 个 trap 一一对应，写代理时几乎都能用同名的 Reflect 方法兜底。
2. receiver 的作用：`Reflect.get(target, key, receiver)` 会把 receiver 作为 getter 里的 this，从而在原型链继承场景下让依赖收集落在代理对象上；写成 `target[key]` 就会指向原始对象，Vue3 会因此丢依赖。
3. 返回值语义：`Reflect.defineProperty` 返回布尔值（失败不抛错），正好满足 trap 必须返回布尔的要求；而 `Object.defineProperty` 失败直接抛 TypeError。
4. 更规范的函数行为：`Reflect.apply(fn, thisArg, args)` 等价 call/apply 但更清晰，`Reflect.construct(Fn, args, NewTarget)` 可指定 new.target，`Reflect.has` 就是 in 运算符的函数形式。
5. 使用建议：写 trap 时默认用 Reflect 转发，只在需要特殊逻辑时改写返回值或做副作用。

```js
const handler = {
  get(target, key, receiver) {
    console.log('读取', String(key));
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver);
  }
};
```

**追问与易错点**：

- 陷阱：只知道 Reflect 是"新的 Object 方法集合"，说不出 receiver，就答不到 Vue3 依赖收集这一层。
- 追问：Reflect 和 Object 上的同名方法有什么区别？答：Reflect 返回值语义统一（返回布尔而不是抛错）、有 receiver 参数、不做隐式装箱，且与 Proxy trap 对齐。
- 追问：不用 Reflect 会怎样？答：简单场景能跑，但继承/getter/setter 场景容易因 this 指向错误出现难查的 bug。

### Q28 可选链 ?. 怎么用？有什么限制？

**考察点**：考短路语义与语法限制，很多人用过但说不清规则。

**参考答案**：

> **一句话结论**：可选链只在左侧是 null 或 undefined 时短路返回 undefined，其余情况正常访问；它有短路传播、不能用于赋值左侧、不能 new 三条硬限制。

1. 三种形式：属性访问 `obj?.a`、动态键 `obj?.[key]`、函数调用 `fn?.()`；三种可以任意串联，如 `res?.data?.list?.[0]`。
2. 短路传播：`a?.b.c` 中若 a 为空，整个表达式直接返回 undefined，后面的 `.c` 不会执行；因此不会因为链尾访问空对象而报错。
3. 与 `??` 搭配：`config?.server?.port ?? 3000` 是读取可选配置的标准写法，可选链负责不报错，空值合并负责给默认值。
4. 限制：不能出现在赋值左侧（`a?.b = 1` 是语法错误）、不能用于 new、不能删除可选属性；`document.querySelector('.x')?.remove()` 这类"调用前判空"是正确用法。
5. 编译产物：旧目标下 Babel 会展开成多层 `=== null || === void 0` 判断，链很长时增加体积，现代构建目标可直接保留原生语法。

```js
const user = { profile: null };
console.log(user?.profile?.name);        // undefined，不报错
console.log(user.profile?.name ?? '匿名'); // 匿名
// user?.profile = {};                    // SyntaxError
```

**追问与易错点**：

- 陷阱：以为可选链能兜住"属性存在但值是 0/''"，它只判断 null/undefined，其他假值照常返回，该用 `??` 才能给默认值。
- 追问：`a?.b()` 和 `a.b?.()` 有什么区别？答：前者判断 a 是否为空后正常调用 b，后者是 b 存在才调用；顺序写反会导致"方法不存在"时报错。
- 追问：可选链会让报错变少，是好事吗？答：过度使用会掩盖数据结构错误，只在数据确实可能缺失的边界用。

### Q29 ?? 和 || 有什么区别？

**考察点**：考空值合并的精确语义，这是业务里最容易写出 bug 的一组运算符。

**参考答案**：

> **一句话结论**：`??` 只在左侧是 null 或 undefined 时取右值，`||` 在左侧是任何假值（0、''、false、NaN）时都取右值，所以给数值或布尔值设默认值必须用 `??`。

1. 触发范围：`0 ?? 10` 得 0，`0 || 10` 得 10；分页 size、开关状态、计数为 0 时用 `||` 会静默变成默认值，这是最常见的一类线上 bug。
2. 语法限制：`??` 不能与 `&&`、`||` 直接混用而不加括号，`a ?? b || c` 是 SyntaxError，必须写 `(a ?? b) || c`，目的是强制表达优先级意图。
3. 短路求值：`??` 只在需要时求值右侧；`a ??= b` 也是短路赋值，右侧的副作用不会被执行。
4. 组合用法：可选链 + 空值合并覆盖了"深层可选配置 + 默认值"的全部需求，比 `a && a.b ? a.b : c` 清晰得多。
5. 适用判断：默认值语义是"缺失才补"用 `??`；是"假值都算无效"才用 `||`（例如把空字符串当没填）。

```js
const cfg = { retry: 0, name: '' };
cfg.retry ?? 3;   // 0，保留有效值
cfg.retry || 3;   // 3，把 0 当成了缺失
cfg.name ?? '默认'; // ''，只有 null/undefined 才补
```

**追问与易错点**：

- 陷阱：把 `??` 当"更安全的 ||"到处替换，如果业务语义本来就是"空字符串视为未填写"，用 `??` 反而漏了校验。
- 追问：`??` 和三元判断哪个好？答：语义等价时用 `??` 更短，且只对左值求值一次；涉及多个条件分支时三元更清晰。
- 追问：`a ?? b` 里 a 是 undeclared 变量会怎样？答：直接抛 ReferenceError，`??` 只处理 null/undefined，不处理未声明，除非用 `typeof a !== 'undefined'`。

### Q30 逻辑赋值运算符是什么？

**考察点**：考 `||= &&= ??=` 的短路语义与典型用途，很多人见过但没用对。

**参考答案**：

> **一句话结论**：`||=`、`&&=`、`??=` 是"先判断再决定是否赋值"的短路赋值运算符，右侧表达式只在需要赋值时才求值，本质是 `a || (a = b)` 而不是 `a = a || b`。

1. 语义对照：`a ||= b` 等价 `a || (a = b)`，a 为假值时赋 b；`a &&= b` 在 a 为真值时才赋 b；`a ??= b` 只在 a 为 null/undefined 时赋 b。
2. 短路价值：属性访问只求值一次，右侧函数调用/计算只在需要时执行，`cache[key] ||= compute(key)` 这种惰性缓存写法既短又不会多算。
3. 常用场景：给配置对象补默认值 `options ??= {}`、惰性初始化 `instance ||= create()`、条件累积 `obj.list &&= obj.list.filter(Boolean)`。
4. 与展开/assign 的区别：逻辑赋值是"有值就不动、没值才写"，展开是"后面的无条件覆盖前面的"，处理用户传入的部分配置时前者更合适。
5. 易错点：`a ||= b` 会在 a 为 0、''、false 时也赋值，要保留 0 或空串必须用 `??=`。

```js
const opts = { retry: 0, headers: null };
opts.retry ||= 3;     // 3，0 被当成假值
opts.headers ??= {};  // {}，只有 null/undefined 才补
opts.retry ??= 5;     // 3，已有值不动
```

**追问与易错点**：

- 陷阱：以为 `a ||= b` 就是 `a = a || b`，在 `a` 是 getter 或表达式时前者只读一次、后者读两次，行为可能不同。
- 追问：`??=` 能用在解构默认值上吗？答：不行，解构默认值只在 undefined 生效且语法不同，两者别混。
- 追问：这些运算符的兼容性如何？答：ES2021，现代浏览器与 Node 15+ 都支持；旧环境由 Babel 转译。

### Q31 Object.assign 和对象展开有什么区别？

**考察点**：考两者看似等价实则不同的关键点：是否触发 setter、是否修改目标对象。

**参考答案**：

> **一句话结论**：两者都是浅拷贝且都只处理自有可枚举属性（含 Symbol），区别是 Object.assign 把属性写进已有目标对象并触发其 setter、返回该对象，而展开生成新对象、以定义属性方式写入、不触发 setter。

1. 目标不同：`Object.assign(target, ...sources)` 修改并返回 target；`{ ...a, ...b }` 一定产生新对象，不会动 a、b。
2. setter 与原型：assign 用赋值语义，会命中目标及其原型链上的 setter（可能被拦截或抛错）；展开用 CreateDataProperty，直接定义自有属性，不触发 setter 也不查原型链。
3. 属性范围：都只复制自有可枚举属性（包括 Symbol 键），都不复制原型与不可枚举属性；源为 null/undefined 时都跳过不报错。
4. 数量与返回值：assign 可接任意多个源、可把多个对象合并到已有实例上；展开只能写在字面量里，但可读性更好、更少被误用。
5. 共同局限：都是浅拷贝，嵌套对象共享引用；深拷贝需要 structuredClone 或专门的递归实现。

```js
class User { set name(v) { this._n = v.toUpperCase(); } }
const u = new User();
Object.assign(u, { name: 'liu' }); // 走 setter，_n = 'LIU'
const plain = { ...{ name: 'liu' } }; // 直接得到属性
```

**追问与易错点**：

- 陷阱：用 `Object.assign(this.form, data)` 合并表单，结果命中了组件里的 setter 或把不该覆盖的字段清空，排查成本很高。
- 追问：`Object.assign({}, a, b)` 和 `{ ...a, ...b }` 完全等价吗？答：多数情况等价，前者会走 assign 的赋值语义（目标 `{}` 上没有 setter，通常无差异），后者更明确是新对象。
- 追问：想把属性合并进 Vue 的响应式对象用哪个？答：用赋值的写法（assign 或逐个赋值）才能触发更新，展开产生的新对象不会自动替换原引用。

### Q32 Object.entries、values 和 fromEntries 有什么用？

**考察点**：考三个 API 的组合使用能力，尤其是 fromEntries 作为逆操作的价值。

**参考答案**：

> **一句话结论**：keys/values/entries 把对象拆成数组以便用数组方法处理，fromEntries 是 entries 的逆操作，专门用于"过滤/转换后重建对象"。

1. 返回范围：三者都只返回自有可枚举的字符串键属性，不含原型链、不含不可枚举；Symbol 键要用 Object.getOwnPropertySymbols 单独取。
2. entries 的用途：遍历时同时拿键值 `for (const [k, v] of Object.entries(obj))`、转 Map `new Map(Object.entries(obj))`、把对象交给数组管道处理。
3. fromEntries 的用途：把 entries 数组或 Map 还原成对象；最实用的模式是"过滤后重建"，如剔除 null 字段再提交给接口。
4. 转换细节：fromEntries 的键会被转成字符串（Symbol 保留），重复键后者覆盖前者；`URLSearchParams` 可直接传给它生成查询参数对象。
5. 顺序：entries 的顺序与 for...in 类似，整数风格键会被提前并升序，依赖顺序的逻辑要改成数组结构。

```js
const raw = { a: 1, b: null, c: 3 };
const clean = Object.fromEntries(Object.entries(raw).filter(([, v]) => v != null));
// { a: 1, c: 3 }
const query = Object.fromEntries(new URLSearchParams('page=1&size=10'));
```

**追问与易错点**：

- 陷阱：以为 entries 能拿到不可枚举属性或 Symbol 键，实际都拿不到，需要 getOwnPropertyNames / getOwnPropertySymbols。
- 追问：对象转 Map 还有别的方法吗？答：可以 `new Map(Object.entries(obj))`，也可以先转 entries 再处理；键是对象时要注意引用相等。
- 追问：fromEntries 能做深拷贝吗？答：不能，只是重建一层对象，嵌套仍是共享引用。

### Q33 Object.hasOwn 和 hasOwnProperty、in 有什么区别？

**考察点**：考 ES2022 新 API 解决了什么老问题，属于小而常考的细节题。

**参考答案**：

> **一句话结论**：Object.hasOwn 判断"自有属性"且不受对象自身属性污染，`hasOwnProperty` 方法可能被对象覆盖或无原型时不存在，`in` 则会沿原型链查找。

1. 解决的坑：`obj.hasOwnProperty(k)` 在 `obj` 自定义了 hasOwnProperty 或由 `Object.create(null)` 创建时都会失败；旧写法要写很长的 `Object.prototype.hasOwnProperty.call(obj, k)`，Object.hasOwn 直接替代。
2. 与 in 的区别：`'toString' in {}` 是 true（原型链上有），`Object.hasOwn({}, 'toString')` 是 false；判断"自身是否有这个字段"必须用 hasOwn。
3. 与 getOwnPropertyNames 的区别：后者返回所有自有属性名（含不可枚举），hasOwn 只回答存在性，且不区分可枚举性——不可枚举的自有属性同样返回 true。
4. 适用场景：判断配置项是否显式传入（区分"没传"与"传了 undefined"）、合并对象时决定是否覆盖、避免原型污染带来的误判。
5. 兼容性：ES2022，Node 16.9+/现代浏览器；旧环境用 `Object.prototype.hasOwnProperty.call`。

```js
const cfg = { retry: undefined };
Object.hasOwn(cfg, 'retry');  // true，显式传了
cfg.retry !== undefined;      // false，值本身是 undefined
'retry' in cfg;               // true
```

**追问与易错点**：

- 陷阱：用 `if (obj.key)` 判断配置是否传入，无法区分"没传"和"传了 0/false/''"，涉及默认值合并时要用 hasOwn 或 `??`。
- 追问：`Object.hasOwn` 和 `Object.prototype.hasOwnProperty` 结果完全一样吗？答：对正常对象结果一致，前者额外解决了被遮蔽与无原型对象的异常。
- 追问：怎么判断一个 Symbol 属性是否存在？答：`Object.hasOwn(obj, sym)` 同样适用，键类型不限。

### Q34 Array.from 和 Array.of 分别解决什么问题？

**考察点**：考两个容易混淆的静态方法，重点看是否知道 Array.of 是为了修正 `new Array(n)` 的歧义。

**参考答案**：

> **一句话结论**：Array.from 把可迭代对象或类数组转成真数组（还支持映射函数），Array.of 用参数逐个构造数组，专门修正 `new Array(3)` 只得到长度 3 空数组的歧义。

1. Array.from 的输入：可迭代对象（Set、Map、字符串、NodeList、arguments）与类数组对象（有 length 与数字下标）都能转；有迭代器时优先走迭代器，忽略 length。
2. 第二个参数：`Array.from(list, fn, thisArg)` 等价于转换后再 map，但只遍历一次，少建一个中间数组；常用 `Array.from({ length: 3 }, (_, i) => i)` 生成序列。
3. 类数组的坑：`{ length: -1 }`、`{ length: 'abc' }` 会被当成长度 0，得到空数组，不会报错，容易静默出错。
4. Array.of：`Array.of(3)` 得到 `[3]`，`Array.of(1, 2, 3)` 得到 `[1,2,3]`；对比 `new Array(3)` 得到 `[empty × 3]` 长度数组，这是它存在的唯一理由。
5. 与展开的区别：`[...x]` 只支持可迭代对象，纯类数组（如自定义 `{0:'a',length:1}`）会抛 TypeError，此时必须用 Array.from。

```js
Array.from({ length: 3 }, (_, i) => i * 2); // [0, 2, 4]
Array.from(new Set([1, 1, 2]));             // [1, 2]
Array.of(3);                                // [3]
new Array(3);                               // [empty × 3]
```

**追问与易错点**：

- 陷阱：以为 Array.from 也能处理"只有 length 没有索引"的对象，其实会得到一堆 undefined，需要自己提供映射函数。
- 追问：Array.from 和 slice.call 有什么区别？答：Array.from 支持可迭代对象与映射函数，slice.call 只按 length 拷贝且语义不直观，新代码优先 from。
- 追问：为什么生成 0..n-1 用 `Array.from({length:n}, (_, i) => i)` 而不是 `new Array(n).fill(0).map(...)`？答：前者一次遍历且无需中转数组，后者多一次 fill 且中间产物占内存。

### Q35 includes、flat 和 flatMap 怎么用？和 indexOf、map 比呢？

**考察点**：考几个高频数组 API 的语义差别，重点看 NaN 与摊平层数两个细节。

**参考答案**：

> **一句话结论**：includes 用 SameValueZero 判等所以能找到 NaN 并直接返回布尔，flat 按深度摊平数组（默认 1 层），flatMap 等于 map 后再 flat(1) 但只摊一层。

1. includes vs indexOf：includes 返回布尔、能正确判断 NaN；indexOf 用严格相等、找不到 NaN，且还要写 `!== -1`。要下标用 indexOf/findIndex，要存在性用 includes。
2. flat：`[1,[2,[3]]].flat()` 得 `[1,2,[3]]`，传 Infinity 全部摊平；它会移除数组空槽（holes），也不改变原数组。
3. flatMap：先 map 再用一层 flat 合并，常用于"一对一映射后可能产生空数组"的场景，比 `arr.map(f).flat()` 少一次遍历与中间数组。
4. 常见用途：树形结构拍平成列表（配合递归或 flat(Infinity)）、标签数组展开、把可选字段的空结果自动过滤（映射返回 [] 即可被摊掉）。
5. 限制：flat 只能摊平数组元素，不能摊平字符串；flat 的深度需要显式指定，深层结构用 Infinity 时注意数据规模与性能。

```js
[1, 2, NaN].includes(NaN);            // true
[1, 2, NaN].indexOf(NaN);             // -1
[1, [2, [3, [4]]]].flat(2);           // [1, 2, 3, [4]]
['a b', 'c'].flatMap(s => s.split(' ')); // ['a', 'b', 'c']
```

**追问与易错点**：

- 陷阱：用 `arr.indexOf(x) !== -1` 判断包含，遇到 NaN 永远返回 false；数组里可能有 NaN 时（如聚合计算）必须用 includes。
- 追问：flatMap 和 `map().flat()` 性能差多少？答：flatMap 少一次数组遍历与中间数组分配，数据量大时更优，语义也更明确。
- 追问：怎么拍平任意深度的树？答：扁平数组用 `flat(Infinity)`，嵌套对象树得手写递归或迭代，flat 对对象数组无能为力。

### Q36 Array.prototype.at 和用下标取最后一个元素有什么区别？

**考察点**：考一个现代但很实用的小 API，顺带考"JS 数组其实是对象"这个底层认知。

**参考答案**：

> **一句话结论**：at 支持负索引，`arr.at(-1)` 就是最后一个元素，比 `arr[arr.length - 1]` 更短更不易写错，而且越界时统一返回 undefined 而不抛错。

1. 为什么不能写 `arr[-1]`：数组是对象，`-1` 只是一个普通字符串属性名，访问不到元素，得到 undefined；这也是很多新手 bug 的来源。
2. 支持范围：Array、String、TypedArray 都有 at；`'abc'.at(-1)` 得到 'c'。
3. 边界行为：空数组 `[].at(-1)` 返回 undefined，`[].at(0)` 也是 undefined，不会报错；相比手写 `arr[arr.length-1]` 在空数组时得到的也是 undefined，但 at 表达意图更清晰。
4. 对比其他取尾元素写法：`arr.slice(-1)[0]` 会创建新数组（多余开销），`arr.pop()` 会改原数组，都不如 at 合适。
5. 兼容性：ES2022，Node 16.6+/现代浏览器；需要兼容旧环境时用 polyfill 或退回 `arr[arr.length-1]`。

```js
const list = [1, 2, 3];
list.at(-1);          // 3
list.at(-2);          // 2
list[list.length - 1]; // 3，传统写法
list[-1];             // undefined
```

**追问与易错点**：

- 陷阱：以为 `arr.at(-1) = 5` 能赋值，at 只是读取方法，赋值仍要用下标或 splice。
- 追问：at 和 charAt 有什么区别？答：字符串的 at 支持负索引且返回单个字符，charAt 只接受非负整数下标，越界返回空字符串。
- 追问：为什么不用 `arr.slice(-1)[0]`？答：它每次都会创建一个新数组，循环里用会有额外内存与 GC 压力。

### Q37 Array.prototype.group 和 Object.groupBy 有什么关系？

**考察点**：考新提案的最终形态与返回 null 原型对象这一关键坑，属于加分题。

**参考答案**：

> **一句话结论**：分组提案最初叫 `Array.prototype.group`，最终以静态方法 `Object.groupBy` 与 `Map.groupBy` 进入 ES2024，返回的是 null 原型对象，所以不能用它调用 hasOwnProperty。

1. 名称演变：提案在 Stage 3 期间由实例方法改为静态方法，避免与第三方库（如 lodash、Array.prototype.group 的历史用法）冲突，也可同时提供 Map 版本。
2. 基本用法：`Object.groupBy(list, fn)` 里 fn 返回的 key 决定分组，值是元素数组，等价于手写 reduce 累加。
3. 关键差异：Object.groupBy 的返回对象没有原型（`Object.getPrototypeOf(r) === null`），因此 `r.hasOwnProperty` 不存在，要用 `Object.hasOwn(r, k)` 或展开成普通对象；key 会被转成字符串，对象 key 会变 "[object Object]"。
4. Map.groupBy：返回 Map，key 可以是任意类型（对象、函数都行），需要保留原 key 类型时用它。
5. 兼容性：Chrome 117+、Node 21+、TypeScript 5.4+ 有类型；旧环境要手写或引 polyfill（core-js）。

```js
const list = [1, 2, 3, 4, 5];
const odd = Object.groupBy(list, n => (n % 2 ? 'odd' : 'even'));
// { odd: [1,3,5], even: [2,4] }
const byRef = Map.groupBy(list, n => (n > 3 ? 'big' : 'small'));
```

**追问与易错点**：

- 陷阱：对结果直接调用 `r.hasOwnProperty('odd')` 会报错，因为 null 原型对象上没有这个方法。
- 追问：和 lodash 的 groupBy 有什么区别？答：结果形状类似都是对象或 Map，lodash 返回普通对象且 key 一定被转字符串，原生版本多了 Map.groupBy 与 null 原型这两个差异。
- 追问：不用新 API 怎么写分组？答：`arr.reduce((acc, x) => ((acc[k(x)] ??= []).push(x), acc), {})`，这是最常见的替代写法。

### Q38 ESM 和 CommonJS 有哪些核心差异？

**考察点**：模块化必考题，要求按"语法与时机、导出语义、运行环境"三条线讲清楚而不是零散列举。

**参考答案**：

> **一句话结论**：ESM 是静态的、编译期就能确定依赖图的官方标准，导出的是实时绑定；CommonJS 是运行时同步 require 的社区方案，导出的是值的快照。

1. 静态 vs 动态：ESM 的 import/export 只能在顶层且路径必须是字符串字面量，打包器不执行代码就能分析依赖图；CJS 的 require 是普通函数调用，可以写在 if 里、可拼路径，运行时才解析。
2. 值引用 vs 值拷贝：ESM 导出绑定引用（live binding），导出方变量变化导入方能看到，但导入的绑定是只读的；CJS 的 `module.exports` 是对象快照，解构出来就与源断开。
3. 加载与执行：ESM 是"先解析整个依赖图，再按深度优先求值"，浏览器里通过 `<script type="module">` 异步获取、天然延迟执行；CJS 是同步 require，边解析边执行，适合服务端文件读取。
4. 顶层 this 与严格模式：ESM 顶层 this 是 undefined 且自动严格模式，CJS 顶层 this 是 module.exports、默认非严格，还有 __dirname/__filename。
5. 互操作：Node 里 ESM 可以 import CJS（默认导出即 module.exports），CJS 要加载 ESM 需要 Node 22+ 的 `require(esm)` 或改用动态 `import()`；浏览器不支持 CJS。

| 对比项 | ESM | CommonJS |
| --- | --- | --- |
| 语法 | import / export | require / module.exports |
| 解析时机 | 编译期静态 | 运行时动态 |
| 导出内容 | 实时绑定（引用） | 值的快照 |
| 加载方式 | 依赖图 + 异步获取 | 同步 require |
| 顶层 this | undefined | module.exports |
| 严格模式 | 自动开启 | 需 'use strict' |

**追问与易错点**：

- 陷阱：说"ESM 是异步的所以更慢"，准确说法是模块图解析与获取阶段可并行，执行仍是按顺序深度优先，加载性能通常更优。
- 追问：Vite 为什么开发环境比 webpack 快？答：开发时利用浏览器原生 ESM 按需请求模块，省去了先打包全量 bundle 的过程，依赖预构建只处理 node_modules。
- 追问：为什么说 ESM 更利于 tree-shaking？答：静态结构让打包器能确定哪些导出没有被引用，这是 CJS 做不到的。

### Q39 为什么 ESM 的导入能看到导出方的变量变化，CJS 却看不到？

**考察点**：考 live binding 与值拷贝的差别，是需要举代码才能讲清的一题。

**参考答案**：

> **一句话结论**：ESM 的导入是导出变量的"实时绑定"（同一个绑定的只读视图），CJS 的导入是执行 require 那一刻的"值拷贝"，所以导出方后续变化在两种模块下表现完全不同。

1. ESM 的行为：`export let n = 0` 后内部 `n++`，导入方读到的就是新值，因为它读的是同一个绑定；但导入方不能给 n 赋值，会抛 TypeError（导入绑定只读）。
2. CJS 的行为：`const { count } = require('./c')` 在 require 时就完成了属性读取与拷贝，之后导出方 `exports.count++` 与导入方无关。
3. CJS 的例外：如果写成 `const c = require('./c')` 再访问 `c.count`，读的是同一个 exports 对象的属性，能看到更新——前提是导出方没有整体替换 exports。
4. CJS 失效的另一种情况：导出方执行 `module.exports = {...}` 整体替换后，之前 require 拿到的旧对象引用不会更新，后续访问仍是旧值。
5. 实践建议：CJS 里需要"实时值"要么统一用对象属性访问，要么导出 getter 函数（如 `exports.getCount = () => count`），不要依赖解构。

```js
// counter.js (CJS)
let count = 0;
exports.count = count;
setTimeout(() => { count++; exports.count = count; }, 10);
// main.js
const { count } = require('./counter'); // 0，永远是 0
```

**追问与易错点**：

- 陷阱：以为 CJS 的 require 结果"就像 import 一样是引用"，解构之后就断了，这是实际项目里出现"配置改了没生效"的常见原因。
- 追问：ESM 导入绑定能修改对象的属性吗？答：可以，只读的是绑定本身，`import { obj }` 后 `obj.x = 1` 合法，`obj = {}` 报错。
- 追问：Babel 转成 CJS 后还有 live binding 吗？答：Babel 用 `_cjs` 形式的 getter 或 `exports.xxx = ...` 重写来模拟，语义基本保留，但边界场景可能与原生不同。

### Q40 循环依赖在 ESM 和 CommonJS 里分别会怎样？

**考察点**：进阶题，考对模块求值顺序的理解，能说出"部分导出 + TDZ"就到位。

**参考答案**：

> **一句话结论**：CJS 在循环依赖时会返回"尚未执行完的 exports"（可能缺字段得 undefined），ESM 因为先建完整依赖图、且有函数声明提升与绑定引用，表现更可预测，但访问未初始化的 const/let 会抛 TDZ 错误。

1. CJS 机制：a 执行到 require('./b') 时，b 又 require('./a')，此刻 a 的 module.exports 还是半成品，b 拿到的可能是空对象；把 require 挪到函数体内延迟执行就能拿到完整对象，所以 CJS 循环依赖的成败取决于 require 时机。
2. ESM 机制：规范会先完整解析依赖图再求值，循环中的模块会拿到另一个模块的"未初始化绑定"，等对方求值完成后绑定就会填上值。
3. ESM 相对优势：`export function` 会被提升，循环依赖里通常可以直接调用；`export const` 在其模块体执行到那一行之前访问会抛 `ReferenceError: Cannot access 'x' before initialization`。
4. 共同结论：两种方案都只是"能跑"，语义脆弱且难维护，正确做法是消除循环依赖——抽公共模块、依赖注入、事件解耦、把 require/import 下沉到使用处。
5. 排查信号：打包后出现 `Cannot access before initialization`、某个导入是 undefined、或"模块顺序一改就好"，大概率是循环依赖。

**追问与易错点**：

- 陷阱：以为 ESM 完全不会有循环依赖问题，实际只是把 undefined 换成了 TDZ 报错或延迟绑定，设计问题依然存在。
- 追问：Vue/Vite 项目里循环依赖常见吗？答：store 之间互相 import、组件互相引用、工具文件与常量文件互引都可能形成环，可用依赖图工具（如 madge）扫描。
- 追问：Babel 转 CJS 后循环依赖行为变了吗？答：会变，转译后的执行顺序与 import 提升语义有差异，这也是"本地正常、打包后报错"的常见来源。

### Q41 export default 和具名导出有哪些坑？

**考察点**：考工程实践层面的判断，重点是 default 的命名自由、tree-shaking 不友好、以及"default 不是 live binding"这个冷门点。

**参考答案**：

> **一句话结论**：default 本质上是一个名叫 `default` 的导出，导入方可任意改名导致命名不一致；`export default 表达式` 导出的是值快照而不是实时绑定，并且对 tree-shaking 不友好。

1. 命名自由与一致性：`import anything from './x'` 让每个人写法都不同，重构和全局搜索困难；具名导出强制导入方使用同一名字，配合编辑器的自动导入更稳。
2. 冷门坑：`let a = 1; export default a; a = 2;` 导入方永远是 1，因为 default 导出的是表达式的值；想保留实时绑定要写 `export { a as default }`。
3. tree-shaking：具名导出能被静态分析到具体名字，未被引用的导出可直接删除；`export default { a, b, c }` 这种大对象无法追踪属性使用，整个对象都会被保留。
4. 互操作坑：CJS 与 ESM 混用时，Babel 的 `_interopRequireDefault` 可能让 `require` 结果多一层 `.default`，出现"模块导出对象本身也有 default 属性"的双层嵌套问题。
5. 实践建议：工具库/工具函数用具名导出，方便摇树与按需引入；组件文件团队内统一（Vue 单文件组件常用 default），不要在同一个文件里混用两种风格导出多个东西。

```js
// 不推荐（值快照 + 摇不动树）
export default { add, sub };
// 推荐
export { add, sub };
// 需要实时绑定的 default
let n = 0;
export { n as default };
```

**追问与易错点**：

- 陷阱：以为 `export default` 也享受实时绑定，实测会发现导出方改值后导入方不变，这是规范里 default 表达式导出与 `as default` 导出的差别。
- 追问：`import x, { y } from './m'` 合法吗？答：合法，default 与具名可以一起导入；`import { default as x }` 也是等价写法。
- 追问：具名导出重名怎么办？答：导入时用 `as` 重命名，或调整模块职责拆分，不要靠 default 规避命名冲突。

### Q42 动态 import() 和静态 import 有什么区别？怎么做代码分割？

**考察点**：考按需加载的实现方式，能不能说出"动态 import 是天然的代码分割点"。

**参考答案**：

> **一句话结论**：静态 import 在编译期确定依赖、会被打进当前产物且提升到顶部；动态 `import()` 是返回 Promise 的运行时调用，可以在任意位置按条件执行，打包器会把目标拆成独立 chunk 按需加载。

1. 语法与时机：`import('./x')` 看起来像函数但是运算符，返回 Promise，resolve 出模块命名空间对象；可以写在 if、事件回调、函数体里，路径可以用变量拼接。
2. 代码分割：打包器遇到动态 import 就创建一个新的 chunk，只有运行时才请求对应文件，因此首屏体积下降、加载按需发生。
3. 典型场景：路由懒加载 `component: () => import('./views/Home.vue')`、弹窗/富文本编辑器等大组件按需加载、按语言或环境加载不同实现、条件加载 polyfill。
4. 打包器的静态分析：webpack 与 Vite 都会解析参数，`import(\`./views/${name}.vue\`)` 需要能推断出候选范围才能正确分割；完全动态的路径无法分析，Vite 里更推荐 `import.meta.glob`。
5. 注意事项：加载失败要 try/catch 或给路由配 loading/error 态；同一路径重复 import 不会重复下载（模块实例被缓存）；打包产物的 chunk 命名与 CDN 缓存策略要一起考虑。

```js
const routes = [
  { path: '/home', component: () => import('./views/Home.vue') },
  { path: '/admin', component: () => import('./views/Admin.vue') }
];
const mod = await import('./editor.js');
mod.createEditor();
```

**追问与易错点**：

- 陷阱：把动态 import 当同步用，忘记 await 或 .then，拿到的是 Promise 而不是模块，报"xxx is not a function"。
- 追问：动态 import 的模块是深拷贝吗？答：不是，返回的是模块命名空间对象（只读绑定），多次导入是同一个实例。
- 追问：懒加载一定更好吗？答：不是，切得太碎会增加请求数与瀑布式加载，首屏关键路径的代码不该懒加载。

### Q43 import.meta 是什么？和 __dirname 有什么关系？

**考察点**：考 ESM 的模块元信息，顺带考构建工具注入的非标准属性。

**参考答案**：

> **一句话结论**：import.meta 是 ESM 模块内的元信息对象，标准属性只有 import.meta.url（当前模块的 URL），用来替代 CJS 的 __filename/__dirname；构建工具还会往上挂 env、hot、glob 等自定义属性。

1. 标准能力：`import.meta.url` 是当前模块的完整 URL；`new URL('./assets/logo.png', import.meta.url)` 是浏览器与 Node 里都通用的资源定位写法。
2. 只存在于 ESM：在 CJS 或普通脚本里写 import.meta 是语法错误；Node 的 ESM 里 `import.meta.dirname`/`filename`（较新版本）提供了 __dirname 的等价物。
3. 构建工具扩展：Vite 注入 `import.meta.env`（MODE、DEV、PROD、BASE_URL 以及 VITE_ 前缀的自定义变量），`import.meta.hot` 提供 HMR API，`import.meta.glob` 用于批量导入目录文件；这些都是非标准属性，浏览器原生没有。
4. 动态资源路径：拼接不同环境的后端地址、按当前模块位置引用静态资源时，用 import.meta.url 比相对路径字符串更可靠。
5. 注意点：`import.meta.env.VITE_XXX` 只在构建时被静态替换，运行时拼接的 key 拿不到；敏感信息不要放进去，因为会打进前端产物。

```js
const logo = new URL('../assets/logo.png', import.meta.url).href;
if (import.meta.env.DEV) console.log('开发环境', import.meta.env.MODE);
const modules = import.meta.glob('./views/*.vue');
```

**追问与易错点**：

- 陷阱：在 CJS 项目里写 import.meta，直接语法错误；反过来在 ESM 里用 __dirname 会 ReferenceError。
- 追问：import.meta.url 是什么协议？答：浏览器里是 http(s) 的模块地址，Vite 开发态是 http、Node 里是 file:// URL，用它拼路径时注意跨协议差异。
- 追问：import.meta.env 里能放密钥吗？答：不能，构建时会内联进 JS 产物，任何用户都能读到。

### Q44 tree-shaking 的原理是什么？为什么只有 ESM 能摇？

**考察点**：考打包优化原理，必须点出"静态分析 + 副作用声明"两个前提。

**参考答案**：

> **一句话结论**：tree-shaking 是打包器基于 ESM 静态结构做的死代码消除：先建模块图，标记被引用的导出，删掉没人用的导出与模块；CJS 因为 require 是运行时行为、导出可动态赋值，无法可靠分析。

1. 为什么必须是 ESM：import/export 只能在顶层、模块路径与导出名都是静态的字符串，打包器不执行代码就能确定"谁引用了谁"；CJS 的 `module.exports` 可以条件赋值、require 可以拼路径，只能保守处理。
2. 生效链路：解析模块图 → 标记（mark）可达导出 → 摇树删除未引用导出 → 压缩阶段（Terser/esbuild）继续做 DCE 与变量内联。生产模式必须开启压缩，否则只是标记了没删。
3. 副作用是关键：模块顶层只要执行了有副作用的代码（注册全局、改原型、注入样式），打包器不敢删，所以 package.json 用 `"sideEffects": false` 声明"无副作用"，或列出 CSS 等有副作用的文件数组。
4. 破坏 tree-shaking 的写法：把一堆东西塞进默认导出的大对象、用动态属性访问 `obj[key]`、`import * as ns` 后整体使用、模块顶层直接跑副作用、被转译回 CJS、把库整包 require 进来。
5. 库作者要做的事：提供 ESM 产物（module 字段或 exports map 的 import 条件）、正确声明 sideEffects、尽量用具名导出与纯函数。

```json
{
  "name": "my-ui",
  "module": "es/index.js",
  "sideEffects": ["*.css", "./es/style/*"]
}
```

**追问与易错点**：

- 陷阱：以为写了 `"sideEffects": false` 就一定摇得干净，如果代码被转成 CJS 或整体导入，照样全量打包。
- 追问：`import { Button } from 'ui'` 为什么有时还是把所有组件打进去？答：入口文件里 import 了全部组件并统一导出，且没有副作用声明或用了 CJS 入口，导致无法静态裁剪。
- 追问：Vue 组件的 scoped 样式会被摇掉吗？答：样式属于副作用，必须在 sideEffects 里列出，否则可能被误删。

### Q45 模块顶层的 this 是什么？严格模式有什么影响？

**考察点**：考 this 在不同模块体系与脚本下的差异，顺带考严格模式的典型改变，容易答混。

**参考答案**：

> **一句话结论**：ESM 顶层 this 是 undefined（模块代码自动处于严格模式），CJS 顶层 this 是 module.exports，普通 script 顶层 this 是 window/globalThis。

1. 三种环境的对照：浏览器普通 `<script>` 顶层 this 指向 window；CJS 模块里 `this === module.exports`（初始是空对象）；ESM 里 this 为 undefined，写成 `this.xxx = 1` 会直接 TypeError。
2. 严格模式来源：ESM 无需 `'use strict'` 即自动严格；class 体内的方法与字段初始化也自动严格；CJS 与普通脚本默认非严格。
3. 严格模式的主要变化：独立函数调用的 this 是 undefined（非严格是全局对象）、未声明变量赋值报错、禁止 delete 变量/函数、arguments 不与形参联动、禁止重复形参名、禁止 with、八进制字面量报错。
4. 实践影响：迁移到 ESM 后原来用 `this` 判断环境或挂全局变量的代码会失效，应改用 `typeof window !== 'undefined'`、globalThis 或显式导入。
5. 判断工具：`globalThis` 是跨环境获取全局对象的统一方式，比 `window`/`self`/`global` 逐个判断更可靠。

```js
// ESM 模块顶层
console.log(this);              // undefined
console.log(typeof this);       // 'undefined'
globalThis.appConfig = {};      // 想挂全局用 globalThis
```

**追问与易错点**：

- 陷阱：把 CJS 里 `this.xxx = 1` 的写法搬到 ESM，运行时抛 "Cannot set property of undefined"，报错信息不够直观，需要知道顶层 this 是 undefined。
- 追问：普通脚本加 `'use strict'` 后 this 变了吗？答：顶层 this 在脚本里仍是全局对象，变化的是函数内部独立调用的 this。
- 追问：UMD 里为什么到处判断 typeof window？答：为了同时兼容浏览器、Node、AMD 环境，说明作者无法假定顶层 this 是什么。

### Q46 正则有哪些 ES6+ 新特性？

**考察点**：考具名捕获组、环视、d 标志、u/v 标志这些实际会用到的能力，属加分题。

**参考答案**：

> **一句话结论**：ES2018 起正则陆续加入了具名捕获组、后行断言、dotAll 与 Unicode 属性转义，ES2022 加了记录匹配位置的 d 标志，ES2024 的 v 标志支持集合运算。

1. 具名捕获组（ES2018）：`(?<year>\d{4})` 用 `match.groups.year` 取值，替换串里用 `$<year>`，反向引用 `\k<year>`；比按数字下标取值更抗修改。
2. 环视断言：后行断言 `(?<=...)` 与否定后行 `(?<!...)` 匹配"前面是/不是某内容"但不消耗字符，与先行断言 `(?=...)`、`(?!...)` 合称环视（lookaround）。
3. d 标志（ES2022）：开启 hasIndices，`match.indices` 给出每个捕获组的起止下标（含 `indices.groups`），用于高亮命中位置；`symbols` 计划已撤回，不要答。
4. 其他标志：s（dotAll）让 `.` 匹配换行；u 处理 Unicode 码点；v（ES2024）在 u 基础上支持集合运算 `[[a-z]&&[^aeiou]]` 与更细的属性匹配；`String.prototype.matchAll` 可一次拿到所有匹配的迭代器（必须带 g 标志）。
5. 选择建议：优先用具名捕获组 + matchAll 替代循环 exec，可读性和正确性都更好。

```js
const re = /(?<y>\d{4})-(?<m>\d{2})/d;
const m = re.exec('2024-06-16');
console.log(m.groups.y, m.indices[0]); // '2024' [0, 4]
/(?<=￥)\d+/.exec('价格￥99');          // 匹配到 '99'
```

**追问与易错点**：

- 陷阱：把 `(?<=...)` 当消耗字符用，导致后续匹配从断言内容之后开始，位置对不上；断言只做条件判断、不移动游标。
- 追问：`g` 标志下多次调用 `re.test()` 为什么结果忽真忽假？答：正则对象带 lastIndex 状态，连续 test/exec 会从上次位置继续；要么重置 `re.lastIndex = 0`，要么每次新建正则或用 matchAll。
- 追问：`\d` 能匹配全角数字吗？答：不能，需要 Unicode 属性转义 `\p{Nd}` 配合 u/v 标志。

### Q47 String.prototype.replaceAll 和 replace 有什么区别？

**考察点**：考一个很容易踩坑的新 API，重点是"传正则必须带 g"这条硬规则。

**参考答案**：

> **一句话结论**：replaceAll 替换所有匹配（传字符串时也是全部替换），但第一个参数是正则时必须带 g 标志，否则直接抛 TypeError，这是它与 replace 最大的行为差异。

1. 与 replace 的差异：`'aaa'.replace('a', 'b')` 只替换第一个，`'aaa'.replaceAll('a', 'b')` 全部替换；不用再写 `/a/g` 或 split/join。
2. 强制 g 标志：`'abc'.replaceAll(/b/, 'x')` 抛 TypeError: replaceAll must be called with a global RegExp，这个设计是为了避免"以为是全部替换却只换了一处"的静默错误。
3. 替换内容：第二个参数可以是字符串或函数；字符串里支持 `$&`（整个匹配）、`$<name>`（具名捕获组）、`$'`（匹配之后的部分）等模式，要插入字面量 `$` 用 `$$`。
4. 字符串参数不做正则解析：`replaceAll('.', '-')` 只替换真正的点号，不用转义，这是它比正则方案更安全的地方。
5. 兼容性：ES2021（Chrome 85+、Node 15+）；旧环境用 `split(sep).join(repl)` 或全局正则兜底，注意 split/join 对特殊字符的处理差异。

```js
'2024-06-16'.replaceAll('-', '/');           // '2024/06/16'
'a-b-c'.replace(/-/g, '_');                  // 'a_b_c'
'id=3'.replaceAll(/(\d+)/g, '[$1]');         // 'id=[3]'
// 'id=3'.replaceAll(/(\d+)/, '[$1]');       // TypeError
```

**追问与易错点**：

- 陷阱：把 replaceAll 的第一个参数写成不带 g 的正则，运行时报错才发现；写代码时正则字面量后面固定加 g。
- 追问：replaceAll 性能比正则差吗？答：字符串参数时引擎会走优化的快速路径，通常不慢；只有复杂模式才需要正则。
- 追问：替换串里的 `$` 怎么处理？答：用户输入当替换串时要先把 `$` 转义成 `$$`，否则会触发替换模式导致注入意外内容。

### Q48 Promise.any、all、allSettled、race 怎么区分？

**考察点**：考四个组合器的语义差别与选择依据，是必考的并发控制题。

**参考答案**：

> **一句话结论**：all 要求全部成功（一个失败就整体失败），allSettled 永远成功并返回每个结果的状态，any 取最先成功的（全失败才失败），race 取最先敲定的（无论成功失败）。

1. Promise.all：任一 reject 立刻 reject，其他结果拿不到（但请求本身仍在跑），适合"缺一不可"的依赖收集。传入空数组会立刻 resolve 成空数组。
2. Promise.allSettled（ES2020）：永远 resolve，返回 `{ status: 'fulfilled'|'rejected', value|reason }` 数组，适合批量请求、报表、清理任务这类"谁坏都不影响整体"的场景。
3. Promise.any（ES2021）：任意一个 fulfilled 就 resolve 该值；全部 rejected 才 reject，并抛出 AggregateError，其 errors 属性保存全部失败原因。
4. Promise.race：第一个 settle（成功或失败）就决定，最常用于超时控制：把业务请求和定时器 reject 一起 race。
5. 选择口诀：全都要 → all；全都要但不中断 → allSettled；要最快的成功 → any；要最快的结果（含失败）→ race。

```js
// 超时控制
const timeout = (p, ms) => Promise.race([
  p,
  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
]);
const first = await Promise.any([fetchA(), fetchB()]);
```

**追问与易错点**：

- 陷阱：把 any 当成"任意一个结束"用，实际它忽略失败、只等成功，全失败才报错；要"最快结束"必须用 race。
- 追问：AggregateError 怎么取所有原因？答：`err.errors` 是数组，也支持 `for...of` 迭代；它是 Error 的子类，message 通常为 "All promises were rejected"。
- 追问：all 里某个失败后其他请求会取消吗？答：不会自动取消，原生 Promise 没有取消能力，需要 AbortController 配合。

### Q49 Error.cause 解决了什么问题？

**考察点**：考错误链的保留，属于实践中很实用但很多人没用过的新特性。

**参考答案**：

> **一句话结论**：ES2022 允许 `new Error(message, { cause })` 把底层错误挂在 cause 上，包装抛出时不丢原始堆栈与类型，便于日志与排查。

1. 没有 cause 时的老问题：只能把原错误拼进 message 字符串（丢失堆栈与类型）或用自定义属性 `err.original = e`（不成规范、序列化与工具链不认）。
2. 用法：catch 到原始错误后抛出新错误并带上 cause，或在 Promise.reject 时传入；cause 可以是任意值，不限于 Error。
3. 排查价值：日志系统可递归打印 cause 链（如 "读取用户失败 → 网络超时 → ECONNRESET"），能一眼看到根因而不是只看最外层信息。
4. 注意点：Error 的 message/stack/cause 都是不可枚举属性，`JSON.stringify(err)` 得到空对象 `{}`，上报日志要手动提取字段。
5. 兼容性：Node 16.9+、现代浏览器、TypeScript 需 `lib: ES2022` 才有类型定义。

```js
async function loadUser(id) {
  try {
    return await fetch(`/api/user/${id}`);
  } catch (e) {
    throw new Error(`加载用户失败: ${id}`, { cause: e }); // 保留根因
  }
}
```

**追问与易错点**：

- 陷阱：包装错误时直接 `throw new Error(e.message)`，堆栈与错误类型全丢了，排查时只能看到最外层的假堆栈。
- 追问：怎么在全局捕获里打出完整链路？答：`window.onerror`/`unhandledrejection` 或 Sentry 里遍历 cause 逐层拼接与上报。
- 追问：自定义错误类怎么写？答：`class BizError extends Error { constructor(m, opts) { super(m, opts); this.name = 'BizError'; } }`，注意继承内置类时原型与 name 要手动设置。

### Q50 structuredClone 和 JSON 深拷贝有什么区别？

**考察点**：考原生深拷贝的能力边界，能说清"支持什么、不支持什么"即可。

**参考答案**：

> **一句话结论**：structuredClone 是原生深拷贝，能正确处理循环引用、Date、RegExp、Map、Set、TypedArray，JSON 方案会丢类型、丢 undefined/函数、遇循环引用直接报错；但 structuredClone 不保留原型与类方法，也不支持函数和 DOM 节点。

1. 支持的数据：对象、数组、Date、RegExp、Map、Set、ArrayBuffer/TypedArray、Blob/File、Error 等，并且能处理循环引用（内部维护引用映射）。
2. JSON 方案的问题：Date 变字符串、undefined 与函数被丢弃、NaN/Infinity 变 null、Symbol 键丢失、循环引用抛 TypeError；好处是简单且能顺带序列化。
3. structuredClone 的局限：函数、DOM 节点、Symbol 作为值（会抛 DataCloneError）；不保留原型链，class 实例会退化成普通对象、方法丢失；getter/setter 会被求值成普通属性值。
4. transfer 选项：`structuredClone(obj, { transfer: [buffer] })` 可转移 ArrayBuffer 所有权（零拷贝移动），转移后原 buffer 不可再用，适合把大缓冲区交给 Worker。
5. 选型建议：纯数据结构用 structuredClone；必须保留类实例原型或需要自定义拷贝逻辑时用 lodash.cloneDeep 或手写 copy 方法。

```js
const src = { d: new Date(), m: new Map([[1, { n: 1 }]]), self: null };
src.self = src; // 循环引用
const copy = structuredClone(src); // 正常，JSON 方案会抛错
```

**追问与易错点**：

- 陷阱：以为 structuredClone 是"完美的深拷贝"，用它拷贝 Vue 响应式对象或 class 实例后发现方法没了、响应式丢了。
- 追问：能拷贝 Proxy 吗？答：不能，Proxy 属于不可克隆对象，调用会直接抛 DataCloneError；Vue 里必须先 toRaw 再克隆。
- 追问：structuredClone 和 postMessage 的关系？答：它用的就是结构化克隆算法，与 Worker/postMessage 的数据传输规则一致，所以能拷的东西与能传的东西相同。

### Q51 Intl 有哪些常用能力？

**考察点**：考国际化内置 API 的覆盖度，能说出三四个构造器与一个实际场景就够。

**参考答案**：

> **一句话结论**：Intl 是内置的国际化 API 集合，覆盖数字/货币格式化、日期时间格式化与时区、相对时间、列表连接、本地化排序与分词，用它就不用自己写一套本地化逻辑。

1. Intl.NumberFormat：千分位、货币、百分比、单位、紧凑记数法（compact 可输出 "1.2万" 这类缩写），电商价格与数据看板必备。
2. Intl.DateTimeFormat：按 locale 与 timeZone 格式化日期时间；服务端统一存 UTC、前端按用户时区展示时用它比手拼字符串可靠。
3. 其他构造器：Intl.RelativeTimeFormat（"3 天前"）、Intl.ListFormat（"A、B 和 C"）、Intl.Collator（本地化排序，中文可按拼音）、Intl.PluralRules（复数规则）、Intl.Segmenter（按词/字分词，ES2022）。
4. 注意点：locale 数据依赖运行环境的 ICU，Node 需完整 ICU 构建（小 icu 构建能力有限）；不同引擎/版本的结果可能有细微差异，单测不要硬断言完整输出字符串。
5. 性能：构造 Intl 实例有一定开销，重复使用时把它缓存在模块级或 Map 里，不要每次格式化的循环里 new。

```js
new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(1234.5); // ￥1,234.50
new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeZone: 'Asia/Shanghai' }).format(new Date());
new Intl.RelativeTimeFormat('zh-CN').format(-3, 'day'); // 3天前
```

**追问与易错点**：

- 陷阱：自己写 `toFixed(2)` 拼货币符号，忽略千分位、小数点符号的 locale 差异（如德语的 1.234,50），多语言项目必须用 Intl。
- 追问：金额计算用 Intl 吗？答：Intl 只负责格式化，计算要用整数分或 decimal 库，浮点数直接运算仍会有精度问题。
- 追问：中文排序怎么写？答：`arr.sort(new Intl.Collator('zh-CN').compare)`，默认 sort 按 UTF-16 码点排，中文顺序不符合预期。

### Q52 TC39 的提案阶段是怎么回事？装饰器现在到什么程度了？

**考察点**：考对标准流程与"特性能不能上生产"的判断力，考察技术视野。

**参考答案**：

> **一句话结论**：TC39 是推动 ECMAScript 标准的技术委员会，提案分 Stage 0 到 Stage 4 逐级推进，Stage 4 才进入当年规范；装饰器仍在 Stage 3，TypeScript 5.0 起提供了符合标准的新版实现。

1. 阶段含义：Stage 0 只是想法；Stage 1 有 champion 与明确场景；Stage 2 规范文本成型、语法基本确定；Stage 3 进入候选，引擎开始实现、语法不再大改、可谨慎试用；Stage 4 需两个以上独立实现并通过 Test262 测试，随后并入当年规范。
2. 发布节奏：ES2015 之后改为每年 6 月发布一版（ES2016、ES2017…），标准是"年度快照"，特性实际由引擎先落地。
3. 已进标准的近期特性：可选链与空值合并（ES2020）、Promise.any 与 replaceAll（ES2021）、`Array.prototype.at`、Error.cause、d 标志、结构化克隆（ES2022）、findLast/toSorted/Set 集合方法（ES2023 与 ES2025）、Object.groupBy 与 `v` 标志（ES2024）。
4. 装饰器现状：2022 年进入 Stage 3，至今仍在收尾（含 3.x 阶段的语义细化），尚未进入正式标准；TypeScript 5.0 起默认支持这套标准装饰器（不再需要 experimentalDecorators），与 Angular/早期 TS 的 legacy 装饰器语义不同：不能改类型、不能装饰参数、只能作用于类与类成员。
5. 判断方法：面试被问"某特性能不能用"，要同时给两个答案——标准阶段（Stage）和运行时支持（浏览器/Node 版本、是否需要 Babel/TS 转译、polyfill 是否可行），只看语法支持就上线是常见事故来源。

**追问与易错点**：

- 陷阱：把 Stage 3 当"已经稳定可用"，Stage 3 仍可能调整语义，生产依赖要评估回退方案并锁定转译器版本。
- 追问：`Array.prototype.at` 经常被当成新提案，它到底进了没有？答：已进 ES2022 正式标准，主流浏览器与 Node 16.6+ 原生支持，不是提案阶段。
- 追问：为什么装饰器拖了这么久？答：语法与语义在多方诉求下反复调整（是否可改类型、是否支持参数装饰、与私有字段的交互），TC39 更倾向于先收敛语义再标准化。

## 本章小结

- var 是函数作用域且提升初始化为 undefined，let/const 是块级作用域且有暂时性死区，const 只锁绑定不锁内容，循环里的闭包问题靠 let 的每轮新绑定解决。
- 解构的默认值只在 undefined 时生效，剩余元素必须放最后，解构 null/undefined 直接报错，对象解构赋值表达式要加括号。
- 展开与 Object.assign 都是浅拷贝且只处理自有可枚举属性，区别在 assign 写入已有目标并触发 setter，展开一定生成新对象。
- 箭头函数没有自己的 this/arguments/prototype 且不能被 new，适合回调与保留外层 this，不适合对象方法与需要动态 this 的场景。
- for...of 依赖 `Symbol.iterator`，可迭代对象与类数组是两个概念；生成器是"可暂停的函数"，async/await 在语义上可由生成器加 Promise 执行器模拟。
- Map/WeakMap、Set/WeakSet 的两两差异是"能否遍历/是否有 size"与"键是否必须为对象、是否弱引用"，选型看是否需要遍历与序列化。
- Proxy 拦截整个对象的 13 类操作并配合 Reflect 执行默认行为，这是 Vue3 能监听新增/删除属性与集合类型、并做惰性递归的根本原因；代价是不支持 IE。
- ESM 静态、导出实时绑定，CJS 运行时 require、导出值快照；default 导出是值快照且对 tree-shaking 不友好，循环依赖在两种模块下都脆弱，应当从设计上消除。

<!-- COUNT: 52 -->
