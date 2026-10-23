---
title: "第 15 章 TypeScript"
---

## 第 15 章 TypeScript

### Q1 TypeScript 比 JavaScript 好在哪？用它有什么代价？

**考察点**：考的是价值与成本的取舍判断，不是背"TS 是 JS 的超集"。答出"编译期检查 + 类型擦除 + 什么项目值得上"才算过关。

**参考答案**：

> **一句话结论**：TypeScript 的价值是把类型错误从运行时前移到编译期，并用类型充当可被工具消费的文档；代价是编写与检查成本、类型体操的可读性损耗，以及与无类型生态的摩擦。

1. 收益一：静态检查。拼错属性名、少传参数、把 string 当 number 用，编译期就报错，不用等线上白屏。
2. 收益二：工具能力。IDE 补全、跳转、重命名重构都依赖类型信息，这是大项目维护效率的主要来源。
3. 收益三：协作契约。接口形状写进类型后，前后端、多人协作时不用靠口头约定。
4. 成本一：要写类型、要维护 tsconfig、CI 要多跑一遍类型检查；第三方库缺类型时还要自己补 `.d.ts`。
5. 成本二：类型写得过深（类型体操）会牺牲可读性和编译速度，`any` 泛滥则让收益直接归零。
6. 判断：中大型、多人、生命周期长的项目收益最大；一次性脚本、原型验证收益有限。

**追问与易错点**：

- 追问：TS 能保证运行时不报错吗？答：不能，类型只在编译期存在，编译后会被擦除（Type Erasure），接口返回的数据形状它管不到。
- 陷阱：只说"TS 是 JS 的超集所以更安全"太浅，必须补上"类型擦除"和"只在编译期生效"这两点。

### Q2 听说 TypeScript 的类型系统是结构化的，和 Java 那种有什么区别？

**考察点**：考结构化类型（Structural Typing，俗称鸭子类型）与名义类型（Nominal Typing）的本质差异，以及 TS 里少数名义性来源。

**参考答案**：

> **一句话结论**：TS 只看类型的"形状"是否兼容，不看你有没有显式声明继承或实现；Java/C# 看声明关系，名字对不上就不兼容。

1. 结构化的含义：只要成员的名称与类型匹配，两个类型就互相兼容，不需要 `implements`，也不需要继承同一父类。
2. 名义类型的含义：必须显式声明 `implements IUser` 才算实现，形状相同也没用，好处是能防止语义不同的类型互相赋值。
3. TS 里残留的名义性：类的 `private`/`protected` 成员只有在同一处声明时才兼容，这让带私有成员的类之间变成名义比较；`enum` 成员也近似名义。
4. 结构化的坑：偶然兼容（Accidental Compatibility）。`UserId` 和 `OrderId` 都是 string，互相赋值不报错。
5. 补救办法：品牌类型（Branded Type），用交叉类型伪造一个不存在的成员，模拟名义类型。
6. 结构化的好处：天然适配 JS 生态，不用改运行时就能给第三方库补类型。

```ts
interface Point { x: number; y: number }
class Vec { constructor(public x: number, public y: number) {} }
const p: Point = new Vec(1, 2); // 结构兼容，无需 implements

// 品牌类型：模拟名义类型，防止两个 string 语义互串
type UserId = string & { readonly __brand: 'UserId' };
const id = 'u_1' as UserId;
```

**追问与易错点**：

- 追问：结构化类型最常见的线上事故是什么？答：把两个形状相同但业务含义不同的对象互相传递，比如把后端返回的分页对象当成用户对象，用 Brand 或独立字段区分。
- 陷阱：说"TS 完全是结构化类型"不严谨，`private` 成员和 `enum` 是例外。

### Q3 TS 有哪些基础类型？类型推断是怎么工作的？

**考察点**：考基础类型清单是否完整，以及字面量扩宽（Literal Widening）、上下文类型（Contextual Typing）这两个推断规则。

**参考答案**：

> **一句话结论**：基础类型是 boolean、number、string、bigint、symbol、null、undefined、object，加上 TS 特有的 any、unknown、never、void、字面量类型、元组和 enum；推断分"从值推断"与"从上下文推断"两条路。

1. 从值推断：`let a = 'x'` 推断为 `string`（扩展为宽类型），`const b = 'x'` 推断为字面量类型 `'x'`；对象属性遵循 `let` 语义，所以 `{ n: 1 }` 的属性是 `number`。
2. 数组与元组：`[1, 2]` 推断为 `number[]`，要固定长度和逐位类型必须显式写 `[number, number]` 或用 `as const`。
3. 函数推断：返回值类型由 return 语句推断；参数没有默认值又没标注时是隐式 any（`noImplicitAny` 会报错）。
4. 上下文类型：回调参数由调用处的期望类型推断出来，例如 `[1].map(n => n.toFixed())` 里的 `n` 是 number，不需要手写。
5. object 与 Object 与 `{}` 三者不同：`object` 指非原始值，`Object` 指有 toString 的任意值，`{}` 几乎是"除 null/undefined 外的一切"。

```ts
let a = 'x';           // string
const b = 'x';         // 'x'
const cfg = { mode: 'dark' }; // { mode: string }
[1, 2].map((n) => n.toFixed()); // n 由上下文推断为 number
```

**追问与易错点**：

- 追问：为什么 `const obj = { n: 1 }` 的 n 不是字面量 1？答：const 只固定绑定，属性仍可改，所以属性会被扩宽；要保留字面量用 `as const`。
- 陷阱：把 `{}` 当成"空对象类型"，实际上非空对象也能赋给它，它只排除 null 和 undefined。

### Q4 any、unknown、never、void、object 这几个类型到底怎么选？

**考察点**：考查对类型论里顶类型与底类型的理解，以及实际选型纪律。这是高频送分题，答错会被判定基础不牢。

**参考答案**：

> **一句话结论**：any 是关掉检查的逃生舱，unknown 是安全的 any（用之前必须收窄），never 是没有任何值的底类型，void 只表示"返回值无意义"，object 表示非原始类型。

| 类型 | 语义 | 使用建议 |
| --- | --- | --- |
| any | 双向兼容，放弃检查 | 只在迁移旧代码时临时用，禁止扩散 |
| unknown | 顶类型，只能赋给 any/unknown | 外部输入（接口、JSON、catch）首选 |
| never | 底类型，没有任何值 | 穷尽检查兜底、Exclude 过滤 |
| void | 函数返回值可忽略 | 回调、事件处理器的返回类型 |
| object | 非原始值（不含 null） | 泛型约束 `<T extends object>` |

1. any 的传染性：一个 any 参与运算后结果还是 any，等于在类型网里开了洞。
2. unknown 的正确姿势：先收窄再使用，`typeof`、`in`、`instanceof`、类型谓词都可以。
3. never 的三个用途：函数永不正常返回（抛异常或死循环）、穷尽检查兜底、条件类型里表示"剔除"。
4. void 的特例：返回值类型为 void 的回调，允许传入返回任意值的函数，这是 TS 有意放宽的规则。
5. `object` 与 `Object` 不要混用：`{}` 也不是"空对象"。

**追问与易错点**：

- 追问：never 和 void 有什么区别？答：void 的函数能正常返回 undefined；never 的函数永远不会正常返回，`const x: never` 无法被赋值。
- 追问：什么时候用 unknown 而不是 any？答：凡是数据来自外部（fetch 结果、`JSON.parse`、`catch` 的 error、第三方回调参数）都用 unknown。
- 陷阱：说"never 就是永远不执行"不准确，它是"没有值可返回"这个类型层面的描述。

### Q5 null 和 undefined 有什么区别？strictNullChecks 打开后有什么变化？

**考察点**：考空值语义与严格模式开关的实际影响，能不能说清"打开前可以乱赋、打开后必须显式处理"。

**参考答案**：

> **一句话结论**：undefined 表示"未赋值/不存在"，null 表示"有意置空"；打开 strictNullChecks 后 null 与 undefined 变成独立类型，不再能赋给其他类型，必须显式联合声明并处理。

1. 语义差异：`let a;` 是 undefined；`JSON.stringify({ a: null })` 保留 null 而丢掉 undefined；对象属性缺失是 undefined，后端"清空"字段通常给 null。
2. 开关前（关闭 strictNullChecks）：null 和 undefined 可赋给任何类型，`undefined.foo` 这类错误检查不出来。
3. 开关后：必须写成 `string | undefined`，`arr.find()` 返回 `T | undefined`，取值前必须判空或用可选链。
4. `strict: true` 是一个家族：它等于打开 strictNullChecks、noImplicitAny、strictFunctionTypes、strictBindCallApply、strictPropertyInitialization、noImplicitThis、alwaysStrict、useUnknownInCatchVariables。
5. 可选属性的细节：`foo?: string` 等价于 `string | undefined`，除非开启 `exactOptionalPropertyTypes` 才区分"不存在"和"存在但为 undefined"。
6. 非空断言 `!` 只是删掉 null/undefined，不做任何运行时检查，滥用等于关掉这个开关。

**追问与易错点**：

- 追问：为什么 `catch (e)` 里 e 是 unknown？答：tsconfig 的 useUnknownInCatchVariables 随 strict 打开，因为抛出的可能是任何值，必须先收窄。
- 陷阱：`?.` 和 `??` 是 ES2020 的运行时语法，跟 strictNullChecks 无关，别把两者说成一回事。

### Q6 类型断言 as 什么时候能用？双重断言有什么风险？

**考察点**：考断言是编译期承诺而非转换，以及"可比较类型"的规则与替代方案。这是最容易被追问穿的一题。

**参考答案**：

> **一句话结论**：`as` 只是告诉编译器"信我"，运行时不做任何转换和校验；当两个类型不可比较时必须写成 `x as unknown as T`，那等于彻底放弃检查，是最该被 Code Review 拦下的写法。

1. 合法断言条件：目标类型是源类型的父类型或子类型（可比较）；否则报错 `Conversion of type 'X' to type 'Y' may be a mistake`。
2. 双重断言的原理：先用 `as unknown` 把值变成顶类型，再断言成任意目标类型，于是编译器失去了所有判断依据。
3. 风险：类型与实际运行时值不符时，编译期一片安静，报错发生在使用时，比如 `Cannot read properties of undefined`。
4. 必须用 as 的场景：DOM API 返回基类（`getElementById` 返回 `HTMLElement | null`）、第三方库类型有误、测试里构造 mock 数据。
5. 更规范的替代：优先用类型守卫（`instanceof HTMLInputElement`）和泛型约束，让编译器自己收窄；数据边界用运行时校验。
6. 同理，`!` 非空断言只删 null/undefined，`@ts-ignore` 会吞掉整行错误，优先 `@ts-expect-error`（没错时反而报错）。

```ts
const el = document.getElementById('name');   // HTMLElement | null
// @ts-expect-error HTMLElement 上没有 value，而且它还可能是 null
el.value;
(el as HTMLInputElement).value;               // 断言能过编译，但不安全
if (el instanceof HTMLInputElement) el.value; // 推荐：编译器自动收窄
```

**追问与易错点**：

- 追问：`as` 和 `as const` 是一回事吗？答：不是，`as const` 是字面量推断修饰，不是类型断言，不涉及"欺骗编译器"。
- 追问：双重断言在什么情况下其实是合理的？答：明确的类型收窄且无法用守卫表达时（如事件对象到自定义事件），必须写注释说明理由。
- 陷阱：把 `as` 理解成类型转换函数（类似 `Number(x)`），实际上它编译后完全消失。

### Q7 拿到一个 unknown 该怎么安全取值？四种类型守卫怎么选？

**考察点**：考窄化（Narrowing）的实际写法，尤其是自定义谓词 `is` 需要自己承担正确性责任这一点。

**参考答案**：

> **一句话结论**：用 typeof、instanceof、in、自定义类型谓词把 unknown 逐层窄化成可信类型；前三种由编译器验证，`is` 谓词是"你对编译器的承诺"，写错编译器不会拦。

1. `typeof`：适合原始类型，注意 `typeof null === 'object'`，所以判对象前要先排除 null；`typeof fn === 'function'` 可用。
2. `instanceof`：适合类实例（Date、Error、自定义类），跨 iframe 或跨 realm 时原型链不同会失效。
3. `in`：判断属性是否存在，适合按字段区分对象形状，天然衔接可辨识联合。
4. 自定义谓词：返回类型写成 `v is User`，函数体里做完整校验；断言函数写成 `asserts v is User`，适用于"不满足就抛错"的场景。
5. 收窄是控制流分析的产物：`if`、`switch`、`??`、`Array.isArray`、真值判断都会让编译器更新类型。
6. 纪律：谓词函数必须真的校验所有关键字段，否则等于把 any 换了个名字。

```ts
type User = { name: string; age: number };

function isUser(v: unknown): v is User {
  return typeof v === 'object' && v !== null
    && typeof (v as { name?: unknown }).name === 'string'
    && typeof (v as { age?: unknown }).age === 'number';
}

function assertIsUser(v: unknown): asserts v is User {
  if (!isUser(v)) throw new TypeError('not a User');
}
```

**追问与易错点**：

- 追问：`in` 判断有什么坑？答：只能证明属性存在，不能证明类型正确，而且对数组、原型链上的属性也会为真。
- 追问：为什么不直接 `as User` 省事？答：断言不产生运行时校验，接口字段缺失时崩在业务代码深处，守卫会把问题挡在边界处。
- 陷阱：谓词里漏判某个字段，编译器完全不会提醒你，这是最隐蔽的类型漏洞。

### Q8 字面量类型和 as const 怎么用？satisfies 又解决什么问题？

**考察点**：考字面量类型与只读推断，以及 TS 4.9 的 satisfies 与类型注解的本质差异。现代项目高频。

**参考答案**：

> **一句话结论**：`as const` 让推断结果保持字面量并加上 readonly；`satisfies`（TS 4.9 起）在"校验是否符合某类型"的同时保留更精确的推断，而 `: T` 注解会把类型放大成 T。

1. 字面量类型：`'dark' | 'light'`、`42`、`true` 都是类型，是联合类型收窄与穷尽检查的基础。
2. `as const` 的三个效果：字符串/数字保留字面量、对象所有属性变 readonly、数组变只读元组 `readonly [1, 2]`。
3. 典型用途：路由表、常量枚举替代品、`(typeof TABLE)[keyof typeof TABLE]` 生成联合类型。
4. satisfies 的核心价值：既能检查属性拼写和类型，又不会把字面量扩宽；用 `: T` 注解则会丢失字面量信息。
5. satisfies 还会做多余属性检查，能提前发现写错键名；它不改变运行时，也不做窄化。
6. 常见组合：对象用 satisfies 校验结构，同时用 `as const` 或字面量推断导出联合类型。

```ts
const routes = { home: '/', user: '/user/:id' } as const;
type Path = (typeof routes)[keyof typeof routes]; // '/' | '/user/:id'

const cfg = { mode: 'dark', retry: 3 } satisfies { mode: 'dark' | 'light'; retry: number };
cfg.mode; // 'dark'，而 const c: { mode: 'dark' | 'light' } = ... 会丢成 'dark' | 'light'
```

**追问与易错点**：

- 追问：satisfies 能替代 as 吗？答：不能，satisfies 只做校验不做断言，类型不匹配时直接报错，这正是它比 as 安全的地方。
- 陷阱：`as const` 只能用于字面量表达式，`as const` 加在变量上再改动会直接报错（readonly）。

### Q9 联合类型和交叉类型分别是什么？用起来有什么区别？

**考察点**：考 `|` 与 `&` 的语义差异、never/unknown 在其中的吸收规律，以及"联合访问属性要先收窄"。

| 运算 | 语义 | 常见用途 |
| --- | --- | --- |
| `A \| B` | 值属于其中至少一种 | 状态机、可辨识联合、可选输入 |
| `A & B` | 同时满足两种形状 | 混入扩展、合并多个 props 类型 |

**参考答案**：

> **一句话结论**：联合是"或"，只能安全访问公共成员；交叉是"且"，成员全部可见；never 是联合的单位元、交叉的零元，unknown 在联合中吸收一切。

1. 联合访问限制：`string | number` 上只能调用两者共有的方法，想用各自特有成员必须先收窄。
2. 交叉是类型层面的合并：`A & B` 同时具备两者成员，常用于把多个来源的类型拼起来，运行时不存在这个"新类型"。
3. 恒等式：`T | never = T`，`T & never = never`，`T | unknown = unknown`，这是 Exclude 与 UnionToIntersection 的原理基础。
4. 冲突字段：`{ a: string } & { a: number }` 不会报错，但 `a` 的类型变成 never，实际无法赋任何值。
5. 交叉与继承的差别：`interface A extends B` 遇到冲突属性会直接报错，交叉类型会静默产生 never，后者更难排查。
6. 数组上的区别：`(A | B)[]` 表示元素可能是 A 或 B，`A[] | B[]` 表示整个数组只能是 A 数组或 B 数组，两者完全不同。

**追问与易错点**：

- 追问：为什么交叉类型可能让类型检查变慢？答：交叉类型没有缓存，深层交叉要反复计算成员，项目里大范围滥用会拖慢 tsserver。
- 陷阱：以为 `A & B` 会在运行时把对象合并，实际要合并对象得用展开运算符或 Object.assign。

### Q10 可辨识联合怎么写？为什么 default 分支里赋值给 never 能做穷尽检查？never 在 Exclude 里又起什么作用？

**考察点**：考可辨识联合（Discriminated Union）建模 + 穷尽检查（Exhaustive Check）原理 + never 作为底类型的两个用途，是本篇最核心的进阶题。

**参考答案**：

> **一句话结论**：给每个成员加一个字面量判别字段，switch 收窄后所有分支都覆盖时变量类型变成 never；never 可赋给任何类型，所以赋值不报错，漏掉分支就会立刻报错。同样的机制让 Exclude 能用 never 表示"删除"。

1. 建模：每个联合成员都有同一个字面量字段（如 `kind`），这是可辨识性的来源。
2. 收窄：`switch (s.kind)` 的每个 case 都能把 s 精确收窄到对应成员，不用 as。
3. 穷尽检查：default 分支里把 s 赋给 `never` 变量，新增成员时这里报错，等于让编译器替你做回归测试。
4. 为什么成立：分支全覆盖后 s 的类型是 never，而 never 是所有类型的子类型，可以赋给任何变量；漏掉分支时 s 还有剩余类型，赋值失败。
5. Exclude 里的 never：`type Exclude<T, U> = T extends U ? never : T` 用 never 表示"这个成员被剔除"，而联合吸收 never，所以结果就是删掉后的联合。
6. 实践建议：把兜底写成 `assertNever` 函数，报错信息更有指向性，也能跨模块复用。

```ts
type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'rect'; w: number; h: number };

function assertNever(x: never): never {
  throw new Error(`unexpected value: ${JSON.stringify(x)}`);
}

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'rect': return s.w * s.h;
    default: return assertNever(s); // 新增成员时这一行报错
  }
}
```

**追问与易错点**：

- 追问：为什么不用 `default: throw new Error()` 直接兜底？答：那样新增成员时不会报错，穷尽检查的价值就没了，必须显式赋给 never 或调用 assertNever。
- 追问：判别字段只能是字符串吗？答：数字字面量、布尔也可以，只要是每个成员唯一的字面量类型。
- 陷阱：判别字段写成 `string` 而不是字面量（如 `kind: string`），整个联合就退化，收窄和穷尽检查全部失效。

### Q11 interface 和 type 有什么区别？实际项目怎么选？

**考察点**：考两者的能力边界与生态差异，不是背"基本一样"。要能说出合并、扩展、能力范围、错误信息四个维度。

**参考答案**：

> **一句话结论**：两者描述对象时高度重叠，但 interface 支持声明合并、错误信息更可读、扩展用 extends；type 能表达联合、元组、条件类型等一切类型运算。项目里对象形状用 interface，其他类型运算用 type。

| 维度 | interface | type |
| --- | --- | --- |
| 扩展方式 | `extends`（可多继承） | `&` 交叉 |
| 声明合并 | 支持（同名自动合并） | 不支持，重名报错 |
| 表达能力 | 只能描述对象/函数/类形状 | 联合、元组、条件类型、映射类型 |
| 错误信息 | 通常更简短可读 | 展开后可能很长 |
| 性能 | 有缓存，扩展更快 | 交叉类型需重新计算 |

1. 扩展差异：`interface A extends B` 遇到同名属性类型冲突会直接报错；`type A = B & C` 会静默产生 never，更隐蔽。
2. 声明合并：interface 同名会合并成员，这是给第三方库做类型增强的基础；type 无法合并。
3. 能力边界：type 可以写 `type ID = string | number`、`type T = [string, number]`，interface 做不到。
4. 选型建议：组件 props、接口响应对象、公共 API 用 interface；工具类型、联合、元组、函数重载签名集合用 type。
5. 团队一致性优先：项目内统一风格比"哪个更好"更重要，混用会让人反复判断。

**追问与易错点**：

- 追问：为什么不少框架源码偏爱 interface？答：可扩展（用户能做模块增强）、有缓存、生成 .d.ts 时错误信息更友好。
- 陷阱：说"type 不能被 extends"是错的，type 定义的对象一样能被 interface extends（只要它是静态已知的对象类型）。

### Q12 声明合并和模块增强是怎么回事？namespace 还能用吗？

**考察点**：考声明合并的规则、`declare global` 的使用前提，以及 namespace 与现代 ES 模块的取舍。

**参考答案**：

> **一句话结论**：同名 interface 会自动合并成员，namespace 可与函数/类/枚举合并；模块增强用来给已存在的模块补类型（如给 Vue 的 this 挂全局属性），而 namespace 在现代代码里已被 ES 模块取代，只建议留在 .d.ts 中。

1. interface 合并：同名 interface 的成员叠加，同名属性类型不同则报错；常用于给 Window、第三方库接口加字段。
2. namespace 合并：namespace 与 function/class/enum 同名可合并，实现"函数加静态成员"的写法，这是老式 JS 习惯的类型表达。
3. 模块增强：`declare module 'vue' { interface ComponentCustomProperties { $http: HttpClient } }`，只加成员不改已有成员类型。
4. 全局增强：`declare global { interface Window { ... } }`，前提是所在文件必须是模块（有 import 或 export），否则会被编译器当成新的声明文件。
5. namespace 的问题：会生成运行时 IIFE，不利于 tree-shaking，也不符合 ES 模块规范；能用 import/export 就别用 namespace。
6. 保留场景：`.d.ts` 里声明全局类型容器、描述老库的全局变量；`declare namespace` 只描述类型不产生代码，是安全的。

**追问与易错点**：

- 追问：为什么给 Vue3 的 this 加属性要写模块增强？答：需要把新成员"并"进已有的 `ComponentCustomProperties` 接口，直接新声明一个接口不会生效。
- 陷阱：在非模块文件里写 `declare global` 会报 "Augmentations for the global scope can only be directly nested in external modules"，加一行 `export {}` 即可解决。

### Q13 函数类型怎么写？可选参数、默认值和函数重载分别注意什么？

**考察点**：考函数签名的完整写法与重载（Overload）的规则，包括实现签名对外不可见这个高频追问点。

**参考答案**：

> **一句话结论**：函数类型写成 `(a: number, b?: string) => void`；可选参数必须在必选参数之后；有默认值的参数在类型上等价于可选；重载是"多个对外的重载签名 + 一个不对外暴露的实现签名"。

1. 可选参数：`b?: string` 表示调用时可省略，类型上等价于 `string | undefined`，所以函数体里要判空。
2. 默认值：`function f(a = 1)` 的类型是 `(a?: number) => void`，参数变成可选；默认值只在传 undefined 时生效（传 null 不会触发）。
3. 剩余参数：`(...args: number[])`，注意它必须是最后一个参数，且不能与可选参数写法混用出错。
4. 重载规则：实现签名对调用方不可见，调用只匹配重载签名列表，所以实现签名要兼容所有重载签名。
5. 重载 vs 联合参数：如果只是参数类型不同、返回值相同，直接用联合类型更简单；只有"返回值随参数类型变化"时才值得用重载。
6. this 类型：`function f(this: HTMLButtonElement, e: Event)` 可以约束 this，避免误绑定。

```ts
function pad(v: string): string;
function pad(v: number, len: number): string;
function pad(v: string | number, len = 0): string { // 实现签名不对外可见
  return String(v).padStart(len, '0');
}
```

**追问与易错点**：

- 追问：重载和泛型条件类型怎么选？答：重载可读性好、报错清楚；返回值映射关系复杂且要复用类型时用条件类型或泛型。
- 陷阱：把实现签名写成 `any` 来"让它过编译"，等于放弃检查；也不能只写实现签名而期望它有重载行为。

### Q14 泛型是什么？extends 约束、泛型默认值和推断顺序讲一下。

**考察点**：考泛型作为"类型参数"的本质，以及约束、默认值、推断优先级三件套。答不上推断顺序说明只停留在会用。

**参考答案**：

> **一句话结论**：泛型是把类型当参数传入，让类型随调用处自动推断；`extends` 是约束（不是继承），`= ` 给默认值，推断优先级是显式实参 > 从入参推断 > 默认值。

1. 本质：没有泛型时只能写 `function first(arr: any[]): any`，用了泛型 `function first<T>(arr: T[]): T` 才能保留输入输出的类型关联。
2. 约束 `<T extends object>`：限制 T 必须具备某些能力，这样才能在函数体里安全访问 `T.id` 之类的成员。
3. 常见约束：`<T extends object>`、`<K extends keyof T>`、`<T extends (...args: any[]) => any>`，后者用在工具类型里限制"必须是函数"。
4. 默认值 `<T = string>`：调用方不传也不推断不出来时使用；默认值必须满足约束，否则报错。
5. 推断顺序：显式传的实参优先，其次由实参值推断，最后才用默认值；显式传入后编译器一般不再从实参纠正。
6. 判断纪律：如果类型参数只在签名里出现一次、跟返回值无关，那多半不需要泛型，写具体类型更清楚。

```ts
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce(
    (acc, k) => ({ ...acc, [k]: obj[k] }),
    {} as Pick<T, K>,
  );
}
const r = pick({ a: 1, b: 'x' }, ['a']); // r: { a: number }
```

**追问与易错点**：

- 追问：泛型里的 extends 和 interface 的 extends 是同一个东西吗？答：不是，前者是"约束/上界"，后者是继承。
- 陷阱：泛型参数用单字母 T、K、V 混写导致可读性差，业务函数建议用有含义的名字。

### Q15 keyof、typeof、索引访问类型、映射类型分别怎么用？

**考察点**：考四个类型运算符的组合能力，这是理解所有内置工具类型的前置知识。

**参考答案**：

> **一句话结论**：`keyof T` 取属性名联合，`typeof expr` 取表达式的类型，`T[K]` 按索引取属性类型，映射类型 `{ [K in keyof T]: ... }` 遍历键批量改造类型；四者组合就是 Partial、Readonly 这类工具类型的实现方式。

1. `keyof T`：得到属性名联合；若 T 有索引签名，结果是 `string | number`；`keyof any` 是 `string | number | symbol`。
2. `typeof expr`：在类型位置取值的类型，是"从已有常量推导类型"的入口，配合 `as const` 效果最好。
3. 索引访问 `T['name']`：取单个属性类型；`T[keyof T]` 取所有属性类型的联合；数组用 `T[number]` 取元素类型。
4. 映射类型：形式是 `{ [K in keyof T]: 新类型 }`，因为遍历了 `keyof T`，所以属于同态映射，会自动保留可选与 readonly 修饰。
5. 修饰符操作：`+?`/`-?` 控制可选，`+readonly`/`-readonly` 控制只读，`as` 子句可以重命名或过滤键。
6. 键重映射的过滤技巧：值类型不匹配时映射成 never，键会被自动丢弃。

```ts
const person = { name: 'a', age: 1 };
type Person = typeof person;          // { name: string; age: number }
type Name = Person['name'];           // string
type Mutable<T> = { -readonly [K in keyof T]-?: T[K] };
type OnlyString<T> = { [K in keyof T as T[K] extends string ? K : never]: T[K] };
```

**追问与易错点**：

- 追问：`keyof typeof obj` 为什么这么常用？答：它把常量对象的键变成联合类型，配合它们做安全的字符串参数校验。
- 陷阱：在函数内部写 `keyof T` 的映射类型时忘了 `[K in keyof T]` 的同态性，会丢掉可选修饰，导致 `Partial` 这类结果不对。

### Q16 条件类型和 infer 是怎么工作的？

**考察点**：考 `X extends Y ? A : B` 的求值语义、infer 的合法位置，以及它如何实现类型提取。

**参考答案**：

> **一句话结论**：条件类型是类型层面的 if-else，`extends` 在这里表示"是否可赋值"；`infer` 只能在 extends 的右侧声明一个待推断变量，用来把类型内部的结构"抠"出来。

1. 求值语义：`A extends B ? X : Y` 判断 A 是否可赋给 B，可赋值走 X，否则走 Y。
2. infer 的位置限制：只能出现在条件类型的 extends 子句里，不能写在函数体或普通类型别名里。
3. 经典用途：提取 Promise 内的值、函数返回值、数组元素、函数参数元组。
4. infer 可加约束（TS 4.7 起）：`T extends (infer U extends string)[] ? U : never`，避免先推断再报错。
5. 协变与逆变：在数组、属性等协变位置推断得到联合；在函数参数这种逆变位置，多候选会推断出交叉。
6. TS 5.4 的 NoInfer：`NoInfer<T>` 可以阻止某个位置参与类型推断，用来固定住期望的类型。

```ts
type Unwrap<T> = T extends Promise<infer U> ? U : T;
type FnReturn<T> = T extends (...args: any[]) => infer R ? R : never;
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type A = Unwrap<Promise<number>>;        // number
type B = Last<[string, number, boolean]>; // boolean
```

**追问与易错点**：

- 追问：为什么 `Unwrap<string[]>` 是 string[] 而不是报错？答：条件类型不满足时走 false 分支，这里是 T 本身，属于防御式写法。
- 陷阱：条件类型默认会对联合类型分发，因此 `Unwrap<Promise<1> | Promise<2>>` 得到 `1 | 2` 而不是报错，这是特性不是 bug。

### Q17 什么是分布式条件类型？怎么关掉它？

**考察点**：考细粒度规则：裸类型参数 + 联合 = 逐成员求值，以及 `[T] extends [U]` 的关闭技巧。这是类型体操的分水岭。

**参考答案**：

> **一句话结论**：当被检查的是"裸类型参数"且传入联合类型时，条件类型会对每个成员分别求值再把结果联合起来；用元组包裹成 `[T] extends [U]` 就能关闭分发。

1. 触发条件：必须是裸类型参数（naked type parameter），且传入的是联合类型；`T extends any ? ...` 是最常见的显式分发写法。
2. 例子：`type ToArray<T> = T extends unknown ? T[] : never`，传入 `string | number` 得到 `string[] | number[]`。
3. 关闭方式：`[T] extends [U] ? A : B` 把 T 包进元组，元组类型不是裸参数，于是整体比较，不再逐成员分发。
4. never 的特例：裸 never 分发的结果是 never（没有任何成员可分），所以 `IsNever` 必须写成 `[T] extends [never]`。
5. 内置工具类型的依赖：Exclude、Extract、NonNullable 全部依赖分发特性，这也是它们能过滤联合成员的原因。
6. 注意 boolean：`boolean` 本质是 `true | false` 的联合，也会被分发，`Diff<boolean, false>` 得到 true。

```ts
type ToArray<T> = T extends unknown ? T[] : never;
type R1 = ToArray<string | number>; // string[] | number[]

type IsNever<T> = [T] extends [never] ? true : false;
type IsUnion<T, U = T> = T extends U ? ([U] extends [T] ? false : true) : never;

type T1 = IsNever<never>;            // true
type T2 = IsUnion<string | number>;  // true
```

**追问与易错点**：

- 追问：`T extends any ? X : Y` 和直接写 X 有什么区别？答：前者会强制分发，联合类型会变成多个 X 的联合，这是很多类型体操的起手式。
- 陷阱：以为 `never extends never` 会走 true 分支，实际上裸 never 直接返回 never，不会进入任何分支。

### Q18 手写 Partial、Required、Readonly、Pick、Omit、Record，并说明内置工具类型的作用。

**考察点**：考映射类型与修饰符是否真的会用，而不是只会调 API。要求代码可编译。

| 工具类型 | 作用 |
| --- | --- |
| `Partial<T>` | 所有属性变可选（浅层） |
| `Required<T>` | 所有属性变必填 |
| `Readonly<T>` | 所有属性变只读（浅层） |
| `Pick<T, K>` | 只保留 K 这些键 |
| `Omit<T, K>` | 去掉 K 这些键 |
| `Record<K, V>` | 构造键为 K、值为 V 的对象类型 |

**参考答案**：

> **一句话结论**：全部由映射类型实现——可选/只读靠 `?`、`readonly` 与 `-` 修饰符，Pick 靠遍历 K，Omit 是 `Pick` 加 `Exclude` 的组合，Record 直接遍历 K。

1. `Partial` 用 `?` 给每个属性加可选；Required 用 `-?` 去掉可选；Readonly 用 `readonly` 前缀，注意这些都是浅层的。
2. `Pick<T, K extends keyof T>` 的约束保证了 K 必须是 T 的键，调用方传错键名直接报错。
3. `Omit` 的第二参数是 `keyof any` 而不是 `keyof T`，所以允许写 T 上不存在的键（宽松但方便）。
4. `Record` 遍历的是 K 而不是 `keyof T`，属于非同态映射，不会保留修饰符。
5. 使用场景：表单草稿用 Partial，提交参数用 Required，只读配置用 Readonly，列表项展示用 Pick 裁剪字段，创建用 Omit 去掉 id。

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyOmit<T, K extends keyof any> = MyPick<T, Exclude<keyof T, K>>;
type MyRecord<K extends keyof any, V> = { [P in K]: V };

type Draft = MyPartial<{ a: number; b: string }>; // { a?: number; b?: string }
```

**追问与易错点**：

- 追问：Partial 是深层的吗？答：不是，嵌套对象不会变可选，需要 DeepPartial 递归处理。
- 陷阱：`Pick` 的第二个参数写成 `K extends keyof T` 之外的类型（比如 string）会被拒绝，这是设计上故意的保护。

### Q19 手写 Exclude、Extract、NonNullable、ReturnType、Parameters、Awaited。

**考察点**：考分布式条件类型、infer 与递归的综合运用，是"是否真懂工具类型"的分界线。

**参考答案**：

> **一句话结论**：Exclude/Extract/NonNullable 靠分布式条件类型过滤成员，ReturnType/Parameters 靠 infer 从函数类型里抽取，Awaited 靠 infer 加递归解包 Promise。

1. `Exclude<T, U>`：联合 T 的每个成员若可赋给 U 就换成 never，联合吸收 never 即完成删除。
2. `Extract<T, U>`：与 Exclude 相反，只保留可赋给 U 的成员，是"取交集"的思路。
3. `NonNullable<T>`：本质是 `Exclude<T, null | undefined>` 的展开写法。
4. `ReturnType`/`Parameters`：先用 `T extends (...args: any) => any` 把 T 约束成函数，再用 infer 分别抠出返回值和参数元组。
5. `Awaited` 要递归：官方实现还处理 thenable，简化版用 `T extends Promise<infer R> ? MyAwaited<R> : T` 就能逐层解开 `Promise<Promise<number>>`。
6. 重载函数的 ReturnType 取最后一个重载签名；对 any 这类特殊输入，官方实现给的是 any，不要自己改成 never。

```ts
type MyExclude<T, U> = T extends U ? never : T;
type MyExtract<T, U> = T extends U ? T : never;
type MyNonNullable<T> = T extends null | undefined ? never : T;
type MyReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
type MyParameters<T extends (...args: any) => any> = T extends (...args: any) => infer P ? P : never;
type MyAwaited<T> = T extends Promise<infer R> ? MyAwaited<R> : T;

type R = MyReturnType<() => string>;      // string
type P = MyParameters<(a: number) => void>; // [a: number]
type W = MyAwaited<Promise<Promise<1>>>;  // 1
```

**追问与易错点**：

- 追问：`InstanceType` 和 `ConstructorParameters` 怎么实现？答：同样用 infer，把约束换成 `abstract new (...args: any) => any` 即可。
- 陷阱：把 Exclude 写成 `T extends U ? T : never` 就变成 Extract 了，这两个实现只差 true 分支，面试时最容易写反。

### Q20 模板字面量类型是什么？能拿来做哪些字符串操作？

**考察点**：考模板字面量类型（Template Literal Types）与内置字符串操作类型的配合，常用于事件名、路由、CSS 单位建模。

**参考答案**：

> **一句话结论**：模板字面量类型把字符串拼接搬到类型层，配合 `Uppercase`、`Capitalize` 等内置 intrinsic 类型和联合类型的分发，可以批量生成、约束、解析字符串字面量。

1. 基本形式：`` `on${K}` `` 中若 K 是联合，结果自动展开为联合，如 `` `on${'click' | 'change'}` `` 得到 `'onclick' | 'onchange'`。
2. 内置字符串操作类型：`Uppercase`、`Lowercase`、`Capitalize`、`Uncapitalize`，作用是改大小写且保留联合。
3. 解析能力：配合 infer 可以按分隔符拆分字符串，做路由参数提取、CSS 属性值校验。
4. 与映射类型结合：用 `as` 键重映射批量生成 getter/setter 名称，是状态管理类型定义的常见写法。
5. 约束能力：写成 `` `${number}px` `` 这样的模板字面量类型，就能约束只接受 px 字符串，比 string 精确得多。
6. 限制：模板字面量类型只对字符串字面量有意义，宽 string 无法被反向解析，运行时的模板字符串也不受影响。

```ts
type EventName = 'click' | 'change';
type OnEvent = `on${Capitalize<EventName>}`; // 'onClick' | 'onChange'

type Join<T extends string[], D extends string> =
  T extends [] ? ''
    : T extends [infer F extends string, ...infer R extends string[]]
      ? R extends [] ? F : `${F}${D}${Join<R, D>}`
      : never;

type Route = `/user/${string}`;
type Padded = `${number}px`;
```

**追问与易错点**：

- 追问：能不能从 `string` 反推出模板结构？答：不能，只有字面量类型才有结构信息，宽 string 无法匹配解析。
- 陷阱：把模板字面量类型当成运行时格式化工具，它编译后完全不存在，实际拼接仍要写模板字符串。

### Q21 怎么写递归类型？DeepReadonly 为什么不能无限递归？

**考察点**：考递归条件类型的写法与编译器限制，以及函数、Map 这类特殊值该怎么处理。

**参考答案**：

> **一句话结论**：递归类型就是在定义里引用自己，靠条件类型提供终止分支；深度受编译器实例化上限约束，所以必须先判函数和原始类型再递归对象，不能无界展开。

1. 终止条件必不可少：原始类型直接返回自身，否则会一直递归到报错。
2. 处理函数：函数类型没有可映射的属性，直接映射会变成 `{}`，所以要在最前面用 `T extends Function ? T` 挡掉。
3. Map、Set、Date 这类内置对象要单独保留，否则会被映射成普通对象类型，破坏原有的方法签名。
4. 数组的特别之处：同态映射类型作用在数组/元组上会保留数组结构，所以 `DeepReadonly<number[]>` 会得到 `readonly number[]`。
5. 深度限制：TS 对类型实例化深度有上限（约 50 层），超过会报 `Type instantiation is excessively deep`；TS 4.5 起对尾递归的条件类型做了尾递归消除，深度可提升到约 1000 层。
6. 工程建议：深度工具类型限制在 3 到 5 层、加上 readOnly 或哨兵标记，并在类型测试里固定行为。

```ts
type DeepReadonly<T> = T extends Function
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

type A = DeepReadonly<{ a: { b: number[] } }>; // { readonly a: { readonly b: readonly number[] } }
```

**追问与易错点**：

- 追问：为什么类型体操写太深会让编辑器卡？答：tsserver 要为每个文件实例化这些类型，递归与交叉类型没有缓存，成本会叠加。
- 陷阱：直接对任意泛型写 `[K in keyof T]: DeepReadonly<T[K]>` 而不排除 Function，结果会把函数类型映射成 `{}`，调用时报错。

### Q22 UnionToIntersection 是怎么实现的？类型体操的边界在哪？

**考察点**：考逆变位置推断这个高级机制，以及工程师视角的取舍判断——不能只炫技。

**参考答案**：

> **一句话结论**：先用分布式条件类型把联合的每个成员包装成"参数是该成员"的函数类型，再用 infer 在函数参数这个逆变位置推断，多个候选会被合成为交叉类型。

1. 第一步分发：`U extends unknown ? (arg: U) => void : never`，联合 `A | B` 变成 `((arg: A) => void) | ((arg: B) => void)`。
2. 第二步推断：整体去匹配 `(arg: infer I) => void`，由于参数位置是逆变位，候选 A 与 B 会推断为 `A & B`。
3. 直觉来源：函数参数位置本来就要求"能接受更宽的类型"，多个候选同时满足时就取交集，这与 strictFunctionTypes 的规则一致。
4. 用途：把多个组件的 props 联合合成一个交叉对象、合并 key 集合，以及实现 UnionToTuple 之类高级工具。
5. 价值边界：类型体操应该服务于"让业务代码不写类型"，一旦复杂到需要注释才能读懂，就应该退化成显式展开的类型。
6. 成本意识：每个复杂类型都会增加编译时间与报错噪音；团队项目要配类型测试（类型断言用例），否则重构时无人敢动。

```ts
type UnionToIntersection<U> =
  (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never;

type Merged = UnionToIntersection<{ a: number } | { b: string }>;
// { a: number } & { b: string }
```

**追问与易错点**：

- 追问：为什么结果不是联合而是交叉？答：因为 infer 处在函数参数位置（逆变位），多候选会求交集；若放在返回值位置（协变位）则会得到联合。
- 陷阱：把 UnionToIntersection 当成运行时的对象合并使用，它只在类型层面成立，运行时仍要用 Object.assign 或展开语法。

### Q23 enum、const enum 和联合字面量该怎么选？

**考察点**：考枚举的产物差异与现代打包链的兼容问题，能说清"为什么很多团队禁 enum"才算过关。

**参考答案**：

> **一句话结论**：数值 enum 会生成运行时对象和反向映射，字符串 enum 只有运行时对象，const enum 编译期内联但逐文件转译器支持不好；现代项目更推荐 `as const` 对象加联合字面量，零运行时、tree-shaking 友好。

1. 数值 enum 产物：编译成 `{ 0: 'A', A: 0 }` 这样的双向映射对象，体积最大，还能被 `Object.keys` 遍历出一半数字键。
2. 字符串 enum 产物：只有 `{ A: 'a' }` 一个方向的映射；异构 enum（数字与字符串混写）虽然合法但不建议。
3. const enum：使用时被内联成字面量，不生成运行时对象；代价是必须整个程序一起编译，逐文件转译的 babel/esbuild 默认处理不了（需要插件），`isolatedModules` 下访问环境常量枚举会直接报错。
4. 联合字面量的优势：完全没有运行时产物、与后端 JSON 值天然对应、可以和 `as const` 对象配合同时拿到值与类型。
5. TS 5.8 的 `erasableSyntaxOnly`：开启后 enum、namespace 这类不可擦除语法会直接报错，适合交给 Node 或打包器剥离类型的项目。
6. 选型：纯前端业务常量用 as const 对象；需要与后端数值协议对齐或做位运算时用数值 enum；const enum 只适合老式全量 tsc 编译的项目。

```ts
const Status = { Pending: 'pending', Done: 'done' } as const;
type Status = (typeof Status)[keyof typeof Status]; // 'pending' | 'done'

function render(s: Status) {
  return s === Status.Pending ? '加载中' : '完成';
}
```

**追问与易错点**：

- 追问：enum 在类型收窄上比联合字面量更强吗？答：不强，联合字面量的收窄与穷尽检查一样好用，两者类型能力相当。
- 陷阱：在 Vite 项目里用 const enum 会遇到跨模块访问报错或行为不一致，团队要提前约定。

### Q24 declare 和 .d.ts 怎么用？第三方库没有类型怎么办？

**考察点**：考声明文件的实际编写能力，包括 @types 体系、declare module 的三种形态和全局增强的前提。

**参考答案**：

> **一句话结论**：`declare` 只声明类型、不生成任何运行时代码；第三方库无类型时先看 `@types/包名`，没有就自己写 .d.ts 用 `declare module` 描述，模块通配符则用来处理 `*.vue`、`*.svg` 这类非 TS 文件。

1. 优先级：库里自带 types 字段 > 社区 `@types/xxx`（DefinitelyTyped）> 自己写声明文件。
2. 声明文件放置：放在 `src/types/` 或 `types/` 目录，通过 tsconfig 的 `include` 纳入；用 `typeRoots`/`types` 控制自动加载的包。
3. 具体模块声明：`declare module 'legacy-lib' { ... }` 描述一个真实存在的模块，内部可写 export 与 default。
4. 通配符声明：`declare module '*.vue'`、`declare module '*.svg'` 用于告诉编译器这些后缀如何被当模块导入。
5. 全局增强：`declare global` 必须写在模块文件里，用来给 Window 等已存在的接口加成员。
6. 容错技巧：`@ts-expect-error` 会在"其实没报错"时反过来报错，比 `@ts-ignore` 安全；`skipLibCheck` 可以跳过所有 .d.ts 的检查来加速并绕开依赖里的类型冲突。

```ts
// src/types/legacy-lib.d.ts
// 本文件不能有 import/export，否则会被当成"模块增强"并报模块找不到
declare module 'legacy-lib' {
  export function init(options?: { debug?: boolean }): void;
  const api: { version: string };
  export default api;
}
```

```ts
// src/types/global.d.ts
// 有 export 才是模块，declare global 才生效
declare global {
  interface Window { __APP_VERSION__: string }
}
export {};
```

**追问与易错点**：

- 追问：`declare module '*.vue'` 里写什么？答：默认导出组件的类型，Vue 项目里通常由 `vue-tsc` 或 `@vue/runtime-dom` 提供，无需自己写。
- 陷阱：以为 `declare` 会生成运行时代码。`declare const foo = 1` 能通过编译（环境 `const` 允许字面量初始值，`declare var` 带初始值才会报错），但产物里没有任何赋值，运行时访问 `foo` 会抛 `ReferenceError`。

### Q25 tsconfig 里哪些配置最关键？类型检查太慢怎么优化？

**考察点**：考工程化配置的理解，重点是每个选项"影响什么"，以及性能排查手段。前端面试的高频工程题。

| 配置 | 作用 | 常见取值 |
| --- | --- | --- |
| `strict` | 打开全套严格检查（含 strictNullChecks） | 新项目 true |
| `target` | 输出语法等级，并决定默认引入的 `lib`（影响可用 API） | ES2019 / ES2020 |
| `module` / `moduleResolution` | 模块格式与解析策略 | ESNext + Bundler；Node 项目 NodeNext |
| `paths` | 路径别名，只影响类型解析 | `"@/*": ["src/*"]` |
| `skipLibCheck` | 跳过所有 .d.ts 的检查 | true |
| `isolatedModules` | 保证每个文件可独立转译 | true |
| `noEmit` | 只检查不产出 | CI 里用 |
| `incremental` | 增量编译缓存 | true |

**参考答案**：

> **一句话结论**：`strict` 决定检查强度，`target` 决定产出语法，`module` 与 `moduleResolution` 决定模块解析方式，`paths` 只管类型不管运行时，`skipLibCheck` 与 `isolatedModules` 决定构建链兼容与速度。

1. `skipLibCheck` 跳过所有声明文件的类型检查，能显著提速，代价是依赖里的类型冲突不会暴露；它不会跳过你自己项目源码的检查。
2. `isolatedModules` 强制每个文件可独立转译，是 Vite、babel、esbuild 这类逐文件工具的前提，开启后要显式用 `export type`。
3. `paths` 的别名只影响类型解析，运行时必须由打包器（Vite、webpack）或 Node 单独配置，否则编译通过但运行时报模块找不到。
4. 性能排查：`tsc --extendedDiagnostics` 看检查耗时分布，`tsc --generateTrace` 分析类型实例化热点。
5. 优化手段：缩小 `include` 范围、`incremental` 缓存、monorepo 用 project references 拆分、用 `import type` 减少类型依赖图、避免大范围深层交叉与递归类型。
6. 常见坑：编辑器卡顿往往来自某个巨型 .d.ts 或某个文件里的复杂类型，而不是整体配置问题，要定位到具体文件。

**追问与易错点**：

- 追问：`target` 会影响类型检查结果吗？答：会影响部分库类型（如 lib 推断出的 API 差异）与降级语法，但不做类型强度判断，类型严格性由 strict 家族决定。
- 陷阱：以为配了 `paths` 就万事大吉，Vite 里还得在 `resolve.alias` 同步一份，否则类型过了、运行时报错。

### Q26 tsc 和 babel、esbuild 编译 TypeScript 有什么区别？

**考察点**：考"类型检查"与"类型擦除"是两件事，以及 isolatedModules 存在的原因。答不出这点说明没踩过坑。

**参考答案**：

> **一句话结论**：tsc 同时做类型检查和代码生成；babel、esbuild、swc 只擦除类型、逐文件转译，速度快但不做任何类型检查，所以现代前端的类型检查交给 `tsc --noEmit` 或 `vue-tsc`。

1. 定位差异：tsc 是编译器兼类型检查器，esbuild 用 Go 写、只做语法剥离，所以能快一个数量级。
2. 工程实践：Vite 用 esbuild 转译 TS，CI 里单独跑 `tsc --noEmit` 或 `vue-tsc --noEmit` 做类型门禁。
3. 逐文件转译的代价：不理解跨文件类型，所以必须开 `isolatedModules`，类型导出要用 `export type`，否则类型被当成值导出会在运行时消失。
4. const enum 与 namespace：依赖全局分析，逐文件转译器默认不支持，需要插件或改用联合字面量。
5. 兼容标记：`verbatimModuleSyntax`（TS 5.0）要求显式区分 `import type` 与 `import`，能避免转译后残留无效 import。
6. 结论：转译器负责产码速度，tsc 负责类型正确性，两者职责分离是现代前端构建的共识。

```bash
tsc --noEmit                       # CI 里只做类型检查，不产文件
esbuild src/main.ts --bundle --outfile=dist/app.js
```

**追问与易错点**：

- 追问：为什么 Vite 里写了类型错误还能跑起来？答：Vite 走 esbuild 只擦类型不检查，错误要在编辑器或 CI 的 tsc 阶段才暴露。
- 陷阱：以为"能编译就能上线"，没配 `tsc --noEmit` 门禁的项目里类型错误会一路带进生产环境。

### Q27 Vue3 和 React 项目里 TS 有哪些高频实战写法？

**考察点**：考框架侧的类型 API 是否真的用过：defineProps 泛型、InjectionKey、事件类型、useRef 泛型。答不出来会显得只有语法基础。

**参考答案**：

> **一句话结论**：Vue3 用 `defineProps<T>()` 和 `defineEmits<T>()` 的泛型写法替代运行时声明，用 `InjectionKey<T>` 让 provide/inject 有类型；React 用 `useRef<T>`、`useState<T>` 和 `React.ChangeEvent<T>` 这类事件泛型约束 DOM 与状态。

1. Vue3 defineProps：`defineProps<{ title: string }>()`；带默认值用 `withDefaults(defineProps<T>(), { ... })`，因为泛型声明不能直接写默认值。
2. Vue3 版本差异：3.3 起支持更复杂的类型（如导入的外部类型与联合），更早版本只能用类型字面量。
3. Vue3 事件：`defineEmits<{ change: [id: number] }>()` 是 3.3+ 的命名元组语法，旧写法是调用签名 `(e: 'change', id: number): void`。
4. InjectionKey：`const cartKey: InjectionKey<CartApi> = Symbol('cart')`，注入端就能拿到类型，避免 any。
5. React ref：`useRef<HTMLInputElement>(null)` 让 `ref.current` 有类型；React 19 的类型定义里 useRef 必须传初始值，不再有无参重载。
6. React 事件与组件类型：事件用 `React.ChangeEvent<HTMLInputElement>`；React 18 起 `FC` 不再隐式带 children，要显式用 `PropsWithChildren`。

```ts
// Vue 3.3+
const props = defineProps<{ title: string; tags?: string[] }>();
const emit = defineEmits<{ change: [id: number] }>();
export const cartKey: InjectionKey<{ add(n: number): void }> = Symbol('cart');

// React 18/19
const inputRef = useRef<HTMLInputElement>(null);
function onChange(e: React.ChangeEvent<HTMLInputElement>) {
  setValue(e.target.value);
}
```

**追问与易错点**：

- 追问：`defineProps` 泛型能传导入的 interface 吗？答：Vue 3.3 起可以，3.3 之前编译器无法解析外部类型引用，会报错。
- 陷阱：`useRef<number>(0)` 与 `useRef<number | null>(null)` 的行为不同，前者 current 永远有值，判空写法要根据初始值来定，别为了少写一个判断而写错。

### Q28 常见误区：用了 TypeScript 是不是就不用做运行时校验了？

**考察点**：考对"类型擦除"的工程理解，能不能分清编译期契约与运行时可信边界。这是最容易被追问的总结性题目。

**参考答案**：

> **一句话结论**：不能，类型编译后会被完全擦除，TypeScript 只管住你自己写的代码，管不住接口返回、`JSON.parse`、localStorage、URL 参数和用户输入，这些边界必须做运行时校验。

1. 擦除的本质：`.ts` 编译后就是 `.js`，接口、泛型、断言运行时都不存在，`interface` 不会变成对象。
2. 典型翻车：`const data = (await res.json()) as User` 编译零错误，后端少字段时崩在业务渲染深处。
3. 正确做法：在系统边界做运行时校验（zod、valibot 或手写类型守卫），把 unknown 校验成可信类型后再向内传递。
4. 其他常见误区：用 any 图快、用 `!` 非空断言掩盖空值、用 `@ts-ignore` 熄火、以为"改了类型就能改运行时行为"。
5. 反向的坑：类型写得比运行时更严格（如把可选字段标成必填），会把真实数据挡在类型层之外，逼得同事到处写 as。
6. 心智模型：类型是"编译期的契约 + 编辑器的提示"，运行时安全靠校验、测试与防御性编程，两者互补而不是替代。

```ts
async function loadUser() {
  const parsed = UserSchema.safeParse(await res.json()); // zod 等运行时校验
  if (!parsed.success) throw new Error('bad payload');
  return parsed.data; // 到这里才是类型安全且运行时有保障的
}
```

**追问与易错点**：

- 追问：那 `as const` 和类型守卫算不算运行时校验？答：类型守卫函数体里是真的在判断（typeof、in），所以算；`as` 不算。
- 陷阱：面试时回答"有 TS 就不会类型错误"会被追问接口数据形状，正确答案必须落到"边界处校验"。

## 本章小结

- TypeScript 的价值是把类型错误前移到编译期并提供工具能力，代价是编写与检查成本；类型在编译后会被擦除，不提供任何运行时保障。
- TS 是结构化类型系统，只看形状是否兼容；用品牌类型可以模拟名义类型，避免语义不同的同形状类型互相赋值。
- any 关掉检查，unknown 是安全的顶类型必须收窄后用，never 是没有任何值的底类型，是穷尽检查与 Exclude 的基础。
- 打开 strictNullChecks 后 null/undefined 成为独立类型，空值必须显式处理；`!` 与 `as` 都只是给编译器的承诺，不是运行时校验。
- interface 适合可扩展、可合并的对象形状，type 适合联合、元组与类型运算；两者在描述对象时高度重叠，团队一致性优先。
- 泛型靠 extends 约束、靠默认值兜底，推断优先级是显式实参大于入参推断大于默认值；只出现一次的类型参数通常不需要泛型。
- 手写工具类型的底座只有三件事：映射类型加修饰符、分布式条件类型、infer 提取；把这三件学会就能推导大部分内置工具类型。
- 类型体操要服务于"让业务代码不写类型"，深递归、UnionToIntersection 这类写法必须配注释与类型测试，否则是负资产。
- tsconfig 里 strict、target、module、moduleResolution、paths、skipLibCheck、isolatedModules 决定检查强度与构建链兼容；转译交给 esbuild、类型检查交给 tsc --noEmit。

<!-- COUNT: 28 -->
