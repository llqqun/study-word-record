# 动态组件&异步组件

## 动态组件声明  
> 渲染一个“元组件”为动态组件。依 is 的值，来决定哪个组件被渲染  
属性
* is - string | ComponentDefinition | ComponentConstructor
* inline-template - boolean  

```js
<!-- 动态组件由 vm 实例的 `componentId` property 控制 -->
<component :is="componentId"></component>

<!-- 也能够渲染注册过的组件或 prop 传入的组件 -->
<component :is="$options.components.child"></component>
```

这里`componentId`的值可以是组件的名称,也可以是一个组件对象.

## 异步组件  
> 当需要用到时,才会进行加载的组件
```js
<component :is="'async-webpack-example'"></component>

Vue.component(
  'async-webpack-example',
  // 这个动态导入会返回一个 `Promise` 对象。
  () => import('./my-async-component')
)
```

## 高级异步组件声明定义  

```js
<component :is="AsyncComponent"></component>

const AsyncComponent = () => ({
  // 需要加载的组件 (应该是一个 `Promise` 对象)
  component: import('./MyComponent.vue'),
  // 异步组件加载时使用的组件
  loading: LoadingComponent,
  // 加载失败时使用的组件
  error: ErrorComponent,
  // 展示加载时组件的延时时间。默认值是 200 (毫秒)
  delay: 200,
  // 如果提供了超时时间且组件加载也超时了，
  // 则使用加载失败时使用的组件。默认值是：`Infinity`
  timeout: 3000
})
```

## 给异步组件添加事件监听器  

```js
// template
<component ref='asyncCom' :is="AsyncComponent"></component>

// js
this.$refs.asyncCom.on('evenName', () => {}) //绑定
this.$refs.asyncCom.off('evenName', () => {}) //解除绑定
```

> 因为异步组件有个加载的过程,所以`this.$refs.asyncCom`马上获取会是个null值  
> 看高级组件的定义可知,异步组件有个200ms的默认延迟,所以使用时可以考虑用延时函数执行