---
title: "第 11 章 Vue3 核心原理与使用"
---

## 第 11 章 Vue3 核心原理与使用

### Q1 Vue3 相比 Vue2 有哪些核心变化？

**考察点**：能否从响应式、API 形态、编译优化、新增能力、破坏性变更五个层面系统回答，而不是只背"用了 Proxy"。

**参考答案**：

> **一句话结论**：Vue3 的核心变化是响应式换成 Proxy、API 形态从选项式转向组合式、编译期做静态优化，并新增 Fragment/Teleport/Suspense 等能力，代价是不再支持 IE11。

1. 响应式：`Object.defineProperty` 换成 `Proxy`，能监听新增/删除属性、数组索引与 `Map`/`Set`，且惰性递归；`Vue.set`/`Vue.delete` 因此被移除。
2. API 形态：组合式 API（`setup`、`<script setup>`）取代 mixins 做逻辑复用，`this` 从核心地位退场，逻辑按功能内聚而非按选项类型分散。
3. 编译优化：静态提升、`patchFlag`、Block Tree、事件缓存，把"全量 diff 整棵树"变成"靶向更新动态节点"。
4. 新增能力：Fragment 多根节点、Teleport、Suspense、`defineAsyncComponent`、`v-memo`、自定义渲染器 `createRenderer`。
5. 架构与体积：源码用 TypeScript 重写，按 reactivity / runtime-core / compiler-core 等分包；全局 API 具名导出，未使用的可被 tree-shaking 摇掉，核心运行时约 10KB（gzip）级别。
6. 破坏性变更：`v-model` 语义统一（`.sync` 并入）、filters 移除、`$on`/`$off`/`$once` 移除、`beforeDestroy`/`destroyed` 改名、不支持 IE11；Vue2.7 是过渡版本，把组合式 API 回移给了 Vue2。

**追问与易错点**：

- 陷阱：把"Vue3 用 Proxy 所以更快"当唯一原因。Proxy 主要解决的是能力问题，性能提升更多来自不递归初始化与编译期优化，别背"快多少倍"这类数字。
- 追问：Vue3 一定比 Vue2 快吗？答：多数场景更快（更少的无谓 diff、更小的初始化开销），但简单页面差距不明显，要按"减少无效更新"的思路回答而不是给倍数。
- 追问：老项目怎么迁移？答：用官方迁移构建 `@vue/compat` 先跑兼容模式并开警告，逐项处理破坏性变更；Vue2.7 提供了组合式 API 作为平滑过渡。

### Q2 createApp 和 Vue2 的 new Vue 有什么区别？全局 API 变了什么？

**考察点**：考"应用级作用域"这个概念，以及全局 API 从构造函数静态方法变成按需 import 的意义。

**参考答案**：

> **一句话结论**：Vue3 用 `createApp` 创建独立的应用实例，所有全局配置挂在这个实例上、多个应用互不污染；同时全局 API 改成具名导出以便 tree-shaking。

1. 实例隔离：Vue2 的 `Vue.use`/`Vue.mixin`/`Vue.prototype` 挂在构造函数上全局共享；Vue3 每个 `createApp()` 返回的 app 拥有独立的 `component`/`directive`/`mixin`/`config`。
2. 链式 API 与卸载：`app.use(router).use(pinia).mount('#app')` 比 `new Vue({render}).$mount('#app')` 更直白，且提供了 `app.unmount()`，便于微前端与单测清理。
3. 原型访问：`Vue.prototype.$http = ...` 改为 `app.config.globalProperties.$http = ...`，模板中照旧能访问。
4. 全局 API 具名化：`Vue.nextTick` 改为 `import { nextTick } from 'vue'`，`Vue.observable` 由 `reactive` 取代，`Vue.set`/`Vue.delete` 移除，`Vue.extend` 基本由 `defineComponent` 取代。
5. 意义：不再污染全局命名空间；没有用到的 API 会被 tree-shaking 摇掉；测试中每个用例可以创建独立 app。

```js
const app = createApp(App)
app.config.globalProperties.$http = http
app.use(router).use(pinia).mount('#app')
// Vue2：Vue.prototype.$http = http; new Vue({ router }).$mount('#app')
```

**追问与易错点**：

- 陷阱：以为 `createApp` 只是 `new Vue` 换名字。关键差异是应用级作用域：Vue2 注册的全局组件对所有实例可见，Vue3 只属于当前 app。
- 追问：为什么 Vue3 删掉了 `$set`？答：Proxy 能拦截新增/删除属性，直接赋值就是响应式，`$set` 失去存在意义。
- 追问：同一个页面可以创建多个 app 吗？答：可以，挂到不同容器上互不影响（微前端常见做法）；但同一个容器挂两个 app 会互相覆盖。

### Q3 ref 和 reactive 有什么区别？项目里怎么选？

**考察点**：考类型支持、访问方式、响应式丢失三个差异，以及工程上有没有稳定的选型标准。

**参考答案**：

> **一句话结论**：`ref` 能装任意类型、靠 `.value` 读写、在模板里自动解包；`reactive` 只能装对象，且解构与整体替换都会丢响应式，工程上更推荐统一用 `ref`。

1. 类型支持：`ref` 接受基本类型与对象（传对象时内部用 `reactive` 转换）；`reactive` 只接受对象、数组、`Map`/`Set`，传基本类型会返回原值并在开发环境告警。
2. 访问方式：`ref` 在 JS 里必须 `.value`，模板里自动解包；`reactive` 直接属性访问。
3. 响应式丢失：`reactive` 解构 `const { a } = state` 拿到的是快照值，整体替换 `state = {...}` 会断开与旧代理的关联；`ref` 只要改 `.value`（含整体替换）都安全。
4. 传递性：`ref` 作为值传递、放进数组、从函数返回都能保持响应式；`reactive` 一旦被拆解或浅拷贝就失效。
5. 选型：表单字段、`useXxx` 的返回值、需要跨函数传递的状态统一用 `ref`；一组强关联字段（如 `reactive({ page, size, total })`）可用 `reactive`，但同一模块内不要两套写法混用。

```js
const count = ref(0)               // JS 里 count.value++
const state = reactive({ a: 1 })
const { a } = state                // 丢了响应式，a 永远是 1
const aRef = toRef(state, 'a')     // 保持连接，见下一题
```

**追问与易错点**：

- 追问：`ref` 装对象时和 `reactive` 有区别吗？答：底层都是 `reactive`，区别在访问方式与"能不能整体替换"——`state.value = {...}` 是 `ref` 的强项。
- 陷阱：认为 `ref({})` 必须写 `state.value.a = 1` 才对，其实两种写法都行；真正要记住的是 `reactive` 不支持整体替换。
- 追问：为什么模板里不用写 `.value`？答：setup 的返回值会经过 `proxyRefs` 处理（`<script setup>` 编译后直接生成属性访问），ref 在模板上下文顶层自动解包，只有在 JS/TS 里必须显式写。

### Q4 ref 为什么必须写 .value？不能像 reactive 那样直接用吗？

**考察点**：考对"基本类型无法被 Proxy 代理"这一根本限制的理解，属原理深挖题。

**参考答案**：

> **一句话结论**：Proxy 的 target 必须是对象，基本类型必须先包进一个带 getter/setter 的对象才能被追踪，这个包装对象就是 ref，`.value` 就是它的访问入口。

1. 根本限制：`ref(0)` 返回 `RefImpl` 实例，`get value()` 里执行 `track`、`set value()` 里执行 `trigger`，读写因此进入响应式系统。
2. 假如不包装：`let count = 0` 是值传递，函数拿到的只是副本；既无法在读取时知道"谁读了我"，也无法在写入时通知任何人。
3. 模板为什么能省：模板编译后的渲染上下文会用 `proxyRefs` 解包（`<script setup>` 内联模式下编译器直接生成 `.value` 访问），所以模板里写 `count` 就行，JS 里编译器帮不上忙。
4. 附带收益：基本类型与对象统一成同一套 API；同时避开了 `reactive` 解构与整体替换的坑。
5. 解包边界：只有 ref 作为渲染上下文的顶层属性时才自动解包；如果它是普通对象的属性（`{ id: ref(1) }.id`）或数组/`Map` 的元素，模板里仍需显式 `.value`。

```js
// 简化实现
class RefImpl {
  constructor(v) { this._value = v; this.dep = new Set() }
  get value() { track(this.dep); return this._value }
  set value(v) { if (hasChanged(v, this._value)) { this._value = v; trigger(this.dep) } }
}
```

**追问与易错点**：

- 陷阱：把"要写 `.value`"当成设计缺陷。它是"基本类型不可被代理"这一限制下的必然选择，`.value` 也是"我在访问响应式值"的显式信号。
- 追问：解构 ref 会怎样？答：`const { value } = someRef` 拿到的是当时的快照值，会失去响应式，需要保持引用或改用 `toRef`。
- 追问：`reactive` 对象里嵌套的 ref 要写 `.value` 吗？答：不用，嵌套在响应式对象里的 ref 会被自动解包（`state.count` 等价 `state.count.value`）；但数组与 `Map` 元素不会解包。

### Q5 toRef 和 toRefs 解决什么问题？

**考察点**：考"解构丢响应式"的补救方案，以及 toRef 与 ref 的本质区别（引用 vs 复制）。

**参考答案**：

> **一句话结论**：它们把响应式对象的某个属性包装成 ref，既能解构出来单独使用、又不切断与源对象的连接；`toRefs` 是批量版本。

1. 问题来源：`const { count } = reactive({ count: 0 })` 拿到的是一次性拷贝，后续 `state.count` 变化不会更新解构出的变量。
2. `toRef(state, 'count')` 返回一个 ref，`.value` 的读写都会转发到 `state.count`（内部是 `ObjectRefImpl`，用 getter/setter 代理源属性），双向同步。
3. `toRefs(state)` 遍历所有属性批量转换，常见用法是 `return { ...toRefs(state) }` 或 `const { title } = toRefs(props)`。
4. 与 `ref` 的区别：`ref` 复制一份值，`toRef` 指向源属性；Vue 3.3+ 还支持 `toRef(() => props.x)` 的 getter 形式（返回只读 ref），可安全处理可选属性。
5. 注意：`toRef` 不创建独立状态，改它等于改源对象；若本意是复制快照，应该用 `ref` 或 `toRaw` + 展开。

```js
const state = reactive({ count: 0, title: 'a' })
const count = toRef(state, 'count')
count.value++                     // state.count 也变成 1
const { title } = toRefs(state)   // title 是 Ref<string>
const len = toRef(() => props.name.length)  // Vue 3.3+ 的 getter 形式
```

**追问与易错点**：

- 追问：props 为什么要配 `toRefs`？答：props 本身是响应式的，解构会丢；`toRefs(props)` 保持连接。另外 Vue 3.5 起 `<script setup>` 中直接解构 props 会被编译器改写成属性访问并保持响应式，但 JS/TS 里手写解构仍会丢。
- 陷阱：认为 `toRef` 会创建新状态。它只是源属性上的一层 ref 包装，写入会直接改源对象，源对象变了它也会变。
- 追问：`toRef(props, 'x')` 与 `computed(() => props.x)` 怎么选？答：只做传递/读取时 `toRef` 更直接；需要格式化、派生计算或只读语义时用 `computed`。

### Q6 shallowRef、shallowReactive、readonly 分别用在什么场景？为什么说 shallowRef 能提升性能？

**考察点**：考是否理解"深层递归代理是有成本的"，以及浅层 API 与只读 API 的取舍。

**参考答案**：

> **一句话结论**：浅层 API 只代理第一层，避免大对象深度递归带来的代理创建与依赖收集开销；`readonly` 用于约束"只读"的语义（如 props、配置对象）。

1. `shallowRef`：只有 `.value` 整体替换才触发更新，内部属性变化不触发、也不会被深度代理；适合"整体替换的接口数据"与第三方实例（图表、地图、类实例）。
2. 手动触发：改了深层数据又想刷新视图时用 `triggerRef(ref)` 强制通知依赖。
3. `shallowReactive`：只拦截第一层的增删改，深层不响应；适合只关心顶层字段的配置对象或性能敏感的大结构。
4. `readonly`：返回深层只读代理，写入在开发环境告警且不生效，常用于把配置或 props 再包一层以声明"此处不许改"；`shallowReadonly` 只锁第一层。
5. 性能点：`reactive` 是惰性递归——访问到哪一层才代理哪一层，但模板一旦访问到大对象的深层属性，就会产生大量代理与依赖收集；`shallowRef`/`markRaw` 直接跳过这些开销，是"数据整体替换、从不原地修改"时的最优解。

```js
const big = shallowRef(await fetchConfig())
big.value = await fetchConfig()   // 整体替换 → 触发
big.value.deep.x = 1              // 不触发
triggerRef(big)                   // 手动触发
const cfg = readonly({ a: 1 })
// cfg.a = 2  // 开发环境告警且不生效
```

**追问与易错点**：

- 陷阱：用 `shallowRef` 装对象后原地改深层属性却抱怨"页面不更新"。要么整体替换，要么 `triggerRef`。
- 追问：`shallowRef` 和 `markRaw` 什么关系？答：`shallowRef` 控制"这个 ref 的深层要不要被追踪"，`markRaw` 是让对象在任何地方都不被转成代理；常见组合是 `shallowRef(markRaw(chart))`。
- 追问：`readonly` 是安全边界吗？答：不是。它只拦截通过该代理的写入，直接改原始对象仍然有效，属于"契约提示 + 开发期告警"。

### Q7 Vue3 的响应式为什么用 Proxy 而不用 Object.defineProperty？Reflect 起什么作用？

**考察点**：考 Vue2 响应式的三个硬伤与 Proxy、Reflect 的配合，是响应式原理的深挖题。

**参考答案**：

> **一句话结论**：`defineProperty` 只能拦截"已存在属性的读写"，所以 Vue2 必须靠 `$set`/`$delete` 和重写数组方法打补丁；Proxy 能拦截整个对象的 13 类操作，天然支持新增/删除属性、数组索引与集合类型，还能做到惰性递归。

1. Vue2 的限制：初始化时递归遍历 `data` 的每个属性定义 getter/setter，深层对象在启动阶段就被全部处理（时间与内存开销）；新增/删除属性不响应，必须 `Vue.set`/`Vue.delete`；数组靠重写 7 个方法加索引拦截。
2. Vue3 的做法：`new Proxy(target, handler)` 拦截 `get`/`set`/`has`/`deleteProperty`/`ownKeys` 等，属性不存在也能收集依赖，删除也能触发更新。
3. Reflect 的作用：handler 里用 `Reflect.get(target, key, receiver)` 执行默认行为，`receiver` 让 getter/setter 里的 `this` 指向代理对象——这样"对象内部访问 `this.other`"也能被收集，父子嵌套的属性变化才能正确联动。
4. 惰性递归：`get` 时判断返回值是对象才用 `reactive` 包一层（结果缓存在 `WeakMap` 里），没访问到的深层不产生代理，初始化极快。
5. `Map`/`Set` 支持：集合类型走专门的 collectionHandlers，`map.get(k)` 读取时 `track(map, k)`，遍历与 `size` 用 `ITERATE_KEY`，`set`/`delete`/`clear` 时触发对应依赖。
6. 代价：Proxy 无法被 polyfill，IE11 彻底出局；代理对象与原对象不相等（`proxy !== raw`），需要原始值用 `toRaw`。

```js
const handler = {
  get(target, key, receiver) {
    track(target, key)
    const res = Reflect.get(target, key, receiver)
    return isObject(res) ? reactive(res) : res
  },
  set(target, key, value, receiver) {
    const old = target[key]
    const ok = Reflect.set(target, key, value, receiver)
    if (hasChanged(value, old)) trigger(target, key)
    return ok
  },
}
```

**追问与易错点**：

- 陷阱：说"Proxy 更快所以 Vue3 换掉了它"。主要动机是能力（新增/删除/集合类型/惰性），性能只是结果之一。
- 追问：为什么 `Reflect` 的第三个参数 `receiver` 不能省？答：省掉后通过代理读取对象内部 getter 时 `this` 指向原始对象，内部属性的依赖收集不到，会出现"改了子属性不更新"的奇怪 bug。
- 追问：`arr[0] = 1`、`arr.length = 0`、`obj.newKey = 1` 在 Vue3 会更新吗？答：会，Proxy 拦截了这些操作，新增/删除属性也不需要 `$set`。
- 陷阱：以为 Vue3 里也要对 `Map`/`Set` 特殊处理。用 `reactive(new Map())` 就能直接响应式（但 `shallowReactive` 不代理集合内部）。

### Q8 Vue3 的依赖收集与触发是怎么实现的？track、trigger、activeEffect 各是什么角色？

**考察点**：考能否讲清"当前副作用 + 目标映射表"这套机制，是响应式内核最核心的深挖题。

**参考答案**：

> **一句话结论**：响应式系统用 `activeEffect` 记录"当前正在执行的副作用"，用 `targetMap`（`WeakMap<target, Map<key, Set<effect>>>`）保存依赖关系：读取属性时 `track` 把 `activeEffect` 挂到对应 dep 上，写入属性时 `trigger` 取出 dep 重新执行副作用或调用它的 `scheduler`。

1. 分层职责：`reactive` 只负责拦截读写，真正的收集与通知发生在 `track`/`trigger`；依赖表是 `target → key → Set<ReactiveEffect>` 三层结构。
2. `track`：若当前存在 `activeEffect`，按 target、key 找到（或创建）dep 集合加入该 effect，并把它记进 `effect.deps` 以便后续清理。
3. `trigger`：从 `targetMap` 取出该 key 的 dep 遍历执行；若 effect 带 `scheduler`（组件渲染、`computed`、`watch` 都有）就调用 scheduler，否则直接 `run()`。
4. `activeEffect` 与 `effectStack`：`effect.run()` 执行前把自己设为 `activeEffect` 并压栈，结束后弹栈恢复上一个——保证嵌套副作用（渲染中求值 computed）结束后依赖收集回到正确的宿主。
5. 依赖清理：每次 run 之前，effect 先把自己从上次收集的 dep 中移除再重新收集，避免条件分支切换后留下多余依赖导致的无效触发。
6. 组件渲染本身就是一个 effect：它的 scheduler 把更新任务投进队列（`queueJob`），这才是"数据变了不会立刻渲染、而是微任务批量刷新"的根源。

```js
let activeEffect = null
const effectStack = []
function effect(fn, options) {
  const e = new ReactiveEffect(fn, options?.scheduler)
  e.run()      // run 内部：cleanupDeps → 压栈 activeEffect = this → fn() → 弹栈恢复
  return e
}
```

**追问与易错点**：

- 追问：为什么 dep 用 `Set` 而不是数组？答：同一个 effect 对同一个 key 只应存在一份，`Set` 天然去重，清理时删除也是 O(1)。
- 陷阱：以为"谁读属性谁就被收集"。只有在某个 effect 执行期间发生的读取才会被收集；在 `setTimeout` 里裸读一次属性不会建立任何依赖。
- 追问：`computed` 和 `watch` 也是 effect 吗？答：是。`computed` 是 lazy + scheduler 的 effect，`watch` 是带 job 的 effect，都遵循同一套收集与触发规则；也正因如此，在 watch 回调里读属性不会再建立依赖。

### Q9 computed 是怎么实现缓存的？

**考察点**：考"惰性求值 + dirty 标记"这一核心设计，以及依赖链（源 → computed → 渲染）如何建立。

**参考答案**：

> **一句话结论**：`computed` 返回一个带 `_dirty` 标记的 `ComputedRefImpl`，内部持有一个 lazy 的 effect：首次访问求值并缓存，依赖变化时只把 `dirty` 置为 true 并通知下游，下次访问才真正重算。

1. 首次读取 `.value`：`dirty` 为 true，执行内部 `effect.run()` 得到值缓存到 `_value`，`dirty` 置 false，同时把当前的活跃 effect（例如渲染 effect）收集为自己的订阅者。
2. 依赖变化：computed 的 effect 使用 scheduler，scheduler 只做两件事——把 `dirty` 置为 true、`trigger` 自己的 dep 通知渲染等下游；此时不会立刻重新求值。
3. 再次读取：只有 `dirty` 为 true 才重新执行 getter，否则直接返回缓存值，所以模板里多处引用同一个 computed 只会计算一次。
4. 依赖链：求值时 `activeEffect` 被换成 computed 自己的 effect，因此它读到的响应式数据成为它的依赖；同时它自身的 dep 交给渲染 effect 订阅，形成"源 → computed → 渲染"。
5. 与 methods 的区别：methods 每次渲染都执行；computed 只在依赖变化且被读取时才执行，因此昂贵派生值应当用 computed。
6. 使用边界：可写 computed 用 get/set 实现；computed 里不要做副作用，也不要依赖非响应式数据（如 `Date.now()`，不变化就不会重算）。

```js
class ComputedRefImpl {
  constructor(getter) {
    this._dirty = true
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) { this._dirty = true; triggerRefValue(this) }
    })
  }
  get value() {
    trackRefValue(this)
    if (this._dirty) { this._value = this.effect.run(); this._dirty = false }
    return this._value
  }
}
```

**追问与易错点**：

- 陷阱：说"computed 依赖一变就立刻重算"。它是惰性的：不访问就不计算，只把 `dirty` 标记置位（Vue 3.4 起进一步优化了重复求值与依赖对比的开销）。
- 追问：computed 为什么不能做异步？答：getter 必须同步返回一个值；异步派生结果应该用 `watch`/`watchEffect` 写进 ref，或配合 Suspense + async setup。
- 追问：computed 里 `console.log` 打出很多次说明什么？答：该 computed 被频繁读取且依赖频繁变化，需要检查依赖粒度（是否监听了不相关的大对象）或换成 watch + 手动缓存。

### Q10 computed、watch、watchEffect 有什么区别？什么时候用哪个？

**考察点**：考选型判断，以及 `immediate`/`deep`/`flush` 这些选项的语义，是高频对比题。

**参考答案**：

> **一句话结论**：`computed` 用于"算出一个值"（有缓存、必须同步返回、不应有副作用）；`watch`/`watchEffect` 用于"值变化时做事"，其中 `watch` 显式指定数据源、默认懒执行、能拿到旧值，`watchEffect` 自动收集依赖、立即执行一次、不提供旧值。

| 维度 | computed | watch | watchEffect |
| --- | --- | --- | --- |
| 目的 | 派生状态 | 响应副作用 | 响应副作用 |
| 缓存 | 有（dirty 标记） | 无 | 无 |
| 首次执行 | 被访问时 | 默认不执行（`immediate` 可改） | 立即执行一次 |
| 旧值 | 无 | 有 | 无 |
| 依赖来源 | getter 内读取 | 显式 source | 执行中同步读取到的 |

1. 选型口诀：要值用 `computed`，要做事用 `watch`/`watchEffect`；需要旧值、需要精确控制依赖、要做请求/清理，用 `watch`。
2. `watch` 的 source 可以是 ref、reactive 属性、getter（`() => obj.a`）或数组（任一变化都触发）。
3. `deep` 要注意：`watch` 一个 reactive 对象时默认就是深度监听；显式传 `deep: false` 时只追踪根级属性（Vue 3.4 起对该写法生效），深层变化不再触发。而 `watch` 一个装着对象的 ref 只有 `.value` 整体替换才触发，要深层变化必须显式 `deep: true`。
4. `deep` 的代价：会递归遍历对象、把深层所有属性都收成依赖，大对象开销明显；替代方案是用 getter 精确监听字段或只监听需要的属性。
5. `watchEffect` 的开始就立即执行一次，代码里 `await` 之后读取的属性不会被追踪；`onCleanup` 可注册清理函数（取消上一次请求），两个 API 都返回 `stop` 函数，组件内的会随卸载自动停止。Vue 3.4+ 的 `watch` 还支持 `once: true`。

```js
const total = computed(() => list.value.reduce((s, i) => s + i.price, 0))
watch(() => props.id, async (id, oldId, onCleanup) => {
  const ac = new AbortController()
  onCleanup(() => ac.abort())          // 竞态清理
  data.value = await fetchDetail(id, { signal: ac.signal })
}, { immediate: true })
watchEffect(() => console.log(state.a, state.b))  // 用到谁就依赖谁
```

**追问与易错点**：

- 陷阱：在 computed 里发请求。computed 必须同步返回且不能有副作用，这是面试官最爱追问的错误。
- 追问：`watchEffect` 容易踩什么坑？答：只收集同步执行期间读到的依赖，`await` 之后再读的属性不会被追踪，所以不要在 `watchEffect` 里做"先请求后读响应式数据"的逻辑。
- 追问：`watch(reactiveObj, cb, { deep: false })` 会怎样？答：只遍历根级属性，深层嵌套变化不触发（Vue 3.4 起 `deep: false` 对 reactive 源生效，更早版本会被强制深度监听）；要精确监听某个字段就用 getter。
- 陷阱：`watch(props, ...)` 会在任意 prop 变化时触发（props 本身是浅响应式对象），但新旧值是同一个对象、也分不清哪个字段变了；要精确监听某个字段仍应写 `watch(() => props.x, ...)`。

### Q11 watch 的 flush: 'post' / 'sync' 是什么意思？它和 nextTick 有什么关系？

**考察点**：考更新队列的执行结构与时机，是"什么时候能读到新 DOM"的实战题。

**参考答案**：

> **一句话结论**：`flush` 决定 watch 回调在更新队列中的位置——默认 `'pre'`（组件渲染前，DOM 还是旧值）、`'post'`（渲染后，DOM 已更新）、`'sync'`（数据一变同步立即执行）；`'post'` 与"在回调里 `await nextTick()` 再读 DOM"效果等价。

1. 队列模型：数据变化 → 触发 scheduler → `queueJob` 入队 → 微任务里 `flushJobs`：先按实例 id 排序执行主队列（组件更新 effect 与默认 `'pre'` watch 回调在同一队列内排序，同实例的 watch 紧邻该组件的更新），最后执行 post 队列。
2. `'pre'`：回调在 pre 队列中按实例 id 排序（父先于子），此时 DOM 尚未更新，读 `el.offsetHeight` 或组件 `$el` 拿到的是旧值。
3. `'post'`：回调进入 post 队列，在组件渲染完成后执行，可以安全读取最新 DOM 与子组件 ref；等价写法是默认 flush + 回调里 `await nextTick()`。
4. `'sync'`：不走队列，源数据一变立即同步执行；同一轮改三次就执行三次，容易重复请求、性能变差，在回调里改被监听的数据还容易死循环，只在必须同步拿到结果的特殊场景用。
5. 与 nextTick 的关系：`nextTick` 返回的 Promise 在整个 flush（含 post 队列）跑完后才 resolve，所以 `await nextTick()` 之后读 DOM 一定是新值；反过来，pre 回调里 `await nextTick()` 也能读到新 DOM。

```js
watch(source, () => measure(), { flush: 'post' })   // DOM 已更新
watch(source, () => { /* 这里还是旧 DOM */ }, { flush: 'pre' })
watch(source, cb, { flush: 'sync' })                // 立即执行，慎用
```

**追问与易错点**：

- 追问：父组件的 watch 默认在什么时候执行？答：`'pre'` 且按实例 id 排序，所以父的回调在子组件更新之前执行；父子都要读 DOM 的场景必须用 `'post'`。
- 陷阱：在 `flush: 'sync'` 里修改同一个被监听的数据，形成"改数据 → 触发回调 → 再改数据"的无限循环。
- 追问：为什么默认不在渲染后执行？答：`'pre'` 允许在渲染前根据新数据修正状态，让本次渲染一次到位，避免多渲染一轮。

### Q12 nextTick 的原理是什么？为什么改完数据马上读 DOM 拿不到新值？

**考察点**：考"异步批量更新"的设计与微任务实现，是 Vue 与事件循环结合的高频题。

**参考答案**：

> **一句话结论**：Vue3 把组件更新做成微任务里的批量队列：数据变化只把更新任务入队，真正的 DOM 更新发生在 `Promise.then` 回调中；`nextTick` 返回的 Promise 在这个队列 flush 之后 resolve，所以要等一个微任务才能读到新 DOM。

1. 入口链路：数据变化 → `trigger` → 组件渲染 effect 的 scheduler → `queueJob(job)`；`queueJob` 会按 id 去重（同一组件同一轮只更新一次），若当前不在刷新中就注册微任务。
2. 微任务实现：Vue3 直接用 `Promise.resolve().then(flushJobs)`，不再保留降级链；Vue2 则是 Promise → MutationObserver → setImmediate → setTimeout 的降级链。
3. `flushJobs`：先按 id 排序队列（保证父组件先于子组件更新，避免子组件拿旧 props 渲染），再执行 pre 队列与组件更新，然后执行 post 队列，最后清空并复位状态。
4. `nextTick(cb)` 把回调挂到当前 flushPromise 之后并返回 Promise（支持 `await`），不传回调时直接返回 Promise。
5. 结果：同一轮里改 10 次数据只渲染一次；也正因如此，改完数据立即读 DOM 拿到的是旧值。
6. 代价与收益：收益是"结果一致 + 只渲染一次"，代价是必须等一个微任务，同步测量 DOM 的场景要注意时机。

```js
count.value++
console.log(el.textContent)   // 旧值
await nextTick()
console.log(el.textContent)   // 新值
nextTick(() => { /* 也可以传回调 */ })
```

**追问与易错点**：

- 陷阱：把 `nextTick` 当成"等所有异步完成"。它只等 Vue 自己的更新队列（一个微任务），接口请求、定时器都在各自的宏任务里，`nextTick` 等不到。
- 追问：`nextTick` 和 `setTimeout` 有什么区别？答：`nextTick` 基于微任务，在当前宏任务结束后、浏览器渲染前执行；`setTimeout` 是宏任务，时序更晚且中间可能发生一次渲染。
- 追问：为什么必须按实例 id 排序？答：保证父组件先更新，避免子组件用旧 props 渲染出中间态。
- 陷阱：在 `updated` 或 `nextTick` 回调里无条件改状态，可能形成"更新 → 回调 → 再更新"的循环。

### Q13 setup 什么时候执行？它里面能做什么、不能做什么？

**考察点**：考组合式 API 的入口时机与能力边界，是组合式 API 的基础题。

**参考答案**：

> **一句话结论**：`setup` 在 props 解析完成之后、`beforeCreate` 之前执行，且整个组件生命周期内只执行一次；它能访问 props 与 context（attrs、slots、emit、expose），但不能使用 `this`，也拿不到 DOM。

1. 时机：创建组件实例 → 初始化 props → 调用 `setup`；它早于 `beforeCreate`，早于 data/computed/methods 的初始化，所以 `setup` 里 `this` 是 undefined。
2. 参数：第一个是 props（浅只读的响应式对象，不能直接改），第二个是 context，含 `attrs`、`slots`、`emit`、`expose` 四个字段。
3. 只执行一次：与 `activated`/`deactivated` 不同，`setup` 不随 keep-alive 激活重复执行；返回对象会被代理后暴露给模板，返回函数则当作 render 使用。
4. 拿不到 DOM：挂载尚未发生，需要操作 DOM 的逻辑放 `onMounted` 或 `nextTick` 里；需要实例本身用 `getCurrentInstance()`。
5. `<script setup>` 的整个 script 块就是 setup 函数体；顶层 `await` 会让组件变成 async setup，必须被 Suspense 包裹才能渲染。
6. 钩子注册必须在 setup 同步执行期间完成：写在 `await` 之后或 `setTimeout` 里的 `onMounted` 不会被收集（开发环境会有警告且不执行）。

```js
export default {
  props: { id: Number },
  setup(props, { emit, attrs, slots, expose }) {
    const data = ref(null)
    onMounted(() => { /* 这里才能拿到 DOM */ })
    return { data }        // 返回后模板可用
  },
}
```

**追问与易错点**：

- 陷阱：在 `setup` 里写 `this.$refs.x`。`setup` 中 `this` 是 undefined，Options API 的选项也还没初始化。
- 追问：`setup` 能取代 `created` 吗？答：能，它承担了 `beforeCreate`/`created` 的职责；需要在渲染前拿到数据时，客户端可直接在 setup 顶层发起请求，SSR 场景用 `onServerPrefetch` 或顶层 `await` 配合 Suspense。
- 追问：为什么钩子必须在同步阶段注册？答：注册依赖"当前组件实例"这个隐式上下文，异步回调执行时上下文已经被清理。
- 陷阱：在 setup 里解构 props 再使用。Vue 3.5 起 `<script setup>` 中的解构会被编译器保持响应式，但 JS/TS 手写解构仍会丢，稳妥做法是 `props.id` 或 `toRef(props, 'id')`。

### Q14 `<script setup>` 编译成了什么？defineProps、defineEmits、defineExpose、defineOptions、defineModel 都是干什么的？

**考察点**：考"编译期宏"的理解，以及各个宏生成什么组件选项，是 Vue3 使用层面的高频题。

**参考答案**：

> **一句话结论**：`<script setup>` 里的代码被编译为组件的 `setup` 函数体，模板被编译成内联 render（直接访问作用域变量、不走 `this`）；`defineXxx` 都是编译期宏，不需要 import，只负责生成对应组件选项。

1. 编译产物结构：`export default _defineComponent({ props, emits, setup() { /* 原样搬进来的顶层代码 */ return (ctx) => /* 模板生成的 render */ } })`；import 与顶层变量自动暴露给模板，不需要手动 return。
2. `defineProps`：声明 props，编译为 props 选项并把 props 作为 setup 参数（支持运行时对象写法与 TS 类型写法），是只读的。
3. `defineEmits`：声明组件事件并返回 `emit` 函数，编译为 `emits` 选项；声明过的事件不会再作为 attrs 落到根元素上。
4. `defineExpose`：显式暴露属性。`<script setup>` 组件默认闭合，父组件通过 ref 拿到的是只含 expose 内容的代理（选项式 API 子组件默认暴露全部实例属性）。
5. `defineOptions`（Vue 3.3+）：在 script setup 里声明 `name`、`inheritAttrs` 等原本只能写在组件对象上的选项，无需再加一个 `<script>` 块。
6. `defineModel`（Vue 3.4 起正式稳定）：`const model = defineModel()` 一行同时声明 prop 与 update 事件，返回可读写 ref，天然支持多 `v-model`（`defineModel('title')`）、默认值与修饰符；本质仍是 `props.modelValue` + `emit('update:modelValue')` 的语法糖。

```vue
<script setup>
defineOptions({ name: 'UserCard', inheritAttrs: false })
const props = defineProps({ user: { type: Object, required: true } })
const emit = defineEmits(['select'])
const visible = defineModel('visible', { type: Boolean, default: false })
defineExpose({ focus: () => inputRef.value?.focus() })
const inputRef = ref(null)
</script>
```

**追问与易错点**：

- 陷阱：把 `defineProps` 当成运行时函数去 import，或在非顶层作用域使用宏。宏只在编译期存在，编译后的代码里已经没有它们。
- 追问：`defineProps` 解构后还响应式吗？答：`<script setup>` 中 Vue 3.5 起解构会被编译成属性访问并保持响应式（更早版本要 `toRefs`）；但把解构出的值再塞进普通对象传递仍会丢。
- 追问：为什么 `<script setup>` 组件要 `defineExpose`？答：默认闭合可以避免内部状态被意外访问，类型推导与压缩也更友好，需要给父组件调用时才显式暴露。
- 陷阱：`defineModel` 是 3.4 才稳定（3.3 为实验特性），老项目里更常见 `props.modelValue` + `emit('update:modelValue')` 的手写形式，回答时要标明版本。

### Q15 props 为什么不能直接修改？多个 v-model 怎么绑定？

**考察点**：考单向数据流的动机（而非只背"不能改"），以及对象类型 props 的隐性坑与多值 v-model 的写法。

**参考答案**：

> **一句话结论**：props 是父组件传下来的数据，遵循单向数据流：子组件只读、通过 emit 通知父组件改；多值绑定用带参数的 `v-model:xxx`，它就是 `:xxx` + `@update:xxx` 的语法糖。

1. 为什么只读：props 在子组件里是浅只读的响应式代理，直接赋值在开发环境会告警且不生效；数据源只有一个（父组件），状态才可追踪、不会出现父子数据不一致。
2. 正确做法：`emit('update:title', v)` 让父组件更新；或者复制成本地 `ref(props.title)`，但要自己处理后续同步（通常配 watch）。
3. 对象/数组 props 的坑：不能换引用，但改内部属性 Vue 不拦截也不告警——这依然破坏单向数据流（父组件会"莫名其妙"变化），排查困难；需要可变副本时做一层浅拷贝。
4. 多值 `v-model`：父组件写 `<UserCard v-model:title="title" v-model:visible="visible" />`，子组件用 `defineModel('title')`、`defineModel('visible')`，或手写 `props.title` + `emit('update:title')`。
5. 默认值与校验：对象/数组的默认值必须是工厂函数，`type` 校验失败只告警不阻断，`required`、`validator` 按需加。
6. 相关配置：`inheritAttrs: false` 可阻止未声明的属性落到根元素；多根组件必须显式 `v-bind="$attrs"`，否则属性会"消失"。

```vue
<!-- 父 -->
<UserCard v-model:title="title" v-model:visible="visible" />
<!-- 子 -->
<script setup>
const title = defineModel('title')
const visible = defineModel('visible', { type: Boolean })
</script>
```

**追问与易错点**：

- 陷阱：`props.user.name = 'x'` 不会报错，但这是隐性 bug；面试官常顺着这句追问"为什么对象 props 内部修改没有告警"。
- 追问：props 变化我必须响应吗？答：要派生值就用 `computed(() => props.user.name)`，要副作用就用 `watch`；不要用本地 data 做镜像再手动同步，容易漏掉更新。
- 追问：`v-model` 和 Vue2 的 `.sync` 什么关系？答：`.sync` 已被并入 `v-model` 的参数形式，`v-model:title` 等价于过去的 `:title.sync`。

### Q16 v-model 在原生表单和自定义组件上分别怎么实现？

**考察点**：考"语法糖 + 约定"的本质，以及不同表单元素、修饰符的实现差异。

**参考答案**：

> **一句话结论**：`v-model` 在自定义组件上是 `:modelValue` + `@update:modelValue`；在原生元素上编译成内置指令（input 用 `vModelText`、checkbox 用 `vModelCheckbox`、radio 用 `vModelRadio`、select 用 `vModelSelect`）并监听 `onUpdate:modelValue`，做的是"绑定 value/checked + 监听 input/change"这类工作。

1. 自定义组件：`<Child v-model="x" />` 编译为 `:modelValue="x"` + `@update:modelValue="x = $event"`；子组件用 `defineModel()` 或 `props: ['modelValue']` + `emits: ['update:modelValue']`。
2. 多值与参数：`v-model:title` 对应 prop `title` 与事件 `update:title`；`v-model` 可以出现多个。
3. 原生元素：由运行时指令处理"取值、赋值、修饰符、以及中文输入法组合输入（composition）期间不打断"这些细节，语义上等价于 `:value` + `@input`（checkbox/radio 绑的是 `checked` + `change`，select 绑 `value` + `change`）。
4. 修饰符：`.lazy`（改用 change 事件）、`.number`、`.trim` 在原生元素上由指令处理；自定义组件上修饰符通过 `modelModifiers`（带参数时是 `xxxModifiers`）prop 传入，由子组件自行实现。
5. 本质：`v-model` 是编译期语法糖 + 运行时约定，理解成"prop 向下、事件向上"即可，它并不存在特殊的数据通道。

```js
// 子组件不用 defineModel 的等价写法
const props = defineProps(['modelValue', 'modelModifiers'])
const emit = defineEmits(['update:modelValue'])
const onInput = (e) => {
  let v = e.target.value
  if (props.modelModifiers?.trim) v = v.trim()
  emit('update:modelValue', v)
}
```

**追问与易错点**：

- 陷阱：以为自定义组件上默认绑的是 `value`。Vue3 是 `modelValue`（Vue2 才是 `value` + `input`），这也是迁移时最容易漏改的地方之一。
- 追问：`.trim` 在自定义组件上会自动生效吗？答：不会，需要子组件读取 `modelModifiers` 自己实现；原生元素上的修饰符才是框架内置行为。
- 追问：为什么输入法打字时 `v-model` 不会乱？答：内置 vModelText 指令在 composition 期间不强制回写值，等组合结束后再同步，这是手写 `:value` + `@input` 容易忽略的细节。

### Q17 Vue2 和 Vue3 的生命周期钩子怎么对应？新增了什么？

**考察点**：考对照关系是否准确（尤其是改名与 setup 的取代关系），容易背错的地方。

**参考答案**：

> **一句话结论**：Options API 里只有 destroy 系列改名（`beforeDestroy` → `beforeUnmount`、`destroyed` → `unmounted`），`beforeCreate`/`created` 的职责由 `setup` 承担，组合式 API 用 `onXxx` 注册，另外新增了 `onRenderTracked`/`onRenderTriggered` 等。

| Vue2 | Vue3 选项式 | 组合式 API | 时机 |
| --- | --- | --- | --- |
| beforeCreate | beforeCreate | setup | 实例创建、props 解析后 |
| created | created | setup | 实例创建完成，无 DOM |
| beforeMount | beforeMount | onBeforeMount | 首次挂载前 |
| mounted | mounted | onMounted | DOM 挂载完成 |
| beforeUpdate | beforeUpdate | onBeforeUpdate | 数据变化、DOM 更新前 |
| updated | updated | onUpdated | DOM 更新完成 |
| beforeDestroy | beforeUnmount | onBeforeUnmount | 卸载前 |
| destroyed | unmounted | onUnmounted | 卸载完成 |
| activated / deactivated | 同名 | onActivated / onDeactivated | keep-alive 激活 / 失活 |
| errorCaptured | 同名 | onErrorCaptured | 捕获后代错误 |
| serverPrefetch | 同名 | onServerPrefetch | SSR 数据预取 |

1. 命名变化只涉及 destroy 系列；`mounted`、`updated` 等名字不变，组合式 API 只是加了 `on` 前缀。
2. `setup` 取代 `beforeCreate` 与 `created`：实例已创建但选项尚未初始化，所以不能用 `this`。
3. 注册方式：组合式 API 必须同步调用 `onMounted(...)`；选项式仍可直接写 `mounted() {...}`。
4. 同一钩子可注册多次，按注册顺序执行；`setup` 一定早于同组件的 `created`（选项式写法）。
5. 清理工作：定时器、事件监听、WebSocket 放在 `onBeforeUnmount`/`onUnmounted`；`watch`/`computed` 会随组件卸载自动停止，手动创建的资源不会。

**追问与易错点**：

- 陷阱：以为所有钩子都改了名。只有 destroy 系列改名，别把 `mounted` 说成 `onMounted` 才算"Vue3 写法"。
- 追问：资源清理放 `onBeforeUnmount` 还是 `onUnmounted`？答：定时器、订阅、事件监听放 `onBeforeUnmount`（组件还完整、能拿到最新状态）；依赖 DOM 已不存在的收尾逻辑可放 `onUnmounted`。
- 追问：为什么 `setup` 里注册的 watch 不需要手动 stop？答：实例卸载时会停止组件作用域（effectScope）内的所有副作用，其中就包括 setup 中创建的 `watch`/`computed`。
- 陷阱：在 `await` 之后注册 `onMounted`，钩子不会执行（当前实例上下文已丢失，开发环境会有警告）。

### Q18 父子组件的生命周期执行顺序是怎样的？为什么？

**考察点**：考挂载、更新、卸载三条链路的顺序及其原因，是考察"有没有真正理解渲染流程"的题。

**参考答案**：

> **一句话结论**：挂载是"父 setup/beforeMount → 子 setup/beforeMount → 子 mounted → 父 mounted"，更新是"父 beforeUpdate → 子 beforeUpdate → 子 updated → 父 updated"，卸载是"父 beforeUnmount → 子 beforeUnmount → 子 unmounted → 父 unmounted"。

1. 挂载为什么子先：父 render 时先创建子组件 vnode，子组件要先把真实 DOM 渲染并插入占位处，父组件才能完成自己的插入；而 `mounted` 是渲染后钩子（走 post 队列），子组件的钩子先入队先执行。
2. 更新为什么"父 before，子 updated 先"：父数据变化触发父更新 → 父 `beforeUpdate` → 父 render 生成新的子 vnode → 子 `beforeUpdate` → 子更新 DOM → 子 `updated` → 父 `updated`（`updated` 也是 post 队列，子先入队）。
3. 卸载顺序"父先开始、子先结束"：父 `beforeUnmount` → 递归卸载子组件（子 `beforeUnmount` → 子 `unmounted`）→ 父 `unmounted`。
4. 顺序根源：`mounted`/`updated` 通过 `queuePostRenderEffect` 进 post 队列，顺序由入队顺序决定；父组件的挂载必须等整棵子树插入完成，因此父的钩子一定最后执行。
5. 例外：异步组件在被解析并挂载后才执行钩子，其 `mounted` 可能晚于父组件；被 Suspense 包裹时父组件会等异步依赖就绪。
6. keep-alive 场景：首次是 `mounted`，之后激活走 `activated`，切走走 `deactivated`（不会再触发 `mounted`/`unmounted`）。

```js
// 挂载：父 setup → 父 beforeMount → 子 setup → 子 beforeMount → 子 mounted → 父 mounted
// 更新：父 beforeUpdate → 子 beforeUpdate → 子 updated → 父 updated
// 卸载：父 beforeUnmount → 子 beforeUnmount → 子 unmounted → 父 unmounted
```

**追问与易错点**：

- 陷阱：在父组件 `beforeMount` 里通过 ref 访问子组件实例。此时子组件还没挂载，拿到的是 null。
- 追问：父 `mounted` 里能拿到子组件 DOM 吗？答：能，子组件已挂载完成；但子组件内部异步请求的数据可能还没到，需要各自的 loading 状态配合。
- 追问：兄弟组件的顺序？答：按模板中的 vnode 顺序依次挂载，前一个的 `mounted` 先执行。
- 陷阱：以为 `updated` 是"父先子后"。`updated` 与 `mounted` 同属渲染后钩子，都是子先父后。

### Q19 模板是怎么变成真实 DOM 的？为什么 Vue3 支持多根节点？

**考察点**：考编译三步 + 运行时渲染链路，以及 Fragment 的作用与副作用，属原理深挖题。

**参考答案**：

> **一句话结论**：编译分 parse（模板 → AST）、transform（转换与静态分析、打 patchFlag）、codegen（生成 render 函数源码）三步；运行时 `render()` 返回 vnode 树，`patch` 首次把 vnode 挂载成真实 DOM、之后做 diff 更新。多根模板会被编译成 Fragment 包裹的多个子节点。

1. parse：把 template 字符串解析成 AST（元素、属性、指令、插值都在节点上）；transform：遍历 AST 执行内置转换（v-if/v-for/v-model 展开、静态提升、patchFlag 标记），也是自定义编译插件介入的地方；codegen：把 AST 拼成可执行代码字符串（含 `createElementVNode`、`toDisplayString` 等运行时调用）。
2. 谁来生成函数：完整版 vue（含编译器）在运行期用 `new Function` 得到渲染函数；SFC 由构建工具（`@vue/compiler-sfc` / Vite 插件）在编译期完成，生产运行时不需要带编译器，体积更小。
3. 运行时链路：`render()` → vnode 树（type/props/children/key 等描述对象）→ `patch` → 首次 `mountElement` 创建真实 DOM 并插入，后续 diff 后做最小化 DOM 操作。
4. 多根节点：Vue3 允许 template 有多个根，编译结果是一个 Fragment 类型的 vnode（`createFragment`），children 就是这些根节点；Vue2 受 vnode 结构限制只能单根。
5. 多根的副作用：属性继承失效——`inheritAttrs` 的默认行为依赖唯一根元素，多根时未声明的 attrs 不会自动落到某个根上，必须手动 `v-bind="$attrs"`；自定义指令在多根组件上使用也会告警。
6. 编译期优势：模板是静态可分析的，编译器能在编译时确定动态部分（patchFlag、Block），这正是"模板比手写 render 更容易优化"的原因。

```js
// 简化编译产物：多根模板 → Fragment
export function render(_ctx, _cache) {
  return (openBlock(), createElementBlock(Fragment, null, [
    createElementVNode('p', null, 'static'),                       // 被静态提升
    createElementVNode('span', null, toDisplayString(_ctx.msg), 1), // 1 = TEXT
  ]))
}
```

**追问与易错点**：

- 追问：为什么不推荐运行时编译？答：会把编译器（几十 KB 级）打进产物，而且每次渲染都要编译；生产环境一律用 SFC + 构建期预编译。
- 陷阱：以为 vnode 是"真实 DOM 的浅拷贝"。它是纯 JS 描述对象，真实 DOM 在 patch 之后才创建，`el` 字段是挂载后回填的引用。
- 追问：Fragment 怎么更新？答：它是"结构不稳定"的容器，编译器会标记为 `STABLE_FRAGMENT`/`KEYED_FRAGMENT`/`UNKEYED_FRAGMENT`，diff 时按标记走不同分支，而不是当成普通元素比较。

### Q20 编译优化里的静态提升、patchFlag、Block Tree 分别是什么？

**考察点**：考 Vue3 性能优势的来源，能不能讲清"从全量 diff 到靶向更新"的机制。

**参考答案**：

> **一句话结论**：三者共同把"每次更新全量 diff 整棵 vnode 树"变成"只访问动态节点、只比较被标记的字段"：静态提升省掉重复创建 vnode，patchFlag 告诉 diff 该比什么，Block Tree 把动态节点收进扁平数组，让更新成本与模板总大小解耦。

1. 静态提升（hoistStatic）：把不含动态绑定的 vnode（整棵静态子树）提升到 render 函数外部，只创建一次、后续复用同一引用；Vue 3.2+ 还能把"内容动态但属性静态"节点的静态 props 单独提升。
2. patchFlag：编译期给动态节点打上数字标记——TEXT=1、CLASS=2、STYLE=4、PROPS=8、FULL_PROPS=16、NEED_PATCH=512、KEYED_FRAGMENT=128 等；diff 时按标记只比较对应字段，不再遍历全部属性。
3. Block Tree：`createElementBlock` 会把本轮渲染中带 patchFlag 的动态节点收集到当前 block 的 `dynamicChildren` 数组（由 `openBlock`/`closeBlock` 管理），形成一个只含动态节点的扁平数组；更新时直接遍历它，完全跳过静态节点。
4. 结构不稳定的处理：v-if / v-for 会让分支结构变化，编译器把它们编译成新的 block，父 block 只记录"这里有一个动态分支"，由子 block 自己维护动态节点，保证不漏更新。
5. 效果：更新耗时不再正比于模板大小，而正比于动态绑定的数量；几千行静态内容的页面在更新时几乎不产生 vnode 比较开销。
6. 推论：模板能提供这些静态信息，所以官方不推荐无理由用 JSX/render 函数替代模板——那等于主动放弃编译优化的红利。

```js
const _hoisted_1 = createElementVNode('p', null, 'static')   // 只创建一次
function render(_ctx, _cache) {
  return (openBlock(), createElementBlock(Fragment, null, [
    _hoisted_1,
    createElementVNode('span', { class: _ctx.cls }, toDisplayString(_ctx.msg), 3),
  ]))                                                        // 3 = TEXT | CLASS
}
```

**追问与易错点**：

- 陷阱：把 patchFlag 说成"运行时判断出来的"。它是编译期产物，运行时只做位运算判断（`patchFlag & PatchFlags.CLASS`）。
- 追问：Block Tree 会不会漏更新？答：编译器保证结构不稳定的分支会开启新 block 并在父 block 中占位追踪，这也是 v-if 会在父 block 上产生 `NEED_PATCH` 标记的原因。
- 追问：静态提升会不会导致内容不更新？答：不会。能被提升的前提是"编译期即可确定该节点不含动态绑定"，真正会变的部分不会被提升。

### Q21 缓存事件处理、v-once、v-memo 分别解决什么问题？用的时候要注意什么？

**考察点**：考"手动细粒度优化"的手段与代价，以及它们和编译器自动优化的分工。

**参考答案**：

> **一句话结论**：都是为了减少不必要的创建或更新：`cacheHandlers` 让内联事件函数复用同一引用，`v-once` 让内容只渲染一次，`v-memo` 让依赖不变时整棵子树跳过更新。

1. 缓存事件处理（cacheHandlers）：`@click="() => count++"` 每次渲染都会生成新函数，导致子组件收到变化的 props 而重复更新；编译器开启缓存后生成 `_cache[0] || (_cache[0] = $event => ...)`，引用保持稳定。
2. `v-once`：首次渲染后缓存，之后依赖变化也不再更新；适合完全静态、与状态无关的区块（固定说明、版权信息）。注意它的子树里放响应式数据也不会再更新——这是最常见的误用。
3. `v-memo`（Vue 3.2+）：`v-memo="[dep1, dep2]"`，数组中所有依赖与上次相同时整棵子树跳过更新（含组件更新）；典型用法是配合 `v-for` 渲染长列表，只让变化的那几项重渲染。
4. `v-memo` 的代价：依赖数组要手写，漏写会"该更新却不更新"；只在确有性能瓶颈（超大列表、重子树）时使用，普通列表靠 key + patchFlag 已经足够。
5. 三者分工：静态提升与事件缓存是编译器自动做的，`v-once`/`v-memo` 是开发者显式声明的手动优化开关。
6. 与 `v-if` 的区别：`v-if` 决定节点"存不存在"（会销毁重建），`v-once`/`v-memo` 决定"要不要重新渲染"，两者可以组合。

```vue
<ul>
  <li v-for="item in list" :key="item.id" v-memo="[item.id === selected]">
    {{ item.name }} {{ item.id === selected ? '已选中' : '' }}
  </li>
</ul>
```

**追问与易错点**：

- 陷阱：给 `v-once` 的子树里放会变化的数据，然后抱怨"页面不更新"。`v-once` 的语义就是永不更新，不等于"静态提升"。
- 追问：`v-memo` 和 `key` 谁决定复用？答：`key` 决定新旧节点的对应关系（复用哪一个真实 DOM），`v-memo` 决定这棵子树本轮要不要重新渲染，作用层次不同。
- 追问：事件缓存由谁控制？答：编译器的 `cacheHandlers` 选项（默认开启），且只针对内联箭头函数/函数表达式；写成方法引用本来就稳定，不需要缓存。

### Q22 虚拟 DOM 和 diff 是怎么回事？key 到底起什么作用？为什么不能用 index 当 key？

**考察点**：考 diff 的基本前提（同层比较）、key 的作用，以及 Vue2 双端比较与 Vue3 方案的差异，是高频综合题。

**参考答案**：

> **一句话结论**：虚拟 DOM 是用 JS 对象描述视图，好处是跨平台与最小化 DOM 操作；diff 只做同层比较（type 不同直接重建），key 是"同一节点"的身份标识，决定节点被复用移动还是被销毁重建；Vue3 用"前后缀剥离 + 乱序区按 key 建索引 + 最长递增子序列"取代了 Vue2 的双端比较。

1. 同层比较：只比较同一层级，不跨层移动（跨层直接卸载重建），把复杂度从 O(n³) 降到 O(n)；type 或 key 不同就替换。
2. 无 key（unkeyed）：Vue3 先对齐公共前缀与公共后缀，中间部分"新多则挂载、旧多则卸载、否则按位置逐个 patch"，本质是按位置复用——这正是 index 当 key 会出错的原因。
3. 有 key（keyed）：剥离前后缀后，中间乱序区间先建立"新序列 key → index"的映射，再遍历旧节点匹配复用、卸载找不到的，最后用最长递增子序列决定哪些节点需要移动。
4. key 的作用：在同层同 type 的候选节点中标出"这是同一个逻辑节点"，让 diff 能跨位置复用真实 DOM（保留输入框焦点、组件内部状态、过渡状态）并减少创建销毁。
5. Vue2 与 Vue3 的差异：Vue2 是双端比较（旧头/旧尾/新头/新尾两两组合，再遍历 key 表）；Vue3 改为前后缀剥离 + 乱序区集中处理 + LIS，并借助编译期 patchFlag/Block 让很多场景根本不进入完整 diff。
6. index 当 key 的问题：列表头部插入/删除时 index 与内容错位，相同 index 的旧节点被复用却被写入新内容，出现"输入框内容串行""选中态错位""过渡动画异常"，而且所有节点都要更新、失去复用收益。列表会增删重排时必须用业务唯一 id。

```js
// sameVNodeType：类型相同且 key 相同才可能复用
const same = (a, b) => a.type === b.type && a.key === b.key
// 无 key 列表前插一项：所有节点按位置被 patch，内容整体改一遍
```

**追问与易错点**：

- 陷阱：说"key 是为了让 diff 更快"。key 首先保证"正确复用、避免状态错乱"，性能只是附带收益。
- 追问：什么时候可以用 index？答：列表纯静态展示、不会排序/增删/筛选，且没有内部状态（表单、动画、组件）时可以；一旦有交互就会出问题，不如统一用 id。
- 追问：用随机数或 uuid 当 key 会怎样？答：每次渲染 key 都变，节点永远被判定为新节点，复用全部失效，是性能灾难。
- 追问：数据没有唯一 id 怎么办？答：在数据进入前端时生成稳定 id 并附在数据上，而不是在模板里现算（现算等于每次都是新值）。

### Q23 Vue3 的 patchKeyedChildren 分哪五步？最长递增子序列是干什么的？

**考察点**：考带 key 的子节点 diff 完整流程，是 Vue3 diff 最深的追问点。

**参考答案**：

> **一句话结论**：带 key 的子节点 diff 走五步：头对齐、尾对齐、旧节点剩余则卸载、新节点剩余则挂载、中间乱序区间建立 key→index 映射完成复用与移动，并用最长递增子序列（Longest Increasing Subsequence, LIS）求出"相对顺序已正确的最长序列"，不在其中的节点才真正移动，从而把 DOM 移动次数降到最少。

1. 第一步（头对齐）：`i` 从 0 开始，新旧节点 `sameVNodeType` 就 patch 并 `i++`，遇到不匹配或越界停止；第二步（尾对齐）：从 `e1`、`e2` 两端向前同样处理。
2. 第三步：`i > e1 && i <= e2`（旧节点先耗尽）说明新序列中间都是新增，逐个挂载，锚点是新序列中后面已存在的节点。
3. 第四步：`i > e2`（新节点先耗尽）说明旧序列中间都是删除，逐个卸载。
4. 第五步（乱序区）：遍历新序列中间部分，用 key 建立 `keyToNewIndexMap`；再遍历旧序列中间部分，能在映射里找到且类型相同的就 patch，并把"新索引 → 旧索引 + 1"记录进 `newIndexToOldIndexMap`，找不到说明该旧节点被删除，直接卸载。
5. 最后一轮：对新序列中间部分从后往前遍历，`newIndexToOldIndexMap[i] === 0` 的是新增节点（挂载）；其余用 LIS（`getSequence`）算出不需要移动的索引集合，不在集合里的才执行 `insertBefore`。
6. 复杂度：整体 O(n)，LIS 部分 O(n log n)；LIS 的价值是把"要不要移动"从逐个试探变成最小移动次数的最优决策。

```js
const seq = getSequence(newIndexToOldIndexMap)  // 最长递增子序列（存索引）
let j = seq.length - 1
for (let i = toBePatched - 1; i >= 0; i--) {
  const nextIndex = s2 + i
  const nextChild = c2[nextIndex]
  const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor
  if (newIndexToOldIndexMap[i] === 0) patch(null, nextChild, container, anchor)
  else if (j < 0 || i !== seq[j]) hostInsert(nextChild.el, container, anchor) // 需移动
  else j--   // 命中 LIS，保持不动
}
```

**追问与易错点**：

- 陷阱：把 LIS 说成"最长公共子序列"。这里求的是原数组上的最长严格递增子序列，数组里存的是索引值。
- 追问：为什么最后一轮要从后往前遍历？答：移动节点时要保证锚点（后面的节点）已经就位，从后往前处理能避免反复挪动。
- 追问：为什么 `newIndexToOldIndexMap[i] === 0` 就代表新增？答：它记录的是"旧序列索引 + 1"，用 0 表示旧序列中不存在，正好与数组初始值为 0 一致。
- 陷阱：把这五步说成"双端比较"。双端比较是 Vue2 的方案，Vue3 的 keyed diff 是前后缀剥离 + 索引表 + LIS。

### Q24 组件更新粒度是怎样的？shouldUpdateComponent 做了什么？

**考察点**：考"组件级更新"这一 Vue 的核心特性，以及与 React 的对比。

**参考答案**：

> **一句话结论**：Vue3 的更新粒度是组件级：响应式依赖收集在"组件渲染 effect"上，谁用了数据谁才更新；父组件重渲染时不会无条件让子组件更新，而是由 `shouldUpdateComponent` 比较 props 与插槽来决定是否进入子组件的更新流程。

1. 依赖收集粒度：渲染组件时，render 读到哪些响应式属性，就把该组件的渲染 effect 收进这些属性的 dep，所以数据变化只精确通知相关组件。
2. 父组件重渲染时：父 render 会重建子组件 vnode，patch 到子组件前调用 `shouldUpdateComponent(prevVNode, nextVNode, optimized)`，比较 props 是否有变化、children（插槽）是否变化。
3. 优化分支：编译优化产出的 vnode 带 `dynamicProps`，`optimized` 为真时只比较这些动态 props，而不是遍历全部 props——这是模板编译与运行时配合的收益。
4. 若 props 与插槽都没变、也没有其他需要处理的标记，就跳过子组件的更新流程（不调用子组件的 update，直接复用 DOM），父组件的重渲染代价被限制在自己这一层。
5. 子组件自身数据变化由子组件自己的渲染 effect 触发，与父组件无关。也就是说"数据变了只更新一个组件"是 Vue 的默认行为，而不是需要手动 `shouldComponentUpdate` 换来的。
6. 更细的跳过手段：`v-once`/`v-memo` 在子树级别跳过；给父组件传稳定引用的 props（避免内联对象，内联事件交给编译器缓存）能减少无意义的子组件更新。

**追问与易错点**：

- 陷阱：把 Vue3 的更新粒度说成"虚拟 DOM 级"或"节点级"。默认是组件级（每个组件一个渲染 effect），细到字段级的是编译优化后按 patchFlag 的靶向更新。
- 追问：父组件重渲染会重新渲染所有子组件吗？答：不会。只有 props 或插槽变化的子组件才进入更新流程，没变化的部分连子组件 update 都不调用。
- 追问：为什么把内联对象或函数传给子组件容易引起子组件更新？答：每次渲染都是新引用，`shouldUpdateComponent` 会认为 props 变了（被编译器缓存的内联事件不在此列）。
- 追问：React 要 `memo` 才能避免子组件重渲染，Vue 为什么不用？答：Vue 按"谁用了数据"精确通知，父更新不自动带动子组件；React 是父组件函数重跑就重建整棵子树，需要浅比较拦截。

### Q25 v-if 和 v-for 放在同一个元素上哪个优先级高？为什么不建议一起用？

**考察点**：考 Vue2/Vue3 的优先级差异（破坏性变更）与正确写法。

**参考答案**：

> **一句话结论**：Vue2 中 `v-for` 优先级更高（先循环再逐个判断），Vue3 中改为 `v-if` 优先级更高（先判断再循环）；因此 Vue3 里 `v-if` 拿不到 `v-for` 的迭代变量，直接写会报"属性未定义"，正确做法是先用 computed 过滤数据。

1. 优先级差异：Vue2 编译时把 `v-for` 生成的循环放在外层；Vue3 把 `v-if` 放在外层，于是 `v-if="item.visible"` 中的 `item` 此时并不存在，运行时会警告渲染期间访问了未定义的属性。
2. 为什么不建议同用：Vue2 里每个 item 都要执行一次条件判断（哪怕大多被过滤掉），语义也混乱；Vue3 里则直接是错误写法的信号。
3. 正确姿势一：先过滤数据——`const visibleList = computed(() => list.value.filter(i => i.visible))`，再 `v-for` 渲染；computed 有缓存，不会每次渲染都重新过滤。
4. 正确姿势二：确实需要在循环里做条件渲染时，把 `v-if` 下沉到 `v-for` 内部的子元素上：`<template v-for="item in list" :key="item.id"><li v-if="item.visible">...</li></template>`，注意 `key` 放在 `template` 上。
5. 表达"整块列表要不要显示"时，应该写成两层：外层元素 `v-if` 控制列表存在，内层独立 `v-for`，而不是挤在同一个标签上。
6. 版本意识：这是 Vue2 → Vue3 的破坏性变更之一，升级项目时这类代码会直接暴露成报错或警告。

```vue
<!-- 不推荐：Vue3 中 v-if 优先，item 尚未定义 -->
<li v-for="item in list" v-if="item.visible">{{ item.name }}</li>

<!-- 推荐：computed 先过滤，再 v-for -->
<li v-for="item in visibleList" :key="item.id">{{ item.name }}</li>
```

**追问与易错点**：

- 陷阱：只答"Vue3 里 v-if 优先"就停下。要补一句"这正好与 Vue2 相反，所以升级项目时这类代码会报错"，这才是面试官想听的完整答案。
- 追问：`<template v-for>` 里放 `v-if` 可以吗？答：可以，能访问到 item，但本质仍是"先渲染再判断"，数据量大时不如 computed 过滤。
- 追问：computed 过滤会不会有性能问题？答：不会，它只在依赖变化时重算一次，比模板里每次渲染都 `filter` 更好。

### Q26 模板里怎么拿 DOM 和组件实例？v-for 里的 ref 怎么收集？

**考察点**：考 ref 的声明方式与可用时机，以及 v-for 中 ref 数组的顺序陷阱，属于实战易错题。

**参考答案**：

> **一句话结论**：组合式 API 用 `const el = ref(null)` 配合模板上的 `ref="el"`（Vue 3.5+ 更推荐 `useTemplateRef('el')`），值在挂载后才有；`v-for` 里的同名字符串 ref 会收集成数组但顺序不保证，需要精确对应时用函数式 ref。

1. 基本用法：模板写 `ref="inputEl"`，setup 中声明同名 `const inputEl = ref(null)`；首次渲染挂载前是 null，只能在 `onMounted` 或 `nextTick` 之后访问，被 `v-if` 隐藏时会重新置为 null。
2. `useTemplateRef`（Vue 3.5+）：`const input = useTemplateRef('input')`，模板仍写 `ref="input"`，返回的是 shallowRef；好处是变量名不必与 ref 名相同、不会被深度代理、类型推导更准确。
3. 组件 ref：拿到的是组件实例代理，受 expose 影响——选项式 API 子组件默认暴露全部实例属性，`<script setup>` 子组件默认闭合，必须 `defineExpose` 才能访问。
4. `v-for` 中的 ref：同名 ref 会收集成数组（Vue2 是 `$refs.x` 数组），但官方明确不保证顺序与源数组一致，所以不要用下标去对应元素。
5. 推荐用函数式 ref：`<li v-for="(item, i) in list" :ref="(el) => setItemRef(el, i)">`；注意每次更新都会调用（可能先传 null 再传元素），必须处理 null 分支。
6. 清理：列表项被移除时对应回调会收到 null，记得清空数组，避免残留 DOM 引用造成内存泄漏。

```js
const itemRefs = ref([])
const setItemRef = (el, i) => { if (el) itemRefs.value[i] = el }   // 忽略 null
onMounted(() => itemRefs.value[0]?.focus())
```

**追问与易错点**：

- 陷阱：在 setup 顶层直接 `inputEl.value.focus()`。此时还没挂载，`inputEl.value` 是 null。
- 追问：为什么 `v-for` 的字符串 ref 顺序不保证？答：挂载/更新顺序由 patch 过程决定（带 key 的复用与移动会打乱它），与源数组顺序并不必然一致，官方因此不建议依赖。
- 追问：`useTemplateRef` 和普通 `ref` 的区别？答：前者专用于读取模板引用，内部是 shallowRef、不需要手动与 ref 名对齐；后者是通用响应式容器。两者都必须在挂载后使用。

### Q27 常见的响应式失效（数据变了页面不更新）有哪些场景？怎么修？

**考察点**：考"代理链路断了"这一根因，是排障能力题，几乎每次面试都会被问到。

**参考答案**：

> **一句话结论**：绝大多数响应式失效都源于"响应式对象被复制、解构或整体替换，代理链路断掉"；高频场景是解构 props/reactive、整体替换 reactive、把属性值赋给普通变量，以及用了 shallowRef/markRaw 后原地改深层。

1. 解构：`const { count } = reactive({ count: 0 })`、`const { title } = props` 拿到的都是快照值，源变它不变。修：`toRefs`/`toRef`/`computed(() => props.title)`；`<script setup>` 中 Vue 3.5+ 解构 props 会被编译器保持响应式。
2. 整体替换 reactive：`let state = reactive({ a: 1 }); state = { a: 2 }` 之后变量指向普通对象，而模板仍持有旧代理。修：改用 `ref`（`state.value = {...}`），或用 `Object.assign(state, newVal)` 保留同一个代理。
3. 把属性值赋给普通变量：`const n = state.count`（基本类型是拷贝）；`let obj = state.user` 之后再给 `obj` 换对象，同样断链。修：保持引用或直接操作源对象。
4. 浅层 API 的深层修改：`shallowRef`/`shallowReactive` 改深层不会触发。修：整体替换 `.value`，或 `triggerRef` 手动触发。
5. `markRaw` 与第三方实例：被标记的对象永远不会被代理，修改不触发更新，这是刻意行为；需要更新时用外层 ref 承载"版本号"或整体替换。
6. 排查口诀："这个变量还是原来那个代理吗？"——先确认引用链，再考虑是不是 nextTick/时机问题。

```js
let state = reactive({ count: 0 })
const n = state.count                      // 拷贝，永远是 0
const countRef = toRef(state, 'count')     // 正确：保持连接
state = { count: 1 }                       // 错误：代理断链
Object.assign(state, { count: 1 })         // 正确：保留同一代理
```

**追问与易错点**：

- 陷阱：把"数据没更新"一律归因于 nextTick。先确认引用链，再考虑时机。
- 追问：Vue3 里 `arr[0] = x`、`arr.length = 0`、`obj.newKey = 1` 会更新吗？答：会，Proxy 拦截了这些操作，新增/删除属性也不再需要 `$set`，这是与 Vue2 的重要区别。
- 追问：`ref` 包一个已经是 reactive 的对象会二次代理吗？答：不会。`reactive` 对已经是代理的对象直接返回同一个代理，所以 `ref(reactiveObj).value` 就是原代理。
- 陷阱：解构后觉得"类型还是对象就没问题"。响应式与类型无关，取决于是否还持有代理引用。

### Q28 defineAsyncComponent 和 Suspense 分别用来做什么？

**考察点**：考异步组件与"等待异步依赖"的分工，以及 Suspense 的定位与现状。

**参考答案**：

> **一句话结论**：`defineAsyncComponent` 把组件变成按需异步加载（代码分割 + loading/error 兜底），Suspense 负责"等一组异步依赖全部就绪再显示默认内容、期间显示 fallback"，两者经常配合使用。

1. `defineAsyncComponent` 用法：`defineAsyncComponent(() => import('./Heavy.vue'))` 返回一个包装组件，支持 `loadingComponent`、`errorComponent`、`delay`（默认 200ms 才显示 loading，避免闪烁）、`timeout`、`suspensible: false`（不交给 Suspense 接管）。
2. 与"直接 `() => import()`"的区别：裸写不提供 loading/error/超时控制，官方推荐用 `defineAsyncComponent` 包裹以获得完整行为，且每个实例的状态独立。
3. Suspense 有两个插槽：`#default` 与 `#fallback`；默认插槽里的异步依赖（async setup、异步组件、嵌套 Suspense）全部解析完成后才替换 fallback，并抛出 `@pending`、`@resolve`、`@fallback` 事件。
4. async setup：`<script setup>` 顶层 `await` 会让组件变成异步组件，必须被 Suspense 包裹才能渲染（否则会警告 async setup 没有 Suspense）。
5. 现状提醒：Suspense 目前仍被官方标注为实验性（experimental）API，行为可能变化；生产环境更常见的替代是"父级 loading 状态 + 异步组件自带的 loadingComponent"。
6. 错误处理：异步组件加载失败走 `errorComponent` 或全局 `app.config.errorHandler`；async setup 中抛错可在父组件用 `onErrorCaptured` 捕获。

```js
const Heavy = defineAsyncComponent({
  loader: () => import('./Heavy.vue'),
  loadingComponent: Loading,
  errorComponent: LoadError,
  delay: 200,
  timeout: 5000,
})
```

**追问与易错点**：

- 陷阱：以为 Suspense 会"并发编排请求"。它只负责等待默认插槽内的异步依赖，不做请求合并、去重或取消。
- 追问：Suspense 能嵌套吗？答：可以，外层会等内层解析完成；但嵌套过深会让 fallback 的显示时机难以预测，尽量控制层次。
- 追问：`delay` 有什么用？答：给快速加载的组件一个延迟阈值，避免 loading 一闪而过造成页面抖动。

### Q29 Teleport 是干什么的？有哪些使用要点？

**考察点**：考"DOM 位置变化但组件树不变"这一关键语义，以及弹窗类问题的解决思路。

**参考答案**：

> **一句话结论**：Teleport 把组件模板中的一部分 DOM "传送"到指定容器（如 body）下渲染，解决弹窗、下拉、通知被父级 `overflow: hidden`、`transform`、`z-index` 或定位上下文裁剪遮挡的问题；逻辑上它仍是当前组件的子节点。

1. 语法：`<Teleport to="body"> ... </Teleport>`，`to` 接受 CSS 选择器或 DOM 元素；`:disabled="true"` 可临时取消传送、原地渲染（响应式布局下小屏不传送的场景常用）。
2. 逻辑关系不变：被传送的内容仍属于当前组件——provide/inject 正常、props/状态/生命周期照旧、事件处理函数依然在组件上下文里执行；变的只是 DOM 树中的位置。
3. 典型场景：全屏弹窗、tooltip/popover、全局 message 通知、被表格 `overflow` 裁切的下拉面板。
4. 顺序问题：同一目标被多次 Teleport 时会按挂载顺序依次 append，后挂载的在后面（视觉上可能被前者遮挡，可用不同容器或容器内 z-index 控制叠放）。
5. 与 `v-if` 组合：常见写法是 Teleport 外层、内容用 `v-if`，卸载时目标容器内的节点一起移除；`to` 指向的元素在挂载时必须存在。
6. 与"手动 `document.body.appendChild`"的差异：Teleport 由 Vue 统一管理挂载、更新、卸载与顺序，不会出现僵尸节点，也保留了响应式与组件上下文。

```vue
<Teleport to="body" :disabled="isMobile">
  <div v-if="visible" class="modal">
    <slot />
  </div>
</Teleport>
```

**追问与易错点**：

- 陷阱：以为 Teleport 之后组件关系也变了（例如 provide/inject 会失效）。只有 DOM 位置变了，组件树没有变。
- 追问：Teleport 和 `v-if` 谁放外层？答：内容需要频繁开关时用"Teleport 在外、内容 v-if"，容器只挂一次；需要连容器一起卸载时把 v-if 放外层。
- 追问：SSR 下 Teleport 有什么注意点？答：服务端渲染时传送目标可能还不存在，容易出现注水不一致，需要保证目标容器在 SSR 与客户端都存在，或改为客户端渲染。

### Q30 自定义指令的生命周期有哪些？它和组件、组合式函数怎么取舍？

**考察点**：考指令钩子的 Vue2 → Vue3 映射与适用边界，属于"用过没"的辨别题。

**参考答案**：

> **一句话结论**：Vue3 的指令钩子为 `created`/`beforeMount`/`mounted`/`beforeUpdate`/`updated`/`beforeUnmount`/`unmounted`（对应 Vue2 的 bind/inserted/update/componentUpdated/unbind），用于封装"必须直接操作 DOM"的可复用逻辑；能用组件或组合式函数表达的需求优先不用指令。

1. 钩子映射：`bind` → `beforeMount`（只调一次，可设置属性与事件）、`inserted` → `mounted`（元素已插入父节点）、`update` → **移除**（改用 `updated`）、`componentUpdated` → `updated`、`unbind` → `unmounted`；并新增 `created`、`beforeUpdate`、`beforeUnmount`。
2. 钩子参数：`(el, binding, vnode, prevVNode)`；`binding` 含 `value`（表达式的值）、`oldValue`、`arg`（`v-dir:arg` 的 arg）、`modifiers`（`v-dir.foo`）、`instance`（使用该指令的组件实例）。
3. 简写形式：`app.directive('focus', (el) => el.focus())` 等价于只写 `mounted` 与 `updated`；局部注册在 `<script setup>` 里用 `const vFocus = {...}`（`v` 前缀命名会被识别为指令）。
4. 适用场景：自动聚焦、权限控制隐藏元素、点击外部关闭、拖拽、图片懒加载、复制到剪贴板等纯 DOM 行为。
5. 取舍原则：要改变结构、承载状态、复用模板用组件；要复用有状态的逻辑用组合式函数；只有"必须拿到真实 DOM 做命令式操作"时才用指令。
6. 注意：指令作用于单个根元素，多根组件上使用会告警；`binding.value` 的变化不会自动深比较，复杂判断要在 `updated` 里自己处理。

```js
app.directive('click-outside', {
  mounted(el, binding) {
    el.__handler = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el.__handler)
  },
  unmounted(el) { document.removeEventListener('click', el.__handler) },
})
```

**追问与易错点**：

- 陷阱：在 `beforeMount` 里就想访问 el 的父节点或测量尺寸。此时元素还没插入文档，结果不可靠，应该用 `mounted`。
- 追问：为什么必须自己清理监听？答：指令没有自动清理机制，不在 `unmounted` 里移除会随组件销毁造成泄漏（绑定到 document/window 时尤其明显）。
- 追问：指令能替代组件吗？答：不能。指令不产生组件实例、没有自己的模板与状态，适合行为注入而不是视图复用。

### Q31 Vue3 里 mixins 和组合式函数怎么选？为什么不再推荐 mixins？

**考察点**：考逻辑复用方案的演进动机，以及组合式函数的约定与坑。

**参考答案**：

> **一句话结论**：mixins 的复用方式是"把选项合并进组件"，带来命名冲突、来源不明、隐式依赖和 `this` 耦合；组合式函数（composable，`useXxx`）通过显式入参和显式返回值复用逻辑，来源清晰、可组合、可 tree-shaking、类型友好，是新代码的默认选择。

1. mixins 的问题：同名 data/methods 后者覆盖前者且没有明确提示；一份 mixin 隐式要求组件提供某些 data/methods；`this` 上堆满属性，删除 mixin 时不知道哪些代码会崩；逻辑按"选项类型"被横向切开，一个功能的代码散落在 data、methods、created 各处。
2. 组合式函数的样子：`function useCounter(initial = 0) { const count = ref(initial); const inc = () => count.value++; return { count, inc } }`，调用方按需解构并可重命名，依赖通过参数传入、通过返回值暴露。
3. 优点：命名空间天然隔离（解构时重命名即可）、依赖显式、按功能内聚、可嵌套组合（`useA` 内部调用 `useB`）、支持 tree-shaking 与类型推导。
4. 约定：以 `use` 开头；必须在 `setup` 的同步阶段调用（依赖组件实例上下文）；内部副作用要提供停止/清理能力（`watch` 返回值、`onScopeDispose`）。
5. Vue3 仍保留 mixins（含全局 `app.mixin`）以兼容旧代码，但全局 mixin 会污染所有组件实例，尤其危险；官方文档把组合式 API 作为推荐的复用方案。
6. 迁移建议：把 mixin 按"功能"拆成若干 `useXxx`，状态由调用方持有或由 composable 用 ref 持有并返回，逐步替换而不是一次性大改。

```js
// useCounter.js
export function useCounter(initial = 0) {
  const count = ref(initial)
  const inc = () => count.value++
  onScopeDispose(() => { /* 清理定时器、订阅等 */ })
  return { count, inc }
}
// 组件内：可重命名，天然避免冲突
const { count: num, inc } = useCounter(10)
```

**追问与易错点**：

- 陷阱：把组合式函数写成"模块级单例状态"（顶层 `const count = ref(0)` 再 return）。这样所有组件共享同一份状态，SSR 下还会跨请求串数据；要共享就用 Pinia 或提供明确的工厂 + provide/inject。
- 追问：mixin 的生命周期合并顺序？答：mixin 的钩子先执行、组件的同钩子后执行；组合式函数里直接在 setup 中按代码顺序调用 `onMounted`，顺序更可控。
- 追问：组合式函数和普通工具函数有什么区别？答：组合式函数内部使用响应式 API 与组件上下文（生命周期、inject），必须在 setup 中调用并返回响应式状态；纯工具函数不依赖上下文。
- 追问：为什么组合式函数更利于 tree-shaking？答：它是普通函数导出，没被 import 就不会进包；mixin 只能注册，无法按需摇掉。

### Q32 Vue3 里怎么做全局错误捕获？

**考察点**：考错误捕获的层次与边界（哪些错误 Vue 接不住），是工程化高频题。

**参考答案**：

> **一句话结论**：组件内用 `onErrorCaptured` 捕获后代错误并可阻止继续冒泡，应用级用 `app.config.errorHandler` 做兜底上报；但 Vue 上下文之外的错误（定时器、原生事件、未处理的 Promise 拒绝）它接不住，要配合 window 的 error/unhandledrejection。

1. `onErrorCaptured(err, instance, info)`：捕获后代组件在渲染、生命周期、事件处理、watch 回调中抛出的错误；返回 `false` 表示错误已处理，停止继续向上传播（不再触发上层 errorCaptured 与全局 errorHandler）。
2. `app.config.errorHandler = (err, instance, info) => {}`：全局最后一道防线，`info` 会标明错误来源类别（渲染、生命周期、事件处理等），适合接入 Sentry 之类的上报。
3. 漏网之鱼：`setTimeout`/`setInterval` 回调里的异常、原生 `addEventListener` 回调、未 catch 的 Promise 拒绝都不会经过 Vue，需要 `window.addEventListener('error')` 与 `'unhandledrejection'` 兜底。
4. 异步组件相关：加载失败走 `defineAsyncComponent` 的 `errorComponent` 或全局 errorHandler；async setup 抛错可在父组件用 `onErrorCaptured` 捕获（配合 Suspense）。
5. 开发与生产的差异：开发环境 Vue 会打印完整警告与堆栈，生产环境默认只输出一次精简错误（避免重复打印与体积开销），所以必须自己做上报，不能依赖控制台。
6. 实践组合：全局 errorHandler 负责上报，局部 `onErrorCaptured` 负责降级 UI（某个区块渲染失败不影响整页），window 级监听补齐非 Vue 环境。

```js
app.config.errorHandler = (err, instance, info) => {
  report(err, { info, component: instance?.$options?.name })
}
onErrorCaptured((err) => { state.failed = true; return false })  // 局部降级
window.addEventListener('unhandledrejection', (e) => report(e.reason))
```

**追问与易错点**：

- 陷阱：以为配了 errorHandler 就"什么都能拦"。定时器与原生事件里的错误根本不经过 Vue，必须有 window 级监听。
- 追问：返回 `false` 和不返回有什么区别？答：返回 `false` 表示已处理、停止向上传播；不返回则继续冒泡，最终交给全局 errorHandler。
- 追问：`try/catch` 能替代 `onErrorCaptured` 吗？答：局部同步逻辑可以；模板渲染与生命周期由 Vue 调用你的代码，只有 errorCaptured/errorHandler 能接住。
- 陷阱：把 `warnHandler` 与 `errorHandler` 混为一谈。`warnHandler` 只处理开发期警告（如 props 校验失败），生产环境不生效。

### Q33 markRaw 和 effectScope 分别解决什么问题？

**考察点**：考两个偏进阶 API 的实际用途，以及"副作用生命周期管理"的意识。

**参考答案**：

> **一句话结论**：`markRaw` 让某个对象永远不被转成响应式（跳过无意义的代理开销、保护第三方实例）；`effectScope` 提供一个可整体停止的副作用作用域，用来批量管理组件之外的 watch/computed/effect，避免泄漏。

1. `markRaw(obj)`：给对象打上"跳过响应式"的标记（不可逆），之后 `reactive(obj)` 或把它放进响应式对象里都不会被代理；常用于地图/图表实例、类实例、复杂不可变数据、常量字典。
2. 为什么需要它：给第三方库实例套 Proxy 会带来性能损耗，而且库内部常用 `this` 比较引用（内部缓存、`map.get(this)`），代理对象身份不同可能导致诡异 bug。
3. 边界：`markRaw` 只标记"这个对象本身不要被代理"，不阻止你修改它，只是修改不会再触发更新；如果要控制的是"顶层是否响应"，用 `shallowRef`/`shallowReactive` 更贴切。
4. `effectScope()`：创建一个作用域，在其内部创建的 `computed`、`watch`、`watchEffect`、`effect` 会被自动收集；调用 `scope.stop()` 一次性停止全部，也可用 `onScopeDispose(fn)` 注册清理回调。
5. 使用场景：在组件之外创建副作用（全局 store、自定义库、插件）时需要显式管理生命周期。组件的 `setup` 本身就是一个 effectScope，所以组件内注册的 watch 会随卸载自动停止，不必手动 stop。
6. `effectScope(true)` 创建游离（detached）作用域，不会被父作用域停止，适合需要独立生命周期的全局逻辑；`getCurrentScope()` 可获取当前作用域。

```js
const chart = markRaw(echarts.init(el))   // 永不被代理
const scope = effectScope()
scope.run(() => {
  watch(source, handler)                  // 由 scope 统一管理
  onScopeDispose(() => clearInterval(timer))
})
scope.stop()                              // 一次停掉全部副作用
```

**追问与易错点**：

- 陷阱：以为 `markRaw` 是"冻结"。它只是声明不要代理该对象，不禁止修改，只是修改不会触发更新（因为压根没被追踪）。
- 追问：`markRaw` 的对象放进 `reactive` 会怎样？答：该属性值原样保留、不被转换，改它视图不会更新；需要更新时整体替换外层引用，或用另一个响应式字段当"版本号"来触发。
- 追问：组件卸载时 watchEffect 会自动停吗？答：会。setup 期间创建的副作用属于该组件的 effectScope，卸载时统一 stop；只有把 stop 函数带到组件外（如挂到全局变量）才可能泄漏。
- 追问：全局单例 store 里需要 effectScope 吗？答：需要。全局单例不随任何组件卸载，副作用必须显式 stop（Pinia 内部就是用 effectScope 管理每个 store 的）。

### Q34 SSR 场景下使用响应式要注意什么？

**考察点**：考服务端渲染与浏览器端响应式机制的差异，是区分"只写 SPA"与"懂同构"的题。

**参考答案**：

> **一句话结论**：服务端渲染是同步且一次性的：渲染成字符串后即结束，不存在"数据变了重新渲染"；因此数据必须在渲染前就绪，且绝不能把响应式状态放在模块顶层，否则多个请求会共享同一份状态造成串数据。

1. 同步渲染：`@vue/server-renderer` 同步执行组件 render 并产出 HTML 字符串，没有浏览器端的队列与微任务调度；数据获取要放在渲染前（`onServerPrefetch`，或 setup 顶层 `await` 配合 Suspense）。
2. 跨请求状态污染：`export const store = reactive({ user: null })` 这类模块级单例在 Node 进程中只加载一次，会跨请求共享，A 用户的数据可能渲染进 B 用户的页面；正确做法是导出工厂函数（`createStore()`）在 setup 里调用，Pinia 就是这么做的。
3. 无浏览器 API：setup 里不能直接用 `window`/`document`/`localStorage`；服务端只会执行 `setup`（承担 beforeCreate/created）与 `onServerPrefetch`，`onBeforeMount`/`onMounted` 及之后的钩子都不会执行。
4. 依赖收集不必要：服务端渲染完就丢弃，不需要长期追踪依赖；不要在 SSR 期间创建定时器或长期 watch，这类副作用要保证只在客户端执行（放 `onMounted`，或用 `import.meta.env.SSR` 判断分支）。
5. 注水（hydration）一致性：服务端与客户端首次渲染结果必须一致，否则出现 hydration mismatch 警告并可能退化为整块客户端渲染；常见坑是模板里用 `Date.now()`、`Math.random()`、读取 `localStorage` 或即时判断语言。
6. 状态传递：服务端预取的数据要序列化后传给客户端（如把 store state 挂到 `window.__INITIAL_STATE__` 并让客户端用它初始化），避免二次请求与首屏不一致。

```js
// 错误：模块级单例，多个请求共享同一份状态
export const store = reactive({ user: null })
// 正确：工厂函数，每个请求一份
export function createStore() { return reactive({ user: null }) }

export default {
  async serverPrefetch() {          // SSR 期间预取数据
    this.data = await fetchData()
  },
}
```

**追问与易错点**：

- 陷阱：说"SSR 也用响应式，数据变了页面会自动更新"。服务端渲染是一次性字符串输出，响应式只服务于"渲染时读取数据"，不存在更新循环。
- 追问：为什么 `onMounted` 在服务端不执行？答：服务端没有真实 DOM，也没有挂载过程，Vue 在 SSR 中只调用 setup 与 onServerPrefetch 这类钩子。
- 追问：SSR 和 SPA 怎么选？答：SSR 换来更快的首屏内容与更好的 SEO，代价是服务端压力、注水一致性与状态隔离的额外维护成本；纯后台系统用 SPA 或预渲染更划算。

## 本章小结

- Vue3 的三大变化是 Proxy 响应式、组合式 API 与编译期优化；破坏性变更集中在 v-model 语义、filters 移除、事件 API 移除、destroy 钩子改名与不支持 IE11。
- 全局能力从 Vue 构造函数搬到 createApp 实例上，多应用互不污染，未使用的 API 可被 tree-shaking；`$set` 因 Proxy 而消失。
- ref 装任意类型并靠 .value 追踪，reactive 只装对象且解构、整体替换都会断链；统一用 ref 加 toRef/toRefs 是更稳的工程习惯。
- 响应式内核是 activeEffect + targetMap：读取时 track 收集、写入时 trigger 执行或调用 scheduler；组件渲染本身就是一个 effect，所以更新被 queueJob 异步批量处理。
- computed 靠 dirty 标记实现惰性缓存，watch/watchEffect 负责副作用；flush 的 pre/post/sync 决定回调在队列中的位置，post 与 await nextTick() 等效。
- 组件级更新粒度加 shouldUpdateComponent 的 props/插槽比较，让"父组件更新不必然带动子组件"；编译优化把节点更新进一步收窄到 patchFlag 指向的字段。
- diff 只做同层比较，key 决定复用与移动的正确性；带 key 列表走"前后缀剥离 + key 索引表 + 最长递增子序列"，业务列表必须用唯一 id 而不是 index。
- 高频翻车点集中在响应式失效（解构、整体替换、浅层 API）与 SSR 的模块级单例，排查口诀是"这个变量还是原来那个代理吗、这份状态是不是被多个请求共享了"。

<!-- COUNT: 34 -->
