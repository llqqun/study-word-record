---
title: "第 14 章 React 生态与进阶实战"
---

## 第 14 章 React 生态与进阶实战

### Q1 React Router 6 里怎么拿路由参数、怎么做跳转？

**考察点**：考 v6 三个常用 Hook 的分工，能不能一口说出 useParams、useSearchParams、useNavigate 各自解决什么，答到会用就算过关。

**参考答案**：

> **一句话结论**：v6 用 useParams 取路径动态段、useSearchParams 读写查询串、useNavigate 做编程式跳转，三者都是 Hook，只能在组件或自定义 Hook 里调用。

1. useParams：拿路径里的动态段，`/user/:id` 对应 `const { id } = useParams()`，取到的值**永远是字符串**，要数字得自己转，且路由参数变化时组件不会卸载、只重渲染。
2. useSearchParams：返回 `[searchParams, setSearchParams]`，读用 `searchParams.get('page')`，写必须调 `setSearchParams`，默认会 push 一条新历史记录，想替换当前记录要显式传 `{ replace: true }`。
3. useNavigate：`const navigate = useNavigate()`，`navigate('/login')` 跳转、`navigate(-1)` 回退、`navigate('/login', { replace: true })` 不留历史；登录后回跳常配合 `navigate(from, { replace: true })`。
4. 传参取舍：短小、需要被分享和刷新的状态放 URL（分页、筛选、tab）；大对象别塞 query，用 state 或全局状态传，否则 URL 会又长又容易出错。

```js
const { id } = useParams();                       // '/user/:id'
const [params, setParams] = useSearchParams();    // ?page=2
const page = Number(params.get('page') ?? 1);
setParams({ page: String(page + 1) });            // 触发一次导航
const navigate = useNavigate();
navigate('/login', { replace: true });
```

**追问与易错点**：

- 陷阱：直接对 URLSearchParams 对象做 `params.set('page', '2')` 期望界面变化，这是不会触发导航和渲染的，必须通过 setSearchParams 提交。
- 追问：v5 的 useHistory 去哪了？答：v6 已移除，统一换成 useNavigate，并且支持传数字做前进/后退。
- 追问：怎么在组件外面跳转？答：非组件环境（比如 axios 拦截器）可以用 createBrowserRouter 返回的 `router.navigate('/login')`。

### Q2 嵌套路由怎么配置？Outlet 起什么作用？

**考察点**：考布局路由与子路由的关系，能不能讲清"父级是外壳、子级是内容"，这是 v6 相对 v5 最直观的变化。

**参考答案**：

> **一句话结论**：父路由只负责布局与权限外壳，子路由写在 children 里，父组件用 `<Outlet />` 占位渲染当前匹配到的子路由。

1. 配置方式：路由对象用 children 嵌套，子路由写**相对路径**；`index: true` 表示父路径下的默认子路由，等价于父路径本身。
2. Outlet 是子路由的渲染出口：父组件写 `<Layout><Outlet /></Layout>`，切换子路由时父级布局不卸载，只替换出口内容，所以侧边栏、导航状态能保留。
3. 数据传递：子路由要拿父级数据用 `useOutletContext()`，避免一层层透传 props；父级也能通过 `<Outlet context={{ user }} />` 注入。
4. 路径拼接：父 `path="user"` + 子 `path=":id"` 得到 `/user/:id`；子路由写以 `/` 开头的绝对路径也能匹配，但会脱离父级布局，等于放弃了嵌套的价值。
5. 兜底：父路由末尾加 `{ path: '*', element: <NotFound /> }` 处理未匹配路径。

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,            // 内部渲染 <Outlet />
    children: [
      { index: true, element: <Home /> },   // 匹配 '/'
      { path: 'user/:id', element: <User /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
```

**追问与易错点**：

- 陷阱：给父路由忘写 element，以为子路由不会渲染。实际上父路由不提供 element 时，React Router 默认渲染一个 Outlet，子路由照样显示。
- 追问：子路由能写全路径吗？答：可以，但写全路径后它就脱离了父级布局，通常说明结构设计错了。
- 追问：index 路由和 `path: ''` 有区别吗？答：index 更语义化，且不能有 children，是父路径的默认内容。

### Q3 createBrowserRouter 和 BrowserRouter 有什么区别？v6 比 v5 变了什么？

**考察点**：考是否分得清"组件式路由"和"数据路由"，以及 v6 的迁移点，这是老项目升级最容易踩的地方。

**参考答案**：

> **一句话结论**：BrowserRouter 是纯组件式路由，能力只有匹配与渲染；createBrowserRouter 是 v6.4 起的数据路由，把路由表、数据加载（loader）、写入（action）、错误边界都收敛到配置里，配合 RouterProvider 使用。

1. 能力差异：createBrowserRouter 支持 loader/action/lazy/errorElement/useRouteError/useNavigation；BrowserRouter 只能自己写 useEffect 取数，没有导航状态与错误边界。
2. 用法差异：数据路由是 `createBrowserRouter(routes)` + `<RouterProvider router={router} />`；组件式是 `<BrowserRouter><Routes>...</Routes></BrowserRouter>`，逻辑写在 JSX 里。
3. v6 相对 v5 的主要变化：Switch 换成 Routes、`component/render` 换成 `element`、精确匹配成为默认（exact 取消）、Redirect 换成 Navigate、useHistory 换成 useNavigate、嵌套路由用 children + Outlet 表达。
4. 选型：新项目直接上 createBrowserRouter，取数、错误处理、代码分割一次配好；只有老代码或极简 demo 才用 BrowserRouter。
5. 版本提醒：v6.4 起才有数据 API，v7 起包名统一为 react-router，react-router-dom 仍可使用但已不是必须。

**追问与易错点**：

- 陷阱：说"v6 只能用数据路由"，其实 v6 完整保留了组件式 API，两套写法可以混用（同一应用里不建议混）。
- 追问：exact 为什么取消了？答：v6 的路径匹配默认就是完整的，要做前缀匹配需要显式写通配或在父路由下嵌套。
- 追问：RouterProvider 和 BrowserRouter 能同时用吗？答：不能，全局只能有一个路由上下文，重复包会报错或行为异常。

### Q4 React Router 6 没有路由守卫，登录鉴权怎么做？

**考察点**：考能不能把 v5 的 beforeEnter 思维迁移到 v6，答出"包装组件 + loader 拦截"两条路才算过关。

**参考答案**：

> **一句话结论**：v6 没有守卫钩子，守卫就是渲染前的条件判断：组件级用包装组件配合 `<Navigate>` 重定向，数据级在 loader 里检查并 `throw redirect(...)` 提前拦住。

1. 组件级守卫：写一个 `<RequireAuth>` 读登录态，未登录返回 `<Navigate to="/login" state={{ from: location }} replace />`，登录成功后再回跳，这是最常见的写法。
2. loader 级守卫：在 loader 里判断 token，没有就 `throw redirect('/login?from=' + url)`，好处是在取数之前就中断，不会出现"先渲染页面再跳走"的闪烁。
3. 粒度分工：路由级守卫防误入页面；按钮、菜单的显隐只是体验优化，**真正的权限必须由服务端接口再校验一次**，前端守卫拦不住直接调接口的人。
4. 结构建议：把守卫包在布局路由外层（如 `/admin` 的父路由），避免每个页面重复判断；用 useLocation 记录来源路径实现回跳。
5. 非组件场景：axios 拦截器里拿 401 时，用 router.navigate 跳登录，不要 import 一个组件外的 history 单例。

```jsx
function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
```

**追问与易错点**：

- 陷阱：认为加了前端守卫系统就安全了。权限校验的第一现场是服务端，前端守卫只影响体验。
- 追问：为什么用 state 传 from 而不是 query？答：能少暴露来源路径，但刷新后会丢；要抗刷新就写进 query。
- 追问：路由级守卫和接口 401 拦截冲突吗？答：不冲突，双保险，路由守卫管体验、401 拦截管兜底。

### Q5 路由懒加载和 Suspense 怎么配合？

**考察点**：考代码分割在路由上的落地，重点是 Suspense 边界放哪、配不配 ErrorBoundary。

**参考答案**：

> **一句话结论**：用 React.lazy 配合动态 import 把路由组件拆成独立 chunk，再用 `<Suspense fallback>` 兜住加载态；v6.4 起还可以直接在路由表里用 lazy 字段。

1. 基本写法：`const Home = React.lazy(() => import('./Home'))`，懒组件**必须**被 Suspense 包住，否则加载时会抛错。
2. 路由表写法：v6.4 起支持 `{ path: 'about', lazy: () => import('./About') }`，模块里导出 Component/loader/action 即可，框架帮你处理 Suspense 与并行加载。
3. 边界位置：把 Suspense 放在布局的 Outlet 外层，切换页面时保留导航和侧边栏，只替换内容区；fallback 用骨架屏而不是空白，避免闪烁。
4. 失败处理：发布后旧 chunk 可能 404，要配 ErrorBoundary 提供"刷新重试"，这是线上最常见的白屏来源之一。
5. 收益判断：首屏只加载当前路由的代码，配合 manualChunks 拆 vendor，能明显降低首屏 JS 体积；页面本身很小就没必要拆。

```jsx
const Home = React.lazy(() => import('./pages/Home'));

<ErrorBoundary fallback={<Reload />}>
  <Suspense fallback={<Skeleton />}>
    <Outlet />
  </Suspense>
</ErrorBoundary>
```

**追问与易错点**：

- 陷阱：把 Suspense 写在懒组件内部，等于没有边界，Promise 会一直往上冒泡，最终整页不渲染。
- 追问：Suspense 的 loading 和 useEffect 里 setLoading 有什么本质区别？答：Suspense 是渲染期挂起，由边界统一处理，并发渲染下不会出现"先渲染空数据再闪一下"的问题。
- 追问：lazy 每次都发请求吗？答：不会，同一个 import 结果被缓存，第二次渲染直接复用已加载模块。

### Q6 React Router 6 的 loader / action 数据 API 是什么？

**考察点**：深挖题，考是否理解"路由层取数"解决了什么问题，只背名字答不出价值算没答到位。

**参考答案**：

> **一句话结论**：loader 在组件渲染前完成数据加载并把结果交给组件（useLoaderData），action 处理表单提交等写操作；两者都在路由层执行，解决"先渲染、再 useEffect 请求"造成的请求瀑布与 loading 闪烁。

1. loader：`loader: async ({ params, request }) => fetch(...)`，组件用 useLoaderData 读取；同级多个路由的 loader **并行**执行，所以嵌套布局能同时取父子数据，而不是串行等待。
2. action：`<Form method="post">` 提交到该路由的 action，里面用 `request.formData()` 读表单，返回校验错误或 `throw redirect('/list')`；配套 useActionData 读返回、useNavigation 读提交中状态。
3. 导航状态与错误：useNavigation().state 为 loading/submitting，可以在不卸载当前页面的情况下显示进度；loader/action 里 `throw` 出的 Response 会被最近一层 errorElement 捕获，用 useRouteError 读取。
4. 相对 useEffect 的优势：useEffect 取数是"渲染 → effect → 请求 → 再渲染"的多轮往返，且父子组件容易形成瀑布；loader 在导航确定后立刻并行发起，页面渲染时数据已就绪。
5. 边界与坑：loader 不是组件，不能用 useState 等 Hook，也不能假设有 window；首次进入若走 SSR，loader 会在服务端执行，因此要避免访问浏览器 API。

```js
export async function loader({ params }) {
  const res = await fetch(`/api/user/${params.id}`);
  if (!res.ok) throw new Response('Not Found', { status: 404 });
  return res.json();          // 组件里 useLoaderData() 取用
}
export async function action({ request }) {
  const form = await request.formData();
  if (!form.get('name')) return { error: '名称必填' };
  await fetch('/api/user', { method: 'POST', body: form });
  return redirect('/users');
}
```

**追问与易错点**：

- 陷阱：试图在 loader 里用 useState 或 useContext，loader 只是普通异步函数，不是组件。
- 追问：有了 loader 还需要 react-query 吗？答：可以并存，loader 管路由级预取，react-query 管缓存、轮询、失效重取，按数据特性选，别两套都做同一件事。
- 追问：loader 抛出的错误怎么显示？答：就近由 errorElement 渲染，用 useRouteError 区分 404 与真正异常。

### Q7 Redux 三大原则是什么？一次 dispatch 的数据流怎么走？

**考察点**：基础题，考能不能把"单一数据源、只读、纯函数"和完整数据流一次讲顺，这是所有 Redux 追问的地基。

**参考答案**：

> **一句话结论**：单一数据源、state 只读、只用纯函数 reducer 描述变化；数据流是 dispatch(action) 后经中间件到 reducer 生成新 state，再通知订阅者，视图按需更新。

1. 单一数据源：整个应用的状态放在唯一 store 的 state 树里，方便统一调试（时间旅行）、服务端注入初始状态、跨组件共享。
2. state 只读：唯一改状态的方式是 dispatch 一个描述"发生了什么"的 action（`{ type, payload }`），任何地方都不能直接改 state。
3. 纯函数修改：reducer 接收 `(state, action)` 返回新 state，不产生副作用、不修改入参；Redux Toolkit 内部用 immer，允许写"看起来可变"的语法，但产出的仍是新对象。
4. 完整链路：组件 dispatch → 中间件链依次处理 → store 调 reducer 生成新 state → store 通知订阅者 → useSelector 比较切片后决定是否重渲染。
5. 为什么这么设计：纯函数 + 不可变数据让状态变化可预测、可回放、可测试，也避免了多来源并发修改同一份状态导致的数据错乱。

**追问与易错点**：

- 陷阱：说"Redux 必须写 switch...case"，这只是原始写法，createSlice 的对象写法更常见，也不是规范强制要求。
- 追问：state 只读跟不可变是同一件事吗？答：不是，只读是使用约定，不可变是数据形态；immer 让写法可变但数据仍不可变。
- 追问：为什么 reducer 里不能发请求？答：请求是副作用，会破坏纯函数与可预测性，异步一律交给中间件或 thunk。

### Q8 状态管理库怎么选型？Context 算状态管理吗？

**考察点**：考横向视野与取舍判断，能不能按项目规模和数据特征给出推荐，而不是只会背自己用过的那一个。

**参考答案**：

> **一句话结论**：先按状态范围分级——组件内用 useState/useReducer，低频跨层传递用 Context，中大型复杂业务用 Redux Toolkit，想轻量少样板选 Zustand，要原子化细粒度更新选 Jotai，已有响应式/OOP 习惯的团队选 MobX。

1. 对比维度：包体积与样板量、订阅粒度、异步与副作用方案、调试工具、生态与团队约束。

| 方案 | 特点 | 适合场景 | 主要代价 |
| --- | --- | --- | --- |
| Redux Toolkit | 单向数据流、DevTools 强、中间件生态全 | 大型中后台、多人协作、需要可回溯 | 概念与样板较多 |
| Zustand | 无 Provider、selector 精准订阅、体积小 | 中小项目、局部全局状态 | 约束弱，规范靠自己 |
| Jotai | 原子自底向上、依赖粒度最细 | 表单/画布类细粒度更新 | 状态分散，全局视图弱 |
| Recoil | 原子 + 选择器 | 曾用于 React 内部思路 | 长期不活跃，新项目不建议 |
| MobX | observable 可变状态、依赖自动收集 | 习惯 OOP/响应式的团队 | 隐式依赖，调试靠约定 |

2. Context 不是状态管理：它只是依赖注入，值一变所有消费者都重渲染，也没有中间件、DevTools、时间旅行；适合主题、国际化、当前用户这类低频且变化范围可控的值。
3. 判断标准：更新频率高不高、订阅要不要细粒度、需不需要严格规范与可回溯调试、团队是否已有技术栈惯性。
4. 落地建议：中小项目 Zustand 足够，大型项目 RTK + RTK Query；一个项目只保留一套全局状态方案，混用会让数据来源失控。

**追问与易错点**：

- 陷阱：用 Context + useReducer 硬扛高频更新，结果每次输入都全树重渲染，还以为是 React 性能不行。
- 追问：Zustand 为什么不会全局重渲染？答：它基于 useSyncExternalStore 按 selector 订阅，只有被选中的切片变化才唤起使用该切片的组件。
- 追问：Redux 的替代品是不是都能替代 Redux？答：不能，Redux 的强项是规范、中间件与调试生态，小项目用它是过度设计，大项目用轻库则可能缺少约束。

### Q9 Redux Toolkit 里 createSlice、configureStore、createAsyncThunk 各自做什么？

**考察点**：考 RTK 的日常三件套，能不能说清每个 API 消除了哪些手写样板。

**参考答案**：

> **一句话结论**：configureStore 组装 store 并默认内置 thunk、DevTools、immer；createSlice 用一个对象同时生成 reducer、action creator 和 action type；createAsyncThunk 把异步请求包装成 pending/fulfilled/rejected 三类 action。

1. configureStore：`configureStore({ reducer: { counter: counterReducer } })` 自动合并 reducer、默认加 redux-thunk、开发环境启用 DevTools、默认开启 immer 与状态序列化检查，比手写 createStore + applyMiddleware 少一半代码。
2. createSlice：传入 `{ name, initialState, reducers }`，reducers 里的函数可以直接"改" state（immer 代理），返回 `{ reducer, actions }`，action type 自动生成为 `name/函数名`。
3. createAsyncThunk：`createAsyncThunk('todos/fetch', async (arg, { rejectWithValue }) => ...)`，请求的三种状态自动派发到 extraReducers 的 pending/fulfilled/rejected，不用手写 loading/error 布尔量。
4. 进一步封装：数据请求建议直接上 RTK Query，缓存、失效、轮询、乐观更新都内置；thunk 更适合"提交后要串联多个 slice 更新"的流程型副作用。
5. 组织建议：按业务域拆 slice，index.ts 只做 configureStore 与类型导出，跨 slice 逻辑放 thunk 或 listener middleware。

```js
const todosSlice = createSlice({
  name: 'todos',
  initialState: { list: [], loading: false },
  reducers: {
    add(state, action) { state.list.push(action.payload); },  // immer 写法
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (s) => { s.loading = true; })
      .addCase(fetchTodos.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; });
  },
});
export const { add } = todosSlice.actions;
export default todosSlice.reducer;
```

**追问与易错点**：

- 陷阱：在 createSlice 的 reducers 里写 async 函数，必须是同步纯函数；异步要放 createAsyncThunk 或 extraReducers。
- 追问：immer 是不是可以随便改？答：只能改 draft 上可写的属性，返回 undefined 表示就地修改，返回其他值会整体替换 state。
- 追问：为什么 action type 要带 slice 前缀？答：避免不同 slice 的同名 action 冲突，也方便 DevTools 里定位来源。

### Q10 useSelector 和 useDispatch 怎么用？shallowEqual 解决什么问题？

**考察点**：考 react-redux 的实际使用与性能意识，答不出"默认是引用比较"这题就废了。

**参考答案**：

> **一句话结论**：useSelector 订阅 store 的切片并在其变化时触发重渲染，比较默认是严格相等，所以返回新建对象或数组时必须用 shallowEqual 或记忆化 selector，否则任何 dispatch 都会让它重渲染。

1. useDispatch：拿到 store.dispatch，配合 thunk：`dispatch(fetchTodos())`；组件只负责派发，不在组件里写业务请求逻辑。
2. 默认比较：selector 的结果与上次用 `Object.is` 比较，返回 `{ a, b }` 这种每次新建的对象永远不相等，于是 store 任何变化都触发重渲染。
3. 两种解法：`useSelector(sel, shallowEqual)` 对第一层做浅比较；派生计算用 reselect 的 createSelector 做记忆化，引用稳定、只在输入变化时重算。
4. 依赖 props 的坑：`useSelector(state => state.list[props.id])` 每次渲染都是新函数，不会报错但语义变化，规范做法是多次单值选取，或把 selector 用 useCallback 固化。
5. 底层机制：react-redux v8 起内部改用 useSyncExternalStore，保证并发渲染下的 tearing 问题，也意味着 selector 必须是纯函数。

```js
const list = useSelector((s) => s.todos.list);
const { done, total } = useSelector(
  (s) => ({ done: s.todos.done, total: s.todos.list.length }),
  shallowEqual            // 不加这行，store 每次变化都会重渲染
);
const dispatch = useDispatch();
dispatch(fetchTodos());
```

**追问与易错点**：

- 陷阱：`useSelector(state => state.list.filter(x => x.done))` 直接返回新数组，每次都判定为变化，必须记忆化。
- 追问：取多个值应该返回对象还是一个一个取？答：优先多次单值选取，需要对象时一定配 shallowEqual，并且 shallowEqual 只比较第一层。
- 追问：useSelector 里能写异步吗？答：不能，selector 必须是同步纯函数，异步副作用放 thunk 或 listener middleware。

### Q11 Redux 中间件原理是什么？thunk、saga、observable 怎么取舍？

**考察点**：深挖题，考能不能手写中间件签名并讲清洋葱模型，以及三个异步方案的真实差异。

**参考答案**：

> **一句话结论**：中间件本质是 `store => next => action => {}` 的柯里化函数，applyMiddleware 用 compose 把它们串在 dispatch 外层形成洋葱模型，让每个中间件都能在 action 到达 reducer 前后做文章。

1. 三段含义：store 参数提供 getState/dispatch，next 是链上的下一个 dispatch，调用 next(action) 才会继续往内走；不调用就等于拦截了这次 action。
2. 组装过程：applyMiddleware 先创建基础 store，再把 `mw1(mw2(baseDispatch))` 赋给新的 dispatch，所以声明顺序决定了谁在最外层，也决定了日志中间件能看到最终结果。
3. thunk：判断 action 是不是函数，是就调用 `action(dispatch, getState, extra)`，让 dispatch 支持异步逻辑；实现只有几行，覆盖绝大多数场景。
4. saga：基于 generator 与 effects（call/put/takeLatest/fork），适合竞态取消、防抖节流、轮询、多 action 编排等复杂流程；代价是概念多、调试心智重。
5. observable：基于 RxJS 的 action$ 流，适合本身就在用 RxJS 的团队做复杂事件流组合，生态相对小。
6. 取舍结论：能用 thunk 就用 thunk，复杂副作用编排再上 saga；数据请求场景用 RTK Query 后，大部分手写 saga 已无必要。

```js
const logger = (store) => (next) => (action) => {
  console.log('dispatching', action.type, store.getState());
  const result = next(action);          // 继续往内走
  console.log('next state', store.getState());
  return result;
};
```

**追问与易错点**：

- 陷阱：以为中间件只能旁观。它可以在 next 之前 dispatch 其他 action、改 action、甚至直接 return 短路整个流程。
- 追问：dispatch 一个 async 函数为什么会报错？答：默认只接受普通对象 action，必须有中间件兜底才能处理函数或 Promise。
- 追问：中间件顺序重要吗？答：重要，日志中间件要放最外层才能看到完整结果，thunk 要在处理函数型 action 的中间件之前。

### Q12 React 性能优化有哪些手段？

**考察点**：考是否有体系化的清单和"先测量再优化"的意识，而不是开口就是 useMemo。

**参考答案**：

> **一句话结论**：先测量再优化，按"减少渲染次数 → 降低渲染成本 → 减少加载体积"三层推进，重点盯不必要的重渲染、长列表、大 bundle、不稳定的 key 与内联对象。

1. 减少渲染次数：状态尽量就近放在使用它的组件；纯展示组件用 memo 包裹；传给子组件的函数用 useCallback 稳定；不要在 JSX 里写内联对象或箭头函数（`style={{}}`、`onClick={() => {}}` 每次都是新引用，会让 memo 失效）。
2. 降低渲染成本：长列表用虚拟滚动；昂贵计算用 useMemo；大组件拆小、按状态切分；非紧急更新用 useDeferredValue 或 startTransition 降级。
3. 减少加载体积：路由级 React.lazy + Suspense 代码分割；manualChunks 把 react 与组件库单独分包；组件库按需引入；用 rollup-plugin-visualizer 分析并盯住大依赖。
4. 定位手段：React DevTools Profiler 看"谁渲染了、耗时多少、为什么渲染"，why-did-you-render 打印多余渲染的原因，浏览器 Performance 面板看长任务与掉帧。
5. key 稳定：列表 key 必须用业务 id，用 index 会在插入、删除、排序时造成组件状态错位和多余的 DOM 重建。

**追问与易错点**：

- 陷阱：无脑套 useMemo/useCallback 全家桶。缓存本身有内存与依赖比较成本，收益小于成本时整体更慢。
- 追问：组件用 memo 包了为什么还渲染？答：props 里有每次新建的对象或函数、或它消费了变化的 Context、或父组件没被拦住导致 props 真的变了。
- 追问：Profiler 在哪里看"为什么渲染"？答：React DevTools 的 Profiler 面板勾选记录原因，会标出是 props 变化、state 变化还是父组件渲染引起。

### Q13 memo、useMemo、useCallback 分别什么时候用？

**考察点**：考三者边界，必须答出"useMemo 返回结果、useCallback 返回函数"以及滥用代价。

**参考答案**：

> **一句话结论**：memo 决定组件要不要重渲染（浅比较 props），useMemo 缓存计算结果，useCallback 缓存函数引用；三者都是拿比较成本换渲染成本，只解决"引用每次都变"和"计算确实很贵"两类问题。

1. React.memo：对 props 做浅比较，相等则跳过渲染，但**不比较内部 state**；父组件传新对象或新函数会让它完全失效。
2. useMemo：`useMemo(() => compute(a), [a])` 缓存昂贵计算（大数组过滤排序、复杂派生数据），也用于稳定要传给 memo 子组件的对象或数组。
3. useCallback：`useCallback(fn, [deps])` 返回稳定引用，主要给 memo 子组件当 props，或作为 useEffect 的依赖避免 effect 反复执行。
4. 等价关系：`useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`，区别只在返回值形态。
5. 不要滥用：依赖频繁变化、计算本来很便宜（如 `a + b`）、组件渲染开销很小的时候，缓存只会增加代码复杂度与内存占用。
6. 语义提醒：React 官方不保证一定保留缓存，缓存可能被丢弃，所以不能用 useMemo 承担业务正确性。

**追问与易错点**：

- 陷阱：以为 useMemo 能保证值永远不变。依赖变了就会重算，它只是性能优化手段。
- 追问：为什么 useCallback 加了还是重渲染？答：子组件没被 memo 包裹时，父组件渲染它必然渲染，useCallback 只在配合 memo 时才有意义。
- 追问：依赖数组可以故意漏写吗？答：不可以，会导致闭包读到旧值；用 eslint-plugin-react-hooks 检查而不是手动"优化"依赖。

### Q14 长列表卡顿怎么优化？虚拟列表原理是什么？

**考察点**：考大数据量渲染的实战方案，能讲清"只渲染可视区"和固定行高的计算方式。

**参考答案**：

> **一句话结论**：虚拟列表只渲染可视区域加少量缓冲的节点，用一个大容器撑出完整滚动高度，再根据滚动偏移算出该渲染哪几项，把 DOM 数量从 O(n) 降到常数级。

1. 结构：容器固定高度并开启滚动，内层放一个高度等于 `总数 × 行高` 的占位元素撑开滚动条，真实列表项用绝对定位或 transform 放到对应位置。
2. 计算：行高固定时 `startIndex = Math.floor(scrollTop / rowHeight)`，渲染 `[start - buffer, start + visible + buffer]` 区间；滚动事件里只更新起始下标。
3. 常用库：react-window（FixedSizeList/VariableSizeList，轻量、够用）、react-virtualized（功能全但体积大）、TanStack Virtual（现代、支持动态测量与多框架）。
4. 代价与限制：不在 DOM 里的节点无法用浏览器查找、不利于 SEO 与打印，列表项需要固定或可测量高度，实现上还要处理滚动白屏与图片加载抖动。
5. 何时不用：几百条以内直接渲染更快；上千条或列表项本身是复杂组件（图表、富文本）时收益才明显。

```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList height={600} itemCount={list.length} itemSize={48} width="100%">
  {({ index, style }) => <div style={style}>{list[index].name}</div>}
</FixedSizeList>
```

**追问与易错点**：

- 陷阱：把"分页加载数据"当成虚拟列表。数据分页解决请求量，DOM 虚拟化解决渲染量，是两件事。
- 追问：行高不固定怎么办？答：用 ResizeObserver 测量已渲染项并缓存，未测量项用估算高度，滚动时动态修正并做锚点补偿避免跳动。
- 追问：虚拟列表需要处理图片加载吗？答：需要，图片异步加载会改变行高，要么固定行高，要么显式预留尺寸。

### Q15 useDeferredValue 和 useTransition 解决什么问题？StrictMode 为什么 effect 跑两次？

**考察点**：深挖题，考 React 18 并发特性与严格模式设计意图，能不能分清"两个 Hook 的差别"和"双调用是在找 bug 不是 bug"。

**参考答案**：

> **一句话结论**：useDeferredValue 让某个值慢一拍更新、useTransition 把更新标记为非紧急且可被打断，目的是让输入等紧急交互不被大列表重渲染卡住；StrictMode 在开发环境故意把组件挂载→卸载→再挂载并双调用函数体，用来暴露副作用没清理干净的问题。

1. useTransition：`const [isPending, startTransition] = useTransition()`，把 setState 包进去，React 先处理紧急更新（输入框回显），过渡更新可中断、可丢弃，isPending 用于显示加载态。
2. useDeferredValue：`const deferred = useDeferredValue(keyword)`，把由它派生的慢部分（大列表过滤）延后渲染，配合 `deferred !== keyword` 判断"还在追"，不需要自己管理过渡状态。
3. 并发前提：React 18 起用 createRoot 才启用并发渲染，渲染过程可中断、可重排优先级，但仍是单线程调度，不是多线程并行。
4. StrictMode 的行为：开发环境 double-invoke 组件函数体、reducer、state updater，并对 effect 执行 mount → unmount → mount，检验订阅、定时器、请求是否被正确清理。
5. 正确姿势：不要为了"请求只发一次"而删掉 StrictMode，应该给 effect 加清理函数或加取消逻辑；生产环境不会双调用，所以也不能依赖"只执行一次"。

```jsx
const [isPending, startTransition] = useTransition();
const [keyword, setKeyword] = useState('');

<input value={keyword} onChange={(e) => {
  setKeyword(e.target.value);                                  // 紧急
  startTransition(() => setFilter(e.target.value));            // 非紧急
}} />;
{isPending && <span>筛选中…</span>}
```

**追问与易错点**：

- 陷阱：把 startTransition 用在异步函数外层。过渡只覆盖过渡范围**内**的状态更新，`await` 之后的 setState 已经不在范围内，要包住 setState 而不是包住 fetch。
- 追问：useDeferredValue 和防抖一样吗？答：不一样，防抖用固定延迟，deferred 由 React 按渲染优先级自动决定何时追平，不浪费时间。
- 追问：StrictMode 的卸载再挂载会丢失 state 吗？答：不会丢，第二次挂载会恢复第一次挂载时的 state，被重跑的只是 effect 的清理与重建，这也是为了让你发现"依赖未清理的外部状态"。

### Q16 CSR、SSR、SSG、ISR 有什么区别？怎么选？

**考察点**：基础题，考四种渲染模式的核心差异，能不能用"HTML 在哪、什么时候生成"一句话定位。

**参考答案**：

> **一句话结论**：四者的区别是 HTML 在哪、什么时候生成：CSR 在浏览器生成，SSR 每次请求在服务端生成，SSG 构建时生成一次，ISR 是 SSG 加定时或按需再生成。

| 方案 | HTML 生成时机 | SEO | 首屏 | 数据新鲜度 | 服务器成本 |
| --- | --- | --- | --- | --- | --- |
| CSR | 浏览器运行时 | 差 | 慢，白屏后请求 | 实时 | 低，可静态托管 |
| SSR | 每次请求 | 好 | 快，有完整 HTML | 实时 | 高 |
| SSG | 构建时 | 好 | 最快，可上 CDN | 构建时 | 极低 |
| ISR | 构建 + 定时/按需再生成 | 好 | 快 | 秒级到分钟级 | 低 |

1. CSR 的问题：首屏要等 JS 下载执行完才渲染，SEO 弱；但交互后是纯客户端，服务器压力最小。
2. SSR 的代价：每个请求都要跑 React 与数据依赖，QPS 高时成本显著；首屏有 HTML 但 JS 未接管前不可交互，这段时间叫水合期。
3. SSG/ISR：SSG 产出静态文件可直接放 CDN；ISR 在 SSG 基础上加 revalidate，后台再生成、用户仍读旧缓存（stale-while-revalidate 语义）。
4. 选型：登录后的中后台直接 CSR；博客、文档、商品详情用 SSG/ISR；个性化、实时数据用 SSR；混合场景可以同站混用（营销页静态 + 用户中心动态）。
5. 术语澄清：SSG 不等于没有 JS 的静态站点，它照样有客户端交互；ISR 本质是带缓存的 SSG，不是新渲染模式。

**追问与易错点**：

- 陷阱：认为 SSR 一定比 CSR 快。高并发下 SSR 的 TTFB 可能更差，而且水合期间页面点不动。
- 追问：SSR 能解决 SEO 吗？答：能显著改善爬虫可读内容，但不等于排名，结构化数据、性能与内容质量同样重要。
- 追问：Next.js 里怎么强制动态渲染？答：App Router 用 `export const dynamic = 'force-dynamic'`，pages 路由则用 getServerSideProps。

### Q17 Next.js 的 getServerSideProps 和 getStaticProps 有什么区别？

**考察点**：考 pages 路由的数据获取三件套与 ISR 的落地方式，也考 App Router 之后的迁移方向。

**参考答案**：

> **一句话结论**：getServerSideProps 每次请求在服务端执行、返回的数据作为 props 渲染，适合个性化实时数据；getStaticProps 只在构建时执行一次产出静态 HTML，适合不常变的内容，配合 revalidate 就变成 ISR。

1. 执行时机：getServerSideProps 每次请求都跑，能读 req/res、cookie、做鉴权；getStaticProps 只在 `next build` 时跑，没有请求上下文，不能读用户态。
2. 动态路由：配合 getStaticPaths 声明要预生成哪些页面，`fallback: false` 未列出即 404，`blocking` 首次访问时服务端生成，`true` 先给骨架再补数据。
3. ISR：getStaticProps 返回 `{ props, revalidate: 60 }`，60 秒内读缓存，超时后后台再生成，用户始终读到可用内容。
4. 选型：内容页、文档、商品详情用 getStaticProps；购物车、个人中心、实时价格用 getServerSideProps；流量大又要新鲜数据用 ISR。
5. App Router 的变化：这两个函数在新模型里不再使用，改为在 Server Component 里直接 `await fetch()`，用 `export const revalidate`、`cache: 'no-store'`、`dynamic` 控制缓存与动态渲染。

**追问与易错点**：

- 陷阱：在 getStaticProps 里读 cookie 或 req，构建期根本没有请求上下文，会直接报错。
- 追问：getServerSideProps 里能用 window 吗？答：不能，它在 Node 环境执行，浏览器 API 一律不可用。
- 追问：ISR 的 revalidate 到点会立刻更新吗？答：不会，是下次请求触发后台再生成，所以第一次访问拿到的仍是旧内容。

### Q18 水合（Hydration）不匹配的原因有哪些？

**考察点**：深挖题，考 SSR 实战最常见的线上问题，要求给出可分类的原因与对应解法。

**参考答案**：

> **一句话结论**：水合不匹配的根本原因是服务端渲染出的 HTML 与客户端首次渲染结果不一致，React 18 会尽量复用但会报错并局部回退成客户端渲染；高频原因集中在时间随机数、浏览器专有 API 和非法 HTML 结构。

1. 时间与随机：`new Date()`、`Date.now()`、`Math.random()`、以及 Intl 的时区与语言差异，两端结果天然不同；解法是把这类内容放到 useEffect 里渲染，或由服务端传入固定值。
2. 浏览器专有判断：渲染期直接访问 window、localStorage、matchMedia，服务端根本没有；解法是首帧用同一初始值再在 effect 里补齐，或对不可 SSR 的组件用 `dynamic(..., { ssr: false })`。
3. 非法 HTML 嵌套：`<p>` 里套 `<div>`、`<table>` 里直接放 `<tr>`、`<a>` 里套 `<a>`，浏览器解析时会自动修正结构，导致真实 DOM 与虚拟树对不上。
4. 其他来源：浏览器扩展往页面注入节点、首屏条件渲染依赖只在客户端存在的登录态或本地缓存、白名单外的 HTML 转义差异。Next.js 会给具体的 diff 提示，`suppressHydrationWarning` 只用于时间戳这类明确无害的场景，别拿来掩盖问题。
5. 本质：SSR 只解决首屏 HTML，交互仍依赖客户端同一份组件代码，因此"首次渲染必须可预测"是硬约束。

**追问与易错点**：

- 陷阱：以为报错会白屏。React 18 多数情况下会保留服务端 HTML 并局部重新渲染，但代价是闪烁与性能损失，必须修。
- 追问：为什么开发环境更容易看到？答：开发构建不做静默降级，会保留完整报错和组件栈，生产构建会吞掉细节。
- 追问：`useEffect` 里 setState 会不会又造成不匹配？答：不会，effect 只在客户端执行，本来就是修复这类问题的标准手段。

### Q19 App Router 里 Server Components 和 use client / use server 怎么用？

**考察点**：考 RSC 的边界规则，能说清"默认服务端、指令改变边界、跨边界只能传可序列化数据"才算过关。

**参考答案**：

> **一句话结论**：App Router 的组件默认是 Server Component，只在服务端执行且不进客户端 bundle；需要状态、事件或浏览器 API 的文件顶部加 `'use client'` 变成客户端组件，需要在客户端触发服务端逻辑则在函数或文件顶部加 `'use server'` 声明 Server Action。

1. 默认服务端：可以直接访问数据库、读环境变量、用 async/await 取数，零客户端 JS；不能使用 useState、useEffect、事件处理和浏览器 API。
2. `'use client'`：是模块级指令，一旦声明，该文件及其导入的整棵子树都进入客户端 bundle，所以边界要尽量往叶子节点推，不要写在 layouts 顶层。
3. `'use server'`：声明 Server Action，客户端可以 import 后当函数调用，也可以直接给 `<form action={fn}>`；参数与返回值必须可序列化，Next 会生成接口并做来源校验。
4. 组合规则：Server Component 可以把数据当作 props 传给 Client Component，也可以把 Client Component 写在 children 里；反过来 Client Component 不能 import Server Component，只能通过 children 或 props 接收。
5. 缓存控制：App Router 里 fetch 默认不缓存（Next 15 起），要用 `revalidate`、`cache`、`dynamic` 显式声明；`revalidatePath`/`revalidateTag` 用于写操作后失效缓存。

**追问与易错点**：

- 陷阱：在 Server Component 里写 useState 或 onClick，会直接构建报错，必须加 `'use client'`。
- 追问：Client Component 能是 async 吗？答：不能，async 组件只在服务端支持；客户端要用 `use()` 读取 Promise，或在服务端取好数据再传进来。
- 追问：加太多 `'use client'` 有什么后果？答：等于把 RSC 的收益还回去，客户端 bundle 变大，重库又被打进首屏。

### Q20 RSC 解决了什么问题？流式渲染怎么工作？

**考察点**：深挖题，考对 React Server Components 的价值判断与流式渲染机制，只答"服务端渲染更快"是不合格的。

**参考答案**：

> **一句话结论**：RSC 把一部分组件留在服务端执行、只把序列化结果与引用发到客户端（不传组件代码），解决首屏 bundle 过大、数据请求瀑布、密钥与数据库无法直连三个问题；流式渲染则让服务端边渲染边发送，用 Suspense 边界把慢的部分后置。

1. 减小 bundle：Server Component 的依赖不打进客户端，Markdown 解析器、日期库、数据访问层都可以留在服务端，首屏 JS 明显下降。
2. 消灭请求瀑布：组件内直接 `await` 数据，服务端一次渲染完成，省掉"渲染 → 客户端请求 → 再渲染"的多轮往返；嵌套布局下父子数据可并行获取。
3. 安全与能力：数据库连接、密钥、内部接口只存在于服务端，客户端拿不到实现细节，也无法反推业务逻辑。
4. 代价：需要框架支持（Next.js App Router），Server Component 不能有状态，服务端与客户端边界要人工划分，调试与心智成本上升。
5. 流式渲染：`renderToPipeableStream` 先把外壳与 Suspense fallback 发出去，慢组件 resolve 后再把片段和替换指令流式追加，浏览器渐进替换；Next 里对应 `<Suspense>` 与 loading.tsx。
6. 与 SSR 的关系：SSR 是"服务端出 HTML，客户端跑同一份组件再水合"；RSC 是"部分组件根本没有客户端版本"，两者可以同时存在。

**追问与易错点**：

- 陷阱：把 RSC 说成"更快的 SSR"。它改变的是组件在网络上的传输形态（传结果而不是代码），不是渲染时机本身。
- 追问：Server Component 能接收函数 props 吗？答：不能，跨边界传递必须可序列化，事件处理函数只能存在于客户端组件内部。
- 追问：流式渲染对 SEO 有影响吗？答：没有，爬虫最终看到的是完整 HTML，只是到达时间分片了。

### Q21 React 19 有哪些新特性？

**考察点**：考版本敏感度，重点是 use、Actions 系列与 ref 作为 prop，能说出解决的问题而不是只报 API 名。

**参考答案**：

> **一句话结论**：React 19 主要围绕数据流与表单补齐能力：`use()` 读取 Promise 或 Context、Actions 把表单提交变成一等公民（useActionState、useFormStatus、useOptimistic），ref 可以直接当普通 prop 传递而不再需要 forwardRef。

1. `use(promise)`：在组件里读取 Promise 或 Context，与 Hook 不同可以放在条件语句里；Promise 必须是稳定引用，通常由服务端创建，配合 Suspense 使用。
2. Actions：`<form action={asyncFn}>` 支持异步函数，React 自动管理 pending、错误和表单重置；`useActionState`（原 useFormState）返回 `[state, formAction, isPending]`。
3. useFormStatus：在 form 内部的子组件里读取父级表单的提交状态，写提交按钮的禁用与 loading 很省事；useOptimistic 做乐观更新，请求失败自动回滚。
4. ref 作为 prop：函数组件直接接收 ref 参数，forwardRef 仍兼容但不再必需；新增 ref 清理函数，`ref` 回调可以返回一个清理逻辑。
5. 其他改进：组件内声明的 title/meta/link 会被自动提升到 head、更清晰的错误信息与水合 diff、useDeferredValue 支持初始值、Server Components 与 Server Actions 稳定。

```jsx
function Submit() {
  const { pending } = useFormStatus();     // 必须放在 <form> 内部的子组件里
  return <button disabled={pending}>{pending ? '提交中' : '提交'}</button>;
}

function Page() {
  const [error, submit, isPending] = useActionState(async (_prev, formData) => {
    const res = await save(formData);
    return res.error ?? null;
  }, null);
  return <form action={submit}><input name="title" /><Submit />{error}</form>;
}
```

**追问与易错点**：

- 陷阱：在渲染里直接 `use(fetch(...))`。每次渲染都新建 Promise 会无限挂起，必须使用缓存或在服务端创建。
- 追问：useFormStatus 为什么在父组件里拿不到状态？答：它读取最近的父级 form 提交上下文，必须写在 `<form>` 内部的子组件中。
- 追问：React 19 还要用 forwardRef 吗？答：新代码可以直接把 ref 当普通 prop，老代码无需改动，仍然兼容。

### Q22 表单怎么做：受控、非受控、还是 react-hook-form？

**考察点**：基础题，考三种表单方案的取舍，能不能按字段规模给出建议并说清性能差异来源。

**参考答案**：

> **一句话结论**：受控组件用 state 驱动 value 与 onChange（可控、可即时校验，代价是每次输入都渲染），非受控组件用 defaultValue 加 ref 让 DOM 自己管（简单、渲染少），react-hook-form 走非受控加订阅式更新，兼顾性能与表单能力。

1. 受控：`<input value={v} onChange={(e) => setV(e.target.value)} />`，状态是唯一数据源，适合即时格式化、字段联动、实时校验。
2. 非受控：`<input defaultValue="x" ref={ref} />`，提交时读 `ref.current.value`，代码最少、渲染最少；缺点是无法做依赖联动和即时提示。
3. react-hook-form：`register('name')` 用 ref 注册字段并订阅，输入时只重渲染订阅了该字段的部分；`handleSubmit` 校验后回调、`formState.errors` 拿错误，配合 zod/yup 作为 resolver 做类型安全的校验。
4. 选型：两三个字段直接受控最省心；十几个字段以上、强校验、动态增删字段用 react-hook-form；一次性提交的冷表单可以用非受控。
5. 易错点：受控 input 的 value 传 undefined 会退化成非受控并报错；只写 value 不写 onChange 会让输入框变成只读。

**追问与易错点**：

- 陷阱：大表单全量受控，每次按键都触发父组件 setState 导致整表单重渲染，输入明显卡顿。
- 追问：为什么 react-hook-form 快？答：非受控取值 + 字段级订阅，输入时不触发整表单重渲染。
- 追问：非受控怎么设置初始值？答：用 defaultValue，不要用 value，否则会和 DOM 状态打架。

### Q23 样式方案怎么选？组件库怎么挑、怎么按需引入？

**考察点**：考工程化视野，从作用域、运行时开销、动态能力三个维度对比，并能给出组件库的取舍与体积控制手段。

**参考答案**：

> **一句话结论**：样式方案看作用域、运行时开销、动态能力三点：CSS Modules 构建时隔离且零运行时，CSS-in-JS 动态能力最强但有运行时成本且与 RSC 有摩擦，Tailwind 等原子化方案构建时生成、约束强、体积可控。

| 方案 | 作用域 | 运行时开销 | 动态样式/主题 | 主要代价 |
| --- | --- | --- | --- | --- |
| CSS Modules | 构建时局部 | 无 | 靠 CSS 变量 | 复用组合能力弱 |
| CSS-in-JS | 运行时生成类名 | 有 | 最强 | 体积增加、RSC 需客户端边界 |
| 原子化 Tailwind | 全局原子类 | 无 | 靠变体与变量 | 类名冗长、需设计约束 |

1. 零运行时替代：vanilla-extract、Linaria、StyleX 在构建时把样式抽成 CSS，兼具类型安全与 SSR/RSC 友好，是 CSS-in-JS 的现代替代。
2. 组件库选型：Ant Design 中后台组件最全、中文文档与生态最好，风格固定、定制靠 ConfigProvider 与 token；MUI 设计体系完整、sx 灵活但包体偏大；shadcn/ui 不是依赖包，而是把源码复制进项目，基于 Radix 加 Tailwind，样式完全可控、无版本锁定，代价是要自己维护升级。
3. 按需引入：现代构建主要靠 ES module tree-shaking，直接 `import { Button } from 'antd'` 即可；antd v5 用 CSS-in-JS，不再需要 babel-plugin-import；图标库必须单独按需引入，它通常是体积黑洞。
4. 体积控制：用 manualChunks 把组件库单独分包，避免首屏带出整库；引入前先估算"为了几个组件付多少 KB"，无样式基座（Radix、Headless UI）往往是更划算的选择。

**追问与易错点**：

- 陷阱：为了几个按钮引入整套组件库，首屏体积与主题定制成本同时失控。
- 追问：Tailwind 会不会让 CSS 膨胀？答：不会，构建时按实际用到的类生成，未使用的会被裁剪，体积与用到的原子类数量成正比。
- 追问：为什么 CSS-in-JS 在 RSC 里麻烦？答：运行时注入样式需要客户端执行，Server Component 里不能用，要么加 `'use client'`，要么迁到零运行时方案。

### Q24 TypeScript 在 React 里的常见写法有哪些？

**考察点**：考 TS + React 的日常写法与 `React.FC` 争议，这是候选人普遍偏弱的部分，答得清楚很加分。

**参考答案**：

> **一句话结论**：优先显式声明 props 类型而不是 React.FC，children 用 PropsWithChildren 或显式 ReactNode，事件用具体的事件泛型，需要多态或泛型组件时直接给函数加类型参数。

1. React.FC 的争议：它隐式带 children（React 18 类型里已移除）、无法表达泛型、固定了返回类型（返回 null 或字符串时不友好）、对 defaultProps 与组合支持差；现在主流是 `function Button(props: ButtonProps)`。
2. PropsWithChildren：`type CardProps = PropsWithChildren<{ title: string }>` 等价于 `{ title: string; children?: ReactNode }`，比 FC 更显式，也便于做联合与扩展。
3. 泛型组件：`function List<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode })`，调用时自动推断；表格、下拉选择器、虚拟列表这类组件常用。
4. 事件与 DOM 类型：`React.ChangeEvent<HTMLInputElement>`、`React.MouseEvent<HTMLButtonElement>`、`React.FormEvent<HTMLFormElement>`；`useRef<HTMLInputElement>(null)` 才能拿到精确的 current 类型，避免 any。
5. 类型复用技巧：`as const` 把对象或数组推断成字面量联合（适合路由表、选项、action type）；`ComponentProps<typeof Button>` 直接复用组件 props 类型；`keyof typeof obj` 取键的联合。

```tsx
type ButtonProps = PropsWithChildren<{
  variant?: 'primary' | 'ghost';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}>;

function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return <button className={variant} onClick={onClick}>{children}</button>;
}

function List<T>({ items, render }: { items: T[]; render: (i: T) => React.ReactNode }) {
  return <>{items.map(render)}</>;
}
```

**追问与易错点**：

- 陷阱：写 `useRef<HTMLInputElement>()`，严格模式下会报类型错误，必须传 `null` 并做好判空。
- 追问：`as const` 和 `as` 一样吗？答：不一样，`as const` 是字面量收窄并加 readonly，`as` 是类型断言，可能掩盖真实错误。
- 追问：为什么不用 `React.FC` 又要写 children 类型？答：显式声明让组件契约一目了然，也避免"这个组件到底接不接 children"的歧义。

### Q25 React 组件测试怎么写？Jest 和 Vitest 怎么选？

**考察点**：考测试思想而不是 API 记忆，重点是"测用户可见行为"与查询优先级。

**参考答案**：

> **一句话结论**：React Testing Library 的核心思想是测用户能看到和操作的行为、不测组件实现细节，查询优先用无障碍语义；Jest 与 Vitest API 基本兼容，用 Vite 的新项目优先 Vitest。

1. 思想：渲染组件 → 用 getByRole、getByLabelText 等语义查询找元素 → userEvent 模拟真实交互 → 断言屏幕上的结果；不测内部 state、不依赖 DOM 结构，所以重构实现时测试不用改。
2. 查询优先级：getByRole 优于 getByLabelText、getByPlaceholderText、getByText，getByTestId 放最后；getBy 找不到直接抛错，findBy 用于异步等待，queryBy 用于断言"不存在"。
3. Jest 与 Vitest：语义与断言 API 高度兼容（vi.fn 对应 jest.fn、vi.mock 对应 jest.mock）；Vitest 复用 Vite 的配置与转换链、原生 ESM、启动快、与前端构建链一致；Jest 生态更成熟、老项目存量多。
4. 网络与异步：用 MSW 在请求层 mock，避免把业务代码整个 mock 掉；`await screen.findByText(...)` 处理异步渲染，不要用 setTimeout 硬等。
5. 分层：单元测试（工具函数、Hook）最多，组件与集成测试居中，端到端（Playwright、Cypress）只覆盖关键链路。

**追问与易错点**：

- 陷阱：断言内部 class 名或组件 state，一改样式与实现测试就红，这类测试反而阻碍重构。
- 追问：为什么很少推荐快照测试？答：大组件快照一改就整片 red，评审时没人细看 diff，只适合极小且稳定的结构。
- 追问：为什么查询优先 getByRole？答：它同时验证了无障碍语义，用户和读屏软件都能找到，测试更接近真实使用。

### Q26 Error Boundary 怎么用？怎么和 Sentry 结合？

**考察点**：考错误兜底与线上监控闭环，重点是能说清 Error Boundary 的能力边界。

**参考答案**：

> **一句话结论**：Error Boundary 用 class 组件的 getDerivedStateFromError 与 componentDidCatch 捕获子树的渲染期错误并显示降级 UI，它抓不到事件处理、异步回调、SSR 和自身错误；线上再配合 Sentry 上报堆栈与上下文定位问题。

1. 能力边界：只捕获渲染、生命周期、构造函数中的错误；事件处理里的异常要自己 try/catch，Promise 拒绝靠 window.onunhandledrejection，SSR 错误在服务端处理。
2. 使用方式：手写需要 class 组件；工程里直接用 react-error-boundary，`<ErrorBoundary FallbackComponent={...} onReset={...} resetKeys={[pathname]}>`，resetKeys 变化时自动复位，切路由即恢复。
3. 粒度设计：不要只包一个全局兜底，路由级、模块级多包几层，避免一个小组件崩溃导致整页白屏。
4. 与 Sentry 结合：在 componentDidCatch 里调 `Sentry.captureException(error, { extra, tags })`，或用 Sentry.ErrorBoundary；必须上传 sourcemap 才能看到真实堆栈，按环境采样、过滤 PII、用 release 关联版本。
5. 监控闭环：把错误量、影响用户数、接口错误率与性能指标放在一起看，才能判断是偶发抖动还是线上故障。

**追问与易错点**：

- 陷阱：以为 Error Boundary 能捕获所有错误，setTimeout 里的异常、Promise 拒绝、服务端渲染异常都不会进入边界。
- 追问：异步错误怎么让它进边界？答：在 catch 里 setState 一个错误标记触发降级，或直接上报 Sentry；React 不会自动接管边界之外的异步错误。
- 追问：为什么必须上传 sourcemap？答：生产代码被压缩混淆，没有 sourcemap 只能看到压缩后的行列号，无法定位源码。

### Q27 Vite 项目工程化要配哪些东西？

**考察点**：考工程化基本功：别名、环境变量、代理、分包、基础路径，全是日常必须踩过的点。

**参考答案**：

> **一句话结论**：Vite 工程化主要配五件事：路径别名、环境变量（VITE_ 前缀）、开发代理、生产分包与基础路径，配置集中在 vite.config.ts 和 .env.[mode] 文件里。

1. 别名：`resolve.alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }`，同时要在 tsconfig 的 paths 里同步一份，否则编辑器与类型检查解析不到。
2. 环境变量：只有 `VITE_` 前缀的变量会被注入 `import.meta.env`；用 `.env.development`、`.env.production` 分环境，`import.meta.env.MODE/PROD/DEV` 是内置的；所有变量都会进客户端产物，**不能放密钥**。
3. 代理：`server.proxy: { '/api': { target, changeOrigin: true, rewrite: p => p.replace(/^\/api/, '') } }`，只解决本地开发跨域，生产的跨域与转发由 Nginx 或网关处理。
4. 分包：用 `build.rollupOptions.output.manualChunks` 把 react 系列、组件库、工具库拆开，避免改业务代码导致 vendor 缓存全失效；用 rollup-plugin-visualizer 看体积，警惕整包引入组件库、moment、lodash。
5. 其他：`base` 配子路径部署、`build.target` 与 legacy 插件决定兼容范围、`define` 注入编译期常量、生产关闭 sourcemap 或上传到监控平台后删除。

```ts
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true,
                rewrite: (p) => p.replace(/^\/api/, '') },
    },
  },
  build: {
    rollupOptions: {
      output: { manualChunks: { react: ['react', 'react-dom'], ui: ['antd'] } },
    },
  },
});
```

**追问与易错点**：

- 陷阱：把接口密钥写成 `VITE_` 变量，它会原样打包进 JS，任何人打开控制台都能看到。
- 追问：为什么本地要代理、线上不用？答：dev 时前后端不同源，代理让浏览器认为是同源请求；线上由网关统一处理跨域与路径转发。
- 追问：分包是不是越细越好？答：不是，chunk 太多会增加请求数与缓存碎片，按"变更频率"分组才合理。

### Q28 常见的 React 组件设计模式有哪些？

**考察点**：考组件抽象能力：容器与展示、复合组件、受控 props、render props、自定义 Hook 各自解决什么问题。

**参考答案**：

> **一句话结论**：组件设计的核心是把变化隔离出去：逻辑用自定义 Hook 抽离、UI 只做渲染、组合用复合组件与 children/render props、交互控制权用受控 props 交给使用方。

1. 容器与展示分离：容器负责取数与状态、展示组件只接收 props 渲染；在 Hook 时代，容器的职责基本被自定义 Hook 取代（`const { data, loading } = useUser()`），组件本身保持薄。
2. 复合组件：`<Tabs>` 加 `<Tabs.Item>`，父组件用 Context 隐式传递选中值与 onChange，子组件消费；使用方不用记一长串 props，API 语义清晰，antd 与 Radix 的 Tabs、Select 都是这个思路。
3. 受控 props：组件同时支持 `value` + `onChange`（受控）与 `defaultValue`（非受控），内部用 `value !== undefined ? value : innerState` 判断；所有表单类组件都应该提供这套约定。
4. render props / children as function：`<DataFetcher render={(data) => <List data={data} />} />`，把"渲染什么"交给调用方；多数场景已被自定义 Hook 替代，但在既要共享状态又要共享结构时仍有用。
5. 自定义 Hook：抽离的是逻辑不是 UI，必须以 use 开头才能使用 Hook 规则；注意每次调用都有独立 state，要做全局共享必须再配 Context 或状态库。

```jsx
const TabsContext = createContext(null);

function Tabs({ value, onChange, children }) {
  return (
    <TabsContext.Provider value={{ value, onChange }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}
Tabs.Item = function TabItem({ id, children }) {
  const { value, onChange } = useContext(TabsContext);
  return <button aria-selected={value === id} onClick={() => onChange(id)}>{children}</button>;
};
```

**追问与易错点**：

- 陷阱：把业务逻辑全塞进一个几千行的万能组件，靠几十个布尔 props 控制分支，应该拆成复合组件或抽成 Hook。
- 追问：cloneElement 还能用吗？答：能用但会隐式覆盖 props、可读性差，优先用 Context 或显式 props。
- 追问：自定义 Hook 能共享状态吗？答：不能，它只共享逻辑，每次调用都是独立 state；共享状态要用 Context 或状态管理库。

## 本章小结

- React Router 6 是"配置即路由"：createBrowserRouter 把 loader/action/errorElement 收进路由表，嵌套路由靠 children + Outlet，守卫用包装组件或 loader 里的 redirect 实现。
- Redux 的根基是单一数据源、state 只读、纯函数 reducer 三原则；RTK 用 configureStore + createSlice + createAsyncThunk 消掉了绝大部分样板，中间件本质是 `store => next => action` 的洋葱链。
- 状态管理选型看状态范围与更新频率：Context 只是依赖注入适合低频值，Zustand 轻量精准订阅，大型复杂业务才需要 Redux Toolkit 的规范与调试生态。
- 性能优化先测量再动手，顺序是减少渲染次数、降低渲染成本、减小加载体积；memo/useMemo/useCallback 只解决引用变化与昂贵计算，滥用反而更慢。
- React 18 的并发特性（useDeferredValue、useTransition）解决紧急交互被阻塞的问题；StrictMode 的双调用是开发环境的副作用自检，正确做法是补清理函数而不是删掉它。
- SSR 家族按"HTML 在哪、何时生成"区分：CSR、SSR、SSG、ISR 各有成本与新鲜度取舍；水合不匹配的根因是首渲染不可预测，时间随机数与浏览器 API 是重灾区。
- RSC 传的是渲染结果而不是组件代码（省 bundle、消瀑布、保安全），App Router 用 `'use client'` / `'use server'` 划边界；React 19 的 use 与 Actions 把表单提交变成一等公民。
- 工程化落到细节：样式方案看运行时开销与 RSC 兼容，组件库要按需引入与分包，TS 少用 React.FC 多用显式 props，测试测用户可见行为，Error Boundary 配 Sentry 形成监控闭环。

<!-- COUNT: 28 -->
