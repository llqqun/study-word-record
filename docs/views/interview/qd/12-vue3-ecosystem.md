---
title: "第 12 章 Vue3 生态与工程实战"
---

## 第 12 章 Vue3 生态与工程实战

### Q1 Vue3 里组件之间到底有哪几种通信方式？你实际项目里怎么选？

**考察点**：考的是"有没有体系"，能不能按组件关系远近分层回答，而不是零散报菜名。

**参考答案**：

> **一句话结论**：父子用 `props` / `emit`（`v-model` 是其语法糖），跨层级用 `provide` / `inject`，任意组件用 Pinia，需要命令式调用子组件方法才用 `ref` + `defineExpose`；`$parent` 和全局事件总线在 Vue3 里只能兜底。

1. 父传子用 `props`：Vue3 中 `props` 是只读的，子组件直接改会告警并破坏单向数据流，要改必须 `emit` 回父组件。
2. 子传父用 `emit` 自定义事件，父组件写 `@事件名`；`v-model` 就是 `:modelValue` + `@update:modelValue` 的语法糖。
3. 跨层级用 `provide` / `inject`：适合主题、表单上下文、国际化这类"祖先提供、后代消费"的场景，代价是依赖关系隐式，排查来源费劲。
4. 无关系组件用 Pinia 集中式状态，可调试、可持久化、对 SSR 友好，是 Vue3 推荐的跨组件方案。
5. 属性透传用 `$attrs`：Vue3 把 `$listeners` 合并进 `$attrs`，未声明的属性与事件监听器默认自动落到根元素上。
6. 命令式通信用模板 `ref` + `defineExpose` 暴露方法；`$parent` 能拿到父实例，但强耦合，只在个别场景兜底。

| 关系 | 首选方案 | 代价 |
| --- | --- | --- |
| 父 ↔ 子 | `props` / `emit` / `v-model` | 逐层传递，层级深时啰嗦 |
| 跨层级 | `provide` / `inject` | 隐式依赖，来源难追 |
| 任意组件 | Pinia | 引入全局状态，要管好边界 |
| 命令式调用 | `ref` + `defineExpose` | 破坏数据流，耦合高 |

**追问与易错点**：

- 追问：`v-model` 能绑多个吗？答：能，Vue3 支持 `v-model:title="x"`，子组件声明 `title` 这个 `prop` 并 `emit('update:title')`。
- 追问：为什么不推荐 `$parent`？答：拿到的是内部实例，父组件改结构就崩，且被调方法无法被类型系统约束。
- 陷阱：把普通对象直接 `provide` 出去当响应式用，后代永远不更新，必须包 `ref` / `reactive` 或用 `computed`。

### Q2 props 的写法与校验有哪些讲究？为什么要强调单向数据流？

**考察点**：基础功。考 `props` 声明方式、默认值陷阱、以及"为什么不能改 `props`"。

**参考答案**：

> **一句话结论**：`props` 是父组件传给子组件的只读输入，Vue3 支持运行时声明与类型声明两种写法；对象和数组的默认值必须用工厂函数，子组件永远不要直接改 `props`。

1. 运行时声明：`defineProps({ title: { type: String, required: true, default: '' } })`；类型声明：`defineProps<{ title: string }>()`，配 `withDefaults` 给默认值。
2. 对象 / 数组类型默认值必须写成工厂函数 `default: () => ({})`，否则所有实例共享同一个引用，会出现"改一个全变"的诡异 bug。
3. `Boolean` 类型有特殊行为：传 `disabled` 等价于 `disabled="true"`，所以 `type: Boolean` 的默认值应为 `false` 而不是 `true`。
4. 单向数据流的意义是可预测：数据流只有一条从父到子的链路，出问题只往上找源头，若子组件可随意改就会破坏可维护性。
5. 确实需要"改"时，正确姿势是 `emit` 让父组件改，或在子组件内用 `computed` 的 `get` / `set` 做代理层。

```js
const props = defineProps({ count: { type: Number, default: 0 } })
const emit = defineEmits(['update:count'])
const inner = computed({
  get: () => props.count,
  set: (v) => emit('update:count', v)
})
```

**追问与易错点**：

- 追问：`props` 可以解构吗？答：Vue3.5 之前解构会丢响应式，要用 `toRefs` 或 `props.xxx`；3.5 起响应式解构已支持。
- 陷阱：直接给 `props` 赋值（`props.count = 1`）在开发环境会告警，生产环境静默失效，排查时最容易被忽略。
- 陷阱：把 `props` 里的对象直接当本地状态改，等于改了父组件的数据源。

### Q3 Vue3 的 `v-model` 和 Vue2 有什么区别？怎么封装一个带自定义修饰符的组件？

**考察点**：版本差异题，考是否清楚 `model` 选项被废弃、多 `v-model`、修饰符自定义这一整条链路。

**参考答案**：

> **一句话结论**：Vue3 把 `v-model` 从"`value` + `input` + `model` 选项"改成"`modelValue` + `update:modelValue`"，删掉了 `model` 选项，并原生支持多个 `v-model` 和自定义修饰符。

1. 默认约定变了：Vue2 文本框用 `value` / `input`、复选框用 `checked` / `change`；Vue3 统一为 `modelValue` / `update:modelValue`，`model` 配置项被移除。
2. 支持多个 `v-model`：`<Child v-model:title="t" v-model:body="b" />`，等价于分别传 `title`、`body` 两个 `prop` 并向父组件 `emit('update:title')`、`emit('update:body')`。
3. 自定义修饰符：子组件通过 `props.modelModifiers`（对应 `v-model:xxx` 时是 `xxxModifiers`）拿到修饰符对象，自己实现语义。
4. 常见需求如 `v-model.trim`、`v-model.number` 内置支持；像 `v-model:date.capitalize` 这种业务修饰符要自己写。
5. `.sync` 修饰符被删除，用 `v-model:xxx` 替代，迁移时把 `:foo.sync` 与 `@update:foo` 全部改写。

```js
// 子组件
const props = defineProps(['modelValue', 'modelModifiers'])
const emit = defineEmits(['update:modelValue'])
function onInput(e) {
  let v = e.target.value
  if (props.modelModifiers?.capitalize) v = v.toUpperCase()
  emit('update:modelValue', v)
}
```

**追问与易错点**：

- 追问：原生元素上还能用 `v-model` 吗？答：能，`<input v-model="x">` 依然编译成 `:value` + `@input`，只是自定义组件上的默认名换成了 `modelValue`。
- 陷阱：迁移时只改了组件内部，父组件还在用 `value` / `input`，表现是"能显示但改不动"。
- 陷阱：以为 `v-model` 传下来的一定是响应式对象，实际上它就是 `prop` + 事件，值本身可能是基本类型。

### Q4 `provide` / `inject` 怎么保持响应式？默认值和 `InjectionKey` 怎么用？

**考察点**：进阶。考响应式传递、`readonly` 保护、默认值陷阱与 TS 配合。

**参考答案**：

> **一句话结论**：响应式靠"提供方给的是 `ref` / `reactive` 本身"来保证，不是 `provide` 自带的能力；后代改数据要显式给方法，`readonly` 能防止随意修改。

1. `provide('key', someRef)` 传的是引用，后代 `inject` 到的还是同一个 `ref`，所以天然响应式；若传的是 `someRef.value`（普通值）就断了响应。
2. 不要把整个 `store` 或大对象裸 `provide` 出去，推荐 `provide` 一个 `readonly(state)` 加若干操作函数，形成"数据只读、行为受控"的接口。
3. 默认值是第二个参数：`inject('theme', 'light')`，注意它不做类型收窄，TS 下用 `InjectionKey<T>`（`Symbol` 类型）才能自动推断类型。
4. 应用级注入：`app.provide('key', val)`，全局可用，适合配置、日志、i18n 实例。
5. `inject` 只能在 `setup` 或函数式写法中同步调用，放到 `await` 之后会拿不到当前实例。

```ts
import type { InjectionKey, Ref } from 'vue'
export const themeKey: InjectionKey<Ref<string>> = Symbol('theme')
// 祖先
provide(themeKey, ref('light'))
// 后代
const theme = inject(themeKey, ref('light')) // 类型自动为 Ref<string>
```

**追问与易错点**：

- 追问：为什么默认值不写会拿到 `undefined`？答：`inject` 找不到时返回 `undefined` 且不报错，要么给默认值，要么在封装里主动抛错暴露配置缺失。
- 陷阱：在子组件里直接 `inject` 到的 `reactive` 对象上加字段，会导致响应式丢失（Vue3 对新增属性支持，但 `readonly` 包装后会报错）。
- 陷阱：用字符串作为 key 时同名冲突难查，团队规范应统一用 `Symbol` 常量并集中导出。

### Q5 Vue3 里 `$listeners` 去哪了？`$attrs` 和 `inheritAttrs` 怎么配合？

**考察点**：Vue3 变化点的高频题，考透传属性与事件合并、多根节点下的行为差异。

**参考答案**：

> **一句话结论**：Vue3 把 `$listeners` 合并进了 `$attrs`，事件监听器现在就是普通属性；`inheritAttrs: false` 关掉自动透传，再用 `v-bind="$attrs"` 手动指定落点。

1. `$attrs` 包含所有"父组件传了但子组件没在 `props` / `emits` 里声明"的属性和事件，例如 `class`、`id`、`@click`。
2. 默认行为是自动透传到根元素，Vue2 只透传属性、不透传事件，这是最容易踩的版本差异。
3. 组件有多个根节点时不再自动透传，Vue3 会警告，必须 `inheritAttrs: false` 后手动 `v-bind="$attrs"` 指定挂到哪个节点。
4. 常见封装场景：基于 `el-input` 做二次封装，把 `$attrs` 透传给内部组件，避免一个个 `prop` 再转发一遍。
5. `<script setup>` 中通过 `useAttrs()` 获取 `$attrs`，注意它返回的是响应式代理，不要解构。

```html
<!-- 多根节点必须手动指定透传位置 -->
<template>
  <label>{{ label }}</label>
  <input v-bind="$attrs" />
</template>
<script setup>
defineOptions({ inheritAttrs: false })
defineProps({ label: String })
</script>
```

**追问与易错点**：

- 追问：`class` 和 `style` 会进 `$attrs` 吗？答：会，但它们的合并规则特殊，会与根元素自身的 `class` 合并而不是覆盖。
- 陷阱：父组件传了 `onClick`，子组件如果也声明了 `emits: ['click']`，事件就不再进 `$attrs`，透传会失效。
- 陷阱：以为 `inheritAttrs: false` 会阻止 `$attrs` 收集，其实它只控制"是否自动落到根元素"。

### Q6 父组件怎么调用子组件里的方法？`defineExpose` 为什么必需？

**考察点**：考模板 `ref` 用法、`<script setup>` 默认封闭的机制，以及"什么时候不该这么干"。

**参考答案**：

> **一句话结论**：`<script setup>` 的组件实例默认是封闭的，父组件拿到的 `ref` 上什么都没有，必须在子组件里用 `defineExpose` 显式暴露。

1. 父组件声明 `const childRef = ref()`，模板上写 `ref="childRef"`，`onMounted` 之后 `childRef.value.xxx()` 才可用，挂载前是 `null`。
2. 子组件 `defineExpose({ focus, reset, validate })` 把方法或状态暴露出去；不写这一句，父组件访问到的属性全是 `undefined`。
3. 这是 Vue3 的有意设计：显式暴露让组件 API 边界清晰，也避免内部实现被外部随意依赖。
4. 适用场景是命令式操作，比如弹窗 `open()` / `close()`、表格 `refresh()`、输入框 `focus()`；纯数据传递仍应走 `props` / `emit`。
5. 也可以在 `v-for` 中用函数式 `ref` 收集一组子组件实例，统一调用批量方法。

**追问与易错点**：

- 追问：选项式 API 里也要 `expose` 吗？答：不需要，选项式组件的所有实例属性默认可访问；封闭只针对 `<script setup>`。
- 陷阱：在 `onMounted` 之前调用 `childRef.value.method()` 报 `undefined` 错误，异步渲染或 `v-if` 场景要用 `nextTick` 或 `watch` 等实例出现。
- 陷阱：把"父组件直接调子组件方法"当常规通信手段，会让数据流双向、测试困难，能靠 `props` 驱动就不要命令式调用。

### Q7 Vue3 取消了全局事件总线，`$on` / `$off` 没了怎么办？

**考察点**：迁移必问。考是否知道 Vue3 实例不再实现事件接口，以及替代方案的取舍。

**参考答案**：

> **一句话结论**：Vue3 移除了实例上的 `$on` / `$off` / `$once`，跨组件通信改用 Pinia 管理状态，或引入 `mitt` 这类轻量第三方事件库实现发布订阅。

1. Vue2 时代靠 `new Vue()` 当总线，Vue3 创建实例用 `createApp`，且实例上不再暴露事件 API，老写法会直接报错。
2. 替代方案一：Pinia。把共享状态与更新逻辑收进 `store`，可调试、可持久化，是绝大多数通信需求的正确答案。
3. 替代方案二：`mitt`。不到 200 字节，提供 `on` / `off` / `emit` / `all`，适合真正的事件语义（如全局通知、埋点触发）。
4. 替代方案三：`provide` / `inject` 传一个事件发射器，作用域限制在子树内，比全局总线更可控。
5. 用事件总线要自己管订阅清理，组件卸载时 `off`，否则监听器泄漏，这是它相比 Pinia 最明显的劣势。

**追问与易错点**：

- 追问：事件总线和 Pinia 的本质区别？答：总线是"通知"、状态不变；Pinia 是"共享状态"、数据可追溯，能用状态表达就别用事件。
- 陷阱：还在用 `app.config.globalProperties.$bus = new Vue()`，Vue3 里 `new Vue` 已不存在，必须换成 `mitt` 或第三方实例。
- 陷阱：忘了在 `onUnmounted` 里解绑，热更新时会重复注册，出现"点一次触发多次"。

### Q8 默认插槽、具名插槽、作用域插槽有什么区别？编译成 JS 后长什么样？

**考察点**：进阶。考插槽传值的本质与编译产物，区分"能用"和"知道原理"。

**参考答案**：

> **一句话结论**：插槽在 Vue3 里统一编译成函数，父组件把函数传给子组件，子组件调用函数拿到虚拟节点（VNode）；作用域插槽就是"子组件调用时传参给父组件的函数"。

1. 默认插槽写成 `<slot />`，父组件直接写在标签中间的内容会作为 `slots.default` 传入。
2. 具名插槽写成 `<slot name="header" />`，父组件用 `<template #header>` 对应，编译后是 `slots` 对象上的不同键。
3. 作用域插槽是子组件把内部数据通过 `<slot :row="row" />` 传给 slot 函数，父组件用 `<template #default="{ row }">` 解构拿到。
4. 编译结果上：父组件编译为 `createSlots` / `_withCtx` 等辅助调用，生成一个返回 VNode 的函数；子组件编译为 `renderSlot(slots, 'default', props)`。
5. 关键点是"插槽内容在父组件作用域编译"，所以父组件插槽里访问不到子组件内部变量，除非通过作用域插槽显式传出去。
6. 显式区分"插槽内容什么时候渲染"：插槽是惰性的，只有子组件真正渲染该 `<slot>` 时才求值，这也让它适合做表格、下拉框等渲染委托组件。

**追问与易错点**：

- 追问：`$slots` 和 `$scopedSlots` 什么关系？答：Vue3 已合并，只有 `$slots`，它们本身就是函数，`$scopedSlots` 被移除。
- 陷阱：判断插槽是否传入要用 `$slots.header` 是否存在，而不是看 `$slots.header()` 的返回值，后者会执行渲染带来副作用。
- 陷阱：在 `v-for` 里包裹插槽并期望复用同一个 VNode，插槽每次渲染都会重新执行，性能敏感场景要注意。

### Q9 `keep-alive` 的 `include` / `exclude` / `max` 怎么用？匹配规则是什么？

**考察点**：基础但高频，考缓存匹配依据、`max` 的淘汰策略与常见坑。

**参考答案**：

> **一句话结论**：`keep-alive` 缓存组件实例，`include` / `exclude` 按组件 `name` 匹配，`max` 限制缓存上限并按最近最少使用（LRU）策略淘汰最久未访问的实例。

1. `include` 支持字符串、正则、数组，匹配的是**组件的 `name` 选项**，不是路由名、也不是文件路径。
2. `<script setup>` 组件默认没有 `name`，必须用 `defineOptions({ name: 'UserList' })` 显式声明，否则 `include` 永远匹配不上，这是最高频的坑。
3. `exclude` 优先级高于 `include`，同时命中时不会被缓存。
4. `max` 用于防止内存无限增长：`<keep-alive :max="10">`，超出后淘汰最久未被激活的实例，被淘汰组件会走 `onDeactivated` 且下次进入重新创建。
5. `keep-alive` 要求只有一个直接子组件，配合 `<component :is>` 或 `<router-view v-slot>` 使用。

```html
<router-view v-slot="{ Component, route }">
  <keep-alive :include="['UserList', 'OrderList']" :max="8">
    <component :is="Component" :key="route.name" />
  </keep-alive>
</router-view>
```

**追问与易错点**：

- 追问：为什么我用了 `include` 还是没缓存？答：九成是组件没有 `name`（`<script setup>` 场景），其次是 `exclude` 也命中了。
- 陷阱：给 `<component :is>` 加的 `:key` 如果包含变化参数，会导致实例被判定为不同组件而无法命中缓存。
- 陷阱：把 `max` 当成"缓存这么多就够"，实际上超出后淘汰的是最久未访问的，用户来回切换列表仍可能反复重建。

### Q10 `onActivated` / `onDeactivated` 和 `onMounted` / `onUnmounted` 是什么关系？

**考察点**：考 `keep-alive` 生命周期钩子的触发时机，以及缓存带来的副作用处理。

**参考答案**：

> **一句话结论**：被 `keep-alive` 缓存的组件首次进入会走 `onMounted` + `onActivated`，之后每次切换只走 `onActivated` / `onDeactivated`，`onUnmounted` 只在实例真正销毁（被淘汰或 `exclude`）时触发。

1. 首次渲染顺序：`setup` → `onBeforeMount` → `onMounted` → `onActivated`。
2. 切走时只触发 `onDeactivated`，组件实例与 DOM 都保留在内存中，不销毁。
3. 再次进入只触发 `onActivated`，不会重复执行 `setup` 与 `onMounted`，所以依赖 `onMounted` 拉数据的逻辑不会重新执行。
4. 刷新数据的正确姿势是把请求逻辑抽成函数，在 `onMounted` 与 `onActivated` 中都调用，或只放 `onActivated`。
5. 清理工作要区分：定时器、`addEventListener`、`WebSocket` 若只写在 `onUnmounted`，被缓存期间不会停止，应放到 `onDeactivated`。

**追问与易错点**：

- 追问：在 `onDeactivated` 里重置表单合适吗？答：看需求，若希望"返回时保留填写内容"就别重置，若希望"每次都是新页面"就在 `onDeactivated` 或 `onActivated` 里重置。
- 陷阱：以为切走就等于组件卸载，把轮询定时器留在 `onUnmounted`，结果后台一直在请求。
- 陷阱：`onActivated` 在非 `keep-alive` 组件里也会注册，但永远不触发，别指望用它替代 `onMounted`。

### Q11 异步组件怎么做？怎么和骨架屏（Skeleton）配合？

**考察点**：基础。考 `defineAsyncComponent` 的加载态、错误态与代码分包的联动。

**参考答案**：

> **一句话结论**：用 `defineAsyncComponent` 包裹动态 `import()`，配合 `loadingComponent` / `errorComponent` / `delay` 处理加载与失败态，这样组件代码才会被拆成独立分块按需下载。

1. 基本写法：`const Heavy = defineAsyncComponent(() => import('./Heavy.vue'))`，组件在首次渲染时才请求对应分块。
2. 选项式写法支持 `loadingComponent`（加载中展示）、`errorComponent`（加载失败展示）、`delay`（默认 200ms 后才显示加载态，避免闪烁）、`timeout`（超时抛错）。
3. `delay` 很关键：网络快时直接渲染真内容，不出现"闪一下骨架屏"的观感问题。
4. 路由级异步用 `() => import('...')` 即可，Vue Router 内部会处理；组件级才需要 `defineAsyncComponent`。
5. 骨架屏应尽量贴近真实布局的尺寸，避免内容加载后大幅位移，影响累积布局偏移（CLS）指标。
6. 错误态要提供重试按钮，配合 `defineAsyncComponent` 的 `onError` 选项可做自动重试。

```js
const AsyncTable = defineAsyncComponent({
  loader: () => import('./DataTable.vue'),
  loadingComponent: TableSkeleton,
  errorComponent: LoadError,
  delay: 200,
  timeout: 10000
})
```

**追问与易错点**：

- 追问：`defineAsyncComponent` 和 `Suspense` 什么关系？答：`Suspense` 在 `setup` 中 `await` 时会显示 `#fallback`，是另一套方案，但仍是实验性 API，生产建议用 `loadingComponent`。
- 陷阱：在异步组件外包 `v-if` 判断数据是否就绪，导致组件被反复创建销毁，加载状态反而更差。
- 陷阱：异步组件拿到的是包装组件，用 `ref` 调用内部方法时会拿到包装层，需要 `defineExpose` 透传。

### Q12 Vue3 的 `createRouter` 怎么创建？`history` / `hash` / `memory` 三种模式怎么选？

**考察点**：Router 4 基础题，考实例创建、模式差异与参数传递方式。

**参考答案**：

> **一句话结论**：Router 4 用 `createRouter({ history, routes })` 创建，模式由 `createWebHistory` / `createWebHashHistory` / `createMemoryHistory` 决定；`params` 走路径片段、`query` 走查询字符串。

1. `createWebHistory()` 是 HTML5 模式，URL 干净（`/user/1`），但需要服务端把所有路径回退到 `index.html`，否则刷新 404。
2. `createWebHashHistory()` 是哈希模式，URL 带 `#`，不需要服务端配置，适合静态托管或无法改 Nginx 的场景。
3. `createMemoryHistory()` 不操作浏览器地址栏，用于服务端渲染（SSR）和非浏览器环境（如测试、小程序容器）。
4. 动态参数用 `:id` 声明，读取用 `route.params.id`；声明为 `:id?` 表示可选，`route.params` 里的值始终是字符串。
5. `query` 对应 `?a=1&b=2`，适合筛选条件、分页这类可分享的状态；`params` 适合标识资源身份（用户 ID、订单号）。
6. 组合式 API 中 `useRouter()` 拿实例做跳转，`useRoute()` 拿当前路由信息，两者都是响应式的。

```js
const router = createRouter({
  history: createWebHistory('/app/'),
  routes: [{ path: '/user/:id(\\d+)', name: 'user', component: User }]
})
router.push({ name: 'user', params: { id: 1 }, query: { tab: 'info' } })
```

**追问与易错点**：

- 追问：`params` 和 `query` 刷新后还在吗？答：`query` 在 URL 里一定在；`params` 在命名路由跳转时由 Router 拼进路径，但直接传对象而不走 `push` 时不会体现在 URL，刷新就丢。
- 陷阱：用 `path` 跳转又想带 `params`，Router 4 会忽略 `params`，必须用 `name`。
- 陷阱：HTML5 模式上线后忘了配 Nginx `try_files`，表现为"首页正常、刷新子路由白屏 404"。

### Q13 动态路由怎么加？`addRoute` / `removeRoute` 在权限系统里怎么用？

**考察点**：进阶。考权限路由的生成方式与刷新丢失问题。

**参考答案**：

> **一句话结论**：`router.addRoute()` 可以在运行时追加路由，通常用两种流派——登录后按后端返回的菜单动态 `addRoute`，或前端定义全量路由、用 `meta.roles` 做过滤。

1. 动态添加：`router.addRoute({ path: '/admin', component: ... })`，也可作为子路由挂到已有父路由下：`router.addRoute('parentName', childRoute)`。
2. 添加后的路由只有在下次导航时才生效，若当前已在目标地址，需要手动 `router.replace(to.fullPath)` 触发解析。
3. `removeRoute(name)` 或 `removeRoute(routeObject)` 用于退出登录时清理权限路由，避免切换账号后残留旧权限。
4. 关键坑：动态路由是内存态，刷新页面会重建成初始路由，所以在 `beforeEach` 里要判断"是否已添加"，未添加则先拉权限再 `next({ ...to, replace: true })` 重进一次。
5. 另一种更简单的方案是全量注册 + `meta.roles` 过滤 + 404 兜底，缺点是有权路由仍能在前端代码里搜到，安全性最终仍靠后端接口鉴权。
6. 路由 `name` 必须唯一，动态添加重名时会覆盖旧路由，权限系统里建议用后端菜单 ID 拼接保证唯一。

```js
router.beforeEach(async (to) => {
  if (store.hasAddedRoutes) return true
  await store.fetchMenus()
  store.menus.forEach((m) => router.addRoute(m))
  store.hasAddedRoutes = true
  return { ...to, replace: true } // 重新走一遍解析
})
```

**追问与易错点**：

- 追问：`addRoute` 后立刻 `push` 到新路由为什么 404？答：新增路由表需要重新匹配，用 `return { ...to, replace: true }` 重定向一次，或直接 `next(to.fullPath)`。
- 陷阱：忘记 `removeRoute`，切换账号后仍能访问上一账号的路由。
- 陷阱：把动态路由当成安全边界，前端隐藏菜单只是体验，真正的鉴权必须落在后端接口上。

### Q14 Vue Router 4 的守卫有哪几种？完整的执行顺序是什么？

**考察点**：进阶必问。考守卫分类与顺序，能否口述一条完整链路。

**参考答案**：

> **一句话结论**：守卫分全局（`beforeEach` / `beforeResolve` / `afterEach`）、路由独享（`beforeEnter`）、组件内（`beforeRouteEnter` / `beforeRouteUpdate` / `beforeRouteLeave`）三类；完整顺序是"失活组件离开 → 全局前置 → 复用组件更新 → 独享 → 解析 → 全局后置"。

1. `beforeRouteLeave`：离开当前组件的守卫，最先执行，常用于拦截未保存表单。
2. `beforeEach(to, from)`：全局前置守卫，鉴权、登录校验的主战场，返回值可控制导航。
3. `beforeRouteUpdate`：当前路由改变但组件被复用（如 `/user/1` → `/user/2`）时触发。
4. `beforeEnter`：路由配置里的独享守卫，只在进入该路由时触发，刷新或从别处进入都会走。
5. `beforeResolve`：所有组件内守卫与异步路由组件解析完成后触发，此时导航即将被确认。
6. `afterEach`：全局后置钩子，导航已确认后执行，没有 `next`，适合关闭进度条、上报埋点。之后才是 DOM 更新。

**追问与易错点**：

- 追问：`next` 还有必要写吗？答：Router 4 支持守卫返回 `false` / 路由地址 / `undefined` 三种写法，返回 `undefined` 等于放行；同时混用 `next` 和 `return` 会出错。
- 陷阱：`afterEach` 里想拦截导航——它已经拦不住了，需要拦截只能用 `beforeEach` / `beforeResolve`。
- 陷阱：重定向导致的导航会重新走一遍完整守卫链，在 `beforeEach` 里无脑 `next('/login')` 会造成死循环。

### Q15 用 `meta` 做权限控制时，`beforeEach` 里的异步鉴权为什么会死循环？怎么破？

**考察点**：深挖题。考异步守卫 + 重定向的经典死循环成因与工程解法。

**参考答案**：

> **一句话结论**：死循环的根因是"重定向又回到了需要鉴权的目标路由，而鉴权状态还没准备好"，所以又触发一次同样的重定向；解法是加上"目标就是登录页就放行"的白名单判断，并保证鉴权结果被缓存。

1. 典型写法：未登录时 `next('/login')`，而 `/login` 本身也在 `beforeEach` 里做了登录校验，于是不断在 `/login` 与目标页之间弹跳。
2. 第一层解法：守卫开头先判断 `to.path` 是否在白名单（`/login`、`/404`、静态资源）内，命中直接放行。
3. 第二层解法：把用户信息的请求做"单次执行 + 结果缓存"，用 `promise` 变量或状态标记，避免每次导航都重复请求导致状态永远处于 pending。
4. 第三层解法：动态路由添加后不要直接 `next()`，用 `return { ...to, replace: true }` 重新进入解析，同时用"是否已添加"标记防止无限重入。
5. 安全兜底：前端守卫只能防误操作，后端接口鉴权才是真正的边界，别把权限判断全部放在前端。
6. 调试手段：在守卫里打印 `to.fullPath` 与关键状态，出现循环时日志会呈现明显的重复模式，一眼可辨。

```js
const whiteList = ['/login', '/404']
router.beforeEach(async (to) => {
  if (whiteList.includes(to.path)) return true
  if (store.token && !store.userInfo) {
    try { await store.fetchUserInfo() } catch { return '/login' }
  }
  if (!store.token) return `/login?redirect=${encodeURIComponent(to.fullPath)}`
  return true
})
```

**追问与易错点**：

- 追问：为什么用 `next('/login')` 而不是 `return '/login'`？答：两种都可，但同一守卫里不要混用；返回式写法更容易被 TS 检查，推荐统一用 `return`。
- 陷阱：把 `await` 放在 `next()` 调用之后，等于守卫已经放行了请求还在飞，后续逻辑全部失效。
- 陷阱：登录成功跳转时直接 `push('/')` 而不看 `redirect` 参数，用户体验上是"登录后总要回首页"。

### Q16 路由懒加载是怎么做到分包的？为什么能减小首屏体积？

**考察点**：基础但要答到构建原理，考动态 `import()` 与打包工具的联动。

**参考答案**：

> **一句话结论**：路由懒加载本质是把 `() => import('./View.vue')` 交给打包工具，动态 `import()` 会被 Vite / webpack 识别并拆成独立分块（chunk），访问该路由时才下载并执行。

1. `import()` 是 ECMAScript 的动态导入语法，返回 `Promise`，打包工具在编译期据此切分模块边界。
2. Vue Router 的 `component` 支持函数形式 `() => import('...')`，内部会等待 `Promise` 完成再渲染，天然契合懒加载。
3. Vite 基于 Rollup，可通过 `/* @vite-ignore */`、`import.meta.glob` 以及与框架约定生成分块；Vite 默认还会把共享依赖抽成 `vendor`。
4. 收益：首屏只加载当前路由需要的代码，减小初始 JS 体积、缩短首次内容绘制（FCP）时间。
5. 代价：切换路由时多一次网络往返，可能出现白屏，因此要配合加载态与预加载（`webpackPrefetch` 或 `router-link` 的 hover 预取）。
6. 不要过度拆分，几十个几百字节的小分块反而增加请求数与解析开销，按页面粒度拆分通常最划算。

**追问与易错点**：

- 追问：懒加载和 `defineAsyncComponent` 有什么区别？答：路由级 `import()` 由 Router 处理加载；组件级需要 `defineAsyncComponent` 包装才能提供加载 / 错误态与延迟显示。
- 陷阱：`component: () => import('...')` 写成 `component: import('...')`（少了箭头函数），会直接把 `Promise` 当组件传入，渲染报错。
- 陷阱：分块路径用了变量拼接（`import('./' + name)`），打包工具无法静态分析，直接报错。

### Q17 `scrollBehavior`、`redirect`、`alias`、404 通配分别怎么写？

**考察点**：基础工程题，考路由配置的常见需求是否手熟。

**参考答案**：

> **一句话结论**：`scrollBehavior` 控制切换路由后的滚动位置，`redirect` 做入口重定向，`alias` 给同一路由配多个 URL，通配路由 `/:pathMatch(.*)*` 兜底 404。

1. `scrollBehavior(to, from, savedPosition)` 返回 `{ left: 0, top: 0 }` 回顶、返回 `savedPosition` 恢复前进后退位置、返回 `{ el: '#id' }` 定位锚点。
2. 只要配置了 `scrollBehavior`，Vue Router 就会自动把 `history.scrollRestoration` 置为 `'manual'` 并自行记录滚动位置；若想让浏览器接管原生恢复行为，反而要显式改回 `'auto'`。
3. `redirect` 支持字符串、对象或函数：`{ path: '/', redirect: '/home' }`；函数形式可动态决定，例如按登录态分流。
4. `alias` 让多个路径匹配同一路由，地址栏显示用户输入的路径而不跳转，区别于 `redirect` 会发生地址变化。
5. 404 兜底写在路由表最后：`{ path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }`，Router 4 已废弃 `*` 写法。
6. 带参数的通配要放在最后，否则会抢占其他路由的匹配。

```js
const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (to, from, saved) => saved ?? { top: 0 },
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/home', component: Home, alias: ['/index'] },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound }
  ]
})
```

**追问与易错点**：

- 追问：为什么返回上一页时滚动位置没恢复？答：路由用了 `keep-alive` 缓存页面时，`savedPosition` 可能为 `null`，需要在 `onActivated` 里手动恢复滚动位置。
- 陷阱：沿用 Vue2 的 `path: '*'`，Router 4 会直接报错，必须改成 `/:pathMatch(.*)*`。
- 陷阱：`redirect` 写在通配路由附近会抢匹配，导致本该命中的页面被重定向。

### Q18 `beforeRouteEnter` 里为什么拿不到 `this`？`route.matched` 和命名视图有什么用？

**考察点**：进阶。考组件内守卫的执行时机限制、路由匹配链与命名视图布局。

**参考答案**：

> **一句话结论**：`beforeRouteEnter` 触发时组件实例还没创建，所以拿不到 `this`，要通过 `next(vm => {})` 回调或改成在 `setup` 里发请求；`route.matched` 是匹配到的路由记录数组，命名视图用于同一层级渲染多个组件。

1. `beforeRouteEnter` 执行时机早于组件创建，`this` 为 `undefined`；Vue3 中可用 `next` 回调拿到实例，或在 `<script setup>` 里直接用 `onBeforeRouteEnter`。
2. 更实用的做法是不在守卫里取数据，改为在 `setup` 中发请求，配合 `await` 或 `Suspense`，逻辑更集中。
3. `route.matched` 返回当前路由匹配到的所有路由记录，包含父级布局路由，可用于面包屑生成、判断是否命中某个父级模块。
4. 命名视图：`<router-view name="sidebar" />` 配合路由的 `components: { default: A, sidebar: B }`，一次渲染多个平级组件，适合后台的"主内容 + 侧栏"布局。
5. 命名视图和子路由的差别：前者是同级并行渲染，后者是嵌套（父组件里再放一个 `router-view`）。
6. 父级路由若要作为纯布局容器，可以不给 `component` 只写 `children`，Vue Router 4 会视为透传。

**追问与易错点**：

- 追问：`beforeRouteUpdate` 什么时候触发？答：组件被复用时参数变化（`/user/1` → `/user/2`），常用来重新拉数据，容易和 `watch(() => route.params.id)` 重复，选一个即可。
- 陷阱：在 `beforeRouteEnter` 里写 `this.fetchData()`，报 `Cannot read property of undefined`。
- 陷阱：给子路由的父级同时写了 `component` 和 `redirect`，导致父级永远不渲染布局，子路由的 `router-view` 无处安放。

### Q19 怎么在离开页面前拦截未保存的表单？

**考察点**：基础实战题，考 `onBeforeRouteLeave` 与浏览器原生 `beforeunload` 的配合。

**参考答案**：

> **一句话结论**：路由内跳转用 `onBeforeRouteLeave` 里判断"是否有未保存修改"并弹出确认框，返回 `false` 取消导航；关闭标签页 / 刷新这类浏览器级操作要靠 `beforeunload` 事件。

1. 在 `<script setup>` 里 `onBeforeRouteLeave((to, from) => { if (isDirty) return window.confirm('确定离开？') })`，返回 `false` 即取消导航。
2. `isDirty` 的判定推荐"初始快照对比"，进入页面时深拷贝一份表单值，离开时与当前值比对，比零散维护布尔标记可靠。
3. 保存成功后要把 `isDirty` 置为 `false`，否则正常跳转也会被拦。
4. 浏览器原生拦截：`window.addEventListener('beforeunload', handler)`，`handler` 里 `e.preventDefault()`，现代浏览器只显示通用提示文案，无法自定义。
5. 该监听器要在 `onUnmounted` 里移除，且只在"脏"状态下才阻止，否则所有刷新都会被拦。
6. 复杂场景（多步骤表单、弹窗内表单）建议把脏检查收敛到一个组合式函数里复用，避免每页各写一套。

```js
onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  return window.confirm('表单尚未保存，确定离开吗？')
})
```

**追问与易错点**：

- 追问：返回 `false` 和调用 `next(false)` 等价吗？答：等价，Router 4 推荐返回式写法，但不要两者混用。
- 陷阱：在 `onBeforeRouteLeave` 里做异步确认（弹自定义 Modal 再 `await`），必须在守卫里 `return` 一个 `Promise`，否则守卫提前放行。
- 陷阱：只拦了路由跳转，用户点浏览器刷新仍然丢数据，`beforeunload` 不能省。

### Q20 Pinia 和 Vuex 的核心区别是什么？为什么 Pinia 不需要 `mutations`？

**考察点**：必问对比题，考设计理念而非参数表。

**参考答案**：

> **一句话结论**：Pinia 是 Vue3 官方推荐的状态库，用扁平的多 `store` 取代 Vuex 的单一大树，去掉了 `mutations` 这一层，直接 `actions` 改 `state`；Vuex 是"事件驱动 + 单向流"的 Flux 思路，Pinia 是"模块即仓库"的思路。

| 维度 | Vuex 4 | Pinia |
| --- | --- | --- |
| 修改状态 | `commit` → `mutations`（同步） / `dispatch` → `actions`（异步） | 直接改 `state` 或调 `actions` |
| 模块 | `modules` + `namespaced` | 每个 `store` 天然独立，可互相引用 |
| 类型推断 | 需手写类型体操 | 原生友好，`storeToRefs` 保留类型 |
| 体积 | 较大 | 约 1KB，支持 tree-shaking |
| 调试 | DevTools 时间线 | DevTools 时间线 + 更细的组件级追踪 |

1. `mutations` 的存在意义是"让状态变更是同步且可追踪的"，但 Vue3 的响应式系统已经能在 DevTools 中追踪到变更来源，多一层样板代码只增加心智负担。
2. `actions` 在 Pinia 中既可以是同步也可以是异步，直接改 `state`，写法就是普通函数。
3. Pinia 支持 `$subscribe` 订阅状态变化，配合插件同样能实现日志、持久化等能力。
4. Pinia 的 `store` 是扁平结构，不再有嵌套 `modules` 的命名空间地狱，跨 `store` 引用直接 import，循环依赖靠延迟调用规避。
5. 结论：新项目直接上 Pinia；老项目 Vuex 不必强行迁移，但 Vue3 新代码不要继续堆 Vuex 模块。

**追问与易错点**：

- 追问：Pinia 里还能用 `mapState` 这类辅助函数吗？答：有 `mapStores` / `mapState` / `mapActions`，但组合式 API 场景更推荐 `storeToRefs` + 直接调用。
- 陷阱：Vuex 的严格模式（`strict: true`）在 Pinia 里没有对应开关，Pinia 本身不会检测"组件外直接改 state"。
- 陷阱：以为 Pinia 没有时间旅行调试，实际上 DevTools 的 Pinia 面板同样支持查看每次变更。

### Q21 Pinia 的 `state` / `getters` / `actions` 怎么写？`storeToRefs` 解决什么问题？

**考察点**：基础 API 题，考三件套写法与"解构丢响应式"这个高频坑。

**参考答案**：

> **一句话结论**：`state` 是返回初始状态对象的函数，`getters` 是基于 `state` 的缓存计算属性，`actions` 是普通方法；从 `store` 解构必须用 `storeToRefs`，否则拿到的是快照，失去响应式。

1. `state: () => ({ count: 0 })` 必须是函数，保证每个实例 / SSR 请求都有独立状态。
2. `getters` 参数是 `state`，可用 `this` 访问其他 `getter`（不能用箭头函数，否则 `this` 丢失）；结果会被缓存，依赖不变不重算。
3. `actions` 里通过 `this` 访问 `state` 与其他 `action`，支持 `async`，内部出错可统一 `try/catch`。
4. `storeToRefs(store)` 会跳过方法，只把 `state` 与 `getters` 转成 `ref`，所以 `actions` 要直接从 `store` 上取。
5. store 本身是 `reactive` 对象，直接 `const { count } = store` 会丢掉响应性，这是组合式 API 里 Pinia 第一号坑。
6. `state` 的修改可直接赋值（`store.count++`），也可批量 `store.$patch({ count: 1 })`，`$patch` 传函数可一次提交多处修改，只触发一次订阅。

```js
const store = useCounterStore()
const { count, double } = storeToRefs(store) // state + getters
const { increment } = store                 // actions 直接取
```

**追问与易错点**：

- 追问：`getter` 里用 `this` 和用参数有什么区别？答：用参数只能拿到本 `store` 的 `state`，用 `this` 还能访问其他 `getter`，但必须写普通函数。
- 陷阱：`storeToRefs` 把 `getters` 也转成了 `ref`，误以为是只读就直接赋值，会报"没有 setter"的错误。
- 陷阱：在 `action` 里 `this` 丢失（把方法解构出来单独调用），表现为读写状态全失败，需要 `store.increment()` 这样调用。

### Q22 `setup store` 和选项式 `store` 有什么区别？`this` 依赖会带来什么问题？

**考察点**：深挖题。考两种风格差异、`this` 的坑，以及 SSR 下的状态隔离。

**参考答案**：

> **一句话结论**：选项式 `store` 用 `state` / `getters` / `actions` 三段式声明，风格接近 Vuex；`setup store` 用组合式 API 写法，返回 `ref` / `computed` / 函数，更灵活且天然规避 `this` 依赖问题。

1. `setup store` 写法：`defineStore('id', () => { const n = ref(0); const d = computed(...); function inc() {...}; return { n, d, inc } })`。
2. 优势：可以自由使用 `watch`、`watchEffect`、自定义组合式函数，逻辑按关注点组织，不再是"状态一堆、方法一堆"。
3. `this` 依赖问题集中在选项式：`actions` 里用 `this` 访问 `state` 时，如果把方法解构出来单独调用就会丢 `this`；嵌套 `store` 循环引用时 `this` 也可能未初始化。
4. `setup store` 里没有 `this`，跨 `store` 引用直接 import 并调用 `useOtherStore()`，循环依赖时把调用放到函数体内延迟执行。
5. SSR 注意：`state` 必须是函数以避免请求间状态串味；服务端要序列化 `state` 注入 HTML，客户端用 `pinia.state.value = payload` 恢复后再 `app.use(pinia)`，否则水合不一致。
6. 一个应用里两种风格可以混用，团队内保持一致即可；新项目建议统一 `setup store`。

```js
export const useUserStore = defineStore('user', () => {
  const list = ref([])
  const total = computed(() => list.value.length)
  async function fetchList() { list.value = await api.list() }
  return { list, total, fetchList }
})
```

**追问与易错点**：

- 追问：`setup store` 里能定义 `getters` 吗？答：用 `computed` 即可，效果一致；`storeToRefs` 同样能把它转成 `ref`。
- 陷阱：SSR 下把 `state` 写成普通对象而非函数，多个请求共用一个 `store` 实例，会出现"用户 A 看到用户 B 的数据"。
- 陷阱：在 `setup store` 顶层直接调用另一个 `store` 并在其中访问 `state`，循环依赖时会拿到未初始化的值。

### Q23 Pinia 怎么做持久化？`$subscribe` 怎么用？

**考察点**：进阶工程题，考插件机制、订阅能力与手写持久化的边界处理。

**参考答案**：

> **一句话结论**：持久化本质是"`store` 创建时从存储读回初始值 + `$subscribe` 订阅变化写回存储"，可以手写插件，也可以直接用 `pinia-plugin-persistedstate`。

1. `$subscribe(callback, options)` 监听 `state` 的直接修改与 `$patch`，回调参数包含 `mutation` 信息，比 `watch` 更精确地覆盖所有修改入口。
2. 手写插件用 `pinia.use(({ store }) => {...})`，在插件里读 `localStorage` 合并进 `store.$patch`，并注册 `$subscribe` 写回。
3. 要注意"只持久化需要的字段"，用 `pick` / `omit` 配置，避免把临时状态、大列表、敏感信息写进 `localStorage`。
4. 存储容量与同步阻塞是代价：`localStorage` 约 5MB 且同步，大数据量应考虑 `sessionStorage` 或 `IndexedDB`。
5. `$subscribe` 的 `detached: true` 选项让订阅在组件卸载后继续生效（默认在组件内注册的订阅会随该组件卸载被自动移除）。
6. 安全上，`localStorage` 可被用户任意修改，持久化的 token 只应作为"提示已登录"，真实校验必须请求后端。

```js
pinia.use(({ store, options }) => {
  const key = `pinia:${store.$id}`
  const saved = localStorage.getItem(key)
  if (saved) store.$patch(JSON.parse(saved))
  store.$subscribe((_m, state) => {
    localStorage.setItem(key, JSON.stringify(state))
  }, { detached: true })
})
```

**追问与易错点**：

- 追问：`$subscribe` 和 `watch(store.$state, ...)` 有什么区别？答：`$subscribe` 在 `$patch` 后只触发一次且携带变更信息，`watch` 深度监听默认按微任务批量触发，行为更接近普通响应式监听。
- 陷阱：持久化里存了整个 `state`，包含函数引用或不可序列化对象，`JSON.stringify` 直接丢数据或报循环引用。
- 陷阱：SSR 场景把 `localStorage` 当唯一数据源，服务端没有该 API 直接报错，需要判断环境或改由 Cookie 传递。

### Q24 Vuex 4 的核心概念还有哪些？`namespaced` 和严格模式怎么理解？

**考察点**：基础。老项目仍需维护，考是否还能讲清 Vuex 的完整模型。

**参考答案**：

> **一句话结论**：Vuex 4 的模型是"单一状态树 + `state` / `getters` / `mutations` / `actions` / `modules`"，`mutations` 必须同步、`actions` 可以异步，`namespaced` 决定模块的调用路径，严格模式用深度监听检测非法改状态。

1. `state` 是唯一数据源；`getters` 是从 `state` 派生的计算属性，缓存结果。
2. `mutations` 是唯一允许修改 `state` 的地方，且必须同步，调用方式是 `commit`。
3. `actions` 提交 `mutations`，可以包含异步逻辑，调用方式是 `dispatch`，返回 `Promise`。
4. `modules` 把状态树拆分，`namespaced: true` 后调用要带前缀：`dispatch('user/login')`，`getters` 与 `mutations` 同理。
5. 严格模式 `strict: true` 会深度监听 `state`，任何不在 `mutation` 里发生的修改都会抛错；代价是性能开销明显，生产环境要关掉。
6. 辅助函数 `mapState` / `mapGetters` / `mapMutations` / `mapActions` 在选项式组件里配合 `...` 展开使用，组合式 API 中一般直接用 `useStore()`。

**追问与易错点**：

- 追问：为什么 `mutations` 不能异步？答：异步回调执行时无法确定状态变更的时序，DevTools 时间线会记录错乱，所以强制同步以便追踪。
- 陷阱：在 `mutation` 里发请求，DevTools 状态快照与真实时序不符，排查问题极其困难。
- 陷阱：模块开了 `namespaced` 但 `getters` 内部访问 `state` 时误以为是根 `state`，命名空间内 `state` 只指本模块，根 `state` 要经第三个参数取。

### Q25 一个 Vue2 项目迁到 Vue3，主要有哪些坑？迁移路径该怎么排？

**考察点**：进阶实战题，考全局 API、语法、生态三条线是否有清单。

**参考答案**：

> **一句话结论**：迁移按"构建工具 → 全局 API → 模板语法 → 生态依赖"四步走，能先升 Vite + `@vue/compat` 跑起来再逐项消警告是最稳的路径。

1. 全局 API 变化：`Vue.prototype.$http` 改为 `app.config.globalProperties.$http`；`Vue.use` / `Vue.mixin` / `Vue.directive` 全部移到 `app` 实例上。
2. 过滤器（`filters`）被移除，改用 `computed` 或方法调用；`v-for` 与 `v-if` 同级时 `v-if` 优先级变高，务必不要依赖旧优先级。
3. `$listeners` 合并进 `$attrs`；`$children` 被移除（不保证顺序、非响应式），改用 `ref` 或 `provide/inject`。
4. 事件总线失效：`$on` / `$off` / `$once` 移除，换 Pinia 或 `mitt`；`v-model` 默认名改为 `modelValue`；`.sync` 改为 `v-model:xxx`。
5. `functional` 组件写法变化，函数式组件改为纯函数返回 VNode；`render` 函数 API 变化，`h` 从全局导入，`slot` 改用 `slots` 对象。
6. 生态依赖：Element UI 换 Element Plus（组件名与部分 `prop` 有差异）、`vue-router` 升 4、`vuex` 升 4 或直接换 Pinia；跨版本库用 `vue-demi` 兼容 Vue2/3。
7. 过渡方案：`@vue/compat` 提供兼容构建，把不兼容用法降级为运行时警告，适合大型项目渐进迁移；小项目直接重写更划算。
8. 迁移期间 Options API 与 Composition API 可以混用，一个组件内也能并存，但不要长期混着写，团队应约定新代码用组合式 API。

**追问与易错点**：

- 追问：`Vue.extend` 还有吗？答：Vue3 已移除，配合 `defineComponent` 或直接写 `setup` 即可，动态创建组件实例改用 `createApp` 或 `h` + `render`。
- 陷阱：把 `@vue/compat` 当成长期方案，它只是过渡构建，会带来额外体积与运行时开销，必须设定期限清理。
- 陷阱：只改了业务代码没升生态库，出现"项目能跑但 Element 组件全白"这类问题，先对齐依赖再改业务。

### Q26 Vue3 里有哪些真正有效的性能优化手段？分别解决什么问题？

**考察点**：进阶。考是否理解优化项的适用场景与代价，而不是背清单。

**参考答案**：

> **一句话结论**：优化要针对瓶颈选手段——渲染过多用 `v-memo` / `v-once` / 组件拆分，数据量过大用虚拟列表，只读大数据用 `shallowRef` / `shallowReactive`，交互频繁用 `v-show` 而非 `v-if`。

1. `v-memo`：传入依赖数组，依赖不变时跳过该子树更新，适合长列表里少数项频繁变化、其余稳定的场景；代价是依赖写错会渲染陈旧内容。
2. `computed` 有缓存，基于响应式依赖判断是否需要重算；`methods` 每次渲染都执行，模板里别放重计算的方法调用。
3. `shallowRef` / `shallowReactive`：只对第一层做响应式，适合大数组、图表数据、第三方实例；代价是深层修改不会触发更新，需要手动 `triggerRef`。
4. 虚拟列表：只渲染可视区域，万级数据才有明显收益；注意固定行高会显著简化实现，动态行高需要测量与缓存。
5. `v-if` 与 `v-show` 取舍：切换不频繁、初始可能不显示用 `v-if`（不渲染、省内存）；频繁切换用 `v-show`（只切 `display`，省创建销毁开销）。
6. 组件拆分与异步组件：把重组件从首屏剥离，减少初始执行时间；`keep-alive` 缓存列表页能省掉重新请求与重渲染，但要配合 `max` 防内存膨胀。
7. 大表单优化：拆分受控粒度、用 `shallowRef` 存表单模型、避免整表 deep watch，校验改为触发式而不是每次输入全校验。
8. 别忘基础项：生产构建开启压缩与 Tree-shaking、图片懒加载与合适格式、避免无意义的 `watch` 深监听。

**追问与易错点**：

- 追问：`v-memo` 和 `v-once` 区别？答：`v-once` 只渲染一次永不更新；`v-memo` 是"依赖不变才跳过"，依赖变了仍会更新。
- 陷阱：不分场景把 `reactive` 全换成 `shallowRef`，结果深层修改视图不更新，反而花大量时间排查"数据变了页面没变"。
- 陷阱：虚拟列表用在下拉选择器里，与组件库自带的虚拟化能力重复实现，出现滚动跳动。

### Q27 Vue3 配 TypeScript 有哪些必须掌握的写法？`vue-tsc` 为什么必要？

**考察点**：深挖题。跨用户的明确短板，考类型声明的具体写法与类型检查链路。

**参考答案**：

> **一句话结论**：`defineProps` / `defineEmits` 用类型声明或 `PropType` 拿到完整推断，复杂泛型用泛型组件，跨层级注入用 `InjectionKey`；`vue-tsc` 做的是模板与 `.vue` 文件的类型检查，Vite 用的 esbuild 只转译不做类型检查。

1. `<script setup lang="ts">` 中 `defineProps<{ title: string; list?: Item[] }>()`，配 `withDefaults` 给默认值，模板里自动获得类型提示。
2. 编译器宏不能传外部变量：类型必须写在宏的参数位置，导入的类型要用 `import type`，这样才能被静态分析。
3. `PropType<T>` 用在运行时声明里标注复杂类型：`defineProps({ item: { type: Object as PropType<Item>, required: true } })`。
4. 泛型组件（Vue 3.3 起）：`<script setup lang="ts" generic="T extends { id: number }">`，让 `props` 与 `emit` 随传入类型推断，写通用表格、下拉框时非常有用。
5. `InjectionKey<T>` 给 `provide` / `inject` 加类型，避免 `inject` 返回 `any`；`defineExpose` 暴露的内容同样会被推断到父组件的 `ref` 上。
6. `vue-tsc --noEmit` 才是真正的类型检查手段，IDE 不报错不代表构建通过；建议在 CI 与 `pnpm build` 前置执行。

```ts
const props = withDefaults(defineProps<{ items: Item[]; multiple?: boolean }>(), {
  multiple: false
})
const emit = defineEmits<{ (e: 'select', id: number): void }>()
```

**追问与易错点**：

- 追问：为什么 IDE 里不报错，CI 上 `vue-tsc` 报一堆？答：IDE 用的是 Volar / Vue Language Tools 的实时推断，配置与版本可能不一致，且模板类型的严格度不同，必须以 `vue-tsc` 结果为准。
- 陷阱：`defineProps` 同时写运行时声明与类型声明，会报重复定义错误，只能二选一。
- 陷阱：把 `any` 当万能解，`props` 全用 `any` 等于放弃了这套类型系统的全部收益。

### Q28 `Teleport` 解决什么问题？弹窗层级怎么处理才干净？

**考察点**：基础。考 `Teleport` 的用途、与 `z-index` / 样式隔离的关系。

**参考答案**：

> **一句话结论**：`Teleport` 把组件的 DOM 渲染到指定容器（通常是 `body`），解决"父级 `overflow: hidden`、`transform`、`z-index` 层叠上下文导致弹窗被裁切或遮挡"的问题，而组件逻辑与数据流仍留在原位置。

1. 用法：`<Teleport to="body"><div class="modal">...</div></Teleport>`，`to` 可以是选择器或真实 DOM 元素；`disabled` 属性可动态开关传送。
2. 为什么需要：祖先设置了 `transform`、`filter`、`will-change` 会创建新的层叠上下文，子元素 `z-index` 再大也盖不过祖先之外的元素。
3. 配合 `overflow: hidden` 的滚动容器，弹窗常被裁掉一半，Teleport 到 `body` 是标准解法。
4. 同一个 `to` 目标有多个 `Teleport` 时按挂载顺序排列，可用 `order` 属性控制插入位置。
5. 事件与响应式不受影响：Teleport 只搬 DOM，`props`、`emit`、`provide` / `inject` 仍按组件树生效。
6. 样式注意：Teleport 后弹窗不在原父元素下，使用 `scoped` 样式时依赖 `data-v` 属性仍会保留，但后代选择器（父级限定）会失效。

**追问与易错点**：

- 追问：SSR 下 `Teleport` 能用吗？答：能用，但 `to="body"` 在服务端没有对应节点，需要 `to` 指向一个服务端也存在的元素或在客户端挂载后再传送。
- 陷阱：以为 Teleport 会影响 `provide` / `inject` 的作用域，实际上组件树的逻辑层级完全没变。
- 陷阱：弹窗组件在 `v-if` 里被销毁时忘了清理 `body` 上的 `overflow: hidden`，导致背景页面无法滚动。

### Q29 SSR / Nuxt 3 里，水合不匹配是怎么产生的？怎么系统性避免？

**考察点**：深挖题。考服务端渲染（SSR）与客户端水合（Hydration）的一致性问题。

**参考答案**：

> **一句话结论**：水合不匹配的根因是"服务端与客户端首次渲染的 DOM 结构或文本不一致"，Vue 会警告并在客户端丢弃服务端结果重新渲染；规避手段是让首屏渲染纯由 `props` 与序列化后的数据决定。

1. 典型成因一：渲染中使用了 `Date.now()`、`Math.random()`、`new Date()` 等每次结果不同的值。
2. 典型成因二：根据 `typeof window !== 'undefined'` 或 `localStorage`、`window.innerWidth` 分支渲染，服务端与客户端走了不同分支。
3. 典型成因三：服务端与客户端数据不一致，例如客户端又发了一次请求才拿到数据，Nuxt 3 的 `useFetch` / `useAsyncData` 会把服务端取到的数据序列化进 payload，客户端复用它，从而避免二次请求造成的不一致。
4. 典型成因四：HTML 结构非法被浏览器纠正，例如 `<p>` 里放 `<div>`、`<table>` 内直接放 `<tr>` 之外的元素，服务端输出与浏览器解析结果不同。
5. 典型成因五：浏览器扩展或自动填充改了 DOM，这类只能通过 `suppressHydrationWarning` 之类的提示降噪，无法根治。
6. 系统性做法：首屏只渲染与数据相关的内容；纯客户端的内容用 `<ClientOnly>` 或挂载后再渲染；第三方脚本用 `onMounted` 内初始化；时区 / 语言相关的格式化固定 `locale` 与 `timeZone`。
7. 调试时看控制台的水合警告，它会指出具体组件与不匹配片段，再顺着该组件的渲染条件排查。

**追问与易错点**：

- 追问：Nuxt 3 里 `useFetch` 和原生 `fetch` 有什么差别？答：`useFetch` 是组合式封装，自动处理 SSR 取数、payload 传递、加载与错误状态与请求去重，`$fetch` 是底层调用，在 `setup` 顶层 `await` 才能参与 SSR。
- 陷阱：在 `setup` 顶层直接用 `window`，服务端渲染直接抛错，必须放在 `onMounted` 或做环境判断。
- 陷阱：把水合警告当噪音忽略，它会导致页面闪烁、事件绑定错位，甚至出现"点了没反应"。

### Q30 Vue DevTools 怎么高效用？`unplugin-auto-import` 这类自动化工具值不值得上？

**考察点**：基础但能体现工程经验，考调试手段与"便利 vs 隐式依赖"的取舍判断。

**参考答案**：

> **一句话结论**：DevTools 的组件树、时间线、Pinia 面板是排查响应式与状态问题的第一工具；自动导入（`unplugin-auto-import` / `unplugin-vue-components`）能显著减少样板代码，但代价是隐式依赖与构建期额外配置，团队要能接受。

1. 组件树面板看 `props`、`data`、`setup` 状态与组件层级，能直接定位"哪个组件没更新"。
2. 时间线（Timeline）记录事件、组件渲染与 Pinia 状态变更，用来验证某个操作是否触发了多余渲染。
3. Pinia 面板可视化查看每个 `store` 的 `state` / `getters`，并支持手动修改状态复现问题，比 `console.log` 高效得多。
4. `<Suspense>`、异步组件、`Teleport` 的内容在 DevTools 中也能正确展示，排查"渲染到哪去了"很有用。
5. `@vitejs/plugin-vue` 提供 `.vue` 单文件组件编译、`<script setup>` 语法与热更新（HMR）；`vite-plugin-vue-devtools` 可在浏览器内嵌调试面板。
6. `unplugin-auto-import` 自动导入 `ref` / `computed` / `watch` 等 API，省掉重复 `import`；`unplugin-vue-components` 自动注册组件并按需引入组件库样式。
7. 代价：隐式依赖让新人不知道符号从哪来，需要生成 `auto-imports.d.ts` / `components.d.ts` 才有类型提示，且这些文件应提交或至少在 CI 中生成，否则类型检查会失败。
8. 判断标准：中大型项目、团队规范统一时收益明显；小项目或多人协作习惯差异大时，显式 `import` 更稳妥。

**追问与易错点**：

- 追问：自动导入会让构建变慢吗？答：会引入额外的构建期转换与类型文件生成，但通常不是瓶颈；真正的瓶颈往往是依赖体积与包数量。
- 陷阱：用了自动导入但没配置 ESLint 的 globals，编辑器满屏 `no-undef`，需要装对应 ESLint 配置。
- 陷阱：`unplugin-vue-components` 只自动注册组件，函数式 API 的自动导入是 `unplugin-auto-import` 的职责，两者别混为一谈。

## 本章小结

- 通信选型按关系远近定：父子 `props` / `emit`，跨层级 `provide` / `inject`，任意组件 Pinia，命令式调用才用 `ref` + `defineExpose`。
- Vue3 的三大迁移断层要背牢：`$listeners` 并入 `$attrs`、`$on` / `$off` 与 `$children` 移除、`v-model` 默认名改为 `modelValue` 且 `.sync` 变 `v-model:xxx`。
- `keep-alive` 的 `include` / `exclude` 匹配的是组件 `name`，`<script setup>` 必须用 `defineOptions` 声明，否则缓存永远不生效。
- 路由守卫顺序固定为"组件离开 → 全局前置 → 复用更新 → 独享 → 解析 → 全局后置"，异步鉴权死循环靠白名单 + 结果缓存 + `return { ...to, replace: true }` 破解。
- Pinia 用扁平 `store` 取代 Vuex 的 `mutations` 样板，解构必须 `storeToRefs`，持久化靠插件或 `$subscribe` 写回。
- 性能优化先定位瓶颈：渲染过多用 `v-memo`，数据过大用虚拟列表与 `shallowRef`，频繁切换用 `v-show`，首屏过重用异步组件与路由懒加载。
- 类型与调试同样重要：`defineProps` 类型声明 + `InjectionKey` + `vue-tsc` 是 TS 底线，DevTools 的组件树与 Pinia 面板是排查响应式问题的第一现场。

<!-- COUNT: 30 -->
