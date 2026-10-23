---
title: "第 17 章 前端工程化与构建工具链"
---

## 第 17 章 前端工程化与构建工具链

### Q1 前端工程化到底要解决什么问题？别只答"用 webpack 打包"

**考察点**：考你是否把工程化理解成一套体系而不是一个工具。能按"开发体验、协作规范、构建、发布、质量"五个维度说清痛点与手段才算过关。

**参考答案**：

> **一句话结论**：前端工程化的本质是把"多人协作、长期维护、频繁发布"带来的重复劳动和人为失误，交给工具链和约定去消除；它至少覆盖开发体验、协作规范、构建、发布、质量这五块。

1. 开发体验：模块化拆分、TypeScript 类型提示、路径别名、本地热更新（Hot Module Replacement，HMR），目标是"改一行代码，一秒内看到效果"。
2. 协作规范：统一的目录结构、代码风格（ESLint/Prettier）、提交信息规范、分支模型，目标是让代码评审只关注逻辑，不争论空格和分号。
3. 构建：把浏览器不认识的语法和资源（TS、Sass、图片、Vue 单文件）转成可运行产物，并做压缩、拆分、兼容处理。
4. 发布：环境变量注入、产物指纹、CDN 上传与缓存刷新、灰度与回滚，目标是"上线可预期、出事能退"。
5. 质量：静态检查、单元/集成/E2E 测试、CI 流水线卡口，目标是把问题拦在合并前而不是线上。
6. 落地载体：脚手架与模板工程把上面这些一次性固化下来，新项目 `create` 出来就自带 lint、HMR、多环境、CI 和 Docker 配置，避免每个项目重新踩坑。

**追问与易错点**：

- 追问：小项目需要这么重吗？答：工程化的成本要和团队规模、项目寿命匹配。个人项目直接 Vite 默认配置就够，硬上 monorepo 与多层 CI 反而是负担。
- 陷阱：把工程化等同于"会写 webpack.config.js"。工具只是手段，面试官想听的是"哪个环节的什么痛点被消除了"。
- 追问：你们项目的脚手架是怎么搭的？答：用 `create-vue` 或自研 CLI（commander + prompts 交互 + degit 拉模板）生成，模板里预置别名、lint、husky、多环境与 CI；关键是要有人维护模板版本，否则"模板腐化"成没人敢用的老配置。

### Q2 Webpack 那几个核心配置项，各自管什么？

**考察点**：考 `entry`/`output`/`loader`/`plugin`/`mode`/`resolve`/`devServer` 的职责边界，能否一眼说出改需求该动哪一项。

**参考答案**：

> **一句话结论**：`entry` 决定从哪开始找依赖，`output` 决定产物写到哪、叫什么名字，`loader` 负责把非 JS 模块翻译成模块，`plugin` 负责在编译生命周期上做任意扩展，`mode` 决定内置优化开关，`resolve` 决定模块怎么找，`devServer` 负责本地服务与热更新。

1. `entry`：依赖图（Dependency Graph）起点，可以是字符串、数组（多入口合并成一个 chunk）或对象（多页应用多入口），也可以是函数做动态入口。
2. `output`：`path`（绝对路径）、`filename`（支持 `[name]`/`[contenthash]` 占位符）、`publicPath`（产物在浏览器里的公共访问前缀，配 CDN 或子路径部署必改）、`clean: true`（构建前清空目录）、asset 相关命名。
3. `module.rules` 的 `loader` 与 `plugins` 的 `plugin`：webpack 只原生理解 JS/JSON，其余资源全靠 loader 翻译，规则写 `test` + `include/exclude` + `use`（`include` 精确到 `src` 是常见提速手段）；plugin 是 `new` 出来的实例，通过钩子干预编译流程，能做抽离 CSS、注入全局变量、生成 HTML 这类 loader 做不到的事。
4. `mode`：`development`/`production`/`none`。`production` 会自动把 `process.env.NODE_ENV` 设为 `production`，并默认开启压缩、tree-shaking（摇树优化）等；不写会警告且拿不到内置优化。
5. `resolve`：`extensions`（省略后缀的补齐顺序，越少越快）、`alias`（路径别名）、`modules`（查找目录）、`mainFields`（决定优先用 `module` 还是 `main`，直接影响 tree-shaking）。
6. `devServer`：基于 webpack-dev-server，产物放内存不落盘，提供 HMR、`proxy` 代理、`historyApiFallback`（支持 history 路由）、`static` 静态目录。

```js
// webpack.config.js 常用骨架
module.exports = {
  mode: 'production',
  entry: { app: './src/main.js' },
  output: { path: path.resolve(__dirname, 'dist'), filename: '[name].[contenthash:8].js',
            publicPath: '/', clean: true },
  resolve: { extensions: ['.js', '.ts', '.vue'], alias: { '@': path.resolve(__dirname, 'src') } },
  module: { rules: [{ test: /\.css$/, use: ['style-loader', 'css-loader'] }] },
  plugins: [new HtmlWebpackPlugin({ template: './public/index.html' })],
};
```

**追问与易错点**：

- 追问：`publicPath` 和 `output.path` 的区别？答：`path` 是磁盘上的输出目录，`publicPath` 是浏览器请求产物时的 URL 前缀，两者没有关系；上 CDN 或部署到子路径时最容易在这翻车。
- 陷阱：`[hash]` 与 `[contenthash]` 混用。`[hash]` 是整个构建的哈希，改一个文件全部文件名变，缓存全失效；生产必须用 `[contenthash]`。
- 追问：为什么线上白屏但本地正常？先看 `publicPath`/`base` 与实际部署路径是否一致，再看 `index.html` 是否被 CDN 长缓存。

### Q3 loader 和 plugin 有什么区别？执行顺序是怎样的？

**考察点**：考职责差异与 loader 链的顺序规则，这题答混基本会被判定为"只会抄配置"。

**参考答案**：

> **一句话结论**：loader 是"文件到模块"的翻译器，工作在模块级别，链式执行且从右到左；plugin 是"构建过程的插桩"，通过钩子作用于整个编译生命周期，能做任意事。

1. 作用对象不同：loader 处理单个文件（或模块）的内容转换，输入源码、输出新代码；plugin 拿到的是 `compiler`/`compilation` 对象，能改产物、加文件、改优化策略。
2. 配置位置不同：loader 写在 `module.rules` 里，按文件类型匹配；plugin 写在 `plugins` 数组里，`new` 实例化后由 webpack 调用其 `apply` 方法。
3. loader 执行顺序：数组里**从右到左**（配置写成分层时是从下到上）。`use: ['style-loader', 'css-loader', 'sass-loader']` 的真实顺序是 sass → css → style。
4. 为什么这个顺序：前一个 loader 的输出是后一个的输入，所以必须"先编译后应用"。`sass-loader` 产出 CSS 字符串，`css-loader` 把它变成 JS 模块，`style-loader` 再把样式注入 `<style>`。
5. loader 还有 pitching 阶段：从左到右执行 `pitch` 方法，用于提前拦截（`style-loader` 就靠 pitch 提前返回注入脚本）。不写 pitch 时可以忽略这个细节。
6. 一个 loader 只能做一件事，组合出能力；plugin 靠 tapable 钩子（后面单开一题）串进流程。判断标准：**"能不能只靠一个文件的内容算出结果"**，能就是 loader。

```js
// 顺序演示：sass-loader → css-loader → style-loader
{ test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] }

// plugin：与文件类型无关，直接作用于编译过程
plugins: [new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' })]
```

**追问与易错点**：

- 追问：`css-loader` 能不能用 plugin 代替？答：不行。抽取 CSS 到独立文件是 plugin 的活（MiniCssExtractPlugin），但把 CSS 代码解析成模块、处理 `@import` 和 `url()` 必须靠 loader，两者是配合关系。
- 陷阱：把 `style-loader` 写在数组最后一个。那样 `css-loader` 收到的是注入脚本的源码而不是 CSS 模块，直接报错。
- 追问：loader 可以是异步的吗？答：可以，调用 `this.async()` 拿到 callback，或直接返回 Promise；访问文件、请求网络的 loader 必须异步。

### Q4 常见 loader 有哪些？让你手写一个 loader 怎么写？

**考察点**：考 loader 清单的广度，以及是否真的理解 loader 函数的入参出参和 `this` 上的上下文 API。

**参考答案**：

> **一句话结论**：loader 就是一个接收源码、返回新源码的函数，可以同步返回、调 `this.async()` 回调或返回 Promise；写自定义 loader 的关键是拿到 `this` 上的上下文（资源路径、配置项、callback）并把 source map 正确串下去。

1. 常用清单：语法类 `babel-loader`/`ts-loader`/`esbuild-loader`/`swc-loader`；样式类 `style-loader`、`css-loader`、`postcss-loader`、`sass-loader`/`less-loader`；框架类 `vue-loader`；模板类 `html-loader`；并行加速 `thread-loader`。
2. Webpack 5 用资源模块（Asset Modules）替代了 `file-loader`/`url-loader`/`raw-loader`：`type: 'asset/resource'` 输出文件，`asset/inline` 转 DataURL，`asset/source` 读成字符串，`asset` 按体积阈值自动二选一。
3. loader 函数签名：`function (source, inputMap, meta)`，同步时 `return`（或返回 `[code, map, meta]`），异步时 `const cb = this.async()` 再 `cb(null, code, map, meta)`。
4. `this` 上的常用 API：`this.resourcePath`（当前文件绝对路径）、`this.getOptions()`（取 loader 配置，替代已废弃的 `loader-utils`）、`this.addDependency()`（把额外文件加入 watch）、`this.emitFile()`（产出文件）、`this.cacheable()`。
5. 想用现成编译器转代码，直接在里面调 babel/esbuild 即可，但要把 `inputSourceMap` 传进去、把新的 map 传出来，否则断点位置会错。
6. 调试手段：`this.emitWarning/emitError` 报错，`this.getLogger()` 打日志；写好后用 `resolveLoader.modules` 或 `resolveLoader.alias` 让本地 loader 能被找到。

```js
// loaders/strip-console.js：删掉源码里的 console 调用
module.exports = function (source, inputMap) {
  const cb = this.async();
  const { code, map } = require('esbuild').transformSync(source, {
    loader: 'js', minify: false, sourcemap: true, sourcefile: this.resourcePath,
  });
  this.addDependency(this.resourcePath); // 参与 watch 与缓存失效
  cb(null, code.replace(/console\.log\([^)]*\);?/g, ''), map);
};
```

```js
// webpack.config.js 里启用本地 loader
resolveLoader: { modules: ['node_modules', path.resolve(__dirname, 'loaders')] }
```

**追问与易错点**：

- 追问：自定义 loader 会被缓存吗？答：会。webpack 5 的持久化缓存按 loader、配置、文件内容算哈希；改了 loader 代码要重启或改 `buildDependencies`，否则旧结果被复用。
- 陷阱：手写 loader 时直接改 `source` 而不是返回新值，或者返回值不是字符串/`Buffer`，报 "loader must return a string or Buffer"。
- 追问：为什么 `babel-loader` 一定要配 `exclude: /node_modules/`？答：否则会把成千上万个依赖也用 Babel 转一遍，构建时间翻几倍；但需要转某个依赖时，可以用 `include` 精确放行，或用 `transpileDependencies` 白名单。

### Q5 plugin 的原理是什么？说说 tapable 和编译生命周期钩子

**考察点**：考插件机制的本质。能说出"webpack 自身就是 tapable 的主控台上的插件集合"并列出关键钩子，才算到深挖档。

**参考答案**：

> **一句话结论**：webpack 的编译过程暴露成一系列 tapable 钩子，plugin 就是一个带 `apply(compiler)` 方法的类，在钩子上注册回调从而干预构建；`compiler` 代表整个生命周期，`compilation` 代表一次构建。

1. 骨架：`Compiler`（全局唯一，管理配置、watch、输出）与 `Compilation`（每次编译新建，持有模块图、chunk 图、assets）。webpack 内部几乎所有功能都是插件，配置文件里的 `plugins` 只是额外的。
2. tapable 提供 9 类钩子：同步的 `SyncHook`/`SyncBailHook`/`SyncWaterfallHook`/`SyncLoopHook`；异步的 `AsyncParallelHook`/`AsyncParallelBailHook` 与 `AsyncSeriesHook`/`AsyncSeriesBailHook`/`AsyncSeriesWaterfallHook`。
3. 注册方式必须与钩子类型匹配：同步用 `tap`，异步回调式用 `tapAsync`（收 `(…args, callback)`），Promise 式用 `tapPromise`（返回 Promise），否则直接报错。
4. 关键生命周期（`compiler.hooks`）：`environment` → `entryOption` → `afterPlugins` → `compile` → `make`（开始构建模块）→ `emit`（写产物前）→ `afterEmit` → `done`；`compilation.hooks`：`buildModule`/`succeedModule`（模块级）、`optimizeModules`、`optimizeChunks`、`processAssets`（改产物，最常用）、`afterSeal`。
5. 改产物的现代写法：`compilation.hooks.processAssets.tap({ name, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL }, (assets) => {...})`，用 stage 控制与其它插件的先后；`compiler.hooks.emit` 是老写法，仍可用但时机偏晚。
6. 写插件模板：`class MyPlugin { constructor(options){} apply(compiler){ compiler.hooks.done.tap('MyPlugin', (stats) => {...}) } }`。`apply` 由 webpack 在初始化阶段调用，这也是为什么插件必须 `new`。

```js
// 统计产物文件数的插件
class SizeReportPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('SizeReportPlugin', (stats) => {
      const { assets } = stats.toJson({ assets: true });
      const total = assets.reduce((sum, a) => sum + a.size, 0);
      console.log('产物总大小：', (total / 1024).toFixed(1), 'KB');
    });
  }
}
```

**追问与易错点**：

- 追问：watch 模式下 `compiler` 会重建吗？答：不会，`compiler` 只有一个，每次文件变更产生新的 `compilation`；所以插件里缓存跨越多次编译的数据要挂在 `compiler` 上，而单次构建的状态挂在 `compilation` 上。
- 陷阱：用 `tap` 注册 `AsyncSeriesHook` 后在回调里做异步操作却不返回 Promise，webpack 会在你操作完成前就继续往下走，产物时有时无。
- 追问：想在产物里追加一行注释怎么最快？答：`compilation.emitAsset`/`updateAsset` 比直接操作 `compilation.assets` 对象更安全，后者在 webpack 5 已被限制写操作。

### Q6 Webpack 从敲下 `npm run build` 到产出文件，中间发生了什么？

**考察点**：考完整构建流程的三段式（初始化 → 编译 → 输出），能讲到模块图与 chunk 图两个数据结构的层次就到位了。

**参考答案**：

> **一句话结论**：读配置建 `Compiler` 并挂插件是初始化，从 entry 出发用 loader 转模块、递归解析依赖建模块图是编译，把模块图按规则切成 chunk、优化、生成 assets 写盘是输出。

1. 初始化：合并配置（`webpack.config.js` → 命令行参数 → 默认值），创建 `Compiler` 实例，遍历 `plugins` 调用各自的 `apply(compiler)`，把回调挂到钩子上；如果开了 `cache.type: 'filesystem'`，此时读取磁盘缓存。
2. 编译入口：`compiler.compile` → `make` 钩子 → 从 `entry` 生成入口模块，交给 `NormalModuleFactory` 处理。
3. 解析模块：用 enhanced-resolve 按 `resolve` 规则把 `import './a'` 变成绝对路径（依次尝试 `extensions`、读 `package.json` 的 `mainFields`），命中缓存就不再解析。
4. 转换模块：把文件内容按 `module.rules` 依次交给 loader 链，然后用 acorn 解析成 AST，找出 `import`/`require`/`import()` 作为依赖，**递归**处理，最终得到模块图（ModuleGraph）。
5. 封装（seal）与优化：根据入口与 `import()` 边界把模块分配到 chunk，形成 chunk 图；随后执行 `optimization` 的优化——tree-shaking 标记、`splitChunks` 拆包、`runtimeChunk`、`minimizer` 压缩。
6. 输出：`compilation.hooks.processAssets` 生成最终 assets（含 `HtmlWebpackPlugin` 注入的 HTML），`emit` 钩子后由 `compiler.outputFileSystem` 写入 `output.path`；用 devServer 时文件系统是内存实现（memfs），所以 dist 目录看不到文件。

```bash
# 想看清每步耗时，用统计输出而不是猜
npx webpack --profile --json > stats.json
npx webpack --progress
```

**追问与易错点**：

- 追问：为什么改了 `src` 下文件 devServer 很快？答：增量编译只重建受影响的模块与 chunk，其余命中内存缓存；所以"第一次慢、后面快"是正常的。
- 陷阱：以为 loader 是在打包阶段才跑。loader 在"构建模块图"阶段就逐个文件执行了，`plugin` 的 `emit` 阶段拿到的是已经处理完的产物。
- 追问：`import()` 与 `import` 在流程上有何不同？答：静态 `import` 的模块直接进当前 chunk；`import()` 会在 chunk 图上开一个新的异步 chunk，运行时用 JSONP 动态加载，这也是 code splitting 的实现基础。
### Q7 热更新（HMR）的原理是什么？`module.hot` 怎么用？

**考察点**：考 HMR 的完整链路（文件变更 → 编译 → WebSocket 通知 → 拉取补丁 → 模块替换），以及 accept 冒泡这个最容易答漏的点。

**参考答案**：

> **一句话结论**：HMR 是"改动后不刷新页面，只替换变更的模块并执行其 accept 回调"的机制；它靠 devServer 的 WebSocket 通知浏览器、靠 hot-update 补丁文件同步差异，靠 `module.hot.accept` 声明更新边界。

1. 前提：devServer 开 `hot: true`，webpack 会把 HMR runtime（`webpack/hot/dev-server` 与 `webpack/hot/runtime`）注入 bundle，并建立 WebSocket（早期用 SockJS）长连接。
2. 文件变更：watcher 触发增量编译，产出两类补丁文件——`xxx.hot-update.json`（本次变更的 chunk 与当前 hash 清单）和 `xxx.hot-update.js`（变更模块的新代码）。
3. 通知与拉取：devServer 通过 WebSocket 把 `hash` 推给浏览器，HMR runtime 用 JSONP 拉 `.hot-update.json`，对比本地 chunk 的 hash 决定要更新哪些 chunk，再拉对应的 `.hot-update.js`。
4. 替换：调用 `hotApply`，把新模块写进模块缓存；然后从变更模块向上找"声明了 accept 的模块"，执行其回调。若整条链冒泡到入口都没人 accept，就降级为整页刷新（full reload）。
5. `module.hot` 常用 API：`accept(deps, cb)` 声明接受自身或依赖更新、`dispose(cb)` 在旧模块被替换前清理副作用（清定时器、解绑事件）、`decline` 明确拒绝、`invalidate` 强制失效。
6. 实际项目中不手写 `module.hot`：Vue 的 `vue-loader`、React 的 `react-refresh` 会在组件模块里自动注入 accept 与状态保留逻辑；手写只在非框架的资源（如工具模块、样式）上出现。

```js
// 手写 HMR 边界：print.js 变化时只重跑这个回调，不刷新页面
import print from './print.js';
if (module.hot) {
  module.hot.accept('./print.js', () => {
    console.log('print.js 已更新');
    print();
  });
  module.hot.dispose(() => clearInterval(timer)); // 旧模块的清理
}
```

**追问与易错点**：

- 追问：为什么有时改了代码页面还是整页刷新？答：变更模块的父链上没人 accept，冒泡到 entry 就降级成 reload。常见于直接改 `main.js` 或改了非组件文件。
- 陷阱：HMR 只替换代码，**不重置模块内部状态**。所以 `const config = load()` 这类模块级初始化不会再跑；要重新执行必须显式 `module.hot.invalidate()` 或刷新页面。
- 追问：HMR 与热重载（Hot Reload）一样吗？答：不同。HMR 是模块级替换；Hot Reload 常指组件级状态保留的重载，React Refresh、Vue HMR 属于后者，是建立在 HMR 之上的能力。
- 陷阱：把 HMR 当性能优化手段。它是开发期工具，生产构建不会带 HMR 代码。

### Q8 tree-shaking 的原理是什么？为什么有时摇不掉？

**考察点**：考两点——ESM 静态可分析这个前提，以及 `sideEffects` 与 `usedExports`/`terser` 的分工。答"删掉没用的代码"是零分答案。

**参考答案**：

> **一句话结论**：tree-shaking 依赖 ES Module 的静态结构做"标记"，再由 Terser 做"删除"；前提是 ESM、`mode: production`、以及包的 `sideEffects` 声明，任何一环缺失就摇不掉。

1. 原理分两步：webpack 用 `optimization.usedExports`/`providedExports` 标记哪些导出被用到（标记不等于删除），最后交给 TerserPlugin 做死代码消除（Dead Code Elimination，DCE）真正删掉。
2. 前提一：必须是 ESM。`import`/`export` 出现在模块顶层、路径是字面量，才能在不执行代码的情况下静态分析；CommonJS 的 `require` 可以写在条件里、`module.exports` 可被运行时改写，几乎无法安全删除。
3. 前提二：`sideEffects` 字段。`package.json` 写 `"sideEffects": false` 告诉打包器"本包模块没有副作用，没被用到就能删"；undefined 时 webpack 会保守地认为有副作用，不敢删整个模块。
4. 有 CSS 或副作用文件时要写白名单：`"sideEffects": ["*.css", "*.scss", "./src/polyfill.js"]`，否则样式被摇掉、页面莫名裸奔。
5. 前提三：`mode: 'production'`。开发模式下 `usedExports` 虽会标记但 Terser 不压缩，看不出效果；想调试可以临时开 `optimization.usedExports: true` 看打包注释。
6. 常见破坏者：Babel 的 `@babel/preset-env` 若把 ESM 转成 CJS，静态结构消失（babel-loader 会自动传 `supportsStaticESM`，但单独用 `@babel/cli` 时要显式 `modules: false`）；`export default { a, b }` 这种聚合导出只能整块保留；真正有副作用的顶层语句（如 `window.x = 1`）无法被摇掉，只有看似无副作用的调用才能靠 `/*#__PURE__*/` 注解提示。

```js
// 摇不掉：整包引入 + 默认导出聚合
import _ from 'lodash';                 // 全量打进产物
export default { a, b, c };

// 摇得掉：具名导入 + 纯函数标记
import { debounce } from 'lodash-es';
export const add = /*#__PURE__*/ makeAdd(); // 提示调用无副作用
```

**追问与易错点**：

- 追问：`sideEffects: false` 写错了会怎样？答：真正的副作用被删，比如样式没加载、polyfill 没生效、原型扩展丢了一一这都是线上事故，只在确认"每个模块纯函数式"时才敢写 false。
- 陷阱：认为 tree-shaking 能删掉 `import` 进来但没调用的**第三方 CJS 包**。它只能删你项目内被证明未使用的导出，CJS 依赖基本原样打包。
- 追问：怎么验证摇树有没有生效？答：用 webpack-bundle-analyzer 看产物里目标模块的残留，或搜产物中是否出现该函数名字符串；也可以对比 `sideEffects` 开/关的产物体积差。

### Q9 code splitting 怎么做？`splitChunks` 的策略和预加载怎么配？

**考察点**：考三层能力：为什么要拆、拆的三种手段（多入口 / splitChunks / 动态 import）、预加载与预取的选型。能说出 `chunks: 'async'` 这个默认值陷阱才算过关。

**参考答案**：

> **一句话结论**：code splitting 就是把一个 bundle 拆成多个按需/并行加载的 chunk：多入口按页面拆、`splitChunks` 按复用度抽公共依赖、动态 `import()` 按路由和大组件拆；预取用 `webpackPrefetch`，预加载用 `webpackPreload`。

1. 动态 `import()`：webpack 把 `import()` 的模块单独打成异步 chunk，运行时通过 `__webpack_require__.e` 用 JSONP 注入 `<script>`，返回 Promise。这是路由懒加载的实现方式。
2. `splitChunks` 默认值：`chunks: 'async'`（**默认只拆异步 chunk**）、`minSize: 20000`、`minChunks: 1`、`maxAsyncRequests/maxInitialRequests: 30`；默认有两个 cacheGroup：`defaultVendors`（`node_modules` 下、priority -10）和 `default`（被引用 ≥2 次、priority -20）。
3. 要把同步依赖也抽出来必须写 `chunks: 'all'`；按业务自定义 cacheGroup 时 priority 越大越优先命中，`reuseExistingChunk: true` 避免重复打包同一模块。
4. 拆包原则：vendor 稳定（升级不频繁，便于长期缓存）、业务代码按路由切、公共组件单独成 chunk；`optimization.runtimeChunk: 'single'` 把 webpack 运行时代码单独抽出，避免改业务代码导致 vendor 文件名变化。
5. 预加载指令：`webpackPrefetch: true` 在浏览器空闲时以低优先级预取，用于"下一步大概率会用"的模块（如首页预取详情页）；`webpackPreload: true` 与父 chunk 并行加载，用于"当前就一定需要"的模块，滥用会抢首屏带宽。
6. 取舍：chunk 不是越小越好。HTTP/2 有多路复用，但每个请求仍有头部与解析开销；把首屏关键路径切成十几个小 chunk 反而更慢，非关键路径才值得拆。

```js
// 路由级懒加载 + 空闲预取
const routes = [
  { path: '/', component: () => import('./views/Home.vue') },
  { path: '/report', component: () => import(/* webpackChunkName: "report" */ './views/Report.vue') },
  { path: '/help', component: () => import(/* webpackPrefetch: true */ './views/Help.vue') },
];

// 让同步依赖也参与拆包，并把 vue 全家桶打成稳定 vendor
optimization: {
  runtimeChunk: 'single',
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: { test: /[\\/]node_modules[\\/](vue|vue-router|pinia)[\\/]/, name: 'vendor', priority: 20 },
      common: { minChunks: 2, minSize: 20000, priority: -10, reuseExistingChunk: true },
    },
  },
}
```

**追问与易错点**：

- 陷阱：只写 `splitChunks: { cacheGroups: {...} }` 却没写 `chunks: 'all'`，结果 vendor 死活不生效——因为默认只管异步 chunk，而入口是同步的。
- 追问：`preload` 与 `prefetch` 有什么区别？答：`preload` 与父 chunk 并行、优先级高、浏览器必须下载；`prefetch` 空闲时下载、优先级最低，且父 chunk 加载完才触发。用错会把"将来要用的"塞进首屏关键路径。
- 追问：拆完后 chunk 数量暴涨怎么排查？答：看分析图里是否有大量 1-2KB 的小 chunk，通常是 `minSize` 太小或 `maxInitialRequests` 放太宽，把它们合并回主 chunk 或提高 `minSize`。

### Q10 source map 有哪几种？生产环境到底该不该开？

**考察点**：考 `devtool` 修饰词（eval/cheap/module/inline/hidden/nosources）的真实含义，以及生产环境"要不要、怎么给、给谁"的工程判断。

**参考答案**：

> **一句话结论**：`devtool` 的取值是"如何生成映射"的开关组合，开发用 `eval-cheap-module-source-map` 求快，生产默认关闭，需要线上排错时用 `hidden-source-map` 生成但不上传到 CDN、只传给错误监控平台。

1. 基础形式：`source-map` 生成独立 `.map` 文件并在产物末尾加 `//# sourceMappingURL=` 注释；`inline-source-map` 把 map 以 DataURL 内联进产物（体积膨胀，只适合开发）。
2. `eval` 前缀：用 `eval()` 包裹每个模块执行，映射快但映射到的是转换后的中间代码；因为用 eval，开启 CSP `unsafe-eval` 限制的页面会失效。
3. `cheap` 前缀：只映射到行、不映射到列，构建速度快很多；`module` 前缀：映射到 loader 转换**之前**的源码（也就是你写的 TS/Vue 源码），不加 module 会指向 babel 的输出。
4. `hidden-source-map`：正常生成 `.map` 文件，但**不在产物里写注释**，浏览器开发者工具不会自动加载；错误监控 SDK 配置 `sourceMappingURL` 后可以自行还原堆栈。
5. `nosources-source-map`：有映射但不带源码内容，能看到行列和文件名，看不到源码原文，是"能定位但不泄露源码"的折中。
6. 生产推荐：常规项目 `devtool: false`；接入 Sentry 等监控时用 `hidden-source-map`，并在构建后把 `.map` 上传到监控平台，同时确保 `.map` 不出现在最终发布的 CDN 上（要么不上传，要么加访问控制）。

```js
// webpack.config.js
module.exports = (env) => ({
  devtool: env.production ? 'hidden-source-map' : 'eval-cheap-module-source-map',
});

// vite.config.js：Vite 生产默认 false，这里按需开启隐藏映射
export default { build: { sourcemap: 'hidden' } };
```

**追问与易错点**：

- 追问：为什么生产用 `hidden-source-map` 而不是 `source-map`？答：`source-map` 会在产物末尾留注释，任何人打开控制台都能拿到完整源码，等同于源码泄露；`hidden` 去掉注释，只有拿到 map 文件的人才能还原。
- 陷阱：开发用 `source-map`（不 eval、不 cheap）。构建慢、映射准，改一次等好几秒，属于用错档位。
- 追问：source map 会影响线上性能吗？答：浏览器只在开发者工具打开时才解析 map，运行时不加载，所以不影响首屏；但 `eval` 类 devtool 会改变产物形态，绝不能上生产。

### Q11 构建速度太慢，你怎么优化？

**考察点**：考是否有"先量化再优化"的方法论，以及缓存、并行、缩小范围三类手段的具体配置。

**参考答案**：

> **一句话结论**：先量化定位——用 profile 与 speed-measure-webpack-plugin 找出耗时大头，再按"缩小搜索与处理范围 → 开缓存 → 上并行/换快编译器 → 减少工作量"的顺序优化。

1. 量化：`webpack --profile --json > stats.json` 看各模块与 loader 耗时，或 `speed-measure-webpack-plugin` 直接输出每个 loader/plugin 的耗时；不要凭感觉换工具。
2. 缩小范围：`resolve.extensions` 只留必要的后缀、`alias` 配绝对路径、`module.rules` 精确 `include: src`、`resolve.modules` 限定 `node_modules` 位置、`resolve.symlinks: false`（pnpm/monorepo 场景省去真实路径解析）。
3. 开缓存：webpack 5 写 `cache: { type: 'filesystem', buildDependencies: { config: [__filename] } }`；`babel-loader` 加 `cacheDirectory: true`；Terser 的 `cache` 默认在持久化缓存里；CI 上把缓存目录做 key 缓存复用。
4. 上并行：`thread-loader` 放在耗时 loader 之前把工作分给 worker 池（本身有启动开销，只对重 loader 值得）；`terser-webpack-plugin` 的 `parallel` 默认已是 CPU 数减一。
5. 换快编译器：用 `esbuild-loader`/`swc-loader` 替代 `babel-loader`，压缩交给 `esbuild` 或 `TerserPlugin` 的 esbuild minify，通常能省掉一半以上的构建时间。
6. 减少工作量：TypeScript 用 `transpileOnly`/`isolatedModules` 只转不检查，类型检查交给 `fork-ts-checker-webpack-plugin` 或在 CI 单独跑 `tsc --noEmit`；`externals` + CDN 外置大库；`IgnorePlugin` 砍掉 moment 的 locale 等无用文件；库加 `sideEffects` 让摇树更彻底。

```js
module.exports = {
  cache: { type: 'filesystem', buildDependencies: { config: [__filename] } },
  resolve: { extensions: ['.ts', '.tsx', '.js'], symlinks: false },
  module: {
    rules: [{
      test: /\.[jt]sx?$/, include: path.resolve(__dirname, 'src'),
      use: [{ loader: 'esbuild-loader', options: { target: 'es2015', tsconfigRaw: {} } }],
    }],
  },
  optimization: { minimizer: [new TerserPlugin({ parallel: true, cache: true })] },
};
```

**追问与易错点**：

- 追问：持久化缓存什么时候失效？答：配置文件、loader 代码、依赖版本、`NODE_ENV` 变化都会让缓存整体失效；改了自定义 loader 要让 `buildDependencies` 带上它，否则用到旧缓存结果。
- 陷阱：无脑上 thread-loader。它对小项目是负优化（worker 启动与序列化开销大于收益），只应加在最耗时的 loader 前面。
- 追问：升级 webpack 5 就能快吗？答：持久化缓存和更好的默认值确实能显著提速，但真正的大头通常还是 Babel 编译与 Terser 压缩，换 esbuild/swc 收益更大。

### Q12 产物太大，你怎么定位问题并优化？

**考察点**：考分析工具的使用与常见"体积元凶"的清单，要能给出查证步骤而不是空谈"用 CDN"。

**参考答案**：

> **一句话结论**：先用 webpack-bundle-analyzer 看产物构成找出占比最大的模块，再按"重复打包 → 全量引入 → 未摇树 → 未拆包 → 未压缩"的顺序逐项排掉。

1. 工具：`webpack-bundle-analyzer` 的 `BundleAnalyzerPlugin` 生成可交互的矩形树图（treemap），能按 gzip 后体积排序；`webpack --profile --json > stats.json` 可上传到在线分析站点；Vite 用 `rollup-plugin-visualizer`。
2. 更准的视角用 `source-map-explorer`：它基于 source map 归因到**源码文件**而不是 chunk，能发现"某依赖被多个 chunk 重复打入"。
3. 元凶一：重复依赖。同一库的多个版本共存（`npm ls lodash`/`pnpm why` 可查），用 `overrides`/`resolutions`/`pnpm.overrides` 统一版本。
4. 元凶二：全量引入。`import _ from 'lodash'` 换 `lodash-es` + 具名导入，`echarts` 用按需引入，UI 库确认按需插件生效（`babel-plugin-import`/`unplugin-vue-components`），`moment` 换 `dayjs` 或用 `IgnorePlugin` 去掉 locale。
5. 元凶三：没摇树/没压缩。检查依赖是否提供 ESM 入口（`mainFields` 里 `module` 要优先）、`sideEffects` 是否声明；确认产物是 gzip/brotli 后的体积（`compression-webpack-plugin`），别被未压缩数字吓到。
6. 元凶四：没拆包或拆得不对。首屏 chunk 过大时做路由级懒加载，把报表、编辑器、富文本这类重模块挪出关键路径；也可考虑 `externals` 外置到 CDN、或先做低垂果实（如删掉只用于开发的 polyfill）。

```js
// webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
module.exports = {
  plugins: [new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false,
    reportFilename: 'report.html', gzipSize: true })],
};
```

**追问与易错点**：

- 追问：首屏加载慢，但产物总体积不大，怎么想？答：看首屏关键路径的 chunk 与资源瀑布图，可能是拆包把首屏依赖切碎了、或者某个大库被同步引入主 chunk，用分析图的 initial chunk 视角找。
- 陷阱：只看未压缩体积。一个 1MB 的 JS 压缩后可能只有 250KB，判断优先级必须用 gzip/brotli 后的体积排序。
- 追问：CDN 外置（`externals`）是万能方案吗？答：不是。它把下载成本转给第三方域名与用户的额外连接，且失去版本一致性保障；只有在库体积大、版本稳定、且有可用公共 CDN 时才划算。
### Q13 Vite 为什么快？说说它的原理

**考察点**：考是否理解"开发不打包、生产才打包"这个核心，以及依赖预构建、原生 ESM、基于 ESM 的 HMR 三块拼图。

**参考答案**：

> **一句话结论**：Vite 开发期利用浏览器原生 ES Module 做按需编译，不打包整个应用，因此冷启动时间与项目规模基本无关；生产期则用 Rollup 打包，兼顾产物质量。

1. 开发服务器（serve）：浏览器请求 `main.js` 时，Vite 才把这个模块（以及它 import 的下一个模块）编译成浏览器能执行的 ESM 返回，请求驱动、按需编译；不再像 webpack 那样先构建完整依赖图。
2. 依赖预构建（Dependency Pre-Bundling）：用 esbuild 把 `node_modules` 里的 CommonJS/UMD 依赖转成 ESM，并把内部模块成百上千的包（如 `lodash-es`）合并成单个文件，避免"一个依赖引发几百个 HTTP 请求"。结果缓存在 `node_modules/.vite`，锁文件或配置变化时重建。
3. HMR：基于原生 ESM 的边界替换。文件变更后服务端通过 WebSocket 通知浏览器，只让变更模块自身或其 importer 重新请求，不需要重建整张模块图，因此大项目里热更新也很快。
4. 内置转换：`.ts`、`.vue`、`.scss`、JSX 都由 Vite 直接处理，esbuild 负责 TS/JSX 转译（**只转译不检查类型**），类型检查仍需 `vue-tsc`/`tsc --noEmit`。
5. 生产构建（build）：用 Rollup 打包，默认 `build.target` 为 `'modules'`（面向支持原生 ESM 的浏览器，Vite 6 起改为 `'baseline-widely-available'`），做 tree-shaking、CSS 抽取、资源指纹；需要兼容旧浏览器时加 `@vitejs/plugin-legacy` 生成 legacy 包与 polyfill。
6. 插件体系：兼容大部分 Rollup 插件，另加 Vite 独有钩子（`config`、`configureServer`、`transformIndexHtml`、`handleHotUpdate`）；插件可用 `apply: 'serve' | 'build'` 限定生效环境。

```js
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  server: { port: 5173, warmup: { clientFiles: ['./src/main.js'] } },
  optimizeDeps: { include: ['lodash-es'] }, // 手动指定需预构建的依赖
  build: { target: 'modules', rollupOptions: { output: { manualChunks: { vendor: ['vue'] } } } },
});
```

**追问与易错点**：

- 追问：为什么 Vite 开发快、生产构建有时反而比 webpack 慢？答：生产构建由 Rollup 完成，Rollup 主体是 JS 单线程，超大项目上打包仍是瓶颈（Rolldown 等 Rust 实现正在解决）；"dev 快"不等于"build 快"。
- 陷阱：以为预构建只是转格式。它同时做了 CJS→ESM 转换、请求合并、以及内部依赖的缓存，这三件事共同决定了首次打开页面的速度。
- 追问：为什么 Vite 要求浏览器支持原生 ESM？答：它的开发服务器直接给浏览器喂 ESM，不支持 `type="module"` 的老浏览器在开发期就跑不起来，所以 Vite 明确不支持 IE11（生产兼容靠 `plugin-legacy` 也有上限）。

### Q14 Vite 和 Webpack 怎么选？各自强在哪？

**考察点**：考选型判断力，而不是背参数。要能说清开发/生产差异、生态差异、以及老项目为什么通常不动。

**参考答案**：

> **一句话结论**：新项目、现代浏览器、Vue3/React 技术栈优先 Vite（开发体验碾压、配置少）；老项目、需要深度定制构建流程、依赖 webpack 特有 loader/插件或模块联邦的场景继续用 Webpack。

1. 原理差异：Webpack 是"先打包再服务"，dev 启动要构建完整依赖图，规模越大越慢；Vite 的 dev 是按需编译加原生 ESM，启动近乎常数时间。
2. 生产差异：Webpack 自带完整优化体系（splitChunks、Module Federation 等，可调项极多）；Vite 生产交给 Rollup，产物干净、tree-shaking 彻底，但复杂分包的可控性不如 webpack。
3. 生态差异：Webpack 的 loader/plugin 最庞大，冷门资源格式与公司内部历史插件都集中在它身上；Vite 插件较新，遇到偏门需求可能得自己写 Rollup 插件。
4. 一致性差异：Vite 的 dev（esbuild）与 build（Rollup）是两套管线，偶发行为不一致（如 CJS 依赖 dev 能预构建、build 需额外配置）；Webpack 两端共用同一套 loader/plugin。
5. 成本差异：新项目用 Vite 配置量通常只有 webpack 的十分之一；迁移存量项目则要逐个处理别名、环境变量、自定义 loader 与 CSS 处理顺序的差异。
6. 结论：新项目优先 Vite；存量项目除非构建慢到影响开发效率，否则不动——迁移收益比不上回归风险。

| 维度 | Webpack | Vite |
| --- | --- | --- |
| dev 原理 | 先打包，再服务内存产物 | 原生 ESM，按需编译 |
| 冷启动 | 随项目规模增长 | 基本与规模无关 |
| 生产打包 | Webpack 自身 | Rollup |
| 配置复杂度 | 高，可调性强 | 低，约定优先 |
| 插件生态 | 极大，历史包袱也大 | 较新，兼容 Rollup 插件 |
| 模块联邦 | 原生支持 | 需实验插件 |

**追问与易错点**：

- 追问：把 webpack 项目迁到 Vite 最容易出问题的地方？答：`process.env` 要换成 `import.meta.env`、别名与 `base` 要重新配、Node 内置模块的 polyfill 默认不提供、以及依赖 CJS 的包需要 `optimizeDeps.include`。
- 陷阱：说"Vite 就是不要打包"。生产必须打包（Rollup），只是开发期不打包；如果生产也不打包，就会产生成百上千个请求与无 tree-shaking 的产物。
- 追问：什么情况下必须留在 Webpack？答：需要 Module Federation 做微前端、需要兼容 IE11、有大量自研 webpack loader/plugin、或构建流程被 CI/发布系统深度耦合时。

### Q15 Vite 的环境变量和多环境配置怎么做？

**考察点**：考 `.env` 文件加载优先级、`VITE_` 前缀这条安全护栏，以及"构建时替换"带来的产物复用问题。

**参考答案**：

> **一句话结论**：Vite 用 `.env`/`.env.[mode]` 文件加载环境变量，只有 `VITE_` 前缀的会通过 `import.meta.env` 暴露给客户端；它是构建时静态替换，因此一份产物只能对应一个环境。

1. 文件与优先级：`.env`（所有模式）→ `.env.local`（所有模式，应加入 .gitignore）→ `.env.[mode]` → `.env.[mode].local`；同名变量后加载的覆盖先加载的。
2. 模式（mode）：`vite dev` 默认 `development`，`vite build` 默认 `production`；用 `vite build --mode staging` 加载 `.env.staging`，并可通过 `import.meta.env.MODE` 读到。
3. 前缀护栏：只有 `VITE_` 开头的变量会被注入客户端（可用 `envPrefix` 改前缀）。这是防止把数据库密码、内部 token 这类服务端变量误打进前端产物的关键机制，`import.meta.env` 里绝不会出现未加前缀的变量。
4. 内置变量：`import.meta.env.MODE`、`BASE_URL`、`DEV`、`PROD`、`SSR`；TypeScript 项目要加 `/// <reference types="vite/client" />` 并声明 `ImportMetaEnv` 才有提示。
5. 实现机制：变量在构建时被**静态文本替换**成字面量（等价于 webpack 的 DefinePlugin），所以 `import.meta.env[key]` 这种动态取值不生效，必须写 `import.meta.env.VITE_API_BASE`。
6. 想一份产物跑多环境：不要靠环境变量，改用运行时配置——`public/config.js` 里挂 `window.__APP_CONFIG__` 并在 `index.html` 里先引入，或启动时 `fetch('/config.json')`；部署时只替换这一个文件，不用重新构建。

```js
// .env.production
VITE_API_BASE=https://api.example.com
DB_PASSWORD=xxx            // 没有 VITE_ 前缀，不会进产物

// src/api/http.js
const base = import.meta.env.VITE_API_BASE; // 构建时被替换为字符串字面量
console.log(import.meta.env.MODE);          // "production"

// public/config.js —— 运行时注入，部署时可改
window.__APP_CONFIG__ = { apiBase: 'https://api.example.com' };
```

**追问与易错点**：

- 陷阱：把密钥写成 `VITE_DB_PASSWORD`。加了前缀就会被原样打进 JS，任何人按 F12 都能看到——前缀是"可以公开"的标记，不是加密。
- 追问：为什么改了 `.env` 要重启 dev server？答：变量在启动与构建时被替换并参与依赖预构建的哈希，改文件后需要重启（或 Vite 自动重启）才能生效。
- 追问：webpack 里怎么对应？答：用 `new webpack.DefinePlugin({ 'process.env.API_BASE': JSON.stringify(url) })`，注意值必须 `JSON.stringify`，否则字符串会被当成变量名解析成报错代码。

### Q16 Babel 的原理是什么？`preset` 和 `plugin` 的执行顺序呢？

**考察点**：考 Babel 三步流程（解析→转换→生成）、它是"源码到源码的转译器而不是打包器"这个定位，以及顺序规则这个高频细节。

**参考答案**：

> **一句话结论**：Babel 是源码到源码的转译器，流程是解析成 AST、由插件通过 visitor 改写 AST、再生成代码与 source map；plugin 按数组正序执行，preset 按数组倒序执行，且 plugin 先于 preset。

1. 解析（parse）：`@babel/parser` 把源码转成抽象语法树（Abstract Syntax Tree，AST），遵循 ESTree 规范；语法插件（`@babel/plugin-syntax-*`）只负责让解析器认识新语法，不做转换。
2. 转换（transform）：`@babel/traverse` 深度优先遍历 AST，插件通过 `visitor` 声明"遇到某类节点时做什么"，用 `@babel/types` 增删改节点。AST 只描述结构，注释与格式信息默认不保留。
3. 生成（generate）：`@babel/generator` 把 AST 打印回代码，同时产出 source map（映射回原始源码），再配合 `@babel/code-frame` 给出可读的报错位置。
4. 执行顺序：`plugins: [A, B]` 按 A 再到 B 执行；`presets: [X, Y]` 按 Y 再到 X 执行（倒序）。整体上同一节点先被所有 plugin 处理，再被 preset 处理，所以顺序写反会导致语法还没降级就去做别的处理。
5. preset 的本质是"插件的集合加顺序"：`@babel/preset-env` 根据 `targets`（来自 browserslist）自动挑选需要的转换插件，内部大致按"从新语法到旧语法"排列，保证高版本语法优先降级。
6. 配置文件的层级：`babel.config.js` 作用于整个项目（monorepo 推荐），`.babelrc`/`.babelrc.js` 只作用于所在包目录；两者同时存在时按"根配置 → 就近配置"合并，`overrides`/`env` 可以按环境细分。

```js
// 手写一个 Babel 插件：删掉所有 console.log 调用
module.exports = function dropConsole() {
  return {
    name: 'drop-console',
    visitor: {
      CallExpression(path) {
        if (path.get('callee').matchesPattern('console.log')) path.remove();
      },
    },
  };
};
```

```js
// babel.config.js
module.exports = {
  presets: [['@babel/preset-env', { targets: '> 0.5%, last 2 versions, not dead', modules: false }]],
  plugins: ['@babel/plugin-transform-runtime', './plugins/drop-console'],
};
```

**追问与易错点**：

- 追问：为什么 Babel 转完代码体积反而变大？答：helper 函数会被内联到每个文件（如 `_classCallCheck`），用 `@babel/plugin-transform-runtime` 改成从 `@babel/runtime` 引入就能复用，代价是运行时多一个依赖。
- 陷阱：把 Babel 当构建工具。它不解析 `import` 的依赖关系、不打包、不做 tree-shaking，这些是 webpack/Rollup/Vite 的职责。
- 追问：`modules: false` 是什么意思？答：让 preset-env 不要把我写的 ESM 转成 CommonJS，保留 `import`/`export` 交给打包器做 tree-shaking。babel-loader 会自动传 `supportsStaticESM` 达到同样效果。

### Q17 polyfill 怎么配？browserslist、`useBuiltIns`、core-js 之间是什么关系？

**考察点**：考 polyfill 策略的完整链路：browserslist 决定目标环境，preset-env 决定要不要转语法，core-js 决定要补哪些 API。这是答错率极高的一题。

**参考答案**：

> **一句话结论**：Babel 只降级**语法**，新 API 必须靠 core-js 提供；browserslist 声明目标浏览器，`useBuiltIns: 'usage'` 让 preset-env 按实际用到的 API 从 core-js 按需注入，async/await 降级后的 generator 运行时由 regenerator 提供。

1. 分清两件事：`const fn = () => {}`、可选链属于**语法**，Babel 转成 ES5 即可；`Promise`、`Array.prototype.flat`、`URLSearchParams` 属于**运行时 API**，旧浏览器里根本不存在，转语法无用，必须注入实现。
2. browserslist：写在 `package.json` 的 `browserslist` 字段或 `.browserslistrc` 里，例如 `> 0.5%, last 2 versions, not dead`（`defaults` 等价于此再加 Firefox ESR）；Babel、autoprefixer、esbuild、swc 都读同一份配置，改一处全局生效。可用 `npx browserslist` 查看解析结果。
3. core-js：API polyfill 的实现库（core-js/stable 是全量）。`useBuiltIns` 三个档位：`false`（默认，不自动注入）、`'entry'`（在 `import 'core-js'` 处按 targets 替换成所需的具体模块）、`'usage'`（推荐，扫描代码里用到的 API 按文件按需注入），后两档都要写 `corejs: { version: '3.x' }` 并安装对应版本。
4. regenerator：Babel 把 `async/await` 降级成 generator + 状态机后，需要 regenerator 运行时来执行；默认 helper 内联进产物，用 `@babel/plugin-transform-runtime` 可改为从 `@babel/runtime` 引入，避免每个文件重复内联。
5. `'usage'` 的盲点：它靠静态分析识别 API 用法，对动态访问（`arr[methodName]()`、字符串拼出来的属性）识别不到，也可能把不需要的补进来；第三方依赖默认不处理（在 `node_modules` 里被排除），所以库自身要做好兼容或用 `transpileDependencies` 放行。
6. 取舍：polyfill 是有体积代价的。目标是"明确支持的浏览器下限 + 按需注入"，而不是无脑全量；如果产品可以放弃老浏览器，把 browserslist 调高一位往往比任何 polyfill 优化都省体积。现代替代方案是 Vite 的 `@vitejs/plugin-legacy`，为旧浏览器单独产出 legacy chunk 与 polyfill，新浏览器不付代价。

```js
// babel.config.js
module.exports = {
  presets: [['@babel/preset-env', {
    targets: '> 0.5%, last 2 versions, not dead',
    useBuiltIns: 'usage',
    corejs: { version: '3.37', proposals: false },
    modules: false,
  }]],
};
```

**追问与易错点**：

- 陷阱：以为配了 `@babel/preset-env` 老浏览器就能跑。`Promise` 缺失照样白屏报错——语法降级和 API 补齐是两件事，必须回答出 core-js。
- 追问：`useBuiltIns: 'usage'` 和 `@babel/plugin-transform-runtime` 的 `corejs` 选项能一起用吗？答：不要混用。前者注入全局 polyfill（污染全局），后者注入沙箱化的局部实现；同时开会导致重复引入与体积翻倍，做业务应用选 `usage`，做第三方库选 runtime。
- 追问：`core-js` 装成 2 还是 3？答：必须 core-js@3，core-js@2 已不再维护，且 `useBuiltIns` 与 `corejs` 版本号必须与安装的包一致，否则构建直接报错。

### Q18 Rollup 有什么特点？什么场景适合用它？

**考察点**：考"库打包器"的定位与产物特征，要能说清它和 webpack 的分工，而不是罗列插件名。

**参考答案**：

> **一句话结论**：Rollup 是面向 ES Module 的打包器，擅长把库打成干净、无运行时包装的多格式产物（esm/cjs/umd），适合组件库、工具库和 Vite 的生产构建；不适合做带 HMR、复杂分包的应用开发服务器。

1. 核心优势：基于 ESM 静态分析做 tree-shaking，产物没有 webpack 的 `__webpack_require__` 运行时代码与模块包装，代码更接近手写，体积更小、可读性更好。
2. 输出格式：一次构建可同时产出 `esm`（给打包器消费，保留 tree-shaking 能力）、`cjs`（给 Node/老工具链）、`umd`/`iife`（给 `<script>` 直接引用的场景），并在 `package.json` 用 `module`/`main`/`exports` 字段分别指向。
3. 插件机制：钩子分 build 阶段（`options`/`resolveId`/`load`/`transform`）与 output 阶段（`renderChunk`/`generateBundle`），API 简洁，插件只处理自己关心的资源类型。
4. 生态短板：默认只认 JS/ESM，CJS 依赖要 `@rollup/plugin-commonjs`，Node 内置模块要 `@rollup/plugin-node-resolve` 与 `builtins`；代码分割、HMR、dev server 都不是它的强项，需要额外插件或交给 Vite。
5. 典型用法：组件库/工具库发布，配 `rollup-plugin-dts` 或 `tsc --emitDeclarationOnly` 产出类型声明；Vite 的生产构建内部就是 Rollup，所以 Vite 项目的 `build.rollupOptions` 里写的其实就是 Rollup 配置。
6. 与 webpack 的分工一句话：**做应用用 Webpack/Vite，做库用 Rollup**；选型看的是"产物给谁用"，应用产物给浏览器和 CDN，库产物要给别的构建工具继续消费。

| 维度 | Rollup | Webpack |
| --- | --- | --- |
| 定位 | 库/包打包 | 应用构建器 |
| 产物形态 | 干净，无运行时包装 | 带 runtime 与模块包装 |
| tree-shaking | 更强（纯 ESM 语义） | 强，但受 CJS 与 loader 影响 |
| 代码分割/HMR | 需插件或交给 Vite | 原生支持 |
| 多资源类型 | 全靠插件 | loader 生态庞大 |

**追问与易错点**：

- 追问：库产物为什么要同时出 ESM 和 CJS？答：ESM 让使用方的打包器能继续 tree-shaking（`sideEffects: false` 配合），CJS 兼容仍在用 `require` 的老环境（Node 老版本、Jest 默认配置、老构建工具）。
- 陷阱：以为 Rollup 组件的产物一定比 webpack 小。不做 `sideEffects` 声明、不做 `external`（把 vue/react 打进去）时，体积同样会失控。
- 追问：`external` 为什么对库特别重要？答：库不应把宿主已安装的依赖（如 vue、react）打进来，否则使用方会出现双实例，React hooks 报错、Vue 响应式失效都是这么来的。
### Q19 esbuild 和 swc 为什么比 Babel 快那么多？

**考察点**：考是否理解"语言与架构"层面的原因，而不是只答"因为用 Go/Rust 写的"。要能说出它们放弃了什么。

**参考答案**：

> **一句话结论**：esbuild（Go）和 swc（Rust）用原生语言编译成机器码、多线程并行处理，且从架构上避免了 JS 工具链的解析/序列化开销；代价是插件生态与语法覆盖不如 Babel，且它们不做类型检查。

1. 语言与执行方式：Babel/Terser 跑在 Node 上是单线程 JS，受解释执行、GC 与对象分配开销限制；esbuild/swc 是原生二进制，无启动期 JIT 预热，可直接吃满多核。
2. 架构差异：esbuild 整个流程在同一个进程内共享数据结构，避免了"插件之间反复传字符串/AST"的序列化复制；解析器与打印器都是自研的，且一次遍历同时完成多项工作。
3. 减少不必要的工作：esbuild 不解析 TypeScript 的类型（把类型当注释跳过）、不做跨文件的类型检查、不做复杂的 AST 兼容层，因此单文件转译极快。
4. 能力边界：esbuild 不做类型检查（要检查得单独跑 `tsc --noEmit`），不注入 polyfill（`target` 只决定语法降级，新 API 仍要 core-js 或 `@vitejs/plugin-legacy`），也不支持完整 Babel 插件生态。
5. swc：定位是 Rust 版 Babel，支持大部分 Babel 常用插件与装饰器元数据（`design:type` 这类），Next.js 的编译与 Jest 的转换默认都在用它；迁移成本比 esbuild 低。
6. 工程用法：webpack 里用 `esbuild-loader`/`swc-loader` 替换 `babel-loader`，压缩可用 `esbuild` 或 `TerserPlugin` 的 esbuild minify（比 Terser 快一个数量级，压缩率略低一点）；Vite 的依赖预构建与 TS 转译也是 esbuild。

```js
// webpack 里用 esbuild-loader 替代 babel-loader + TerserPlugin
module.exports = {
  module: {
    rules: [{ test: /\.[jt]sx?$/, include: path.resolve(__dirname, 'src'),
      use: [{ loader: 'esbuild-loader', options: { target: 'es2015' } }] }],
  },
  optimization: { minimizer: [new EsbuildPlugin({ target: 'es2015' })] },
};
```

**追问与易错点**：

- 追问：换成 esbuild 后需要注意什么？答：类型检查消失了（CI 必须有 `tsc --noEmit`）、装饰器元数据与部分 proposal 语法可能不支持、source map 的列映射精度与 Babel 略有差异。
- 陷阱：说"esbuild 快是因为 Rust/Go 是编译型语言"就停住。同样重要的是"它选择不做什么"——不做类型检查、不做 polyfill、不兼容全部 Babel 插件。
- 追问：那为什么大型项目还在用 Babel？答：为了插件生态（自定义转换、按需引入、国际化提取）、装饰器与元数据支持、以及极少数语法的精确兼容；速度可以靠缓存与并行部分缓解。

### Q20 npm、yarn、pnpm 的 `node_modules` 结构有什么区别？什么是幽灵依赖？

**考察点**：考依赖提升（hoisting）与软硬链接两种方案的差异，以及幽灵依赖、依赖分身这两个真实事故来源。

**参考答案**：

> **一句话结论**：npm/yarn 把依赖"提升"到顶层 `node_modules`，导致你可以引用未声明的包（幽灵依赖）和同包多版本（依赖分身）；pnpm 用全局内容寻址存储加硬链接，顶层只放直接依赖的符号链接，从而做到严格且省磁盘。

1. npm v2 是嵌套结构（每个包自带 `node_modules`），路径深、大量重复；npm v3 起改为扁平化提升，`node_modules` 顶层尽量平铺所有依赖，冲突版本才嵌套到自己的子树里。
2. 幽灵依赖（Phantom Dependency）：因为是平铺的，你 `import 'lodash'` 时即使 `package.json` 没声明 lodash，只要某个依赖装了它就能跑通——直到那个依赖升级或删掉，你的代码突然构建失败。
3. 依赖分身（Doppelgänger）：A 依赖 lodash@4.17.20、B 依赖 lodash@4.17.21，提升后会出现两份，体积翻倍；React 出现双实例会直接报 hooks 错误。
4. pnpm 结构：全局有一个内容寻址存储（content-addressable store），同一版本的文件只存一份；`node_modules/.pnpm/<包>@<版本>/node_modules/<包>` 是真实目录（文件通过**硬链接**指向 store），顶层 `node_modules/<包>` 只是指向它的**符号链接**。
5. 严格性：每个包自己的 `node_modules` 下只链接它声明过的依赖，所以未声明的包根本解析不到，幽灵依赖从机制上被杜绝；代价是某些"偷偷用了未声明依赖"的老库会直接报模块找不到（可用 `public-hoist-pattern`、`shamefully-hoist` 或 `node-linker=hoisted` 妥协，但等于放弃 pnpm 的核心优势）。
6. 决策：新项目优先 pnpm（快、省磁盘、依赖严格，monorepo 支持也好）；yarn berry 的 PnP 更强但生态兼容成本高；必须兼容老流程时 npm 也够用，关键是**固定一个并让 CI 与本地一致**。

```jsonc
// pnpm 遇到"未声明依赖"的老库时，最小妥协方案（不要全局 shamefully-hoist）
// .npmrc
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
```

**追问与易错点**：

- 追问：`npm ls lodash` 与 `pnpm why lodash` 有什么用？答：查某个包被谁引入、装了几个版本，是排查"体积突然变大""React 双实例"的第一步。
- 陷阱：以为 pnpm 的硬链接等于复制。修改 `node_modules` 里的文件会影响 store 里的同一份内容，所以不要手改 `node_modules` 里的代码（要改用 `patch-package` 或 `pnpm patch`）。
- 追问：CI 上安装依赖为什么必须用锁定安装？答：`npm ci`/`pnpm i --frozen-lockfile` 严格按 lockfile 安装且不允许修改，保证本地、CI、生产是同一棵依赖树；否则出现"CI 能过、线上报错"。

### Q21 lockfile 有什么用？语义化版本和依赖升级策略怎么定？

**考察点**：考 lockfile 的可复现价值、semver 范围符号的具体含义，以及团队级的升级策略（这是很多候选人答不出来的一题）。

**参考答案**：

> **一句话结论**：lockfile 记录每个依赖的**精确版本与完整性校验值**，保证任何人任何机器装出同一棵依赖树；semver 决定允许自动升级的范围，`^` 允许次版本升级、`~` 只允许补丁升级，升级策略要区分 patch/minor 与 major。

1. lockfile：`package-lock.json`/`yarn.lock`/`pnpm-lock.yaml` 包含解析后的版本、`resolved` 地址与 `integrity` 哈希；必须提交到仓库，CI 用 `npm ci` 或 `pnpm i --frozen-lockfile` 严格按它安装。
2. 为什么需要：`package.json` 里的 `^1.2.3` 只是范围，别人下周安装可能装到 `1.5.0`，行为不一致；lockfile 把"范围"收敛成"确定值"，让构建可复现。
3. semver：`MAJOR.MINOR.PATCH`。`^1.2.3` 等价 `>=1.2.3 <2.0.0`；`~1.2.3` 等价 `>=1.2.3 <1.3.0`；`1.2.x`、`*`、`latest` 都过于宽松；**0.x 例外**——`^0.2.3` 只等价 `>=0.2.3 <0.3.0`，因为 0.x 视为不稳定。
4. 依赖类型：`dependencies`（运行时需要，会进产物）、`devDependencies`（构建/测试用，不进产物）、`peerDependencies`（库要求宿主提供，如 react，npm 7+ 会自动安装）、`optionalDependencies`（可选，装不上不报错）。
5. 升级策略：patch/minor 可以批量升并依赖 CI 回归；major 必须单独评估 changelog 与破坏性变更；用 Dependabot/Renovate 定时提 PR，把升级变成常规动作而不是"攒一年再升一次"。
6. 强制统一版本：`overrides`（npm 8+）、`resolutions`（yarn）、`pnpm.overrides` 可以强制把传递依赖的版本收敛到指定版本，用来消灭依赖分身；`npm audit`/`pnpm audit` 定期查已知漏洞。

```jsonc
// package.json：强制统一 lodash 版本，消灭分身
{
  "pnpm": { "overrides": { "lodash@<4.17.21": "4.17.21" } }
}
```

**追问与易错点**：

- 陷阱：删掉 lockfile 重装来"解决冲突"。这会随机漂移几十个包版本，问题更难查；正确做法是 `pnpm why` 定位来源再 overrides。
- 追问：为什么 `^` 在 0.x 上不生效？答：semver 规定 0.x 是初始开发阶段，任何次版本都可能有破坏性变更，所以 `^0.2.3` 被收窄为 `<0.3.0`。
- 追问：`dependencies` 和 `devDependencies` 放错会怎样？答：构建工具放 dependencies 会让 Docker 生产镜像多装一堆无用包、前端产物分析也变乱；反之把运行时需要的包放 devDependencies，某些部署流程（`npm i --production`）下直接运行失败。

### Q22 Monorepo 怎么落地？pnpm workspace 和 Turborepo 各解决什么？

**考察点**：考是否做过真实的 monorepo：包之间怎么链接、任务怎么编排、变更影响怎么分析、版本怎么发布。

**参考答案**：

> **一句话结论**：pnpm workspace 解决"多个包在同一个仓库里如何互相引用与统一安装"，Turborepo/Nx 解决"任务依赖顺序与缓存复用"，Changesets 解决"多包版本与 changelog 怎么发"。

1. 基座：`pnpm-workspace.yaml` 里声明 `packages: ['packages/*', 'apps/*']`，各子包通过 `"ui": "workspace:*"` 引用本地包，pnpm 会直接符号链接到源码目录，改一处立刻全局可见，无需 `npm link`。
2. 收益：跨包重构可以原子提交（一次 PR 改完接口与所有调用方）、共享 lint/tsconfig/构建配置、类型定义直接复用、依赖只装一份。
3. 任务编排：Turborepo 的核心是任务图与缓存。`turbo.json` 里 `"build": { "dependsOn": ["^build"], "outputs": ["dist/**"] }` 表示"先构建依赖的包，再构建自己"；输入哈希不变时直接复用本地或远程缓存，跳过执行。
4. 变更影响分析：`turbo run test --filter=...[origin/main]` 只对受影响的包及其下游跑任务；CI 里配合 `--affected` 能大幅缩短流水线时间，这是 monorepo 能否用起来的关键。
5. 发布：Changesets 的流程是——开发者在 PR 里补一个 changeset（说明改了什么、是 patch/minor/major）→ 合并后由机器人汇总提升版本、生成 CHANGELOG、统一发布；比手工改版本号可靠得多。
6. 难点与坑：React/Vue 单实例（`peerDependencies` + overrides 保证只有一份）、包内 TS 的 `paths` 与构建产物 `dist` 的类型指向（`exports`/`types` 字段要写对）、循环依赖（A 引 B、B 引 A 会让任务图成环）、以及"改了 A 忘了重新构建 B"导致的假成功（靠 `^build` 依赖规避）。

```yaml
# turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["build"], "outputs": ["coverage/**"] },
    "lint": {}
  }
}
```

**追问与易错点**：

- 追问：monorepo 和"多个仓库 + 私有 npm 包"怎么选？答：看耦合度与协作频率。共享代码多、需要原子重构就 monorepo；团队边界清晰、发布节奏独立、仓库体量已影响克隆与 CI 速度时，多仓库反而更清爽。
- 陷阱：以为用了 pnpm workspace 就有缓存与增量。workspace 只解决链接与安装，任务编排与缓存是 Turborepo/Nx 的职责，不配就是每次全量构建。
- 追问：远程缓存（remote cache）的意义？答：CI 上算过的哈希结果可以回填到远端，本地和不同机器直接命中，把"改一行跑十分钟"变成几秒钟；要注意缓存污染与密钥隔离。

### Q23 ESLint、Prettier、stylelint 怎么分工？为什么总打架？

**考察点**：考三类工具职责边界与冲突根因，以及"配置放哪、忽略什么、CI 怎么卡"这三个落地细节。

**参考答案**：

> **一句话结论**：ESLint 管代码质量与潜在缺陷，Prettier 只管格式，stylelint 管样式；打架的根因是两者都定义了格式规则，用 `eslint-config-prettier` 关掉 ESLint 的格式类规则即可，且它必须放在 `extends` 最后。

1. 分工：ESLint 检查语义问题（未使用变量、`==`、hooks 依赖、import 顺序、`no-floating-promises`）；Prettier 只负责换行、缩进、引号、分号、尾逗号这类"排版"，不做任何语义判断；stylelint 管 CSS/SCSS/Less 的属性顺序与规范（可配 `stylelint-config-prettier` 关掉格式冲突）。
2. 冲突根因：比如 ESLint 的 `indent`/`quotes` 与 Prettier 的默认风格不一致，`eslint --fix` 和 `prettier --write` 会互相改回去，形成"拉锯"。
3. 标准解法：`extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'prettier']`——`eslint-config-prettier`（在 extends 里写 `'prettier'`）关掉所有与 Prettier 冲突的规则，**必须放最后**，否则前面的配置会重新打开它们。
4. 两种协作模式：一是"各管各的"（推荐），ESLint 跑质量、Prettier 单独跑格式，编辑器和 CI 各跑一次；二是 `eslint-plugin-prettier` 把 Prettier 当 ESLint 规则跑（一次命令解决，但报错噪音大、速度慢，大项目不推荐）。
5. 落地细节：`.eslintignore`/`ignorePatterns` 排除 `dist`、`node_modules`、`public`；Vue 用 `eslint-plugin-vue` + `vue-eslint-parser`，TypeScript 交给 `typescript-eslint`；ESLint 9 起默认使用扁平配置 `eslint.config.js`，替代 `.eslintrc`。
6. CI 卡口：`eslint --max-warnings=0`（有警告也失败），`prettier --check`（只校验不修改），避免"CI 上自动改了代码但没人提交"。

```js
// eslint.config.js（ESLint 9 扁平配置，Prettier 相关配置放最后）
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  { ignores: ['dist/**', 'node_modules/**'] },
  prettier, // 必须最后，用于关闭格式类规则
];
```

**追问与易错点**：

- 追问：编辑器保存时 Prettier 格式化、ESLint 又报格式错怎么办？答：在编辑器把 `editor.formatOnSave` 交给 Prettier、`codeActionsOnSave` 只留 ESLint 的 `source.fixAll.eslint` 且确保 `eslint-config-prettier` 生效，冲突就消失了。
- 陷阱：把 `eslint-config-prettier` 写在 `extends` 数组中间。后面的 `plugin:vue/...` 会把它关掉的规则再打开，表现为"配了没用"。
- 追问：老项目规则几千条警告，怎么推得动？答：先只对新文件生效（`overrides` 或 lint-staged 只查增量），历史代码用 `/* eslint-disable */` 或分批清理，一步到位改全部必然被抵制。

### Q24 husky、lint-staged、commitlint 怎么配合？Git 分支模型和提交规范怎么定？

**考察点**：考提交前质量门禁的实现细节与 Git 协作模型，重点是"为什么用 lint-staged 而不是全量 lint"。

**参考答案**：

> **一句话结论**：husky 提供 Git 钩子，在 `pre-commit` 里用 lint-staged 只对暂存文件跑 lint/format，在 `commit-msg` 里用 commitlint 校验提交信息格式；分支模型上中小团队用 GitHub Flow（main + 短分支 + PR）配语义化提交即可。

1. husky：通过 Git 的 `core.hooksPath` 机制把钩子目录指向 `.husky`，v9 用 `npx husky init` 生成 `.husky/pre-commit`，文件里直接写命令（不再需要 shell 脚本头），无需手工改 `.git/hooks`。
2. lint-staged：只处理 `git add` 过的文件，把"全量 lint 大项目要几十秒"变成"只查改动的几个文件，几百毫秒"。配置写在 `package.json` 的 `lint-staged` 字段或 `.lintstagedrc`。
3. commitlint：在 `commit-msg` 钩子里校验提交信息，配 `@commitlint/config-conventional` 强制 Conventional Commits：`type(scope): subject`，type 取 `feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert`。
4. 价值：feat/fix 类型能自动生成 CHANGELOG、推断语义化版本号（配 semantic-release 或 Changesets），也能让 `git log` 变成可读的变更史。
5. 钩子分类：`pre-commit`（提交前检查）、`commit-msg`（校验信息）、`pre-push`（推送前跑测试，耗时操作放这里而不是 pre-commit，否则提交变慢会逼着大家用 `--no-verify` 绕过）。
6. 分支模型：Git Flow（main/develop/feature/release/hotfix，流程重，适合有固定发版周期的团队）；GitHub Flow（main 常绿 + 功能分支 + PR 合并，简单，推荐）；主干开发（Trunk Based，短分支 + 特性开关，配合强 CI）。发布用 tag 标记，回滚能精确定位到某次提交。

```jsonc
// package.json
{
  "scripts": { "prepare": "husky" },
  "lint-staged": {
    "*.{js,ts,vue}": ["eslint --fix --max-warnings=0", "prettier --write"],
    "*.{css,scss}": ["stylelint --fix"],
    "*.md": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged

# .husky/commit-msg
npx --no -- commitlint --edit "$1"
```

**追问与易错点**：

- 追问：钩子能被绕过，那还有意义吗？答：有，钩子是"降低犯错概率"的快速反馈；真正的卡口必须在 CI 上再跑一遍（`eslint`、`prettier --check`、对最近一次提交跑 commitlint），否则一个 `--no-verify` 就洞穿了。
- 陷阱：把单元测试放进 `pre-commit`。跑一次要几十秒，团队很快集体用 `--no-verify`，规范名存实亡；重活放 `pre-push` 或 CI。
- 追问：为什么提交规范值得强制？答：它让"版本号、CHANGELOG、影响范围"都能自动推导，也让线上问题回溯时能按 `fix`/`feat` 快速筛出可疑提交，是低成本高回报的约定。
- 追问：Windows 上钩子不生效怎么办？答：检查 `core.hooksPath` 是否被改过、`.husky` 目录是否被 `.gitignore` 误伤、以及行尾符（CRLF）问题；husky v9 已移除对 shell 脚本头的依赖，多数老问题不再出现。
### Q25 前端 CI/CD 流水线怎么搭？每一段在防什么？

**考察点**：考流水线的分段设计与关键工程细节（锁定安装、缓存、构建一次多环境晋升、密钥隔离），而不是背 YAML 语法。

**参考答案**：

> **一句话结论**：前端流水线固定是"装依赖 → 静态检查 → 测试 → 构建 → 部署"五段，每一段都是一个卡口；核心工程原则是锁定安装保证可复现、缓存加速、构建产物传递而不是重复构建、密钥只进构建环境不进产物。

1. 触发条件：PR 只跑检查与测试（快反馈），合并到主干后构建并部署测试环境，打 tag 时发布生产；这样既能挡住坏代码，又不会让每个 PR 都产生部署。
2. 装依赖：必须 `npm ci`/`pnpm i --frozen-lockfile`，禁止在 CI 里更新 lockfile；配 `actions/setup-node` 的 `cache: pnpm` 或 `actions/cache` 缓存依赖与构建缓存，能省掉一半时间。
3. 静态检查：`lint`、`prettier --check`、`tsc --noEmit`（类型检查）在这一段跑，失败即终止；与本地钩子不同，这里是不可绕过的强卡口。
4. 测试：单元/组件测试带覆盖率，`--coverage` 上传报告并设阈值；E2E 放独立 job（耗时长）并分片并行，只在主干或发布分支运行。
5. 构建：`pnpm build` 产出 `dist`，用 artifact 上传给后续部署 job 复用——**构建一次、多环境晋升**，避免"测试环境构建的东西和生产构建的东西不是同一份"。
6. 部署：通过 Secrets/Environments 注入环境变量，上传 CDN/对象存储并刷新缓存，或推送镜像；密钥只存在于流水线变量中，绝不能出现在构建产物里（前端产物是公开的）。

```yaml
# .github/workflows/ci.yml
name: ci
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint && pnpm tsc --noEmit
      - run: pnpm test -- --coverage
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist }
```

**追问与易错点**：

- 追问：为什么不每个环境各构建一次？答：构建三次就是三份不同的产物（依赖解析、时间戳、变量替换都可能不同），线上问题无法在测试环境复现。正确做法是同一份产物配不同运行时配置。
- 陷阱：把 `.env.production` 里的 API 地址在 CI 里用 `sed` 改源码再构建。这会污染仓库与哈希，且多环境产物不一致；应该用运行时配置或构建参数。
- 追问：GitLab CI 怎么对应？答：`stages: [install, lint, test, build, deploy]`，用 `cache: { key: $CI_COMMIT_REF_SLUG, paths: [node_modules, .pnpm-store] }` 缓存，`artifacts: paths: [dist]` 在 stage 之间传产物，用 `rules` 控制触发条件。

### Q26 多环境配置怎么注入？运行时配置和构建时注入有什么区别？

**考察点**：考"构建时替换 vs 运行时读取"的差异与代价，这是最容易把密钥误打包的地方。

**参考答案**：

> **一句话结论**：构建时注入（DefinePlugin/`import.meta.env`）是把值当字面量替换进代码，简单但一份产物只能对应一个环境、且值会暴露在 JS 里；运行时注入是把配置放在独立文件或接口里，部署时替换，一份产物可跑多环境。

1. 构建时注入（Webpack）：`new webpack.DefinePlugin({ 'process.env.API_BASE': JSON.stringify(url) })` 做的是文本替换，值必须 `JSON.stringify`，否则字符串被当表达式解析；它只在匹配文件里替换，`node_modules` 默认不处理。
2. 构建时注入（Vite）：只用 `import.meta.env.VITE_*`，变量在构建时被静态替换，`import.meta.env[key]` 这类动态访问无效。
3. 代价：每个环境都要构建一次（哈希不同、缓存失效），且变量明文躺在 JS 里——**前端没有秘密**，前缀机制只是提醒你"这个值会公开"。
4. 运行时配置方案一：`public/config.js` 里写 `window.__APP_CONFIG__ = { apiBase: '...' }`，并在 `index.html` 中先于业务脚本引入；部署时只替换这个文件（Docker 常用 entrypoint 脚本按环境变量渲染它）。
5. 运行时配置方案二：启动时 `fetch('/config.json')` 拉配置再挂载；配置可热改、无需重新构建，代价是多一次请求且要处理"配置没到就渲染"的时序问题。
6. 落地建议：技术令牌、内部域名这类敏感值一律不给前端，改由后端接口下发；环境地址、开关、埋点 ID 这类公开值用运行时配置，做到"构建一次、到处部署"。

```js
// webpack：构建时注入，值必须序列化
new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify('production'),
                           __API_BASE__: JSON.stringify('https://api.example.com') })

// public/config.js：运行时注入，部署时替换，不用重新构建
window.__APP_CONFIG__ = { apiBase: 'https://api.example.com', sentryDsn: '' };
```

**追问与易错点**：

- 陷阱：在 `VITE_`/`REACT_APP_` 变量里写数据库密码或第三方私钥。产物是公开文件，任何人 View Source 都能读到，这不是"配置疏漏"而是安全事故。
- 追问：Webpack 5 里 `process.env` 为什么报错未定义？答：webpack 5 不再自动为浏览器 polyfill `process`；要么用 DefinePlugin 精确替换用到的字段，要么 `resolve.fallback.process = 'process/browser'`（代价是打进一个垫片）。
- 追问：`config.js` 被 CDN 缓存了怎么办？答：给它设短缓存（`no-cache`）或加带版本号的 query/文件名，且不要与哈希化的静态资源走同一套长缓存策略。
- 追问：如何确认密钥没被打进产物？答：构建后在 `dist` 里 grep 关键字段（或用脚本在 CI 里做一次断言），比"我觉得没有"可靠。

### Q27 前端怎么发布上线？CDN、Nginx、Docker 各自要注意什么？

**考察点**：考完整的发布链路与缓存策略设计，以及灰度、回滚这些生产必备能力的具体做法。

**参考答案**：

> **一句话结论**：发布的核心是"内容指纹化的静态资源长缓存 + `index.html` 不缓存"，配合版本目录实现秒级回滚与灰度；Nginx 负责 history 路由与缓存头，Docker 用多阶段构建把产物塞进 nginx 镜像。

1. 缓存策略：JS/CSS/图片带 `[contenthash]` 且内容变则名变，可设 `Cache-Control: public, max-age=31536000, immutable`；`index.html` 绝不能长缓存（`no-cache` 或 `max-age=0, must-revalidate`），否则用户永远拿不到新版——这是最高频的线上事故。
2. 发布流程：构建产物按版本号归档（如 `/releases/1.2.3/`）→ 上传 CDN/对象存储 → 把 `index.html`（或 Nginx 的 alias 指向）切到新版本目录 → 刷新 CDN 上 `index.html` 的缓存；静态资源因路径带版本无需刷新。
3. 灰度：按用户 ID/cookie/比例分流到不同版本目录（Nginx `map` + `if` 或网关层做），灰度期间后端接口必须同时兼容新旧前端；观察到错误率正常后再全量。
4. 回滚：保留最近 N 个版本目录，回滚只改指针（切 `index.html` 或 Nginx 指向），**不重新构建**，因此是秒级操作；这也要求数据库/接口变更必须向后兼容。
5. Nginx 要点：SPA 用 `try_files $uri $uri/ /index.html;` 处理 history 路由；开 gzip/brotli；`/api` 反向代理要带 `proxy_set_header Host $host` 等头；注意 `root` 与 `alias` 的差异；补 CSP、`X-Content-Type-Options` 等安全头。
6. Docker 要点：多阶段构建——`node:20-alpine` 里装依赖并构建，再把 `dist` 拷进 `nginx:alpine`，镜像里没有源码与 `node_modules`；用 `.dockerignore` 排除 `node_modules`/`dist`；环境差异用 `--build-arg` 或挂载的 `config.js` 解决。

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  location / {
    try_files $uri $uri/ /index.html;       # history 路由
    add_header Cache-Control "no-cache";     # index.html 不缓存
  }
  location ~* \.(js|css|png|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
  location /api/ { proxy_pass http://backend:3000/; proxy_set_header Host $host; }
}
```

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm i --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**追问与易错点**：

- 追问：为什么静态资源敢缓存一年？答：文件名里带内容哈希，内容一变文件名就变，URL 也就变了，浏览器会当成新资源请求；所谓"缓存一年"缓存的是永远不会变的那份内容。
- 陷阱：`index.html` 也设了长缓存并上传了 CDN。用户会一直加载旧 HTML，而旧 HTML 引用的是旧哈希资源，于是"发版了但用户还是旧版本"，且刷新也无效——只能等缓存过期或手动刷 CDN。
- 追问：部署到子路径 `/admin/` 要改哪些地方？答：构建的 `publicPath`（Webpack）/`base`（Vite）、路由的 `base`、Nginx 的 `location /admin/` 与 `alias`，三处必须一致，漏一处就是 404 或白屏。

### Q28 前端自动化测试体系怎么分层？覆盖率和投入产出怎么算？

**考察点**：考测试金字塔的实践判断（哪些值得测、E2E 怎么控成本），而不是罗列框架名。

**参考答案**：

> **一句话结论**：按测试金字塔分层——大量快的单元测试覆盖纯逻辑，适量组件/集成测试覆盖用户行为，少量 E2E 覆盖登录支付等关键流程；覆盖率是参考指标而非目标，追求 100% 是低回报投入。

1. 单元测试：测纯函数、工具方法、composable/hooks、store 的 reducer，快且无环境依赖，数量应最多，是重构的安全网。
2. 组件/集成测试：用 Testing Library 渲染组件、模拟用户操作与网络（MSW 拦截请求），断言用户可见的结果（按钮文案、可访问性角色）而不是内部状态；这类测试最能反映"功能真的坏了没有"。
3. E2E 测试：Playwright/Cypress 跑真实浏览器，覆盖登录、下单、支付等核心流程；最贴近真实但慢且脆，只测关键路径并限制数量。
4. 工具选型：Jest（生态成熟、配置较重）与 Vitest（复用 Vite 配置、更快，API 基本兼容 Jest）；E2E 选 Playwright（跨浏览器、自动等待、trace 回放）或 Cypress（调试体验好）。
5. 覆盖率：分 statements/branches/functions/lines 四项，`coverageThreshold` 对核心目录设阈值（如 60%-80%）；它只说明"这行被执行过"，不说明断言有效，别当 KPI。
6. 投入产出：优先给"改得频繁 + 出错代价高"的模块写测试（金额计算、权限判断、表单校验），纯展示组件不写；测试要可重复——用 `findBy*` 异步查询而不是 `sleep`。

```js
// Vitest + Testing Library：断言用户能看到什么，而不是组件内部状态
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

test('点击加一按钮后显示 1', async () => {
  render(Counter);
  await userEvent.click(screen.getByRole('button', { name: '加一' }));
  expect(screen.getByText('当前：1')).toBeTruthy();
});
```

**追问与易错点**：

- 追问：E2E 经常因环境不稳定挂掉，怎么治？答：用自动等待代替固定 `sleep`、测试数据自建自清、接口开稳定桩数据、失败重试并保存 trace，同时把 E2E 与单元测试拆成不同 job。
- 陷阱：为每个组件写快照测试。快照会随任何改动更新，`-u` 一按就"通过"，除了制造维护负担几乎抓不到 bug。
- 追问：TypeScript 项目测试怎么写类型？答：测试文件纳入 `tsconfig` 或单独一份测试配置；用 `vitest/globals` 或显式 import 避免全局类型报错，`tsc --noEmit` 也要覆盖测试目录。
- 追问：没有测试的项目怎么开始？答：先给一个最近改过且出过 bug 的纯函数模块补上，跑进 CI 形成习惯，再往组件与关键流程扩。

### Q29 你们项目的脚手架和模板工程里应该预置什么？

**考察点**：考"工程化落地"的经验：模板里哪些东西是必须项，以及模板长期维护这个常被忽略的问题。

**参考答案**：

> **一句话结论**：脚手架的价值是把团队约定一次性固化，新项目开箱即用；模板里至少要预置构建、规范、多环境、请求层、目录约定、CI 与部署配置，并且必须指定维护人和升级机制。

1. 技术底座：框架版本 + TypeScript + 路径别名（`@/`）+ 编辑器配置（`.editorconfig`、`.vscode/settings.json` 统一保存格式化行为），避免"每个人格式不同导致 diff 噪音大"。
2. 规范体系：ESLint + Prettier + stylelint + husky + lint-staged + commitlint 全套装好并跑通一次，让新人在第一次提交时就接受规范。
3. 构建与多环境：`.env.development/.env.staging/.env.production`、代理配置、产物目录与 `base/publicPath`，以及区分 dev/build 的 source map 策略。
4. 运行时骨架：请求层封装（统一 baseURL、拦截器、错误码与 token 刷新）、路由与权限骨架、状态管理、全局错误上报（Sentry 之类）、基础布局与主题变量。
5. 交付配置：CI 流水线文件（lint/test/build）、Dockerfile + nginx.conf、`.dockerignore`、README（目录结构与命令说明）、以及 `.gitignore`（排除 `.env.local`、`node_modules`、`dist`）。
6. 生成方式与维护：官方模板（`create-vue`、`create-vite`）优先，团队内用自研 CLI（`commander`/`prompts` 交互 + `degit` 拉模板仓库 + 变量替换）做二次封装；关键是要有版本号与升级路径（模板发新版、老项目按 changelog 增量同步），否则半年后模板腐化，没人敢用。

```bash
# 自研脚手架的最小骨架
npx degit my-org/templates/vue3-ts#v1.4.0 my-app   # 拉指定版本模板
cd my-app && pnpm i && pnpm dlx husky init && pnpm dev
```

**追问与易错点**：

- 追问：用官方 `create-vue` 还是自研 CLI？答：先基于官方模板做团队定制（fork 或 `degit`），只有定制项足够多、且需要交互式选择（要不要 E2E、要不要 i18n）时才值得自研，自己写模板引擎通常得不偿失。
- 陷阱：模板里锁死一堆过时依赖就不管了。模板更新一次能同时惠及所有新项目，必须像维护公共库一样给它排版本与升级窗口。
- 追问：怎么让老项目也用上模板的新能力？答：把模板拆成可独立同步的几块（lint 配置包、请求层 npm 包、CI 片段），老项目按需升级对应包，而不是整体重新生成项目。

### Q30 你遇到过的构建事故有哪些？怎么排查？

**考察点**：考排障经验与"从现象定位到根因"的路径。能说出缓存未失效、`publicPath` 错、环境变量进产物这三类，并给出查证手段，才算过关。

**参考答案**：

> **一句话结论**：构建事故的根因大多落在四处——缓存与指纹、路径前缀、环境差异、依赖重复；排查顺序是"用线上真实产物复现 → 看网络与报错 → 对比构建配置与依赖树"。

1. 缓存未失效：发版后用户仍是旧页面，或 JS 与 HTML 版本不匹配导致 `ChunkLoadError`。根因是 `index.html` 被长缓存，或用了 `[hash]` 让无关文件哈希全变；对策是 HTML 不缓存、资源用 `[contenthash]`，并保留旧版本目录一段时间。
2. `publicPath`/`base` 配错：部署到子路径或 CDN 后资源 404、白屏，因为构建前缀与实际访问路径不一致，或路由 `base` 没同步改；排查就看 Network 里真实请求的 URL 前缀。
3. 环境变量打包进产物：密钥写进 `VITE_*`/`REACT_APP_*` 就等于公开；前端只放公开配置，敏感值由接口下发，并在 CI 里 grep `dist` 做断言。
4. 本地正常、CI 或线上失败：多为大小写敏感（Windows 不敏感、Linux 敏感，`import './Button'` 找不到 `button.vue`）、Node 版本不一致、CJS/ESM 混用。
5. 依赖相关：多版本共存导致体积翻倍或 React/Vue 双实例（hooks 报错、响应式失效），用 `npm ls`/`pnpm why` 定位后 overrides 收敛；缓存疑似脏了就清 `node_modules/.cache` 与构建缓存。
6. 排查方法：用 `npx serve dist` 跑**真实产物**（dev server 复现不了缓存与路径问题），配合 bundle-analyzer 与 stats 对比上次成功的构建；构建内存溢出就加 `--max-old-space-size`、简化 source map。

```bash
# 线上白屏的三步定位：产物是否完整、请求是否 404、运行时是否报错
ls dist && npx serve dist -l 5000   # 用真实产物本地复现
grep -r "VITE_" dist/assets | head  # 检查变量是否被替换为字面量
pnpm why react                        # 检查是否出现重复依赖
```

**追问与易错点**：

- 追问：`ChunkLoadError` 是什么原因？答：用户停留在旧 `index.html`，它引用的异步 chunk 已被新版本覆盖（文件名变了），按需加载即 404；对策是保留旧版本目录、给异步加载加重试。
- 陷阱：出问题先怀疑框架或工具版本，而不是先看"上一次改了什么"。构建事故大多归到缓存、路径、环境、依赖这四类，优先按这四条查。
- 追问：为什么必须用 `npx serve dist` 验证？答：dev server 是内存产物、无 CDN 缓存、无路径前缀，恰好绕过了事故的全部根因，真实产物才能复现。

## 本章小结

- 工程化解决的是开发体验、协作规范、构建、发布、质量五类问题，工具只是手段；脚手架的价值在于把这些约定一次性固化并持续维护。
- Webpack 里 `entry` 找依赖、`output` 定产物、`loader` 翻译模块（从右到左执行、只做文件级转换）、`plugin` 通过 tapable 钩子干预编译生命周期、`mode` 控制内置优化。
- 构建分三阶段：初始化建 `Compiler` 并挂插件，编译期用 loader 把模块递归解析成模块图，输出期切成 chunk、优化并写 assets；HMR 靠 WebSocket 通知加 hot-update 补丁做模块级替换，无人 accept 时退化为整页刷新。
- tree-shaking 靠 ESM 静态结构标记、Terser 真正删除，必须配合 `sideEffects` 与 `mode: production`；code splitting 用动态 `import()` 与 `splitChunks`（记得 `chunks: 'all'`），预取用 `prefetch`、预加载用 `preload`。
- Vite 开发期用原生 ESM 按需编译加 esbuild 依赖预构建，生产期交给 Rollup；Webpack 生态更庞大、配置更可控，新项目优先 Vite、老项目与深度定制场景留在 Webpack。
- 语法降级与 API 补齐是两件事：Babel 转语法，core-js 补 API，regenerator 提供 async 运行时，`useBuiltIns: 'usage'` 按需注入，browserslist 统一决定目标环境。
- 包管理上 pnpm 用内容寻址存储加硬链接做到严格、省磁盘、无幽灵依赖；lockfile 保证可复现安装，`^` 允许 minor 升级、`~` 只允许 patch，major 必须单独评估。
- 质量与交付链路是"规范 → 检查 → 测试 → 构建 → 发布"：lint-staged 只查增量、CI 不可绕过；资源用 contenthash 长缓存、`index.html` 不缓存，构建一次多环境晋升，回滚只切指针。

<!-- COUNT: 30 -->

