---
sidebar: [{ text: "foo", link: "/views/vue/baseindex" }]
---

# Vue

[vue3](https://cn.vuejs.org/)官方文档  
[vue2](https://v2.cn.vuejs.org/v2/guide/)官方文档

## 概念

### 虚拟 DOM ( vnode )

虚拟 DOM (Virtual DOM，简称 VDOM) 是一种编程概念，意为将目标所需的 UI 通过数据结构“虚拟”地表示出来，保存在内存中，然后将真实的 DOM 与之保持同步。

```js
const vnode = {
  type: "div",
  props: {
    id: "hello",
  },
  children: [
    /* 更多 vnode */
  ],
};
```

按照不同的类型区分为:

> 普通元素节点
> 组件元素节点
> 纯文本 vnode
> 注释 vnode

本质上虚拟 DOM 就是一个 javaScript 数据对象
虚拟 DOM 是数据, 真实 DOM 是显示结果,通过虚拟 DOM 去驱动真实 DOM, 这就是数据驱动

一个运行时渲染器将会遍历整个虚拟 DOM 树，并据此构建真实的 DOM 树。这个过程被称为挂载 (mount)。

如果我们有两份虚拟 DOM 树，渲染器将会有比较地遍历它们，找出它们之间的区别，并应用这其中的变化到真实的 DOM 上。这个过程被称为更新 (patch)，又被称为“比对”(diffing) 或“协调”(reconciliation)。

## vue3 源码调试

1. 下载源码
2. pnpm 安装依赖包
3. 运行项目
   ```js
   npm run dev -s
   // -s 是为了生成source map 文件,更清晰调试
   ```
   运行成功会提示  
   ` watching: packages/vue/dist/vue.global.js`
4. 运行测试用例
   vue3 测试用例在 vue 文件夹下,也可以自己添加测试文件
   通过`npm run serve`启动测试服务器打开对应测试文件即可
5. 添加 VS Code 调试
   点击左侧调试按钮
   点击 `Open 'launch.json'`添加调试文件
   打开调试文件后添加调试配置,将上面的测试服务器地址添加到配置的 url 上

## 编译系统

## 渲染系统

创建和渲染`vnode`过程

1. `ensureRenderer() => createRenderer() => baseCreateRenderer()`创建 renderer 对象, 调用对象内部函数`createApp`创建 app 对象
2. 重写 mount 函数,用户调用
3. 当 mount 运行时,进行最终挂载时会调用原来的 `mount`函数进行真正的挂载,创建`vnode`就是在这里进行
4. `createVNode() => render() => patch() = >processComponent => mountComponent()`

## vue 响应式原理

### vue2 响应式

依靠 `Object.defineProperty()` 将对象的属性转换为`get/set`方式,在属性被修改或者调用时通知变更

> 由于 JavaScript 的限制，Vue 不能检测数组和对象的变化。  
> 对象的属性添加和属性删除  
> 数组通过索引下标进行的操作,和数组通过.length 进行的操作

解决方案

```js
// 添加属性
Vue.set(object, propertyName, value);
// 或
this.$set(this.someObject, "b", 2);
// 删除属性
Vue.delete(target, propertyName / index);
// 数组可以通过splice方法修改length,或进行下标操作
vm.items.splice(newLength);
```

由于 Vue 不允许动态添加根级响应式 property，所以必须在初始化实例前声明所有根级响应式 property，哪怕只是一个空值
如果未在 data 选项中声明 message，Vue 将警告渲染函数正在试图访问不存在的 property

### vue3 响应式

通过`Proxy`的方式代理目标实现了响应式

注意! Proxy API 并不能深层次监听对象内部变化
vue3 通过 get 中递归的方式进行响应式
