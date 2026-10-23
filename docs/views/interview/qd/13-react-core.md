---
title: "第 13 章 React 核心原理与使用"
---

## 第 13 章 React 核心原理与使用

### Q1 你怎么理解 React 的设计理念？它到底解决了什么问题？

**考察点**：能不能用三句话把 React 的哲学讲清楚（声明式、组件化、单向数据流），而不是只会说"React 就是写页面的库"。

**参考答案**：

> **一句话结论**：React 的核心是"用声明式的组件描述 UI 状态，状态单向流动，框架负责把状态高效同步到 DOM"。

1. 声明式（Declarative）：你只描述"在某个状态下 UI 长什么样"，不写"先找节点、再改属性"的步骤。真正的 DOM 操作交给 React，好处是结果可预测、逻辑可测试。
2. 组件化（Component）：UI 拆成独立、可复用的组件，组件 = 输入 `props` + 内部 `state` + 输出 UI（UI = f(state)）。组件内部封装，对外只暴露 `props` 契约。
3. 单向数据流（One-way Data Flow）：数据从父组件通过 `props` 向下传，子组件不能改 `props`，要改只能通过父组件传下来的回调通知父级。数据流向明确，排查问题时顺着链路往上找即可。
4. 性能兜底：虚拟 DOM（Virtual DOM）+ 协调（Reconciliation）让 React 用最小的 DOM 操作完成更新；配合 Fiber 可中断渲染，保证复杂页面不卡顿。

**追问与易错点**：

- 追问：单向数据流和双向绑定冲突吗？答：不冲突。Vue 的 `v-model` 只是"绑定 value + 监听 input"的语法糖，底层仍是单向的 props 向下、事件向上。
- 陷阱：把"虚拟 DOM 一定比真实 DOM 快"当成结论。虚拟 DOM 的意义是"让开发者不用手写 DOM 操作"，单次操作真实 DOM 必然更快，胜在可预测与批量的 diff 收益。
- 陷阱：说 React 是 MVC 框架。React 只负责视图层（V），是"库"级别的定位，路由、状态管理都要生态补充。

### Q2 JSX 的本质是什么？它最终被编译成什么？

**考察点**：是否知道 JSX 只是语法糖、编译产物是函数调用，以及为什么必须 `import React`（旧版本）。

**参考答案**：

> **一句话结论**：JSX 是 `React.createElement(type, props, ...children)` 的语法糖，本质是 JavaScript 表达式，编译后就是普通的函数调用。

1. JSX 不是字符串模板，也不是 HTML，它是表达式：可以赋值给变量、可以放在 `if`/`return` 里、本身有返回值（返回 React 元素对象）。
2. 编译产物是一个普通对象，俗称 React 元素（React Element），关键字段是 `type`、`props`、`key`、`ref`，它只是"描述"，不是 DOM 节点。
3. 浏览器不认识 JSX，靠 Babel / TypeScript / SWC 编译。旧版本编译目标是 `React.createElement`，所以文件顶部必须 `import React from 'react'`。
4. 注意 JSX 的书写规则：`class` 要写 `className`、`for` 要写 `htmlFor`、标签必须闭合、`{}` 里可以放任意 JS 表达式。

```jsx
const el = <h1 className="title">你好</h1>;
// 编译后（经典 runtime）
const el = React.createElement('h1', { className: 'title' }, '你好');
```

**追问与易错点**：

- 追问：`{}` 里能不能写 `if` 语句？答：不能，只能用表达式，条件渲染用三元、`&&`，或提前抽到变量/函数里。
- 陷阱：说"JSX 会变成 DOM 字符串被 innerHTML 插入"。它是对象，最终由 `react-dom` 的渲染器创建真实 DOM 节点。
- 陷阱：忘记 JSX 里 `false`、`null`、`undefined`、`true` 不渲染，但 `0` 会渲染成 `0`，`{list.length && <X/>}` 会打印 0。

### Q3 `React.createElement` 和新的 jsx runtime 有什么区别？

**考察点**：是否知道 React 17 起 JSX 转换方式变了（自动运行时），以及两种方式的差异。

**参考答案**：

> **一句话结论**：功能等价，区别在"谁负责引入创建函数"——经典运行时靠你手动 `import React` 调 `createElement`，自动运行时（Automatic Runtime）由编译器自动从 `react/jsx-runtime` 引入 `jsx`/`jsxs`。

1. 经典运行时（Classic Runtime，React 17 之前）：编译结果是 `React.createElement(type, props, ...children)`，`props` 里包含 `children` 数组，因此必须显式 `import React`。
2. 自动运行时（Automatic Runtime，React 17 起）：编译结果是 `_jsx(type, props, key)`，由 Babel/TS 自动注入 import，代码里可以不写 `import React`。React 17 也为此把 `react/jsx-runtime` 单独发布。
3. 差异细节：`jsx` 用于单子元素（children 直接放在 props 里），`jsxs` 用于多子元素（children 是数组），`key` 从 props 中独立抽出作为第三个参数，不再出现在 `props.key` 上。
4. 实践意义：升级 react-scripts / Vite 后不再报"React 未使用"的 lint 警告，打包体积略小；类组件里仍可能需要 React（如 `React.Component`）。

```jsx
// 自动运行时编译结果（无需 import React）
import { jsx as _jsx } from 'react/jsx-runtime';
const el = _jsx('h1', { className: 'title', children: '你好' });
```

**追问与易错点**：

- 追问：为什么 `key` 要从 props 里拆出去？答：`key` 是给协调器（Reconciler）用的元信息，不该出现在组件收到的 `props` 里，独立成参数更清晰，也避免被透传。
- 陷阱：以为"不写 `import React` 就等于不用装 React"。运行时依然依赖 `react` 包提供的 `jsx` 函数，只是换了个入口。
- 陷阱：把 `createElement` 称为"创建 DOM"，它是创建 React 元素对象。

### Q4 `React.Fragment` 是干什么的？`key` 又是什么？

**考察点**：是否理解 Fragment 的用途，以及 `key` 在列表里的真实作用。

**参考答案**：

> **一句话结论**：Fragment 用来"把多个元素打包成一个返回值而不额外产生 DOM 节点"，`key` 则是给 React 用来在多次渲染间识别同一元素的身份标识。

1. Fragment 解决"组件必须返回单个根节点"的约束，写法有 `<React.Fragment>` 和短语法 `<>...</>` 两种。前者能带 `key`，后者不能。
2. Fragment 不产生真实 DOM，比用 `<div>` 包裹少一层节点，避免破坏 flex/grid 布局和选择器结构。
3. `key` 是 React 的"身份 ID"，在同层列表 diff 时用来判断旧节点能否复用。有 key 才可能做移动复排，无 key 只能按位置顺序对比。
4. 使用规则：key 必须在同一列表内唯一且稳定；`key` 不会被传入组件的 `props`，想用这个值要另起一个 prop（如 `id`）。

```jsx
{list.map(item => (
  <React.Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.desc}</dd>
  </React.Fragment>
))}
```

**追问与易错点**：

- 追问：Fragment 能不能带 `className`？答：不能，它不产生 DOM 节点，只能带 `key`（短语法连 `key` 都不支持）。
- 陷阱：认为"key 只是给 React 消除警告的"。key 直接决定 diff 时是复用节点还是销毁重建，写错 key 会导致组件内部 state 串位。
- 陷阱：为了方便写 `key={Math.random()}`。每次渲染 key 都变，旧节点全部卸载重建，性能崩坏、输入框失焦。

### Q5 函数组件和类组件有什么区别？现在怎么选？

**考察点**：能否从写法、状态、this、生命周期、复用方式几个维度对比，并给出明确的选型判断。

**参考答案**：

> **一句话结论**：函数组件用 Hooks 管状态、没有 this、逻辑复用靠自定义 Hook，是现在唯一推荐的写法；类组件只剩"错误边界"等少数场景还在用。

1. 状态与副作用：类组件用 `this.state` + `setState` + 生命周期；函数组件用 `useState`/`useReducer` + `useEffect`，把"相关逻辑写在一起"而不是按生命周期切碎。
2. this 与心智负担：类组件要注意 `this` 绑定（事件回调需 `bind` 或箭头函数），函数组件每次渲染都是独立闭包，没有 this 问题，但也因此有"闭包陷阱"。
3. 逻辑复用：类组件时代靠高阶组件（HOC）和 Render Props，容易嵌套地狱、props 命名冲突；函数组件用自定义 Hook，不增加组件树层级。
4. 性能与优化：类组件用 `PureComponent` / `shouldComponentUpdate`；函数组件用 `React.memo` + `useMemo` / `useCallback`。前者能精确比较新旧 state，后者在闭包模型下更依赖依赖数组。
5. 选型判断：新代码一律函数组件 + Hooks；只有错误边界（`componentDidCatch`）和需要实例方法（`useImperativeHandle` 可替代）时才写类。

**追问与易错点**：

- 追问：函数组件每次渲染都重新执行，函数内部变量会不会丢？答：普通变量会重建，跨渲染要保住的内容必须放到 `useState`/`useRef` 里。
- 陷阱：说"函数组件性能一定比类组件好"。差别主要在代码组织，性能取决于是否合理使用 `memo` 与依赖数组。
- 陷阱：认为函数组件没有生命周期"能力"。`useEffect` / `useLayoutEffect` / `useImperativeHandle` 已覆盖各类时机，只有错误捕获没法用 Hooks 替代。

### Q6 `props` 和 `state` 有什么区别？为什么不能直接改 state？

**考察点**：是否理解两者的定位差异，以及"不可变更新"的原因和写法。

**参考答案**：

> **一句话结论**：`props` 是父组件传进来的只读输入，`state` 是组件自己维护的可变内部数据；`state` 必须通过 `setState`/更新函数整体替换新对象，直接改不会触发渲染。

1. 归属不同：`props` 由外部决定、组件内只读；`state` 由组件自己初始化并维护，外部拿不到（要向外暴露只能通过回调或 ref）。
2. 更新方式不同：`props` 变化由父组件触发重渲染；`state` 通过 `setState`（类）或 `setX`（函数）触发。直接 `this.state.x = 1` 或 `obj.x = 1` 只改了内存，React 感知不到，界面不会更新。
3. 为什么不可变：React 用 `Object.is` 比较新旧引用判断"变没变"，原地改会让引用不变，`React.memo`、`useMemo`、`useEffect` 依赖全部失效，还会让时间旅行（如 Redux DevTools、撤销）无法回溯。
4. 正确写法是"造新对象"：对象用展开运算符、数组用 `concat`/`slice`/`map`/`filter`，嵌套层级要逐层复制，只改需要变的那一层。

```js
// 函数组件：逐层复制，保证每层引用都变
setUser(prev => ({ ...prev, profile: { ...prev.profile, age: 19 } }));
setList(prev => prev.map(i => (i.id === id ? { ...i, done: true } : i)));
```

**追问与易错点**：

- 追问：什么时候必须用函数式更新？答：新值依赖旧值，或同一轮里连续更新同一份 state 时，必须传函数，否则拿到的是同一次渲染的旧快照。
- 陷阱：以为给 state 赋值不生效是"React 的 bug"。React 只知道引用变没变，原地修改等于什么都没做。
- 陷阱：`props` 是只读的，但说成"`props` 不可变"。父组件重新渲染时会传新的 `props` 进来，只是子组件不能自己改。

### Q7 `setState` 到底是同步还是异步？React 18 的自动批处理是怎么回事？

**考察点**：这题区分度极高，要能说清"不是异步 API 而是批量调度"，以及 React 18 前后的差异。

**参考答案**：

> **一句话结论**：`setState` 本身是同步调用、立即入队，但状态更新与 DOM 渲染被"批处理（Batching）"推迟到当前执行栈结束后统一进行，所以读起来像异步。

1. React 17 及之前：只有在 React 的合成事件处理函数和生命周期中才会批量更新；在 `setTimeout`、`Promise.then`、原生 `addEventListener` 回调里调用 `setState` 会同步走完一次渲染（想强制批量要用 `unstable_batchedUpdates`）。
2. React 18 起：用 `createRoot` 挂载时开启自动批处理（Automatic Batching），所有场景——定时器、Promise、原生事件、`await` 之后——的更新都自动合并，一个事件循环内的多次 `setState` 只渲染一次。
3. 例外：`flushSync` 会强制同步刷出更新，用于"改完 state 立刻读 DOM"的场景（如测量、第三方库集成）。
4. 为什么看起来"异步"：渲染是调度行为，React 需要在一次宏任务里收集完所有更新，才能算出最终状态、少做一次 DOM 操作。
5. 怎么拿最新值：类组件用 `setState` 的第二个参数回调或 `componentDidUpdate`；函数组件在 `useEffect`/`useLayoutEffect` 里读，或直接 `console.log` 在渲染函数中看。

```jsx
function Demo() {
  const [n, setN] = useState(0);
  const handle = () => {
    setN(n + 1); setN(n + 1);   // 同一快照，结果仍然是 1
    setTimeout(() => setN(p => p + 1), 0); // React 18 也批处理
  };
  return <button onClick={handle}>{n}</button>;
}
```

**追问与易错点**：

- 追问：为什么 `setN(n + 1)` 调两次只加 1？答：两次都用同一次渲染闭包里的 `n`，覆盖式更新；改成 `p => p + 1` 就能拿到累计结果。
- 陷阱：说"React 17 里 `setState` 是异步的，React 18 改成同步了"。方向说反了，18 是扩大了批处理范围，让"异步（批处理）"覆盖面更广。
- 陷阱：认为 `flushSync` 是常规优化手段。它会打断批处理、强制同步渲染，滥用会掉帧，应尽量少用。

### Q8 `setState` 传对象和传函数有什么区别？什么时候必须传函数？

**考察点**：是否知道函数式更新能拿到最新状态，以及对象式更新是浅合并还是替换。

**参考答案**：

> **一句话结论**：传对象是"覆盖式提交"，多次调用会互相覆盖；传函数是"基于最新状态的更新队列"，每次都能拿到前一次的结果。

1. 类组件的 `setState(obj)` 做浅合并（Shallow Merge），只覆盖传入的字段，其余 state 保留；函数组件的 `setX(obj)` 是整体替换，对象类型必须自己展开旧值。
2. 传函数 `setX(prev => next)` 时，React 会按入队顺序依次执行 updater，`prev` 永远是前一次更新后的结果，因此连续调用会正确累加。
3. 必须传函数的两种场景：新值依赖旧值（累加、取反、切换）；同一个事件里对同一 state 多次更新。
4. 传函数的额外好处：updater 内不依赖外部闭包变量，天然规避"闭包陷阱"，也便于把更新逻辑抽成纯函数测试。

```jsx
// 类组件：返回 null 时 React 不更新，可用于"值没变就不渲染"
this.setState(prev => (prev.count >= 10 ? null : { count: prev.count + 1 }));

// 函数组件：对象类型要展开，否则数组/对象字段会丢
setForm(prev => ({ ...prev, name: 'a' }));
```

**追问与易错点**：

- 追问：函数组件里 `setX({a:1})` 会不会把其他字段保留？答：不会，`useState` 不做浅合并，必须 `{...prev, a: 1}`，这是和类组件 `setState` 最容易踩混的一点。
- 陷阱：一边用函数式更新，一边在 updater 里改外部变量（如 `updater` 里 `list.push`）。updater 必须是纯函数，否则并发特性下会执行多次导致结果出错。
- 陷阱：以为"传函数一定更好"。无依赖的直接赋值（如 `setOpen(false)`）传值更直观，没必要包成函数。

### Q9 什么是受控组件和非受控组件？表单里怎么选？

**考察点**：能否给准确判定标准（数据源在 React 还是在 DOM），并说出各自适用场景。

**参考答案**：

> **一句话结论**：受控组件的值由 React 的 state 驱动（`value` + `onChange` 闭环），非受控组件的值存在 DOM 里、由浏览器自己维护（用 `defaultValue` + `ref` 读取）。

1. 受控：`<input value={v} onChange={e => setV(e.target.value)} />`。组件是"唯一数据源"，能实时校验、联动、格式化，代价是每次输入都触发一次渲染。
2. 非受控：`<input defaultValue="x" ref={ref} />`，提交时从 `ref.current.value` 取值。代码量小、渲染开销低，适合简单表单和文件输入。
3. 硬约束：`<input type="file" />` 的值只能由用户设置，必须用非受控；`value` 传了却不给 `onChange`，React 会渲染成只读并警告。
4. 选型：需要即时校验/联动/提交前统一管理就用受控；表单庞大且性能敏感、或对接第三方 UI 库探索性使用时用非受控，中间路线是用 `react-hook-form` 这类"非受控 + 订阅"方案。
5. 注意 `value={undefined}` 与 `value=""` 的区别：前者等价于非受控（React 会警告），后者是明确的空受控值。

```jsx
// 受控：唯一数据源在 React
<input value={name} onChange={e => setName(e.target.value)} />

// 非受控：值在 DOM，需要时才读
const ref = useRef(null);
<input defaultValue={name} ref={ref} />
// 提交：ref.current.value
```

**追问与易错点**：

- 追问：为什么 `value` 不给 `onChange` 输入框就敲不动了？答：React 把 `value` 写死在 DOM 上，用户输入后 React 又用旧值覆盖回去，表现就是"没反应"，警告也提示了这一点。
- 陷阱：非受控组件用 `value` 而不是 `defaultValue` 初始化。`value` 是持续受控，`defaultValue` 才是只设初始值。
- 陷阱：认为受控组件"性能一定差"。绝大多数表单无所谓，真要优化应换非受控或订阅式方案，而不是加 `useMemo` 硬扛。

### Q10 什么是合成事件（SyntheticEvent）？React 为什么把事件委托到根节点？

**考察点**：是否理解合成事件是包装层、事件委托的实现位置，以及这样做带来的收益与坑。

**参考答案**：

> **一句话结论**：合成事件是 React 自己实现的一套跨浏览器事件对象，所有事件统一委托绑定在根容器上，再按 React 组件树模拟冒泡派发到对应组件。

1. 动机：一是抹平浏览器差异（IE 的 `attachEvent`、`event.target` 兼容等），二是避免给成千上万个节点各绑一个监听器，减少内存与解绑成本。
2. 实现：React 在根容器上对每种事件只注册一个原生监听器，事件触发后由 `target` 向上找 Fiber 节点，收集所有绑定了 `onXxx` 的组件，按"捕获 → 目标 → 冒泡"顺序依次调用，事件对象是一层包装（`e.nativeEvent` 可取原生事件）。
3. 与原生事件的关系：合成事件的冒泡是"React 树上的模拟冒泡"，因此 Portal 里的元素事件能冒到 React 父组件；但 `e.stopPropagation()` 只截断合成事件链，不阻止原生事件继续向外传播。
4. 版本变化：React 16 及之前把委托绑在 `document` 上；React 17 起改为绑定在根容器（`createRoot`/`ReactDOM.render` 的容器节点）上，多版本 React 共存时不再互相干扰。
5. 事件池（Event Pooling）在 React 17 已移除，异步访问 `e` 不再需要 `e.persist()`。

**追问与易错点**：

- 追问：`onChange` 和原生 `change` 一样吗？答：不一样，React 的 `onChange` 行为接近原生 `input`（每次输入都触发），这是最容易踩的一个差异。
- 陷阱：把合成事件当成原生事件用 `e.nativeEvent.stopImmediatePropagation()` 去阻止 document 上的监听器，写法依赖 React 版本，跨版本不可靠。
- 陷阱：以为在容器外层（如 `document`）通过 `addEventListener` 捕获能拿到 React 事件顺序的保证。原生监听器与 React 委托的先后顺序取决于绑定位置，不要依赖。

### Q11 `useState` 的实现原理是什么？Hook 链表是怎么存的？

**考察点**：是否知道 Hook 状态挂在 Fiber 节点上、以调用顺序索引，能说出 `memoizedState` 与更新队列的关系。

**参考答案**：

> **一句话结论**：每个函数组件对应一个 Fiber 节点，Fiber 的 `memoizedState` 指向一条 Hook 链表，每个 Hook 按调用顺序排列，状态存在各自的 `memoizedState` 和更新队列 `queue` 里。

1. 首次渲染（mount）时，`useState` 调用 `mountState`：创建 `{ memoizedState: initialState, queue: {...}, next: null }` 对象，串到链表尾部，返回 `[state, dispatch]`。
2. 更新渲染（update）时，调用 `updateState`：不新建 Hook，而是沿 `fiber.memoizedState` 链表按顺序取下一个 Hook，把 `queue.pending` 里累积的更新（环形链表）依次用 reducer 算出新 `memoizedState`。
3. 所以 Hook 的"身份"不是变量名，而是调用顺序。这就是 Hooks 规则的原因：顺序错乱 → 取到别的 Hook 的状态。
4. `useState` 本质是 `useReducer` 的特例，reducer 是 `basicStateReducer`（传函数就调用，否则直接替换）；`dispatch` 每次渲染回来的是同一个引用（内部挂 `dispatchSetState`），因此在依赖数组里可以安全省略。
5. 更新入队后，`dispatchSetState` 会计算 lane 优先级并调度（`scheduleUpdateOnFiber`），最终触发重新渲染。

**追问与易错点**：

- 追问：为什么 `dispatch` 不需要放进 `useEffect` 依赖数组？答：React 保证引用稳定（同一次挂载内不变），写进去也不会出错，但属于多余依赖。
- 陷阱：说"`useState` 的状态存在闭包里"。闭包里的是当次渲染的快照，真正持久化的是 Fiber 上的 Hook 链表。
- 陷阱：以为 `setState` 后当前函数里的变量会更新。同一渲染内所有变量都是常量快照，下一次渲染才是新值。

### Q12 Hooks 有哪些使用规则？为什么不能写在条件或循环里？

**考察点**：能否从"链表按顺序索引"的角度解释规则，并说出 `eslint-plugin-react-hooks` 的作用。

**参考答案**：

> **一句话结论**：Hooks 只能在函数组件（或自定义 Hook）的顶层、每次渲染都按同样顺序调用，因为 React 完全依赖调用顺序来匹配每个 Hook 的状态。

1. 三条规则：只在 React 函数组件或自定义 Hook 里调用；只在顶层调用，不能放在 `if`、`for`、`while`、`try/catch`、嵌套函数中；命名必须以 `use` 开头（否则 lint 无法识别、无法校验依赖）。
2. 原因：Hook 状态存在 Fiber 的链表里，第 N 次调用对应的就是链表第 N 个节点。条件语句让某次渲染少调一次，后面的 Hook 就整体错位，读到别的 Hook 的状态。
3. 后果：轻则状态错乱（`count` 读到 `name` 的值），重则直接抛错 `Rendered fewer hooks than expected`（提前 `return` 也会触发）。
4. 正确写法：条件和循环放在 Hook 内部或组件内部逻辑里；需要"有条件的副作用"，就把判断写进 `useEffect` 的回调里。
5. 工程保障：用 `eslint-plugin-react-hooks` 的 `rules-of-hooks`（顺序规则）和 `exhaustive-deps`（依赖完整）两条规则在提交前拦住。

```jsx
// 错误：条件调用，渲染次数不同则顺序错乱
if (visible) { const [x, setX] = useState(0); }

// 正确：Hook 无条件调用，条件放内部
const [x, setX] = useState(0);
useEffect(() => { if (visible) { /* ... */ } }, [visible]);
```

**追问与易错点**：

- 追问：自定义 Hook 里可以写 `if` 吗？答：可以写，但不能用 `if` 包住 Hook 调用；自定义 Hook 也必须保证每次调用顺序一致，规则与组件一致。
- 陷阱：把 Hook 写在 `useMemo` 的回调、事件处理函数、`setTimeout` 里。这些都不是渲染路径，React 无法追踪。
- 陷阱：以为"报错只在开发环境"。链表错位在开发态有检测提示，生产环境可能静默产生错误行为。

### Q13 `useEffect` 什么时候执行？清理函数又在什么时候跑？

**考察点**：是否知道 effect 是"渲染提交后"执行、异步于绘制，以及清理的时机与用途。

**参考答案**：

> **一句话结论**：`useEffect` 在组件渲染、DOM 提交完成、浏览器绘制之后异步执行；清理函数在下一次 effect 执行前和组件卸载时各执行一次。

1. 执行链路：render 阶段算出变更 → commit 阶段更新 DOM → 浏览器绘制 → React 调度并执行 passive effect（`useEffect` 回调）。因此它不会阻塞绘制，适合发请求、订阅、打日志、操作 DOM。
2. 时序判断：因为异步于绘制，effect 里直接读 `ref.current.getBoundingClientRect()` 可能拿到"已经画到屏幕上的结果"，可能闪烁；需要"改 DOM 后立刻测、不让用户看到中间态"就该用 `useLayoutEffect`。
3. 清理函数用途：取消订阅、清除定时器、中断请求（`AbortController`）、移除手动绑定的事件监听，防止内存泄漏和"更新已卸载组件"的警告。
4. 清理时机：依赖变化 → 先执行上一次的清理，再执行本次 effect；组件卸载 → 执行最后一次清理。React 18 严格模式下开发环境会额外做一次"模拟卸载"，即挂载 effect 执行两次。
5. 依赖数组三种写法：不传 → 每次渲染后都执行（含清理）；`[]` → 只在挂载后执行、卸载时清理；`[a, b]` → 初值挂载执行一次，之后任一依赖按 `Object.is` 变化才执行。

**追问与易错点**：

- 追问：`useEffect` 里能直接写 `async` 吗？答：不能，回调必须是同步函数或返回清理函数。要异步就在内部定义 `async function` 并调用，或在清理里用标志位/AbortController 防止竞态。
- 陷阱：认为 `useEffect(() => {}, [])` 一定只执行一次。依赖为空只保证"依赖没变时不重复执行"，React 18 严格模式开发态仍会执行两次。
- 陷阱：清理函数里写异步逻辑却不处理竞态。旧请求晚到会覆盖新结果，必须用取消标记或 `AbortController`。

### Q14 依赖数组怎么写？闭包陷阱是怎么产生的？

**考察点**：能否说清"依赖不全导致读到旧值"的机制，并给出三种以上可行解法。

**参考答案**：

> **一句话结论**：每次渲染都会生成一份新的 props/state 快照，effect 回调捕获的是当次渲染的闭包；依赖数组不全，回调就不会在值变化时重新创建，于是永远读到旧值。

1. 依赖比较规则：React 用 `Object.is` 逐项比较依赖数组，不是深比较。对象、数组、函数字面量每次渲染都是新引用，写进依赖会导致 effect 每次都执行。
2. 典型陷阱：`useEffect(() => { setInterval(() => setCount(count + 1), 1000) }, [])`——`count` 被永久锁在 0。同理，事件处理器里读到的也是注册那一刻的旧值。
3. 解法一：补全依赖，让 React 每次值变化时重建副作用（可能带来频繁重建的代价，配合清理函数即可）。
4. 解法二：用函数式更新（`setCount(c => c + 1)`）或 `useReducer`，把"读旧值"改成"基于最新值计算"，从根上消除依赖。
5. 解法三：用 `useRef` 保存最新值（`ref.current = value` 写在 effect 里或用 `useLatest` 自定义 Hook），让回调通过 `ref` 读最新值——适合定时器、订阅回调等"只想建立一次"的场景。
6. 辅助工具：`exhaustive-deps` 的自动补全建议基本可信，除非你明确要"只执行一次"；此时用注释说明并配合 ref。

```js
// 反例与修正
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000); // 函数式更新
  return () => clearInterval(id);
}, []); // 依赖不再需要 count
```

**追问与易错点**：

- 追问：把对象放进依赖，每次渲染都触发 effect 怎么办？答：在组件外用 `useMemo` 稳定对象引用，或把对象拆成基本类型字段放进依赖数组。
- 陷阱：为了"消除警告"而无脑加 `// eslint-disable-next-line`，把真正的旧值 bug 一起屏蔽掉。
- 陷阱：依赖数组里写 `props` 整体而不是具体字段。`props` 每次渲染都是新对象，effect 会执行到崩溃。

### Q15 `useEffect` 和 `useLayoutEffect` 有什么区别？怎么选？

**考察点**：是否知道两者在"绘制前/绘制后"的时序差异，以及各自会造成什么现象。

**参考答案**：

> **一句话结论**：`useLayoutEffect` 在 DOM 变更后、浏览器绘制前同步执行，会阻塞绘制；`useEffect` 在绘制后异步执行，不阻塞。默认用 `useEffect`，只有需要在用户看到之前同步测量/修改 DOM 时才用 `useLayoutEffect`。

1. 时序：render（计算变更）→ commit（改 DOM）→ `useLayoutEffect` 同步执行 → 浏览器绘制 → `useEffect` 异步执行。
2. 后果差异：要"根据 DOM 尺寸决定是否显示 tooltip"，用 `useEffect` 会先画出错误位置再跳一下（闪烁）；用 `useLayoutEffect` 会在绘制前改完，用户看不到中间态。
3. 代价：`useLayoutEffect` 阻塞绘制，逻辑重会拖慢首屏；且服务端渲染（SSR）时不存在 DOM，会发出警告（React 建议 SSR 场景改用 `useEffect` 或 `useIsomorphicLayoutEffect` 模式）。
4. 选择标准：只读数据、发请求、订阅、日志 → `useEffect`；读写布局、测量尺寸、同步滚动位置、需要在 paint 前"再修一次 DOM" → `useLayoutEffect`。
5. 清理时机两者一致：依赖变化时先清理后执行，卸载时执行最后一次清理。

**追问与易错点**：

- 追问：为什么 `useLayoutEffect` 里改 state 不会多闪一次？答：它同步执行，React 会在浏览器绘制前把这次更新一起 flush 掉，合成一次绘制。
- 陷阱：认为两者"只是执行早一点晚一点，可以随便换"。在 SSR 下 `useLayoutEffect` 会产生警告，且阻塞绘制对动画敏感页面影响明显。
- 陷阱：把测量 DOM 的代码放进 `useEffect` 然后抱怨页面抖动，这是典型的时序选错。

### Q16 `useMemo` 和 `useCallback` 有什么区别？什么时候该用、什么时候是滥用？

**考察点**：能否说清两者缓存的对象不同（值 vs 函数引用），并给出有判断力的取舍标准。

**参考答案**：

> **一句话结论**：`useMemo` 缓存计算结果，`useCallback` 缓存函数引用；二者都只是性能优化手段，不是语义保证，只有"依赖不常变 + 下游确实依赖该引用"时才值得用。

1. 等价关系：`useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`，前者是后者的语法糖。共同点：依赖按 `Object.is` 比较，不变就复用上次的缓存。
2. 该用的场景：计算的代价明显偏高（大数组排序/过滤、复杂转换）；对象/数组/函数要作为 prop 传给 `React.memo` 子组件；作为 `useEffect` 的依赖要避免反复触发。
3. 不该用的场景：廉价计算（`a + b`、简单字符串拼接）——每次比较依赖的开销可能比计算还大；没有配合 `React.memo` 时给子组件传 `useCallback` 函数毫无意义，子组件照样渲染。
4. 滥用代价：代码噪音、依赖数组漏写引入新 bug、占用内存；官方文档明确说 `useMemo` 是性能优化而非语义保证，"未来可能丢弃某些缓存"，所以不能靠它保证正确性（例如不能靠 `useMemo` 保证副作用只执行一次）。
5. 对比 Vue 的 `computed`：`computed` 是响应式自动追踪依赖并缓存派生值，语义上是"派生状态"；`useMemo` 依赖必须手写，更偏"手动性能开关"，两者定位不同。

```jsx
// 有价值：昂贵计算 + 稳定引用
const visible = useMemo(() => list.filter(i => i.done), [list]);
const onToggle = useCallback(id => setList(p => p.map(i => (i.id === id ? { ...i, done: !i.done } : i))), []);
```

**追问与易错点**：

- 追问：`useMemo` 能替代 `useState` 保存状态吗？答：不能。它的缓存可能在内存压力下被丢弃，且不触发渲染；要持久保存用 `useState` 或 `useRef`。
- 陷阱：给所有函数都套 `useCallback`，结果依赖数组里放了每次新建的对象，缓存 100% 失效，等于白写还多一层开销。
- 陷阱：用 `useMemo` 包住一个有明显副作用的表达式（发请求、改外部变量），依赖变化与否不可控，行为不可预测。

### Q17 `React.memo`、`PureComponent`、`shouldComponentUpdate` 有什么区别？浅比较是怎么回事？

**考察点**：是否理解三者的作用范围与"浅比较"的边界，以及为什么优化常常失效。

**参考答案**：

> **一句话结论**：三者都是"用浅比较决定要不要重新渲染"的优化手段：`PureComponent` 和 `shouldComponentUpdate` 作用于类组件，`React.memo` 作用于函数组件的 `props`；浅比较只比第一层，引用变了就认为变了。

1. `PureComponent`：React 提供的类组件基类，自动对 `props` 和 `state` 做浅比较，相等就跳过渲染，不用手写逻辑；继承自 `Component` 的普通类组件默认总是渲染。
2. `shouldComponentUpdate(nextProps, nextState)`：手写比较逻辑，返回 `false` 跳过本次渲染。能精确控制（比如只比 `id`），但容易写漏字段导致 UI 不更新。
3. `React.memo(Component, areEqual?)`：高阶组件，对 `props` 做浅比较，相等则复用上次渲染结果；第二个参数可自定义比较函数。它只看 `props`，也拦不住内部 `state` 变化和 `context` 变化。
4. 浅比较规则：`Object.is` 比第一层每个键值。基础类型比值得，对象/数组/函数比引用——父组件传内联 `style={{}}`、内联箭头函数、每次新建的数组，浅比较必然不相等，优化立刻失效。
5. 配套要求：`React.memo` + `useCallback`/`useMemo` 是一套组合拳；只加 `memo` 不改传参方式，通常等于没加。

```jsx
const Row = React.memo(function Row({ item, onSelect }) {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>;
});
// 父组件必须稳定 onSelect，否则 memo 失效
const onSelect = useCallback(id => setSelected(id), []);
```

**追问与易错点**：

- 追问：`React.memo` 第二参数能不能写 `() => true` 让它永不重渲？答：能写但危险，props 变了也不渲染会造成 UI 与数据不一致；只在明确"这些 props 变化不需要反映到 UI"时使用。
- 陷阱：以为 `memo` 能阻止父组件重渲染带来的 `context` 更新。`context` 变化会穿透 `memo`，子组件照样渲染。
- 陷阱：默认导出写成 `export default React.memo(X)` 后又忘了给它加 `displayName`，调试时组件名丢失（不影响功能，影响排查效率）。

### Q18 `useRef` 有哪两种用法？它和 `useState`、普通变量有什么区别？

**考察点**：能否区分"存 DOM 引用"和"存跨渲染可变值"两种场景，并知道改 ref 不触发渲染。

**参考答案**：

> **一句话结论**：`useRef` 返回一个跨渲染稳定存在的 `{ current }` 对象，改它不会触发渲染；主要用来拿 DOM 节点，或保存"不需要参与渲染"的可变值。

1. 语法与特性：`const ref = useRef(initial)`。整个生命周期内返回同一个对象，`current` 可读写；React 不在渲染间重建它。注意 `useRef(x)` 的初始值只在首次渲染生效。
2. 用法一（存 DOM）：`<input ref={inputRef} />`，挂载后 `inputRef.current` 指向真实 DOM 节点，卸载时被置为 `null`。可在 `useEffect` / `useLayoutEffect` 或事件回调里访问，不能在渲染期间读取（此时 DOM 还没建好）。
3. 用法二（存值）：保存定时器 ID、上一次的值、请求序号、"是否首次渲染"标志、最新 props 快照等。这些值变了不需要重新渲染，用 `useState` 反而会多渲染一轮。
4. 与普通变量的区别：函数组件每次渲染都重新执行，普通变量会被重置；ref 存在 Fiber 上，跨渲染保留。
5. 与 `useState` 的区别：`state` 触发渲染且在同一渲染内是只读快照；`ref.current` 立即生效但不触发渲染，两者可以配合（`ref` 存最新值，`state` 驱动 UI）。

```jsx
const timer = useRef(null);
useEffect(() => {
  timer.current = setInterval(tick, 1000);
  return () => clearInterval(timer.current); // 卸载时清理
}, []);
```

**追问与易错点**：

- 追问：为什么渲染期间不能读 `ref.current`？答：首次渲染时 DOM 尚不存在（值为 `null`），并发渲染下还可能读到未提交的值，React 官方明确不保证其一致性。
- 陷阱：把 `ref` 当"响应式变量"用，改完 `ref.current` 等界面更新。它不会触发渲染，UI 不会变。
- 陷阱：用 `useRef(expensiveInit())` 做昂贵初始化。参数每次渲染都会被求值（只是没被采用），要用惰性写法 `useState(() => ...)` 或 `if (ref.current == null)` 判断后赋值。

### Q19 `useReducer` 和 `useState` 怎么选？

**考察点**：是否知道 `useReducer` 适合什么样的状态逻辑，并能与 Redux 的 reducer 概念对齐。

**参考答案**：

> **一句话结论**：`useReducer` 把"如何更新状态"抽成纯函数 reducer，适合状态字段多、更新逻辑复杂或下一状态依赖上一状态的场景；简单独立的状态用 `useState` 更省事。

1. 用法：`const [state, dispatch] = useReducer(reducer, initArg, init)`。`reducer(state, action)` 返回新状态，必须纯函数；`dispatch` 引用稳定，可安全地往下传或省略在依赖数组里。
2. 适合 `useReducer` 的信号：一个 state 对象有多个互相关联的子字段（如表单、购物车）；多个事件以不同方式改同一份数据；更新逻辑需要复用或单独测试；下一状态强依赖上一状态。
3. 优势：把散落在各处的 `setXxx` 收敛成"action + 一处 reducer"，逻辑可读、可测试、可加日志；配合 `useContext` 可做轻量级全局状态管理（Community 常见的 "Context + useReducer" 模式）。
4. 相对 Redux 的差异：这里的 state 仍属于单个组件（除非提到 Provider 里），没有中间件、时间旅行、跨组件订阅，复杂场景仍建议上 Redux Toolkit 或 Zustand。
5. 代价：模板代码更多，简单场景反而绕；`dispatch` 与 `useState` 的 setter 走同一套调度与批处理，性能接近。

```js
function reducer(state, action) {
  switch (action.type) {
    case 'inc': return { ...state, count: state.count + action.step };
    case 'reset': return initState;
    default: throw new Error('未知 action: ' + action.type);
  }
}
```

**追问与易错点**：

- 追问：reducer 里能发请求、写 localStorage 吗？答：不能，reducer 必须纯；副作用放 `useEffect` 或事件处理函数里。
- 陷阱：`dispatch` 后立即读 `state` 拿新值（同 Q7，仍是旧快照）。
- 陷阱：reducer 里直接改 `state` 字段返回同一引用，导致 `Object.is` 判定没变、不渲染。必须返回新对象。

### Q20 `createContext` 和 `useContext` 怎么用？Provider 的 value 变化会带来什么影响？

**考察点**：是否理解 Context 解决的是"跨层级传参"，也知道它会引起消费者重渲染这一代价。

**参考答案**：

> **一句话结论**：`createContext(defaultValue)` 造出上下文对象，`<Provider value={...}>` 提供值，任意深度的后代用 `useContext(Ctx)` 读取；`value` 按 `Object.is` 比较，一旦变化，所有读取该 Context 的组件都会重新渲染，`React.memo` 拦不住。

1. 基本用法：`const ThemeCtx = createContext('light')`；订阅用 `const theme = useContext(ThemeCtx)`。`createContext` 的参数是"找不到 Provider 时的兜底值"，不是初始值。
2. 解决的问题：避免 props 逐层透传（prop drilling），常用于主题、语言、登录用户、dispatch 等"全局但低频变化"的数据。
3. 渲染影响：Provider 的 `value` 变了，所有消费者重渲染；即使消费者被 `React.memo` 包裹也无效，因为更新来自 context 而非 props。
4. 优化手段：把 `value` 用 `useMemo` 稳定住（`useMemo(() => ({user, setUser}), [user])`）；按"变化频率"拆成多个 Context（如 UserContext 与 ThemeContext 分开）；把数据与 dispatch 拆成两个 Context；超高频更新改用外置 store + `useSyncExternalStore`。
5. 注意默认值陷阱：忘了包 Provider 时会静默使用默认值，容易调试半天，可在自定义 Hook 里判断 `undefined` 并抛错。

```jsx
const ThemeCtx = createContext(null);
export function useTheme() {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error('useTheme 必须在 ThemeProvider 内使用');
  return v;
}
```

**追问与易错点**：

- 追问：Context 能替代 Redux 吗？答：低频、读多写少的数据可以；高频更新、需要中间件/选择性订阅/时间旅行的场景不行，后者正因 Context 会全量重渲染。
- 陷阱：`<Provider value={{ user, setUser }}>` 每次渲染新建对象，所有消费者无条件重渲染，这是最常见的 Context 性能问题。
- 陷阱：以为 `useContext` 是"订阅某个字段"。它订阅的是整个 Context 值，没有选择性订阅能力。

### Q21 `forwardRef` 和 `useImperativeHandle` 是干什么的？什么时候可以操作 DOM？

**考察点**：是否知道函数组件默认接收不到 `ref` 的原因，以及"暴露最小接口"的封装思想与操作 DOM 的边界。

**参考答案**：

> **一句话结论**：函数组件默认不能接收 `ref`（没有实例），要用 `forwardRef` 把 `ref` 透传到内部 DOM 或子组件，再配合 `useImperativeHandle` 只暴露必要的方法，而不是把整个 DOM 节点交给外部。

1. 为什么需要 `forwardRef`：`ref` 是特殊属性，不会出现在 `props` 里；函数组件没有实例，React 无法自动挂载，所以要么用 `forwardRef((props, ref) => ...)`，要么在 React 19 及以后直接把 `ref` 当普通 prop 传递。
2. `useImperativeHandle(ref, () => ({ focus, validate }), deps)`：自定义父组件通过 `ref.current` 能拿到什么，封装内部实现，外部只能调约定方法，避免外部乱改 DOM。
3. 典型场景：封装通用输入框/弹窗/表格组件，父组件需要 `focus()`、`open()`、`scrollTo()`、`validate()`；与图表库、富文本、地图 SDK 集成。
4. DOM 操作的边界：优先让数据流驱动 UI（改 `state` 让 React 渲染）；只有 React 表达不了的才碰 DOM——焦点管理、滚动定位、尺寸测量、媒体播放、第三方命令式库集成、文件选择。
5. 安全做法：把 DOM 操作集中在 `useEffect`/`useLayoutEffect` 或事件回调里；不要在渲染期间读写 DOM；能用 `useRef` 加 DOM API 解决的就别引入 jQuery 式操作。

```jsx
const FancyInput = forwardRef((props, ref) => {
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; },
  }), []);
  return <input ref={inputRef} {...props} />;
});
// 父组件：inputRef.current.focus()
```

**追问与易错点**：

- 追问：`useImperativeHandle` 的依赖数组能省吗？答：能省，但会导致每次渲染都重建暴露对象；如果外部把该对象放进依赖数组，就会反复触发，建议按实际依赖填写。
- 陷阱：`useImperativeHandle(ref, () => inputRef.current)` 直接把 DOM 节点暴露出去，等于放弃了封装，外部会依赖内部结构。
- 陷阱：在函数组件上直接写 `<Child ref={r} />` 却没做转发，`r.current` 永远是 `null`（旧版本还会报 "Function components cannot be given refs"）。

### Q22 React 17 把事件绑定的位置改到了哪里？为什么改？

**考察点**：是否知道"从 document 移到根容器"这个变化及动机，属于版本差异类高频题。

**参考答案**：

> **一句话结论**：React 17 之前，所有合成事件统一委托在 `document` 上；React 17 起改为委托到每个 React 根容器（`ReactDOM.render` 的容器或 `createRoot` 的容器）上。

1. 变更内容：不再是全局一个 `document` 监听器，而是每个根各自绑定。事件派发范围随根容器走，而不是整个页面。
2. 动机一：渐进升级。页面里可以同时挂 React 17 和 React 18 两个根，各自事件互不干扰；之前在 `document` 上会让新老版本的 `e.stopPropagation()` 互相影响。
3. 动机二：多版本/多运行时共存（如微前端、部分嵌入），事件边界与 DOM 归属一致，行为更可预测。
4. 动机三：与原生事件顺序更自然。之前一条 `document` 上的原生监听器可能先于 React 处理，也可能后于，取决于绑定时机；改到根容器后，React 事件在容器内先完成派发。
5. 实践影响：依赖"在 `document` 上监听并阻止 React 事件"的旧写法可能失效；`e.stopPropagation()` 对容器外原生监听器的效果也随版本变化，跨版本代码不要依赖顺序。

**追问与易错点**：

- 追问：Portal 渲染到 `body` 的弹窗，事件还按 React 树冒泡吗？答：是，合成事件按 React 树（即 Fiber 树）模拟冒泡，所以能冒到 React 父组件，这与 DOM 层级无关。
- 陷阱：说"React 17 改成事件委托到 body"。是委托到每个根容器节点，`body` 只是你挂载容器的常见选择，不是 React 的规则。
- 陷阱：以为 `stopPropagation` 能拦住所有原生监听器。它只作用于 React 合成事件链，原生监听器是否执行取决于绑定位置与阶段。

### Q23 类组件的生命周期有哪些？分别对应哪个 Hook？

**考察点**：能否把挂载/更新/卸载三个阶段和 Hooks 一一对应，并说出被废弃的旧 API。

**参考答案**：

> **一句话结论**：挂载是 `constructor` → `render` → `componentDidMount`，更新是 `shouldComponentUpdate`/`render`/`getSnapshotBeforeUpdate` → `componentDidUpdate`，卸载是 `componentWillUnmount`；Hooks 里对应 `useEffect` 的三种依赖写法，`getSnapshotBeforeUpdate` 对应 `useLayoutEffect`。

1. 挂载阶段：`constructor`（初始化 state、绑定 this）→ `static getDerivedStateFromProps`（少见，用于 props 派生 state）→ `render` → `componentDidMount`（DOM 已就绪，发请求、订阅、操作 DOM）。Hook 对应 `useEffect(fn, [])`，需要同步测 DOM 用 `useLayoutEffect(fn, [])`。
2. 更新阶段：`getDerivedStateFromProps` → `shouldComponentUpdate`（返回 false 跳过）→ `render` → `getSnapshotBeforeUpdate(prevProps, prevState)`（在 DOM 更新前读滚动位置等）→ `componentDidUpdate`（可比较前后值决定是否再发请求）。Hook 对应 `useEffect(fn, [deps])`，Snapshot 对应 `useLayoutEffect` 的清理/读取窗口。
3. 卸载阶段：`componentWillUnmount`（清定时器、取消订阅、解绑监听）。Hook 对应 `useEffect` 返回的清理函数。
4. 错误处理：`static getDerivedStateFromError` 与 `componentDidCatch`，Hooks 无法替代（这是唯一必须用类组件的场景）。
5. 已被标记为不安全的旧 API（React 16.3 起加上 `UNSAFE_` 前缀并告警）：`componentWillMount`、`componentWillReceiveProps`、`componentWillUpdate`——它们在新架构（异步/可中断渲染）下会被多次调用，语义不安全。

| 生命周期 | Hooks 对应 |
| --- | --- |
| `componentDidMount` | `useEffect(fn, [])` |
| `componentDidUpdate` | `useEffect(fn, [deps])` / 无依赖数组 |
| `componentWillUnmount` | `useEffect` 的清理函数 |
| `getSnapshotBeforeUpdate` | `useLayoutEffect` |

**追问与易错点**：

- 追问：`useEffect(fn)` 不带依赖数组对应哪个生命周期？答：既不精确等于 `componentDidMount` 也不等于 `componentDidUpdate`，它是"每次渲染提交后都执行"，比两者都频繁。
- 陷阱：在 `componentWillMount` / `render` 里发请求。前者已废弃，后者会重复请求，应放在 `componentDidMount` 或 `useEffect` 中。
- 陷阱：以为 `useEffect` 能完全模拟生命周期。类组件的更新前后成对逻辑，在 Hooks 里需要靠依赖数组与 `useRef` 比较前值来自己实现。

### Q24 合成事件和原生事件混用会有哪些坑？

**考察点**：考察实践踩坑经验：阻止冒泡失效、时序错乱、`setState` 批处理差异。

**参考答案**：

> **一句话结论**：两套事件系统独立运行，`stopPropagation` 只在自己那套里生效，加上 React 17 前后委托位置不同、18 前后批处理范围不同，混用时顺序和行为都不能想当然。

1. 阻止冒泡失效：在原生监听器里 `e.stopPropagation()` 拦不住 React 合成事件（反之亦然）；如果原生监听在 `document` 捕获阶段触发，可能在 React 处理前就把事件"吃掉"。
2. 时序不确定：React 委托在根容器上，你又在 `document` 上绑原生监听，谁先执行取决于绑定位置与阶段（捕获/冒泡），旧版本与新版本结论不同，代码不应依赖这个顺序。
3. `setState` 批处理差异：React 17 及以前，原生事件与异步回调里的 `setState` 是同步渲染（每次调用立刻走一轮），React 18 起才自动批处理；升级前后性能表现会变。
4. 事件对象差异：合成事件的 `e.target`/`e.currentTarget` 与原生一致，但 `onChange` 对应原生 `input`、`onDoubleClick` 对应 `dblclick` 等映射要记牢；React 17 起已移除事件池，`e.persist()` 不再需要。
5. 第三方案例：某些库在 `document` 上直接绑监听（如早期弹窗点击外部关闭），与 React 的 Portal 弹窗叠加时会出现"点内部也关闭"，解决方式是判断 `e.target` 是否在容器内，或改用原生捕获阶段的容器监听。

```js
useEffect(() => {
  const onDocClick = e => {
    if (!boxRef.current?.contains(e.target)) setOpen(false);
  };
  document.addEventListener('click', onDocClick);
  return () => document.removeEventListener('click', onDocClick);
}, []);
```

**追问与易错点**：

- 追问：怎么让一个原生监听稳定地先于 React 处理？答：在容器或用 `capture: true` 的捕获阶段监听（可预测），但依然建议不要在业务里依赖这种顺序。
- 陷阱：认为 `e.stopPropagation()` 能阻止事件到达 `window`。它拦的是 React 模拟的冒泡链，原生传播可能照旧。
- 陷阱：忘了在清理函数里 `removeEventListener`，导致组件重渲染后重复绑定、回调执行多次。

### Q25 为什么说"组合优于继承"？`children` 能做什么？

**考察点**：是否知道 React 官方推荐的复用方式是组合与 props 传节点，而不是继承。

**参考答案**：

> **一句话结论**：React 组件是"通过组合拼装"的，父组件把 `children`、具名 props（渲染插槽）传进去即可定制子组件内容；继承会带来耦合和层级僵化，官方明确不推荐。

1. `children` 是最简单的插槽：`<Card><p>正文</p></Card>`，子组件里用 `props.children` 渲染。传进来的是"React 元素"，可以先构造好再传递，不受父组件 render 影响。
2. 具名插槽 / 多出口：用普通 props 传元素（`<Layout header={<Header/>} sidebar={<Side/>} />`），比 `children` 更灵活，本质是"用 props 传 UI"。
3. 为什么不用继承：继承要求预先设计好类层次，需求一变就得改基类、影响所有子类；而且组合出的 UI 结构与类继承关系经常对不上，React 也没有提供类似 Vue mixin 的能力。
4. 组合的额外收益：父子组件解耦（子组件不需要知道传进来的是什么）、可测试（单独测子组件）、可复用（同一容器配不同内容）。
5. 与 HOC / 自定义 Hook 的分工：组合解决"UI 结构复用"；跨组件逻辑复用交给自定义 Hook；HOC 只在需要"包裹并注入 props"时用，注意它不改变原组件、要注意 `ref` 转发与 `displayName`。

```jsx
function SplitPane({ left, right }) {
  return <div className="pane"><div>{left}</div><div>{right}</div></div>;
}
// 使用：<SplitPane left={<List/>} right={<Detail/>} />
```

**追问与易错点**：

- 追问：`props.children` 变化会导致父组件重渲染吗？答：父组件重新渲染时，子元素是新创建的对象，子组件会重渲；想稳定可用 `useMemo` 包裹元素或配合 `React.memo`。
- 陷阱：把"组合"理解成"一定要用 `children`"。具名 props 传 UI 同样是组合，哪种更清晰用哪种。
- 陷阱：为了复用逻辑而写继承（`class A extends B`）。React 组件继承链一深，`props` 冲突和渲染副作用就难以追踪。

### Q26 高阶组件、Render Props、自定义 Hook 怎么取舍？

**考察点**：三种逻辑复用方案的差异与演进原因，能否说清各自的坑。

**参考答案**：

> **一句话结论**：三者都是逻辑复用手段，HOC 是"包一层并注入 props"，Render Props 是"用函数 prop 交出渲染权"，自定义 Hook 是"直接复用状态逻辑"；Hooks 时代首选自定义 Hook，其余两者只在维护老代码或必须插入组件树时使用。

1. 高阶组件（HOC，Higher-Order Component）：`const WithAuth = C => props => ...`，接收组件返回新组件，典型如 `connect`、`withRouter`。坑：props 命名冲突、多层嵌套形成"装饰器地狱"、必须手动透传不相关 props、`ref` 会被吞掉（需要 `forwardRef`）、`displayName` 易丢失。
2. Render Props：把渲染逻辑作为函数 prop 传入，如 `<Mouse>{pos => <Cat x={pos.x}/>}</Mouse>`。坑：嵌套回调过深（"回调地狱"）、每次传新函数可能引发额外渲染。
3. 自定义 Hook：`useXxx` 把状态与副作用逻辑抽出来，多个组件调用互不共享状态，不增加组件树层级、不产生 props 冲突，是目前官方推荐方案。
4. 分工判断：复用"状态与副作用逻辑" → 自定义 Hook；复用"UI 结构" → 组合/`children`；必须"包裹组件并控制是否渲染"（如鉴权守卫、错误边界、Context Provider 包装）→ HOC 仍然不可替代。
5. 重要前提：自定义 Hook 之间不共享状态，状态是"每个组件各一份"；要跨组件共享数据得配 `useContext` 或外置 store。

```jsx
// 自定义 Hook：与 HOC 不同，不产生额外组件层级
function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn(v => !v), []);
  return [on, toggle];
}
```

**追问与易错点**：

- 追问：HOC 里怎么把 `ref` 传下去？答：用 `forwardRef` 包一层，并把 `ref` 显式传给被包裹的组件；否则父组件的 `ref` 拿到的是包装组件而非目标组件。
- 陷阱：把 HOC 写在组件内部或 `render` 里（`WithX(MyComp)` 每次渲染都新建组件类型），会导致子树整体卸载重建、状态丢失、输入框失焦。
- 陷阱：认为自定义 Hook 之间能共享状态。多次调用是各自独立的 `useState`，共享要借助 `context`。

### Q27 虚拟 DOM 是什么？Fiber 架构解决什么问题？

**考察点**：本章最核心的原理题，要能区分虚拟 DOM（描述层）与 Fiber（调度与执行层），并说清 Reconciler / Renderer 的分工。

**参考答案**：

> **一句话结论**：虚拟 DOM 是用 JS 对象描述 UI 结构的"中间层"，让 React 能计算最小变更再落到真实 DOM；Fiber 是 React 16 起的新协调引擎，把一次大渲染拆成可中断、可恢复的小工作单元，并支持优先级调度。

1. 虚拟 DOM 的价值：跨平台（Web/RN/SSR 共用一套描述）、可预测（声明式 diff 代替手写 DOM 操作）、批量更新（一次事件循环内合并变更）。它不是"比真实 DOM 快"，而是"让正确性和可维护性可控"。
2. 两个核心模块：协调器（Reconciler，即 `react-reconciler`）负责计算虚拟 DOM 树之间的差异、维护 Fiber 树；渲染器（Renderer，如 `react-dom`、`react-native`）负责把变更提交到具体宿主环境。更换渲染器即可渲染到不同平台。
3. Fiber 是什么：每个 React 元素对应一个 Fiber 节点（是一种数据结构，也是一个"工作单元"），字段含 `type`、`key`、`return`/`child`/`sibling`（链表化的树）、`stateNode`、`lanes`（优先级）、`alternate`（指向另一棵树的镜像）。
4. 可中断渲染：React 15 的栈协调器（Stack Reconciler）递归调用无法中断，树一大就长时间占用主线程导致掉帧；Fiber 把递归改成"循环 + 链表遍历"，渲染阶段（render phase）可以被中断、让出主线程后继续，因此叫"可中断渲染"。
5. 时间切片（Time Slicing）：调度器（Scheduler）在每帧判断是否该让出（约 5ms 内的工作量后 `shouldYield`），把剩余任务放到下一个空闲回调继续，保证高优先级交互（输入、点击）先响应。
6. 渲染被拆成两个阶段：render 阶段（可中断、可丢弃、不产生副作用）与 commit 阶段（同步、不可中断、真正改 DOM 并执行 effect），这也是废弃 `componentWillXxx` 的原因——它们可能在 render 阶段被重复调用。

**追问与易错点**：

- 追问：可中断渲染会被丢弃吗？答：会。render 阶段的工作可能被更高优先级更新抢占并重新开始，所以 render 阶段绝对不能有副作用（不能在渲染函数里发请求、改全局变量）。
- 陷阱：把 Fiber 说成"虚拟 DOM 的升级版"。虚拟 DOM 是"对象描述"，Fiber 是"带优先级与链表结构的工作单元"，两者层次不同。
- 陷阱：说"React 16 之后 diff 变快了"。Fiber 主要改善的是"可中断与优先级"，diff 算法本身（同层比较）没有质变。

### Q28 React 的 diff 算法是怎么做的？为什么说 key 用 index 有坑？

**考察点**：能否说清同层比较、三种优化假设，以及 index 作 key 导致的具体 bug。

**参考答案**：

> **一句话结论**：React 的 diff 只做同层比较，依赖"跨层移动极少、type 不同即重建、同层靠 key 标识"三条假设把 O(n³) 降到 O(n)；`key` 用 index 在列表插入、删除、排序时会让身份错位，导致状态串位与多余 DOM 操作。

1. 同层比较：只在同一层级比较节点，不跨层级复用。节点换了父级，整个子树被卸载重建（state 丢失）。
2. type 优先：`type` 不同（`div` → `span`）直接销毁旧节点重建；`type` 相同则复用 DOM 节点，只更新变化的属性。函数/类组件类型不同也会重建。
3. 列表用 key 匹配：同层多个子节点时，React 会用 `key`（无 key 时用索引）建立旧节点映射，再做"复用 + 移动 + 删除 + 新建"。这就是 key 必须是"稳定唯一标识"的原因。
4. index 作 key 的问题：列表头部插入一项后，后续每一项的 index 都变了，React 认为"内容变了但身份没变"，于是复用了错误的组件实例：非受控输入框内容串位、`useState` 初值残留、动画/过渡错乱、`React.memo` 白优化；反过来删除也会造成多余的卸载重建。
5. 正确做法：用业务唯一 ID（数据库主键、`uuid`）。只有"纯静态、永不增删排序"的列表才能用 index；`key` 不能用 `Math.random()`，因为每次渲染都变。
6. 反模式：用数组下标参与 `key` 拼接（如 `` `row-${i}` ``）本质仍是不稳定 key；用内容当 key 在内容重复时冲突。

```jsx
// 反例：头部插入后所有行 index 变化
{list.map((item, i) => <Row key={i} item={item} />)}

// 正确：身份跟着数据走
{list.map(item => <Row key={item.id} item={item} />)}
```

**追问与易错点**：

- 追问：为什么用 index 会出现"输入框内容串位"？答：输入框的非受控值存在 DOM/组件实例上，key 相同就复用同一个实例，值被错误保留。
- 陷阱：认为"没有 key 也能正常工作，只是警告"。无 key 时 React 用位置索引对齐，等价于 index 作 key，同样会在插入/删除时错位。
- 陷阱：说 diff 会做"树的编辑距离最小化"。那正是 React 为性能主动放弃的部分，它只做同层比较。

### Q29 Fiber 的双缓存树是什么？`workInProgress` 是干嘛的？

**考察点**：深挖题，考察是否理解 `current` / `workInProgress` / `alternate` 三者的关系与"一次性切换"的意义。

**参考答案**：

> **一句话结论**：React 内存里同时存在两棵 Fiber 树——屏幕上正在展示的 `current` 树和正在构建的 `workInProgress` 树，两者节点通过 `alternate` 互指；render 阶段只在 `workInProgress` 上做增量修改，commit 阶段把 `root.current` 一次性指向新树，避免用户看到"半成品界面"。

1. 双缓存（Double Buffering）思路借自图形学：不直接修改正在显示的帧，先在后台缓冲区画好再整体切换。React 的 `createWorkInProgress` 负责复用 `alternate` 节点，减少对象创建开销。
2. 构建过程：更新触发后，从根节点开始创建/复用 `workInProgress` 节点，自顶向下完成 render 阶段（可中断、可丢弃），期间两棵树并存。
3. 提交切换：commit 阶段（同步、不可中断）执行 DOM 变更与副作用，收尾时 `root.current = finishedWork`，同时把旧树的 `alternate` 指向新树，为下一次更新复用。
4. 为什么重要：一是保证用户看到的永远是完整的一帧，不会出现"渲染到一半"的状态错乱；二是可中断渲染能安全丢弃中间结果，重来一次不会有残留副作用；三是为并发特性（优先级插队、可恢复渲染）提供数据结构基础。
5. 相关概念：`lanes` 记录该 Fiber 上待处理的更新优先级；`props`/`state` 挂在 Fiber 上，`hooks` 链表挂在 `memoizedState` 上，所以"状态属于 Fiber 节点"而不是组件函数本身。

**追问与易错点**：

- 追问：为什么 render 阶段可以被丢弃？答：因为它只构建内存中的 Fiber 树，没有触碰真实 DOM，也没有执行 effect；真正产生副作用的是 commit 阶段。
- 陷阱：把"双缓存"说成"两棵真实 DOM 树"。两棵都是内存中的 Fiber 树，真实 DOM 只有一份。
- 陷阱：认为 commit 阶段也能中断。commit 一旦开始必须同步走完，否则会出现 DOM 与状态不一致。

### Q30 React 18 的并发特性有哪些？分别解决什么问题？

**考察点**：是否知道"并发（Concurrent）不是并行"，以及各 API 的定位与适用场景。

**参考答案**：

> **一句话结论**：并发特性让"紧急更新"可以打断"非紧急更新"，从而保持交互流畅；核心 API 是 `useTransition`/`startTransition`（标记非紧急更新）、`useDeferredValue`（延迟旧值）、`Suspense`（声明式处理异步等待）、`useSyncExternalStore`（安全订阅外部数据源）。

1. 前提认知：并发（Concurrency）不是多线程并行，而是"任务可中断、可插队、可重启"，因此 render 阶段必须是纯的；并发特性在 `createRoot` 下才完整可用。
2. `startTransition` / `useTransition`：把更新标记为过渡（transition），优先级较低，可被输入、点击等高优先级更新打断。`isPending` 用于显示加载态。适用：搜索联想结果的渲染、大列表筛选、路由跳转后的大页面渲染。
3. `useDeferredValue(value)`：返回"延迟版"的值——紧急部分用新值，耗时部分先用旧值渲染，稍后追上新值。适合无法把更新塞进 `startTransition` 的场景（比如值来自 props）。
4. `Suspense`：用 `<Suspense fallback>` 声明"子组件还没准备好时显示什么"，配合 `React.lazy` 做代码分割；在并发模式下还支持"过渡中保留旧 UI，不闪 fallback"。传统用法不支持 `useEffect` 里发请求，需要框架（Next.js RSC）或 `use` 等新能力配合。
5. `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`：以官方方式订阅外部 store，保证并发渲染下不出现"撕裂（Tearing）"（同一帧里不同组件读到不同版本数据），是 Redux、Zustand 等库的底座。
6. 实践建议：多数业务不需要直接写并发 API；优先用 `useDeferredValue`/`startTransition` 解决"输入卡顿"，其余交给框架与状态库。

```jsx
const [isPending, startTransition] = useTransition();
const [keyword, setKeyword] = useState('');
const onChange = e => {
  setKeyword(e.target.value);                       // 紧急：输入框必须跟手
  startTransition(() => setFilter(e.target.value)); // 非紧急：大列表可延迟
};
```

**追问与易错点**：

- 追问：`startTransition` 里能放 `setState` 之外的副作用吗？答：不能。它只是给更新打优先级标记，回调必须是同步的更新函数，发请求等副作用要放 `useEffect` 或事件里。
- 陷阱：说"并发就是并行渲染、用了就更快"。它优化的是响应性，单次总工作量不变，甚至可能做更多重复计算。
- 陷阱：用 `useDeferredValue` 后还在子组件里 `React.memo` 缺失，延迟值每次都是新对象，优化无效——两者通常要配合使用。

### Q31 `StrictMode` 在开发环境会做什么？为什么 effect 会执行两次？

**考察点**：是否理解严格模式是"主动暴露问题"的检查工具，以及它具体多调用了哪些东西。

**参考答案**：

> **一句话结论**：`React.StrictMode` 只在开发环境生效，它会刻意把渲染函数、初始化函数和挂载时的 effect 多执行一次（effect 是"挂载 → 模拟卸载清理 → 再挂载"），用来提前暴露"不纯的渲染"和"清理不完整的副作用"；生产构建不受影响。

1. 双调用范围：函数组件函数体、类组件的 `constructor`/`render`/`shouldComponentUpdate`、传给 `useState`/`useMemo`/`useReducer` 的初始化函数、以及 `useEffect` 的挂载流程。事件处理函数不会双调用。
2. effect 的"双调用"其实是：挂载执行一次 → 立刻执行清理 → 再执行一次。目的是验证清理函数是否真的把副作用逆向干净（订阅、定时器、外部连接）。
3. 为什么这么设计：并发渲染下 render 可能被中断、丢弃、重跑，effect 也可能因卸载重挂而重复执行。能在严格模式下活下来，代码才在并发模式下可靠。
4. 常见报错与修复：出现两个网络请求 → 说明请求没做去重/取消；出现两个 `setInterval` → 说明没用清理函数；出现"更新已卸载组件" → 说明清理没写。
5. 实践建议：新项目在根节点包 `<React.StrictMode>`，不要为了"眼不见心不烦"把它删掉；它对生产包体积和运行时行为无影响。

```jsx
useEffect(() => {
  const ac = new AbortController();
  fetch('/api/list', { signal: ac.signal }).then(r => r.json()).then(setList);
  return () => ac.abort(); // 严格模式下第二次挂载前会先 abort 一次
}, []);
```

**追问与易错点**：

- 追问：生产环境会双调用吗？答：不会，严格模式的检查只在开发构建中开启；线上看到"只请求一次"不代表代码已修复，是检查被关掉了。
- 陷阱：认为"effect 跑两次是 React 的 bug"。它是刻意设计，用来逼你写幂等且能正确清理的副作用。
- 陷阱：在 `useEffect` 里用 `let didRun = false` 的模块级标志位"骗过"双调用，把真正的问题藏了起来。

### Q32 错误边界（Error Boundary）怎么实现？为什么 Hooks 替代不了？

**考察点**：是否知道错误边界的能力边界（能捕获什么、捕获不了什么），以及它必须由类组件实现。

**参考答案**：

> **一句话结论**：错误边界是一个类组件，实现 `static getDerivedStateFromError`（渲染兜底 UI）或 `componentDidCatch`（记录日志）后，能捕获其子树在渲染、生命周期和构造函数中抛出的错误；Hooks 至今没有对应能力，所以错误边界只能用类写（或使用 `react-error-boundary` 这类封装）。

1. 捕获范围：子树组件的渲染、生命周期方法、构造函数中的错误。做法是在 `getDerivedStateFromError` 里设置 `hasError` 状态，在 `render` 里返回兜底 UI；`componentDidCatch(error, info)` 用于上报日志（有副作用，不能放在 `getDerivedStateFromError` 里）。
2. 捕获不到：事件处理函数（要自己 `try/catch`）、异步代码（`setTimeout`、`Promise`）、服务端渲染、错误边界自身抛出的错误、以及 React 18 中 `hydrate` 的部分错误。事件和异步错误需要配合 `window.onerror`/`unhandledrejection` 做全局兜底。
3. 粒度策略：不要只在根节点放一个错误边界，应按业务模块/路由分别包裹，避免一个组件崩溃白屏整页。
4. 为什么 Hooks 不能替代：错误边界依赖"在捕获阶段发现子树渲染异常并替换输出"，这需要 React 类组件的错误捕获生命周期机制；函数组件没有实例与方法槽位，目前只能退回类组件或用库封装。
5. 兜底 UI 要提供"重试"能力（重置 `hasError` 并重新渲染），否则用户只能刷新页面。

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { report(err, info.componentStack); } // 上报
  render() {
    if (this.state.hasError) return <Fallback onRetry={() => this.setState({ hasError: false })} />;
    return this.props.children;
  }
}
```

**追问与易错点**：

- 追问：`getDerivedStateFromError` 和 `componentDidCatch` 分工是什么？答：前者是静态方法、必须返回状态、用于渲染兜底；后者是实例方法、用于副作用（上报日志），两者常一起实现。
- 陷阱：以为错误边界能捕获点击事件里的异常。事件回调里的错误不会被捕获，必须 `try/catch` 或交给全局兜底。
- 陷阱：认为错误边界可以包住自己。组件自身 `render` 抛错，它自己无法捕获，需要上层再包一层。

### Q33 `Portals` 是什么？用它要注意什么？

**考察点**：是否知道 Portal 改变的是 DOM 位置、不改变 React 树位置，以及由此带来事件与样式上的注意点。

**参考答案**：

> **一句话结论**：`ReactDOM.createPortal(child, container)` 把子节点渲染到指定的 DOM 容器里（如 `document.body`），但它在 React 树中仍是原父组件的子节点——因此事件按 React 树冒泡，`context` 也照常传递。

1. 典型场景：模态框、气泡提示、下拉浮层、通知条。目的是跳出父级的 `overflow: hidden`、`z-index` 层叠上下文、`transform` 造成的定位限制。
2. 与 React 树的关系：DOM 上不在父节点里，但 Fiber 树里仍是子节点。所以父组件的 `onClick` 能收到弹窗内的点击（合成事件模拟冒泡），`useContext` 的值也能读到，不需要额外透传。
3. 事件注意点：因为合成事件会冒到 React 父组件，若同时用原生 `document` 监听做"点击外部关闭"，需要判断 `e.target` 是否在弹窗容器内（用 `ref` + `contains`），否则会出现"点内部也关闭"。
4. 样式注意点：Portal 会脱离原 DOM 层级，CSS 继承（字体、颜色）和 `scoped` 样式、层叠上下文都按新容器计算；`z-index` 需要在新层级里重新规划。
5. 无障碍与可维护性：注意焦点管理（打开时聚焦、关闭时归还焦点）、`aria-modal`/`role="dialog"`、ESC 关闭与 body 滚动锁定；`container` 建议用 `useState/useRef` 惰性创建（SSR 场景不能直接用 `document.body`）。

```jsx
function Modal({ onClose, children }) {
  return ReactDOM.createPortal(
    <div className="mask" role="dialog" aria-modal="true">
      <div className="panel">{children}</div>
    </div>,
    document.body
  );
}
```

**追问与易错点**：

- 追问：Portal 里的事件能被父组件的 `onClick` 捕获吗？答：能，React 合成事件按组件树传播，与 DOM 位置无关；这正是 Portal 与"手动 appendChild"的本质区别。
- 陷阱：以为 Portal 改变了 `context` 或组件树层级，从而多写一层 Provider 透传。
- 陷阱：SSR 时直接在模块顶层或渲染期间访问 `document.body`，服务端没有 `document`，会直接报错。

### Q34 为什么 `useState` 更新后立即读取拿不到新值？Hooks 的闭包问题怎么用 `useRef` 解决？

**考察点**：把"状态快照"与"闭包陷阱"串起来，考察是否真的理解函数组件的渲染模型，并能给出工程化解法。

**参考答案**：

> **一句话结论**：每次渲染都是"用当次 props/state 快照调用一次函数"，`setX` 只是把更新排进队列、不修改当前这份快照，所以同一函数体内读到的 `x` 永远是旧值；需要跨渲染拿到最新值，用 `useRef` 保存并在渲染后同步。

1. 根因：函数组件里 `const [x, setX] = useState(0)` 中的 `x` 是一次渲染的常量。`setX(1)` 之后当前执行上下文里的 `x` 不会变，只有 React 用新状态重新调用组件时才有新值。这与 `setState` 的批处理是同一件事的两个侧面。
2. 直接后果：`setX(x + 1); console.log(x)` 打出旧值；在事件回调/定时器里读 `x` 读到的是"注册那一刻"的值。
3. 解法一（推荐）：不读旧值，用函数式更新表达"基于最新值计算"——`setX(v => v + 1)`。
4. 解法二：把"读取"放到渲染之后的阶段——`useEffect`/`useLayoutEffect`（依赖 `x`）里读，此时拿到的是本次提交后的值。
5. 解法三：用 `useRef` 保存最新值：`const latest = useRef(x); latest.current = x;`（或在 effect 里赋值），回调统一读 `latest.current`；适合定时器、订阅、事件回调等"只想注册一次但需要最新值"的场景（可抽成 `useLatest`）。
6. 解法四：用 `flushSync` 强制同步刷出更新后再读 DOM/状态（慎用，会破坏批处理、影响性能）。

```jsx
function useLatest(value) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }); // 每次渲染后同步最新值
  return ref;
}
// 定时器里：console.log(latest.current) 永远是最新值
```

**追问与易错点**：

- 追问：`useRef` 存最新值和直接放进依赖数组哪个好？答：依赖数组会重建副作用（每次值变都重新订阅），`useRef` 保持"只注册一次"；两者按语义选择，能补依赖就补依赖。
- 陷阱：用 `let` 变量在组件外保存值来绕过闭包问题。这会造成多实例互相污染（同一组件渲染两份就串了），必须用 `useRef`（每实例一份）。
- 陷阱：认为"加 `await`/`setTimeout` 就能读到新值"。异步只改变了执行时机，闭包捕获的仍是那次渲染的变量。

## 本章小结

- React 的核心是声明式 UI + 组件化 + 单向数据流，开发者描述"状态对应什么界面"，DOM 操作交给框架。
- JSX 是 `createElement` / `jsx` 的语法糖；React 17 起用自动运行时，`key` 被单独抽出，`key` 决定列表节点的复用身份。
- `setState` 是"入队 + 批处理"而非异步 API，React 18 的 `createRoot` 让所有场景默认自动批处理；新值依赖旧值或同一轮连续更新时必须传函数式更新，函数组件的 `setState` 是整体替换。
- Hook 状态挂在 Fiber 的链表上，靠调用顺序索引，所以 Hooks 只能在顶层无条件调用；`useState` 是 `useReducer` 的特例。
- 每次渲染都是一份常量快照，闭包陷阱由此而来；解法是补全依赖、函数式更新、或用 `useRef` 保存最新值。
- `useEffect` 在绘制后异步执行、清理在依赖变化与卸载时执行；`useLayoutEffect` 在绘制前同步执行，只在需要测量布局时使用。
- Fiber 把渲染拆成"可中断的 render 阶段 + 不可中断的 commit 阶段"，配双缓存树与优先级车道实现并发特性；render 阶段必须无副作用。
- `key` 用 index 会在插入/删除/排序时错位，导致状态串位与多余渲染；错误边界只能用类组件实现，Hooks 无法替代。

<!-- COUNT: 34 -->
