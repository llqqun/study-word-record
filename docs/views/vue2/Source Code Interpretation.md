# Vue2源码

> Version: 2.7.13

首先，从 GitHub - [vuejs/vue](https://github.com/vuejs/vue) 下载源码

使用pnpm 安装包

先打开package.json, 查看script

```md
"dev": "rollup -w -c scripts/config.js --sourcemap --environment TARGET:full-dev",
```

这里手动添加了`--sourcemap`命令

根据打包命令 scripts/config.js  -> 'full-dev' -> 'web/entry-runtime-with-compiler.ts' -> 'runtime-with-compiler.ts' -> './runtime/index'  -> ' core/index' -> './instance/index.ts'

一路向下找到入口文件位置

```js
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
import type { GlobalAPI } from 'types/global-api'

function Vue(options) {
  if (__DEV__ && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

//@ts-expect-error Vue has function type
initMixin(Vue)
//@ts-expect-error Vue has function type
stateMixin(Vue)
//@ts-expect-error Vue has function type
eventsMixin(Vue)
//@ts-expect-error Vue has function type
lifecycleMixin(Vue)
//@ts-expect-error Vue has function type
renderMixin(Vue)

export default Vue as unknown as GlobalAPI
```

在  examples 文件夹下新建 demo 文件夹 后续调试都在这里测试

## Vue 初始化

// core/instance/index.ts

```js
// Vue原始构造函数
function Vue(options) {
  if (__DEV__ && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
// 绑定_init方法
initMixin(Vue)

// 初始化全局API
initGlobalAPI(Vue)
```

### initGlobalAPI都干了什么

代码在core/global-api/index.ts

添加options属性, 后面Vue实例初始化时用到

```js
Vue.options = Object.create(null)
 ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })
```

Vue.options = Object.create(null) 创建一个空对象，然后遍历 ASSET_TYPES
ASSET_TYPES 的定义在 src/shared/constants.js 中

```js
export const ASSET_TYPES = ['component', 'directive', 'filter'] as const
```

所以上面代码生成

```js
Vue.options.components = {}
Vue.options.directives = {}
Vue.options.filters = {}
```

下一步,把一些内置组件扩展到 Vue.options.components 上，Vue 的内置组件目前 有`<keep-alive>`、`<transition>`和`<transition-group>` 组件，这也就是为什么我们在其它组件中使用这些组件不需要注册的原因。

```js
  extend(Vue.options.components, builtInComponents)
```

## new Vue({}) 都干了什么

src/core/instance/init.ts

用户传递的options选项与当前构造函数的options属性及其父级构造函数的options属性进行合并,赋值给$options

```js
if (options && options._isComponent) {
      initInternalComponent(vm, options as any)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor as any),
        options || {},
        vm
      )
    }
```

接着调用初始化函数,进行生命周期的执行

```js
    // 初始化生命周期
    initLifecycle(vm)
    // 初始化事件
    initEvents(vm)
    // 初始化渲染
    initRender(vm)
    // 调用生命周期钩子函数
    callHook(vm, 'beforeCreate', undefined, false /* setContext */)
    //初始化injections
    initInjections(vm) // resolve injections before data/props
    // 初始化props,methods,data,computed,watch
    initState(vm)
    // 初始化 provide
    initProvide(vm) // resolve provide after data/props
    // 调用生命周期钩子函数
    callHook(vm, 'created')
```

最后,如果没有传入el选项，则不进入下一个生命周期阶段，需要用户手动执行vm.$mount方法才进入下一个生命周期阶段

```js
if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
```

### 属性合并

```js
vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor as any),
        options || {},
        vm
      )
```

这里合并的两个属性, vm.constructor.options(或者称为Vue.options) 和 new Vue() 里的参数 options对象

```js
// 得到的是Vue.options
resolveConstructorOptions(vm.constructor as any)
```

mergeOptions的代码在`src/core/util/options.ts`中

首先递归把 extends 和 mixins 合并到 parent 上

```js
if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm)
    }
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
```

然后新建一个空对象options,首先遍历parent 的属性通过 `mergeField` 函数合并到options上,然后继续遍历child,将 存在于child 但不存在于parent的属性合并到options

```js
const options: ComponentOptions = {} as any
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField(key: any) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
```

最后返回对象options

值得一提 `mergeField ` ，它不是简单的把属性从一个对象里复制到另外一个对象里，而是根据被合并的不同的选项有着不同的合并策略。例如，对于data有data的合并策略，即该文件中的strats.data函数；对于watch有watch的合并策略，即该文件中的strats.watch函数; 对于生命周期和组件props合并策略采取mergeLifecycleHook函数,等等还有其他一些策略。这就是设计模式中非常典型的策略模式。

```js
  function mergeField(key: any) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
```

这里的strats[key] 通常指向 `mergeAssets`

```js
// 当实例创建，我们需要做
//构造函数,实例选项、负选项之间的合并
// Options和父选项。
function mergeAssets(
  parentVal: Object | null,
  childVal: Object | null,
  vm: Component | null,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    __DEV__ && assertObjectType(key, childVal, vm)
    return extend(res, childVal)
  } else {
    return res
  }
}
```

### callHook是如何触发生命钩子的

先上源码, `callHook`的逻辑非常简单,核心思路就是拿到生命周期函数的数组,循环遍历执行

```js
export function callHook(
  vm: Component,
  hook: string,
  args?: any[],
  setContext = true
) {
  // #7573 disable dep collection when invoking lifecycle hooks
  pushTarget()
  const prev = currentInstance
  setContext && setCurrentInstance(vm)
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, args || null, vm, info)
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
  setContext && setCurrentInstance(prev)
  popTarget()
}
```

因为`mixins`,`extend`,等原因之前的属性合并时同名生命周期函数被放入一个数组中(这里的handlers是一个生命周期函数数组),然后通过循环的方式使用`invokeWithErrorHandling`调用  
内部源码实现

```js
res = args ? handler.apply(context, args) : handler.call(context)
```
