---
title: "第 1 章 JavaScript 基础与类型系统"
---

# JavaScript 基础与类型系统

## 第 1 章 JavaScript 基础与类型系统

### Q1 JavaScript 有几种数据类型？typeof 能返回哪些值？

**考察点**：能否分清原始类型（Primitive）与引用类型，并准确说出 typeof 的全部返回值——这是所有类型判断题的地基。

**参考答案**：

> **一句话结论**：8 种数据类型 = 7 种原始类型（undefined、null、boolean、number、string、symbol、bigint）+ 1 种引用类型 object；typeof 的结果只有 8 种字符串。

1. typeof 的全部返回值只有 8 种：`"undefined"`、`"boolean"`、`"number"`、`"bigint"`、`"string"`、`"symbol"`、`"function"`、`"object"`。其中 `"function"` 是 typeof 特有的，函数在类型划分上仍属于对象。
2. typeof 有两个盲区：`typeof null === "object"`（历史遗留）；除函数外，所有引用类型都返回 `"object"`，数组、Date、RegExp、Map 全都分不出来。
3. 想知道对象的具体内部类型，要用 `Object.prototype.toString.call(x)` 读 [[Class]] 标签，例如输出 `[object Array]`、`[object Date]`。

```js
typeof 1;            // 'number'
typeof 1n;           // 'bigint'
typeof Symbol();     // 'symbol'
typeof function () {}; // 'function'
typeof [];           // 'object'
typeof null;         // 'object'
```

**追问与易错点**：

- 追问：`typeof 未声明变量` 会报错吗？——不会，返回 `"undefined"`，这是 typeof 唯一不会因变量未声明而抛 ReferenceError 的场景（`let`/`const` 的暂时性死区除外）。
- 陷阱：把 `typeof null === "object"` 说成「null 是对象」，会被立刻追问 null 与 undefined 的区别。
- 陷阱：`typeof NaN` 是 `"number"`，别答成 `"nan"`。

### Q2 typeof null 为什么是 "object"？

**考察点**：考的是「知道结论 + 知道历史原因 + 知道为什么现在改不了」，答出历史原因算过关。

**参考答案**：

> **一句话结论**：这是 JavaScript 初版用「类型标签 + 值」表示变量时留下的 bug——null 的指针是全 0，被误判成对象标签 000。

1. 1995 年 JavaScript 第一版用 32 位单元存值，低 3 位是类型标签，`000` 表示对象；`null` 被设计成空指针（全 0），于是取标签时命中了对象分支。
2. 这个判断被写进了 ES1 规范并保留至今，因为修改会让海量线上代码（库里的 `typeof x === 'object'` 分支）行为突变，属于不可能修复的兼容性问题。
3. 因此要判断 null 必须单独写：`x === null`，或用 `Object.prototype.toString.call(null) === '[object Null]'`。

**追问与易错点**：

- 追问：那 `typeof undefined` 呢？——返回 `"undefined"`，undefined 用的是独立的标签，所以没有同样的问题。
- 陷阱：回答「因为 null 是对象」或「因为 null 继承自 Object」，这两种说法都错，null 没有原型。

### Q3 怎么判断一个值是不是数组？有几种写法？

**考察点**：考你是否知道 `Array.isArray` 与 `instanceof` 的差别，以及跨 iframe 场景会踩什么坑。

**参考答案**：

> **一句话结论**：生产代码只用 `Array.isArray(x)`；`instanceof Array` 在跨 iframe/跨 Realm 时会失效，`typeof` 和 `constructor` 都不可靠。

1. `Array.isArray(x)`：ES5 起提供，内部走 [[Class]] 判断，跨 Realm 安全，是唯一推荐写法。
2. `x instanceof Array`：原理是查原型链，iframe 里的数组原型链指向的是另一个 Realm 的 `Array.prototype`，所以返回 false。
3. `Object.prototype.toString.call(x) === '[object Array]'`：效果同样跨 Realm 安全，但比 `Array.isArray` 啰嗦，而且可以被 `Symbol.toStringTag` 伪造。
4. `x.constructor === Array` 最不可靠：原型可被改写，`Object.create(null)` 连 constructor 都没有。

**追问与易错点**：

- 追问：那类数组（arguments、NodeList、字符串）怎么办？——统一 `Array.from(x)` 或 `[...x]` 转成真数组再判断。
- 陷阱：用 `typeof arr === 'object'` 判断数组，会被追问「那对象呢」，直接暴露类型判断不扎实。

### Q4 instanceof 的原理是什么？手写一个

**考察点**：考原型链是否真的理解；能手写出循环查原型的版本即算过关。

**参考答案**：

> **一句话结论**：`a instanceof B` 就是沿 a 的原型链向上找，看是否能找到 `B.prototype`；基本类型左值一律返回 false。

1. 规则：取 `B.prototype`，然后不断 `Object.getPrototypeOf` 左值，命中则 true，链条走完到 null 则 false。
2. 左值必须是对象：`1 instanceof Number` 是 false（原始值没有原型链），但 `Object(1) instanceof Number` 是 true（装箱后是对象）。
3. 可被 `Symbol.hasInstance` 改写：`B[Symbol.hasInstance]` 一旦存在，`instanceof` 就调用它，不再查原型链。

```js
function myInstanceof(obj, Ctor) {
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
  if (typeof Ctor[Symbol.hasInstance] === 'function') return Ctor[Symbol.hasInstance](obj);
  const target = Ctor.prototype;
  let proto = Object.getPrototypeOf(obj);
  while (proto) {
    if (proto === target) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```

**追问与易错点**：

- 追问：`Object instanceof Function` 和 `Function instanceof Object` 是什么？——都是 true，原型链上有环状互指。
- 陷阱：忘记判断右值是否是函数，`x instanceof 1` 会抛 TypeError。
- 陷阱：直接写 `obj.__proto__ === Ctor.prototype`，只比较一层，多级继承会漏。

### Q5 typeof 和 instanceof 都不够用时，怎么精确判断类型？

**考察点**：考你是否有「统一类型判断工具函数」的意识，这是工程能力的体现。

**参考答案**：

> **一句话结论**：`Object.prototype.toString.call(x)` 取 [[Class]] 标签是最通用的兜底方案，再叠加 `Array.isArray` 等专用 API 就是完整方案。

1. `Object.prototype.toString.call([])` 得 `'[object Array]'`，对 Date、RegExp、Map、Set、Error、null、undefined 都能给出准确标签，且跨 Realm 有效。
2. 专用 API 优先于通用方案：数组用 `Array.isArray`，Promise 可用 `x instanceof Promise` 或 `typeof x.then === 'function'` 做鸭子类型判断。
3. 要防伪：`Symbol.toStringTag` 能改写 toString 的结果，例如 `class A { get [Symbol.toStringTag]() { return 'Array' } }`，所以安全场景不能只信它。

```js
const typeOf = (x) => Object.prototype.toString.call(x).slice(8, -1).toLowerCase();
typeOf([]);        // 'array'
typeOf(null);      // 'null'
typeOf(new Date()); // 'date'
```

**追问与易错点**：

- 追问：为什么不能直接 `x.toString()`？——因为多数内置类型重写了 toString（数组返回逗号串、Date 返回时间串），必须借 `Object.prototype` 上那个原始版本。
- 陷阱：在业务里写一大坨类型判断散落各处，被追问「怎么维护」时答不上来。

### Q6 null 和 undefined 有什么区别？

**考察点**：基础中的基础，考官想看的是「语义区别 + 行为区别」两层，而不是背定义。

**参考答案**：

> **一句话结论**：undefined 表示「系统层面的缺失/未赋值」，null 表示「人为主动置空」，两者 `==` 相等但 `===` 不等。

1. 语义：变量声明未赋值、函数无返回值、函数没传参、访问不存在的属性，都是 undefined；null 是开发者显式写入的「这里没有值」。
2. 行为差异：`typeof undefined` 是 `"undefined"`，`typeof null` 是 `"object"`；`Number(undefined)` 是 NaN，`Number(null)` 是 0；`null == undefined` 为 true 且二者只与彼此相等。
3. 序列化与默认值：`JSON.stringify({ a: undefined, b: null })` 得 `{"b":null}`，undefined 属性被丢弃；默认参数只对 undefined 生效，`function f(x = 1) {}` 传 null 时 x 就是 null。

**追问与易错点**：

- 追问：`[undefined, null].map(x => x ?? 'd')` 结果是什么？——`['d', 'd']`，`??` 两者都命中；换成 `||` 结果一样，但 0 和空串会不同。
- 陷阱：说「NaN 是 undefined 的一种」，两者完全不同。
- 陷阱：用 `if (x == undefined)` 同时判空，代码里可读性会被扣分，面试官常追问为什么不用 `x === null || x === undefined` 或 `x == null`（后者是 ES 规范里明确认可的惯用写法）。

### Q7 值传递和引用传递到底怎么区分？

**考察点**：考内存模型的基础认知，能说清「原始值按值、对象按引用共享」并给出对比例子即过关。

**参考答案**：

> **一句话结论**：JavaScript 里原始类型按值传递（复制一份），引用类型传递的是「引用的副本」，两个变量指向同一个堆对象，改内容互相可见。

1. 原始类型（number、string、boolean、null、undefined、symbol、bigint）赋给新变量时复制值，之后互不影响。
2. 对象/数组/函数赋值时复制的是指向堆内存的地址，`a === b` 为 true，改属性双向可见，但给其中一个重新赋值只是换了地址，另一个不受影响。
3. 判断相等时，原始类型比值，引用类型比地址：`{} === {}` 为 false，`[1] === [1]` 为 false。

```js
let a = { n: 1 };
let b = a;
b.n = 2;
console.log(a.n); // 2，同一对象
b = { n: 3 };     // 只改 b 的指向
console.log(a.n); // 仍是 2
```

**追问与易错点**：

- 追问：那 `const obj = {}` 能改属性吗？——能，const 只约束绑定不可重新赋值，不冻结对象内部，要冻结得用 `Object.freeze`。
- 陷阱：把对象的传参说成「引用传递（call by reference）」，准确说法是「按值传递引用的副本」，英文常称 call by sharing。

### Q8 `==` 和 `===` 的区别是什么？

**考察点**：送分题，但要答出「类型不同时的行为」与工程取舍，才算答完整。

**参考答案**：

> **一句话结论**：`===` 要求类型与值都相同（NaN 不等于自身），`==` 在类型不同时先做隐式类型转换再比较，因此默认一律用 `===`。

1. `===` 不转换类型：`1 === '1'` 为 false；特殊规则是 `NaN !== NaN`，且 `+0 === -0` 为 true。
2. `==` 的转换只在类型不同时发生，且 `null == undefined` 为 true，这是规范里唯一的例外（二者不与任何其他值相等）。
3. 工程建议：默认用 `===`；只有 `x == null` 这一种写法被广泛接受，因为它一次覆盖 null 与 undefined，比 `x === null || x === undefined` 简洁。

**追问与易错点**：

- 追问：ESLint 的 `eqeqeq` 规则为什么允许 `== null`？——可配置 `{ null: 'ignore' }`，就是为这个惯用法留的口子。
- 陷阱：说「`==` 就是会把两边都转成字符串」，错，规则是分类型讨论的，见下一题。

### Q9 `[] == ![]` 输出什么？`==` 的隐式转换规则是什么？

**考察点**：这是 `==` 的典型送命题，考的是能否复述规范里的转换优先级，而不是背答案。

**参考答案**：

> **一句话结论**：结果是 true；`==` 的规则是「同类型直接比，不同类型按 对象转原始值 → Boolean 转数字 → 字符串与数字转数字」的顺序收敛。

1. `![]` 先算：数组是真值，取反得 false，式子变成 `[] == false`。
2. 布尔值先转数字：`false` 变 0，式子变成 `[] == 0`；对象与数字比较时对象走 ToPrimitive，`[]` 转成 `''`。
3. 字符串与数字比较时字符串转数字：`Number('')` 是 0，最终 `0 == 0`，结果为 true。

```js
[] == ![];        // true
[] == 0;          // true（[] -> '' -> 0）
[1] == 1;         // true（[1] -> '1' -> 1）
null == 0;        // false，null 只与 undefined 相等
undefined == 0;   // false
```

**追问与易错点**：

- 追问：`{} == {}` 呢？——false，两个不同对象比较的是引用地址，不触发转换。
- 陷阱：以为 `null == 0` 是 true，这是最常见的错误理解；null/undefined 在 `==` 中不做数字转换。
- 陷阱：`![]` 答成 false，把「空数组等于 false」和「空数组是假值」混为一谈——空数组其实是真值。

### Q10 对象转原始值的过程是怎样的（ToPrimitive）？

**考察点**：进阶题，考隐式转换的底层机制；能说清 hint 三种取值和调用顺序就是满分。

**参考答案**：

> **一句话结论**：对象转原始值走 ToPrimitive：先看有没有 `Symbol.toPrimitive`，没有就按 hint（number/string/default）决定先调 valueOf 还是先调 toString，返回第一个原始值。

1. hint 的来源：`+`、`==`、`Number()`、减法等期望数字的场合是 `default` 或 `number`；模板字符串、`String()` 是 `string`。`default` 除 Date 外与 `number` 同序（Date 的 `default` 按 string 处理）。
2. `number` 顺序：先 `valueOf()`，若返回对象再 `toString()`；`string` 顺序相反：先 `toString()`，再 `valueOf()`。两者都返回对象就抛 TypeError。
3. `Symbol.toPrimitive` 优先级最高，可以完全接管：它接收 hint 参数，返回非原始值会直接抛错。这是自定义类型的推荐做法。

```js
const obj = {
  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? 1 : 'one';
  },
};
+obj;          // 1
`${obj}`;      // 'one'
obj + '';      // 'one'（hint 是 default，命中的是本对象的 else 分支）
```

**追问与易错点**：

- 追问：普通对象为什么 `+{}` 得到 `"[object Object]"`？——valueOf 返回对象本身，继续调 toString，得到该字符串。
- 陷阱：以为 `obj + ''` 一定先调 valueOf 并用它的结果拼接（当 valueOf 返回原始值时确实如此，但默认对象返回的是自身，所以结果来自 toString），回答时要区分「调用顺序」和「最终采用谁的结果」。

### Q11 NaN 是什么？`isNaN` 和 `Number.isNaN` 有什么区别？

**考察点**：考你是否知道 NaN 的类型、唯一性和两个判断 API 的差别，这是必考题。

**参考答案**：

> **一句话结论**：NaN 是「非数字」的 number 类型值，且 `NaN !== NaN`；`isNaN` 会先做类型转换，`Number.isNaN` 只对真正的 NaN 返回 true。

1. 产生来源：`Number('abc')`、`0 / 0`、`parseInt('x')`、`undefined + 1` 等。类型上 `typeof NaN === 'number'`。
2. 唯一性：NaN 是唯一不等于自身的值，所以 `x !== x` 可以当作「是不是 NaN」的古老判断法。
3. 两个 API：全局 `isNaN('abc')` 返回 true，因为先 `Number('abc')` 得到 NaN，会把非数字字符串误判为 NaN；`Number.isNaN('abc')` 返回 false，不做转换，是正确用法。
4. `Object.is(NaN, NaN)` 也是 true，且能同时区分 ±0，比 `x !== x` 更直观。

**追问与易错点**：

- 追问：怎么判断一个值「不是有效数字」？——`typeof x === 'number' && Number.isFinite(x)`，可同时排除 NaN、Infinity。
- 陷阱：用 `Number.isNaN(undefined)` 判断空值，它返回 false（undefined 不是 NaN），因此不能当空值校验用。

### Q12 `Object.is` 和 `===` 有什么区别？什么时候必须用它？

**考察点**：考对 ±0 与 NaN 边界的掌握，以及是否知道框架源码里它的实际用途。

**参考答案**：

> **一句话结论**：`Object.is` 与 `===` 只在两处不同——`Object.is(NaN, NaN)` 为 true、`Object.is(0, -0)` 为 false，其余场景等价。

1. `===` 的规则是 `NaN !== NaN`、`0 === -0`；`Object.is` 反了过来，可以理解为「SameValue」算法，比 `===` 更严格地比较值的同一性。
2. 实际用途：框架做依赖/属性比较时用它避免重复更新，例如 React 用 `Object.is` 比较 state 是否变化，Vue3 的响应式依赖比较也基于同一机制。
3. 工程建议：普通业务判断用 `===` 就够；只有在需要「NaN 视为相等」或「区分正负零」时才用 `Object.is`。

```js
Object.is(NaN, NaN);  // true
NaN === NaN;          // false
Object.is(0, -0);     // false
0 === -0;             // true
```

**追问与易错点**：

- 追问：`Object.is` 是深比较吗？——不是，它只比较一层，两个内容相同的对象仍返回 false。
- 陷阱：说 `Object.is` 就是「更严格的 ===，连类型都更严格」，类型检查二者一致，真正的差异只有 NaN 和 ±0。

### Q13 为什么 `0.1 + 0.2 !== 0.3`？

**考察点**：经典题，答不出 IEEE 754 的存储方式会被判定为基础不牢。

**参考答案**：

> **一句话结论**：因为 JavaScript 的 number 是 IEEE 754 双精度浮点数，0.1 和 0.2 在二进制下都是无限循环小数，存储时已被舍入，相加后误差被放大，结果是 0.30000000000000004。

1. 双精度 64 位：1 位符号 + 11 位指数 + 52 位尾数，能精确表示的只有形如「整数 × 2 的幂」的数，十进制小数大多无法精确表示。
2. 误差量级约为 2 的 -52 次方（`Number.EPSILON` ≈ 2.22e-16），这是精度上限，不是 JavaScript 的 bug，Java、Python 的 double 也一样。
3. 关键结论：不要用 `===` 直接比较浮点结果，要按业务允许的误差范围比较。

```js
0.1 + 0.2;                        // 0.30000000000000004
0.1 + 0.2 === 0.3;                // false
Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON; // true
```

**追问与易错点**：

- 追问：为什么 `0.1 + 0.2` 是 0.30000000000000004 而不是 0.3？——相加后得到的是最接近真实和的、可被双精度表示的数，那个数恰好比 0.3 略大。
- 陷阱：用 `Number.EPSILON` 直接比较任意量级的数，例如比较 1e20 附近的数时 EPSILON 太小会失效，应按相对误差或量级选取容差。

### Q14 项目里金额这类浮点计算怎么做？有哪几种方案？

**考察点**：考工程落地能力，能说出「整数化 + 定点 + 三方库」的取舍即可，但要能指出各方案代价。

**参考答案**：

> **一句话结论**：金额一律避免用浮点数直接运算，首选「转成最小货币单位（分）用整数算」，复杂场景用 decimal.js 这类定点/十进制库，只有展示时做格式化。

1. 整数化：`(0.1 * 100 + 0.2 * 100) / 100` 得到 0.3；金额在接口和存储层直接用分（整数或 BigInt），只在渲染时除以 100。
2. 比较用容差：`Math.abs(a - b) < 1e-9`，容差按业务精度取（如 1e-6），不要无脑用 `Number.EPSILON`。
3. 保留小数用 `toFixed` 要小心：它受二进制误差影响，`1.005.toFixed(2)` 得 `"1.00"` 而不是 `"1.01"`（因为 1.005 实际存的是 1.00499...）；需要严格四舍五入时应先转整数再算。
4. 三方库：decimal.js、big.js 用字符串/十进制表示，精度正确但运算慢、体积大；BigInt 适合整数或可定点化的场景。

**追问与易错点**：

- 追问：`toFixed` 到底是怎么舍入的？——规范上是「取最接近的可表示值再按二进制值舍入」，所以会出现 1.005 这类反直觉结果，工程上别依赖它做金融舍入。
- 陷阱：用 `parseFloat((a + b).toFixed(2))` 当万能方案，连续多次运算误差仍会累积，且 toFixed 本身有上述缺陷。

### Q15 Number 的安全整数范围是多少？超出范围怎么办？

**考察点**：考你是否踩过「后端返回的长整型 ID 精度丢失」这个真实事故。

**参考答案**：

> **一句话结论**：安全整数范围是 ±(2^53 - 1)，即 `Number.MAX_SAFE_INTEGER` = 9007199254740991，超出后用 BigInt 或字符串表示。

1. 原因：双精度只有 52 位尾数，整数超过 2^53 - 1 后无法保证唯一表示，相邻整数会映射到同一个浮点值。
2. 典型事故：后端返回 19 位雪花 ID 的 JSON，前端 `JSON.parse` 后末几位被改写，且改回不去；解法是让后端把大整数以字符串下发，或在解析阶段用第三方 JSON 库（如 json-bigint）转 BigInt。
3. 判断与处理：`Number.isSafeInteger(x)` 判断是否安全；运算可用 BigInt，展示可用字符串拼接。

```js
Number.MAX_SAFE_INTEGER;      // 9007199254740991
9007199254740993;             // 9007199254740992，字面量本身就已失真
Number.isSafeInteger(1e16);   // false
BigInt('9007199254740993');   // 9007199254740993n
```

**追问与易错点**：

- 追问：为什么 `9007199254740993` 字面量就已经错了？——它无法被精确表示，解析时就被舍入到最近的偶数 9007199254740992，说明问题在「进入 JavaScript 之前」。
- 陷阱：说「超过范围会抛错」，实际是静默精度丢失；只有 BigInt 与 Number 混算才会抛 TypeError。

### Q16 BigInt 是什么？用的时候有哪些坑？

**考察点**：考 ES2020 新类型的实际约束，能说出「不能与 Number 混算」「JSON 不支持」就过关。

**参考答案**：

> **一句话结论**：BigInt 是任意精度整数类型，写法 `1n` 或 `BigInt('123')`，`typeof` 返回 `"bigint"`，与 Number 是两种类型。

1. 特性：表示任意大的整数，没有精度上限；除法向零截断（`5n / 2n === 2n`），`/` 不做小数；位运算与比较运算符行为与 Number 类似。
2. 与 Number 的关系：不能混用算术运算（`1n + 1` 抛 TypeError）；比较可用 `1n == 1`（true）但 `1n === 1` 为 false；`Number(bigint)` 可能丢精度，`BigInt(number)` 必须是整数否则抛 RangeError。
3. 兼容性坑：`JSON.stringify(1n)` 抛 TypeError（需自定义 `toJSON` 或转字符串）；`Math` 的方法全部不支持；BigInt 不能用于 `Math.max`、`Math.round`。

```js
const id = BigInt('9007199254740993');
id + 1n;                    // 9007199254740994n
id > 9007199254740992;      // true
JSON.stringify({ id: id.toString() }); // 先转字符串再序列化
```

**追问与易错点**：

- 追问：BigInt 能表示小数吗？——不能，只表示整数，需要小数得自己做定点（放大 10 的 n 次方）。
- 陷阱：以为 BigInt 可以完全替代 Number 做金额计算，任意精度但仍是整数类型，且性能更差。

### Q17 Symbol 有什么用？用 Symbol 当属性键有什么特性？

**考察点**：考 ES6 新类型，重点在「唯一性」与「作为键时不可被常规遍历枚举」这两点。

**参考答案**：

> **一句话结论**：Symbol 是独一无二的原始值，主要用途是当属性键避免命名冲突，以及通过内置 Symbol（如 `Symbol.iterator`）定制语言行为。

1. 唯一性：`Symbol('a') === Symbol('a')` 为 false，字符串描述只是调试用；`Symbol.for('a') === Symbol.for('a')` 为 true，因为它走全局注册表。
2. 作为键的可见性：`for...in`、`Object.keys`、`JSON.stringify` 都拿不到 Symbol 键，需要 `Object.getOwnPropertySymbols(obj)` 或 `Reflect.ownKeys(obj)` 才能读到。
3. 用于私有性：Symbol 键不是真正的私有（反射 API 仍可枚举），但能避免被无意覆盖；真正的私有字段要用 `#field`（ES2022）。
4. 内置 Symbol 是「元编程钩子」：`Symbol.iterator` 让对象可被 `for...of` 遍历，`Symbol.toPrimitive` 控制类型转换，`Symbol.hasInstance` 改写 instanceof。

```js
const key = Symbol('id');
const obj = { [key]: 1 };
obj[key];              // 1
Object.keys(obj);      // []
Reflect.ownKeys(obj);  // [Symbol(id)]
```

**追问与易错点**：

- 追问：`new Symbol()` 可以吗？——不可以，会抛 TypeError，Symbol 是原始值不是构造函数。
- 陷阱：以为 Symbol 键属性是不可枚举的所以「不可配置」，它默认可写可配置、也默认可枚举（enumerable: true），只是在字符串键的遍历里看不到。

### Q18 为什么原始值也能调用方法（装箱机制）？

**考察点**：考包装对象（Wrapper Object）与临时装箱过程，是理解「原始值属性设置无效」的前提。

**参考答案**：

> **一句话结论**：访问原始值的属性时，引擎会临时创建一个包装对象（String/Number/Boolean/Symbol/BigInt），调用完立刻销毁，所以 `'abc'.length` 能工作。

1. 过程：`'abc'.charAt(0)` 会先 `ToObject('abc')` 生成临时 String 对象，读原型上的方法并调用，随后丢弃该临时对象。
2. 后果一：给原始值加属性不会保留，`const s = 'a'; s.x = 1; s.x` 得 undefined（非严格模式静默失败，严格模式抛 TypeError）。
3. 后果二：临时对象只用于读取，不要把原始值当对象传给需要对象语义的 API；真正长期存在的对象要显式 `Object(x)` 或 `new String(x)`（几乎不该用）。
4. 包装对象的 typeof 是 `"object"`，且都是真值，这是下一题的陷阱来源。

```js
'abc'.length;        // 3
const s = 'a';
s.x = 1;             // 静默失败（严格模式抛 TypeError）
s.x;                 // undefined
typeof new String('a'); // 'object'
```

**追问与易错点**：

- 追问：`'abc'.constructor === String` 为什么是 true？——临时包装对象的原型就是 `String.prototype`，它上面的 constructor 指向 String。
- 陷阱：以为每次访问属性都会创建一个真实对象并保留，从而担心性能；引擎对此有优化，不需要在业务里手动缓存。

### Q19 `new Boolean(false)` 是真值还是假值？`Object(1)` 呢？

**考察点**：考包装对象陷阱，答案是「都是真值」，答对的能看出是否真的理解装箱。

**参考答案**：

> **一句话结论**：`new Boolean(false)` 是对象，所有对象都是真值，所以 `if (new Boolean(false))` 会进 true 分支。

1. 规则：包装对象（`new Boolean(false)`、`new Number(0)`、`new String('')`）都是对象，真值判断只看「是不是对象」，因此全部为 true。
2. 取值要显式转换：`new Number(0).valueOf()` 得 0；`+new Number(0)` 也能得到 0；JSON 序列化包装对象会得到其原始值（因为 Number/String/Boolean 包装对象有 toJSON 或会被 ToNumber 处理，实际 `JSON.stringify(new Number(0))` 得 `"0"`）。
3. 结论：永远不要用 `new` 创建包装对象，需要转换就用 `Boolean(x)`、`Number(x)`、`String(x)`。

```js
if (new Boolean(false)) console.log('会执行'); // 会执行
Boolean(new Boolean(false));  // true（对象转布尔永远是 true）
new Boolean(false).valueOf(); // false
```

**追问与易错点**：

- 追问：那 `[]` 和 `{}` 呢？——同样是真值，`if ([])` 会进入分支；只有 8 种假值会走 false 分支。
- 陷阱：把「包装对象为真」和「原始值为假」弄混，用 `Boolean(new Boolean(false))` 来做条件判断，逻辑必然反。

### Q20 哪些值是假值？真值有哪些容易踩的坑？

**考察点**：送分题，但考官会用 `[]`、`'0'`、`document.all` 来试探边界。

**参考答案**：

> **一句话结论**：假值只有 8 个：`false`、`0`、`-0`、`0n`、`''`、`null`、`undefined`、`NaN`，除此之外全是真值。

1. 记忆法：布尔假、数字零（含 -0、0n）、空串、空值（null/undefined）、NaN。注意空数组、空对象、空函数、`new Boolean(false)` 都是真值。
2. 字符串陷阱：`'0'`、`' '`（空格）、`'false'` 都是非空字符串，全是真值，做数字判断前要显式 `Number()` 后判断 NaN。
3. 历史特例：`document.all` 是唯一一个「是对象却为假值」的宿主对象（为兼容老代码设计，`typeof document.all` 返回 `"undefined"`），面试提到即可加分。
4. 工程建议：判断数字用 `x !== 0` 或 `Number.isFinite`，别用 `if (x)`，否则 0 会被误判。

**追问与易错点**：

- 追问：`if ([])` 结果是什么？——true，空数组是真值，要判断空数组必须用 `arr.length === 0`。
- 陷阱：用 `if (value)` 校验数字 0 或空字符串的场景，是线上 bug 的高发点，面试官很喜欢问「这里 0 会怎样」。

### Q21 `??` 和 `||` 有什么区别？什么时候必须用 `??`？

**考察点**：考 ES2020 空值合并运算符的语义边界，是「0 被吞掉」类 bug 的核心。

**参考答案**：

> **一句话结论**：`??` 只在左侧是 `null` 或 `undefined` 时才取右侧，`||` 对一切假值（0、`''`、false、NaN）都取右侧。

1. 判断依据不同：`||` 走 ToBoolean，`??` 只判断 null/undefined，保留 0、`''`、false 这些合法业务值。
2. 使用场景：配置项默认值、接口字段兜底，用 `??`；需要「空串也当没填」时，用 `||` 或显式判断。
3. 语法限制：`??` 不能与 `||`、`&&` 不加括号地混用，`a ?? b || c` 会直接抛 SyntaxError，必须写成 `(a ?? b) || c`。
4. 配套赋值运算符 `??=`：`a ??= b` 等价于 `a ?? (a = b)`，只在 a 为 null/undefined 时赋值。

**追问与易错点**：

- 追问：`0 ?? 1` 和 `0 || 1` 分别是什么？——分别是 0 和 1，这就是必须区分二者的原因。
- 陷阱：`??` 的优先级问题，写 `a ?? b ? c : d` 会被解析成 `(a ?? b) ? c : d`，混用时要主动加括号。

### Q22 可选链 `?.` 怎么用？有哪些坑？

**考察点**：考短路语义与实际边界，很多人只会用不会解释。

**参考答案**：

> **一句话结论**：`?.` 在左侧为 null/undefined 时短路并返回 undefined，不会继续访问后续属性；它只保护「它前面那一段」，不保护整条链。

1. 三种形式：`obj?.a`（属性）、`obj?.[key]`（动态键）、`fn?.()`（调用）；左侧是 null/undefined 时整个表达式返回 undefined 且不再求值右侧。
2. 短路边界：`obj?.a.b` 中如果 obj 存在但 a 为 null，仍会抛 TypeError；要写成 `obj?.a?.b`。同理 `obj?.a()` 中 a 不是函数仍会抛错。
3. this 绑定：`obj.method?.()` 会保留 obj 作为 this，不会因为可选链丢失上下文。
4. 与 `??` 搭配是标准兜底写法：`obj?.a ?? 'default'`，注意用 `??` 而不是 `||`，否则 0 和空串会被替换。

```js
const user = { name: 'x', getInfo: null };
user?.getInfo?.();     // undefined，不报错
user.getInfo?.();      // undefined
user?.getInfo();       // TypeError: user.getInfo is not a function
```

**追问与易错点**：

- 追问：`a?.b.c` 里如果 a 存在、b 为 undefined 呢？——抛 TypeError，可选链不会传播到后面的成员访问。
- 陷阱：以为 `?.` 能替代所有空值判断，给不可选的必填字段也加 `?.`，会把「数据缺失」这类真实错误掩盖成 undefined，排查成本变高。

### Q23 为什么 `{} === {}` 是 false？怎么判断两个对象内容相等？

**考察点**：考引用相等与深比较的区别，顺带看你会不会踩 JSON 深比较的坑。

**参考答案**：

> **一句话结论**：对象比较比的是引用地址，两个字面量是两块不同的内存，所以 `===` 为 false；要比较内容必须递归逐字段比较。

1. `===` 对对象只做引用判断：同一引用为 true（`const b = a` 后 `a === b`），不同引用即使内容一致也是 false。
2. 浅比较：只比较第一层（`Object.keys` 数量 + `Object.is` 逐键比较），React 的 `PureComponent`、`React.memo` 就是浅比较。
3. 深比较：递归比较类型与每个键，需处理 NaN（用 `Object.is`）、Date/RegExp/Map/Set 等特殊类型，公用的循环引用要用 WeakMap 记录；生产建议用 lodash 的 `isEqual`。
4. 简易方案及其局限：`JSON.stringify(a) === JSON.stringify(b)` 受键顺序、undefined、Date、循环引用影响，只能用于结构可控的简单数据。

**追问与易错点**：

- 追问：数组能用 `toString()` 比较吗？——`[1,2].toString() === '1,2'`，会把嵌套数组和字符串混淆（`[1,2]` 与 `['1','2']` 结果相同），不能用。
- 陷阱：用 JSON.stringify 比较两个对象，键的插入顺序不同就会误判为不相等。

### Q24 浅拷贝和深拷贝有什么区别？各有哪些实现方式？

**考察点**：考概念边界与 API 清单，重点是「浅拷贝共享嵌套引用」这句话要能主动说出来。

**参考答案**：

> **一句话结论**：浅拷贝只复制第一层，嵌套对象仍是共享引用；深拷贝递归复制所有层级，副本与原对象完全独立。

1. 浅拷贝 API：`Object.assign({}, obj)`、展开运算符 `{...obj}`、数组的 `slice()`、`concat()`、`Array.from()`、`[...arr]`。改副本第一层不影响原对象，改嵌套对象会互相影响。
2. 深拷贝方案：`structuredClone(obj)`（现代首选）、手写递归、`JSON.parse(JSON.stringify(obj))`（局限多）、lodash `cloneDeep`。
3. 选择依据：只要一层就浅拷贝，性能最好；真正需要隔离嵌套结构（如把 props 当初始 state 改）才深拷贝。
4. 注意：`Object.assign` 会触发源对象的 getter 并调用目标对象的 setter；展开运算符不会，它只做属性读取。

```js
const src = { a: 1, nested: { b: 2 } };
const shallow = { ...src };
shallow.nested.b = 99;
src.nested.b; // 99，嵌套仍是同一个对象
```

**追问与易错点**：

- 追问：`{...obj}` 会拷贝 Symbol 键吗？——会，展开和 Object.assign 都复制自身可枚举属性，包括 Symbol 键；但不可枚举属性不会被复制。
- 陷阱：以为 `{...obj}` 等于深拷贝，在 Vue/React 里改嵌套对象仍然污染原数据，这是很典型的状态更新 bug。

### Q25 手写一个深拷贝，要考虑哪些边界？

**考察点**：手写题，考递归能力与边界意识；能处理循环引用和常见内置类型就是高分。

**参考答案**：

> **一句话结论**：深拷贝 = 递归复制 + 用 WeakMap 记录已拷贝对象解决循环引用 + 针对 Date/RegExp/Map/Set 等特殊类型分别处理。

1. 基本流程：原始类型直接返回；对象类型先查 WeakMap，命中直接返回，否则按类型创建空壳并登记，再递归拷贝自有可枚举属性（含 Symbol 键）。
2. 必须处理的特殊类型：Date（复制时间戳）、RegExp（复制 source 与 flags）、Map/Set（递归拷贝元素）、Array（保留结构）、TypedArray/ArrayBuffer。
3. 明确不处理的：函数（通常直接返回引用）、DOM 节点、原型链上的属性、不可枚举属性。型别判断用 `Object.prototype.toString.call`。
4. 复杂度与风险：深拷贝是 O(n) 递归，深层嵌套可能栈溢出；对超大对象或频繁场景应考虑结构化克隆或不可变数据方案。

```js
function deepClone(target, map = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target;
  if (map.has(target)) return map.get(target);
  const tag = Object.prototype.toString.call(target);
  let clone;
  if (tag === '[object Date]') return new Date(target.getTime());
  if (tag === '[object RegExp]') return new RegExp(target.source, target.flags);
  clone = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target));
  map.set(target, clone);
  for (const key of Reflect.ownKeys(target)) {
    if (Object.prototype.propertyIsEnumerable.call(target, key)) {
      clone[key] = deepClone(target[key], map);
    }
  }
  return clone;
}
```

**追问与易错点**：

- 追问：为什么用 WeakMap 而不是普通对象存映射？——WeakMap 的键是弱引用，不阻止回收，且键可以是对象本身，不会因序列化键而冲突。
- 陷阱：忘记把新对象提前放进 map，只处理「拷贝后再登记」，遇到循环引用直接栈溢出。
- 陷阱：用 `for...in` 遍历，会把原型链上的可枚举属性也拷进来。

### Q26 `structuredClone` 能替代手写深拷贝吗？

**考察点**：考对新 API 的边界认知，能说出「支持循环引用但不支持函数」就过关。

**参考答案**：

> **一句话结论**：`structuredClone` 是浏览器与 Node 17+ 内置的结构化克隆，支持循环引用、Date、RegExp、Map、Set、ArrayBuffer，但遇到函数、DOM 节点、Proxy、Symbol 值会抛 DataCloneError（Symbol 作为键则被静默丢弃）。

1. 支持：循环引用、Date、RegExp、Map、Set、Blob、File、ArrayBuffer、TypedArray、Error；结果是完全独立的深拷贝。
2. 不支持：函数、DOM 节点、原型链上的自定义方法（自定义类实例会被降级成普通对象，丢失原型）、Symbol 作为键（Symbol 键直接丢弃）、WeakMap/WeakSet。
3. 传值限制：属性值是函数时整个调用抛错（不会静默跳过），所以调用前必须确认数据结构是「纯数据」。
4. 与手写方案对比：它是原生实现，速度快、代码少，是首选；需要保留类实例或函数的场景才自己写。

```js
const src = { list: [1, 2], when: new Date(), self: null };
src.self = src;                      // 循环引用
const copy = structuredClone(src);   // 正常，copy.self === copy
structuredClone({ fn: () => {} });   // DataCloneError
```

**追问与易错点**：

- 追问：Vue 的 `toRaw`/`markRaw` 和它有冲突吗？——`structuredClone` 拿到 Proxy 会直接抛 DataCloneError，必须先 `toRaw` 再克隆。
- 陷阱：以为它和 `JSON.parse(JSON.stringify())` 一样只支持纯 JSON，从而在能用的场景继续用 JSON 方案，丢掉了 Date 和 Map 的正确性。

### Q27 数组的 `flat` / `flatMap` 怎么用？有什么坑？

**考察点**：考 ES2019 数组 API 的参数与行为细节，很多人只记得能拍平。

**参考答案**：

> **一句话结论**：`flat(depth)` 按指定深度拍平嵌套数组，默认深度 1，传 `Infinity` 拍平所有层级；`flatMap` 等价于先 `map` 再 `flat(1)`。

1. `flat` 会移除空位（稀疏数组的空洞被删掉），并接受深度参数；深度传 0 相当于浅拷贝一层引用（不做任何事），传负数视作 0。
2. `flatMap` 只能拍一层：回调返回数组会把该层展开，返回非数组则相当于普通 map 的结果；它无法用深度参数控制。
3. 性能与选择：`flat(Infinity)` 对大数组有递归开销；只要一层时用 `arr.reduce((acc, x) => acc.concat(x), [])` 或 flatMap 更直观。
4. 兼容注意：`flat`/`flatMap` 是 ES2019 标准，老浏览器需 polyfill；`Array.prototype.flat` 已被 TypeScript 的 lib 正确声明。

```js
[1, [2, [3, [4]]]].flat();          // [1, 2, [3, [4]]]
[1, [2, [3, [4]]]].flat(Infinity);  // [1, 2, 3, 4]
[1, 2].flatMap((n) => [n, n * 2]);  // [1, 2, 2, 4]
```

**追问与易错点**：

- 追问：`flat` 会深度拷贝内部对象吗？——不会，它只做结构拍平，对象引用仍是共享的。
- 陷阱：用 `flatMap` 处理返回空数组的元素（相当于过滤），却以为它能拍多层，结果里还留着嵌套数组。

### Q28 数组 `sort` 有哪些坑？为什么 `[10, 9, 1].sort()` 结果是错的？

**考察点**：高频陷阱题，考默认比较规则、原地修改与稳定性三件事。

**参考答案**：

> **一句话结论**：`sort` 默认把元素转成字符串按 UTF-16 码元比较，所以数字数组必须传比较函数 `(a, b) => a - b`；同时它原地修改数组并返回同一引用。

1. 默认行为：不传比较函数时按字符串排序，`[10, 9, 1].sort()` 得 `[1, 10, 9]`；`[2, 10, 1]` 也得 `[1, 10, 2]`。
2. 比较函数规则：返回负数表示 a 在前，正数表示 b 在前，0 表示相等；返回 NaN 时顺序未定义，要避免。
3. 原地修改：`sort` 会改变原数组，如果原数组不能被改，先 `[...arr].sort()` 或 `arr.slice().sort()` 复制一份。
4. 稳定性：ES2019 起规范要求排序稳定（相同键保持原相对顺序），V8 使用 TimSort；靠这一点可以做多字段排序。

```js
[10, 9, 1].sort();                    // [1, 10, 9]
[10, 9, 1].sort((a, b) => a - b);     // [1, 9, 10]
['b', 'a'].sort((a, b) => a.localeCompare(b, 'zh')); // 按中文/本地规则
```

**追问与易错点**：

- 追问：字符串排序为什么推荐 `localeCompare`？——默认码元比较对中文、大小写、音标都不符合人类预期，`localeCompare` 走本地化排序规则。
- 陷阱：直接 `arr.sort()` 后又以为拿到的是新数组，原数组被改导致响应式数据意外变化，需先复制。

### Q29 `at()` 和 `Object.groupBy` 怎么用？

**考察点**：考新 API 的版本与返回值细节，属于「答得出说明你在跟标准」的加分题。

**参考答案**：

> **一句话结论**：`at(i)` 支持负数索引（`arr.at(-1)` 取最后一个元素）；`Object.groupBy`（ES2024）按回调返回值分组，返回 null 原型的普通对象，`Map.groupBy` 返回 Map。

1. `at` 是 ES2022 标准，字符串也支持；`arr.at(-1)` 等价于 `arr[arr.length - 1]`，越界返回 undefined，比 `arr[arr.length - 1]` 更安全可读。
2. `Object.groupBy(items, fn)` 的回调返回分组键，键会被转成属性名（字符串或 Symbol），返回对象没有原型（`Object.create(null)`），所以不能直接调 `hasOwnProperty`。
3. `Map.groupBy(items, fn)` 允许键是对象等任意值，需要保留对象键时用它。
4. 兼容性：`Object.groupBy` 属于 ES2024，浏览器 Chrome 117+ / Node 21+ 支持；旧环境用 reduce 手写分组。

```js
[1, 2, 3, 4].at(-1);                       // 4
const grouped = Object.groupBy([1, 2, 3, 4], (n) => (n % 2 ? 'odd' : 'even'));
grouped; // { odd: [1, 3], even: [2, 4] }
Object.getPrototypeOf(grouped);            // null
```

**追问与易错点**：

- 追问：旧环境怎么兼容？——`arr.reduce((acc, cur) => ((acc[key(cur)] ??= []).push(cur), acc), {})`，或用 lodash 的 `groupBy`。
- 陷阱：对 `Object.groupBy` 的返回值调用 `hasOwnProperty`，会抛 TypeError，因为它没有原型，要用 `Object.hasOwn(grouped, 'odd')`。

### Q30 遍历对象有哪几种方式？它们分别拿到什么？

**考察点**：考「自身/继承」「可枚举/不可枚举」「字符串键/Symbol 键」三个维度的辨析，答成对照表最稳。

**参考答案**：

> **一句话结论**：`for...in` 拿可枚举键含原型链，`Object.keys` 拿自身可枚举字符串键，`Object.getOwnPropertyNames` 加不可枚举，`Reflect.ownKeys` 再给出 Symbol 键。

| 方式 | 是否含原型链 | 是否含不可枚举 | 是否含 Symbol 键 |
| --- | --- | --- | --- |
| `for...in` | 含 | 不含 | 不含 |
| `Object.keys` | 不含 | 不含 | 不含 |
| `Object.getOwnPropertyNames` | 不含 | 含 | 不含 |
| `Object.getOwnPropertySymbols` | 不含 | 含 | 只含 Symbol |
| `Reflect.ownKeys` | 不含 | 含 | 含 |

1. 键的顺序规则：整数索引键按数值升序最先，其次是字符串键按插入顺序，最后是 Symbol 键按插入顺序（此规则对上述自身属性 API 一致）。
2. 遍历值用 `Object.values` 或 `Object.entries`；`for...of` 不能直接遍历对象（普通对象没有 `Symbol.iterator`），得配合 `Object.entries(obj)`。
3. 安全用法：只想要自身属性时用 `Object.keys` 或 `Object.entries`，不要用 `for...in` 加 `hasOwnProperty` 的老写法。

**追问与易错点**：

- 追问：`for...in` 为什么会遍历到别人的属性？——对象字面量继承 `Object.prototype`，一旦有人在原型上挂了可枚举属性（老式库常见），`for...in` 就会带上。
- 陷阱：以为 `Object.keys` 返回顺序是插入顺序，整数键会被提前并升序排列（`{2:'a',1:'b'}` 得到 `['1','2']`）。

### Q31 用 `JSON.parse(JSON.stringify(obj))` 做拷贝或序列化有哪些坑？

**考察点**：高频陷阱题，能列出 4 条以上具体丢失行为就过关。

**参考答案**：

> **一句话结论**：它只能处理纯 JSON 数据，函数、undefined、Symbol、循环引用、Date、RegExp、Map/Set、原型链全都会出问题。

1. 被丢弃：函数、undefined 值、Symbol 值与其键；对象里这些键会消失，数组里会变成 null。
2. 被改写：`NaN`、`Infinity`、`-Infinity` 全部变成 null；Date 变成 ISO 字符串且不会还原成 Date；RegExp、Map、Set、Error 变成 `{}`。
3. 直接抛错：存在循环引用时抛 TypeError；存在 BigInt 时抛 TypeError。
4. 其他：只序列化自身可枚举属性，原型链丢失（自定义类实例变成普通对象，`instanceof` 失效）；会调用对象的 `toJSON()`；会触发 getter。

```js
const src = { d: new Date(), n: NaN, u: undefined, f() {} };
const copy = JSON.parse(JSON.stringify(src));
copy; // { d: '2024-01-01T00:00:00.000Z', n: null }，函数与 undefined 丢失
copy.d instanceof Date; // false
```

**追问与易错点**：

- 追问：那接口传参用 JSON 有什么要注意的？——后端约定时间字段用字符串、可选字段用 null 显式表达，不要依赖 undefined 被丢弃这一行为。
- 陷阱：用它做深拷贝后又期望 `copy.date` 还是 Date，导致后续 `getTime()` 报错，这是最常见的线上问题。

### Q32 `new Date()` 有哪些时区坑？

**考察点**：考日期解析与本地时间的区别，能说清「date-only 按 UTC 解析」这条就算答到点上。

**参考答案**：

> **一句话结论**：`new Date('2024-01-01')` 这种只有日期的 ISO 字符串按 UTC 解析，而 `'2024-01-01T00:00:00'`（无时区）和 `'2024/01/01'` 按本地时间解析，混用就会整体偏 8 小时。

1. 解析差异：`new Date('2024-01-01')` 在 UTC+8 环境得到的是本地 2024-01-01 08:00；写 `new Date('2024-01-01T00:00:00')` 才是本地零点。非 ISO 格式（`'2024/01/01'`）不在规范里，靠引擎实现，不可依赖。
2. 取值陷阱：`getMonth()` 返回 0-11，写月份要 -1 或用 `getMonth() + 1`；`getDay()` 是星期（0 为周日）。
3. 时区偏移：`getTimezoneOffset()` 返回的是「UTC 减本地」的分钟数，UTC+8 返回 -480，符号与直觉相反。
4. 工程实践：存储与传输统一用 UTC 时间戳或带 `Z` 的 ISO 字符串；展示时用 `Intl.DateTimeFormat` 或 dayjs 指定 `timeZone` 转换，避免手写拼接。

```js
new Date('2024-01-01');            // UTC 零点的本地表示
new Date('2024-01-01T00:00:00');   // 本地零点
new Date('2024-01-01').toISOString(); // '2024-01-01T00:00:00.000Z'
```

**追问与易错点**：

- 追问：怎么格式化成本地时间？——`new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai' }).format(date)`，不受运行环境时区影响。
- 陷阱：用 `date.toISOString().slice(0, 10)` 当「本地日期」，在 UTC+8 的晚上会得到前一天的日期。

### Q33 JavaScript 字符串和 Unicode 是什么关系？`codePointAt` 有什么用？

**考察点**：考 UTF-16 码元与码点的区别，能解释 emoji 的 length 就是 2 即算过关。

**参考答案**：

> **一句话结论**：JavaScript 字符串是 UTF-16 码元（code unit）序列，一个码点可能占两个码元（代理对），所以一个 emoji 的 `length` 是 2，要按码点处理就得用 `codePointAt`/`fromCodePoint`。

1. 码元 vs 码点：`charCodeAt` 返回的是码元值（代理对的高位在 0xD800-0xDBFF），`codePointAt` 返回完整码点（如 0x1F44D）；`String.fromCodePoint` 能正确构造。
2. 正确遍历：`for...of` 和展开运算符按码点迭代，能避免把 emoji 拆成两半；`split('')` 和 `charAt` 则按码元，会拆坏。
3. 长度计算：要数字素（用户感知的字符）得用 `Intl.Segmenter`（ES2022）或 `[...str].length`（按码点，仍不是字素）。
4. 正则在 ES2018 后支持 `u` 标志，`/^.$/u.test('\u{1F44D}')` 为 true，不加 `u` 则为 false。

```js
const emoji = '\u{1F44D}';           // 一个 emoji，占 2 个 UTF-16 码元
emoji.length;                        // 2
[...emoji].length;                   // 1
emoji.codePointAt(0).toString(16);   // '1f44d'
String.fromCodePoint(0x1f44d) === emoji; // true
```

**追问与易错点**：

- 追问：怎么用代码截断长文本不截坏 emoji？——用 `Intl.Segmenter` 按字素切分，或至少用 `Array.from(str).slice(0, n).join('')`。
- 陷阱：用 `str.length` 做字符数校验（如昵称最多 10 字），emoji 会被算成 2 个，产品与用户都会发现不对。

### Q34 `normalize()` 是做什么的？字符串比较有哪些隐藏坑？

**考察点**：深挖题，考 Unicode 等价性；知道「同一个字符可能有多种编码」就能答出关键。

**参考答案**：

> **一句话结论**：Unicode 允许同一字符有多种等价编码，`normalize()` 把字符串统一成同一种形式，比较或存储前先 normalize 才能避免「看起来一样却不相等」。

1. 典型例子：`'é'` 可以是单码点 U+00E9，也可以是 `'e'` + 组合符 U+0301，前者 length 为 1、后者为 2，但显示完全相同，`===` 直接比较为 false。
2. 四种形式：NFC（组合，最常用）、NFD（分解）、NFKC/NFKD（兼容分解，会把全角、罗马数字、连字等归一化，公式与搜索场景要慎用，因为会改变含义）。
3. 使用建议：用户输入做去重、搜索、账号名比对时先 `normalize('NFC')`；仅在排序/模糊匹配场景考虑 NFKC。
4. 相关坑：大小写比较用 `toLowerCase` 对某些语言不准（土耳其语 i），英文场景建议 `localeCompare` 或 `Intl.Collator` 做不区分大小写的比较。

```js
const a = '\u00e9';          // 'é'
const b = 'e\u0301';         // 'e' + 组合符
a === b;                     // false
a.length;                    // 1
b.length;                    // 2
a.normalize('NFC') === b.normalize('NFC'); // true
```

**追问与易错点**：

- 追问：normalize 会影响中文吗？——中文汉字一般不受影响，但全角/半角、兼容字符在 NFKC 下会变化，因此默认用 NFC 更安全。
- 陷阱：以为 `'é'.length` 永远是 1，用 length 做截断或校验时被组合字符坑到。

### Q35 `for...in` 和 `for...of` 有什么区别？

**考察点**：基础必考，核心是「遍历键还是值」「依赖什么协议」「能遍历什么」三点。

**参考答案**：

> **一句话结论**：`for...in` 遍历对象的可枚举属性名（含原型链），`for...of` 遍历可迭代对象（iterable）的值，依赖 `Symbol.iterator`。

1. 遍历目标：`for...in` 可用于普通对象和数组（数组拿到的是索引字符串）；`for...of` 用于数组、字符串、Map、Set、arguments、NodeList、生成器，普通对象直接遍历会抛 TypeError。
2. 内容与顺序：`for...in` 给的是键且顺序不保证（还有原型链干扰）；`for...of` 给的是值，顺序与迭代器定义一致（Map 迭代 `[key, value]` 对）。
3. 特殊能力：`for...of` 支持解构（`for (const [k, v] of map)`）、可与 `Array.from`/展开互通；`for...in` 想只遍历自身属性要配 `Object.hasOwn` 过滤。
4. 选择建议：数组和可迭代对象一律 `for...of`；只有需要遍历对象键且明确要含继承属性时才用 `for...in`，否则用 `Object.keys`。

```js
const arr = ['a', 'b'];
for (const i in arr) console.log(i);   // '0' '1'
for (const v of arr) console.log(v);   // 'a' 'b'
for (const v of { a: 1 }) {}           // TypeError: not iterable
```

**追问与易错点**：

- 追问：怎么让普通对象支持 `for...of`？——给它加 `[Symbol.iterator]` 方法，或直接 `for (const [k, v] of Object.entries(obj))`。
- 陷阱：用 `for...in` 遍历数组并期望索引是数字，实际是字符串，`i + 1` 会变成拼接。

### Q36 为什么说 `+` 是 JavaScript 里最危险的运算符？

**考察点**：考加号的多义性与转换顺序，能说清「任一操作数转成字符串就拼接」即过关。

**参考答案**：

> **一句话结论**：`+` 既是一元取正（转数字）又是二元加法/拼接，二元时先对操作数做 ToPrimitive，只要有一个是字符串就执行拼接，否则执行数值加法。

1. 判断顺序：先算 `ToPrimitive(x, default)`，再看两侧是否出现字符串——只要有字符串就拼串，否则都转数字相加。
2. 从左到右结合：`1 + 2 + '3'` 得 `'33'`（先算成 3 再拼串），`'3' + 1 + 2` 得 `'312'`（第一步就变字符串），顺序不同结果完全不同。
3. 一元 `+x`：等价于 `Number(x)`，`+'12'` 得 12、`+''` 得 0、`+'12px'` 得 NaN、`+[]` 得 0、`+{}` 得 NaN；常用于快速转数字，但要注意空串变 0。
4. 避免事故：数值相加前显式 `Number()` 或用 `parseInt`，字符串拼接统一用模板字符串，团队里开启 `no-implicit-coercion` 一类规则。

```js
1 + 2 + '3';      // '33'
'3' + 1 + 2;      // '312'
1 + '2';          // '12'
[] + {};          // '[object Object]'
```

**追问与易错点**：

- 追问：`[] + {}` 为什么是 `'[object Object]'`？——`[]` 转成 `''`，`{}` 转成 `'[object Object]'`，然后是字符串拼接。
- 陷阱：表达式位置写 `{} + []`，`{}` 会被当成语句块，结果是 0，这是 ASI 与语法歧义造成的经典迷惑行为，面试提到可加分。

### Q37 `parseInt` 有哪些陷阱？`['1','2','3'].map(parseInt)` 输出什么？

**考察点**：经典陷阱题，答案是 `[1, NaN, NaN]`，关键要能解释 map 传了索引作基数。

**参考答案**：

> **一句话结论**：`parseInt(string, radix)` 的第二个参数是基数，只传函数引用时 map 会把索引当基数传进去，所以 `['1','2','3'].map(parseInt)` 得到 `[1, NaN, NaN]`。

1. 原因：`map` 回调签名是 `(item, index, array)`，第三次调用变成 `parseInt('3', 2)`——二进制里没有 3，返回 NaN；第二次是 `parseInt('2', 1)`，基数 1 非法，也返回 NaN。
2. 正确写法：`arr.map((s) => parseInt(s, 10))` 或 `arr.map(Number)`。
3. 其他陷阱：`parseInt('12px')` 得 12（解析到非法字符为止），而 `Number('12px')` 得 NaN；`parseInt('1e3')` 得 1（只解析到 e）；`parseInt('0x10')` 得 16（不传基数时按 0x 前缀识别为十六进制），传 10 则得 0。
4. 安全建议：始终显式传基数 10，需要严格校验用 `Number()` + `Number.isNaN` 或正则。

```js
['1', '2', '3'].map(parseInt);        // [1, NaN, NaN]
['1', '2', '3'].map((s) => parseInt(s, 10)); // [1, 2, 3]
parseInt('1e3');                      // 1
parseInt(1e21);                       // 1，因为先转成 '1e+21'
```

**追问与易错点**：

- 追问：`parseInt(0.0000005)` 呢？——先转字符串 `'5e-7'`，解析到 e 停止，得到 5，是隐性 bug。
- 陷阱：以为 `parseInt` 会做四舍五入或严格解析，「解析到不能解析为止」这个特性最容易被忽略。

### Q38 对象转字符串和转数字时，分别调用 `toString` 还是 `valueOf`？

**考察点**：进阶题，考调用优先级；能说出「看 hint，且 `+` 走 default」就是高分。

**参考答案**：

> **一句话结论**：优先看是否定义了 `Symbol.toPrimitive`；否则转数字的场合先 `valueOf` 后 `toString`，转字符串的场合先 `toString` 后 `valueOf`，`+` 和 `==` 属于 default（除 Date 外按数字顺序）。

| 表达式 | hint | 调用顺序 |
| --- | --- | --- |
| `Number(obj)`、`obj - 1`、`+obj` | number | valueOf → toString |
| `String(obj)`、`\`${obj}\``、`obj['k']` | string | toString → valueOf |
| `obj + ''`、`obj == 1` | default | valueOf → toString |
| `new Date() + ''` | default | Date 特殊：toString → valueOf |

1. 返回第一个原始值即停止；若两步都返回对象，抛 TypeError。
2. `Symbol.toPrimitive` 优先级最高，接收 `'number' | 'string' | 'default'` 参数，可完全接管转换逻辑。
3. 现代 `Date` 是唯一在 default 下按字符串处理的常见内置对象，所以 `new Date() + 1` 得到时间字符串拼接，而不是时间戳相加。

**追问与易错点**：

- 追问：为什么推荐用 `Symbol.toPrimitive` 而不是分别写 toString/valueOf？——它显式区分三种场景，避免 toString/valueOf 顺序带来的隐式歧义，也是 dayjs 这类库的做法。
- 陷阱：只重写 `toString` 却发现 `obj + 1` 没有走它，因为 default 先调了 `valueOf`。

### Q39 判断属性存在有哪几种方式？`in` 和 `hasOwnProperty` 有什么区别？

**考察点**：考「自身属性 vs 原型链」与安全写法，`Object.hasOwn` 是 ES2022 新 API，答出加分。

**参考答案**：

> **一句话结论**：`key in obj` 会沿原型链查找，`Object.hasOwn(obj, key)`（或 `hasOwnProperty`）只查自身属性，判断「是不是自己的属性」必须用后者。

1. `in` 的规则：`'toString' in {}` 为 true，因为原型链上有；它也能判断数组索引是否存在（稀疏数组的空洞返回 false）。
2. `hasOwnProperty` 的坑：`Object.create(null)` 创建的对象没有这个方法，直接调用抛 TypeError；对象也可以自己重写该方法。安全写法是 `Object.hasOwn(obj, key)`（ES2022）或 `Object.prototype.hasOwnProperty.call(obj, key)`。
3. 判断「值是否为 undefined」不能只看 `obj.key !== undefined`：属性存在但值是 undefined 时同样成立，要配合 `in` 或 `Object.hasOwn`。
4. Symbol 键三种方式都支持，`in` 与 `Object.hasOwn` 都能判断。

```js
'toString' in {};                     // true
Object.hasOwn({}, 'toString');        // false
Object.prototype.hasOwnProperty.call({ a: 1 }, 'a'); // true
0 in [, 1];                           // false（索引 0 是空洞）
```

**追问与易错点**：

- 追问：`Object.hasOwn` 兼容性？——ES2022，Node 16.9+ 与较新浏览器支持，老环境用 `Object.prototype.hasOwnProperty.call`。
- 陷阱：用 `typeof obj.key !== 'undefined'` 判断字段是否存在，字段存在但值为 undefined 时会误判为不存在。

### Q40 `delete` 删除属性有什么代价？

**考察点**：深挖题，考引擎优化（隐藏类）认知，能说出「破坏对象形状、数组留下空洞」就达标。

**参考答案**：

> **一句话结论**：`delete` 会破坏对象的隐藏类（Hidden Class / Shape），使对象退化为字典模式，后续属性访问变慢；删除数组元素还会产生稀疏空洞。

1. 引擎层面：V8 为结构相同的对象复用隐藏类，属性访问走固定偏移；`delete` 改变对象结构，最坏情况下对象转入字典模式（dictionary mode），读写都要哈希查找。
2. 数组层面：`delete arr[1]` 不改变 length，只留下空洞（hole），遍历时出现 undefined，且破坏数组的元素种类（Elements Kind），可能退回慢速路径。
3. 正确替代：把值置为 null/undefined 保留结构；数组用 `splice` 或 `filter` 重建；需要频繁增删键用 `Map`（专为动态键设计）。
4. 语义限制：`delete` 只能删除自身、可配置（configurable: true）的属性，删不可配置属性在严格模式抛 TypeError，非严格模式静默失败并返回 false。

```js
const obj = { a: 1, b: 2 };
delete obj.a;                 // 结构被破坏
obj.a = undefined;            // 更好：保留形状

const arr = [1, 2, 3];
delete arr[1];                // [1, <1 empty item>, 3]，length 仍为 3
arr.splice(1, 1);             // 更合适
```

**追问与易错点**：

- 追问：删除对象属性的替代方案是什么？——用解构剔除后重建：`const { a, ...rest } = obj;`。
- 陷阱：以为 `delete obj.x` 会释放内存，实际上对象仍在，只改变了属性表；频繁 delete 的缓存结构应换成 Map。

### Q41 为什么老代码用 `void 0` 代替 `undefined`？

**考察点**：深挖题，考历史背景与 `undefined` 是否可被改写，能说清现代代码不需要这么写就是完整答案。

**参考答案**：

> **一句话结论**：`void 0` 求值任何表达式都返回真正的 undefined，历史上用于防止局部变量 `undefined` 被遮蔽；ES5 之后全局 `undefined` 已不可写，现代代码直接写 undefined 即可。

1. `void` 是运算符，`void 表达式` 会求值表达式但返回 undefined；`void 0` 是最短的写法，有些压缩工具也保留这种输出。
2. 历史原因：ES5 之前全局 `undefined` 是可写属性，能被赋成别的值；即使在 ES5 之后，函数形参或局部变量仍可命名为 undefined 造成遮蔽。
3. 相关注意：不能给 `undefined` 赋值？——现代环境里它是只读的全局属性，赋值在严格模式抛 TypeError，非严格模式静默失败；局部遮蔽只是命名巧合，不是修改了全局值。
4. 结论：新代码直接用 undefined；`void 0` 只在阅读老库源码、或需要「保证 undefined 且不在意副作用」时见到。

```js
void 0;            // undefined
void 'abc';        // undefined（表达式仍然求值）
let x = 1; void x; // undefined，x 的值被求值但结果被丢弃
```

**追问与易错点**：

- 追问：`void 0` 和 `undefined` 性能有差别吗？——没有实际差异，只是历史防御性写法。
- 陷阱：把 `undefined` 当成关键字，它其实是全局对象的一个属性（`'undefined' in window` 为 true 的老环境语境）。

### Q42 严格模式改变了哪些基础行为？

**考察点**：考 `'use strict'` 的实际影响，至少要说出「未声明赋值报错」「this 不再指向全局」「静默失败变抛错」三类。

**参考答案**：

> **一句话结论**：严格模式把大量静默失败改成抛错，并切断 `this` 的自动装箱与 `arguments` 联动，让代码更安全也更容易发现 bug。

1. 变量与语法：未声明就赋值抛 ReferenceError（不再污染全局）；禁止 `with`；禁止八进制字面量 `0123`；禁止 `delete 变量名`。
2. this 行为：普通函数调用的 this 是 undefined，不再自动指向全局对象；配合 `call(null)` 也不再装箱成全局对象。
3. 静默失败变抛错：给不可写属性/只读属性赋值、给原始值设属性、删除不可配置属性、`eval` 中声明的变量污染外层，都会抛 TypeError/SyntaxError。
4. 其他：函数参数不能重名；形参与 arguments 不再双向联动；块级函数声明有明确作用域规则。ES 模块和 class 内部默认就是严格模式，所以现代项目常无需显式声明。

```js
'use strict';
function f() { return this; }
f();                 // undefined，非严格模式下是全局对象
undeclaredVar = 1;   // ReferenceError
const s = 'a';
s.x = 1;             // TypeError，非严格模式静默失败
```

**追问与易错点**：

- 追问：Vue/React 项目里还需要手写 `'use strict'` 吗？——打包后的模块代码本身是 ESM，天然严格；只有非模块的老式脚本才需要显式声明。
- 陷阱：以为严格模式限制的是「性能层面」，它主要影响的是语义和错误处理，不会自动提升运行速度。

### Q43 `Number()`、`parseInt()`、一元 `+` 有什么区别？

**考察点**：考显式类型转换的规则差异，面试官常用它带出隐式转换的整张规则表。

**参考答案**：

> **一句话结论**：三者都是转数字，但 `Number()` 与一元 `+` 要求整个字符串合法（否则 NaN），`parseInt` 只要求前缀合法（解析到非法字符就停）。

1. `Number()` 与 `+x`：空串和空白串得 0；`null` 得 0；`undefined` 得 NaN；`'12px'` 得 NaN；`[]` 得 0；`[1]` 得 1；`[1,2]` 得 NaN；`{}` 得 NaN。
2. `parseInt`：`'12px'` 得 12，`'1e3'` 得 1，需显式传基数 10。
3. `Boolean()` 的规则最简单：只有 8 个假值返回 false（`'0'`、`[]`、`{}` 都是 true）。
4. 其他隐式转换入口：`-`、`*`、`/`、`%`、比较运算符（除 `==`/`===`）都会转数字；字符串拼接由 `+` 触发；`==` 走前面讲的 ToPrimitive 流程。

```js
Number('');        // 0
Number(' 12 ');    // 12
Number('12px');    // NaN
parseInt('12px');  // 12
Number(null);      // 0
Number(undefined); // NaN
Boolean('0');      // true
```

**追问与易错点**：

- 追问：`Number([])` 为什么是 0？——数组转原始值得到空字符串，再转数字是 0。
- 陷阱：用 `Number(x) || 0` 兜底，x 是负数或 NaN 时结果会意外变成 0，兜底应配合 `Number.isFinite` 判断。

### Q44 为什么会有 `-0`？什么时候必须区分 `0` 和 `-0`？

**考察点**：深挖题，考 IEEE 754 的符号位与 SameValue 语义，答出「Map 键把它们视为相同」是加分点。

**参考答案**：

> **一句话结论**：IEEE 754 有独立符号位，`-0` 是合法值；`-0 === 0` 为 true，只有 `Object.is(-0, 0)` 为 false，需要区分正负号时必须用它。

1. 产生方式：`-0`、`0 * -1`、`-1 / Infinity`、`Math.round(-0.4)` 等；`1 / -0` 得 `-Infinity`，`1 / 0` 得 `Infinity`。
2. 字符串与序列化：`String(-0)` 是 `"0"`，`JSON.stringify(-0)` 也是 `"0"`，符号在转换中丢失；`(-0).toFixed(0)` 同样得 `"0"`（规范只按 `x < 0` 判断负号，`-0` 不满足）。
3. 相等语义三套并存：`===`（严格相等，±0 相等、NaN 不等）把 ±0 视为相等；`Object.is`（SameValue）区分；`Map`/`Set` 的键用 SameValueZero，把 `0` 与 `-0` 视为同一个键、把 NaN 视为同一个键。
4. 实用场景：图形/物理计算判断方向、金融显示负数零、依赖指纹与缓存键需要精确区分时，用 `Object.is(x, -0)` 或 `1 / x === -Infinity` 判断。

```js
-0 === 0;             // true
Object.is(-0, 0);     // false
1 / -0;               // -Infinity
JSON.stringify(-0);   // '0'
new Map([[0, 'a']]).get(-0); // 'a'，SameValueZero
```

**追问与易错点**：

- 追问：`[-0].indexOf(0)` 结果是什么？——0，indexOf 用严格相等比较，不区分 ±0。
- 陷阱：以为 `-0` 是假值之外的什么特殊值，它本身就是假值，`Boolean(-0)` 为 false，进 `if` 判断时与 0 表现一致。

## 本章小结

- typeof 只有 8 种结果，`typeof null === 'object'` 是历史遗留；精确判断类型用 `Object.prototype.toString.call` 与 `Array.isArray`。
- 假值只有 8 个（false、0、-0、0n、''、null、undefined、NaN），空数组、空对象、`'0'` 全是真值，判断数字别用 `if (x)`。
- 默认一律用 `===`，唯一的例外惯用法是 `x == null`；`??` 只兜 null/undefined，`||` 会连 0 和空串一起吞掉。
- 浮点数遵循 IEEE 754，`0.1 + 0.2 !== 0.3`；金额用整数化（分）+ BigInt 或定点库，比较用容差，不要依赖 `toFixed` 做严格舍入。
- 对象比较的是引用地址，浅拷贝只复制一层并共享嵌套引用；深拷贝首选 `structuredClone`，需要保留类实例时才手写（WeakMap 处理循环引用）。
- 类型转换走 ToPrimitive：转数字先 `valueOf`、转字符串先 `toString`、`+` 与 `==` 走 default，`Symbol.toPrimitive` 优先级最高。
- `for...in` 遍历可枚举键（含原型链、拿不到 Symbol），`for...of` 遍历可迭代对象的值；对象要转数组再遍历。
- 日期与字符串都有编码坑：ISO 日期形式按 UTC 解析、`getMonth()` 从 0 开始；字符串按 UTF-16 码元计数，emoji 与组合字符要按码点或字素处理。

<!-- COUNT: 44 -->

