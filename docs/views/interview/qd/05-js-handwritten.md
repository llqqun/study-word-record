---
title: "第 5 章 JavaScript 手写实现题"
---

## 第 5 章 JavaScript 手写实现题

手写题是笔试与白板环节的淘汰区：面试官不看你能不能背下来，只看三件事——**边界处理是否严谨、能否说清每一步为什么这么写、复杂度与代价是否清楚**。本章每题给出可直接运行的完整实现，答题时按「先说思路 → 写代码 → 主动补边界与复杂度 → 指出常见坑」的顺序口述，比闷头写代码得分更高。

### Q1 手写一个 call，说说你为什么这么写？

**考察点**：考对 `this` 绑定规则与函数内部机制的理解，答到「临时把函数挂到目标对象上再调用，用完删除」即过关。

**参考答案**：

> **一句话结论**：`call` 的本质是**把函数临时挂到目标对象上，以方法调用形式执行，从而让 `this` 指向目标对象**，执行完立刻删除这个临时属性。

1. 核心思路：JS 里只有一种方式能可靠指定 `this`——`obj.fn()` 形式调用。所以 `ctx[key] = this`，再 `ctx[key](...args)`，最后 `delete ctx[key]`。
2. 用 `Symbol` 作为临时键，避免覆盖对象上同名属性（用字符串键如 `fn` 会真的污染对象）。
3. 边界一：`ctx` 为 `null` / `undefined` 时，非严格模式下 `this` 指向全局对象（`globalThis`）；为原始值（数字、字符串）时要装箱成对象，否则严格模式下会报错。
4. 边界二：必须校验调用者类型，`Function.prototype.myCall.call(123)` 这类用法要抛 `TypeError`。

```js
Function.prototype.myCall = function (ctx, ...args) {
  if (typeof this !== 'function') throw new TypeError('myCall must be called on a function');
  // null/undefined → 全局对象；原始值 → 装箱对象
  ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
  const key = Symbol('fn');          // 唯一键，不污染原对象
  ctx[key] = this;
  try {
    return ctx[key](...args);        // 方法调用，this 绑定成功
  } finally {
    delete ctx[key];                 // 抛错也必须清理
  }
};
```

5. 复杂度：时间、空间均为 O(1)（只做常数次属性读写），不存在遍历成本。

**追问与易错点**：

- 追问：如果函数执行时抛异常，`delete ctx[key]` 还会执行吗？答不会，更严谨的写法是 `try/finally`，或者干脆用 `Reflect.apply`——它不需要挂属性，是原生能力。
- 陷阱：直接用字符串键 `ctx.fn = this`。若对象上本来就有 `fn` 属性，会被覆盖且永久丢失，这是最常见的扣分点。
- 陷阱：忘记 `delete`，导致借调后对象上多出一个不可预期的函数属性，用 `Object.keys` 会被枚举出来。

### Q2 手写 apply，它和 call 的实现差别在哪？

**考察点**：考参数传递形式的差异，以及 `apply` 对「类数组参数」的处理，属于 call 的延伸但考察细节更细。

**参考答案**：

> **一句话结论**：`apply` 与 `call` 的机制完全一样，唯一区别是**第二个参数接收一个数组或类数组**，其余逻辑共用。

1. 把 `call` 的实现原样搬过来，只把参数从「剩余参数」换成「一个数组参数」。
2. 边界一：第二个参数不传时按空数组处理；传 `null` 时同样按空数组处理（规范就是如此）。
3. 边界二：`apply` 接收的是**类数组**（有 `length`），不要求是真正的 `Array`，所以要用 `Array.from` 转换后再展开，否则 `arguments` 这类对象会展开失败。
4. 与 `call` 的关系：`call` 可以用 `apply` + 数组包装实现，反之亦然；实际工程里参数确定用 `call`，参数已是数组用 `apply`（如 `Math.max.apply(null, arr)`，现代写法是 `Math.max(...arr)`）。

```js
Function.prototype.myApply = function (ctx, args) {
  if (typeof this !== 'function') throw new TypeError('myApply must be called on a function');
  ctx = ctx === null || ctx === undefined ? globalThis : Object(ctx);
  const list = args == null ? [] : Array.from(args);   // 兼容 arguments 等类数组
  const key = Symbol('fn');
  ctx[key] = this;
  try {
    return ctx[key](...list);
  } finally {
    delete ctx[key];                                    // 异常也要清理
  }
};
```

5. 复杂度：O(n)，n 为参数个数（`Array.from` 需要遍历类数组），空间 O(n)。

**追问与易错点**：

- 追问：`Array.prototype.slice.call(arguments)` 和 `Array.from(arguments)` 有什么区别？答：前者靠 `slice` 的通用性，对纯类数组有效但处理不了 `Symbol.iterator` 语义；`Array.from` 同时支持类数组与可迭代对象。
- 陷阱：写成 `args = args || []`，当 `args` 是 `0`、`''` 这类假值时语义被改坏；应显式判断 `== null`。
- 陷阱：以为 `apply` 能突破参数个数限制。参数过多时展开会受引擎实参上限限制，应当直接传数组。

### Q3 手写 bind，要求支持 new 调用不改变 this

**考察点**：考闭包 + `this` 绑定 + 原型链三件事的组合，`new` 兼容是区分「背过」和「真懂」的分水岭。

**参考答案**：

> **一句话结论**：`bind` 返回一个**绑定函数**，调用时用 `apply` 把 `this` 固定为传入的上下文；若这个绑定函数被 `new` 调用，则**忽略绑定的 this**，按正常构造流程走。

1. 核心思路：返回一个闭包，内部用「预设参数 + 调用时参数」拼接后 `apply` 到目标函数上。
2. 关键分支：用 `this instanceof 绑定函数` 判断当前是否被 `new` 调用。是 `new` 调用时 `this` 是新创建的实例，必须把这个 `this` 透传给目标函数，绑定的 `ctx` 失效。
3. 原型链：`new` 出来的实例要能访问原函数的原型方法，所以让绑定函数的 `prototype` 指向 `Object.create(原函数.prototype)`。
4. 与 `call`/`apply` 的差别：`bind` **不立即执行**，且绑定不可再被 `call` 改掉（但被 `new` 调用时优先级更高）。

```js
Function.prototype.myBind = function (ctx, ...preset) {
  if (typeof this !== 'function') throw new TypeError('myBind must be called on a function');
  const target = this;
  function boundFn(...args) {
    const isNew = this instanceof boundFn;              // 被 new 调用
    return target.apply(isNew ? this : ctx, [...preset, ...args]);
  }
  // 维持原型链：实例能访问 target.prototype 上的方法
  boundFn.prototype = target.prototype
    ? Object.create(target.prototype)
    : undefined;
  return boundFn;
};
```

5. 复杂度：O(n)（参数拼接），空间 O(n)；每次调用会创建一次参数数组，高频场景要注意开销。

**追问与易错点**：

- 追问：为什么 `bind` 之后用 `call` 改不掉 `this`？答：绑定函数内部写死了 `target.apply(ctx, ...)`，外部再怎么传 `this` 都只影响绑定函数自己的 `this`，不影响写死的 `ctx`。
- 追问：箭头函数能 `bind` 吗？答：箭头函数的 `this` 在定义时词法固定，`bind` 无法改变，调用后 `this` 仍是外层作用域的值。
- 陷阱：用 `this instanceof boundFn` 判断的前提是原型链已被正确维护；若把 `boundFn.prototype` 指向别处，`new` 兼容判断就会失灵。

### Q4 手写 new，说明 new 到底做了哪几步

**考察点**：考对对象创建过程的完整还原，能说出「四步」并处理构造函数返回对象的情况即为过关。

**参考答案**：

> **一句话结论**：`new` 做四件事——**创建以构造函数原型为原型的空对象、把 this 绑定到该对象并执行构造函数、按返回值规则决定最终结果、维护原型链**。

1. 第一步：`Object.create(Ctor.prototype)`。用 `Object.create` 而不是 `{}`，是为了让实例的原型指向构造函数的 `prototype`，`instanceof` 才能成立。
2. 第二步：`Ctor.apply(obj, args)` 执行构造函数体，完成属性初始化，同时拿到返回值。
3. 第三步：返回值判定。若构造函数返回**对象或函数**，就丢弃第一步创建的对象，返回这个返回值；返回**原始值或不返回**时，返回第一步创建的对象。这是 `null` 也要判掉的原因（`typeof null === 'object'`）。
4. 第四步：类型校验。`Ctor` 必须是函数；箭头函数没有 `prototype`，不能被 `new`，原生会抛 `TypeError`。

```js
function myNew(Ctor, ...args) {
  if (typeof Ctor !== 'function') throw new TypeError('Ctor must be a function');
  if (!Ctor.prototype) throw new TypeError('Ctor is not a constructor');  // 箭头函数
  const obj = Object.create(Ctor.prototype);        // 1. 建立原型链
  const ret = Ctor.apply(obj, args);                // 2. 绑定 this 执行
  const isObject = ret !== null && (typeof ret === 'object' || typeof ret === 'function');
  return isObject ? ret : obj;                      // 3. 返回值判定
}
```

5. 复杂度：时间 O(1) 加构造函数自身开销，空间 O(1) 加实例大小。

**追问与易错点**：

- 追问：`new.target` 是干什么的？答：构造函数内用它判断「是否被 new 调用」，可用于禁止不带 `new` 调用，也是类不能被当普通函数调用的实现基础。
- 陷阱：返回值判断写成 `typeof ret === 'object'`，漏掉 `null` 判断，构造函数 `return null` 时会错误返回 `null`。
- 陷阱：忘记 `Array` 也是构造函数，`myNew(Array, 3)` 得到的应是 `[empty × 3]` 这类实例，而不是数组字面量——用原生 `apply` 就能天然支持。

### Q5 手写 instanceof，原型链是怎么走的？

**考察点**：考原型链遍历与原始值处理，是理解 `instanceof` 语义最直接的一题。

**参考答案**：

> **一句话结论**：`instanceof` 是**沿着左操作数的原型链一路向上查找，看是否出现右操作数的 `prototype`**，找到就返回 `true`，到 `null` 就返回 `false`。

1. 取值方式：用 `Object.getPrototypeOf(obj)` 逐级向上，而**不是** `obj.__proto__`。`__proto__` 是可被改写的访问器，不是可靠接口。
2. 边界一：左侧是原始值（数字、字符串、`null`、`undefined`）时直接返回 `false`，因为原始值没有原型链。
3. 边界二：右侧必须是函数且有 `prototype`，否则原生会抛 `TypeError: Right-hand side of 'instanceof' is not callable`。
4. 与 `typeof` 的分工：`typeof` 只能区分七种基础类型（且 `null` 和数组都判不细），`instanceof` 判的是「构造关系」，跨 iframe 或跨 Realm 时会失效，这类场景要用 `Object.prototype.toString`。

```js
function myInstanceof(left, right) {
  if (typeof right !== 'function' || !right.prototype) {
    throw new TypeError('Right-hand side of instanceof is not callable');
  }
  if (left === null || (typeof left !== 'object' && typeof left !== 'function')) {
    return false;                                   // 原始值直接 false
  }
  let proto = Object.getPrototypeOf(left);
  while (proto) {                                   // 走到 null 结束
    if (proto === right.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```

5. 复杂度：时间 O(d)，d 为原型链深度（通常个位数）；空间 O(1)。

**追问与易错点**：

- 追问：`Object.create(null)` 创建的对象，`instanceof Object` 是什么？答：`false`，因为它的原型链直接就是 `null`，不经过 `Object.prototype`。
- 陷阱：只比较一层 `Object.getPrototypeOf(left) === right.prototype`，把多级继承判错，如 `child instanceof Parent` 应为 `true`。
- 陷阱：以为基本包装类型也成立。`1 instanceof Number` 是 `false`（字面量不是对象），而 `new Number(1) instanceof Number` 才是 `true`。

### Q6 手写一个 getType，把 null、数组、日期都判对

**考察点**：考对类型判断各方案局限性的掌握，标准答案是 `Object.prototype.toString`。

**参考答案**：

> **一句话结论**：类型判断的可靠方案是 **`Object.prototype.toString.call(value)`**，它返回 `[object Xxx]`，切出中间部分统一小写即可拿到精确类型。

1. 为什么不用 `typeof`：数组和 `null` 都返回 `'object'`，分不出来；函数返回 `'function'` 但也属于对象范畴。
2. 为什么不用 `constructor`：属性可被改写，且跨 iframe 时构造函数不是同一个引用；`instanceof` 同理失效。
3. `toString` 的原理：它读取值的内部槽 `Symbol.toStringTag`（及内置品牌标记），因此 `Date`、`RegExp`、`Map`、`Set`、`Promise`、`Error` 都能精确区分；自定义类可用 `get [Symbol.toStringTag]()` 参与其中。
4. 注意它不是绝对安全：对象可自定义 `Symbol.toStringTag` 伪造结果，所以它适合做常规判断，不适合做安全校验。

```js
function getType(value) {
  // 原始值与包装对象都能正确处理
  const raw = Object.prototype.toString.call(value);   // "[object Date]"
  const type = raw.slice(8, -1).toLowerCase();         // "date"
  return type === 'number' && Number.isNaN(value) ? 'nan' : type;
}
// getType([]) → 'array'；getType(null) → 'null'；getType(new Map()) → 'map'
```

5. 复杂度：O(1)。

**追问与易错点**：

- 追问：`Number.isNaN` 和全局 `isNaN` 有什么区别？答：全局 `isNaN` 会先做 `Number()` 隐式转换，`isNaN('abc')` 为 `true`；`Number.isNaN` 只对真正的 `NaN` 返回 `true`。
- 追问：`Array.isArray` 为什么比 `instanceof Array` 好？答：它基于内部品牌检查，跨 Realm（如 iframe）也能正确判断，且不受原型被改写影响。
- 陷阱：写 `typeof [] === 'object'` 就断言"数组也是对象所以判对了"。面试官要的是「如何区分」，必须给出具体手段。

### Q7 手写一个浅拷贝，有哪些属性会丢？

**考察点**：考「浅」的边界——拷贝一层，引用类型共享；同时考 `Object.assign` 与展开运算符的差异。

**参考答案**：

> **一句话结论**：浅拷贝只复制**第一层的属性值**，引用类型属性拷贝的是同一个地址，改嵌套对象会互相影响。

1. 常见手段依次是：`Object.assign({}, obj)`、展开运算符 `{...obj}`、手写 `for...in`（要配 `hasOwnProperty`）、`Array.prototype.slice`（仅数组）。
2. 属性丢失点：`Object.assign` 与展开只处理**自有可枚举**属性，非枚举属性（`Object.defineProperty` 默认 `enumerable: false`）、原型上的属性、不可写属性都会丢或退化。
3. 访问器属性：`Object.assign` 触发 `get` 并写成普通数据属性，`getter/setter` 语义丢失；要保留描述符必须用 `Object.getOwnPropertyDescriptor` + `Object.defineProperty`。
4. `Symbol` 类型的键：`Object.assign` 与展开都会拷贝可枚举的自有 Symbol 键，这点比 `JSON` 深拷贝强，但 `for...in` 拿不到 Symbol。

```js
function shallowClone(target) {
  if (target === null || typeof target !== 'object') return target;
  const result = Array.isArray(target) ? [] : {};
  // 用 Reflect.ownKeys 同时覆盖字符串键与 Symbol 键
  Reflect.ownKeys(target).forEach((key) => {
    const desc = Object.getOwnPropertyDescriptor(target, key);
    if (!desc.enumerable) return;                    // 只拷可枚举属性
    if (desc.get || desc.set) {                      // 访问器原样保留
      Object.defineProperty(result, key, desc);
    } else {
      result[key] = target[key];                     // 引用类型仍是同一地址
    }
  });
  return result;
}
```

5. 复杂度：O(n)，n 为自有可枚举属性数；空间 O(n)。

**追问与易错点**：

- 追问：`{...obj}` 和 `Object.assign({}, obj)` 有区别吗？答：对普通对象结果基本一致，但 `Object.assign` 会触发目标对象的 setter，展开不会；另外 `Object.assign` 可接收多个源对象依次覆盖。
- 陷阱：宣称「浅拷贝够用了，性能比深拷贝好」却不区分场景。实际取舍是：嵌套数据不需独立时就该用浅拷贝，否则必须深拷贝。
- 陷阱：用 `JSON.parse(JSON.stringify(obj))` 当浅拷贝讲，这既不是浅拷贝，还会丢 `undefined`、`Date` 变字符串。

### Q8 深拷贝的基础版怎么写？JSON 方案有哪些坑？

**考察点**：考最常用的偷懒方案与其失效场景，重点是「知道什么时候不能用」。

**参考答案**：

> **一句话结论**：`JSON.parse(JSON.stringify(obj))` 是**最简单但最不可靠**的深拷贝，只适用于纯 JSON 数据，遇到函数、`undefined`、`Date`、循环引用就会出错或丢数据。

1. 可用场景：对象只由对象、数组、字符串、数字、布尔、`null` 组成，且无循环引用。此时它是真深拷贝，性能也不差。
2. 失效一：`undefined`、函数、`Symbol` 值会被直接丢弃（在数组里会变成 `null`），因为 `JSON` 没有这些类型。
3. 失效二：`Date` 变成 ISO 字符串，`RegExp` 变成空对象 `{}`，`Map`/`Set` 变成 `{}`，`NaN`/`Infinity` 变成 `null`。
4. 失效三：对象含循环引用时直接抛 `TypeError: Converting circular structure to JSON`；原型链、`getter`、不可枚举属性也全部丢失。

```js
// 仅用于确认数据是纯 JSON 的场合
function jsonClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}
// 反例：以下三种数据都拷不对
jsonClone({ fn: () => {}, d: new Date(), u: undefined });
// → { d: "2026-10-16T12:00:00.000Z" }，fn 与 u 消失
```

5. 复杂度：时间 O(n)，空间 O(n)，n 为序列化后的数据规模；额外有一次字符串分配的常数级开销。

**追问与易错点**：

- 追问：面试官问「`structuredClone` 你知道吗」怎么答？答：浏览器原生深拷贝 API，支持循环引用、`Date`、`Map`、`Set`、`ArrayBuffer`，但不支持函数、`Symbol` 和原型链上的类实例方法，且不能拷 DOM 节点。
- 陷阱：把 `JSON` 方案说成「深拷贝标准答案」。只要面试官给的数据里有 `Date` 或循环引用，当场翻车。
- 陷阱：忘记 `toJSON` 的影响。对象若定义了 `toJSON`，`JSON.stringify` 会调用它，得到的结构和原对象不同。

### Q9 手写完整深拷贝，要处理循环引用、Date、RegExp、Map、Set、Symbol

**考察点**：本章深挖题，考数据结构覆盖度与递归设计的严谨度，能做到「用 WeakMap 断环 + 保留原型 + 处理 Symbol 键」即为高分。

**参考答案**：

> **一句话结论**：完整深拷贝 = **递归遍历 + WeakMap 缓存已拷贝对象断掉循环引用 + 按类型分派（Date/RegExp/Map/Set 特殊处理）+ 保留原型与属性描述符**。

1. 断环：用一个 `WeakMap` 记录「原对象 → 拷贝结果」。进入函数先查缓存，命中直接返回；创建新对象后**立刻**写入缓存，再递归子属性。顺序不能反，否则循环引用仍会爆栈。
2. 原型保留：用 `Object.create(Object.getPrototypeOf(target))` 创建结果，这样类实例的方法、`getter` 定义都还在；数组仍走 `[]` 保证是数组。
3. 类型分派：`Date` 用 `new Date(+target)`；`RegExp` 用 `new RegExp(source, flags)`；`Map` 的键和值都要递归拷贝（键是对象时也要深拷）；`Set` 的每个元素递归拷贝。
4. 属性层：用 `Reflect.ownKeys` 一次拿到字符串键与 `Symbol` 键；遇到 `getter/setter` 用 `Object.defineProperty` 原样搬描述符，不要触发求值。
5. 复杂度：时间 O(n)，n 为所有可达属性总数；空间 O(n)（缓存 + 结果）。`WeakMap` 不阻止垃圾回收，比 `Map` 更合适。

```js
function deepClone(target, cache = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target;  // 含 Symbol/function
  if (cache.has(target)) return cache.get(target);                  // 断循环引用
  if (target instanceof Date) return new Date(target.getTime());
  if (target instanceof RegExp) return new RegExp(target.source, target.flags);
  if (target instanceof Map) {
    const m = new Map(); cache.set(target, m);
    target.forEach((v, k) => m.set(deepClone(k, cache), deepClone(v, cache)));
    return m;
  }
  if (target instanceof Set) {
    const s = new Set(); cache.set(target, s);
    target.forEach((v) => s.add(deepClone(v, cache)));
    return s;
  }
  const result = Array.isArray(target) ? [] : Object.create(Object.getPrototypeOf(target));
  cache.set(target, result);
  Reflect.ownKeys(target).forEach((key) => {
    const desc = Object.getOwnPropertyDescriptor(target, key);
    if (desc.get || desc.set) {                       // 访问器原样保留
      Object.defineProperty(result, key, desc);
    } else {
      result[key] = deepClone(target[key], cache);    // 数据属性递归
    }
  });
  return result;
}
```

**追问与易错点**：

- 追问：`WeakMap` 为什么比 `Map` 好？答：`Map` 会强引用原对象与拷贝结果，一次深拷贝大对象后就长期无法回收；`WeakMap` 的键是弱引用，拷贝结束后缓存可被 GC 回收。
- 追问：函数怎么拷？答：函数一般直接返回原引用（函数通常无状态）；若要连函数一起拷，只能靠 `eval` 重建或改为调用 `structuredClone` 加手动补函数，工程上不推荐。
- 陷阱：`cache.set` 写在递归子属性之后。这样 A→B→A 的结构会无限递归直到栈溢出，这是本题第一号扣分项。
- 陷阱：用 `Object.keys` 而非 `Reflect.ownKeys`，`Symbol` 键属性全部丢失；用 `for...in` 还会把原型上的可枚举属性拷进来，污染结果。

### Q10 手写防抖，要支持立即执行和 cancel

**考察点**：考高频工具函数的边界完整性，`immediate` 与 `cancel` 是区分「会用」和「手写过」的两个点。

**参考答案**：

> **一句话结论**：防抖（debounce）是**每次触发都重置计时器，只在停止触发 `wait` 毫秒后执行一次**；`immediate` 让第一次立刻执行，`cancel` 用于手动撤销待执行任务。

1. 基础版：每次调用 `clearTimeout(timer)` 再 `setTimeout`，天然实现「等安静下来再执行」。
2. 立即执行版：用「当前有无计时器」判断是否首次。首次同步执行函数并起计时器锁；`wait` 内再触发只重置计时器不执行，计时器到期解锁，下一轮才可能再立即执行。
3. 必须用 `fn.apply(this, args)` 而非 `fn(...args)` 直接调用，否则会丢掉调用者的 `this`；也要保留返回值（立即执行版才有意义）。
4. `cancel` 的意义：组件卸载、路由离开时取消防抖任务，避免调用已销毁组件的 `setState` 或访问已置空的 DOM。真实库（如 lodash）还提供 `flush` 立即结算。
5. 场景取舍：搜索框输入、表单校验、窗口 `resize` 结束事件用防抖；拖拽、滚动过程要持续反馈的用节流。

```js
function debounce(fn, wait = 300, immediate = false) {
  let timer = null;
  let result;
  function debounced(...args) {
    if (timer) clearTimeout(timer);
    if (immediate) {
      const callNow = !timer;                          // 计时器为空才算首触发
      timer = setTimeout(() => { timer = null; }, wait);
      if (callNow) result = fn.apply(this, args);
    } else {
      const ctx = this;
      timer = setTimeout(() => {
        timer = null;
        result = fn.apply(ctx, args);                  // 保留 this 与参数
      }, wait);
    }
    return result;
  }
  debounced.cancel = function () { clearTimeout(timer); timer = null; };
  return debounced;
}
```

6. 复杂度：每次触发 O(1)（`clearTimeout` + `setTimeout`），空间 O(1)。

**追问与易错点**：

- 追问：为什么立即执行版也要留计时器？答：计时器在这里承担「锁」的角色，标记 `wait` 时间窗内已经执行过，防止连续点击每次都立即触发。
- 陷阱：`this` 丢失。把 `fn.apply(this, args)` 写成 `fn(args)`，在 `obj.debounced()` 场景下 `fn` 内部的 `this` 会变成 `undefined`（严格模式）。
- 陷阱：参数用 `args` 但闭包捕获的是外层 `arguments`（用 `function` 而非箭头函数时 `arguments` 指向不明），现代写法直接用剩余参数最稳。

### Q11 手写节流，时间戳版和定时器版有什么差别？

**考察点**：考节流两种实现的语义差异与合并写法，是防抖/节流对照的标准追问。

**参考答案**：

> **一句话结论**：时间戳版**首次立即执行、停止触发后不再补执行**；定时器版**首次延迟 `wait` 执行、停止触发后会补执行最后一次**；合并版两者兼得。

1. 时间戳版：记录上次执行时间 `last`，每次触发比较 `now - last >= wait`，满足就执行并更新 `last`。优点是首触发立即响应；缺点是最后一次触发可能被丢弃。
2. 定时器版：用一个 `timer` 占位，触发时若已有定时器直接返回，到期执行并清空。优点是保证末次执行；缺点是首次要等 `wait`。
3. 合并版：`remain = wait - (now - last)`，`remain <= 0` 走立即执行分支并清掉可能存在的补执行定时器；否则在没有定时器时挂一个 `remain` 后执行的定时器。这样首尾都不丢。补执行时必须使用**最新一次**的参数与 `this`（用变量缓存下来），否则会拿「排期那一刻」的旧参数执行，滚动位置这类参数会明显滞后。
4. 关键差异：节流是**固定频率执行**（`wait` 内至少执行一次），防抖是**只执行最后一次**。滚动加载、`mousemove` 跟随用节流；搜索联想用防抖。
5. 复杂度：O(1) 每次触发；合并版多一次 `Date.now()`，可忽略。

```js
function throttle(fn, wait = 300) {
  let last = 0;
  let timer = null;
  let lastArgs = null;
  let lastThis = null;
  return function (...args) {
    lastArgs = args;                                   // 始终记住最新一次的参数与 this
    lastThis = this;
    const now = Date.now();
    const remain = wait - (now - last);
    if (remain <= 0) {                                 // 到点：立即执行
      if (timer) { clearTimeout(timer); timer = null; }
      last = now;
      fn.apply(this, args);
    } else if (!timer) {                               // 未到点：安排补执行
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(lastThis, lastArgs);                  // 补执行要用最新参数，不能用排期时的旧参数
      }, remain);
    }
  };
}
```

**追问与易错点**：

- 追问：`{ leading: false }` 怎么实现？答：用一个标志位记录是否为首次调用，首次直接返回不执行，同时起定时器走延迟分支，lodash 的 `leading`/`trailing` 选项就是这么处理的。
- 陷阱：把节流写成「`wait` 内第一次执行，之后全部忽略」而不补执行，导致滚动停止后最后一次状态没同步（如最后一张图没懒加载）——这是最常见的业务 bug。
- 陷阱：两者混用。节流内再套防抖不会叠加加速，反而让执行时机不可预期；应按事件语义只选一个。

### Q12 手写柯里化，怎么支持不定长参数？

**考察点**：考闭包、`fn.length` 的语义，以及「不定长参数如何确定结束」的判断，是函数式编程题的核心。

**参考答案**：

> **一句话结论**：柯里化（currying）把多参函数**转成一系列单参/部分参数的调用链**，靠比较「已收参数个数 ≥ `fn.length`」决定何时真正执行。

1. 基础版思路：返回一个 `curried`，每次收集参数；已收参数够 `fn.length` 就 `fn.apply` 执行，不够就返回新函数继续收集。细节：返回的「继续收集」函数是普通函数，第二次调用时 `this` 会丢，所以要在返回前把 `this` 存进变量，后面每一层都用它 `apply`。
2. `fn.length` 是**形参个数，不含默认值参数与剩余参数**。`function f(a, b = 1)` 的 `length` 是 1，`function f(...args)` 是 0，所以不定长函数不能靠 `length` 判断。
3. 不定长参数的两种确定方式：一是显式结束调用（如 `curried()` 无参调用时结算全部已收参数）；二是靠 `toString`/`valueOf` 隐式转换，让 `sum(1)(2)(3)` 在参与运算时自动求值。
4. 与偏函数（partial）的区别：柯里化一次固定一个（或几个）参数、逐次调用；偏函数一次性预置若干参数返回新函数。柯里化可以看成偏函数的连续特例。
5. 复杂度：每次调用 O(k)，k 为当次参数个数；闭包持有参数数组，空间 O(k)。

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);   // 参数够了
    const ctx = this;                                  // 记住本次 this，后续调用沿用它
    return function (...rest) {
      return curried.apply(ctx, [...args, ...rest]);    // 继续收集
    };
  };
}

// 不定长：无参调用结算；靠 valueOf 参与运算时求值
function currySum(...init) {
  const sum = (...args) => currySum(...init, ...args);
  sum.valueOf = () => init.reduce((a, b) => a + b, 0);
  sum.toString = () => String(sum.valueOf());
  return sum;
}
// currySum(1)(2)(3).valueOf() === 6；Number(currySum(1)(2)) === 3
```

**追问与易错点**：

- 追问：柯里化有什么实际价值？答：参数复用（提前固化配置）、延迟执行（先收集后统一执行）、配合 `compose` 简化函数组合；代价是多层闭包与调用开销，且调试栈变深。
- 陷阱：用 `fn.length` 处理带默认值的函数。`(a, b = 2) => a + b` 柯里化后 `curry(f)(1)` 会立即执行（默认值生效得 3，而不是继续等第二参），这是最常见的翻车点。
- 陷阱：不定长版返回的是函数对象，直接 `console.log` 会打印函数字符串，必须靠 `valueOf`/`toString` 才能当数字用；面试时主动说明这一点是加分项。

### Q13 手写 compose 和 pipe，两者方向差在哪？

**考察点**：考函数组合（function composition）的实现与执行方向，常配合中间件、`redux` 增强器场景追问。

**参考答案**：

> **一句话结论**：`compose` 是**从右到左**组合（`compose(f, g, h)(x) === f(g(h(x)))`），`pipe` 是**从左到右**组合，两者只是数据流动方向相反。

1. 实现骨架：把函数数组用 `reduce` 折叠成一个函数，用闭包累积「已组合的调用链」。`compose` 用 `a => b => a(b(x))` 的顺序折叠，`pipe` 用 `reduce` 正向折叠即可，二者可互相用 `reverse()` 转换。
2. 首函数参数：组合后的函数只有最内层（compose 的最后一个、pipe 的第一个）能接收多参数，其余函数都只接收上一级的一个返回值——这是组合的硬约束。
3. 边界处理：无参数时返回恒等函数（`x => x`）；只有一个函数时直接返回该函数，避免多包一层。这属于常见的加分细节。
4. 实际应用：`koa`/`redux` 中间件、`webpack` loader 链、`RxJS` 操作符都是组合思想；`pipe` 更贴合人的阅读顺序，工具库 `ramda` 同时提供两个名字。

```js
// 从右到左：compose(f, g, h)(x) === f(g(h(x)))
const compose = (...fns) => {
  if (fns.length === 0) return (x) => x;                 // 恒等函数
  return fns.reduce((acc, fn) => (...args) => acc(fn(...args)));
};
// 从左到右：pipe(f, g, h)(x) === h(g(f(x)))
const pipe = (...fns) => compose(...fns.reverse());
// pipe(x => x + 1, x => x * 2)(3) === 8
```

5. 复杂度：组合阶段 O(n)；调用阶段等价于逐层调用，时间 O(n)、栈深 O(n)。

**追问与易错点**：

- 追问：为什么组合方向会被面试官反复考？答：因为它决定数据流动与代码可读性，答错方向说明没真正用过；说清「`reduce` 正向折叠得到的语义方向」比背结论更可靠。
- 陷阱：把 `compose` 写成 `reduceRight` 却按 `pipe` 描述，结果方向对了但解释错了，追问「刚才那个函数先执行哪个」时立刻暴露。
- 陷阱：忘记异步函数组合需要用 `async` 包装或依赖 `Promise` 链，直接用 `compose` 组合异步函数会得到一堆 `Pending` 的 Promise。

### Q14 手写一个简化版 Promise，要有状态机和异步 then

**考察点**：本章第一深挖题，考状态机、回调队列、异步调度与链式 `then`，能讲清「状态不可逆」和「then 必须异步执行」即为高分。

**参考答案**：

> **一句话结论**：Promise 是一个**三态状态机**（`pending` → `fulfilled` / `rejected`，且不可逆），未定态时把回调存进队列，定态后按序**异步**执行回调，并返回新 Promise 以支持链式调用。

1. 状态设计：`state` 记录 `pending/fulfilled/rejected`，`value` 记录结果或原因，`callbacks` 数组缓存 `then` 注册的回调。`settle` 里先判 `state !== pending` 直接返回，保证多次 `resolve` 只有第一次生效。
2. 异步保证：回调绝不能同步执行，否则 `then` 注册顺序与执行顺序会错乱（Promise A+ 规范要求）。实现里用 `queueMicrotask` 或 `setTimeout` 把它推到下一个任务执行。
3. `then` 返回新 Promise：回调的返回值决定新 Promise 的状态；回调抛错则新 Promise 转 rejected；回调不是函数时按当前状态**透传**（这是 `catch` 只传一个参数仍能生效的原因）。
4. 复杂点：返回值是 Promise（thenable）时要递归展开；`resolve` 自身会形成循环引用（`Chaining cycle detected`）。生产级实现还要处理 thenable 只取一次、`executor` 抛错自动 reject。
5. 复杂度：单次 `then` 注册 O(1)，触发时按注册顺序 O(n) 遍历回调；空间 O(n) 存放未触发回调。

```js
const PENDING = 'pending', FULFILLED = 'fulfilled', REJECTED = 'rejected';

class MyPromise {
  constructor(executor) {
    this.state = PENDING;
    this.value = undefined;
    this.callbacks = [];                    // { onFulfilled, onRejected, resolve, reject }
    const run = (cb) => {                   // 按当前状态执行一个回调，并决定新 Promise
      const fn = this.state === FULFILLED ? cb.onFulfilled : cb.onRejected;
      if (typeof fn !== 'function') {       // 透传：不是函数就沿用当前状态
        return this.state === FULFILLED ? cb.resolve(this.value) : cb.reject(this.value);
      }
      try { cb.resolve(fn(this.value)); } catch (e) { cb.reject(e); }
    };
    const settle = (state, value) => {
      if (this.state !== PENDING) return;   // 状态不可逆
      this.state = state;
      this.value = value;
      queueMicrotask(() => this.callbacks.forEach(run));   // 必须异步执行
    };
    const resolve = (v) => {
      if (v === this) return reject(new TypeError('Chaining cycle detected'));
      if (v instanceof MyPromise) return v.then(resolve, reject);   // 展开 thenable
      settle(FULFILLED, v);
    };
    const reject = (r) => settle(REJECTED, r);
    try { executor(resolve, reject); } catch (e) { reject(e); }
  }
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const cb = { onFulfilled, onRejected, resolve, reject };
      if (this.state === PENDING) return this.callbacks.push(cb);
      queueMicrotask(() => {                // 已是终态也要异步执行
        const fn = this.state === FULFILLED ? onFulfilled : onRejected;
        if (typeof fn !== 'function') {
          return this.state === FULFILLED ? resolve(this.value) : reject(this.value);
        }
        try { resolve(fn(this.value)); } catch (e) { reject(e); }
      });
    });
  }
  catch(onRejected) { return this.then(null, onRejected); }
  static resolve(v) { return v instanceof MyPromise ? v : new MyPromise((r) => r(v)); }
  static reject(r) { return new MyPromise((_, j) => j(r)); }
}
```

**追问与易错点**：

- 追问：为什么 `then` 的回调必须异步？答：保证 `then` 注册顺序与回调执行顺序一致，且让 `Promise` 内部的执行时机可预期；同步执行会破坏「先注册先执行」的语义，也会让 `resolve` 后的代码与回调竞争。
- 追问：`queueMicrotask` 与 `setTimeout` 在这里能互换吗？答：都能保证异步，但 `setTimeout` 是宏任务，会使 Promise 回调排在所有微任务之后，与原生时序不一致；用微任务才正确。
- 陷阱：`settle` 里不判 `state !== PENDING`，导致 `resolve()` 之后再 `reject()` 还能改状态，行为与原生相反。
- 陷阱：`then` 直接返回 `this` 而不是新 Promise，链式 `.then().then()` 全部作用在同一实例上，返回值无法传递。

### Q15 手写 Promise.all，失败时要注意什么？

**考察点**：考并发聚合与「快速失败」语义，同时考对可迭代入参、非 Promise 值的处理。

**参考答案**：

> **一句话结论**：`Promise.all` **全部成功才成功并保持输入顺序返回结果数组；任意一个失败立即以该原因 reject**，后续结果被忽略。

1. 结果必须按**输入下标**存放，不能按完成顺序 push，否则返回顺序错乱——这是最常被追问的点。
2. 入参可迭代（数组、`Set`），元素可以是 Promise 也可以是普通值；用 `Promise.resolve(item)` 统一包装，普通值直接当成功值。
3. 空数组立即 resolve 为 `[]`（不是挂起）；可用计数器 `remaining` 归零判定全部完成，天然覆盖空数组。
4. 快速失败：任一 reject 就直接 reject，之后不再处理；但**其他 Promise 仍在继续执行**，无法真正取消（要取消需要 `AbortController` 主动中断底层请求）。

```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);        // 统一为数组，支持 Set 等可迭代对象
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);   // 空数组立即成功
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {   // 普通值也走成功分支
        results[i] = value;                     // 按输入下标写入，保证顺序
        if (--remaining === 0) resolve(results);
      }, reject);                               // 任一失败立即整体失败
    });
  });
}
```

5. 复杂度：时间 O(n)（并发等待最长者），空间 O(n) 存结果数组。

**追问与易错点**：

- 追问：`Promise.all` 有并发限制吗？答：没有，所有任务一次性全部发起，成百上千个请求会打满连接池，所以才有手写并发控制器的场景。
- 陷阱：用 `results.push(value)` 收集结果。快速返回的 Promise 会先入数组，最终顺序与输入不一致，面试官只要给一个「先慢后快」的用例就能测出来。
- 陷阱：忘记空数组分支。空数组若不 resolve，`await` 会永久挂起，这是很典型的 bug。

### Q16 手写 Promise.allSettled，它和 all 的取舍是什么？

**考察点**：考「不快速失败」的聚合语义，以及结果对象的统一结构，考察对 ES2020 API 的熟悉度。

**参考答案**：

> **一句话结论**：`Promise.allSettled` **永远 resolve**，返回与输入等长的结果数组，每项是 `{ status: 'fulfilled', value }` 或 `{ status: 'rejected', reason }`。

1. 与 `all` 的核心差异：`all` 是「有一个失败就整体失败」，`allSettled` 是「无论成败都要全部结果」，适合批量操作里做部分失败的容错统计。
2. 实现要点：把每个元素分别接上成功与失败两个分支，都在同一位置写入结果对象，并让计数器递减；计数器归零时 resolve，永远不会走 reject。
3. 结果结构要与原生一致：成功键名是 `value`，失败键名是 `reason`，`status` 是字符串，写错键名会被追问细节时发现。
4. 场景取舍：上传多张图片想知道哪几张失败用 `allSettled`；只要一张失败就可以整体回滚用 `all`；需要最先完成的那个用 `race`。

```js
function promiseAllSettled(iterable) {
  return new Promise((resolve) => {                 // 永不 reject
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    const done = () => { if (--remaining === 0) resolve(results); };
    items.forEach((item, i) => {
      Promise.resolve(item).then(
        (value) => { results[i] = { status: 'fulfilled', value }; done(); },
        (reason) => { results[i] = { status: 'rejected', reason }; done(); }
      );
    });
  });
}
```

5. 复杂度：时间 O(n)，空间 O(n)。

**追问与易错点**：

- 追问：`allSettled` 能拿到「哪个失败了吗」？答：能定位失败项，因为结果下标与输入一一对应；但它不提供聚合的失败计数，需要业务自己统计。
- 陷阱：结果对象写成 `{ status: 'fulfilled', result: value }` 这类自定义键名，与原生不一致，`await` 后取值会 `undefined`。
- 陷阱：认为 `allSettled` 会阻止其他任务执行。它只是不中断等待，任务本身照旧并发运行。

### Q17 手写 Promise.race，空数组会怎样？

**考察点**：考「第一个落定」的时间语义，以及 behind-the-scenes 的边界（空数组永久 pending）。

**参考答案**：

> **一句话结论**：`Promise.race` **返回最先落定的那个 Promise 的结果**，无论成功还是失败；传空数组时永远处于 `pending` 状态。

1. 实现极简：遍历入参，对每个元素同时接成功与失败分支，谁先触发就 `resolve`/`reject`。Promise 状态不可逆，天然保证后面的结果被忽略。
2. 元素可以是普通值：`Promise.resolve(item)` 包装后，普通值属于「立即成功」，会赢下竞争；这是 `race([timeout, fetch])` 写法里要注意的点。
3. 空数组行为：没有任何元素能触发落定，返回的 Promise 永久挂起，既不会 resolve 也不会 reject；这是规范行为，不是 bug。使用时要自己加超时兜底。
4. 典型用法就是超时控制：`Promise.race([请求, 延时后 reject])`，注意请求成功返回后仍要清理定时器，否则定时器会一直挂着。

```js
function promiseRace(iterable) {
  return new Promise((resolve, reject) => {
    for (const item of iterable) {              // 用 for...of 支持任意可迭代对象
      Promise.resolve(item).then(resolve, reject);   // 先落定者生效
    }
    // 空可迭代对象：不触发任何 resolve/reject，保持 pending（与原生一致）
  });
}

// 超时封装：注意 clearTimeout 避免定时器悬挂
function withTimeoutRace(task, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}
```

5. 复杂度：时间 O(n) 注册，实际耗时取决最快任务；空间 O(1)（除入参本身）。

**追问与易错点**：

- 追问：`race` 用的是「第一个完成」还是「第一个成功」？答：**第一个落定**，失败也算；「第一个成功」是 `Promise.any`，二者语义不同。
- 陷阱：以为输了竞争的任务会被取消。它继续跑，只是结果被丢弃，网络开销与副作用依然存在。
- 陷阱：`withTimeout` 里不 `clearTimeout`，快速成功的请求会留下定时器，长期运行会有内存与性能隐患。

### Q18 手写 Promise.any，全部失败时抛什么？

**考察点**：考 ES2021 API 与 `AggregateError` 的使用，属于 `race`/`all` 的对照题。

**参考答案**：

> **一句话结论**：`Promise.any` **返回第一个成功的值**；若全部失败，则 reject 一个 `AggregateError`，其 `errors` 属性按顺序保存所有失败原因。

1. 与 `race` 的差别：`race` 谁先落定听谁的（失败也可能赢），`any` 只认成功，失败继续等其他任务成功。这是「多镜像源取最快可用」的语义。
2. 与 `all` 的差别：`all` 要求全部成功，`any` 只要一个成功。
3. 失败收集：用一个数组按下标记录 `reason`，并用计数器统计失败个数。计数器等于总长度时，抛 `new AggregateError(errors, 'All promises were rejected')`。
4. 空数组行为：规范规定 `Promise.any([])` 立即 reject `AggregateError`（`errors` 为空数组），与 `all([])` 立即成功正好相反。

```js
function promiseAny(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const errors = new Array(items.length);
    let rejected = 0;
    if (items.length === 0) {
      return reject(new AggregateError([], 'All promises were rejected'));
    }
    items.forEach((item, i) => {
      Promise.resolve(item).then(resolve, (reason) => {   // 成功就赢，失败继续等
        errors[i] = reason;                               // 按输入下标保序
        if (++rejected === items.length) {
          reject(new AggregateError(errors, 'All promises were rejected'));
        }
      });
    });
  });
}
```

5. 复杂度：时间 O(n)，空间 O(n) 存失败原因。

**追问与易错点**：

- 追问：`AggregateError` 怎么取值？答：它是 `Error` 子类，`e.errors` 是原因数组，`e.message` 是说明文本；`console.log` 打印时会显示为 `AggregateError: All promises were rejected`。
- 陷阱：全部失败时 reject 一个普通 `Error`。`errors` 信息全丢，追问「怎么知道每个请求为什么失败」时答不上来。
- 陷阱：用 `errors.push(reason)` 收集。失败顺序不等于输入顺序，报错定位会错位。

### Q19 手写 Promise.resolve、reject 和 finally

**考察点**：考静态方法的「幂等/透传」语义与 `finally` 的返回值规则，属于细节题。

**参考答案**：

> **一句话结论**：`Promise.resolve` 对 Promise 原样返回、对 thenable 展开、对普通值包装；`finally` **无论成败都执行回调，且不改变原有的值与状态**（回调返回 rejected 的 Promise 例外）。

1. `Promise.resolve(x)`：若 `x` 已经是同构造器的 Promise，直接返回同一个引用（不新建）；若是 thenable 则展开；否则包装成 fulfilled 的 Promise。
2. `Promise.reject(r)`：**不展开 thenable**，直接以 `r` 为原因 reject。所以 `Promise.reject(promiseObj)` 的失败原因是那个 Promise 对象本身，这是易错点。
3. `finally` 的规则：回调不接收参数，也不改变结果；但如果回调**返回了一个 rejected 的 Promise 或抛错**，则新 Promise 也以该错误 reject，覆盖原结果。
4. 实现要点：`finally` 内部必须用 `then` 的透传分支重新抛出原值/原原因，且要 `Promise.resolve(cb()).then(...)` 等待回调返回的异步操作完成。

```js
class MyPromise2 extends Promise {}
// 通用写法（不依赖子类）
function myResolve(value) {
  if (value instanceof Promise) return value;                     // 原样返回
  return new Promise((resolve) => resolve(value));                // thenable 由原生展开
}
function myReject(reason) {
  return new Promise((_, reject) => reject(reason));              // 不展开 thenable
}
Promise.prototype.myFinally = function (onFinally) {
  return this.then(
    (value) => Promise.resolve(onFinally()).then(() => value),    // 等回调完成再透传值
    (reason) => Promise.resolve(onFinally()).then(() => { throw reason; })
  );
};
```

5. 复杂度：O(1) 包装，回调异步执行。

**追问与易错点**：

- 追问：`finally` 里 `return` 一个值会改变结果吗？答：不会，返回值被忽略（只有 rejected 的 Promise 或抛错会改变结果），这正是 `finally` 与 `then` 的关键区别。
- 陷阱：把 `finally` 当成 `catch` 用，以为它能吞掉错误。它不改变失败状态，错误会继续往后传。
- 陷阱：`Promise.reject(thenable)` 后以为会展开成 thenable 的结果，实际拿到的是 thenable 对象本身。

### Q20 手写并发请求控制器，限制最大并发数

**考察点**：本章高频实战深挖题，考「任务池 + 完成后补位」的调度思路，也考结果保序与错误处理策略。

**参考答案**：

> **一句话结论**：并发控制器的做法是**先启动 `max` 个任务，每个任务完成（无论成败）后从待执行队列里取下一个补位**，直到所有任务完成，结果按原始下标保序返回。

1. 数据结构：`results` 按输入下标存放结果，`index` 指向下一个待取任务，`running` 记录在跑数量，`finished` 记录已结算数量。
2. 调度循环：`while (running < max && index < tasks.length)` 不断取任务启动，这是「补位」的关键；每个任务的 `finally` 里 `running--; finished++; next()`，形成递归补位。
3. 结果保序：写入 `results[i]` 而不是 push，与 `Promise.all` 同理；否则输出顺序不可预期。
4. 错误策略要提前声明：一是「失败即整体 reject」（类似 `all`），二是「失败也算完成并记录」（类似 `allSettled`）。生产代码通常选后者，并让调用方自己过滤，同时可以加 `AbortController` 在失败时中断其他请求。
5. 复杂度：时间取决于任务耗时，调度开销 O(n)；空间 O(n) 存结果与任务引用。

```js
function limitConcurrency(tasks, max = 5) {
  return new Promise((resolve) => {
    const results = new Array(tasks.length);
    let index = 0;       // 下一个待取任务
    let running = 0;     // 在跑数量
    let finished = 0;    // 已结算数量
    const next = () => {
      if (finished === tasks.length) return resolve(results);   // 空数组也走这里
      while (running < max && index < tasks.length) {
        const i = index++;                                        // 锁定当前下标
        running++;
        Promise.resolve()
          .then(() => tasks[i]())                                 // 任务可为同步函数
          .then((v) => { results[i] = v; },
                (e) => { results[i] = e; })                       // 失败也记录，保证补位
          .finally(() => { running--; finished++; next(); });     // 完成后立刻补位
      }
    };
    next();
  });
}
```

**追问与易错点**：

- 追问：为什么不用「分批 `Promise.all`」？答：分批会让每批都等最慢的那个，慢任务拖住整批，总耗时更长；补位式调度是「流水线」，没有空洞等待。
- 追问：怎么中止剩余任务？答：传入 `AbortSignal`，任务内部把 `signal` 交给 `fetch`；`signal.abort()` 会让未完成请求以 `AbortError` 失败，控制器里按失败记录即可。
- 陷阱：`next()` 放在 `then` 成功分支里，失败时不再补位，导致并发数逐渐衰减、部分任务永不执行。
- 陷阱：任务直接写 `tasks[index++]()` 而没用 `Promise.resolve().then(...)` 包装，同步任务抛错会直接冒泡出构造函数，整个 Promise 卡在 pending。

### Q21 手写异步任务串行执行器

**考察点**：考串行语义与 `reduce` 串联技巧，是并发控制器的对照题。

**参考答案**：

> **一句话结论**：串行执行器要**用 `reduce` 把上一个 Promise 作为下一个任务的启动条件**（或 `for...of` + `await`），保证同一时刻最多一个任务在跑。

1. `reduce` 链式写法：`tasks.reduce((prev, task) => prev.then(() => task()), Promise.resolve())`，每个任务都被包在上一环的 `then` 里，天然串行。
2. `async` 写法更直观：`for (const task of tasks) { results.push(await task()); }`。两者等价，`reduce` 写法更能体现「用 Promise 串起来」的原理，面试官通常追这个。
3. 错误处理：任一任务 reject 后，后面任务不再执行（链断了）。若要求「出错继续」，要在循环内 `try/catch` 记录错误后继续下一轮。
4. 与并行的取舍：串行总耗时是各任务耗时之和，并发是最大值。串行适用于有依赖或需要限流的场景（写同一份文件、占用同一把锁、爬虫限速）。

```js
// 写法一：reduce 串联（原理清晰）
function runSerial(tasks) {
  return tasks.reduce(
    (chain, task) => chain.then((results) =>
      Promise.resolve(task()).then((value) => [...results, value])),
    Promise.resolve([])
  );
}

// 写法二：async/await + 出错继续
async function runSerial2(tasks) {
  const results = [];
  for (const task of tasks) {
    try { results.push(await task()); }
    catch (e) { results.push(e); }          // 单点失败不影响后续
  }
  return results;
}
```

5. 复杂度：时间 O(Σ tᵢ)（各任务耗时之和）；写法一会产生 O(n²) 的数组复制，任务很多时改用 `push` 到外部数组。

**追问与易错点**：

- 追问：`reduce` 写法里为什么初值是 `Promise.resolve([])`？答：给链条一个已完成的起点，避免第一个任务没有 `then` 可挂；同时也是结果数组的载体。
- 陷阱：`tasks.reduce((prev, task) => prev.then(task), Promise.resolve())` 直接用 `task`，`task` 会收到上一环的返回值作为参数，且 `this` 不对，行为难以预期。
- 陷阱：写法一每轮 `[...results, value]` 都新建数组，n 个任务就是 O(n²) 复制，大数据量下是明显性能扣分项。

### Q22 手写 retry 重试，要支持指数退避

**考察点**：考异步递归、失败重试上限与退避策略，是工程能力题。

**参考答案**：

> **一句话结论**：`retry` 就是**把失败的任务递归重试，直到成功或达到重试次数；每次重试之间按倍数递增等待时间（指数退避）**，避免瞬间打爆下游服务。

1. 递归骨架：定义 `attempt(n)`，执行任务；成功直接 `resolve`，失败时判断 `n >= retries`，够了就 `reject` 原错误，否则延时后 `attempt(n + 1)`。
2. 指数退避：等待时间 `base * factor ** n`（如 300ms → 600ms → 1200ms）。可加随机抖动（jitter）避免多个客户端同时重试造成尖峰。
3. 必须用 `Promise.resolve().then(fn)` 包装任务，同步函数抛错也能被捕获成 rejected；同时保证第一次调用也是异步的（调用栈更浅，便于调试）。
4. 工程细节：只对可重试错误重试（网络超时、5xx 重试；参数校验 4xx 不重试）；`retries` 语义要明确是「重试次数」还是「总尝试次数」，写代码时用注释写死，避免歧义。
5. 复杂度：最坏时间 O(Σ delayᵢ + Σ tᵢ)，空间 O(retries) 递归栈。

```js
function retry(fn, { retries = 3, base = 300, factor = 2, jitter = true } = {}) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  return new Promise((resolve, reject) => {
    const attempt = (n) => {                                  // n 为已失败次数
      Promise.resolve()
        .then(fn)                                             // 同步/异步任务都能兜住
        .then(resolve)
        .catch((err) => {
          if (n >= retries) return reject(err);               // 用尽重试次数
          const delay = base * factor ** n;                   // 指数退避
          const wait = jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
          setTimeout(() => attempt(n + 1), wait);             // 延时后重试
        });
    };
    attempt(0);
  });
}
// retry(() => fetch('/api'), { retries: 3, base: 300 })
```

**追问与易错点**：

- 追问：为什么要抖动？答：同一时刻失败的客户端会按相同节奏重试，形成「重试风暴」；加随机抖动把重试时间摊开，降低下游瞬时压力。
- 追问：怎么与超时配合？答：单次请求用 `AbortController` 限时，整体重试用 `retry` 包裹，两层都要有上限，否则总耗时不可控。
- 陷阱：递归里用 `await` 直接写 `try/catch` 却不 `return`，导致失败分支继续往下走，重试逻辑与错误处理打架。
- 陷阱：`retries` 语义含糊，`retries = 3` 写成总共只执行 1 次或 4 次都可能。面试时主动说明「这里是重试次数，总尝试次数是 retries + 1」。

### Q23 手写 sleep 与超时封装 withTimeout

**考察点**：考宏任务延时、超时竞速与定时器清理，是异步基础的必问题。

**参考答案**：

> **一句话结论**：`sleep` 是 `new Promise(r => setTimeout(r, ms))` 的延时封装；`withTimeout` 用 `Promise.race` 让「任务」与「超时失败」赛跑，并在结束后清理定时器。

1. `sleep` 的作用是「不阻塞主线程的等待」，常用于重试间隔、轮询节流、模拟异步；时间是最小等待时长，不保证精确，因为回调要排队等主线程空闲。
2. `withTimeout` 的核心：`Promise.race([task, timeoutPromise])`。超时 Promise 在 `ms` 后 reject 一个带标记的错误，任务先完成就用任务结果。实现里要把入参统一成 Promise（`typeof task === 'function' ? task() : task`），这样传函数、传 Promise、传普通值都能用。
3. 定时器清理：无论谁赢都要 `clearTimeout`，否则成功的请求会留下一个到点才 reject 的定时器（无人接管的 rejection 还可能触发 `unhandledrejection`）。
4. 更彻底的方案是 `AbortController`：超时后调用 `controller.abort()` 真正中断底层请求（`fetch`、`axios` 都支持 `signal`），而不只是「不再等待」。`Promise.race` 只是放弃结果，请求仍在后台跑完。
5. 复杂度：O(1) 时间与空间（不含任务本身开销）。

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout(task, ms) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
  });
  // task 允许是函数、Promise 或普通值，统一成 Promise 再赛跑
  const running = typeof task === 'function' ? Promise.resolve().then(task) : Promise.resolve(task);
  // finally 里清理定时器，避免悬挂
  return Promise.race([running, timeout]).finally(() => clearTimeout(timer));
}

// 更强：真正中断请求
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { signal: controller.signal }); }
  finally { clearTimeout(timer); }
}
```

**追问与易错点**：

- 追问：`Promise.race` 版超时能取消请求吗？答：不能，只是不再等待结果，请求继续执行到结束（连接与带宽已消耗）；要真正取消必须用 `AbortController`。
- 追问：`sleep(1000)` 真的等 1000ms 吗？答：至少 1000ms；若主线程被长任务阻塞，回调会延后，所以它是「不小于」，不是精确计时。
- 陷阱：超时错误用 `reject(Error)` 之外还写成字符串 `reject('timeout')`，调用方 `e.message` 拿不到信息，也不好和业务错误区分。

### Q24 手写发布订阅 EventEmitter，要支持 once 和 off

**考察点**：考事件模型的数据结构设计与 `once` 的包装技巧，是框架源码相关的高频题。

**参考答案**：

> **一句话结论**：`EventEmitter` 内部用 **`Map<事件名, Set<回调>>`（或对象 + 数组）存储订阅关系**，`on` 追加、`emit` 依次调用、`off` 删除、`once` 用包装函数执行后自动摘除。

1. 数据结构选择：`Map` 的事件名可以是字符串也可以是对象，且删除方便；内层用数组便于按顺序执行与去重判断，用 `Set` 则天然去重但同一回调只能注册一次。
2. `once` 实现：包装一个 `wrapper`，调用时先 `off` 再执行原回调，并把原回调挂到 `wrapper.listener` 上，方便 `off(fn)` 时能正确移除（否则移除的是 `wrapper`，外部拿不到引用）。
3. `emit` 要点：先取快照 `[...listeners]` 再遍历，避免回调内部 `on`/`off` 时改变正在遍历的数组导致漏调用或死循环。
4. 工程细节：`off` 不传回调时清空该事件全部订阅；`on` 返回 `this` 支持链式调用（Node.js 风格）；实际项目要考虑回调抛错隔离——一个订阅者抛错不应中断其他订阅者（Node.js 的 `EventEmitter` 会直接抛，业务库通常包 `try/catch`）。

```js
class EventEmitter {
  constructor() { this.events = new Map(); }
  on(type, listener) {
    if (!this.events.has(type)) this.events.set(type, []);
    this.events.get(type).push(listener);
    return this;
  }
  off(type, listener) {
    const list = this.events.get(type);
    if (!list) return this;
    if (!listener) { this.events.delete(type); return this; }   // 清空该事件
    this.events.set(type, list.filter((fn) => fn !== listener && fn.listener !== listener));
    return this;
  }
  once(type, listener) {
    const wrapper = (...args) => { this.off(type, wrapper); listener.apply(this, args); };
    wrapper.listener = listener;                                // 便于 off 定位
    return this.on(type, wrapper);
  }
  emit(type, ...args) {
    const list = this.events.get(type);
    if (!list || list.length === 0) return false;
    [...list].forEach((fn) => fn.apply(this, args));            // 快照，防止遍历中被改
    return true;
  }
}
```

5. 复杂度：`on`/`off` 均摊 O(1)（`off` 为 O(n) 过滤），`emit` 为 O(k)，k 为订阅者数量；空间 O(总订阅数)。

**追问与易错点**：

- 追问：发布订阅与观察者模式什么关系？答：观察者模式里目标与观察者直接互相持有引用；发布订阅在中间加了一层事件中心，发布者与订阅者互不知情，耦合更低。
- 陷阱：`once` 不挂 `wrapper.listener`。调用方 `off(type, 原回调)` 时匹配不到，订阅永远删不掉，属于内存泄漏。
- 陷阱：`emit` 直接 `list.forEach`，回调内部执行 `off` 会导致数组边遍历边缩短，后面的订阅者被跳过。

### Q25 手写观察者模式（Subject / Observer）

**考察点**：考设计模式的落地写法与「拉/推模型」的差异，常与 Vue 响应式原理结合追问。

**参考答案**：

> **一句话结论**：观察者模式里**目标（Subject）维护观察者列表，状态变化时主动通知所有观察者**；观察者实现统一接口（如 `update`），目标与观察者直接耦合。

1. 结构三件套：`Subject` 持有 `observers` 数组并暴露 `subscribe`/`unsubscribe`/`notify`；`Observer` 实现 `update(state)`，收到通知后自行拉取或使用推送的数据。
2. 推模型与拉模型：`notify` 时把最新状态作为参数传过去是推模型（观察者被动接收）；只发「变了」的信号、观察者再调用 `getState()` 拉取是拉模型。Vue 的 `Dep`/`Watcher` 属于后者（`dep.notify()` 后 watcher 再去 `get()` 求值）。
3. 通知前先复制观察者列表，理由与 `EventEmitter` 相同：观察者可能在回调里取消订阅。
4. 与发布订阅的区别：观察者模式里 Subject 直接调用 `observer.update()`，两者强耦合、一对一或多对一；发布订阅通过事件中心解耦，可多对多。面试里能画出这层差异就是加分项。
5. 复杂度：`subscribe`/`unsubscribe` O(n)（数组操作），`notify` O(n)。

```js
class Subject {
  constructor() { this.observers = []; this.state = undefined; }
  subscribe(observer) {
    if (!this.observers.includes(observer)) this.observers.push(observer);
    return () => this.unsubscribe(observer);        // 返回取消函数，便于清理
  }
  unsubscribe(observer) {
    this.observers = this.observers.filter((o) => o !== observer);
  }
  setState(state) { this.state = state; this.notify(); }
  notify() {
    [...this.observers].forEach((o) => o.update(this.state));   // 快照遍历
  }
}

class Observer {
  constructor(name) { this.name = name; }
  update(state) { console.log(`${this.name} 收到状态：`, state); }
}
```

**追问与易错点**：

- 追问：Vue3 的响应式用的是哪种？答：本质是观察者模式，`effect` 作为观察者被 `track` 收集进 `dep`，数据变化时 `trigger` 通知重新执行；配合 `Proxy` 拦截读写。
- 陷阱：把观察者模式与发布订阅说成"完全一样"。耦合度与是否有中间层是本质区别，这是设计模式题的必问点。
- 陷阱：`subscribe` 不返回取消订阅的方法，组件销毁时无法解绑，长生命周期 Subject 会持有失效观察者造成内存泄漏。

### Q26 手写 LRU 缓存，用 Map 怎么实现 O(1)？

**考察点**：本章第三深挖题，考哈希表 + 有序结构的组合能力与 `Map` 插入顺序特性的运用，能说出「为什么是 Map 而不是对象」很关键。

**参考答案**：

> **一句话结论**：LRU（Least Recently Used，最近最少使用）用 **`Map` 的插入顺序充当「使用顺序」**：`get` 命中后先删再存把它移到队尾，`set` 超容量时删掉队首（`Map` 的第一个键），读写都是 O(1)。

1. 为什么 `Map` 能做：规范保证 `Map` 按插入顺序迭代，且删除/插入是常数级——这正是「链表 + 哈希表」的效果，无需手写双向链表。
2. `get` 逻辑：不存在返回 -1（或 `undefined`）；存在则 `delete` 再 `set` 同一个值，把它挪到最新位置。这一步是 LRU 的核心，漏掉就退化成 FIFO。
3. `set` 逻辑：先判断键是否已存在（存在则先删，保证顺序更新），再 `set`；随后若 `size > capacity`，用 `this.cache.keys().next().value` 取出最旧键并删除。
4. 容量边界：本实现里 `capacity < 1` 直接抛 `RangeError`（也可以选择「不缓存」，但必须在文档里写清是哪种）；`capacity` 为 1 时每次 set 都会淘汰旧值，要单独确认行为符合预期。
5. 复杂度：`get`/`set` 均摊 O(1)，空间 O(capacity)。手写双向链表 + `Map` 索引也能做到 O(1)，但代码量翻倍，面试时讲清「`Map` 已内置顺序」即可。

```js
class LRUCache {
  constructor(capacity) {
    if (capacity < 1) throw new RangeError('capacity must be >= 1');
    this.capacity = capacity;
    this.cache = new Map();                       // 迭代顺序即「新旧顺序」
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);                       // 先删
    this.cache.set(key, value);                   // 再存 → 移到队尾（最新）
    return value;
  }
  set(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);   // 已存在则先删，避免顺序错乱
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      const oldest = this.cache.keys().next().value;   // Map 的第一个键 = 最久未用
      this.cache.delete(oldest);
    }
  }
}
```

**追问与易错点**：

- 追问：`Map` 与 `WeakMap` 在这里能互换吗？答：不能。`WeakMap` 不可遍历、没有 `size`，无法找到「最旧的键」来淘汰；它适合做对象键的附加数据存储。
- 追问：LRU 和 LFU 的区别？答：LRU 淘汰「最久未使用」，LFU 淘汰「使用频率最低」。LRU 实现简单、对新访问敏感，缓存命中率在热点突增场景更稳。
- 陷阱：`get` 里只返回不调整顺序。这样淘汰的是「最早写入」而不是「最久未使用」，本质变成 FIFO，是本题第一号扣分项。
- 陷阱：用普通对象 `{}` 存键值。对象没有可靠的插入顺序保证（数值型键会被自动排序到最前），也无法 O(1) 取「第一个键」。

### Q27 手写 Array.prototype.flat，要支持指定深度

**考察点**：考递归拍平与 `depth` 语义，顺带考 `flat` 与 `flatMap`、稀疏数组的细节。

**参考答案**：

> **一句话结论**：`flat(depth)` **按指定层数递归展开嵌套数组，只处理数组元素**，深度不够就保留原样，默认深度为 1。

1. 递归思路：遍历元素，若元素是数组且还有剩余深度，就递归 `flat(depth - 1)` 并把结果展开合并；否则原样放入结果。
2. `depth` 语义：`Infinity` 表示无限层；`0` 返回浅拷贝（不展开）；负数按 0 处理。`depth` 不是数字时会被转成数字再处理。
3. 只拍数组，不拍类数组或可迭代对象：`flat` 只看 `Array.isArray`，`arguments`、`Set` 不会被展开，这是与「手写万能 flatten」的关键区别。
4. `flat` 会**移除空位（holes）**：`[1, , 3].flat()` 得到 `[1, 3]`。注意 `for...of` 会遍历空位并把 `undefined` 带进结果，想与原生完全一致必须用下标循环加 `i in list` 判断。

```js
function flat(arr, depth = 1) {
  if (!Array.isArray(arr)) throw new TypeError('flat 只能作用于数组');
  const level = Number(depth);
  const d = Number.isNaN(level) ? 0 : Math.floor(level);      // 负数/非法按 0
  const result = [];
  const walk = (list, rest) => {
    for (let i = 0; i < list.length; i++) {
      if (!(i in list)) continue;                             // 跳过空位，与原生一致
      const item = list[i];
      if (Array.isArray(item) && rest > 0) walk(item, rest - 1);
      else result.push(item);
    }
  };
  walk(arr, d);
  return result;
}
// flat([1, [2, [3, [4]]]], 2) → [1, 2, 3, [4]]；flat([1, , 3]) → [1, 3]
```

5. 复杂度：时间 O(n)，n 为展开后元素总数；递归栈深 O(depth)；可用显式栈把递归改成迭代以规避深嵌套爆栈。

**追问与易错点**：

- 追问：`depth` 传 `Infinity` 会怎样？答：`rest - 1` 仍是 `Infinity`，会一直递归到没有数组为止，语义正确；但真实深嵌套可能栈溢出，工程上建议改迭代。
- 追问：`flatMap` 和 `map + flat` 的关系？答：`flatMap(fn)` 等价于 `map(fn).flat(1)`，但只展平一层，且一次遍历完成，效率略高。
- 陷阱：用 `Array.prototype.concat.apply([], arr)` 实现，这只拍平一层，且元素多时 `apply` 参数超限会抛错。

### Q28 数组去重有哪几种方案，怎么选？

**考察点**：考多种方案的适用边界（`NaN`、对象、`undefined`），重点是能按场景选型而不是背一种。

**参考答案**：

> **一句话结论**：日常首选 **`[...new Set(arr)]`**（O(n)、能正确去重 `NaN`）；需要按对象字段去重时用 `Map`；兼容性要求极高或要保留原始顺序的极端场景才考虑其他方案。

1. `Set` 方案：基于 SameValueZero 比较，能正确把 `NaN` 视为相同，`+0` 与 `-0` 也视为相同；对象按引用比较，两个内容相同的对象不会被合并。
2. `filter + indexOf`：O(n²)，且 `indexOf` 用严格相等（`===`）比较，`NaN` 永远找不到自己（`indexOf` 恒返回 -1），因此 `NaN` 会被**整体丢弃**——这是最典型的错误答案。
3. `Map` 方案：适合对象数组按字段去重，`map.set(item.id, item)` 后取 `[...map.values()]`，保留的通常是**最后一次**出现的那条记录，需要「保留第一条」就用 `if (!map.has(key))`。
4. `sort + 相邻比较`：先排序再比相邻元素，O(n log n) 不用额外哈希表，但**打乱了原顺序**，且不同类型混排时比较结果不稳定。
5. 复杂度对比：`Set`/`Map` 为 O(n) 时间、O(n) 空间；`filter + indexOf` 为 O(n²)；排序法 O(n log n) 时间、O(1) 额外空间。

```js
// 1. 基础类型：O(n)，推荐
const unique = (arr) => [...new Set(arr)];          // [1, NaN, 1] → [1, NaN]

// 2. 对象数组按字段去重：保留首次出现
function uniqueBy(arr, key) {
  const map = new Map();
  for (const item of arr) {
    const k = typeof key === 'function' ? key(item) : item[key];
    if (!map.has(k)) map.set(k, item);              // 保留首条；改为直接 set 则保留末条
  }
  return [...map.values()];
}

// 3. filter + indexOf：仅基础类型且无 NaN
const unique2 = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);
```

**追问与易错点**：

- 追问：`Set` 能去重对象吗？答：只能去重同一引用。`[{id:1},{id:1}]` 用 `Set` 仍是两个元素，必须用 `Map` 按字段处理。
- 追问：`new Set` 会改变原数组吗？答：不会，它新建集合；但若元素是对象，集合与原数组共享同一批对象引用，改属性会互相影响。
- 陷阱：回答「去重用双重 for 循环 + splice」，边说 O(n²) 边称它性能最好，逻辑自相矛盾，追问复杂度时露馅。

### Q29 手写数组乱序（洗牌），为什么不能用 sort 随机？

**考察点**：考 Fisher-Yates（洗牌算法）的正确性与 `sort` 随机比较的偏差，是算法口味题。

**参考答案**：

> **一句话结论**：正确做法是 **Fisher-Yates 洗牌：从后往前遍历，每次把当前位置与 `[0, i]` 之间的随机下标交换**，时间复杂度 O(n)，且每种排列概率严格相等。

1. 算法步骤：`for (let i = n - 1; i > 0; i--)`，取 `j = Math.floor(Math.random() * (i + 1))`（注意是 `i + 1`，保证 `j` 能取到 `i`），交换 `arr[i]` 与 `arr[j]`。
2. 为什么不能 `arr.sort(() => Math.random() - 0.5)`：`sort` 的比较函数要求满足一致性（同一对元素多次比较应返回相同结果），随机返回会破坏排序前提，导致某些排列被系统性地高估或低估，且 V8 的 `TimSort` 实现会让分布更偏。
3. 为什么从后往前：从前往后交换时 `j` 必须取 `[i, n-1]`（含 `i`），一旦写成 `[i+1, n-1]` 就会漏掉一部分排列；从后往前天然满足「每个位置等概率」。
4. 边界：单元素数组无需交换；空数组直接返回；要保证不修改原数组就先 `slice()` 一份再洗，符合「纯函数」预期。
5. 复杂度：时间 O(n)，空间 O(1)（原地交换）；`sort + Math.random` 是 O(n log n) 且分布在数学上不正确。

```js
function shuffle(arr) {
  const result = arr.slice();                 // 不改原数组
  for (let i = result.length - 1; i > 0; i--) {
    // i + 1 保证 j 落在 [0, i]，每个位置等概率
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
// 错误示范：分布有偏，且破坏 sort 一致性要求
// arr.slice().sort(() => Math.random() - 0.5)
```

**追问与易错点**：

- 追问：怎么验证洗牌是均匀的？答：把 `[1,2,3]` 洗 10 万次统计每种排列出现次数，理论上各为 1/6，明显偏离就说明实现有偏。
- 陷阱：写 `Math.floor(Math.random() * i)`（漏掉 `+1`），`j` 永远取不到 `i`，该位置元素无法与自己交换，排列概率偏差明显。
- 陷阱：认为 `sort` 随机「差不多能用」。小规模看起来正常，数据量一大偏差就会在抽奖、发牌类业务里暴露。

### Q30 手写快速排序，说清复杂度和最坏情况

**考察点**：考分治思想、原地划分与复杂度分析，能说出「快排最坏 O(n²) 及规避手段」才算完整。

**参考答案**：

> **一句话结论**：快排是**选基准（pivot）、把数组划分为「小于基准」和「大于基准」两段，再对两段递归**的分治算法，平均 O(n log n)，最坏 O(n²)。

1. 划分（partition）是核心：原地版本用 `Lomuto` 或 `Hoare` 方案，把基准换到末尾，用指针把小于基准的元素依次换到前面，最后把基准放到正确位置并返回其下标。
2. 基准选择决定性能：固定取首/尾元素时，遇到已排序数组会退化成每次划分只减少一个元素，递归深度 O(n)，总时间 O(n²)。规避手段是**随机选基准**或三数取中。
3. 优化点：小数组（如长度 < 10）改用插入排序，减少递归开销；与基准相等的元素集中到中间做三路划分，能高效处理大量重复元素。
4. 空间：原地交换版本递归栈深度平均 O(log n)、最坏 O(n)；非原地版本代码更短但每次新建数组，空间 O(n)。
5. 边界：长度 0 或 1 直接返回；要返回新数组还是原地排序要提前说明，面试官常追问「能不能不额外开空间」。

```js
function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left >= right) return arr;
  // 随机基准：随机换到末尾，避免有序输入退化
  const rand = left + Math.floor(Math.random() * (right - left + 1));
  [arr[rand], arr[right]] = [arr[right], arr[rand]];
  const pivot = arr[right];
  let store = left;                                   // 小于基准区域的边界
  for (let i = left; i < right; i++) {
    if (arr[i] < pivot) {
      [arr[store], arr[i]] = [arr[i], arr[store]];
      store++;
    }
  }
  [arr[store], arr[right]] = [arr[right], arr[store]]; // 基准归位
  quickSort(arr, left, store - 1);
  quickSort(arr, store + 1, right);
  return arr;
}
```

**追问与易错点**：

- 追问：快排和归并排序怎么选？答：快排原地、常数小、平均更快，但不稳定且最坏 O(n²)；归并稳定、稳定 O(n log n)，但需要 O(n) 额外空间。工程实现（如 V8 的 `Array.prototype.sort`）用 TimSort，是归并 + 插入的混合。
- 追问：`sort` 的默认比较是什么？答：把元素转成字符串按 UTF-16 码元比较，`[10, 9, 1].sort()` 得到 `[1, 10, 9]`，必须传比较函数。
- 陷阱：划分后把基准下标记成 `store` 却在递归里写成 `store`（应为 `store - 1` / `store + 1`），导致死循环或栈溢出。

### Q31 手写归并排序，它相比快排的优势是什么？

**考察点**：考分治 + 合并的有序性利用，以及稳定性与空间代价的权衡。

**参考答案**：

> **一句话结论**：归并排序**把数组对半拆开递归排序，再用双指针线性合并两个有序子数组**，时间稳定为 O(n log n)，是稳定排序，代价是需要 O(n) 额外空间。

1. 合并（merge）是核心：两个子数组各一个指针，比较当前值，小的先放入结果；某一边走完后把另一边剩余整体追加。归并的稳定性来自「相等时优先取左边」这个判断——代码里写 `a[i] <= b[j]`，相等时取左边。
2. 复杂度：递归深度 O(log n)，每层合并总工作量 O(n)，所以时间恒定 O(n log n)——**不存在快排那种最坏退化**，这是它最大优势。
3. 空间：需要与原数组等长的辅助数组，O(n)；递归版还有 O(log n) 栈空间。
4. 稳定性价值：对对象按多字段排序时（先按年龄、再按姓名），稳定排序可以「从次要字段排到主要字段」逐轮排序而不会打乱上一次的顺序。
5. 边界：空数组与单元素数组直接返回；`Infinity` 哨兵可简化合并逻辑但改变了元素语义，面试手写时用 `while (i < n1 && j < n2)` 更稳。

```js
function mergeSort(arr, cmp) {
  if (arr.length <= 1) return arr;                    // 递归出口
  const mid = arr.length >> 1;
  const left = mergeSort(arr.slice(0, mid), cmp);
  const right = mergeSort(arr.slice(mid), cmp);
  return merge(left, right, cmp);                     // cmp 一路透传，保证子问题同规则
}
function merge(a, b, cmp) {
  // 有比较器用 cmp(...) <= 0 判「左边更靠前」；无比较器时用 <= 直接比较
  const le = cmp ? (x, y) => cmp(x, y) <= 0 : (x, y) => x <= y;
  const result = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    result.push(le(a[i], b[j]) ? a[i++] : b[j++]);    // 相等取左边 → 稳定
  }
  while (i < a.length) result.push(a[i++]);           // 剩余整体追加
  while (j < b.length) result.push(b[j++]);
  return result;
}
// 多字段稳定排序：先按次要字段排，再按主要字段排，结果稳定
// mergeSort(users, (x, y) => x.age - y.age)
```

**追问与易错点**：

- 追问：归并排序能原地吗？答：可以做到 O(1) 额外空间的原地归并，但实现复杂（需要三次翻转或手摇算法），时间复杂度常数变大，工程上几乎不用。
- 追问：为什么大文件外部排序用归并？答：归并只需顺序读取两段数据，适合磁盘顺序 IO；快排的随机访问在磁盘上代价极高。
- 陷阱：合并时用 `result.push(...left.slice(i))` 展开剩余元素，元素量大时可能触发参数数量上限报错（`RangeError`），应逐个小批量追加或循环 push。

### Q32 手写二分查找，怎么找左右边界？

**考察点**：考区间开闭的细节与边界变体，是「看起来简单但很容易写错」的经典题。

**参考答案**：

> **一句话结论**：二分查找在**有序数组上每次折半比较中点**，把区间缩小一半，时间 O(log n)；查找左/右边界的关键是「命中后不要立刻返回，而是继续收缩对应方向」。

1. 标准版：`left = 0, right = n - 1`，循环条件 `left <= right`，`mid = left + ((right - left) >> 1)`。命中返回下标；`arr[mid] < target` 则 `left = mid + 1`，否则 `right = mid - 1`。循环结束未命中返回 -1。
2. 为什么要 `left + ((right - left) >> 1)` 而不是 `(left + right) / 2`：避免两数相加溢出（在 JS 里数值溢出不明显，但这个写法在强类型语言里是硬要求，属于标准答案的一部分）。
3. 左边界（第一个等于 target 的下标）：命中后不返回，执行 `right = mid - 1` 继续往左收缩，循环结束后判断 `left` 是否越界且等于 target。右边界（最后一个等于 target）对称，命中后走 `left = mid + 1`。
4. 边界场景：空数组返回 -1；数组中不存在目标；存在多个重复元素。这些都要在写完主动口述，面试官很看这一点。
5. 复杂度：时间 O(log n)，空间 O(1)（迭代版）；递归版栈深 O(log n)。

```js
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {                             // 闭区间 [left, right]
    const mid = left + ((right - left) >> 1);         // 防溢出写法
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// 左边界：第一个 >= target 的下标
function lowerBound(arr, target) {
  let left = 0, right = arr.length;                   // 左闭右开 [left, right)
  while (left < right) {
    const mid = (left + right) >> 1;
    if (arr[mid] < target) left = mid + 1;
    else right = mid;                                 // 命中后继续向左收缩
  }
  return left;                                        // 可能等于 arr.length
}
```

**追问与易错点**：

- 追问：`lowerBound` 和 `upperBound` 怎么配合求区间？答：`[lowerBound(a, t), lowerBound(a, t + 1))`（整数场景）或 `upperBound` 得到「第一个大于 target 的下标」，两者相减就是 target 出现次数。
- 陷阱：循环条件写成 `left < right` 又用闭区间，最后一个元素永远查不到；开闭区间与循环条件、指针更新必须成套一致。
- 陷阱：`mid` 用 `(left + right) >> 1` 但不注意 `>>` 对超过 2^31 的数会截断成 32 位，超大数组下要用 `Math.floor((left + right) / 2)`。

### Q33 手写快速幂，为什么要用位运算？

**考察点**：考幂运算的倍增思想与指数二进制拆解，是算法题里最容易讲出「优化意识」的一题。

**参考答案**：

> **一句话结论**：快速幂（binary exponentiation）利用 **`a^n = (a^(n/2))²`** 把指数每次折半，或按指数的二进制位逐位累乘，把 O(n) 降到 O(log n)。

1. 递归思路：`n` 为偶数时 `pow(a, n/2)²`，为奇数时 `pow(a, n/2)² * a`。注意不要写成两次递归调用（`pow(a, n/2) * pow(a, n/2)`），那会退化成 O(n)。
2. 迭代思路：把 `n` 当二进制处理，`n & 1` 判断最低位是否为 1，是就乘进结果；每轮 `base *= base`、`n >>= 1`。迭代版省去递归栈，更常被面试官认可。
3. 负指数与 0：`n = 0` 返回 1（含 `0^0 = 1` 的约定）；`n < 0` 时返回 `pow(1/a, -n)`。`-n` 要用 `-n` 而不是 `~n`，避免遗漏。
4. 取模场景：结果可能溢出（其他语言里），因此大数幂常配 `% mod`；JS 的 `Number` 在超过 2^53 后精度丢失，真正的大数幂要用 `BigInt` 或取模运算。
5. 复杂度：时间 O(log n)，空间 O(1)（迭代版）。

```js
// 迭代版：按指数二进制位累乘
function fastPow(base, exp) {
  if (exp < 0) return fastPow(1 / base, -exp);       // 负指数
  let result = 1;
  let b = base;
  let e = exp;
  while (e > 0) {
    if (e & 1) result *= b;                          // 当前位为 1，乘入结果
    b *= b;                                          // 底数平方
    e >>= 1;                                         // 指数右移一位
  }
  return result;
}
// fastPow(2, 10) === 1024；fastPow(2, -2) === 0.25
```

**追问与易错点**：

- 追问：为什么递归版写两次 `pow(a, n/2)` 就退化？答：同一子问题被重复求解，递归树从链状变成二叉状，复杂度回到 O(n)，这是分治写法最常见的错误。
- 追问：矩阵快速幂用来干什么？答：把「状态转移」写成矩阵，用快速幂把 O(n) 的线性递推降到 O(log n)，典型是求第 n 项斐波那契和爬楼梯的极大 n 版本。
- 陷阱：`n >>= 1` 对大于 2^31 的指数会被截断，超大指数应使用 `Math.floor(e / 2)` 或 `BigInt`。

### Q34 斐波那契怎么优化？从递归到 O(log n)

**考察点**：考对「重复子问题」的识别与递进优化，是动态规划入门题，能说清三档复杂度最优。

**参考答案**：

> **一句话结论**：朴素递归是 O(2^n) 且大量重复计算；加记忆化或改迭代可降到 O(n)；用**矩阵快速幂**（或快速倍增公式）可到 O(log n)。

1. 朴素递归问题：`fib(n) = fib(n-1) + fib(n-2)` 的递归树是指数级，`fib(40)` 就要上亿次调用，因为同一个 `n` 被重复求解。
2. 记忆化（memoization）：用一个数组或 `Map` 缓存已算结果，时间复杂度降到 O(n)、空间 O(n)，写法改动最小。
3. 迭代（自底向上）：只保留前两个值滚动更新，时间 O(n)、额外空间 O(1)——这是工程场景的标准答案。
4. 矩阵快速幂：把递推写成矩阵 `[[1,1],[1,0]]^n`，用 Q33 的快速幂求幂，时间 O(log n)，适合 n 极大（如 `n = 10^9`）或需要取模的场景。
5. 边界：`n = 0` 返回 0，`n = 1` 返回 1；JS 数值超过 2^53 后精度丢失（`fib(79)` 起不可靠），大数需用 `BigInt`。

```js
// O(n) 时间、O(1) 空间：工程首选
function fib(n) {
  if (n < 2) return n;                               // 含 n=0、n=1 边界
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) [prev, curr] = [curr, prev + curr];
  return curr;
}

// O(log n)：矩阵快速幂（这里直接用 BigInt 防精度丢失）
function fibFast(n) {
  if (n < 2) return BigInt(n);
  const matMul = (a, b) => [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ];
  let result = [[1n, 0n], [0n, 1n]];                 // 单位矩阵
  let base = [[1n, 1n], [1n, 0n]];
  let e = n;
  while (e > 0) {
    if (e & 1) result = matMul(result, base);
    base = matMul(base, base);
    e >>= 1;
  }
  return result[0][1];
}
```

**追问与易错点**：

- 追问：记忆化和动态规划什么关系？答：记忆化是「自顶向下 + 缓存」，动态规划是「自底向上 + 状态表」，两者都靠消除重复子问题，复杂度同阶，区别在调用方式与空间占用。
- 陷阱：以为「加个缓存就是 O(n)」却把缓存建在函数内部（每次调用重建），等于没缓存；必须建在外部或用闭包持有。
- 陷阱：`n` 很大时仍用普通 `Number`，`fib(79)` 起结果错误，面试时主动提 `BigInt` 是明显加分项。

### Q35 手写字符串模板引擎，把 `{{name}}` 替换成数据

**考察点**：考正则替换与取值安全性，模板引擎是「字符串处理 + 数据访问」的综合题。

**参考答案**：

> **一句话结论**：最简模板引擎用 **`replace` 配正则匹配 `{{key}}`**，从数据对象里取值替换；要支持嵌套路径就按 `.` 拆开逐层取值，取不到时保留原样或替换成空串。

1. 基础版正则：`/\{\{\s*([\w.]+)\s*\}\}/g`。`\s*` 容忍 `{{ name }}` 这种带空格的写法，捕获组里允许点号以支持 `user.name`。
2. 取值安全：`key.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), data)`，中途为 `null`/`undefined` 时不继续访问，避免 `Cannot read properties of undefined`。
3. 占位符策略要明确：取不到时是「保留 `{{key}}` 原样」「替换为空串」还是「抛出错误」。生产模板通常保留原样或走默认值，便于排查。
4. 转义考虑：如果数据直接来自用户输入并插入 HTML，必须做 HTML 转义（`& < > " '`）以防 XSS；只有数据可信时才允许原样替换。
5. 更完整的实现（如 `art-template`、`mustache`）还支持条件、循环、过滤器，本质是把模板编译成函数字符串（`new Function`），代价是安全与性能风险。
6. 复杂度：单次替换 O(n)（n 为模板长度）；反复 `replace` 会多次扫描，一次带 `g` 的正则替换最优。

```js
function render(template, data) {
  if (typeof template !== 'string') throw new TypeError('template 必须是字符串');
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
    const value = path.split('.').reduce(
      (acc, key) => (acc == null ? undefined : acc[key]),
      data
    );
    if (value === undefined || value === null) return match;   // 取不到保留原样
    return escapeHtml(String(value));
  });
}
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, (ch) => map[ch]);
}
// render('你好，{{user.name}}！', { user: { name: '<b>刘</b>' } }) → '你好，&lt;b&gt;刘&lt;/b&gt;！'
```

**追问与易错点**：

- 追问：为什么不用 `new Function` 编译模板？答：性能更好（只编译一次），但有代码注入风险，且 CSP 环境（禁止 `unsafe-eval`）下不可用；用字符串拼接或 `replace` 更安全。
- 陷阱：用 `eval` 或直接拼接数据到 HTML 而不转义。用户昵称填 `<img onerror=...>` 就形成 XSS，这是面试官很爱追的安全点。
- 陷阱：正则写成 `/\{\{(\w+)\}\}/g` 不支持空格与嵌套路径，`{{ user.name }}` 原样输出；面试时主动说明正则涵盖的语法范围。

### Q36 手写 JSON.stringify 的核心逻辑

**考察点**：考递归序列化 + 类型分派，重点是能说清「哪些值会被忽略、哪些会抛错」。

**参考答案**：

> **一句话结论**：`JSON.stringify` 的本质是**递归把值转成 JSON 文本**：对象转 `{...}`、数组转 `[...]`、字符串加双引号并转义、数字/布尔/`null` 直接输出，`undefined`/函数/`Symbol` 在对象里被忽略、在数组里变成 `null`。

1. 类型分派顺序：`null` → `'null'`；`number` → 非有限数（`NaN`/`Infinity`）输出 `'null'`；`boolean` → `'true'`/`'false'`；`string` → 转义后加双引号；`bigint` → 抛 `TypeError`。
2. 特殊对象：有 `toJSON` 方法的对象（如 `Date`）先调用 `toJSON()` 再序列化；`Symbol` 作为**值**会被忽略（对象里跳过、数组里 `null`），但作为**键**的 Symbol 属性本来就不在 `Object.keys` 里，自然不会被序列化。
3. 循环引用：需要维护一个「当前路径上的对象集合」（可用 `Set` 或数组栈），检测到重复引用就抛 `TypeError: Converting circular structure to JSON`。注意只需要检测**当前路径**而不是所有已访问对象，否则共享引用的兄弟节点会被误判。
4. 细节：只序列化自有可枚举属性（`Object.keys`）；缩进参数 `space` 影响可读性；中文等非 ASCII 字符现代实现不再转义为 `\uXXXX`。
5. 复杂度：时间 O(n)，n 为节点数；空间 O(d) 递归栈，d 为嵌套深度。

```js
function jsonStringify(value, seen = new Set()) {
  if (value === null) return 'null';
  const type = typeof value;
  if (type === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (type === 'boolean') return String(value);
  if (type === 'bigint') throw new TypeError('Do not know how to serialize a BigInt');
  if (type === 'string') return quote(value);
  if (type === 'undefined' || type === 'function' || type === 'symbol') return undefined; // 由上层处理
  if (typeof value.toJSON === 'function') return jsonStringify(value.toJSON(), seen);     // Date 等
  if (seen.has(value)) throw new TypeError('Converting circular structure to JSON');
  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    const items = Array.from(value, (v) => {           // Array.from 会把空位当 undefined，从而输出 null
      const s = jsonStringify(v, seen);
      return s === undefined ? 'null' : s;            // 数组内非法值变 null
    });
    result = `[${items.join(',')}]`;
  } else {
    const parts = [];
    for (const key of Object.keys(value)) {           // 仅自有可枚举
      const s = jsonStringify(value[key], seen);
      if (s !== undefined) parts.push(`${quote(key)}:${s}`);   // 对象内非法值跳过
    }
    result = `{${parts.join(',')}}`;
  }
  seen.delete(value);                                 // 离开当前路径，允许兄弟共享引用
  return result;
}
function quote(str) {
  // 与原生一致：\n \r \t \b \f 用短转义，其余控制字符用 \uXXXX
  const short = { '"': '\\"', '\\': '\\\\', '\b': '\\b', '\f': '\\f', '\n': '\\n', '\r': '\\r', '\t': '\\t' };
  return `"${str.replace(/[\\"\u0000-\u001f]/g, (ch) =>
    short[ch] || `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`)}"`;
}
```

**追问与易错点**：

- 追问：`JSON.stringify({a: undefined, b: 1})` 结果是什么？答：`{"b":1}`，`a` 被整个键值对丢掉；而 `JSON.stringify([undefined])` 是 `[null]`，长度不变。这个差异必背。
- 追问：为什么要 `seen.delete(value)`？答：只检测环，不检测共享引用。`const shared = {x:1}; stringify({a: shared, b: shared})` 是合法 JSON，若用全局 visited 就会误报循环。
- 陷阱：把 `Symbol` 值序列化成字符串或直接跳过整个键。正确行为是「对象里跳过该键、数组里替换为 `null`」，与 `undefined`/函数一致。

### Q37 手写函数记忆化 memoize

**考察点**：考缓存键设计与缓存容量控制，重点是能指出「只缓存引用类型键会失效」。

**参考答案**：

> **一句话结论**：`memoize` 用缓存保存「入参 → 结果」的映射，命中直接返回，**要求被记忆的函数是纯函数**（相同入参必得相同结果、无副作用）。

1. 缓存结构：单参数用 `Map` 即可，键可以是对象引用；多参数用数组序列化（`JSON.stringify(args)`）或「首参做外层 Map、剩余参数做内层 Map」的分层缓存。
2. 键设计是核心难点：`JSON.stringify` 会把 `{a:1,b:2}` 与 `{b:2,a:1}` 视为不同键（属性顺序不同），也会丢掉函数与 `undefined`；`Map` 按引用做键则要求调用方复用同一对象。
3. `this` 处理：用 `fn.apply(this, args)` 并让缓存键包含 `this`（或用 `WeakMap` 按实例分层），否则不同实例的方法调用会串结果。
4. 缓存膨胀：无限缓存会内存泄漏，需要容量上限（配 LRU）或 TTL 过期；对象键场景优先用 `WeakMap` 让缓存随对象回收。
5. 应用场景：递归算法加速（斐波那契、路径计算）、React 中避免重复昂贵计算、接口结果缓存。注意副作用函数（发请求、改 DOM）绝对不能记忆化。
6. 复杂度：命中 O(1)（`Map`）或 O(k)（序列化键，k 为参数规模）；空间 O(缓存条目数)。

```js
function memoize(fn, resolver) {
  const cache = new Map();
  return function (...args) {
    // resolver 允许自定义键：memoize(fn, (...a) => a[0].id)
    const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);              // 仅纯函数可安全缓存
    cache.set(key, result);
    return result;
  };
}

// 对象键场景：用 WeakMap 避免内存泄漏
function memoizeByRef(fn) {
  const cache = new WeakMap();
  return function (obj) {
    if (cache.has(obj)) return cache.get(obj);
    const result = fn.call(this, obj);
    cache.set(obj, result);
    return result;
  };
}
```

**追问与易错点**：

- 追问：为什么用 `WeakMap` 而不是 `Map` 存对象键？答：`Map` 强引用键，缓存过的对象无法被回收，长期运行会内存泄漏；`WeakMap` 的键是弱引用，对象被回收后条目自动清理，代价是不能遍历、没有 `size`。
- 陷阱：缓存异步函数返回的 Promise 但请求失败后不删除缓存，一次网络抖动会让错误结果被永久缓存；正确做法是 `promise.catch(e => { cache.delete(key); throw e; })`。
- 陷阱：对含 `undefined` 或函数参数的调用使用 `JSON.stringify` 键，`f(1, undefined)` 与 `f(1)` 会被认为同一个键，结果串味。

### Q38 手写 once，只允许执行一次

**考察点**：考闭包状态与返回值语义，是「简单题里考严谨度」的代表。

**参考答案**：

> **一句话结论**：`once` 用闭包里的标志位保证函数**只真正执行一次，之后每次调用都返回首次的结果**；连首次抛错是否算「已执行」也要明确。

1. 实现骨架：闭包持有 `called` 标志与 `result`，第一次调用执行并把标志置为 `true`，后续调用直接返回缓存结果。
2. 返回值语义：原生 `lodash.once` 的做法是后续调用返回第一次的返回值；如果第一次返回 `undefined`，也要保持一致（不能写成「有结果才返回」）。
3. 异常语义分歧：若首次执行抛错，某些实现会把 `called` 置回 `false` 允许重试（适合初始化失败可恢复的场景）；另一些实现无论成败只执行一次（适合「只允许触发一次」的语义）。要主动说明选择，这是高频追问。
4. `this` 与参数：首次执行必须 `fn.apply(this, args)`，后续调用忽略传入参数，不能因为参数变化而重新执行。
5. 复杂度：O(1) 时间与空间。

```js
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (called) return result;                        // 之后恒返回首次结果
    called = true;                                    // 先置标志，防止递归自调用
    try {
      result = fn.apply(this, args);
    } catch (err) {
      called = false;                                 // 失败允许重试；若要求严格一次则删掉此行
      throw err;
    }
    return result;
  };
}
// 典型用法：只初始化一次
const init = once(() => { console.log('init'); return 42; });
init(); init(); // 只打印一次 init，两次都返回 42
```

**追问与易错点**：

- 追问：为什么 `called = true` 要放在执行之前？答：防止函数内部递归调用自己时无限重入；若放在执行之后，递归场景会重复执行。
- 追问：首次执行返回 Promise 但失败了怎么处理？答：`once` 只监听同步抛错，异步失败要走 Promise 分支：`.catch(e => { called = false; throw e; })`，否则失败结果被永久缓存。
- 陷阱：后续调用写成 `return fn.apply(this, args)`，等于没有缓存，`once` 完全失效；只看了「第一次执行」却忘了「后续不再执行」。

### Q39 手写偏函数 partial，它和柯里化差在哪？

**考察点**：考参数预置（partial application）的实现与绑定语义，常与 `bind`、柯里化对照。

**参考答案**：

> **一句话结论**：偏函数**一次性预置若干个参数，返回等待剩余参数的新函数**；柯里化是「每次只收一个（或一批）参数」的链式调用，偏函数是它的简化形态。

1. 核心实现：把预置参数与调用时参数拼成完整参数列表，再 `fn.apply(this, args)`。与 `bind` 的差别是偏函数**不绑定 `this`**（也可以让调用方决定）。
2. 占位符场景：`lodash.partial.placeholder` 允许用 `_` 占位，调用时把占位替换成实参，适合「第二个参数才需要动态传」的接口适配（如 `request(url, options)` 里先固定 `url`）。
3. 与 `bind` 的关系：`fn.bind(null, a)` 就是一种偏函数，但它把 `this` 固定成 `null`，且 `bind` 还有构造函数兼容逻辑；偏函数更纯粹，只处理参数。
4. 与柯里化的关系：柯里化 `curry(f)(1)(2)` 需要按 `fn.length` 判断结束；偏函数 `partial(f, 1)` 可以一次预置任意个数，也可以多次 `partial` 叠加。
5. 复杂度：调用时参数拼接 O(n)，空间 O(n)；每次 `partial` 产生一层闭包。

```js
function partial(fn, ...preset) {
  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  return function (...args) {
    // 逐个填坑：预置参数里的占位符用调用参数补上
    let i = 0;
    const merged = preset.map((p) => (p === partial.placeholder ? args[i++] : p));
    return fn.apply(this, [...merged, ...args.slice(i)]);
  };
}
partial.placeholder = Symbol('placeholder');           // 占位符

// 用法一：预置前置参数
const logInfo = partial(console.log, '[INFO]');
logInfo('started');                                    // 打印 "[INFO] started"

// 用法二：用占位符把「第一个参数」留到调用时再传
const buildReq = partial((url, opts) => `${opts.method} ${url}`, partial.placeholder, { method: 'POST' });
buildReq('/api/user');                                 // 'POST /api/user'
```

**追问与易错点**：

- 追问：`partial(f, 1)(2, 3)` 和 `curry(f)(1)(2, 3)` 结果一样吗？答：对三参函数结果一样，都是调用 `f(1, 2, 3)`；但柯里化的 `curry(f)(1)` 是否立即执行取决于 `fn.length`，偏函数不会自动执行。
- 陷阱：占位符用 `undefined` 判断。若预置参数里本来就想传 `undefined`，会被误当占位符吞掉，所以 lodash 用专门的 sentinel 对象。
- 陷阱：实现里写成 `fn(preset.concat(args))`，传进去的是数组而不是展开后的参数；展开与合并的边界必须清晰。

### Q40 类数组怎么转成真数组？三种写法有什么差别

**考察点**：考「类数组 vs 可迭代对象」的区别以及各转换手段的适用边界，是基础题里最容易答漏的。

**参考答案**：

> **一句话结论**：类数组是**有 `length` 和数字下标但没有数组方法、也没有 `Symbol.iterator` 的对象**；转数组首选 `Array.from`，它同时支持类数组与可迭代对象。

1. `Array.from(arrayLike)`：最通用，接受类数组（`{0:'a', length:1}`）和可迭代对象（`Set`、`Map`、字符串、`NodeList`），还支持第二个映射参数，等同于 `Array.from(x, fn)` = `[...x].map(fn)` 但少一次遍历。
2. `[...arrayLike]`：只对**可迭代对象**有效。对纯类数组（无 `Symbol.iterator`）会抛 `TypeError: arrayLike is not iterable`，这是最常见的踩坑点。`arguments` 在 ES6 中已自带迭代器，可以用展开。
3. `Array.prototype.slice.call(arrayLike)`：利用 `slice` 的通用性，只依赖 `length` 与下标，因此对纯类数组也有效；但它读的是索引属性，遇到带 `getter` 或超大对象会有额外开销，且语义不如 `Array.from` 直白。
4. 性能与语义取舍：`[...]` 与 `Array.from` 都走迭代器协议，对已有迭代器的对象更快；`slice.call` 是 ES5 的老写法，在新代码里不推荐，但读老代码必须认识。
5. 复杂度：三者均为 O(n) 时间、O(n) 空间；`Array.from` 可选映射函数，避免中间数组。

```js
// 纯类数组（没有 Symbol.iterator）
const arrayLike = { 0: 'a', 1: 'b', length: 2 };
Array.from(arrayLike);                 // ['a', 'b']
Array.prototype.slice.call(arrayLike); // ['a', 'b']（ES5 写法）
// [...arrayLike];                     // TypeError: not iterable

// 带迭代器的对象：三种都行
const set = new Set([1, 2]);
[...set];                              // [1, 2]
Array.from(set, (x) => x * 2);         // [2, 4]，边转边映射

// 真实场景：把 DOM 集合转数组后才能用 map/filter
const nodes = Array.from(document.querySelectorAll('.item'));
```

**追问与易错点**：

- 追问：为什么现代代码推荐 `Array.from`？答：它统一了类数组与可迭代两条路径，语义明确、可传映射函数、不依赖 `Array.prototype` 被改写，可读性也最好。
- 陷阱：对 `document.querySelectorAll` 的结果用展开运算符是可行的（`NodeList` 有迭代器），但对 `{length: 2}` 这类纯类数组就会抛错，答题时必须区分。
- 陷阱：`Array.prototype.slice.call(obj)` 遇到 `length` 不是合法数字（如字符串 `'2'`）行为不可预期；`Array.from` 也会读 `length`，但两者的 `length` 处理细节不同，严格场景要自己校验。

### Q41 手写 Array.prototype.reduce

**考察点**：考 `reduce` 的完整语义（初始值、空数组、空位），是「以为自己会」的典型题。

**参考答案**：

> **一句话结论**：`reduce` **用累加器逐个消费数组元素并返回最终单一值**；不传初始值时用第一个元素当初始值，空数组不传初始值必须抛 `TypeError`。

1. 参数处理：第二个参数可以合法是 `undefined`，所以**不能用 `if (!initialValue)` 判断**，要用 `arguments.length >= 2` 或哨兵值判断是否传了初始值。
2. 空数组分支：数组为空且未传初始值 → 抛 `TypeError: Reduce of empty array with no initial value`；传了初始值则直接返回该初始值。
3. 空位（sparse array）处理：规范里 `reduce` 会**跳过空位**（`[1, , 3]` 只回调两次），所以遍历要用 `in` 判断，而不是直接下标取值。
4. 回调签名：`(accumulator, currentValue, index, array)`，`thisArg` 作为第三个参数可选，要 `callback.call(thisArg, ...)` 传下去。
5. 复杂度：时间 O(n)，空间 O(1)。

```js
Array.prototype.myReduce = function (callback, initialValue, thisArg) {
  if (typeof callback !== 'function') throw new TypeError(`${callback} is not a function`);
  const arr = Object(this);                            // 兼容类数组调用
  const len = arr.length >>> 0;                        // 无符号化，防止 length 异常
  let i = 0;
  let acc;
  if (arguments.length >= 2) {                         // 关键：用 arguments 判断是否传了初值
    acc = initialValue;
  } else {
    while (i < len && !(i in arr)) i++;                // 找第一个非空位元素
    if (i >= len) throw new TypeError('Reduce of empty array with no initial value');
    acc = arr[i++];
  }
  for (; i < len; i++) {
    if (!(i in arr)) continue;                         // 跳过空位，与原生一致
    acc = callback.call(thisArg, acc, arr[i], i, arr);
  }
  return acc;
};
// [1, , 3].myReduce((a, b) => a + b) 的结果是 4，回调只执行两次
```

**追问与易错点**：

- 追问：`[1, 2, 3].reduce((a, b) => a + b, 0)` 回调执行几次？答：三次（有初始值），`index` 依次是 0、1、2；不传初始值时回调只执行两次，`index` 从 1 开始。这个差异常被追问。
- 追问：`reduce` 能做哪些事？答：数值聚合、数组转对象（按 id 建索引）、数组去重、拍平、`compose` 组合函数、并发控制链——它是最通用的数组方法。
- 陷阱：用 `initialValue === undefined` 判断是否传了初值。`arr.reduce(fn, undefined)` 按规范属于「传了初值」，结果应为 `undefined`；用 `=== undefined` 判断会误判成「没传」并拿首元素当初值。

### Q42 手写 Object.create

**考察点**：考原型链的建立方式与 `null` 原型的特殊语义，是原型章节的标准延伸题。

**参考答案**：

> **一句话结论**：`Object.create(proto)` **创建一个新对象，并把它的原型指向 `proto`**；`proto` 为 `null` 时创建无原型对象，此时 `toString` 等方法都不存在。

1. 现代等价写法：`Object.setPrototypeOf({}, proto)` 能得到同样结果，但它是在**已有对象**上改原型，会破坏引擎的内联缓存，规范明确不推荐用于新建对象。
2. ES5 经典 polyfill：造一个空函数 `F`，把 `F.prototype` 指向 `proto`，再 `new F()`。这是「借用构造函数建立原型链」的经典手法，也是手写题的标准答案。
3. `null` 分支：`proto` 为 `null` 时不能走 `new F()`（那会得到以 `Object.prototype` 为原型的对象），应直接返回真正的无原型对象。
4. 第二个参数：`Object.create(proto, propertiesObject)` 支持属性描述符，等价于创建后逐个 `Object.defineProperty`，手写时按 `Object.defineProperties` 处理。
5. 复杂度：O(1) 创建，O(p) 处理属性描述符，p 为描述符个数。

```js
function myObjectCreate(proto, propertiesObject) {
  if (proto !== null && typeof proto !== 'object' && typeof proto !== 'function') {
    throw new TypeError('Object prototype may only be an Object or null');
  }
  let obj;
  if (proto === null) {
    obj = Object.create(null);                         // 真正的无原型对象
  } else {
    function F() {}                                    // 空壳构造函数
    F.prototype = proto;                               // 挂上目标原型
    obj = new F();                                     // 实例的原型即 proto
  }
  if (propertiesObject) Object.defineProperties(obj, propertiesObject);
  return obj;
}
// 无原型对象连 toString 都没有：String(myObjectCreate(null)) 会抛 TypeError
```

**追问与易错点**：

- 追问：`Object.create(null)` 有什么用？答：创建「纯净字典对象」，没有原型链污染风险，适合做缓存表或当作轻量 `Map`；代价是没有 `hasOwnProperty`、`toString` 等方法，用它当对象时 `JSON.stringify` 仍正常。
- 追问：`new F()` 和 `{}` 的区别？答：`{}` 的原型固定是 `Object.prototype`；`new F()` 的原型由 `F.prototype` 决定，这正是手写 `Object.create` 的关键机制。
- 陷阱：把 `F.prototype = proto` 写成 `F.prototype = proto.prototype`，多取了一层原型，`myObjectCreate(Child.prototype)` 会得到以 `Child` 为原型的对象，而不是以 `Child.prototype` 为原型——继承链直接错位。

### Q43 手写事件委托，它解决了什么问题

**考察点**：考事件冒泡机制与委托的工程价值，是 DOM 与性能结合的常见题。

**参考答案**：

> **一句话结论**：事件委托（event delegation）**把子元素的事件监听统一挂到父元素上，利用事件冒泡在父级判断 `event.target` 是否为关心的子元素**，从而减少监听器数量并支持动态新增元素。

1. 原理：事件冒泡（bubbling）让子元素触发的事件依次向上传播；在父级监听即可捕获所有子元素事件。注意 `focus`、`blur` 不冒泡（需用 `focusin`/`focusout`），`mouseenter`/`mouseleave` 也不冒泡。
2. 好处一：DOM 节点从 N 个监听器降到 1 个，减少内存与初始化开销（长列表、表格行尤其明显）。
3. 好处二：动态增删的子元素无需重新绑定与解绑，避免漏解绑导致的内存泄漏。
4. 边界：必须用 `event.target.closest(selector)` 向上找匹配元素而不是直接比较 `target`，因为点击的可能是子元素内部的 `span`；同时要判断匹配结果是否还在当前委托容器内。
5. 复杂度：绑定 O(1)；单次事件处理需沿 DOM 向上查找，最坏 O(d)，d 为嵌套深度，远优于给 N 个节点逐个绑定。

```js
function delegate(container, selector, type, handler) {
  const listener = (event) => {
    const matched = event.target.closest(selector);     // 从 target 向上找最近匹配元素
    if (!matched || !container.contains(matched)) return; // 必须仍在容器内
    handler.call(matched, event, matched);              // this 指向匹配元素
  };
  container.addEventListener(type, listener);
  return () => container.removeEventListener(type, listener);   // 返回解绑函数
}

// 用法：列表项动态增删都无需重新绑定
const ul = document.querySelector('#list');
const off = delegate(ul, 'li.item', 'click', function (e, el) {
  console.log('点击了', el.dataset.id, this === el);   // true
});
```

**追问与易错点**：

- 追问：为什么不能直接判断 `event.target === 目标元素`？答：子元素（图标、包裹文本的 `span`）会先成为 `target`，直接比较会漏掉大量点击；`closest` 才能向上收敛到委托目标。
- 追问：`stopPropagation` 会影响委托吗？答：会。子元素若调用 `stopPropagation`，事件到不了委托容器，委托彻底失效——这是第三方组件里最常见的委托失灵原因。
- 陷阱：忘记 `container.contains(matched)` 判断。若容器外也有同选择器元素，且嵌套了外层委托，会误触发本容器的处理逻辑；另外 `closest` 在旧浏览器（IE）不支持，需要自己写循环。

### Q44 手写一个事件总线 EventBus（含 once 与 clear）

**考察点**：考跨组件通信方案的设计，与 `EventEmitter` 相比更强调 API 形态与销毁时机。

**参考答案**：

> **一句话结论**：事件总线就是**一个全局共享的发布订阅中心**，组件 `on` 订阅、`emit` 触发、`off` 解绑，用于任意两个组件间通信；本质与 `EventEmitter` 一致。

1. 与 `EventEmitter` 的差别：EventBus 强调「谁都能拿到同一个实例」，通常导出单例；Vue2 的常见做法是 `new Vue()` 当总线，Vue3 移除了 `$on`/`$off`，要改用 `mitt`、`tiny-emitter` 或 `provide/inject`。
2. `once` 实现：包装函数执行前先解绑。若用数组存回调，必须把原回调挂在包装函数上，否则 `off(type, fn)` 无法移除。
3. `clear` 的必要性：微前端或组件库场景里总线的生命周期比页面长，组件卸载时必须清理自己的订阅；更稳的做法是 `on` 返回解绑函数，`onMounted` 订阅、`onUnmounted` 调用解绑。
4. 常见坑：回调抛错会中断后续订阅者的执行。业务总线通常用 `try/catch` 包裹每个回调并上报错误，避免一个订阅者炸掉整条链。
5. 复杂度：`on` O(1)、`off` O(k)、`emit` O(k)，k 为订阅者数；空间 O(总订阅数)。

```js
class EventBus {
  constructor() { this.handlers = new Map(); }
  on(type, handler) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type).push(handler);
    return () => this.off(type, handler);              // 返回解绑函数，便于卸载时清理
  }
  once(type, handler) {
    const wrapper = (...args) => { this.off(type, wrapper); handler(...args); };
    wrapper.raw = handler;                             // 支持 off(type, 原函数)
    return this.on(type, wrapper);
  }
  off(type, handler) {
    const list = this.handlers.get(type);
    if (!list) return this;
    if (!handler) { this.handlers.delete(type); return this; }
    this.handlers.set(type, list.filter((fn) => fn !== handler && fn.raw !== handler));
    return this;
  }
  emit(type, ...args) {
    const list = this.handlers.get(type);
    if (!list) return this;
    [...list].forEach((fn) => {                        // 快照遍历，允许回调里解绑
      try { fn(...args); } catch (e) { console.error(`[EventBus] ${type} 处理失败`, e); }
    });
    return this;
  }
  clear() { this.handlers.clear(); return this; }
}
export const bus = new EventBus();                     // 单例导出
```

**追问与易错点**：

- 追问：Vue3 为什么去掉 `$on`？答：官方推荐用更明确的方案（`provide/inject`、`props/emits`、状态库），全局事件总线难以追踪数据流，且容易忘记解绑造成内存泄漏。
- 追问：`mitt` 和手写有什么差别？答：`mitt` 只有约 200 字节，用对象 + 数组实现，`on` 返回解绑函数；它不支持 `once`，语义更精简。
- 陷阱：`emit` 直接遍历原数组，回调内部 `off` 或 `on` 会导致跳过订阅者甚至死循环；必须先 `[...list]` 快照。

### Q45 封装一个简易 fetch 请求库（拦截器 + 超时）

**考察点**：考工程化封装能力：请求/响应拦截器、超时、取消与错误归一化，是实战型深挖题。

**参考答案**：

> **一句话结论**：封装的核心是**用一个可插拔的拦截器数组把「配置」和「响应」串成 Promise 链**，在链上统一注入 token、做超时与取消、把各类错误归一成统一结构抛出。

1. 拦截器设计：`requestInterceptors` 与 `responseInterceptors` 两个数组，前者按注册顺序改造 config，后者接响应并返回结果或抛错——这直接对应 `axios` 的 `use` 模型。
2. 超时实现：用 `AbortController` 在超时后 `abort()`，并在 `finally` 里 `clearTimeout`。相比 `Promise.race`，它**真正中断连接**，节省带宽。
3. 错误归一化：网络错误、超时（`AbortError`）、HTTP 4xx/5xx（`response.ok === false`）要区分开，统一包装成 `{ code, message, status }` 抛出，让业务不用关心底层差异。
4. 取消与重复请求：把 `AbortController` 按「method + url」存进 Map，发起同键请求前先 abort 旧的，可解决搜索框竞态导致的「旧结果覆盖新结果」。
5. 序列化与默认值：`Content-Type: application/json` 时自动 `JSON.stringify(body)`；GET 用 `URLSearchParams` 拼参数；未定义 `body` 时不能传 `null`，否则部分服务端会解析失败。
6. 复杂度：单次请求 O(1) 额外处理；拦截器链 O(m)，m 为拦截器个数。

```js
const pending = new Map();                             // 重复请求控制：key → controller

function createHttp({ baseURL = '', timeout = 10000 } = {}) {
  const reqInterceptors = [];
  const resInterceptors = [];
  return {
    interceptors: {
      request: { use: (fn) => reqInterceptors.push(fn) },
      response: { use: (fn, onRejected) => resInterceptors.push({ fn, onRejected }) },
    },
    async request(url, { method = 'GET', params, data, headers = {}, signal } = {}) {
      let config = { url: baseURL + url, method, params, data, headers, signal, timeout };
      for (const fn of reqInterceptors) config = (await fn(config)) || config;   // 1. 请求链

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error('timeout')), config.timeout);
      config.signal?.addEventListener('abort', () => controller.abort(config.signal.reason));

      const key = `${config.method} ${config.url}`;        // 2. 同键请求先取消旧的
      pending.get(key)?.abort(new Error('canceled by newer request'));
      pending.set(key, controller);

      try {
        const query = config.params ? '?' + new URLSearchParams(config.params) : '';
        const res = await fetch(config.url + query, {
          method: config.method,
          headers: { 'Content-Type': 'application/json', ...config.headers },
          body: config.data ? JSON.stringify(config.data) : undefined,
          signal: controller.signal,
        });
        if (!res.ok) {                                    // 3. HTTP 状态错误单独归一
          const error = new Error(`HTTP ${res.status}`);
          error.status = res.status;
          throw error;
        }
        let payload = await res.json();
        for (const { fn } of resInterceptors) payload = (await fn(payload)) ?? payload;  // 4. 响应链
        return payload;
      } catch (err) {                                     // 5. 错误归一化
        const normalized = err.name === 'AbortError'
          ? Object.assign(new Error('请求已取消或超时'), { code: 'ABORT' })
          : Object.assign(err, { code: err.status ? 'HTTP' : 'NETWORK' });
        for (const { onRejected } of resInterceptors) if (onRejected) return onRejected(normalized);
        throw normalized;
      } finally {
        clearTimeout(timer);                              // 必须清理，避免定时器悬挂
        if (pending.get(key) === controller) pending.delete(key);
      }
    },
  };
}
export const http = createHttp({ baseURL: '/api', timeout: 8000 });
```

**追问与易错点**：

- 追问：为什么用 `AbortController` 而不是 `Promise.race` 做超时？答：`race` 只是不再等待结果，请求仍在后台跑完并占用连接；`AbortController` 会真正中断 fetch，是唯一能取消的手段。
- 追问：响应拦截器里怎么统一处理 401？答：在拦截器里判断业务码或 `status`，触发登出并 `throw` 中断后续链路；拦截器抛错后必须让错误继续往外抛，否则业务层拿不到失败信号。
- 陷阱：`finally` 里不 `clearTimeout`。请求成功后定时器仍会到点触发 `abort()`，可能取消掉后续复用同一 `signal` 的请求，也会造成定时器堆积。
- 陷阱：重复请求控制按「全局 loading 计数」去 cancel，会把正常并发请求也取消；必须按「method + url」维度区分。

### Q46 手写 uuid 生成（v4 版本）

**考察点**：考对 `Math.random` 与 `crypto` 的取舍、格式规范（版本位与变体位），属于细节实现题。

**参考答案**：

> **一句话结论**：UUID v4 是**由 32 个随机十六进制字符组成、按 `8-4-4-4-12` 分段、并把第 13 位固定为 `4`、第 17 位固定为 `8/9/a/b`** 的随机标识符。

1. 格式要求：第 13 个十六进制字符必须是 `4`（版本号），第 17 个字符必须是 `8`、`9`、`a`、`b` 之一（变体位）。只生成 32 个随机字符而不设置这两位，得到的就不是合法 v4 UUID。
2. 随机源：生产环境首选 `crypto.randomUUID()`（浏览器安全上下文与 Node 14.17+ 支持），其次 `crypto.getRandomValues()`；`Math.random` 不是密码学安全随机源，只适合前端埋点 ID，绝不能用于 token、邀请码等安全场景。
3. 实现思路：取 16 个随机字节 → 逐字节 `toString(16).padStart(2, '0')` 拼成 32 位十六进制 → 覆写版本位与变体位 → 按模板插入 `-`。
4. 碰撞概率：v4 有 122 位随机位，约 5.3×10³⁶ 种取值，需生成约 2.7×10¹⁸ 个才有 50% 概率出现一次碰撞，前端生成 ID 的场景足够安全。
5. 复杂度：O(1) 时间与空间（固定 36 字符）。

```js
function uuidv4() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();   // 原生优先
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    crypto.getRandomValues(bytes);                     // 密码学安全随机
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);  // 降级
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;                 // 版本位 → 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80;                 // 变体位 → 10xx
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
// 结果形如 'f47ac10b-58cc-4372-a567-0e02b2c3d479'：第 13 位是 4，第 17 位在 8-b 之间
```

**追问与易错点**：

- 追问：`crypto.randomUUID` 有什么限制？答：只在**安全上下文**（HTTPS 或 localhost）可用，HTTP 页面下它是 `undefined`，必须做降级；`getRandomValues` 的可用范围更广。
- 追问：为什么不能用 `Math.random` 生成邀请码或订单号？答：`Math.random` 是可预测的伪随机数，攻击者可通过少量输出推断状态；安全标识必须在服务端生成或用 `crypto`。
- 陷阱：用 `'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ...)` 时把 `y` 也替换成纯随机十六进制，变体位不正确，`uuid` 之类的校验库会判定非法。

### Q47 滚动监听该用节流还是防抖？rAF 方案好在哪

**考察点**：考场景与实现的匹配能力，能说出「滚动、rAF、被动监听、布局抖动」四层即为深挖答案。

**参考答案**：

> **一句话结论**：滚动过程需要**持续反馈**（视差、进度条、吸顶）用节流且首选 `requestAnimationFrame` 版；只需要**滚动结束后的最终状态**（收尾埋点、一次性计算）用防抖。

1. 为什么滚动不能用防抖裸奔：防抖只在滚动停止后触发一次，滚动中什么都不执行，视差与进度条会「卡住不动」，体验割裂。
2. 为什么时间戳节流也不是最优：滚动事件触发频率可能高于屏幕刷新率（高刷屏、触控板惯性滚动），节流成 16ms 也未必与渲染帧对齐，容易「一帧内多次计算 + 多帧不计算」而抖动。
3. rAF 节流写法：事件回调里只在没有待执行帧时才 `requestAnimationFrame`，帧回调里读取最新滚动位置并执行任务。这样**每次渲染最多算一次**，天然与刷新率对齐。
4. 浏览器细节：滚动监听加 `{ passive: true }` 明确承诺不调 `preventDefault`，浏览器可立即滚动而不用等回调执行完。真正的高性能滚动优先用 `IntersectionObserver`（可见性）与 `ResizeObserver`（尺寸），让主线程完全不参与。
5. 取舍总结：动画与视觉同步 → rAF 版节流；业务收尾动作 → 防抖；元素进出视口 → `IntersectionObserver`，三者不冲突。

```js
// rAF 版节流：每个渲染帧最多执行一次，适合滚动动画与进度更新
function rafThrottle(fn) {
  let rafId = null;
  let lastArgs = null;
  const throttled = function (...args) {
    lastArgs = args;
    if (rafId !== null) return;                        // 本帧已排期，直接跳过
    rafId = requestAnimationFrame(() => {
      rafId = null;
      fn.apply(this, lastArgs);
    });
  };
  throttled.cancel = () => {                           // 组件卸载时务必调用
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  };
  return throttled;
}

const onScroll = rafThrottle(() => {
  const top = window.scrollY;                          // 批量读取，避免布局抖动
  bar.style.transform = `scaleX(${top / docHeight})`;  // transform 只走合成层
});
window.addEventListener('scroll', onScroll, { passive: true });
// 卸载时：onScroll.cancel(); window.removeEventListener('scroll', onScroll);
```

**追问与易错点**：

- 追问：`passive: true` 到底是什么？答：告诉浏览器回调不会调用 `preventDefault`，浏览器无需等待回调执行就能开始滚动，能显著降低滚动延迟；代价是回调里 `preventDefault` 会被忽略并打印警告。
- 追问：为什么动画优先改 `transform`/`opacity`？答：改 `top`、`height` 会触发重排甚至整页重绘，`transform`/`opacity` 只走合成，不阻塞主线程。
- 陷阱：滚动回调里先读 `offsetTop` 再写样式，反复「读 → 写 → 读」触发强制同步布局，滚动直接掉帧；应批量读取并缓存，把写操作集中到帧回调末尾。

## 本章小结

- 手写题的得分结构是「思路 + 代码 + 边界 + 复杂度」，写完主动补一句边界处理，比多写十行代码更值钱。
- `call`/`apply`/`bind` 本质都是改变 `this` 绑定：借方法调用、传参形式不同、`bind` 还要处理 `new` 优先级与原型链继承。
- `new` 四步：建原型对象、绑定 `this` 执行、按返回值决定结果、`instanceof` 靠原型链；深拷贝必须用 `WeakMap` 断环并保留原型与属性描述符。
- 防抖是「只执行最后一次」，节流是「固定频率执行」；滚动动画用 rAF 版节流，业务收尾用防抖，可见性交给 `IntersectionObserver`。
- `Promise` 的骨架是不可逆状态机 + 回调队列 + 异步执行；`all` 快失败、`allSettled` 全等、`race` 先落定、`any` 先成功，四个语义要能一句话分清。
- 并发控制靠「先起 `max` 个，完成一个补一个」，结果按原始下标写入才能保序；`retry` 必须配指数退避与抖动，并且只重试可重试错误。
- LRU 用 `Map` 的插入顺序当使用顺序，`get` 命中后必须「先删再存」，否则退化成 FIFO。
- 排序、查找与工具函数记住这几组结论：快排平均 O(n log n) 最坏 O(n²)、归并恒定 O(n log n) 且稳定需 O(n) 空间、二分 O(log n)；类数组转数组用 `Array.from`、去重首选 `Set`、洗牌用 Fisher-Yates、记忆化只用于纯函数、缓存对象键用 `WeakMap`。

<!-- COUNT: 47 -->


