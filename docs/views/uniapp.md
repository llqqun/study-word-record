# 跨端应用

## 微信小程序样式隔离

组件样式隔离设置
```js
options: {
    styleIsolation: 'isolated' // apply-shared shared
  }
```
- isolated 表示启用样式隔离，在自定义组件内外，使用 class 指定的样式将不会相互影响（一般情况下的默认值）；
- apply-shared 表示页面 wxss 样式将影响到自定义组件，但自定义组件 wxss 中指定的样式不会影响页面；
- shared 表示页面 wxss 样式将影响到自定义组件，自定义组件 wxss 中指定的样式也会影响页面和其他设置了 apply-shared 或 shared 的自定义组件。（这个选项在插件中不可用。）

注意: 当自定义组件设置为apply-shared时, 组件内调用其他组件,当前组件内样式不能影响其他自定义组件,此时需要到页面wxss内去定义样式

